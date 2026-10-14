import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { BrandLockup } from "@/components/BrandLockup";

export const Route = createFileRoute("/")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (data.user) throw redirect({ to: "/board" });
  },
  head: () => ({
    meta: [
      { title: "Sign in · CBS Venture Capital Club Job Board" },
      { name: "description", content: "Sign in to browse open VC, growth equity and CVC roles for Columbia Business School MBA students." },
      { property: "og:title", content: "CBS Venture Capital Club Job Board" },
      { property: "og:description", content: "Sign in to browse open VC roles for Columbia MBA students." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SignInPage,
});

const schema = z.object({
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(8, "Password must be at least 8 characters").max(72),
  name: z.string().trim().max(100).optional(),
});

const input = "w-full rounded-md border border-input bg-card px-3 py-2 text-sm";

function SignInPage() {
  const nav = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    setBusy(true);
    try {
      if (mode === "forgot") {
        const r = z.string().trim().email().safeParse(email);
        if (!r.success) throw new Error("Enter a valid email");
        const { error } = await supabase.auth.resetPasswordForEmail(r.data, { redirectTo: `${window.location.origin}/reset-password` });
        if (error) throw error;
        setMsg("Check your email for a reset link.");
        return;
      }
      const p = schema.safeParse({ email, password, name: name || undefined });
      if (!p.success) throw new Error(p.error.issues[0]?.message ?? "Invalid input");
      if (mode === "signup") {
        if (!p.data.name) throw new Error("Enter your name");
        const { error } = await supabase.auth.signUp({
          email: p.data.email, password: p.data.password,
          options: { emailRedirectTo: window.location.origin, data: { display_name: p.data.name } },
        });
        if (error) throw error;
        setMsg("Check your email to confirm your account, then sign in.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: p.data.email, password: p.data.password });
        if (error) throw error;
        sessionStorage.removeItem("cbs-logo-shower-shown");
        nav({ to: "/board" });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  const title = mode === "signup" ? "Create an account" : mode === "forgot" ? "Reset password" : "Sign in";

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <div className="mb-6">
        <BrandLockup size="md" asLink={false} />
      </div>
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Columbia Business School · Venture Capital Club</p>
      <h1 className="mt-2 text-2xl font-bold text-primary sm:text-3xl"><span className="whitespace-nowrap">CBS Venture Capital Club</span> Job Board</h1>
      <p className="mt-2 text-sm text-muted-foreground">Sign in to browse the board and track your applications.</p>
      <h2 className="mt-6 text-xl font-semibold">{title}</h2>
      <form onSubmit={submit} className="mt-4 space-y-3">
        {mode === "signup" && <input className={input} placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />}
        <input className={input} type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        {mode !== "forgot" && <input className={input} type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />}
        <button disabled={busy} className="w-full rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50">
          {busy ? "Please wait…" : mode === "signup" ? "Sign up" : mode === "forgot" ? "Send reset link" : "Sign in"}
        </button>
        {msg && <p className="text-sm text-foreground">{msg}</p>}
      </form>
      <div className="mt-4 flex flex-col gap-1 text-sm text-muted-foreground">
        {mode !== "signin" && <button className="text-left hover:underline" onClick={() => setMode("signin")}>Have an account? Sign in</button>}
        {mode !== "signup" && <button className="text-left hover:underline" onClick={() => setMode("signup")}>New here? Create an account</button>}
        {mode === "signin" && <button className="text-left hover:underline" onClick={() => setMode("forgot")}>Forgot password?</button>}
      </div>
      <p className="mt-8 text-xs text-muted-foreground">
        Postings are gathered from public sources and may change. Always confirm details on the firm's site. Also check CBS Career Management Center resources.
      </p>
    </div>
  );
}
