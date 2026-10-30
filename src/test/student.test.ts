import {describe,it,expect} from 'vitest';
import {isStudentEmail,APPLICATION_STATUSES,FUND_STAGES,postedDays} from '@/lib/student';
import {narrativeSchema,scoreRequirements} from '@/lib/fit';
describe('student rules',()=>{
 it('allows only the exact CBS email domain',()=>{expect(isStudentEmail('joyoun27@gsb.columbia.edu')).toBe(true);expect(isStudentEmail('student@columbia.edu')).toBe(false);expect(isStudentEmail('student@gsb.columbia.edu.evil.com')).toBe(false);expect(isStudentEmail('outsider@gmail.com')).toBe(false);});
 it('includes exactly the five application states',()=>expect(APPLICATION_STATUSES).toEqual(['Interested','Applied','Interviewing','Offer','Closed']));
 it('includes the requested five stages',()=>expect(FUND_STAGES).toEqual(['pre-seed','seed','Series A','growth','multi-stage']));
 it('reports posting age in whole days',()=>expect(postedDays('2026-10-27','2026-10-30')).toBe(3));
 it('bounds weighted score between zero and 100',()=>{expect(scoreRequirements([])).toBe(0);expect(scoreRequirements([{requirement:'MBA',source:'MBA required',importance:'must',verdict:'met',evidence:'MBA candidate',reasoning:'Evidence supplied'}])).toBe(100);});
 it('requires three strengths and two or three resume bullets',()=>{const base={strengths:['a','b','c'],gaps:[],resumeTips:['a','b'],behavioralQuestions:[],technicalQuestions:[]};expect(narrativeSchema.safeParse(base).success).toBe(true);expect(narrativeSchema.safeParse({...base,strengths:['a']}).success).toBe(false);expect(narrativeSchema.safeParse({...base,resumeTips:['a']}).success).toBe(false);expect(narrativeSchema.safeParse({...base,resumeTips:['a','b','c','d']}).success).toBe(false);});
});
