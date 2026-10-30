import {createContext,useContext,useEffect,useState,type ReactNode} from 'react';
import {useRouter} from '@tanstack/react-router';
import {useQueryClient} from '@tanstack/react-query';
import type {User} from '@supabase/supabase-js';
import {supabase} from '@/integrations/supabase/client';
import {isStudentEmail} from './student';
const AuthContext=createContext<{user:User|null;admin:boolean;signOut:()=>Promise<void>}>({user:null,admin:false,signOut:async()=>{}});
export const useStudent=()=>useContext(AuthContext);
export function StudentProvider({children}:{children:ReactNode}){
 const [user,setUser]=useState<User|null>(null);const [admin,setAdmin]=useState(false);const router=useRouter();const qc=useQueryClient();
 useEffect(()=>{let live=true;
 const refresh=async()=>{const {data}=await supabase.auth.getUser();const u=data.user?.email_confirmed_at&&isStudentEmail(data.user.email)?data.user:null;if(!live)return;setUser(u);if(u){const {data:role}=await supabase.rpc('has_role',{_user_id:u.id,_role:'admin'});if(live)setAdmin(!!role);}else setAdmin(false);};
 void refresh();const {data:{subscription}}=supabase.auth.onAuthStateChange(event=>{if(!['SIGNED_IN','SIGNED_OUT','USER_UPDATED'].includes(event))return;queueMicrotask(()=>{void refresh();void router.invalidate();if(event!=='SIGNED_OUT')void qc.invalidateQueries();});});return()=>{live=false;subscription.unsubscribe();};
 },[router,qc]);
 async function signOut(){await qc.cancelQueries();qc.clear();localStorage.removeItem('vcc-fit-analyses');await supabase.auth.signOut();setUser(null);setAdmin(false);await router.navigate({to:'/auth',replace:true});}
 return <AuthContext.Provider value={{user,admin,signOut}}>{children}</AuthContext.Provider>;
}
