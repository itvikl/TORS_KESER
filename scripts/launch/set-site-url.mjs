#!/usr/bin/env node
/**
 * Switch NEXT_PUBLIC_SITE_URL in apphosting.yaml to the real domain, push, wait
 * for the App Hosting rollout, then run the launch check against production.
 *
 *   node scripts/launch/set-site-url.mjs                 # dry run: preconditions + the change, nothing written
 *   node scripts/launch/set-site-url.mjs --apply         # write, commit ONLY apphosting.yaml, push, wait, verify
 *   node scripts/launch/set-site-url.mjs --apply --revert   # put the hosted.app address back (rollback)
 *
 * Run it only after Firebase shows keshertours.com as Connected: the canonical
 * tags, sitemap and analytics all follow this value.
 * --force skips the "new site is answering on the domain" precondition.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { execFileSync, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const args = new Set(process.argv.slice(2));
const APPLY = args.has("--apply");
const REVERT = args.has("--revert");
const FORCE = args.has("--force");

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "../..");
const YAML = path.join(ROOT, "apphosting.yaml");
const PROD = "https://keshertours.com";
const STAGING = "https://mainprod--kesertors.us-east4.hosted.app";
const target = REVERT ? STAGING : PROD;

const git = (...a) => execFileSync("git", a, { cwd: ROOT, encoding: "utf8" }).trim();
const fail = (msg) => { console.error(`\n✖ ${msg}\n`); process.exit(1); };
const ok = (msg) => console.log(`✔ ${msg}`);

console.log(`\nSet NEXT_PUBLIC_SITE_URL → ${target}  (${APPLY ? "APPLY" : "dry run"})\n`);

// ---- the change
const raw = readFileSync(YAML, "utf8");
const pattern = /(- variable: NEXT_PUBLIC_SITE_URL\r?\n\s+value: )(\S+)/;
const match = raw.match(pattern);
if (!match) fail("Could not find the NEXT_PUBLIC_SITE_URL entry in apphosting.yaml.");
const current = match[2];
if (current === target) { ok(`Already ${target} — nothing to change.`); process.exit(0); }
console.log(`  apphosting.yaml: ${current}\n               →   ${target}\n`);

// ---- preconditions
if (!REVERT) {
  const home = await fetch(`${PROD}/`, { redirect: "follow", signal: AbortSignal.timeout(30000), headers: { "user-agent": "Mozilla/5.0" } })
    .then(async (r) => ({ status: r.status, body: await r.text() }))
    .catch((e) => ({ status: 0, body: "", error: String(e.cause?.code ?? e.message) }));
  const isNew = home.status === 200 && home.body.includes("/_next/") && !home.body.includes("wp-content");
  if (isNew) ok(`${PROD} is answering with the new site.`);
  else if (FORCE) console.log(`! ${PROD} is not serving the new site yet (status ${home.status}) — continuing because of --force.`);
  else fail(`${PROD} is not serving the new site yet (status ${home.status}${home.body.includes("wp-content") ? ", still the old WordPress site" : ""}).\n  Finish the Firebase domain connection first, wait for "Connected", then run this again.`);
}
if (git("rev-parse", "--abbrev-ref", "HEAD") !== "main") fail("Not on the main branch.");
git("fetch", "origin", "main");
if (git("rev-list", "--count", "HEAD..origin/main") !== "0") fail("Local main is behind origin/main — pull first.");
ok("On main and up to date with origin.");
const others = git("status", "--porcelain").split("\n").filter((l) => l && !l.includes("apphosting.yaml"));
if (others.length) console.log(`! ${others.length} other uncommitted file(s) are in your working tree; they will NOT be committed.`);

if (!APPLY) {
  console.log("\nDry run only. Add --apply to write, commit, push and verify.\n");
  process.exit(0);
}

// ---- apply
writeFileSync(YAML, raw.replace(pattern, `$1${target}`));
ok("apphosting.yaml updated.");
const message = REVERT
  ? "revert(launch): point NEXT_PUBLIC_SITE_URL back at the hosted.app address"
  : "feat(launch): NEXT_PUBLIC_SITE_URL is now https://keshertours.com";
// `-- apphosting.yaml` commits that file alone, whatever else is modified or staged.
git("commit", "-m", `${message}\n\nCo-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`, "--", "apphosting.yaml");
const sha = git("rev-parse", "HEAD");
git("push", "origin", "main");
ok(`Pushed ${sha.slice(0, 7)} to main — App Hosting rollout started.`);

// ---- wait for the rollout
const repo = git("remote", "get-url", "origin").match(/github\.com[:/](.+?)(?:\.git)?$/)?.[1];
let done = null;
for (let i = 0; i < 45 && repo; i++) {
  const out = spawnSync("gh", ["api", `repos/${repo}/commits/${sha}/check-runs`, "--jq", '.check_runs[] | select(.name|test("Rollout")) | "\\(.status) \\(.conclusion // "-")"'], { encoding: "utf8" }).stdout.trim();
  if (out.startsWith("completed")) { done = out; break; }
  process.stdout.write(i === 0 ? "  waiting for the rollout" : ".");
  await new Promise((r) => setTimeout(r, 20000));
}
console.log();
if (!done) fail("Rollout did not report completion in 15 minutes — check the Firebase console (and run the launch check by hand).");
if (!done.endsWith("success")) fail(`Rollout finished with: ${done}. Re-run with --apply --revert to roll the setting back.`);
ok("Rollout succeeded.");

// ---- verify
if (REVERT) process.exit(0);
console.log("\nRunning the production launch check…\n");
const check = spawnSync("node", [path.join(HERE, "check-launch.mjs"), PROD], { stdio: "inherit" });
if (check.status !== 0) console.log("\n✖ Launch check found failures. To go back: node scripts/launch/set-site-url.mjs --apply --revert\n");
process.exit(check.status ?? 1);
