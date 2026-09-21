import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {validateInquiry} from '../lib/validation.js';
const base=()=>({requestId:randomUUID(),name:'Test Surfer',email:'test@example.com',people:2,level:'beginner',consent:true,message:'x'.repeat(1800)});
test('Selected plan uses server prices and fits stored message limit',()=>{const result=validateInquiry({...base(),planKey:'three',price:1,total:2});assert.ok(result.value);assert.ok(result.value.message.includes('IDR 2700000'));assert.ok(result.value.message.length<=2000);assert.ok(validateInquiry({...base(),planKey:'invented'}).error);assert.ok(validateInquiry({...base(),message:'x'.repeat(1801)}).error);assert.equal(validateInquiry(base()).value.message.length,1800);});
