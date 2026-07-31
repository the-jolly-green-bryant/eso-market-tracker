const DISCORD_PING = 1;
const DISCORD_APPLICATION_COMMAND = 2;
const DISCORD_AUTOCOMPLETE = 4;
const DISCORD_MESSAGE_RESPONSE = 4;
const DISCORD_AUTOCOMPLETE_RESPONSE = 8;
const EPHEMERAL = 1 << 6;
const EMBED_COLOR = 0xd9ad5b;

type SearchChoice = {
  name: string;
};

type PricingPoint = {
  average?: number;
  commonQuantity?: number;
  date?: string;
  maximum?: number;
  minimum?: number;
  totalSales?: number;
};

type MarketResult = {
  item: {
    description?: string;
    internalId: number | string;
    name: string;
  };
  pricing: Record<
    string,
    Record<string, Record<string, PricingPoint | undefined> | undefined>
  >;
};

type DiscordOption = {
  focused?: boolean;
  name: string;
  type: number;
  value?: string;
};

type DiscordInteraction = {
  data?: {
    name?: string;
    options?: DiscordOption[];
  };
  type: number;
};

/** Market search operations used by the Discord interaction adapter. */
export type DiscordMarketLookup = {
  searchChoices: (term: string, limit: number) => Promise<SearchChoice[]>;
  searchResults: (term: string, limit: number) => Promise<MarketResult[]>;
};

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });

const hexToBytes = (value: string) => {
  const pairs = value.match(/.{1,2}/g);
  return new Uint8Array((pairs ?? []).map((pair) => Number.parseInt(pair, 16)));
};

export const verifyDiscordRequest = async (
  publicKey: string,
  signature: string,
  timestamp: string,
  body: string,
) => {
  if (
    !/^[a-f0-9]{64}$/i.test(publicKey) ||
    !/^[a-f0-9]{128}$/i.test(signature)
  ) {
    return false;
  }

  const key = await crypto.subtle.importKey(
    "raw",
    hexToBytes(publicKey),
    { name: "Ed25519" },
    false,
    ["verify"],
  );
  const message = new TextEncoder().encode(`${timestamp}${body}`);
  return crypto.subtle.verify(
    { name: "Ed25519" },
    key,
    hexToBytes(signature),
    message,
  );
};

const optionValue = (interaction: DiscordInteraction) =>
  interaction.data?.options
    ?.find((option) => option.name === "item")
    ?.value?.trim() ?? "";

const formatDate = (value?: string) => {
  if (!value) return "date unavailable";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
};

const formatPrice = (value: number) =>
  `${Math.round(value).toLocaleString()} 🪙`;

const flattenPricing = (
  platform?: Record<
    string,
    Record<string, PricingPoint | undefined> | undefined
  >,
) =>
  Object.values(platform ?? {})
    .flatMap((traits) => Object.values(traits ?? {}))
    .filter(
      (point): point is PricingPoint =>
        point !== undefined && Number.isFinite(point.average),
    );

const latestDate = (points: PricingPoint[]) =>
  points
    .map((point) => point.date)
    .filter((date): date is string => Boolean(date))
    .sort((left, right) => left.localeCompare(right))
    .at(-1);

const formatPlatformPricing = (points: PricingPoint[]) => {
  if (!points.length) return "No current observations";

  const minimum = Math.min(
    ...points.map((point) => point.minimum ?? point.average ?? 0),
  );
  const maximum = Math.max(
    ...points.map((point) => point.maximum ?? point.average ?? 0),
  );
  const observed = formatDate(latestDate(points));

  if (points.length === 1) {
    const point = points[0];
    const stack =
      point.commonQuantity && point.commonQuantity > 1
        ? ` · typical stack ${point.commonQuantity.toLocaleString()}`
        : "";
    return [
      `**${formatPrice(point.average ?? 0)} average**`,
      `${formatPrice(minimum)} – ${formatPrice(maximum)} range`,
      `Observed ${observed}${stack}`,
    ].join("\n");
  }

  return [
    `**${formatPrice(minimum)} – ${formatPrice(maximum)}**`,
    `${points.length.toLocaleString()} trait / quality variants`,
    `Latest observation ${observed}`,
  ].join("\n");
};

