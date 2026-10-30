import {useState} from 'react';
import {toast} from 'sonner';
import {Button} from '@/components/ui/button';
import {supabase} from '@/integrations/supabase/client';
import {useStudent} from '@/lib/auth';
import {ApplicationStatusControl} from './ApplicationStatus';
import type {Job} from '@/data/jobs';
export function PostingExtras({job}:{job:Job}){const {user}=useStudent();const [reported,setReported]=useState(false);const [busy,setBusy]=useState(false);async function report(){if(!user)return;setBusy(true);const {error}=await supabase.from('broken_link_reports').upsert({posting_id:job.id,user_id:user.id,resolved:false},{onConflict:'user_id,posting_id'});setBusy(false);if(error)toast.error('Could not report link.');else{setReported(true);toast.success('Link flagged for admins.');}}return <div className="mt-3 border-t pt-3 space-y-2"><div className="flex flex-wrap items-center gap-3 text-xs">{job.sharedByVcc&&<span className="font-semibold text-primary">Shared by VCC</span>}{job.fundStage&&<span>{job.fundStage}</span>}{job.mbaSpecific&&<span>MBA-specific</span>}<Button size="sm" variant="ghost" disabled={reported||busy} onClick={report}>{reported?'Link reported':'Report broken link'}</Button><ApplicationStatusControl url={job.url}/></div>{job.alumni&&<p className="text-xs text-muted-foreground">CBS alumni at this firm: {job.alumni}</p>}{job.notes&&<p className="text-sm text-muted-foreground whitespace-pre-wrap">{job.notes}</p>}</div>;}
