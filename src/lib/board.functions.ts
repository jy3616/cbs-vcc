import {createServerFn} from '@tanstack/react-start';
import {createClient} from '@supabase/supabase-js';
import type {Database} from '@/integrations/supabase/types';
import { isAssociatePosition } from './job-eligibility';
export const getBoardData=createServerFn({method:'GET'}).handler(async()=>{
 const key=process.env['SUPABASE_PUBLISHABLE_KEY'];
 const url=process.env['SUPABASE_URL'];
 if(!key||!url)throw new Error('The board could not load.');
 const publicClient=createClient<Database>(url,key,{
  auth:{persistSession:false,autoRefreshToken:false},
  global:{fetch:(input,init)=>{
   const headers=new Headers(init?.headers);
   if(key.startsWith('sb_')&&headers.get('Authorization')===`Bearer ${key}`)headers.delete('Authorization');
   headers.set('apikey',key);
   return fetch(input,{...init,headers});
  }},
 });
 const [postings,run]=await Promise.all([
  publicClient.from('postings').select('id,firm,title,location,firm_type,focus,sectors,role_type,date_posted,deadline,rolling,url,nyc,mentions_mba,expired,last_verified_at,needs_review,last_checked_at,fund_stage,mba_specific,alumni,notes,shared_by_vcc').eq('hidden',false).eq('expired',false).order('date_posted',{ascending:false}),
  publicClient.rpc('board_last_verified'),
 ]);
 if(postings.error)throw new Error('The board could not load.');
 if(run.error)throw new Error('Verification history could not load.');
 return {postings:postings.data.filter(posting=>isAssociatePosition(posting.title)),lastVerified:run.data};
});
