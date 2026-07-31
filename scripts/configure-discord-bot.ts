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
const BOT_TERMS_URL = "https://esomarkettracker.com/terms-and-conditions";
const BOT_PRIVACY_URL = "https://esomarkettracker.com/privacy-policy";
const ICON_PATH = path.resolve(
  "apps/deployments/website/public/assets/icons/icon-512.png",
);
const COVER_PATH = path.resolve(
  "apps/deployments/website/public/assets/images/discord-cover.png",
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
  bot_public?: boolean;
  bot_require_code_grant?: boolean;
  cover_image: string | null;
  description: string;
  icon: string | null;
  id: string;
  install_params?: {
    permissions: string;
    scopes: string[];
  };
  interactions_endpoint_url?: string;
  privacy_policy_url?: string;
  tags?: string[];
  terms_of_service_url?: string;
};

type DiscordUser = {
  avatar: string | null;
  banner: string | null;
  username: string;
};

type DiscordCommand = {
  description: string;
  id: string;
  name: string;
};

type DiscordHealth = {
  applicationId: string;
  commands: string[];
  ok: boolean;
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
    bot_public: true,
    bot_require_code_grant: false,
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
  if (current.terms_of_service_url !== BOT_TERMS_URL) {
    update.terms_of_service_url = BOT_TERMS_URL;
  }
  if (current.privacy_policy_url !== BOT_PRIVACY_URL) {
    update.privacy_policy_url = BOT_PRIVACY_URL;
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
  const configured = await discord<DiscordCommand[]>(
    `/applications/${applicationId}/commands`,
    {
      method: "PUT",
      body: JSON.stringify(COMMANDS),
    },
  );
  const expectedNames = COMMANDS.map(({ name }) => name).sort((left, right) =>
    left.localeCompare(right),
  );
  const configuredNames = configured
    .map(({ name }) => name)
    .sort((left, right) => left.localeCompare(right));
  if (configuredNames.join("|") !== expectedNames.join("|")) {
    throw new Error(
      `Discord command verification failed: expected ${expectedNames.join(", ")}, received ${configuredNames.join(", ")}.`,
    );
  }
};

const verifyDiscordProfile = async () => {
  const [application, bot] = await Promise.all([
    discord<DiscordApplication>("/applications/@me"),
    discord<DiscordUser>("/users/@me"),
  ]);
  if (
    application.id !== applicationId ||
    application.description !== BOT_DESCRIPTION ||
    application.interactions_endpoint_url !== interactionsEndpoint ||
    application.terms_of_service_url !== BOT_TERMS_URL ||
    application.privacy_policy_url !== BOT_PRIVACY_URL ||
    application.bot_public !== true ||
    application.bot_require_code_grant !== false ||
    application.install_params?.permissions !== "0" ||
    application.install_params?.scopes.join("|") !== "applications.commands" ||
    !sameTags(application.tags, BOT_TAGS) ||
    bot.username !== BOT_NAME
  ) {
    throw new Error("Discord application profile verification failed.");
  }
};

const verifyRuntime = async () => {
  const response = await fetch(
    "https://data.esomarkettracker.com/discord/health",
    {
      headers: { accept: "application/json" },
    },
  );
  if (!response.ok) {
    throw new Error(
      `Discord runtime health check failed (${response.status}): ${await response.text()}`,
    );
  }
  const health = (await response.json()) as DiscordHealth;
  const expectedNames = COMMANDS.map(({ name }) => name).sort((left, right) =>
    left.localeCompare(right),
  );
  if (
    !health.ok ||
    health.applicationId !== applicationId ||
    health.commands
      .sort((left, right) => left.localeCompare(right))
      .join("|") !== expectedNames.join("|")
  ) {
    throw new Error(
      `Discord runtime is misconfigured: ${JSON.stringify(health)}`,
    );
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
  await verifyDiscordProfile();
  await verifyRuntime();

  const commandNames = COMMANDS.map((command) => `/${command.name}`).join(", ");
  console.log(`Configured ${BOT_NAME}: ${commandNames}`);
};

await main();
