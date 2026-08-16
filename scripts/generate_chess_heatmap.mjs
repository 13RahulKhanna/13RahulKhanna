#!/usr/bin/env node
// Renders the last 64 days of contribution activity as an 8x8 chessboard —
// each square gets a piece whose value scales with that day's contribution
// intensity (GitHub's own 0-4 level bucket, scraped from the public,
// unauthenticated contributions calendar endpoint — no token/scopes needed
// beyond what's required to commit the output back to this repo).
//
// pawn (level 1) < knight (level 2) < rook (level 3) < queen (level 4)
// the single busiest day in the window gets a king, regardless of level.

const USERNAME = "13RahulKhanna";
const URL = `https://github.com/users/${USERNAME}/contributions`;

const PIECES = { 0: null, 1: "♟", 2: "♞", 3: "♜", 4: "♛" };
const KING = "♚";
const OPACITY = { 0: 0, 1: 0.55, 2: 0.7, 3: 0.85, 4: 1 };

const DARK_SQUARE = "#12121c";
const LIGHT_SQUARE = "#1c1c30";
const INDIGO = "#818cf8";
const PURPLE = "#c084fc";

async function main() {
  const res = await fetch(URL, { headers: { "User-Agent": "Mozilla/5.0 (chess-heatmap-bot)" } });
  if (!res.ok) throw new Error(`Failed to fetch contributions: ${res.status}`);
  const html = await res.text();

  const cellRe = /data-date="(\d{4}-\d{2}-\d{2})"[^>]*data-level="(\d)"/g;
  const days = [];
  let m;
  while ((m = cellRe.exec(html))) {
    days.push({ date: m[1], level: Number(m[2]) });
  }
  if (days.length < 64) throw new Error(`Only found ${days.length} day cells, expected >= 64`);

  days.sort((a, b) => (a.date < b.date ? -1 : 1));
  const last64 = days.slice(-64);

  let peakIdx = 0;
  for (let i = 1; i < last64.length; i++) {
    if (last64[i].level > last64[peakIdx].level) peakIdx = i;
  }

  const CELL = 56;
  const PAD = 28;
  const BOARD = CELL * 8;
  const WIDTH = BOARD + PAD * 2;
  const HEIGHT = BOARD + PAD * 2 + 56;

  const squares = [];
  const pieces = [];
  last64.forEach((day, i) => {
    const row = Math.floor(i / 8);
    const col = i % 8;
    const x = PAD + col * CELL;
    const y = PAD + 56 + row * CELL;
    const isDark = (row + col) % 2 === 0;
    squares.push(
      `<rect x="${x}" y="${y}" width="${CELL}" height="${CELL}" fill="${isDark ? DARK_SQUARE : LIGHT_SQUARE}">` +
        `<title>${day.date}: contribution level ${day.level}</title></rect>`
    );

    const isPeak = i === peakIdx && last64[peakIdx].level > 0;
    const glyph = isPeak ? KING : PIECES[day.level];
    if (glyph) {
      const cx = x + CELL / 2;
      const cy = y + CELL / 2 + 8;
      const opacity = isPeak ? 1 : OPACITY[day.level];
      const fill = isPeak ? PURPLE : "#ffffff";
      const glow = isPeak
        ? `<circle cx="${cx}" cy="${y + CELL / 2}" r="${CELL / 2 - 4}" fill="${PURPLE}" opacity="0.18">` +
          `<animate attributeName="opacity" values="0.1;0.32;0.1" dur="2.4s" repeatCount="indefinite" /></circle>`
        : "";
      pieces.push(
        `${glow}<text x="${cx}" y="${cy}" text-anchor="middle" font-size="${CELL * 0.62}" ` +
          `fill="${fill}" opacity="${opacity}" font-family="'Segoe UI Symbol', 'Noto Sans Symbols', sans-serif">${glyph}</text>`
      );
    }
  });

  const legend = [0, 1, 2, 3, 4]
    .map((lvl, i) => {
      const x = PAD + i * 90;
      const glyph = PIECES[lvl] ?? "·";
      return `<text x="${x}" y="${HEIGHT - 6}" font-size="13" fill="rgba(255,255,255,0.45)" font-family="'Segoe UI', sans-serif">${glyph} lvl ${lvl}</text>`;
    })
    .join("");

  const svg = `<svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="titleGrad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${INDIGO}" />
      <stop offset="1" stop-color="${PURPLE}" />
    </linearGradient>
  </defs>
  <rect x="0" y="0" width="${WIDTH}" height="${HEIGHT}" rx="16" fill="#05050a" />
  <text x="${PAD}" y="34" font-size="20" font-weight="700" fill="url(#titleGrad)" font-family="'Segoe UI', sans-serif">
    Last 64 days, as chess
  </text>
  <text x="${WIDTH - PAD}" y="34" text-anchor="end" font-size="12" fill="rgba(255,255,255,0.35)" font-family="'Fira Code', monospace">
    ${last64[0].date} &#8594; ${last64[63].date}
  </text>
  ${squares.join("\n  ")}
  ${pieces.join("\n  ")}
  ${legend}
  <rect x="0.5" y="0.5" width="${WIDTH - 1}" height="${HEIGHT - 1}" rx="16" fill="none" stroke="rgba(129,140,248,0.25)" />
</svg>
`;

  const fs = await import("node:fs/promises");
  await fs.mkdir("assets", { recursive: true });
  await fs.writeFile("assets/chess-heatmap.svg", svg);
  console.log(`wrote assets/chess-heatmap.svg (${last64.length} days, peak=${last64[peakIdx].date})`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
