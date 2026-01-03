import { copyFileSync } from "fs";
import path from "path";

const src = path.resolve("client", "dist", "index.html");
const dst = path.resolve("client", "dist", "404.html");

try {
  copyFileSync(src, dst);
  console.log(`Copied ${src} -> ${dst}`);
} catch (err) {
  console.error(`Failed to copy index.html to 404.html: ${err.message}`);
  process.exit(1);
}
