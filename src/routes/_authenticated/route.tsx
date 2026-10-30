import {createFileRoute,Outlet,redirect} from '@tanstack/react-router';
import {supabase} from '@/integrations/supabase/client';
import {isStudentEmail} from '@/lib/student';
export const Route=createFileRoute('/_authenticated')({ssr:false,beforeLoad:async()=>{const {data,error}=await supabase.auth.getUser();if(error||!data.user?.email_confirmed_at||!isStudentEmail(data.user.email))throw redirect({to:'/auth'});return {studentId:data.user.id};},component:Outlet});
