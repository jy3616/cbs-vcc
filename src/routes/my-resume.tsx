import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { BrandLockup } from "@/components/BrandLockup";
import { BoardNav } from "@/components/BoardNav";
import { extractResumeText } from "@/lib/resume-file";
import { useResume } from "@/lib/resume-store";

export const Route = createFileRoute("/my-resume")({
  head: () => ({
    meta: [
      { title: "My resume · CBS Venture Capital Club Job Board" },
      { name: "description", content: "Save your resume in your browser to check your fit for venture capital roles." },
      { property: "og:title", content: "My resume · CBS Venture Capital Club Job Board" },
      { property: "og:description", content: "Save your resume to check your fit for VC roles." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MyResume,
});

function MyResume() {
  const { text, ready, save } = useResume();
  const [busy, setBusy] = useState(false);

  async function upload(file: File) {
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
    setBusy(false);
    if (content.length < 50) {
      toast.error("We couldn't find text in that file. If it's a scanned image, export it from Word or Google Docs as a PDF and try again.");
      return;
    }
    save(content);
    toast.success(`Resume saved: ${file.name}`);
  }

  function remove() {
    if (!confirm("Delete your saved resume? This also removes your saved fit results.")) return;
    save("");
    toast.success("Resume deleted");
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="flex flex-wrap items-center gap-4">
        <BrandLockup />
        <BoardNav current="resume" />
      </div>
      <div className="mt-6">
        <Link to="/" className="text-sm text-muted-foreground hover:underline">← Back to job board</Link>
      </div>
      <h1 className="mt-4 text-3xl font-bold text-primary">My resume</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Upload your resume as a PDF or Word (.docx) file. It's saved only in this browser — nothing is stored on our
        servers — and it's used for "Check My Fit" on each posting. Clearing your browser data removes it.
      </p>
      <label className={`mt-5 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-input bg-card p-8 text-center hover:bg-secondary ${busy || !ready ? "pointer-events-none opacity-50" : ""}`}>
        <span className="font-medium">{busy ? "Reading your resume…" : text ? "Upload a new resume" : "Choose your resume file"}</span>
        <span className="text-xs text-muted-foreground">PDF or Word (.docx), up to 10 MB</span>
        <input type="file" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) upload(f); }} />
      </label>
      {text && (
        <details className="mt-4 rounded-lg border bg-card p-4 text-sm">
          <summary className="cursor-pointer font-medium">See the text we read from your resume</summary>
          <pre className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap font-mono text-xs text-muted-foreground">{text}</pre>
        </details>
      )}
      <div className="mt-3 flex flex-wrap items-center gap-3">
        {text && (
          <button onClick={remove} className="rounded-md border border-input px-4 py-2 text-sm font-medium hover:bg-secondary">
            Delete resume
          </button>
        )}
        {text && <span className="text-xs text-muted-foreground">Saved in this browser</span>}
      </div>
    </div>
  );
}
