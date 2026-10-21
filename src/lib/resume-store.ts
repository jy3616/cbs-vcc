import { useEffect, useState } from "react";
import type { FitResult } from "./fit";

/**
 * Browser-only storage for the resume and fit results. No accounts on this
 * site, so everything lives in the visitor's own localStorage and never
 * touches the server.
 */
const RESUME_KEY = "vcc-resume";
const ANALYSES_KEY = "vcc-fit-analyses";

export type StoredAnalysis = { result: FitResult; at: string };

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function loadResume(): string {
  return read<string>(RESUME_KEY, "");
}

export function saveResume(text: string) {
  localStorage.setItem(RESUME_KEY, JSON.stringify(text));
}

export function clearResume() {
  localStorage.removeItem(RESUME_KEY);
  localStorage.removeItem(ANALYSES_KEY);
}

export function loadAnalyses(): Record<string, StoredAnalysis> {
  return read<Record<string, StoredAnalysis>>(ANALYSES_KEY, {});
}

export function saveAnalysis(jobUrl: string, result: FitResult) {
  const all = loadAnalyses();
  all[jobUrl] = { result, at: new Date().toISOString() };
  localStorage.setItem(ANALYSES_KEY, JSON.stringify(all));
}

/** Resume text, loaded after hydration to avoid SSR mismatches. */
export function useResume() {
  const [text, setText] = useState("");
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setText(loadResume());
    setReady(true);
  }, []);
  const save = (t: string) => {
    setText(t);
    if (t) saveResume(t);
    else clearResume();
  };
  return { text, ready, save };
}

/** Fit results keyed by job URL, loaded after hydration. */
export function useAnalyses() {
  const [map, setMap] = useState<Record<string, StoredAnalysis>>({});
  useEffect(() => setMap(loadAnalyses()), []);
  const save = (jobUrl: string, result: FitResult) => {
    saveAnalysis(jobUrl, result);
    setMap(loadAnalyses());
  };
  return { map, save };
}
