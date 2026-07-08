const fs = require("fs");
const path = require("path");

function copyDir(src, dest) {
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  for (const item of fs.readdirSync(src)) {
    const s = path.join(src, item);
    const d = path.join(dest, item);
    if (fs.statSync(s).isDirectory()) {
      copyDir(s, d);
    } else {
      fs.copyFileSync(s, d);
    }
  }
}

const src = path.resolve(__dirname, "assets");
const dest = path.resolve(__dirname, "dist", "assets");
console.log("Copying " + src + " -> " + dest);
copyDir(src, dest);
console.log("Done");