const fs = require("fs");
const path = require("path");

const target = path.resolve(process.cwd(), ".next");

if (fs.existsSync(target)) {
  fs.rmSync(target, { recursive: true, force: true });
}
