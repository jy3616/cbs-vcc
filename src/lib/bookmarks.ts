import { useEffect, useState } from "react";

/**
 * Browser-only bookmarks for postings a student applied to. No accounts on
 * this site, so bookmarks live in the visitor's own localStorage and never
 * touch the server. Keyed by job URL.
 */
const BOOKMARKS_KEY = "vcc-bookmarks";
/** Fired on every write so every open copy of the list (header count, page, card) stays in step. */
const SYNC_EVENT = "vcc-bookmarks-changed";

function load(): Record<string, string> {
  try {
    const raw = localStorage.getItem(BOOKMARKS_KEY);
    return raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    return {};
  }
}

function write(all: Record<string, string>) {
  localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(all));
  window.dispatchEvent(new Event(SYNC_EVENT));
}

/** Bookmarked job URLs -> ISO date bookmarked, loaded after hydration. */
export function useBookmarks() {
  const [map, setMap] = useState<Record<string, string>>({});
  useEffect(() => {
    setMap(load());
    const sync = () => setMap(load());
    window.addEventListener("storage", sync);
    window.addEventListener(SYNC_EVENT, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(SYNC_EVENT, sync);
    };
  }, []);
  const toggle = (jobUrl: string) => {
    const all = load();
    if (all[jobUrl]) delete all[jobUrl];
    else all[jobUrl] = new Date().toISOString();
    write(all);
  };
  return { map, toggle };
}
