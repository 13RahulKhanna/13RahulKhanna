#!/usr/bin/env node
// Renders a real LeetCode contest-rating history as a self-built SVG line
// chart — same GraphQL query personal-vault's coding-profiles route already
// uses, just pointed at a scheduled GitHub Action instead of a live page.
// No third-party LeetCode-card service involved.

const USERNAME = "1rahulkhanna";
const INDIGO = "#818cf8";
const PURPLE = "#c084fc";

async function gql(query, variables) {
  const res = await fetch("https://leetcode.com/graphql", {
    method: "POST",
    headers: { "Content-Type": "application/json", Referer: "https://leetcode.com" },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error(`LeetCode API failed: ${res.status}`);
  return res.json();
}

async function main() {
  const [statsRes, contestRes] = await Promise.all([
    gql(
      `query userStats($username: String!) {
        matchedUser(username: $username) {
          submitStatsGlobal { acSubmissionNum { difficulty count } }
        }
      }`,
      { username: USERNAME }
    ),
    gql(
      `query userContest($username: String!) {
        userContestRankingHistory(username: $username) {
          attended
          rating
          ranking
          contest { title startTime }
        }
      }`,
      { username: USERNAME }
    ),
  ]);

  const nums = statsRes.data?.matchedUser?.submitStatsGlobal?.acSubmissionNum ?? [];
  const totalSolved = nums.find((n) => n.difficulty === "All")?.count ?? 0;

  const history = (contestRes.data?.userContestRankingHistory ?? [])
    .filter((r) => r.attended)
    .sort((a, b) => a.contest.startTime - b.contest.startTime);

  if (history.length === 0) throw new Error("No attended contests found");

  const ratings = history.map((r) => r.rating);
  const minRating = Math.min(...ratings);
  const maxRating = Math.max(...ratings);
  const current = ratings.at(-1);
  const peakIdx = ratings.indexOf(maxRating);

  const WIDTH = 900;
  const HEIGHT = 340;
  const PAD_L = 56;
  const PAD_R = 32;
  const PAD_T = 88;
  const PAD_B = 40;
  const plotW = WIDTH - PAD_L - PAD_R;
  const plotH = HEIGHT - PAD_T - PAD_B;

  const yMin = Math.floor((minRating - 60) / 100) * 100;
  const yMax = Math.ceil((maxRating + 60) / 100) * 100;

  const xFor = (i) => PAD_L + (i / (history.length - 1)) * plotW;
  const yFor = (v) => PAD_T + plotH - ((v - yMin) / (yMax - yMin)) * plotH;

  const linePoints = history.map((r, i) => `${xFor(i).toFixed(1)},${yFor(r.rating).toFixed(1)}`);
  const linePath = "M " + linePoints.join(" L ");
  const areaPath =
    `M ${xFor(0).toFixed(1)},${yFor(yMin).toFixed(1)} L ` +
    linePoints.join(" L ") +
    ` L ${xFor(history.length - 1).toFixed(1)},${yFor(yMin).toFixed(1)} Z`;

  const gridLines = [];
  for (let v = yMin; v <= yMax; v += 200) {
    const y = yFor(v);
    gridLines.push(
      `<line x1="${PAD_L}" y1="${y.toFixed(1)}" x2="${WIDTH - PAD_R}" y2="${y.toFixed(1)}" stroke="rgba(255,255,255,0.06)" />`,
      `<text x="${PAD_L - 10}" y="${(y + 4).toFixed(1)}" text-anchor="end" font-size="11" fill="rgba(255,255,255,0.35)" font-family="'Fira Code', monospace">${v}</text>`
    );
  }

  const peakX = xFor(peakIdx);
  const peakY = yFor(maxRating);

  const svg = `<svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="lcTitleGrad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${INDIGO}" />
      <stop offset="1" stop-color="${PURPLE}" />
    </linearGradient>
    <linearGradient id="lcAreaGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${PURPLE}" stop-opacity="0.35" />
      <stop offset="1" stop-color="${PURPLE}" stop-opacity="0" />
    </linearGradient>
    <linearGradient id="lcLineGrad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${INDIGO}" />
      <stop offset="1" stop-color="${PURPLE}" />
    </linearGradient>
  </defs>

  <rect x="0" y="0" width="${WIDTH}" height="${HEIGHT}" rx="16" fill="#05050a" />

  <text x="32" y="38" font-size="22" font-weight="700" fill="url(#lcTitleGrad)" font-family="'Segoe UI', sans-serif">
    LeetCode Contest Rating
  </text>
  <text x="32" y="62" font-size="13" fill="rgba(255,255,255,0.45)" font-family="'Segoe UI', sans-serif">
    ${history.length} rated contests &#183; ${totalSolved} problems solved &#183; @${USERNAME}
  </text>

  <text x="${WIDTH - 32}" y="38" text-anchor="end" font-size="30" font-weight="700" fill="#ffffff" font-family="'Segoe UI', sans-serif">
    ${current.toFixed(0)}
  </text>
  <text x="${WIDTH - 32}" y="60" text-anchor="end" font-size="12" fill="${PURPLE}" font-family="'Segoe UI', sans-serif">
    peak ${maxRating.toFixed(0)}
  </text>

  ${gridLines.join("\n  ")}

  <path d="${areaPath}" fill="url(#lcAreaGrad)" />
  <path d="${linePath}" fill="none" stroke="url(#lcLineGrad)" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round" />

  <circle cx="${peakX.toFixed(1)}" cy="${peakY.toFixed(1)}" r="8" fill="${PURPLE}" opacity="0.25">
    <animate attributeName="r" values="6;11;6" dur="2.2s" repeatCount="indefinite" />
    <animate attributeName="opacity" values="0.3;0.08;0.3" dur="2.2s" repeatCount="indefinite" />
  </circle>
  <circle cx="${peakX.toFixed(1)}" cy="${peakY.toFixed(1)}" r="3.5" fill="#ffffff" />

  <circle cx="${xFor(history.length - 1).toFixed(1)}" cy="${yFor(current).toFixed(1)}" r="4" fill="${INDIGO}" />

  <rect x="0.5" y="0.5" width="${WIDTH - 1}" height="${HEIGHT - 1}" rx="16" fill="none" stroke="rgba(129,140,248,0.25)" />
</svg>
`;

  const fs = await import("node:fs/promises");
  await fs.mkdir("assets", { recursive: true });
  await fs.writeFile("assets/leetcode-chart.svg", svg);
  console.log(`wrote assets/leetcode-chart.svg (current=${current.toFixed(0)}, peak=${maxRating.toFixed(0)}, contests=${history.length})`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
