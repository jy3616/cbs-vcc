import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { FallingLogos } from "@/components/FallingLogos";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { JOBS, LAST_UPDATED, isNew, type Job } from "@/data/jobs";
import { BrandLockup } from "@/components/BrandLockup";
import { supabase } from "@/integrations/supabase/client";
import { profileQuery, useApplications, useSessionUser, useToggleApplied } from "@/lib/applications";

export const Route = createFileRoute("/_authenticated/board")({
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

const updated = new Date(LAST_UPDATED).toLocaleString("en-US", {
  timeZone: "America/New_York", dateStyle: "long", timeStyle: "short",
});

const uniq = (xs: string[]) => Array.from(new Set(xs.filter(Boolean))).sort();
const locBucket = (j: Job) => (j.nyc ? "New York" : !j.location ? "Unspecified" : /remote/i.test(j.location) ? "Remote" : "Other US");

function JobCard({ j, applied, onToggle }: { j: Job; applied: boolean; onToggle: () => void }) {
  const hl = j.nyc || j.mentionsMba;
  return (
    <article className={`rounded-lg border bg-card p-4 sm:p-5 ${hl ? "border-l-4 border-l-accent" : ""}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-muted-foreground">{j.firm}</p>
          <h3 className="text-lg font-semibold leading-snug">{j.title}</h3>
        </div>
        <div className="flex shrink-0 gap-2">
          <button onClick={onToggle}
            className={`rounded-md border px-3 py-1.5 text-sm font-medium ${applied ? "border-accent bg-highlight text-highlight-foreground" : "border-input hover:bg-secondary"}`}>
            {applied ? "Applied ✓" : "Mark as applied"}
          </button>
          <a href={j.url} target="_blank" rel="noopener noreferrer"
            className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90">
            Apply ↗
          </a>
        </div>
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

function Board() {
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

  const [showLogos, setShowLogos] = useState(false);
  useEffect(() => {
    const key = "cbs-logo-shower-shown";
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    setShowLogos(true);
    const t = setTimeout(() => setShowLogos(false), 6500);
    return () => clearTimeout(t);
  }, []);
  const { user } = useSessionUser();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data: profile } = useQuery({ ...profileQuery(user?.id ?? ""), enabled: !!user });
  const { data: apps } = useApplications(user?.id);
  const toggle = useToggleApplied(user?.id);
  const appliedSet = new Set((apps ?? []).map((a) => a.job_url));
  const track = (j: Job) => {
    const applied = appliedSet.has(j.url);
    return () => toggle.mutate({ job: j, applied }, {
      onSuccess: () => toast.success(applied ? "Removed from your applications" : "Marked as applied"),
      onError: (e) => toast.error(e.message),
    });
  };

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:py-14">
      {showLogos && <FallingLogos />}
      <header className="border-b pb-6">
        <div className="mb-4 flex flex-wrap items-center gap-4">
          <BrandLockup />
          <nav className="ml-auto flex items-center gap-3 text-sm">
            <span className="text-muted-foreground">Hi, {profile?.display_name ?? user?.email}</span>
            <Link to="/my-applications" className="rounded-md border border-input px-3 py-1.5 font-medium hover:bg-secondary">
              My applications{apps?.length ? ` (${apps.length})` : ""}
            </Link>
            <button onClick={signOut} className="text-muted-foreground hover:underline">Sign out</button>
          </nav>
        </div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Columbia Business School · Venture Capital Club</p>
        <h1 className="mt-2 text-2xl font-bold text-primary sm:text-4xl sm:text-5xl"><span className="whitespace-nowrap">CBS Venture Capital Club</span> Job Board</h1>
        <p className="mt-3 text-sm text-muted-foreground">Last updated: {updated} ET · {JOBS.length} open postings</p>
      </header>

      <section className="mt-8">
        <h2 className="text-2xl font-semibold">New in the last 24 hours</h2>
        <div className="mt-4 space-y-3">
          {fresh.length ? fresh.map((j) => <JobCard key={j.url} j={j} applied={appliedSet.has(j.url)} onToggle={track(j)} />) :
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
              className="rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground">
              <option value="new">Newest first</option>
              <option value="old">Oldest first</option>
            </select>
          </label>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">Accented cards are NYC roles or roles that explicitly mention MBA candidates.</p>
        <div className="mt-4 space-y-3">
          {list.length ? list.map((j) => <JobCard key={j.url} j={j} applied={appliedSet.has(j.url)} onToggle={track(j)} />) :
            <p className="text-sm text-muted-foreground">No postings match these filters.</p>}
        </div>
      </section>

      <footer className="mt-14 border-t pt-6 text-sm text-muted-foreground">
        Postings are gathered from public sources and may change. Always confirm details on the firm's site. Also check CBS Career Management Center resources.
      </footer>
    </div>
  );
}