const PLATFORM_LABELS: Record<string, string> = {
  "xbox-na": "Xbox · North America",
  "xbox-eu": "Xbox · Europe",
  "ps-na": "PlayStation · North America",
  "ps-eu": "PlayStation · Europe",
};

const itemUrl = (name: string) =>
  `https://esomarkettracker.com/item/${encodeURIComponent(name)}`;

const marketEmbed = (result: MarketResult, requested: string) => {
  const fields = Object.entries(PLATFORM_LABELS).map(([platform, name]) => ({
    name,
    value: formatPlatformPricing(flattenPricing(result.pricing[platform])),
    inline: true,
  }));
  const exact = result.item.name.localeCompare(requested, undefined, {
    sensitivity: "base",
  });

  return {
    title: result.item.name,
    url: itemUrl(result.item.name),
    description: [
      result.item.description,
      exact === 0 ? undefined : `Closest match for “${requested}”.`,
    ]
      .filter(Boolean)
      .join("\n"),
    color: EMBED_COLOR,
    fields,
    footer: {
      text: "ESO Market Tracker · Public console market intelligence",
    },
  };
};

const errorResponse = (message: string) =>
  json({
    type: DISCORD_MESSAGE_RESPONSE,
    data: {
      content: message,
      flags: EPHEMERAL,
    },
  });

const autocompleteResponse = async (
  query: string,
  market: DiscordMarketLookup,
) => {
  const matches = query ? await market.searchChoices(query, 25) : [];
  return json({
    type: DISCORD_AUTOCOMPLETE_RESPONSE,
    data: {
      choices: matches.map(({ name }) => ({
        name: name.slice(0, 100),
        value: name.slice(0, 100),
      })),
    },
  });
};

const commandResponse = async (
  interaction: DiscordInteraction,
  market: DiscordMarketLookup,
) => {
  if (interaction.data?.name !== "pricecheck") {
    return errorResponse(
      "That command is not supported. Try `/pricecheck item:`.",
    );
  }

  const query = optionValue(interaction);
  if (!query) {
    return errorResponse("Choose an item to price check.");
  }

  const [result] = await market.searchResults(query, 1);
  return result
    ? json({
        type: DISCORD_MESSAGE_RESPONSE,
        data: {
          embeds: [marketEmbed(result, query)],
          allowed_mentions: { parse: [] },
        },
      })
    : errorResponse(
        `I could not find “${query}”. Try a full item name, such as Dreugh Wax.`,
      );
};

export const handleDiscordInteraction = async (
  interaction: DiscordInteraction,
  market: DiscordMarketLookup,
) => {
  if (interaction.type === DISCORD_PING) {
    return json({ type: DISCORD_PING });
  }
  if (interaction.type === DISCORD_AUTOCOMPLETE) {
    return autocompleteResponse(optionValue(interaction), market);
  }
  if (interaction.type === DISCORD_APPLICATION_COMMAND) {
    return commandResponse(interaction, market);
  }
  return errorResponse("Unsupported Discord interaction.");
};

export const discordInteractions = async (
  request: Request,
  publicKey: string,
  market: DiscordMarketLookup,
) => {
  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const signature = request.headers.get("x-signature-ed25519") ?? "";
  const timestamp = request.headers.get("x-signature-timestamp") ?? "";
  const body = await request.text();
  const verified = await verifyDiscordRequest(
    publicKey,
    signature,
    timestamp,
    body,
  ).catch(() => false);

  if (!verified) {
    return new Response("Invalid request signature", { status: 401 });
  }

  let interaction: DiscordInteraction;
  try {
    interaction = JSON.parse(body) as DiscordInteraction;
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  return handleDiscordInteraction(interaction, market);
};
