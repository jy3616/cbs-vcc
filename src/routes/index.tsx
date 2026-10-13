import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { JOBS, LAST_UPDATED, isNew, type Job } from "@/data/jobs";
import cbsLogo from "@/assets/cbs-logo.svg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CBS Venture Capital Job Board" },
      { name: "description", content: "Daily-updated open VC, growth equity and CVC roles for Columbia Business School MBA students." },
      { property: "og:title", content: "CBS Venture Capital Job Board" },
      { property: "og:description", content: "Daily-updated open VC roles for Columbia MBA students." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

const fmtDate = (d: string) =>
  d ? new Date(d + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "";

const updated = new Date(LAST_UPDATED).toLocaleString("en-US", {
  timeZone: "America/New_York", dateStyle: "long", timeStyle: "short",
});

const uniq = (xs: string[]) => Array.from(new Set(xs.filter(Boolean))).sort();
const locBucket = (j: Job) => (j.nyc ? "New York" : !j.location ? "Unspecified" : /remote/i.test(j.location) ? "Remote" : "Other US");

function JobCard({ j }: { j: Job }) {
  const hl = j.nyc || j.mentionsMba;
  return (
    <article className={`rounded-lg border bg-card p-4 sm:p-5 ${hl ? "border-l-4 border-l-accent" : ""}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-muted-foreground">{j.firm}</p>
          <h3 className="text-lg font-semibold leading-snug">{j.title}</h3>
        </div>
        <a href={j.url} target="_blank" rel="noopener noreferrer"
          className="shrink-0 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90">
          Apply ↗
        </a>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5 text-xs">
        {j.nyc && <span className="rounded bg-highlight px-2 py-0.5 font-semibold text-highlight-foreground">NYC</span>}
        {j.mentionsMba && <span className="rounded bg-highlight px-2 py-0.5 font-semibold text-highlight-foreground">MBA</span>}
        {[j.roleType, j.firmType, j.focus].filter(Boolean).map((t) => (
          <span key={t} className="rounded bg-secondary px-2 py-0.5 text-secondary-foreground">{t}</span>
        ))}
      </div>
      <dl className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
        {j.location && <div><dt className="sr-only">Location</dt>{j.location}</div>}
        <div>Posted {fmtDate(j.datePosted)}</div>
        {j.deadline && <div className="font-medium text-foreground">Deadline {fmtDate(j.deadline)}</div>}
      </dl>
    </article>
  );
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
      {label}
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="rounded-md border border-input bg-card px-2 py-2 text-sm text-foreground">
        <option value="">All</option>
        {options.map((o) => <option key={o}>{o}</option>)}
      </select>
    </label>
  );
}

function Index() {
  const [q, setQ] = useState("");
  const [role, setRole] = useState("");
  const [loc, setLoc] = useState("");
  const [firm, setFirm] = useState("");
  const [sector, setSector] = useState("");
  const [sort, setSort] = useState<"new" | "old">("new");

  const now = new Date(LAST_UPDATED);
  const fresh = JOBS.filter((j) => isNew(j, now));

  const list = useMemo(() => {
    const s = q.toLowerCase();
    return JOBS.filter((j) =>
      (!role || j.roleType === role) && (!loc || locBucket(j) === loc) && (!firm || j.firmType === firm) &&
      (!sector || j.sectors.includes(sector)) &&
      (!s || [j.firm, j.title, j.location, j.focus].join(" ").toLowerCase().includes(s)),
    ).sort((a, b) => (sort === "new" ? b.datePosted.localeCompare(a.datePosted) : a.datePosted.localeCompare(b.datePosted)));
  }, [q, role, loc, firm, sector, sort]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:py-14">
      <header className="border-b pb-6">
        <img src={cbsLogo} alt="Columbia Business School logo" className="mb-4 h-16 w-16" />
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Columbia Business School</p>
        <h1 className="mt-2 text-4xl font-bold text-primary sm:text-5xl">CBS Venture Capital Job Board</h1>
        <p className="mt-3 text-sm text-muted-foreground">Last updated: {updated} ET · {JOBS.length} open postings</p>
      </header>

      <section className="mt-8">
        <h2 className="text-2xl font-semibold">New in the last 24 hours</h2>
        <div className="mt-4 space-y-3">
          {fresh.length ? fresh.map((j) => <JobCard key={j.url} j={j} />) :
            <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">No new postings in the last 24 hours.</p>}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold">All postings</h2>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-6">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search firm, title, sector…"
            className="col-span-2 self-end rounded-md border border-input bg-card px-3 py-2 text-sm sm:col-span-6" />
          <Select label="Role type" value={role} onChange={setRole} options={uniq(JOBS.map((j) => j.roleType))} />
          <Select label="Location" value={loc} onChange={setLoc} options={uniq(JOBS.map(locBucket))} />
          <Select label="Firm type" value={firm} onChange={setFirm} options={uniq(JOBS.map((j) => j.firmType))} />
          <Select label="Sector" value={sector} onChange={setSector} options={uniq(JOBS.flatMap((j) => j.sectors))} />
          <label className="col-span-2 flex flex-col gap-1 text-xs font-medium text-muted-foreground">
            Sort by date posted
            <select value={sort} onChange={(e) => setSort(e.target.value as "new" | "old")}
              className="rounded-md border border-input bg-card px-2 py-2 text-sm text-foreground">
              <option value="new">Newest first</option>
              <option value="old">Oldest first</option>
            </select>
          </label>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">Accented cards are NYC roles or roles that explicitly mention MBA candidates.</p>
        <div className="mt-4 space-y-3">
          {list.length ? list.map((j) => <JobCard key={j.url} j={j} />) :
            <p className="text-sm text-muted-foreground">No postings match these filters.</p>}
        </div>
      </section>

      <footer className="mt-14 border-t pt-6 text-sm text-muted-foreground">
        Postings are gathered from public sources and may change. Always confirm details on the firm's site. Also check CBS Career Management Center resources.
      </footer>
    </div>
  );
}
