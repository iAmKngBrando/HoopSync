#!/usr/bin/env node
// Merges an extracted dataset export (from scripts/export-dataset.sh) into this
// machine's local tagged dataset. Called by scripts/import-dataset.sh - see that
// for the CLI. New tags are appended (existing ones are never overwritten); new
// dataset examples are matched by their id (a UUID, so collisions aren't expected)
// and their image file is copied alongside the manifest entry.
"use strict";

const fs = require("node:fs");
const path = require("node:path");

const [, , importDir, captureDir] = process.argv;
if (!importDir || !captureDir) {
  console.error("usage: merge-dataset.cjs <importDir> <captureDir>");
  process.exit(1);
}

function readJson(filePath, fallback) {
  if (!fs.existsSync(filePath)) return fallback;
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

// --- tags ---

const localTagsPath = path.join(captureDir, "dataset-config", "tags.json");
const importedTagsPath = path.join(importDir, "tags.json");
const localTags = readJson(localTagsPath, []);
const importedTags = readJson(importedTagsPath, []);

const tagNames = new Set(localTags.map((t) => t.name));
const addedTags = [];
for (const tag of importedTags) {
  if (tagNames.has(tag.name)) continue;
  localTags.push(tag);
  tagNames.add(tag.name);
  addedTags.push(tag.name);
}
fs.mkdirSync(path.dirname(localTagsPath), { recursive: true });
fs.writeFileSync(localTagsPath, JSON.stringify(localTags, null, 2));

// --- dataset examples ---

const localManifestPath = path.join(captureDir, "capture-samples", "manifest.json");
const importedManifestPath = path.join(importDir, "capture-samples", "manifest.json");
const localManifest = readJson(localManifestPath, []);
const importedManifest = readJson(importedManifestPath, []);

const knownIds = new Set(localManifest.map((e) => e.id));
const byType = {};
let imported = 0;
let skippedMissingFile = 0;

for (const example of importedManifest) {
  if (knownIds.has(example.id)) continue;
  const src = path.join(importDir, "capture-samples", example.screenType, example.filename);
  if (!fs.existsSync(src)) {
    skippedMissingFile++;
    continue;
  }
  const destDir = path.join(captureDir, "capture-samples", example.screenType);
  fs.mkdirSync(destDir, { recursive: true });
  fs.copyFileSync(src, path.join(destDir, example.filename));
  localManifest.push(example);
  knownIds.add(example.id);
  byType[example.screenType] = (byType[example.screenType] || 0) + 1;
  imported++;
}
fs.mkdirSync(path.dirname(localManifestPath), { recursive: true });
fs.writeFileSync(localManifestPath, JSON.stringify(localManifest, null, 2));

// --- report ---

if (addedTags.length > 0) {
  console.log(`New tags added (${addedTags.length}): ${addedTags.join(", ")}`);
} else {
  console.log("New tags added: 0");
}
console.log();
console.log(`New dataset examples imported: ${imported} (of ${importedManifest.length} in the archive, ${importedManifest.length - imported - skippedMissingFile} already had locally)`);
for (const [type, n] of Object.entries(byType).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${String(n).padStart(4)}  ${type}`);
}
if (skippedMissingFile > 0) {
  console.log(`Skipped ${skippedMissingFile} example(s) whose image file wasn't in the archive.`);
}
console.log();
console.log(`Local dataset now: ${localManifest.length} examples, ${localTags.length} tags.`);
