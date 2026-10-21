import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { isNew, type Job } from "@/data/jobs";
import { StatusLabel } from "@/components/StatusLabel";
import { fmtDay, usePostings } from "@/lib/postings";
import { isInactive, postingStatus, sortByStatus, todayET } from "@/lib/status";
import { BrandLockup } from "@/components/BrandLockup";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CBS Venture Capital Club Job Board" },
      { name: "description", content: "Daily-updated open VC, growth equity and CVC roles for Columbia Business School MBA students." },
      { property: "og:title", content: "CBS Venture Capital Club Job Board" },
      { property: "og:description", content: "Daily-updated open VC roles for Columbia MBA students." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Board,
});

const fmtDate = (d: string) =>
  d ? new Date(d + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "";

const uniq = (xs: string[]) => Array.from(new Set(xs.filter(Boolean))).sort();
const locBucket = (j: Job) => (j.nyc ? "New York" : !j.location ? "Unspecified" : /remote/i.test(j.location) ? "Remote" : "Other US");

function JobCard({ j }: { j: Job }) {
  const hl = j.nyc || j.mentionsMba;
  return (
    <article className={`rounded-lg border bg-card p-4 sm:p-5 ${hl ? "border-l-4 border-l-accent" : ""} ${isInactive(postingStatus(j, todayET())) ? "opacity-60" : ""}`}>
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-muted-foreground">{j.firm}</p>
          <h3 className="text-lg font-semibold leading-snug">{j.title}</h3>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <a href={j.url} target="_blank" rel="noopener noreferrer"
            className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90">
            Apply ↗
          </a>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5 text-xs">
        <StatusLabel p={j} />
        {j.nyc && <span className="rounded bg-highlight px-2 py-0.5 font-semibold text-highlight-foreground">NYC</span>}
        {j.mentionsMba && <span className="rounded bg-highlight px-2 py-0.5 font-semibold text-highlight-foreground">MBA</span>}
        {[j.roleType, j.firmType, j.focus].filter(Boolean).map((t) => (
          <span key={t} className="rounded bg-secondary px-2 py-0.5 text-secondary-foreground">{t}</span>
        ))}
      </div>
      <dl className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
        {j.location && <div><dt className="sr-only">Location</dt>{j.location}</div>}
        <div>Posted {fmtDate(j.datePosted)}</div>
        <div className="font-medium text-foreground">{j.rolling || !j.deadline ? "Rolling / no deadline" : `Deadline ${fmtDate(j.deadline)}`}</div>
        <div>Last verified {fmtDay(j.lastVerified)}</div>
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

function Board() {
  const [q, setQ] = useState("");
  const [role, setRole] = useState("");
  const [loc, setLoc] = useState("");
  const [firm, setFirm] = useState("");
  const [sector, setSector] = useState("");
  const [sort, setSort] = useState<"deadline" | "new" | "old">("deadline");
  const [hideExpired, setHideExpired] = useState(true);
  const { data: JOBS = [] } = usePostings();
  const today = todayET();

  const now = new Date();
  const fresh = JOBS.filter((j) => isNew(j, now) && !isInactive(postingStatus(j, today)));
  const lastVerified = JOBS.reduce((m, j) => (j.lastVerified > m ? j.lastVerified : m), "");
  const openCount = JOBS.filter((j) => !isInactive(postingStatus(j, today))).length;

  const list = useMemo(() => {
    const s = q.toLowerCase();
    const filtered = JOBS.filter((j) =>
      (!hideExpired || !isInactive(postingStatus(j, today))) &&
      (!role || j.roleType === role) && (!loc || locBucket(j) === loc) && (!firm || j.firmType === firm) &&
      (!sector || j.sectors.includes(sector)) &&
      (!s || [j.firm, j.title, j.location, j.focus].join(" ").toLowerCase().includes(s)),
    );
    const byDate = filtered.sort((a, b) => (sort === "old" ? a.datePosted.localeCompare(b.datePosted) : b.datePosted.localeCompare(a.datePosted)));
    if (sort === "deadline") return sortByStatus(byDate, today);
    // Date sorts still keep deadline-passed and expired postings at the bottom.
    return [...byDate.filter((j) => !isInactive(postingStatus(j, today))), ...byDate.filter((j) => isInactive(postingStatus(j, today)))];
  }, [JOBS, q, role, loc, firm, sector, sort, hideExpired, today]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:py-14">
      <header className="border-b pb-6">
        <div className="mb-4 flex flex-wrap items-center gap-4">
          <BrandLockup />
        </div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Columbia Business School · Venture Capital Club</p>
        <h1 className="mt-2 text-2xl font-bold text-primary sm:text-4xl sm:text-5xl"><span className="whitespace-nowrap">CBS Venture Capital Club</span> Job Board</h1>
        <p className="mt-3 text-sm text-muted-foreground">Last verified: {lastVerified ? fmtDay(lastVerified) : "—"} · {openCount} open postings</p>
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
            Sort
            <select value={sort} onChange={(e) => setSort(e.target.value as "deadline" | "new" | "old")}
              className="rounded-md border border-input bg-card px-2 py-2 text-sm text-foreground">
              <option value="deadline">Soonest deadline first</option>
              <option value="new">Newest posted first</option>
              <option value="old">Oldest posted first</option>
            </select>
          </label>
        </div>
        <label className="mt-3 flex items-center gap-2 text-sm">
          <input type="checkbox" checked={hideExpired} onChange={(e) => setHideExpired(e.target.checked)} className="h-4 w-4 accent-primary" />
          Hide expired postings
        </label>
        <p className="mt-2 text-xs text-muted-foreground">Accented cards are NYC roles or roles that explicitly mention MBA candidates.</p>
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
