#!/usr/bin/env node
/**
 * Fails if the three message catalogs have drifted apart. A missing key only
 * shows up as a raw key string on screen, usually in the language nobody on
 * the team reads — so it gets caught here instead.
 *
 *   node scripts/check-i18n.mjs
 */
import fs from "node:fs";
import path from "node:path";

const LOCALES = ["fr", "ar", "en"];
const DIR = path.join(process.cwd(), "messages");

const flatten = (value, prefix = "") =>
  Object.entries(value).flatMap(([key, child]) =>
    child && typeof child === "object"
      ? flatten(child, `${prefix}${key}.`)
      : [`${prefix}${key}`],
  );

const catalogs = Object.fromEntries(
  LOCALES.map((locale) => [
    locale,
    flatten(JSON.parse(fs.readFileSync(path.join(DIR, `${locale}.json`), "utf8"))),
  ]),
);

const problems = new Set();
for (const source of LOCALES) {
  for (const target of LOCALES) {
    if (source === target) continue;
    for (const key of catalogs[source]) {
      if (!catalogs[target].includes(key)) {
        problems.add(`${target}.json is missing "${key}" (present in ${source}.json)`);
      }
    }
  }
}

for (const locale of LOCALES) {
  console.log(`${locale}: ${catalogs[locale].length} keys`);
}

if (problems.size > 0) {
  console.error(`\n${problems.size} problem(s):`);
  for (const problem of problems) console.error(`  - ${problem}`);
  process.exit(1);
}

console.log("\nAll catalogs in sync.");
