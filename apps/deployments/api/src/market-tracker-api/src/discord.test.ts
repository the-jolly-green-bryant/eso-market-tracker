import { describe, expect, it, vi } from "vitest";
import {
  DiscordMarketLookup,
  discordHealth,
  discordInteractions,
  handleDiscordInteraction,
  verifyDiscordRequest,
} from "./discord";

const market = {
  searchChoices: vi.fn(async () => [{ name: "Dreugh Wax" }]),
  searchResults: vi.fn(async () => [
    {
      item: {
        description: "Improve quality from purple to gold.",
        internalId: 1393740546,
        name: "Dreugh Wax",
      },
      pricing: {
        "xbox-na": {
          "--": {
            "--": {
              average: 2865,
              commonQuantity: 8,
              date: "2026-03-29",
              maximum: 3500,
              minimum: 2600,
            },
          },
        },
      },
    },
  ]),
} satisfies DiscordMarketLookup;

describe("Discord webhook security", () => {
  it("accepts signed Discord webhook requests", async () => {
    const keys = (await crypto.subtle.generateKey({ name: "Ed25519" }, true, [
      "sign",
      "verify",
    ])) as CryptoKeyPair;
    const publicKey = new Uint8Array(
      await crypto.subtle.exportKey("raw", keys.publicKey),
    );
    const body = JSON.stringify({ type: 1 });
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signature = new Uint8Array(
      await crypto.subtle.sign(
        { name: "Ed25519" },
        keys.privateKey,
        new TextEncoder().encode(`${timestamp}${body}`),
      ),
    );
    const toHex = (bytes: Uint8Array) =>
      [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");

    const response = await discordInteractions(
      new Request("https://data.esomarkettracker.com/discord/interactions", {
        method: "POST",
        body,
        headers: {
          "x-signature-ed25519": toHex(signature),
          "x-signature-timestamp": timestamp,
        },
      }),
      toHex(publicKey),
      market,
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ type: 1 });
  });

  it("rejects a valid signature after the replay window", async () => {
    const keys = (await crypto.subtle.generateKey({ name: "Ed25519" }, true, [
      "sign",
      "verify",
    ])) as CryptoKeyPair;
    const publicKey = new Uint8Array(
      await crypto.subtle.exportKey("raw", keys.publicKey),
    );
    const body = JSON.stringify({ type: 1 });
    const timestamp = "1700000000";
    const signature = new Uint8Array(
      await crypto.subtle.sign(
        { name: "Ed25519" },
        keys.privateKey,
        new TextEncoder().encode(`${timestamp}${body}`),
      ),
    );
    const toHex = (bytes: Uint8Array) =>
      [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");

    expect(
      await verifyDiscordRequest(
        toHex(publicKey),
        toHex(signature),
        timestamp,
        body,
        1_700_001_000_000,
      ),
    ).toBe(false);
  });
});

describe("Discord interactions", () => {
  it("acknowledges Discord endpoint verification", async () => {
    const response = await handleDiscordInteraction({ type: 1 }, market);
    expect(await response.json()).toEqual({ type: 1 });
  });

  it("returns item autocomplete choices", async () => {
    const response = await handleDiscordInteraction(
      {
        type: 4,
        data: {
          name: "pricecheck",
          options: [{ name: "item", type: 3, value: "dreugh" }],
        },
      },
      market,
    );

    expect(await response.json()).toMatchObject({
      type: 8,
      data: {
        choices: [{ name: "Dreugh Wax", value: "Dreugh Wax" }],
      },
    });
  });

  it("returns a branded multi-platform price embed", async () => {
    const response = await handleDiscordInteraction(
      {
        type: 2,
        data: {
          name: "pricecheck",
          options: [{ name: "item", type: 3, value: "Dreugh Wax" }],
        },
      },
      market,
    );
    const body = (await response.json()) as {
      data: {
        embeds: {
          fields: { name: string; value: string }[];
          footer: { text: string };
          title: string;
        }[];
      };
    };

    expect(body.data.embeds[0]).toMatchObject({
      title: "Dreugh Wax",
      footer: {
        text: "ESO Market Tracker · Public console market intelligence",
      },
    });
    expect(body.data.embeds[0].fields[0].value).toContain("2,865 🪙");
    expect(body.data.embeds[0].fields).toHaveLength(4);
  });
});

describe("Discord interaction failures", () => {
  it("returns a private retry message when market data is unavailable", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const failingMarket = {
      searchChoices: vi.fn(async () => []),
      searchResults: vi.fn(async () => {
        throw new Error("KV unavailable");
      }),
    } satisfies DiscordMarketLookup;

    const response = await handleDiscordInteraction(
      {
        type: 2,
        data: {
          name: "pricecheck",
          options: [{ name: "item", type: 3, value: "Dreugh Wax" }],
        },
      },
      failingMarket,
    );

    expect(await response.json()).toMatchObject({
      type: 4,
      data: {
        content:
          "Market data is temporarily unavailable. Please try again in a moment.",
        flags: 64,
      },
    });
    errorSpy.mockRestore();
  });
});

describe("Discord health", () => {
  it("reports the configured application and command surface", async () => {
    const response = discordHealth(
      "1121195192066781305",
      "928ea6e2a1141717429317cb2f655f4543ec2ac4d027429cea1240d40de2de62",
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      ok: true,
      service: "eso-market-tracker-discord",
      applicationId: "1121195192066781305",
      commands: ["pricecheck"],
      interactionsEndpoint:
        "https://data.esomarkettracker.com/discord/interactions",
    });
  });
});
