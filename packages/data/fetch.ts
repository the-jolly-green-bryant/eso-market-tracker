const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const isRetryableFetchError = (error: unknown): boolean => {
  if (!(error instanceof Error)) return false;

  const msg = error.message || "";
  if (msg.includes("fetch failed")) return true;

  const cause = (error as Error & { cause?: unknown }).cause;
  if (!cause || typeof cause !== "object") return false;

  const code = (cause as { code?: string }).code;
  if (
    code &&
    [
      "ETIMEDOUT",
      "EHOSTUNREACH",
      "ECONNRESET",
      "ECONNREFUSED",
      "ENOTFOUND",
      "EAI_AGAIN",
    ].includes(code)
  ) {
    return true;
  }

  const errors = (cause as { errors?: Array<{ code?: string }> }).errors;
  if (Array.isArray(errors)) {
    return errors.some(
      (e) =>
        e.code &&
        [
          "ETIMEDOUT",
          "EHOSTUNREACH",
          "ECONNRESET",
          "ECONNREFUSED",
          "ENOTFOUND",
          "EAI_AGAIN",
        ].includes(e.code),
    );
  }

  return false;
};

type FetchWithRetryOptions = RequestInit & {
  retries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  logger?: { warn: (msg: string) => void };
};

export const __fetchWithRetry = async (
  url: string,
  {
    retries = 4,
    baseDelayMs = 1000,
    maxDelayMs = 10_000,
    logger,
    ...init
  }: FetchWithRetryOptions = {},
): Promise<Response> => {
  let lastError: unknown;

  for (let attempt = 1; attempt <= retries + 1; attempt++) {
    try {
      const res = await fetch(url, init);

      // Optional: retry some server errors too
      if (res.status >= 500 || res.status === 429) {
        if (attempt <= retries) {
          const delay = Math.min(baseDelayMs * 2 ** (attempt - 1), maxDelayMs);
          const jitter = randomInt(250);
          logger?.warn(
            `Request failed with ${res.status} on attempt ${attempt}, retrying in ${delay + jitter}ms: ${url}`,
          );
          await sleep(delay + jitter);
          continue;
        }
      }

      return res;
    } catch (error) {
      lastError = error;

      if (!isRetryableFetchError(error) || attempt > retries) {
        throw error;
      }

      const delay = Math.min(baseDelayMs * 2 ** (attempt - 1), maxDelayMs);
      const jitter = randomInt(250);

      logger?.warn(
        `Network error on attempt ${attempt}, retrying in ${delay + jitter}ms: ${url}`,
      );

      await sleep(delay + jitter);
    }
  }

  throw lastError;
};
import { randomInt } from "node:crypto";
