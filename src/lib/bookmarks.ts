import { useEffect, useState } from "react";

/**
 * Browser-only bookmarks for postings a student applied to. No accounts on
 * this site, so bookmarks live in the visitor's own localStorage and never
 * touch the server. Keyed by job URL.
 */
const BOOKMARKS_KEY = "vcc-bookmarks";

function load(): Record<string, string> {
  try {
    const raw = localStorage.getItem(BOOKMARKS_KEY);
    return raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    return {};
  }
}

/** Bookmarked job URLs -> ISO date bookmarked, loaded after hydration. */
export function useBookmarks() {
  const [map, setMap] = useState<Record<string, string>>({});
  useEffect(() => setMap(load()), []);
  const toggle = (jobUrl: string) => {
    const all = load();
    if (all[jobUrl]) delete all[jobUrl];
    else all[jobUrl] = new Date().toISOString();
    localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(all));
    setMap(all);
  };
  return { map, toggle };
}
