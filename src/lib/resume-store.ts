import { useEffect, useState } from "react";
import {supabase} from "@/integrations/supabase/client";
import {useStudent} from "./auth";
import {usePreferences} from "./account";
import {toast} from "sonner";
import type { FitResult } from "./fit";

/**
 * Default browser resume storage, with explicit account opt-in. Fit narratives
 * remain browser-cached; submitted resume text is never persisted by checks.
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
  const {user}=useStudent();const prefs=usePreferences();
  const [text,setText]=useState("");const [ready,setReady]=useState(false);
  const account=prefs.data?.resume_account??false;
  useEffect(()=>{let active=true;if(!user||prefs.isPending)return;setReady(false);if(account){void supabase.from('resumes').select('content').eq('user_id',user.id).maybeSingle().then(({data,error})=>{if(active){if(error)toast.error('Could not load account resume.');setText(data?.content??'');setReady(true);}});}else{setText(loadResume());setReady(true);}return()=>{active=false;};},[user,account,prefs.isPending]);
  const save=async(t:string)=>{if(account&&user){const {error}=t?await supabase.from('resumes').upsert({user_id:user.id,content:t,updated_at:new Date().toISOString()}):await supabase.from('resumes').delete().eq('user_id',user.id);if(error){toast.error('Could not save account resume');throw error;}}else{if(t)saveResume(t);else clearResume();}setText(t);localStorage.removeItem(ANALYSES_KEY);window.dispatchEvent(new Event('vcc-fit-changed'));};
  const setAccount=async(enabled:boolean)=>{if(!user)return;if(enabled){const {error}=await supabase.from('resumes').upsert({user_id:user.id,content:text,updated_at:new Date().toISOString()});if(error)throw error;await prefs.save({resume_account:true});localStorage.removeItem(RESUME_KEY);}else{const {error}=await supabase.from('resumes').delete().eq('user_id',user.id);if(error)throw error;saveResume(text);await prefs.save({resume_account:false});}};
  return {text,ready,save,account,setAccount};
}

export function useAnalyses() {
 const {user}=useStudent();
 const [map,setMap]=useState<Record<string,StoredAnalysis>>({});
 useEffect(()=>{if(!user)return;const owner=localStorage.getItem('vcc-fit-owner');if(owner!==user.id){localStorage.removeItem(ANALYSES_KEY);localStorage.setItem('vcc-fit-owner',user.id);window.dispatchEvent(new Event('vcc-fit-changed'));}},[user]);
 useEffect(()=>{const sync=()=>setMap(loadAnalyses());sync();window.addEventListener('vcc-fit-changed',sync);return()=>window.removeEventListener('vcc-fit-changed',sync);},[]);
 const save=(url:string,result:FitResult)=>{saveAnalysis(url,result);window.dispatchEvent(new Event('vcc-fit-changed'));};return {map,save};
}
