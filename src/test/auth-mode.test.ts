import {describe,it,expect} from 'vitest';
import {validPassword,isStudentEmail} from '@/lib/student';
describe('account rules',()=>{
 it('requires at least 8 password characters',()=>{expect(validPassword('1234567')).toBe(false);expect(validPassword('12345678')).toBe(true);});
 it('still rejects non-CBS emails',()=>expect(isStudentEmail('a@columbia.edu')).toBe(false));
});
