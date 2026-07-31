import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

const API_BASE = "https://discord.com/api/v10";
const DEFAULT_APPLICATION_ID = "1121195192066781305";
const DEFAULT_INTERACTIONS_ENDPOINT =
  "https://data.esomarkettracker.com/discord/interactions";
const BOT_NAME = "ESO Market Tracker";
const BOT_DESCRIPTION =
  "Definitive Elder Scrolls Online console price checks and market intelligence for Xbox and PlayStation.";
const BOT_TAGS = ["ESO", "Price Checker", "Market Data", "Xbox", "PlayStation"];
const ICON_PATH = path.resolve(
  "apps/deployments/website/public/assets/icons/icon-512.png",
);
const COVER_PATH = path.resolve(
  "apps/deployments/website/store/google-play/feature-graphic.png",
);

const COMMANDS = [
  {
    name: "pricecheck",
    type: 1,
    description: "Check the current console market price for an ESO item",
    integration_types: [0],
    contexts: [0, 1],
    options: [
      {
        name: "item",
        type: 3,
        description: "The Elder Scrolls Online item to look up",
        required: true,
        autocomplete: true,
      },
    ],
  },
];

type DiscordApplication = {
  cover_image: string | null;
  description: string;
  icon: string | null;
  id: string;
  interactions_endpoint_url?: string;
  tags?: string[];
};

type DiscordUser = {
  avatar: string | null;
  banner: string | null;
  username: string;
};

const token = process.env.DISCORD_BOT_TOKEN;
if (!token) {
  throw new Error(
    "DISCORD_BOT_TOKEN is required. Add the ESO Market Tracker bot token as a GitHub Actions secret.",
  );
}

const applicationId =
  process.env.DISCORD_APPLICATION_ID || DEFAULT_APPLICATION_ID;
const interactionsEndpoint =
  process.env.DISCORD_INTERACTIONS_ENDPOINT || DEFAULT_INTERACTIONS_ENDPOINT;

const discord = async <T>(
  route: string,
  init: RequestInit = {},
): Promise<T> => {
  const response = await fetch(`${API_BASE}${route}`, {
    ...init,
    headers: {
      authorization: `Bot ${token}`,
      "content-type": "application/json",
      ...init.headers,
    },
  });
  if (!response.ok) {
    throw new Error(
      `Discord ${init.method || "GET"} ${route} failed (${response.status}): ${await response.text()}`,
    );
  }
  return (await response.json()) as T;
};

const imageData = async (imagePath: string) => {
  const bytes = await fs.readFile(imagePath);
  return {
    dataUri: `data:image/png;base64,${bytes.toString("base64")}`,
    // Discord asset IDs use MD5 as a content identifier, not for security.
    // eslint-disable-next-line sonarjs/hashing
    hash: createHash("md5").update(bytes).digest("hex"),
  };
};

const sameTags = (left: string[] = [], right: string[] = []) =>
  [...left].sort((a, b) => a.localeCompare(b)).join("|") ===
  [...right].sort((a, b) => a.localeCompare(b)).join("|");

const configureApplication = async (
  icon: Awaited<ReturnType<typeof imageData>>,
  cover: Awaited<ReturnType<typeof imageData>>,
) => {
  const current = await discord<DiscordApplication>("/applications/@me");
  if (current.id !== applicationId) {
    throw new Error(
      `DISCORD_BOT_TOKEN belongs to application ${current.id}, expected ${applicationId}.`,
    );
  }

  const update: Record<string, unknown> = {
    install_params: {
      scopes: ["applications.commands"],
      permissions: "0",
    },
  };

  if (current.description !== BOT_DESCRIPTION) {
    update.description = BOT_DESCRIPTION;
  }
  if (current.interactions_endpoint_url !== interactionsEndpoint) {
    update.interactions_endpoint_url = interactionsEndpoint;
  }
  if (!sameTags(current.tags, BOT_TAGS)) {
    update.tags = BOT_TAGS;
  }
  if (current.icon?.replace(/^a_/, "") !== icon.hash) {
    update.icon = icon.dataUri;
  }
  if (current.cover_image?.replace(/^a_/, "") !== cover.hash) {
    update.cover_image = cover.dataUri;
  }

  await discord("/applications/@me", {
    method: "PATCH",
    body: JSON.stringify(update),
  });
};

const configureBotUser = async (
  icon: Awaited<ReturnType<typeof imageData>>,
  cover: Awaited<ReturnType<typeof imageData>>,
) => {
  const current = await discord<DiscordUser>("/users/@me");
  const update: Record<string, string> = {};
  if (current.username !== BOT_NAME) update.username = BOT_NAME;
  if (current.avatar?.replace(/^a_/, "") !== icon.hash) {
    update.avatar = icon.dataUri;
  }
  if (current.banner?.replace(/^a_/, "") !== cover.hash) {
    update.banner = cover.dataUri;
  }
  if (!Object.keys(update).length) return;

  await discord("/users/@me", {
    method: "PATCH",
    body: JSON.stringify(update),
  });
};

const registerCommands = async () => {
  for (const command of COMMANDS) {
    await discord(`/applications/${applicationId}/commands`, {
      method: "POST",
      body: JSON.stringify(command),
    });
  }
};

const main = async () => {
  const [icon, cover] = await Promise.all([
    imageData(ICON_PATH),
    imageData(COVER_PATH),
  ]);
  await configureApplication(icon, cover);
  await configureBotUser(icon, cover);
  await registerCommands();

  const commandNames = COMMANDS.map((command) => `/${command.name}`).join(", ");
  console.log(`Configured ${BOT_NAME}: ${commandNames}`);
};

await main();
