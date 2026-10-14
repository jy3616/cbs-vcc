import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { BrandLockup } from "@/components/BrandLockup";
import { supabase } from "@/integrations/supabase/client";
import { useSessionUser } from "@/lib/applications";
import { resumeQuery } from "@/lib/resume";

export const Route = createFileRoute("/_authenticated/my-resume")({
  head: () => ({
    meta: [
      { title: "My resume · CBS Venture Capital Club Job Board" },
      { name: "description", content: "Save your resume to check your fit for venture capital roles." },
      { property: "og:title", content: "My resume · CBS Venture Capital Club Job Board" },
      { property: "og:description", content: "Save your resume to check your fit for VC roles." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MyResume,
});

function MyResume() {
  const { user } = useSessionUser();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ ...resumeQuery(user?.id ?? ""), enabled: !!user });
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (data) setText(data.content); }, [data]);

  async function save() {
    if (!user) return;
    if (!text.trim()) { toast.error("Paste your resume first."); return; }
    setBusy(true);
    const { error } = await supabase.from("resumes").upsert({ user_id: user.id, content: text, updated_at: new Date().toISOString() });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Resume saved");
    qc.invalidateQueries({ queryKey: ["resume", user.id] });
  }

  async function remove() {
    if (!user || !confirm("Delete your saved resume?")) return;
    const { error } = await supabase.from("resumes").delete().eq("user_id", user.id);
    if (error) { toast.error(error.message); return; }
    setText("");
    toast.success("Resume deleted");
    qc.invalidateQueries({ queryKey: ["resume", user.id] });
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <BrandLockup />
      <div className="mt-6">
        <Link to="/board" className="text-sm text-muted-foreground hover:underline">← Back to job board</Link>
      </div>
      <h1 className="mt-4 text-3xl font-bold text-primary">My resume</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Paste your resume as plain text. Only you can see it. It's used for "Check My Fit" on each posting.
      </p>
      <textarea value={text} onChange={(e) => setText(e.target.value)} disabled={isLoading}
        placeholder="Paste your resume here…" rows={22}
        className="mt-5 w-full rounded-lg border border-input bg-card p-4 font-mono text-sm" />
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button onClick={save} disabled={busy}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50">
          {busy ? "Saving…" : "Save"}
        </button>
        {data && (
          <button onClick={remove} className="rounded-md border border-input px-4 py-2 text-sm font-medium hover:bg-secondary">
            Delete resume
          </button>
        )}
        {data && <span className="text-xs text-muted-foreground">Last saved {new Date(data.updated_at).toLocaleString()}</span>}
      </div>
    </div>
  );
}
