import { execFileSync } from "node:child_process";

const stagedFiles = execFileSync(
  "git",
  ["diff", "--cached", "--name-only", "--diff-filter=ACMR", "-z"],
  { encoding: "utf8" },
)
  .split("\0")
  .filter((file) => file && !file.startsWith("data/"));

if (!stagedFiles.length) {
  console.log("No staged files to check.");
  process.exit(0);
}

console.log(`Checking ${stagedFiles.length} staged file(s)...`);
execFileSync(
  "pnpm",
  ["exec", "prettier", "--check", "--ignore-unknown", ...stagedFiles],
  { stdio: "inherit" },
);
