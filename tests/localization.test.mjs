import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const read = name => readFileSync(new URL(`../public/${name}`,import.meta.url),'utf8');
const i18n=read('i18n.js'),app=read('app.js'),html=read('index.html');
const i18nPrelude=i18n.slice(0,i18n.indexOf("let language ="));
const dictionary = vm.runInNewContext(i18nPrelude+'translations');
const pageMetadata = vm.runInNewContext(i18nPrelude+'pageMeta');
test('Every visible translation and dynamic state has all three language versions',()=>{
 const keys=[...html.matchAll(/data-i18n(?:-(?:placeholder|aria-label|alt))?="([^"]+)"/g)].map(m=>m[1]);
 const dynamic=[...app.matchAll(/\bt\('([^']+)'\)/g)].map(m=>m[1]);
 for(const key of [...keys,...dynamic])assert.ok(dictionary[key],`Missing key ${key}`);
 for(const [key,entry] of Object.entries(dictionary))for(const lang of ['en','ko','ja'])assert.ok(typeof entry[lang]==='string'&&entry[lang].trim(),`${key}/${lang}`);
 for(const page of ['home','story','surf','photos','faq','booking'])for(const field of ['title','description'])for(const lang of ['en','ko','ja'])assert.ok(pageMetadata[page][field][lang].trim(),`${page}/${field}/${lang}`);
 assert.ok(!html.includes('type="date"'));assert.ok(html.includes('novalidate'));assert.equal(dictionary.year.en,'Year');
});
function functionSource(name,next) {return app.slice(app.indexOf(`function ${name}(`),app.indexOf(`function ${next}(`));}
const dateContext=vm.createContext({today:'2026-09-21',latest:'2028-09-21'});
vm.runInContext(functionSource('dateValue','renderDateOptions'),dateContext);
const date=parts=>dateContext.dateValue(parts);
test('Optional dates, partial dates, leap years and Lombok booking bounds',()=>{
 assert.equal(date(['','','']).value,'');
 assert.equal(date(['2027','','2']).error,'dateError');
 assert.equal(date(['2026','9','21']).value,'2026-09-21');
 assert.equal(date(['2026','9','20']).error,'dateRange');
 assert.equal(date(['2027','2','29']).error,'dateRange');
 assert.equal(date(['2028','2','29']).value,'2028-02-29');
 assert.equal(date(['2028','9','21']).value,'2028-09-21');
 assert.equal(date(['2028','9','22']).error,'dateRange');
 assert.equal(date(['2027','4','31']).error,'dateRange');
});
test('Language switches update locale and metadata without replacing form controls',()=>{
 const fields={name:{value:'Ssong'},email:{value:'ssong@example.com'}};
 const nodes=[{dataset:{i18n:'nameLabel'},innerHTML:''}];
 const buttons=['en','ko','ja'].map(lang=>({dataset:{lang},setAttribute(k,v){this[k]=v;},addEventListener(){}}));
 const meta={};let notifications=0;
 const document={documentElement:{lang:'en'},body:{dataset:{page:'story'}},querySelector:()=>meta,querySelectorAll:sel=>sel==='[data-lang]'?buttons:sel==='[data-i18n]'?nodes:[],dispatchEvent(){notifications++;},fields};
 const context=vm.createContext({localStorage:{getItem:()=>null,setItem(){}},Event:class{constructor(type){this.type=type;}},document});
 vm.runInContext(i18n,context);
 assert.equal(context.document.documentElement.lang,'en');
 vm.runInContext("setLanguage('ja')",context);assert.equal(context.document.documentElement.lang,'ja');assert.equal(nodes[0].innerHTML,'お名前');assert.equal(document.title,'私たちの物語 · HELLO SEA ロンボク');assert.ok(meta.content.includes('グルプック'));
 vm.runInContext("setLanguage('ko')",context);assert.equal(nodes[0].innerHTML,'이름');assert.equal(fields.name.value,'Ssong');assert.equal(fields.email.value,'ssong@example.com');assert.equal(buttons[1]['aria-pressed'],'true');assert.equal(notifications,3);
});
