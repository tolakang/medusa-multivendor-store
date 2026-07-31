#!/usr/bin/env node
// post-build.js — copies lockfile into .medusa/server and installs prod deps with pnpm
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const medusaServerDir = path.resolve(__dirname, "../../../.medusa/server");

if (!fs.existsSync(medusaServerDir)) {
  console.error("ERROR: .medusa/server directory not found after build");
  process.exit(1);
}

const lockFiles = [
  { src: "pnpm-lock.yaml", dest: "pnpm-lock.yaml" },
  { src: "pnpm-workspace.yaml", dest: "pnpm-workspace.yaml" },
  { src: "package.json", dest: "package.json" },
];

for (const lock of lockFiles) {
  const srcPath = path.resolve(__dirname, "../../..", lock.src);
  const destPath = path.join(medusaServerDir, lock.dest);
  if (fs.existsSync(srcPath) && !fs.existsSync(destPath)) {
    fs.copyFileSync(srcPath, destPath);
    console.log(`Copied ${lock.src} to .medusa/server/`);
  }
}

console.log("Installing production dependencies in .medusa/server/...");
try {
  execSync("cd " + medusaServerDir + " && pnpm install --prod", {
    stdio: "inherit",
  });
  console.log("Production dependencies installed successfully");
} catch (error) {
  console.error("Failed to install production dependencies:", error.message);
  console.log("Continuing without prod deps in .medusa/server...");
}
