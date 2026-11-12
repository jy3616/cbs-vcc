import {describe,it,expect} from 'vitest';
import {otpRequest,isStudentEmail} from '@/lib/student';
describe('account creation rules',()=>{
 it('sign-in never creates an account',()=>expect(otpRequest('signin','A@gsb.columbia.edu','x').options.shouldCreateUser).toBe(false));
 it('create account creates one with the name',()=>{const r=otpRequest('signup','a@gsb.columbia.edu','x','Ann');expect(r.options.shouldCreateUser).toBe(true);expect(r.options.data?.display_name).toBe('Ann');});
 it('still rejects non-CBS emails',()=>expect(isStudentEmail('a@columbia.edu')).toBe(false));
});
