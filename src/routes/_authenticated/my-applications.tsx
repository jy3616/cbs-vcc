import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { useApplications, useSessionUser, useToggleApplied } from "@/lib/applications";

export const Route = createFileRoute("/_authenticated/my-applications")({
  head: () => ({
    meta: [
      { title: "My applications · CBS Venture Capital Club Job Board" },
      { name: "description", content: "The venture capital postings you've applied to." },
      { property: "og:title", content: "My applications · CBS VC Job Board" },
      { property: "og:description", content: "Track the VC roles you've applied to." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MyApplications,
});

function MyApplications() {
  const { user } = useSessionUser();
  const { data, isLoading } = useApplications(user?.id);
  const toggle = useToggleApplied(user?.id);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <Link to="/board" className="text-sm text-muted-foreground hover:underline">← Back to job board</Link>
      <h1 className="mt-3 text-4xl font-bold text-primary">My applications</h1>
      <div className="mt-6 space-y-3">
        {isLoading || !user ? <p className="text-sm text-muted-foreground">Loading…</p> :
          !data?.length ? (
            <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
              You haven't marked any postings yet. Use "Mark as applied" on the job board.
            </p>
          ) : data.map((a) => (
            <article key={a.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card p-4">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-muted-foreground">{a.firm}</p>
                <a href={a.job_url} target="_blank" rel="noopener noreferrer" className="text-lg font-semibold hover:underline">{a.title}</a>
                <p className="text-sm text-muted-foreground">
                  Applied {new Date(a.applied_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </p>
              </div>
              <button
                onClick={() => toggle.mutate({ job: { url: a.job_url, firm: a.firm, title: a.title }, applied: true },
                  { onError: (e) => toast.error(e.message) })}
                className="rounded-md border border-input px-3 py-1.5 text-sm hover:bg-secondary">
                Remove
              </button>
            </article>
          ))}
      </div>
    </div>
  );
}
