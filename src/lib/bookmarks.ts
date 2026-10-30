import {useEffect} from 'react';
import {useMutation,useQuery,useQueryClient} from '@tanstack/react-query';
import {toast} from 'sonner';
import {supabase} from '@/integrations/supabase/client';
import {useStudent} from './auth';
import {bookmarkQuery} from './account';
import {APPLICATION_STATUSES,type ApplicationStatus} from './student';
export {APPLICATION_STATUSES};
export function useBookmarks(){const {user}=useStudent();const qc=useQueryClient();const query=useQuery({...bookmarkQuery(user?.id??''),enabled:!!user});const rows=query.data??[];const map=Object.fromEntries(rows.map(r=>[r.job_url,r.saved_at]));
 useEffect(()=>{if(!user)return;let old:Record<string,string>={};try{old=JSON.parse(localStorage.getItem('vcc-bookmarks')??'{}');}catch{return;}if(!Object.keys(old).length)return;void supabase.from('student_bookmarks').upsert(Object.entries(old).map(([job_url,saved_at])=>({user_id:user.id,job_url,saved_at})),{onConflict:'user_id,job_url',ignoreDuplicates:true}).then(({error})=>{if(!error){localStorage.removeItem('vcc-bookmarks');void qc.invalidateQueries({queryKey:['bookmarks',user.id]});}});},[user,qc]);
 const toggleMutation=useMutation({mutationFn:async(jobUrl:string)=>{if(!user)throw new Error('Sign in first');if(map[jobUrl]){const {error}=await supabase.from('student_bookmarks').delete().eq('user_id',user.id).eq('job_url',jobUrl);if(error)throw error;}else{const {data:job}=await supabase.from('postings').select('firm,title,location,url').eq('url',jobUrl).maybeSingle();const {error}=await supabase.from('student_bookmarks').insert({user_id:user.id,job_url:jobUrl,snapshot:job??{}});if(error)throw error;}},onSuccess:()=>qc.invalidateQueries({queryKey:['bookmarks']}),onError:()=>toast.error('Could not update bookmark.')});
 const statusMutation=useMutation({mutationFn:async({url,status}:{url:string;status:ApplicationStatus})=>{if(!user)throw new Error('Sign in first');const {error}=await supabase.from('student_bookmarks').update({status}).eq('user_id',user.id).eq('job_url',url);if(error)throw error;},onSuccess:()=>qc.invalidateQueries({queryKey:['bookmarks']}),onError:()=>toast.error('Could not save application status.')});
 return {map,rows,toggle:(url:string)=>toggleMutation.mutate(url),setStatus:(url:string,status:ApplicationStatus)=>statusMutation.mutate({url,status}),pending:toggleMutation.isPending};
}
