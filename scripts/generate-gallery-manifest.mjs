/**
 * Regenerates src/lib/gallery-manifest.ts from whatever is in public/uploads/gallery.
 *
 * The seed can't read that folder at runtime: on Vercel the function filesystem does
 * not reliably contain public/, so a directory scan there yields an empty gallery.
 * Committing the list keeps local and deployed databases seeding identically.
 *
 * Run after adding or removing photos:  npm run gallery:manifest
 */
import { readdir, writeFile } from "node:fs/promises";
import path from "node:path";

const DIR = "public/uploads/gallery";
const OUT = "src/lib/gallery-manifest.ts";

// Shown first: the story section renders gallery[0] in a 4:5 portrait frame.
const FIRST = "_MG_9204.webp";

const files = (await readdir(DIR))
  .filter((f) => /\.(webp|jpe?g|png)$/i.test(f))
  .sort();

const ordered = [
  ...files.filter((f) => f === FIRST),
  ...files.filter((f) => f !== FIRST),
];

const body = `// GENERATED FILE — do not edit by hand.
// Run \`npm run gallery:manifest\` after changing public/uploads/gallery.
export const GALLERY_IMAGES: string[] = [
${ordered.map((f) => `  ${JSON.stringify(`/uploads/gallery/${f}`)},`).join("\n")}
];
`;

await writeFile(path.normalize(OUT), body, "utf8");
console.log(`wrote ${OUT} with ${ordered.length} images`);
