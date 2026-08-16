#!/usr/bin/env node
// Rewrites the <!--NOW:START-->...<!--NOW:END--> block in README.md with a
// one-line summary of the most recent real public GitHub activity, pulled
// from the public Events API. Run on a schedule by a GitHub Action so the
// section stays true without manual edits — if there's nothing new to say,
// it changes nothing and the workflow's commit step is a no-op.

const USERNAME = "13RahulKhanna";
const TOKEN = process.env.GITHUB_TOKEN;

const TYPE_VERBS = {
  PushEvent: (e) => {
    const n = e.payload?.size ?? e.payload?.commits?.length ?? 1;
    const msg = e.payload?.commits?.at(-1)?.message?.split("\n")[0];
    const suffix = msg ? ` — "${truncate(msg, 60)}"` : "";
    return `pushed ${n} commit${n === 1 ? "" : "s"} to \`${shortRepo(e.repo.name)}\`${suffix}`;
  },
  CreateEvent: (e) => {
    const kind = e.payload?.ref_type ?? "repository";
    const ref = e.payload?.ref ? ` \`${e.payload.ref}\`` : "";
    return `created a ${kind}${ref} in \`${shortRepo(e.repo.name)}\``;
  },
  PullRequestEvent: (e) =>
    `${e.payload?.action ?? "updated"} a pull request in \`${shortRepo(e.repo.name)}\``,
  IssuesEvent: (e) =>
    `${e.payload?.action ?? "updated"} an issue in \`${shortRepo(e.repo.name)}\``,
  IssueCommentEvent: (e) => `commented in \`${shortRepo(e.repo.name)}\``,
  WatchEvent: (e) => `starred \`${shortRepo(e.repo.name)}\``,
  ForkEvent: (e) => `forked \`${shortRepo(e.repo.name)}\``,
  ReleaseEvent: (e) => `published a release in \`${shortRepo(e.repo.name)}\``,
  PublicEvent: (e) => `made \`${shortRepo(e.repo.name)}\` public`,
};

function shortRepo(fullName) {
  return fullName.split("/")[1] ?? fullName;
}

function truncate(s, n) {
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}

function timeAgo(iso) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

async function main() {
  const headers = { "User-Agent": "now-status-bot" };
  if (TOKEN) headers.Authorization = `Bearer ${TOKEN}`;

  const res = await fetch(`https://api.github.com/users/${USERNAME}/events/public?per_page=10`, {
    headers,
  });
  if (!res.ok) throw new Error(`Events API failed: ${res.status}`);
  const events = await res.json();

  const fs = await import("node:fs/promises");
  let summary;
  if (!Array.isArray(events) || events.length === 0) {
    summary = "No public activity yet — check back soon.";
  } else {
    const e = events[0];
    const verb = TYPE_VERBS[e.type];
    summary = verb
      ? `${verb(e)} · ${timeAgo(e.created_at)}`
      : `${e.type.replace("Event", "")} in \`${shortRepo(e.repo.name)}\` · ${timeAgo(e.created_at)}`;
  }

  const line = `🟢 **Right now:** ${summary}`;

  const readme = await fs.readFile("README.md", "utf8");
  const startTag = "<!--NOW:START-->";
  const endTag = "<!--NOW:END-->";
  const start = readme.indexOf(startTag);
  const end = readme.indexOf(endTag);
  if (start === -1 || end === -1) {
    throw new Error("NOW markers not found in README.md");
  }

  const before = readme.slice(0, start + startTag.length);
  const after = readme.slice(end);
  const updated = `${before}\n${line}\n${after}`;

  if (updated === readme) {
    console.log("No change — skipping write.");
    return;
  }
  await fs.writeFile("README.md", updated);
  console.log(`Updated NOW block: ${summary}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
