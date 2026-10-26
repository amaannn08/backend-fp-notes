import fs from "node:fs";
import path from "node:path";
import { getSearchDocs } from "@/lib/content";

async function main() {
  const docs = await getSearchDocs();
  const outDir = path.join(process.cwd(), "public");
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, "search-index.json"), JSON.stringify(docs));
  console.log(`Wrote ${docs.length} search docs to public/search-index.json`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
