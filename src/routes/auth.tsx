import {createFileRoute,useNavigate} from '@tanstack/react-router';
import {useEffect,useState} from 'react';
import {supabase} from '@/integrations/supabase/client';
import {BrandLockup} from '@/components/BrandLockup';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {isStudentEmail} from '@/lib/student';
import {useStudent} from '@/lib/auth';
export const Route=createFileRoute('/auth')({head:()=>({meta:[{title:'Student sign-in · CBS Venture Capital Club Job Board'},{name:'description',content:'Sign in with your Columbia Business School email.'},{property:'og:title',content:'CBS Venture Capital Club student sign-in'},{property:'og:description',content:'Verified Columbia Business School student access.'},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary'}]}),component:SignIn});
function SignIn(){const [email,setEmail]=useState('');const [busy,setBusy]=useState(false);const [sent,setSent]=useState(false);const [error,setError]=useState('');const {user}=useStudent();const navigate=useNavigate();useEffect(()=>{if(user)void navigate({to:'/',replace:true});},[user,navigate]);
 async function send(e:React.FormEvent){e.preventDefault();setError('');if(!isStudentEmail(email)){setError('Use your @gsb.columbia.edu email address.');return;}setBusy(true);const {error}=await supabase.auth.signInWithOtp({email:email.trim().toLowerCase(),options:{emailRedirectTo:`${window.location.origin}/auth`}});setBusy(false);if(error)setError(error.message);else setSent(true);}
 return <main className="mx-auto max-w-md px-6 py-16 sm:py-24"><BrandLockup asLink={false}/><p className="mt-10 text-sm text-muted-foreground">Columbia Business School</p><h1 className="mt-2 text-3xl text-primary font-bold">CBS Venture Capital Club<br/>Job Board</h1><h2 className="mt-10 text-xl">Student sign-in</h2><form onSubmit={send} className="mt-5 space-y-4"><label className="block text-sm">School email<Input className="mt-2" type="email" required autoComplete="email" value={email} onChange={e=>{setEmail(e.target.value);setSent(false);}} placeholder="you@gsb.columbia.edu"/></label><Button className="w-full" disabled={busy}>{busy?'Sending…':sent?'Send another sign-in link':'Email me a sign-in link'}</Button></form>{sent&&<p role="status" className="mt-4 text-sm">Check your inbox for a secure sign-in link. No password needed.</p>}{error&&<p role="alert" className="mt-4 text-sm text-destructive">{error}</p>}<p className="mt-6 text-xs text-muted-foreground">Access is limited to verified @gsb.columbia.edu addresses.</p></main>;
}
