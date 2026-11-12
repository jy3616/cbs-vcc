import {createFileRoute,useNavigate} from '@tanstack/react-router';
import {useState} from 'react';
import {supabase} from '@/integrations/supabase/client';
import {BrandLockup} from '@/components/BrandLockup';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {validPassword} from '@/lib/student';
export const Route=createFileRoute('/reset-password')({head:()=>({meta:[{title:'Reset password · CBS Venture Capital Club Job Board'},{name:'description',content:'Choose a new password for your student account.'},{property:'og:title',content:'Reset your CBS Venture Capital Club Job Board password'},{property:'og:description',content:'Set a new student account password.'},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary'}]}),component:Reset});
function Reset(){const [pw,setPw]=useState('');const [error,setError]=useState('');const [busy,setBusy]=useState(false);const navigate=useNavigate();
 async function save(e:React.FormEvent){e.preventDefault();setError('');if(!validPassword(pw)){setError('Password must be at least 8 characters.');return;}setBusy(true);const {error}=await supabase.auth.updateUser({password:pw});setBusy(false);if(error)setError(error.message);else void navigate({to:'/',replace:true});}
 return <main className="mx-auto max-w-md px-6 py-16 sm:py-24"><BrandLockup asLink={false}/><h1 className="mt-10 text-xl">Choose a new password</h1><form onSubmit={save} className="mt-5 space-y-4"><label className="block text-sm">New password<Input className="mt-2" type="password" autoComplete="new-password" required minLength={8} value={pw} onChange={e=>setPw(e.target.value)}/></label><Button className="w-full" disabled={busy}>{busy?'Saving…':'Save password'}</Button></form>{error&&<p role="alert" className="mt-4 text-sm text-destructive">{error}</p>}</main>;}
