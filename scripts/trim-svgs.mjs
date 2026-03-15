/**
 * Trim folder SVGs: parse path data to find actual content bounding box,
 * then adjust viewBox / width / height to tightly fit the content.
 *
 * Structure of each SVG (exported from tldraw):
 *   <svg viewBox="Ox Oy W H" width="W" height="H">
 *     <g transform="matrix(1,0,0,1, Ox, Oy)">
 *       <g transform="scale(S, S)">
 *         <!-- paths with local coordinates -->
 *       </g>
 *     </g>
 *   </svg>
 *
 * Approach:
 *   1. Parse all path `d` attrs → find local bounding box [minX, minY, maxX, maxY]
 *   2. Rewrite viewBox to tightly wrap content with small padding
 *   3. Keep transforms intact, just shrink the visible viewport
 */

import { readFileSync, writeFileSync, readdirSync } from "fs";
import { join } from "path";

const PADDING = 4; // local-space padding around content
const SVG_DIR = join(
  import.meta.dirname,
  "../client/public/assets/workspace"
);

// ── Path data parser (absolute coords only for bbox) ──────────────────────
function extractBBox(pathD) {
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  let cx = 0,
    cy = 0; // current point
  let startX = 0,
    startY = 0; // for Z command

  const update = (x, y) => {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  };

  // Tokenize: split into commands and numbers
  const tokens = pathD.match(/[a-zA-Z]|[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?/g);
  if (!tokens) return null;

  let i = 0;
  const num = () => parseFloat(tokens[i++]);
  const peek = () => tokens[i];
  const isNum = () =>
    i < tokens.length && /^[-+.\d]/.test(tokens[i]);

  while (i < tokens.length) {
    const cmd = tokens[i];
    if (/[a-zA-Z]/.test(cmd)) {
      i++;
    } else {
      // implicit repeat of last command
      continue;
    }

    const repeat = () => isNum();

    switch (cmd) {
      case "M":
        while (repeat()) { cx = num(); cy = num(); update(cx, cy); startX = cx; startY = cy; }
        break;
      case "m":
        while (repeat()) { cx += num(); cy += num(); update(cx, cy); startX = cx; startY = cy; }
        break;
      case "L":
        while (repeat()) { cx = num(); cy = num(); update(cx, cy); }
        break;
      case "l":
        while (repeat()) { cx += num(); cy += num(); update(cx, cy); }
        break;
      case "H":
        while (repeat()) { cx = num(); update(cx, cy); }
        break;
      case "h":
        while (repeat()) { cx += num(); update(cx, cy); }
        break;
      case "V":
        while (repeat()) { cy = num(); update(cx, cy); }
        break;
      case "v":
        while (repeat()) { cy += num(); update(cx, cy); }
        break;
      case "C":
        while (repeat()) {
          const x1 = num(), y1 = num(), x2 = num(), y2 = num(), x = num(), y = num();
          update(x1, y1); update(x2, y2); update(x, y);
          cx = x; cy = y;
        }
        break;
      case "c":
        while (repeat()) {
          const dx1 = num(), dy1 = num(), dx2 = num(), dy2 = num(), dx = num(), dy = num();
          update(cx + dx1, cy + dy1); update(cx + dx2, cy + dy2);
          cx += dx; cy += dy; update(cx, cy);
        }
        break;
      case "S":
        while (repeat()) {
          const x2 = num(), y2 = num(), x = num(), y = num();
          update(x2, y2); update(x, y);
          cx = x; cy = y;
        }
        break;
      case "s":
        while (repeat()) {
          const dx2 = num(), dy2 = num(), dx = num(), dy = num();
          update(cx + dx2, cy + dy2);
          cx += dx; cy += dy; update(cx, cy);
        }
        break;
      case "Q":
        while (repeat()) {
          const x1 = num(), y1 = num(), x = num(), y = num();
          update(x1, y1); update(x, y);
          cx = x; cy = y;
        }
        break;
      case "q":
        while (repeat()) {
          const dx1 = num(), dy1 = num(), dx = num(), dy = num();
          update(cx + dx1, cy + dy1);
          cx += dx; cy += dy; update(cx, cy);
        }
        break;
      case "T":
        while (repeat()) { cx = num(); cy = num(); update(cx, cy); }
        break;
      case "t":
        while (repeat()) { cx += num(); cy += num(); update(cx, cy); }
        break;
      case "A":
        while (repeat()) {
          num(); num(); num(); num(); num(); // rx ry rotation large-arc sweep
          cx = num(); cy = num(); update(cx, cy);
        }
        break;
      case "a":
        while (repeat()) {
          num(); num(); num(); num(); num();
          cx += num(); cy += num(); update(cx, cy);
        }
        break;
      case "Z":
      case "z":
        cx = startX; cy = startY;
        break;
      default:
        // skip unknown
        break;
    }
  }

  if (minX === Infinity) return null;
  return { minX, minY, maxX, maxY };
}

// ── Main ──────────────────────────────────────────────────────────────────

const files = readdirSync(SVG_DIR).filter(
  (f) => f.startsWith("folder-") && f.endsWith(".svg")
);

console.log(`Found ${files.length} folder SVGs to trim\n`);

for (const file of files) {
  const filePath = join(SVG_DIR, file);
  let svg = readFileSync(filePath, "utf-8");

  // Extract current viewBox
  const vbMatch = svg.match(/viewBox="([^"]+)"/);
  if (!vbMatch) { console.log(`${file}: no viewBox, skipping`); continue; }
  const [vbX, vbY, vbW, vbH] = vbMatch[1].split(/\s+/).map(Number);

  // Extract scale from inner <g transform="scale(...)">
  const scaleMatch = svg.match(/scale\(([^,)]+),?\s*([^)]*)\)/);
  const scale = scaleMatch ? parseFloat(scaleMatch[1]) : 1;

  // Extract translate from outer <g transform="matrix(1, 0, 0, 1, Tx, Ty)">
  const matrixMatch = svg.match(/matrix\(1,\s*0,\s*0,\s*1,\s*([^,]+),\s*([^)]+)\)/);
  // Also handle matrix with rotation (folder-req has slight rotation)
  const matrixMatch2 = svg.match(/matrix\(([^,]+),\s*([^,]+),\s*([^,]+),\s*([^,]+),\s*([^,]+),\s*([^)]+)\)/);

  // Find all path d attributes and compute combined bbox
  const pathDAttrs = [...svg.matchAll(/\bd="([^"]+)"/g)].map((m) => m[1]);
  if (pathDAttrs.length === 0) { console.log(`${file}: no paths, skipping`); continue; }

  let globalMin = { x: Infinity, y: Infinity };
  let globalMax = { x: -Infinity, y: -Infinity };

  for (const d of pathDAttrs) {
    const bbox = extractBBox(d);
    if (!bbox) continue;
    if (bbox.minX < globalMin.x) globalMin.x = bbox.minX;
    if (bbox.minY < globalMin.y) globalMin.y = bbox.minY;
    if (bbox.maxX > globalMax.x) globalMax.x = bbox.maxX;
    if (bbox.maxY > globalMax.y) globalMax.y = bbox.maxY;
  }

  if (globalMin.x === Infinity) { console.log(`${file}: empty bbox, skipping`); continue; }

  // Add padding in local space
  const padMinX = globalMin.x - PADDING;
  const padMinY = globalMin.y - PADDING;
  const padMaxX = globalMax.x + PADDING;
  const padMaxY = globalMax.y + PADDING;

  // Convert to viewBox coordinates: vbCoord = translateOffset + localCoord * scale
  const tx = matrixMatch ? parseFloat(matrixMatch[1]) : (matrixMatch2 ? parseFloat(matrixMatch2[5]) : vbX);
  const ty = matrixMatch ? parseFloat(matrixMatch[2]) : (matrixMatch2 ? parseFloat(matrixMatch2[6]) : vbY);

  const newVbX = tx + padMinX * scale;
  const newVbY = ty + padMinY * scale;
  const newVbW = (padMaxX - padMinX) * scale;
  const newVbH = (padMaxY - padMinY) * scale;

  // Before/after comparison
  const oldArea = vbW * vbH;
  const newArea = newVbW * newVbH;
  const reduction = ((1 - newArea / oldArea) * 100).toFixed(1);

  console.log(`${file}:`);
  console.log(`  Local bbox: [${globalMin.x.toFixed(1)}, ${globalMin.y.toFixed(1)}] → [${globalMax.x.toFixed(1)}, ${globalMax.y.toFixed(1)}]`);
  console.log(`  Scale: ${scale.toFixed(4)}, Translate: (${tx.toFixed(1)}, ${ty.toFixed(1)})`);
  console.log(`  viewBox: ${vbW.toFixed(0)}×${vbH.toFixed(0)} → ${newVbW.toFixed(0)}×${newVbH.toFixed(0)}  (−${reduction}%)`);

  // Replace viewBox, width, height
  svg = svg.replace(/viewBox="[^"]+"/,  `viewBox="${newVbX} ${newVbY} ${newVbW} ${newVbH}"`);
  svg = svg.replace(/width="[^"]+"/,    `width="${newVbW}"`);
  svg = svg.replace(/height="[^"]+"/,   `height="${newVbH}"`);

  writeFileSync(filePath, svg, "utf-8");
  console.log(`  ✅ Saved\n`);
}

console.log("Done!");
