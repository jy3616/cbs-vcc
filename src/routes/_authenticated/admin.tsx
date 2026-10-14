import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { toast } from "sonner";
import { BrandLockup } from "@/components/BrandLockup";
import { StatusLabel } from "@/components/StatusLabel";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import type { Job } from "@/data/jobs";
import { useSessionUser } from "@/lib/applications";
import { fmtDay, useIsAdmin, usePostings } from "@/lib/postings";
import { needsAttention } from "@/lib/status";
import { runLinkCheckNow } from "@/lib/admin.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin · CBS Venture Capital Club Job Board" },
      { name: "description", content: "Keep the job board's postings, deadlines and links up to date." },
      { property: "og:title", content: "Admin · CBS Venture Capital Club Job Board" },
      { property: "og:description", content: "Manage postings, deadlines and link checks." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Admin,
});

const FIRM_TYPES = ["VC", "Growth equity", "CVC", "Studio", "Accelerator"];
const ROLE_TYPES = ["Full-time", "Summer internship", "In-semester internship", "Fellowship"];

function Admin() {
  const { user } = useSessionUser();
  const { data: isAdmin, isLoading } = useIsAdmin(user?.id);
  const { data: postings = [] } = usePostings();
  const qc = useQueryClient();
  const runCheck = useServerFn(runLinkCheckNow);
  const [checking, setChecking] = useState(false);
  const [editing, setEditing] = useState<Partial<Job> | null>(null);

  if (isLoading || !user) return <div className="mx-auto max-w-4xl px-4 py-10 text-sm text-muted-foreground">Loading…</div>;
  if (!isAdmin) return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <BrandLockup />
      <p className="mt-6">This page is for board admins only.</p>
      <Link to="/board" className="text-primary hover:underline">← Back to job board</Link>
    </div>
  );

  const refresh = () => qc.invalidateQueries({ queryKey: ["postings"] });
  const now = new Date();
  const attention = postings.map((p) => ({ p, why: needsAttention(p, now) })).filter((x) => x.why.length);

  async function confirmLive(p: Job) {
    const { error } = await supabase.from("postings")
      .update({ last_verified_at: new Date().toISOString(), needs_review: false, review_reason: "" }).eq("id", p.id);
    if (error) return void toast.error(error.message);
    toast.success(`Confirmed live: ${p.firm}`); refresh();
  }
  async function markExpired(p: Job) {
    if (!confirm(`Mark "${p.title}" at ${p.firm} as expired? Students will see it as no longer accepting applications.`)) return;
    const { error } = await supabase.from("postings").update({ expired: true, needs_review: false }).eq("id", p.id);
    if (error) return void toast.error(error.message);
    toast.success("Marked as expired"); refresh();
  }
  async function checkNow() {
    setChecking(true);
    try {
      const r = await runCheck();
      toast.success(`Checked ${r.checked} links · ${r.flagged} flagged`); refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Link check failed");
    } finally { setChecking(false); }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <BrandLockup />
      <div className="mt-6"><Link to="/board" className="text-sm text-muted-foreground hover:underline">← Back to job board</Link></div>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-bold text-primary sm:text-4xl">Admin</h1>
        <div className="ml-auto flex gap-2">
          <Button variant="outline" onClick={checkNow} disabled={checking}>{checking ? "Checking links…" : "Check links now"}</Button>
          <Button onClick={() => setEditing({ rolling: true, sectors: [], firmType: "VC", roleType: "Full-time", datePosted: format(new Date(), "yyyy-MM-dd") })}>Add posting</Button>
        </div>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">Links are checked automatically once a day. Flagged postings are never expired automatically — you decide.</p>

      <section className="mt-8">
        <h2 className="text-2xl font-semibold">Needs attention ({attention.length})</h2>
        <p className="mt-1 text-xs text-muted-foreground">Flagged by the link check, closing within 7 days, or not verified in over 7 days.</p>
        <div className="mt-4 space-y-3">
          {attention.length ? attention.map(({ p, why }) => (
            <Row key={p.id} p={p} why={why} onConfirm={() => confirmLive(p)} onExpire={() => markExpired(p)} onEdit={() => setEditing(p)} />
          )) : <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">Everything is up to date.</p>}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold">All postings ({postings.length})</h2>
        <div className="mt-4 space-y-3">
          {postings.map((p) => (
            <Row key={p.id} p={p} why={[]} onConfirm={() => confirmLive(p)} onExpire={() => markExpired(p)} onEdit={() => setEditing(p)} />
          ))}
        </div>
      </section>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader><DialogTitle>{editing?.id ? "Edit posting" : "Add posting"}</DialogTitle></DialogHeader>
          {editing && <PostingForm initial={editing} onDone={() => { setEditing(null); refresh(); }} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Row({ p, why, onConfirm, onExpire, onEdit }: { p: Job; why: string[]; onConfirm: () => void; onExpire: () => void; onEdit: () => void }) {
  return (
    <article className="rounded-lg border bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-muted-foreground">{p.firm}</p>
          <a href={p.url} target="_blank" rel="noopener noreferrer" className="font-semibold hover:underline">{p.title} ↗</a>
          <div className="mt-2 flex flex-wrap gap-1.5 text-xs">
            <StatusLabel p={p} />
            {why.map((w) => <span key={w} className={`rounded px-2 py-0.5 ${w === "Needs review" ? "bg-destructive font-semibold text-destructive-foreground" : "bg-highlight text-highlight-foreground"}`}>{w}</span>)}
          </div>
          {p.needsReview && p.reviewReason && <p className="mt-1 text-sm text-destructive">{p.reviewReason}</p>}
          <p className="mt-1 text-xs text-muted-foreground">
            {p.rolling || !p.deadline ? "Rolling / no deadline" : `Deadline ${fmtDay(p.deadline)}`} · Last verified {fmtDay(p.lastVerified)}
            {p.lastChecked && ` · Link checked ${fmtDay(p.lastChecked)}`}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          {!p.expired && <Button size="sm" variant="outline" onClick={onConfirm}>Confirm still live</Button>}
          {!p.expired && <Button size="sm" variant="outline" onClick={onExpire}>Mark expired</Button>}
          <Button size="sm" variant="outline" onClick={onEdit}>Edit</Button>
        </div>
      </div>
    </article>
  );
}

function PostingForm({ initial, onDone }: { initial: Partial<Job>; onDone: () => void }) {
  const [f, setF] = useState<Partial<Job>>(initial);
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof Job>(k: K, v: Job[K]) => setF((x) => ({ ...x, [k]: v }));
  const deadlineDate = f.deadline ? new Date(f.deadline + "T12:00:00") : undefined;

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!f.firm?.trim() || !f.title?.trim() || !f.url?.trim()) return void toast.error("Firm, title and link are required.");
    if (!/^https?:\/\//.test(f.url)) return void toast.error("The link must start with http:// or https://");
    if (!f.rolling && !f.deadline) return void toast.error("Pick a deadline or tick “Rolling / no deadline”.");
    const row = {
      firm: f.firm.trim(), title: f.title.trim(), url: f.url.trim(), location: f.location ?? "", firm_type: f.firmType ?? "VC",
      role_type: f.roleType ?? "Full-time", focus: f.focus ?? "", sectors: f.sectors ?? [], date_posted: f.datePosted || format(new Date(), "yyyy-MM-dd"),
      deadline: f.rolling ? null : f.deadline || null, rolling: !!f.rolling, nyc: !!f.nyc, mentions_mba: !!f.mentionsMba, expired: !!f.expired,
    };
    setBusy(true);
    const { error } = f.id
      ? await supabase.from("postings").update(row).eq("id", f.id)
      : await supabase.from("postings").insert({ ...row, last_verified_at: new Date().toISOString() });
    setBusy(false);
    if (error) return void toast.error(error.message.includes("duplicate") ? "A posting with that link already exists." : error.message);
    toast.success(f.id ? "Posting updated" : "Posting added");
    onDone();
  }

  const input = "w-full rounded-md border border-input bg-card px-3 py-2 text-sm";
  const L = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">{label}{children}</label>
  );
  return (
    <form onSubmit={save} className="grid gap-3 sm:grid-cols-2">
      <L label="Firm *"><input className={input} value={f.firm ?? ""} onChange={(e) => set("firm", e.target.value)} /></L>
      <L label="Title *"><input className={input} value={f.title ?? ""} onChange={(e) => set("title", e.target.value)} /></L>
      <div className="sm:col-span-2"><L label="Application link *"><input className={input} value={f.url ?? ""} onChange={(e) => set("url", e.target.value)} placeholder="https://" /></L></div>
      <L label="Location"><input className={input} value={f.location ?? ""} onChange={(e) => set("location", e.target.value)} /></L>
      <L label="Focus"><input className={input} value={f.focus ?? ""} onChange={(e) => set("focus", e.target.value)} /></L>
      <L label="Firm type"><select className={input} value={f.firmType} onChange={(e) => set("firmType", e.target.value)}>{FIRM_TYPES.map((t) => <option key={t}>{t}</option>)}</select></L>
      <L label="Role type"><select className={input} value={f.roleType} onChange={(e) => set("roleType", e.target.value)}>{ROLE_TYPES.map((t) => <option key={t}>{t}</option>)}</select></L>
      <div className="sm:col-span-2"><L label="Sectors (comma-separated)">
        <input className={input} value={(f.sectors ?? []).join(", ")} onChange={(e) => set("sectors", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))} />
      </L></div>
      <div className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
        Application deadline
        <Popover>
          <PopoverTrigger asChild>
            <Button type="button" variant="outline" disabled={!!f.rolling} className={cn("justify-start text-left font-normal", !deadlineDate && "text-muted-foreground")}>
              <CalendarIcon />{f.rolling ? "Rolling" : deadlineDate ? format(deadlineDate, "PPP") : "Pick a date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar mode="single" selected={deadlineDate} onSelect={(d) => set("deadline", d ? format(d, "yyyy-MM-dd") : "")} initialFocus className={cn("p-3 pointer-events-auto")} />
          </PopoverContent>
        </Popover>
        <label className="mt-1 flex items-center gap-2 text-sm text-foreground">
          <input type="checkbox" checked={!!f.rolling} onChange={(e) => set("rolling", e.target.checked)} className="h-4 w-4 accent-primary" /> Rolling / no deadline
        </label>
      </div>
      <L label="Date posted"><input type="date" className={input} value={f.datePosted ?? ""} onChange={(e) => set("datePosted", e.target.value)} /></L>
      <div className="flex flex-wrap gap-4 text-sm sm:col-span-2">
        <label className="flex items-center gap-2"><input type="checkbox" checked={!!f.nyc} onChange={(e) => set("nyc", e.target.checked)} className="h-4 w-4 accent-primary" /> NYC role</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={!!f.mentionsMba} onChange={(e) => set("mentionsMba", e.target.checked)} className="h-4 w-4 accent-primary" /> Mentions MBA</label>
        {f.id && <label className="flex items-center gap-2"><input type="checkbox" checked={!!f.expired} onChange={(e) => set("expired", e.target.checked)} className="h-4 w-4 accent-primary" /> Expired (removed or filled)</label>}
      </div>
      <div className="sm:col-span-2"><Button type="submit" disabled={busy}>{busy ? "Saving…" : "Save posting"}</Button></div>
    </form>
  );
}
