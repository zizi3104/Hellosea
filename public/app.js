const form = document.querySelector('#inquiry-form');
const status = document.querySelector('#form-status');
const availability = document.querySelector('#availability');
const submit = form.querySelector('[type=submit]');
const date = form.elements.preferredDate;
const dateParts = ['year','month','day'].map(part => document.querySelector(`#date-${part}`));
const now = new Date();
function lombokISO(value) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en', {timeZone:'Asia/Makassar', year:'numeric', month:'2-digit', day:'2-digit'}).formatToParts(value).map(p => [p.type,p.value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}
const today = lombokISO(now);
const maxDate = new Date(now); maxDate.setUTCFullYear(maxDate.getUTCFullYear() + 2);
const latest = lombokISO(maxDate);
function uuid() {
  if (globalThis.crypto?.randomUUID) return crypto.randomUUID();
  const bytes = crypto.getRandomValues(new Uint8Array(16)); bytes[6]=(bytes[6]&15)|64; bytes[8]=(bytes[8]&63)|128;
  const h=Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
  return `${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20)}`;
}
let lastInquiryText='';
let requestId=uuid(), payloadSignature='', ready=false, sending=false, replyEmail='';
let availabilityKey='checking', errorKey='', whatsappNumber='6287861136585',contactEmail='hellosea@hellosealombok.com';
const previewMode = document.documentElement.dataset.preview === 'true';
function dateValue(parts) {
  if (parts.every(v => !v)) return {value:''};
  if (parts.some(v => !v)) return {error:'dateError'};
  const value = `${parts[0]}-${parts[1].padStart(2,'0')}-${parts[2].padStart(2,'0')}`;
  const d = new Date(`${value}T00:00:00Z`);
  if (!Number.isFinite(d.getTime()) || d.toISOString().slice(0,10)!==value || value<today || value>latest) return {error:'dateRange'};
  return {value};
}
function renderDateOptions() {
  const values = dateParts.map(el => el.value);
  const year=Number(values[0]), month=Number(values[1]);
  const days = month ? new Date(Date.UTC(year||2000,month,0)).getUTCDate() : 31;
  const ranges = [Array.from({length:3},(_,i)=>Number(today.slice(0,4))+i),Array.from({length:12},(_,i)=>i+1),Array.from({length:days},(_,i)=>i+1)];
  dateParts.forEach((el,i) => {
    const key=['year','month','day'][i]; el.replaceChildren(new Option(t(key),'')); el.setAttribute('aria-label',t(key));
    ranges[i].forEach(n => {
      let label=String(n);
      if (i===1) label=new Intl.DateTimeFormat(language,{month:'short',timeZone:'UTC'}).format(new Date(Date.UTC(2000,n-1,1)));
      else if (language==='ko') label+=i===0?'년':'일';
      else if (language==='ja') label+=i===0?'年':'日';
      el.add(new Option(label,String(n)));
    });
    el.value = [...el.options].some(o => o.value===values[i]) ? values[i] : '';
  });
  date.value=dateValue(dateParts.map(el=>el.value)).value||'';
}
function renderState() {
  document.querySelectorAll('[data-email-contact]').forEach(el=>{el.hidden=!contactEmail;if(contactEmail)el.href=`mailto:${contactEmail}?subject=${encodeURIComponent(t('emailSubject'))}`;});
  availability.hidden=ready;
  availability.textContent=t(availabilityKey);
  submit.disabled=!ready||sending; submit.textContent=t(sending?'sending':'send');
  status.textContent=errorKey?t(errorKey):'';
  document.querySelector('#reply-email').textContent=replyEmail;
}
function showError(key,field) {
  form.querySelectorAll('[aria-invalid]').forEach(el=>el.removeAttribute('aria-invalid'));
  errorKey=key;renderState();
  if (field) {field.setAttribute('aria-invalid','true');field.setAttribute('aria-describedby','form-status');field.focus();}
  else status.focus();
}
function validateFields() {
  const el=form.elements;
  if (el.name.value.trim().length<2||el.name.value.trim().length>100||/[\x00-\x1f]/.test(el.name.value)) return ['nameError',el.name];
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(el.email.value.trim())||el.email.value.length>254) return ['emailError',el.email];
  const checkedDate=dateValue(dateParts.map(e=>e.value));
  if (checkedDate.error) return [checkedDate.error,dateParts.find(e=>!e.value)||dateParts[0]];
  date.value=checkedDate.value;
  if (!Number.isInteger(Number(el.people.value))||Number(el.people.value)<1||Number(el.people.value)>8) return ['peopleError',el.people];
  if (!['first-time','beginner','improving','not-sure'].includes(el.level.value)) return ['levelError',el.level];
  const phone=el.phone.value.trim();
  if (phone&&(!/^[+0-9()\s-]{7,25}$/.test(phone)||phone.replace(/\D/g,'').length<7||phone.replace(/\D/g,'').length>15)) return ['phoneError',el.phone];
  if (el.message.value.length>1800) return ['messageError',el.message];
  if (!el.consent.checked) return ['consentError',el.consent];
  return null;
}
dateParts.forEach(el=>el.addEventListener('change',renderDateOptions));
document.addEventListener('languagechange',()=>{renderDateOptions();renderState();});
renderDateOptions();renderState();
document.querySelectorAll('[data-level]').forEach(button=>button.addEventListener('click',()=>{
 form.elements.level.value=button.dataset.level;
 document.querySelector('#inquire').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
 form.elements.name.focus({preventScroll:true});
}));
const dialog=document.querySelector('#privacy-dialog');
document.querySelector('#privacy-open').addEventListener('click',()=>dialog.showModal());
document.querySelector('#privacy-close').addEventListener('click',()=>dialog.close());
dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
async function loadConfig() {
 if(previewMode){availabilityKey='preview';renderState();return;}
 try {
  const response=await fetch('/api/config',{signal:AbortSignal.timeout(8000)});
  if(!response.ok)throw new Error();
  const config=await response.json();ready=config.inquiriesEnabled===true;
  if(typeof config.contactEmail==='string'&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(config.contactEmail))contactEmail=config.contactEmail;
  if(config.whatsappNumber&&/^\d{8,15}$/.test(config.whatsappNumber))whatsappNumber=config.whatsappNumber;
  availabilityKey=ready?'checking':'unavailable';
 }catch{availabilityKey='offline';}
 renderState();
}
loadConfig();
form.addEventListener('submit',async event=>{
 event.preventDefault();if(sending)return;
 if(!ready){showError(previewMode?'preview':availabilityKey,null);return;}
 const error=validateFields();if(error){showError(...error);return;}
 form.querySelectorAll('[aria-invalid]').forEach(el=>el.removeAttribute('aria-invalid'));
 const fields=Object.fromEntries(new FormData(form));fields.consent=form.elements.consent.checked;fields.people=Number(fields.people);
 const signature=JSON.stringify(fields);if(payloadSignature&&signature!==payloadSignature)requestId=uuid();payloadSignature=signature;fields.requestId=requestId;
 sending=true;errorKey='';renderState();
 try {
  const response=await fetch('/api/inquiries',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(fields),signal:AbortSignal.timeout(14000)});
  if(!response.ok)throw Object.assign(new Error(),{status:response.status});
  const result=await response.json();if(result.ok!==true)throw new Error();
  lastInquiryText=inquiryWhatsAppText();replyEmail=fields.email.trim();form.hidden=true;const success=document.querySelector('#success');success.hidden=false;renderState();success.focus();
 }catch(error){showError(error.status===429?'limited':error.status===400?'checkDetails':'sendError',null);}
 finally{sending=false;renderState();}
});
document.querySelector('#another').addEventListener('click',()=>{
 form.reset();dateParts.forEach(el=>el.value='');requestId=uuid();payloadSignature='';replyEmail='';errorKey='';
 form.querySelectorAll('[aria-invalid]').forEach(el=>el.removeAttribute('aria-invalid'));
 document.querySelector('#success').hidden=true;form.hidden=false;renderDateOptions();renderState();form.elements.name.focus();
});

