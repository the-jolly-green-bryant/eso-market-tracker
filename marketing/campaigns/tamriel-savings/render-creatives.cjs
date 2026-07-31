const fs = require("node:fs");
const path = require("node:path");
const sharp = require("sharp");

const campaignDirectory = __dirname;
const outputDirectory = path.join(campaignDirectory, "assets");
const logoPath = path.resolve(
  campaignDirectory,
  "../../../apps/deployments/website/public/assets/images/market-tracker-brand-gold.png",
);
const logo = fs.readFileSync(logoPath).toString("base64");

const escapeXml = (value) =>
  value.replaceAll("&", "&amp;").replaceAll("<", "&lt;");

const creative = ({
  width,
  height,
  logoX,
  logoY,
  logoWidth,
  logoHeight,
  headline,
  headlineX,
  headlineY,
  headlineSize,
  headlineAnchor = "start",
  subhead,
  subheadX,
  subheadY,
  subheadSize,
  subheadAnchor = "start",
  cta,
  ctaX,
  ctaY,
  ctaWidth,
  ctaHeight,
  ctaSize,
}) => {
  const chartBase = height * 0.75;
  const chartPoints = [
    [0, chartBase],
    [width * 0.12, chartBase - height * 0.05],
    [width * 0.22, chartBase + height * 0.02],
    [width * 0.34, chartBase - height * 0.12],
    [width * 0.45, chartBase - height * 0.08],
    [width * 0.58, chartBase - height * 0.22],
    [width * 0.7, chartBase - height * 0.18],
    [width * 0.82, chartBase - height * 0.33],
    [width, chartBase - height * 0.4],
  ]
    .map(([x, y]) => `${x},${y}`)
    .join(" ");

  return Buffer.from(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <defs>
        <radialGradient id="glow" cx="78%" cy="14%" r="92%">
          <stop offset="0%" stop-color="#19352a"/>
          <stop offset="46%" stop-color="#0b1718"/>
          <stop offset="100%" stop-color="#071012"/>
        </radialGradient>
        <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#f2cf72"/>
          <stop offset="100%" stop-color="#b67b22"/>
        </linearGradient>
        <linearGradient id="chart" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#58d38c" stop-opacity=".32"/>
          <stop offset="100%" stop-color="#58d38c" stop-opacity="0"/>
        </linearGradient>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="7" flood-color="#000" flood-opacity=".5"/>
        </filter>
        <clipPath id="frame">
          <rect x="0" y="0" width="${width}" height="${height}" rx="${Math.max(8, Math.round(Math.min(width, height) * 0.04))}"/>
        </clipPath>
      </defs>
      <g clip-path="url(#frame)">
        <rect width="${width}" height="${height}" fill="url(#glow)"/>
        <path d="M0 ${height} L0 ${chartBase} L${chartPoints.replaceAll(" ", " L")} L${width} ${height} Z" fill="url(#chart)" opacity=".75"/>
        <polyline points="${chartPoints}" fill="none" stroke="#58d38c" stroke-width="${Math.max(2, width / 430)}" opacity=".78"/>
        <circle cx="${width * 0.82}" cy="${chartBase - height * 0.33}" r="${Math.max(2, width / 240)}" fill="#f0c75e"/>
        <rect x="0" y="0" width="${width}" height="${height}" fill="none" stroke="#b9812e" stroke-opacity=".72" stroke-width="${Math.max(2, width / 500)}"/>
        <image href="data:image/png;base64,${logo}" x="${logoX}" y="${logoY}" width="${logoWidth}" height="${logoHeight}" preserveAspectRatio="xMidYMid meet"/>
        <text x="${headlineX}" y="${headlineY}" text-anchor="${headlineAnchor}" fill="#f7f2e8" font-family="Arial, Helvetica, sans-serif" font-size="${headlineSize}" font-weight="800" letter-spacing="-.5">${escapeXml(headline)}</text>
        <text x="${subheadX}" y="${subheadY}" text-anchor="${subheadAnchor}" fill="#b8c5c0" font-family="Arial, Helvetica, sans-serif" font-size="${subheadSize}" font-weight="500">${escapeXml(subhead)}</text>
        <g filter="url(#shadow)">
          <rect x="${ctaX}" y="${ctaY}" width="${ctaWidth}" height="${ctaHeight}" rx="${ctaHeight / 2}" fill="url(#gold)"/>
          <text x="${ctaX + ctaWidth / 2}" y="${ctaY + ctaHeight * 0.66}" text-anchor="middle" fill="#11100c" font-family="Arial, Helvetica, sans-serif" font-size="${ctaSize}" font-weight="900" letter-spacing=".4">${escapeXml(cta)}</text>
        </g>
      </g>
    </svg>
  `);
};

const creatives = [
  {
    filename: "emt-300x250.png",
    width: 300,
    height: 250,
    logoX: 21,
    logoY: 18,
    logoWidth: 120,
    logoHeight: 45,
    headline: "Know the real price.",
    headlineX: 21,
    headlineY: 101,
    headlineSize: 28,
    subhead: "Xbox + PlayStation market history",
    subheadX: 21,
    subheadY: 129,
    subheadSize: 13,
    cta: "CHECK ANY ESO ITEM  →",
    ctaX: 21,
    ctaY: 181,
    ctaWidth: 218,
    ctaHeight: 43,
    ctaSize: 13,
  },
  {
    filename: "emt-728x90.png",
    width: 728,
    height: 90,
    logoX: 18,
    logoY: 20,
    logoWidth: 125,
    logoHeight: 47,
    headline: "The definitive ESO price checker.",
    headlineX: 164,
    headlineY: 41,
    headlineSize: 24,
    subhead: "44,000+ items · Xbox + PlayStation",
    subheadX: 165,
    subheadY: 63,
    subheadSize: 13,
    cta: "CHECK PRICES  →",
    ctaX: 562,
    ctaY: 25,
    ctaWidth: 146,
    ctaHeight: 40,
    ctaSize: 12,
  },
  {
    filename: "emt-320x100.png",
    width: 320,
    height: 100,
    logoX: 12,
    logoY: 12,
    logoWidth: 84,
    logoHeight: 32,
    headline: "Know the real ESO price.",
    headlineX: 108,
    headlineY: 33,
    headlineSize: 16,
    subhead: "Xbox + PlayStation",
    subheadX: 108,
    subheadY: 53,
    subheadSize: 10,
    cta: "CHECK PRICES  →",
    ctaX: 108,
    ctaY: 64,
    ctaWidth: 130,
    ctaHeight: 27,
    ctaSize: 9,
  },
  {
    filename: "emt-160x600.png",
    width: 160,
    height: 600,
    logoX: 20,
    logoY: 38,
    logoWidth: 120,
    logoHeight: 45,
    headline: "KNOW THE",
    headlineX: 80,
    headlineY: 160,
    headlineSize: 24,
    headlineAnchor: "middle",
    subhead: "REAL ESO PRICE",
    subheadX: 80,
    subheadY: 193,
    subheadSize: 18,
    subheadAnchor: "middle",
    cta: "CHECK PRICES",
    ctaX: 16,
    ctaY: 500,
    ctaWidth: 128,
    ctaHeight: 44,
    ctaSize: 11,
  },
  {
    filename: "emt-1200x628.png",
    width: 1200,
    height: 628,
    logoX: 64,
    logoY: 56,
    logoWidth: 240,
    logoHeight: 90,
    headline: "Know what your loot is worth.",
    headlineX: 64,
    headlineY: 267,
    headlineSize: 64,
    subhead:
      "Current ESO prices, market history, and item traits across Xbox + PlayStation.",
    subheadX: 67,
    subheadY: 324,
    subheadSize: 25,
    cta: "CHECK ANY ESO ITEM  →",
    ctaX: 64,
    ctaY: 424,
    ctaWidth: 348,
    ctaHeight: 72,
    ctaSize: 21,
  },
  {
    filename: "emt-1200x1200.png",
    width: 1200,
    height: 1200,
    logoX: 72,
    logoY: 72,
    logoWidth: 300,
    logoHeight: 112,
    headline: "Know the real",
    headlineX: 72,
    headlineY: 386,
    headlineSize: 96,
    subhead: "ESO PRICE.",
    subheadX: 72,
    subheadY: 487,
    subheadSize: 86,
    cta: "CHECK ANY ESO ITEM  →",
    ctaX: 72,
    ctaY: 948,
    ctaWidth: 466,
    ctaHeight: 92,
    ctaSize: 28,
  },
];

fs.mkdirSync(outputDirectory, { recursive: true });

Promise.all(
  creatives.map(async (settings) => {
    const svg = creative(settings);
    const outputPath = path.join(outputDirectory, settings.filename);
    await sharp(svg).png({ compressionLevel: 9 }).toFile(outputPath);
    return outputPath;
  }),
)
  .then((paths) => {
    for (const outputPath of paths) {
      process.stdout.write(`${outputPath}\n`);
    }
  })
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
