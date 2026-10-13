import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset password · CBS VC Job Board" },
      { name: "description", content: "Choose a new password for your job board account." },
      { property: "og:title", content: "Reset password · CBS VC Job Board" },
      { property: "og:description", content: "Choose a new password." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const nav = useNavigate();
  const [pw, setPw] = useState("");
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (pw.length < 8) return toast.error("Password must be at least 8 characters");
    const { error } = await supabase.auth.updateUser({ password: pw });
    if (error) return toast.error(error.message);
    toast.success("Password updated");
    nav({ to: "/" });
  }
  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <h1 className="text-3xl font-bold text-primary">Set a new password</h1>
      <form onSubmit={submit} className="mt-6 space-y-3">
        <input type="password" placeholder="New password" value={pw} onChange={(e) => setPw(e.target.value)}
          className="w-full rounded-md border border-input bg-card px-3 py-2 text-sm" />
        <button className="w-full rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">Update password</button>
      </form>
    </div>
  );
}
