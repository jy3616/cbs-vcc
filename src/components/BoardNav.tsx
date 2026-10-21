import { Link } from "@tanstack/react-router";
import { useBookmarks } from "@/lib/bookmarks";

type Props = {
  /** Which page we're on, so its link reads as active. */
  current?: "resume" | "bookmarks";
};

/** Header links to the resume page and the bookmarked-postings page. */
export function BoardNav({ current }: Props) {
  const { map } = useBookmarks();
  const count = Object.keys(map).length;

  const link = (active: boolean) =>
    `rounded-md border px-3 py-1.5 font-medium ${active ? "border-accent bg-highlight text-highlight-foreground" : "border-input hover:bg-secondary"}`;

  return (
    <nav className="ml-auto flex items-center gap-3 text-sm" aria-label="Board pages">
      <Link to="/my-resume" className={link(current === "resume")}>
        My resume
      </Link>
      <Link
        to="/bookmarks"
        className={link(current === "bookmarks")}
        title={count ? `${count} posting${count === 1 ? "" : "s"} saved in this browser` : "No postings saved yet"}
      >
        Bookmarks{count ? ` (${count})` : ""}
      </Link>
    </nav>
  );
}