// Keep anchor positions clear of the header after resizing or changing language.
const stickyHeader=document.querySelector('.header');
function syncHeaderHeight(){document.documentElement.style.setProperty('--header-height',`${Math.ceil(stickyHeader.getBoundingClientRect().height)}px`);}
syncHeaderHeight();
if(typeof ResizeObserver!=='undefined')new ResizeObserver(syncHeaderHeight).observe(stickyHeader);
window.addEventListener('resize',syncHeaderHeight);
document.addEventListener('languagechange',()=>requestAnimationFrame(syncHeaderHeight));
document.querySelectorAll('a[href="#main"]').forEach(link=>link.addEventListener('click',()=>document.querySelector('#main').focus({preventScroll:true})));

// Account for the secondary sticky bar when jumping to lesson sections.
const ayoNavBar=document.querySelector('.ayo-nav-bar');
const ayoSections=[...document.querySelectorAll('#ayosurf > section[id]')];
const ayoNavLinks=[...document.querySelectorAll('.ayo-links a')];
function syncAyoNavigation(){
 document.documentElement.style.setProperty('--ayo-nav-height',`${Math.ceil(ayoNavBar.getBoundingClientRect().height)}px`);
 const marker=stickyHeader.getBoundingClientRect().height+ayoNavBar.getBoundingClientRect().height+24;
 let current=ayoSections[0]?.id;
 for(const section of ayoSections){if(section.getBoundingClientRect().top<=marker)current=section.id;}
 for(const link of ayoNavLinks){if(link.hash===`#${current}`)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current');}
}
syncAyoNavigation();
if(typeof ResizeObserver!=='undefined'){
 const ayoObserver=new ResizeObserver(syncAyoNavigation);ayoObserver.observe(ayoNavBar);ayoObserver.observe(stickyHeader);
}
let ayoScrollQueued=false;
window.addEventListener('scroll',()=>{if(ayoScrollQueued)return;ayoScrollQueued=true;requestAnimationFrame(()=>{syncAyoNavigation();ayoScrollQueued=false;});},{passive:true});
document.addEventListener('languagechange',()=>requestAnimationFrame(syncAyoNavigation));
window.addEventListener('resize',syncAyoNavigation);

function inquiryWhatsAppText(){const e=form.elements;return buildWhatsAppInquiry({name:e.name.value.trim(),email:e.email.value.trim(),date:date.value,people:e.people.value,plan:e.planKey.selectedOptions[0]?.textContent,total:e.planKey.value?document.querySelector('#pricing-total').textContent:'',level:e.level.selectedOptions[0]?.textContent,phone:e.phone.value.trim(),message:e.message.value.trim()},language);}
function openInquiryWhatsApp(text){
 const links=buildWhatsAppLinks(whatsappNumber,text);
 // Use WhatsApp's official universal link so the complete encoded message
 // is preserved when handing off to WhatsApp on desktop or mobile.
 window.location.href=links.universal;
}
document.querySelector('#form-whatsapp-send').addEventListener('click',()=>{const error=validateFields();if(error){showError(...error);return;}form.querySelectorAll('[aria-invalid]').forEach(el=>el.removeAttribute('aria-invalid'));errorKey='waFormOpened';renderState();openInquiryWhatsApp(inquiryWhatsAppText());});
document.querySelector('#success-whatsapp').addEventListener('click',()=>{if(lastInquiryText)openInquiryWhatsApp(lastInquiryText);});
