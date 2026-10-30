import {createServerFn} from '@tanstack/react-start';
import {requireStudent} from './student-middleware';
export const getBoardData=createServerFn({method:'GET'}).middleware([requireStudent]).handler(async({context})=>{
 const [postings,run]=await Promise.all([context.supabase.from('postings').select('*').eq('hidden',false).order('date_posted',{ascending:false}),context.supabase.rpc('board_last_verified')]);
 if(postings.error)throw new Error('The board could not load.');if(run.error)throw new Error('Verification history could not load.');return {postings:postings.data,lastVerified:run.data};
});
