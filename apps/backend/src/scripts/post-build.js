#!/usr/bin/env node
/**
 * post-build.js
 *
 * After `medusa build`, the output lives in .medusa/server/.
 * medusa build generates its own package.json there — we must NOT overwrite it.
 * We DO copy the lockfile (pnpm-lock.yaml) so pnpm can resolve exact versions.
 * Then we install production deps inside .medusa/server/.
 *
 * Includes aggressive retry logic for rate-limited environments (Oracle Cloud).
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

// Copy lockfile if it exists — helps pnpm resolve exact versions
const lockSource = path.join(sourceDir, "pnpm-lock.yaml");
const lockDest = path.join(medusaServerDir, "pnpm-lock.yaml");
if (fs.existsSync(lockSource) && !fs.existsSync(lockDest)) {
  fs.copyFileSync(lockSource, lockDest);
  console.log("Copied pnpm-lock.yaml to .medusa/server/");
} else if (!fs.existsSync(lockSource)) {
  console.log("WARNING: No pnpm-lock.yaml found in source — pnpm will resolve fresh");
}

// Copy .npmrc for retry settings
const npmrcSource = path.join(sourceDir, ".npmrc");
const npmrcDest = path.join(medusaServerDir, ".npmrc");
if (fs.existsSync(npmrcSource) && !fs.existsSync(npmrcDest)) {
  fs.copyFileSync(npmrcSource, npmrcDest);
  console.log("Copied .npmrc to .medusa/server/");
}

// If no package.json was generated (edge case), fall back to source
if (!fs.existsSync(generatedPkg)) {
  console.log("WARNING: No package.json generated — copying from source");
  const srcPkg = path.join(sourceDir, "package.json");
  if (fs.existsSync(srcPkg)) {
    fs.copyFileSync(srcPkg, generatedPkg);
  }
}

// Install production dependencies with aggressive retry logic
// Oracle Cloud IPs are heavily rate-limited by npm registry
const PNPM_FLAGS = "--no-frozen-lockfile --prefer-offline --fetch-retries=10 --fetch-retry-mintimeout=120000 --fetch-retry-maxtimeout=600000 --network-concurrency=2 --fetch-retry-factor=2";
const MAX_RETRIES = 5;
const RETRY_DELAYS = [30, 60, 120, 300, 600]; // seconds: 30s, 1m, 2m, 5m, 10m

console.log("Installing production dependencies in .medusa/server/...");
for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
  try {
    console.log(`Attempt ${attempt}/${MAX_RETRIES}...`);
    execSync(`cd ${medusaServerDir} && pnpm install --prod ${PNPM_FLAGS}`, {
      stdio: "inherit",
      timeout: 600000, // 10 min timeout per attempt
    });
    console.log("Production dependencies installed successfully");
    process.exit(0);
  } catch (error) {
    console.error(`Attempt ${attempt}/${MAX_RETRIES} failed:`, error.message?.substring(0, 200));
    if (attempt < MAX_RETRIES) {
      const delay = RETRY_DELAYS[attempt - 1] || 600;
      console.log(`Retrying in ${delay}s (attempt ${attempt + 1}/${MAX_RETRIES})...`);
      execSync(`sleep ${delay}`);
    }
  }
}

console.error("Failed to install production deps after all retries");
console.log("Continuing without prod deps in .medusa/server/...");
