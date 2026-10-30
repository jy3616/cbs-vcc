import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { isNew, type Job } from "@/data/jobs";
import { StatusLabel } from "@/components/StatusLabel";
import { fmtDay, postingsQuery, verificationQuery } from "@/lib/postings";
import { useSuspenseQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { isInactive, postingStatus, sortByStatus, todayET } from "@/lib/status";
import { BrandLockup } from "@/components/BrandLockup";
import { fitLabelFor, jobSlug } from "@/lib/fit";
import { useAnalyses } from "@/lib/resume-store";
import { useBookmarks } from "@/lib/bookmarks";
import { PostingExtras } from "@/components/PostingExtras";
import { FUND_STAGES, postedDays } from "@/lib/student";
import { useResume } from "@/lib/resume-store";
import { usePreferences } from "@/lib/account";
import { analyzeFit } from "@/lib/fit.functions";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { BoardNav } from "@/components/BoardNav";

export const Route = createFileRoute("/_authenticated/")({
  loader: async ({ context }) => {
    await Promise.all([context.queryClient.ensureQueryData(postingsQuery), context.queryClient.ensureQueryData(verificationQuery)]);
  },
  pendingComponent: () => <p className="mx-auto max-w-4xl px-4 py-14 text-muted-foreground">Loading job postings…</p>,
  errorComponent: ({ reset }) => <div className="mx-auto max-w-4xl space-y-4 px-4 py-14"><h1 className="text-2xl font-semibold">Postings could not be loaded</h1><p className="text-muted-foreground">The board is temporarily unavailable. Please try again.</p><Button onClick={reset}>Try again</Button></div>,
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

function JobCard({ j, score, bookmarked, onToggleBookmark }: { j: Job; score?: number | undefined; bookmarked: boolean; onToggleBookmark: () => void }) {
  const hl = j.nyc || j.mentionsMba;
  return (
    <article className={`rounded-lg border bg-card p-4 sm:p-5 ${hl ? "border-l-4 border-l-accent" : ""} ${isInactive(postingStatus(j, todayET())) ? "opacity-60" : ""}`}>
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-muted-foreground">{j.firm}</p>
          <h3 className="text-lg font-semibold leading-snug">
            <Link to="/jobs/$slug" params={{ slug: jobSlug(j) }} className="hover:text-primary hover:underline">{j.title}</Link>
            {score !== undefined && (
              <span className="ml-2 inline-block rounded-full bg-primary px-2 py-0.5 align-middle text-xs font-semibold text-primary-foreground"
                title={`${fitLabelFor(score)} — your Resume Match score`}>Your fit: {score}</span>
            )}
          </h3>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="outline" type="button" onClick={onToggleBookmark} aria-pressed={bookmarked}
            title={bookmarked ? "Remove bookmark" : "Bookmark this posting"}
            className={`rounded-md border px-3 py-1.5 text-sm font-medium ${bookmarked ? "border-accent bg-highlight text-highlight-foreground" : "border-input text-muted-foreground hover:bg-secondary"}`}>
            {bookmarked ? "★ Bookmarked" : "☆ Bookmark"}
          </Button>
          <Link to="/jobs/$slug" params={{ slug: jobSlug(j) }}
            className="rounded-md border border-primary px-3 py-1.5 text-sm font-medium text-primary hover:bg-secondary">
            Check My Fit
          </Link>
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
        <div>Posted {postedDays(j.datePosted,todayET())} days ago</div>
        <div className="font-medium text-foreground">{j.rolling || !j.deadline ? "Rolling / no deadline" : `Deadline ${fmtDate(j.deadline)}`}</div>
        <div>Last verified {fmtDay(j.lastVerified)}</div>
      </dl>
      <PostingExtras job={j}/>
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
  const [stage,setStage]=useState("");
  const [mba,setMba]=useState("");
  const [ranking,setRanking]=useState(false);const [rankError,setRankError]=useState("");
  const {text:resume}=useResume();const prefs=usePreferences();const run=useServerFn(analyzeFit);
  const [sort, setSort] = useState<"deadline" | "new" | "old" | "fit">("deadline");
  const [hideExpired, setHideExpired] = useState(true);
  const [page, setPage] = useState(1);
  const postingsSection = useRef<HTMLElement>(null);
  const { data: JOBS } = useSuspenseQuery(postingsQuery);
  const { data: lastVerified } = useSuspenseQuery(verificationQuery);
  const { map: analyses,save:saveAnalysis } = useAnalyses();
  const { map: bookmarks, toggle: toggleBookmark } = useBookmarks();
  const today = todayET();

  const [loadedFilters,setLoadedFilters]=useState(false);
  useEffect(()=>{if(loadedFilters||!prefs.data)return;const f=prefs.data.filters;if(f&&typeof f==="object"&&!Array.isArray(f)){setRole(String(f["role"]??""));setLoc(String(f["loc"]??""));setFirm(String(f["firm"]??""));setSector(String(f["sector"]??""));setStage(String(f["stage"]??""));setMba(String(f["mba"]??""));}setLoadedFilters(true);},[prefs.data,loadedFilters]);
  async function rank(){setSort("fit");if(!resume.trim()){setRankError("Add your resume on My resume to rank postings.");return;}setRanking(true);setRankError("");try{for(const job of JOBS.filter(j=>!isInactive(postingStatus(j,today)))){if(analyses[job.url])continue;const result=await run({data:{jobUrl:job.url,resumeText:resume}});saveAnalysis(job.url,result);}}catch(e){setRankError(e instanceof Error?e.message:"Ranking stopped; completed scores are saved.");}finally{setRanking(false);}}
  const now = new Date();
  const fresh = JOBS.filter((j) => isNew(j, now) && !isInactive(postingStatus(j, today)));
  const openCount = JOBS.filter((j) => !isInactive(postingStatus(j, today))).length;

  const list = useMemo(() => {
    const s = q.toLowerCase();
    const filtered = JOBS.filter((j) =>
      (!hideExpired || !isInactive(postingStatus(j, today))) &&
      (!role || j.roleType === role) && (!loc || locBucket(j) === loc) && (!firm || j.firmType === firm) &&
      (!sector || j.sectors.includes(sector)) && (!stage||j.fundStage===stage) && (!mba||!!j.mbaSpecific===(mba==="Yes")) &&
      (!s || [j.firm, j.title, j.location, j.focus].join(" ").toLowerCase().includes(s)),
    );
    if(sort==="fit")return filtered.filter(j=>!isInactive(postingStatus(j,today))).sort((a,b)=>(analyses[b.url]?.result.fitScore??-1)-(analyses[a.url]?.result.fitScore??-1));
    const byDate = filtered.sort((a, b) => (sort === "old" ? a.datePosted.localeCompare(b.datePosted) : b.datePosted.localeCompare(a.datePosted)));
    if (sort === "deadline") return sortByStatus(byDate, today);
    // Date sorts still keep deadline-passed and expired postings at the bottom.
    return [...byDate.filter((j) => !isInactive(postingStatus(j, today))), ...byDate.filter((j) => isInactive(postingStatus(j, today)))];
  }, [JOBS, q, role, loc, firm, sector, stage,mba,analyses,sort, hideExpired, today]);

  const pageSize = 10;
  const pageCount = Math.max(1, Math.ceil(list.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageStart = (currentPage - 1) * pageSize;
  const visiblePostings = list.slice(pageStart, pageStart + pageSize);
  useEffect(() => { setPage(1); }, [q, role, loc, firm, sector, stage, mba, sort, hideExpired]);
  useEffect(() => { setPage((previous) => Math.min(previous, pageCount)); }, [pageCount]);
  function changePage(nextPage: number) {
    setPage(nextPage);
    postingsSection.current?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "start" });
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:py-14">
      <header className="border-b pb-6">
        <div className="mb-4 flex flex-wrap items-center gap-4">
          <BrandLockup />
          <BoardNav />
        </div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Columbia Business School · Venture Capital Club</p>
        <h1 className="mt-2 text-xl font-bold text-primary sm:text-4xl"><span className="whitespace-nowrap">CBS Venture Capital Club</span><br/>Job Board</h1>
        <p className="mt-3 text-sm text-muted-foreground">Last verified: {lastVerified ? fmtDay(lastVerified) : "—"} · {openCount} open postings</p>
      </header>

      <section className="mt-8">
        <h2 className="text-2xl font-semibold">New in the last 24 hours</h2>
        <div className="mt-4 space-y-3">
          {fresh.length ? fresh.map((j) => <JobCard key={j.url} j={j} score={analyses[j.url]?.result.fitScore} bookmarked={!!bookmarks[j.url]} onToggleBookmark={() => toggleBookmark(j.url)} />) :
            <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">No new postings in the last 24 hours.</p>}
        </div>
      </section>

      <section ref={postingsSection} className="mt-12 scroll-mt-6">
        <h2 className="text-2xl font-semibold">All postings</h2>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-6">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search firm, title, sector…"
            className="col-span-2 self-end rounded-md border border-input bg-card px-3 py-2 text-sm sm:col-span-6" />
          <Select label="Role type" value={role} onChange={setRole} options={uniq(JOBS.map((j) => j.roleType))} />
          <Select label="Location" value={loc} onChange={setLoc} options={uniq(JOBS.map(locBucket))} />
          <Select label="Firm type" value={firm} onChange={setFirm} options={uniq(JOBS.map((j) => j.firmType))} />
          <Select label="Sector" value={sector} onChange={setSector} options={uniq(JOBS.flatMap((j) => j.sectors))} />
          <Select label="Fund stage" value={stage} onChange={setStage} options={FUND_STAGES}/>
          <Select label="MBA-specific" value={mba} onChange={setMba} options={["Yes","No"]}/>
          <label className="col-span-2 flex flex-col gap-1 text-xs font-medium text-muted-foreground">
            Sort
            <select value={sort} onChange={(e) => {if(e.target.value==="fit")void rank();else setSort(e.target.value as "deadline" | "new" | "old");}} disabled={ranking}
              className="rounded-md border border-input bg-card px-2 py-2 text-sm text-foreground">
              <option value="deadline">Soonest deadline first</option>
              <option value="new">Newest posted first</option>
              <option value="old">Oldest posted first</option>
              <option value="fit">Best fit for me</option>
            </select>
          </label>
        </div>
        <div className="mt-3 flex flex-wrap gap-3 items-center"><Button variant="outline" size="sm" onClick={()=>void prefs.save({filters:{role,loc,firm,sector,stage,mba}}).then(()=>toast.success("Filters saved")).catch(()=>toast.error("Could not save filters"))}>Save filters</Button>{ranking&&<p className="text-xs text-muted-foreground">Checking open postings; completed scores are cached…</p>}{rankError&&<p className="text-sm text-destructive">{rankError}</p>}</div>
        <label className="mt-3 flex items-center gap-2 text-sm">
          <input type="checkbox" checked={hideExpired} onChange={(e) => setHideExpired(e.target.checked)} className="h-4 w-4 accent-primary" />
          Hide expired postings
        </label>

        <div className="mt-4 space-y-3">
          {list.length ? visiblePostings.map((j) => <JobCard key={j.url} j={j} score={analyses[j.url]?.result.fitScore} bookmarked={!!bookmarks[j.url]} onToggleBookmark={() => toggleBookmark(j.url)} />) :
            <p className="text-sm text-muted-foreground">No postings match these filters.</p>}
        </div>
        {list.length > 0 && <div className="mt-6 space-y-3 border-t pt-5">
          <p role="status" className="text-center text-sm text-muted-foreground">Showing {pageStart + 1}–{Math.min(pageStart + pageSize, list.length)} of {list.length} postings</p>
          {pageCount > 1 && <nav aria-label="Job postings pages" className="flex flex-wrap items-center justify-center gap-2">
            <Button variant="outline" size="icon" aria-label="Previous page" title="Previous page" disabled={currentPage === 1} onClick={() => changePage(currentPage - 1)}><ChevronLeft /></Button>
            {Array.from({ length: pageCount }, (_, index) => index + 1).map((number) => <Button key={number} size="icon" variant={number === currentPage ? "default" : "outline"} aria-label={`Page ${number}`} aria-current={number === currentPage ? "page" : undefined} onClick={() => changePage(number)}>{number}</Button>)}
            <Button variant="outline" size="icon" aria-label="Next page" title="Next page" disabled={currentPage === pageCount} onClick={() => changePage(currentPage + 1)}><ChevronRight /></Button>
          </nav>}
        </div>}
      </section>

      <footer className="mt-14 border-t pt-6 text-sm text-muted-foreground">
        Postings are gathered from public sources and may change. Always confirm details on the firm's site. Also check CBS Career Management Center resources.
      </footer>
    </div>
  );
}
