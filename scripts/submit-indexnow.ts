import fs from "node:fs/promises";
import path from "node:path";

const HOST = "esomarkettracker.com";
const BASE_URL = `https://${HOST}`;
const KEY = "72db4adee52b7f66899913e2adfaa3dd";
const KEY_LOCATION = `${BASE_URL}/${KEY}.txt`;
const ENDPOINT = "https://api.indexnow.org/indexnow";
const MAX_URLS_PER_REQUEST = 10_000;
const MAX_SUBMIT_ATTEMPTS = 4;
const RETRY_BASE_DELAY_MS = 5_000;

const argumentValue = (name: string) => {
  const index = process.argv.indexOf(name);
  return index === -1 ? undefined : process.argv[index + 1];
};

const decodeXml = (value: string) =>
  value
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&apos;", "'");

const urlsFromSitemap = async (file: string) => {
  const xml = await fs.readFile(file, "utf8");
  return [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) =>
    decodeXml(match[1]),
  );
};

const listIndexPages = async (directory: string) => {
  const pages: string[] = [];

  const walk = async (current: string) => {
    for (const entry of await fs.readdir(current, { withFileTypes: true })) {
      const absolute = path.join(current, entry.name);
      if (entry.isDirectory()) {
        await walk(absolute);
      } else if (entry.name === "index.html") {
        pages.push(absolute);
      }
    }
  };

  await walk(directory);
  return pages;
};

const urlsFromPages = async (directory: string) => {
  const distRoot = path.resolve(directory, "..");
  return (await listIndexPages(directory)).map((file) => {
    const relative = path
      .relative(distRoot, file)
      .split(path.sep)
      .slice(0, -1)
      .join("/");
    return encodeURI(`${BASE_URL}/${relative}`);
  });
};

const submitBatch = async (urlList: string[], batchNumber: number) => {
  for (let attempt = 1; attempt <= MAX_SUBMIT_ATTEMPTS; attempt += 1) {
    const response = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        host: HOST,
        key: KEY,
        keyLocation: KEY_LOCATION,
        urlList,
      }),
    });
    const responseBody = await response.text();

    if ([200, 202].includes(response.status)) {
      console.log(
        `IndexNow accepted batch ${batchNumber} (${urlList.length.toLocaleString()} URLs, HTTP ${response.status}).`,
      );
      return;
    }

    const retryable =
      response.status === 429 ||
      response.status >= 500 ||
      (response.status === 403 &&
        responseBody.includes("SiteVerificationNotCompleted"));

    if (!retryable || attempt === MAX_SUBMIT_ATTEMPTS) {
      throw new Error(
        `IndexNow batch ${batchNumber} failed with HTTP ${response.status}: ${responseBody}`,
      );
    }

    const delay = RETRY_BASE_DELAY_MS * attempt;
    console.warn(
      `IndexNow batch ${batchNumber} attempt ${attempt} was not ready (HTTP ${response.status}); retrying in ${delay / 1_000}s.`,
    );
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
};

const sitemapFile = argumentValue("--sitemap");
const pagesDirectory = argumentValue("--pages");
const dryRun = process.argv.includes("--dry-run");

if (!sitemapFile && !pagesDirectory) {
  throw new Error("Pass either --sitemap <file> or --pages <directory>.");
}

const submittedUrls = sitemapFile
  ? await urlsFromSitemap(sitemapFile)
  : await urlsFromPages(pagesDirectory!);
const urls = [...new Set(submittedUrls)].filter((url) =>
  url.startsWith(`${BASE_URL}/`),
);

for (let offset = 0; offset < urls.length; offset += MAX_URLS_PER_REQUEST) {
  const batch = urls.slice(offset, offset + MAX_URLS_PER_REQUEST);
  const batchNumber = offset / MAX_URLS_PER_REQUEST + 1;
  if (dryRun) {
    console.log(
      `IndexNow dry run batch ${batchNumber} (${batch.length.toLocaleString()} URLs).`,
    );
  } else {
    await submitBatch(batch, batchNumber);
  }
}

console.log(
  `${dryRun ? "Validated" : "Submitted"} ${urls.length.toLocaleString()} unique URLs for IndexNow.`,
);
