#!/usr/bin/env node
/**
 * post-build.js
 *
 * After `medusa build`, the output lives in .medusa/server/.
 * medusa build generates its own package.json there — we must NOT overwrite it.
 * We DO copy the lockfile (pnpm-lock.yaml) so pnpm can resolve exact versions.
 * Then we install production deps inside .medusa/server/.
 */
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const medusaServerDir = path.resolve(__dirname, "../../../.medusa/server");
const sourceDir = path.resolve(__dirname, "../../..");

if (!fs.existsSync(medusaServerDir)) {
  console.error("ERROR: .medusa/server directory not found after build");
  process.exit(1);
}

// Log what medusa build generated
const generatedPkg = path.join(medusaServerDir, "package.json");
if (fs.existsSync(generatedPkg)) {
  const pkg = JSON.parse(fs.readFileSync(generatedPkg, "utf-8"));
  console.log(`Generated package.json: ${pkg.name || "(unnamed)"}`);
  console.log(`Dependencies: ${Object.keys(pkg.dependencies || {}).length}`);
  console.log(`Scripts: ${Object.keys(pkg.scripts || {}).join(", ")}`);
}

// Copy ONLY the lockfile — medusa build already generates its own package.json
const lockSource = path.join(sourceDir, "pnpm-lock.yaml");
const lockDest = path.join(medusaServerDir, "pnpm-lock.yaml");
if (fs.existsSync(lockSource) && !fs.existsSync(lockDest)) {
  fs.copyFileSync(lockSource, lockDest);
  console.log("Copied pnpm-lock.yaml to .medusa/server/");
} else if (!fs.existsSync(lockSource)) {
  console.log("WARNING: No pnpm-lock.yaml found in source — pnpm will resolve fresh");
}

// If no package.json was generated (edge case), fall back to source
if (!fs.existsSync(generatedPkg)) {
  console.log("WARNING: No package.json generated — copying from source");
  const srcPkg = path.join(sourceDir, "package.json");
  if (fs.existsSync(srcPkg)) {
    fs.copyFileSync(srcPkg, generatedPkg);
  }
}

// Install production dependencies with retry logic
console.log("Installing production dependencies in .medusa/server/...");
const MAX_RETRIES = 3;
for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
  try {
    execSync("cd " + medusaServerDir + " && pnpm install --prod --no-fund --no-audit", {
      stdio: "inherit",
    });
    console.log("Production dependencies installed successfully");
    process.exit(0);
  } catch (error) {
    console.error(`Attempt ${attempt}/${MAX_RETRIES} failed:`, error.message);
    if (attempt < MAX_RETRIES) {
      console.log(`Retrying in 30s...`);
      execSync("sleep 30");
    }
  }
}

console.error("Failed to install production deps after all retries");
console.log("Continuing without prod deps in .medusa/server/...");
