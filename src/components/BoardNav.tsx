import { Link } from "@tanstack/react-router";
import { useStudent } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { useBookmarks } from "@/lib/bookmarks";

type Props = {
  /** Which page we're on, so its link reads as active. */
  current?: "resume" | "bookmarks";
};

/** Header links to the resume page and the bookmarked-postings page. */
export function BoardNav({ current }: Props) {
  const {admin,signOut}=useStudent();
  const { map } = useBookmarks();
  const count = Object.keys(map).length;

  const link = (active: boolean) =>
    `rounded-md border px-3 py-1.5 font-medium ${active ? "border-accent bg-highlight text-highlight-foreground" : "border-input hover:bg-secondary"}`;

  return (
    <nav className="ml-auto flex flex-wrap items-center gap-2 text-sm" aria-label="Board pages">
      <Link to="/my-resume" className={link(current === "resume")}>
        My resume
      </Link>
      <Link
        to="/bookmarks"
        className={link(current === "bookmarks")}
        title={count ? `${count} posting${count === 1 ? "" : "s"} saved to your account` : "No postings saved yet"}
      >
        Bookmarks{count ? ` (${count})` : ""}
      </Link>
      <Link to="/my-applications" className={link(false)}>My applications</Link>
      <Link to="/account" className={link(false)}>Account</Link>
      {admin && <Link to="/admin" className={link(false)}>Admin</Link>}
      <Button variant="ghost" size="sm" onClick={signOut}>Sign out</Button>
    </nav>
  );
}
