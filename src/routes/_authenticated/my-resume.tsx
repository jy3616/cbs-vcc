import { createFileRoute, Link } from "@tanstack/react-router";
import { extractResumeText } from "@/lib/resume-file";
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
  const { data: files } = useQuery({
    queryKey: ["resume-file", user?.id ?? ""],
    enabled: !!user,
    refetchInterval: 45 * 60 * 1000, // keep the signed preview link fresh
    queryFn: async () => {
      const { data: list, error } = await supabase.storage.from("resumes").list(user!.id);
      if (error) throw error;
      const real = (list ?? []).filter((f) => f.name !== ".emptyFolderPlaceholder");
      return Promise.all(real.map(async (f) => {
        const { data: signed } = await supabase.storage.from("resumes").createSignedUrl(`${user!.id}/${f.name}`, 3600);
        return { name: f.name, url: signed?.signedUrl ?? null };
      }));
    },
  });
  const storedFile = files?.[0];
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (data) setText(data.content); }, [data]);

  async function upload(file: File) {
    if (!user) return;
    if (file.size > 10 * 1024 * 1024) { toast.error("That file is over 10 MB."); return; }
    setBusy(true);
    let content = "";
    try {
      content = await extractResumeText(file);
    } catch (e) {
      setBusy(false);
      toast.error(e instanceof Error ? e.message : "Couldn't read that file.");
      return;
    }
    if (content.length < 50) {
      setBusy(false);
      toast.error("We couldn't find text in that file. If it's a scanned image, export it from Word or Google Docs as a PDF and try again.");
      return;
    }
    const { error } = await supabase.from("resumes").upsert({ user_id: user.id, content, updated_at: new Date().toISOString() });
    if (error) { setBusy(false); toast.error(error.message); return; }
    // Replace any previously stored file, then save this one for preview.
    const { data: old } = await supabase.storage.from("resumes").list(user.id);
    const stale = (old ?? []).filter((f) => f.name !== ".emptyFolderPlaceholder").map((f) => `${user.id}/${f.name}`);
    if (stale.length) await supabase.storage.from("resumes").remove(stale);
    const { error: upErr } = await supabase.storage.from("resumes").upload(`${user.id}/${file.name}`, file, { upsert: true });
    setBusy(false);
    if (upErr) { toast.error(`Resume text saved, but the file preview couldn't be stored: ${upErr.message}`); }
    else toast.success(`Resume uploaded: ${file.name}`);
    setText(content);
    qc.invalidateQueries({ queryKey: ["resume", user.id] });
    qc.invalidateQueries({ queryKey: ["resume-file", user.id] });
  }


  async function remove() {
    if (!user || !confirm("Delete your saved resume?")) return;
    const { error } = await supabase.from("resumes").delete().eq("user_id", user.id);
    if (error) { toast.error(error.message); return; }
    const { data: old } = await supabase.storage.from("resumes").list(user.id);
    const stale = (old ?? []).filter((f) => f.name !== ".emptyFolderPlaceholder").map((f) => `${user.id}/${f.name}`);
    if (stale.length) await supabase.storage.from("resumes").remove(stale);
    setText("");
    toast.success("Resume deleted");
    qc.invalidateQueries({ queryKey: ["resume", user.id] });
    qc.invalidateQueries({ queryKey: ["resume-file", user.id] });
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <BrandLockup />
      <div className="mt-6">
        <Link to="/board" className="text-sm text-muted-foreground hover:underline">← Back to job board</Link>
      </div>
      <h1 className="mt-4 text-3xl font-bold text-primary">My resume</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Upload your resume as a PDF or Word (.docx) file. Only you can see it. It's used for "Check My Fit" on each posting.
      </p>
      <label className={`mt-5 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-input bg-card p-8 text-center hover:bg-secondary ${busy || isLoading ? "pointer-events-none opacity-50" : ""}`}>
        <span className="font-medium">{busy ? "Reading your resume…" : data ? "Upload a new resume" : "Choose your resume file"}</span>
        <span className="text-xs text-muted-foreground">PDF or Word (.docx), up to 10 MB</span>
        <input type="file" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) upload(f); }} />
      </label>
      {data && (
        <details className="mt-4 rounded-lg border bg-card p-4 text-sm">
          <summary className="cursor-pointer font-medium">See the text we read from your resume</summary>
          <pre className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap font-mono text-xs text-muted-foreground">{text}</pre>
        </details>
      )}
      <div className="mt-3 flex flex-wrap items-center gap-3">
        {storedFile?.url && (
          <a href={storedFile.url} target="_blank" rel="noopener noreferrer"
            className="rounded-md border border-input px-4 py-2 text-sm font-medium hover:bg-secondary">
            Preview original file ({storedFile.name})
          </a>
        )}
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
