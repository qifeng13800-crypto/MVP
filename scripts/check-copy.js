const fs = require("fs");
const path = require("path");

const blockedTerms = [
  [20080, 20837],
  [21334, 20986],
  [36319, 21333],
  [31934, 20934, 20449, 21495],
  [31934, 20934],
  [23454, 26102, 39044, 27979],
  [20080, 21334, 24314, 35758],
  [20080, 20837, 28857, 20301],
  [21334, 20986, 28857, 20301],
  [20570, 22810],
  [20570, 31354],
  [24196, 23478],
  [20027, 21147],
  [33258, 21160, 20132, 26131],
  [25910, 30410, 39044, 27979],
  [26292, 28072],
  [32763, 20493],
  [22871, 21033]
].map((codes) => String.fromCharCode(...codes));
const scanPaths = ["app", "components", "lib", "scripts", "README.md"];
const extensions = new Set([".ts", ".tsx", ".css", ".md"]);

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(fullPath);
    if (extensions.has(path.extname(entry.name))) return [fullPath];
    return [];
  });
}

const files = scanPaths.flatMap((scanPath) => {
  if (!fs.existsSync(scanPath)) return [];
  if (fs.statSync(scanPath).isDirectory()) return walk(scanPath);
  return extensions.has(path.extname(scanPath)) ? [scanPath] : [];
});

const hits = [];
for (const file of files) {
  const content = fs.readFileSync(file, "utf8");
  for (const term of blockedTerms) {
    if (content.includes(term)) {
      hits.push(`${file}: ${term}`);
    }
  }
}

if (hits.length > 0) {
  console.error("Found blocked copy:");
  console.error(hits.join("\n"));
  process.exit(1);
}

console.log("Copy check passed.");
