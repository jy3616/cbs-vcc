import { createMiddleware } from '@tanstack/react-start';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { isStudentEmail } from './student';
export const requireStudent = createMiddleware({type:'function'}).middleware([requireSupabaseAuth]).server(async ({context,next}) => {
 const {data,error} = await context.supabase.auth.getUser();
 if(error || !data.user?.email_confirmed_at || !isStudentEmail(data.user.email)) throw new Error('Verified Columbia Business School email required.');
 return next({context});
});
