#!/usr/bin/env tsx
/**
 * Setup script for Typesense collection configuration
 * Run with: npx tsx scripts/setup-typesense.ts
 */

import { configureTypesenseCollection } from "../lib/typesense/client";

async function main() {
  console.log("Configuring Typesense collection...");

  try {
    await configureTypesenseCollection();
    console.log("✅ Typesense collection configured successfully!");
  } catch (error) {
    console.error("❌ Error configuring Typesense:", error);
    process.exit(1);
  }
}

main();
