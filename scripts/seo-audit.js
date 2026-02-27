#!/usr/bin/env node
/**
 * SEO Audit Script for Danke TV
 *
 * Run: node scripts/seo-audit.js
 *
 * Checks all HTML files for SEO best practices and outputs a report.
 * Future agents should run this after any content changes and fix reported issues.
 */

import fs from "fs";
import path from "path";

const ROOT = path.resolve(import.meta.dirname, "..");
const issues = [];
const passes = [];

function check(condition, pass, fail, file) {
  if (condition) {
    passes.push(`✅ ${pass}${file ? ` (${file})` : ""}`);
  } else {
    issues.push(`❌ ${fail}${file ? ` (${file})` : ""}`);
  }
}

function findHtmlFiles(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.name === "node_modules" || entry.name === ".git") continue;
    if (entry.isDirectory()) findHtmlFiles(full, files);
    else if (entry.name.endsWith(".html")) files.push(full);
  }
  return files;
}

// ---- Global checks ----
check(fs.existsSync(path.join(ROOT, "robots.txt")), "robots.txt exists", "Missing robots.txt");
check(fs.existsSync(path.join(ROOT, "sitemap.xml")), "sitemap.xml exists", "Missing sitemap.xml");

const sitemap = fs.existsSync(path.join(ROOT, "sitemap.xml"))
  ? fs.readFileSync(path.join(ROOT, "sitemap.xml"), "utf8")
  : "";

// ---- Per-page checks ----
const htmlFiles = findHtmlFiles(ROOT);

for (const file of htmlFiles) {
  const rel = path.relative(ROOT, file);
  const html = fs.readFileSync(file, "utf8");

  // Title
  const titleMatch = html.match(/<title>([^<]+)<\/title>/);
  check(titleMatch, `Has <title>`, `Missing <title> tag`, rel);
  if (titleMatch) {
    const titleLen = titleMatch[1].length;
    check(titleLen >= 30 && titleLen <= 70, `Title length OK (${titleLen} chars)`, `Title too ${titleLen < 30 ? "short" : "long"} (${titleLen} chars, aim 30-70)`, rel);
  }

  // Meta description
  const descMatch = html.match(/<meta\s+name="description"\s+content="([^"]+)"/);
  check(descMatch, `Has meta description`, `Missing meta description`, rel);
  if (descMatch) {
    const descLen = descMatch[1].length;
    check(descLen >= 100 && descLen <= 160, `Description length OK (${descLen} chars)`, `Description ${descLen < 100 ? "too short" : "too long"} (${descLen} chars, aim 100-160)`, rel);
  }

  // Canonical
  check(html.includes('rel="canonical"'), `Has canonical URL`, `Missing canonical URL`, rel);

  // OG tags
  check(html.includes('og:title'), `Has og:title`, `Missing og:title`, rel);
  check(html.includes('og:description'), `Has og:description`, `Missing og:description`, rel);

  // H1
  const h1Count = (html.match(/<h1[\s>]/g) || []).length;
  check(h1Count === 1, `Has exactly 1 <h1>`, `Has ${h1Count} <h1> tags (should be 1)`, rel);

  // Structured data
  check(html.includes("application/ld+json"), `Has structured data (JSON-LD)`, `Missing structured data`, rel);

  // Keywords meta
  const hasKeywords = html.includes('name="keywords"');

  // Check sitemap includes this page
  if (sitemap && rel !== "index.html") {
    const slug = rel.replace(/\\/g, "/");
    const inSitemap = sitemap.includes(slug) || sitemap.includes(rel);
    if (!inSitemap && !rel.includes("index")) {
      issues.push(`⚠️  Page not in sitemap.xml (${rel})`);
    }
  }

  // Image alt text
  const imgs = html.match(/<img\b[^>]*>/g) || [];
  for (const img of imgs) {
    if (!img.includes("alt=")) {
      issues.push(`⚠️  Image missing alt attribute (${rel})`);
    }
  }
}

// ---- Report ----
console.log("\n📊 SEO Audit Report — Danke TV");
console.log("═".repeat(50));
console.log(`\nScanned ${htmlFiles.length} HTML files\n`);

if (passes.length) {
  console.log("PASSES:");
  passes.forEach((p) => console.log("  " + p));
}

if (issues.length) {
  console.log("\nISSUES TO FIX:");
  issues.forEach((i) => console.log("  " + i));
} else {
  console.log("\n🎉 No issues found! SEO looks great.");
}

console.log(`\nScore: ${passes.length}/${passes.length + issues.length} checks passed`);
console.log("═".repeat(50));

process.exit(issues.filter((i) => i.startsWith("❌")).length > 0 ? 1 : 0);
