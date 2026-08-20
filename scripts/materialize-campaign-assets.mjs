import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

const root = process.cwd();
const chunksRoot = resolve(root, "asset-chunks");
const publicDir = resolve(root, "public");
const assets = [
  "market-installment-desktop",
  "market-installment-tablet",
  "market-installment-mobile",
  "market-gift-desktop",
  "market-gift-tablet",
  "market-gift-mobile",
  "market-sale-desktop",
  "market-sale-tablet",
  "market-sale-mobile",
  "market-address-desktop",
  "market-address-tablet",
  "market-address-mobile",
  "tehno-center-logo",
];

await mkdir(publicDir, { recursive: true });

for (const name of assets) {
  const dir = join(chunksRoot, name);
  const parts = (await readdir(dir))
    .filter((file) => file.endsWith(".txt"))
    .sort();

  if (!parts.length) throw new Error(`No asset chunks found for ${name}`);

  const encoded = (await Promise.all(parts.map((file) => readFile(join(dir, file), "utf8"))))
    .join("")
    .replace(/\s+/g, "");

  await writeFile(join(publicDir, `${name}.avif`), Buffer.from(encoded, "base64"));
}

console.log(`Materialized ${assets.length} responsive campaign assets.`);
