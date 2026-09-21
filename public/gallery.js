(() => {
 const photos=JSON.parse(document.querySelector('#gallery-data').textContent);
 const byId=new Map(photos.map(p=>[p.id,p]));
 const dialog=document.querySelector('#photo-dialog');
 let filter='all',currentId=null,opener=null;
 const text=(p,key)=>p[key][language]||p[key].en;
 const visible=()=>photos.filter(p=>filter==='all'||p.category===filter);
 function credit(p){
  const el=document.querySelector('#photo-credit');el.replaceChildren(document.createTextNode(`${p.author} · `));
  for(const [label,url] of [[t('photoSource'),p.source],[p.license,p.licenseUrl]]){
   const a=document.createElement('a');a.textContent=label;a.href=url;a.target='_blank';a.rel='noopener noreferrer';el.append(a,document.createTextNode(' · '));
  }
  el.lastChild.remove();
 }
 function renderDialog(){
  const p=byId.get(currentId);if(!p)return;
  const img=document.querySelector('#photo-full');img.src=p.src;img.alt=text(p,'alt');
  document.querySelector('#photo-title').textContent=text(p,'title');
  document.querySelector('#photo-location').textContent=text(p,'location');credit(p);
  const list=visible();let index=list.findIndex(item=>item.id===currentId);
  document.querySelector('#photo-position').textContent=index>=0?`${index+1} / ${list.length}`:'';
  document.querySelector('#photo-prev').disabled=list.length<2;document.querySelector('#photo-next').disabled=list.length<2;
 }
 function render(){
  document.querySelectorAll('[data-photo-text]').forEach(el=>{const [id,key]=el.dataset.photoText.split(':');el.textContent=text(byId.get(id),key);});
  document.querySelectorAll('[data-photo-alt]').forEach(el=>{el.alt=text(byId.get(el.dataset.photoAlt),'alt');});
  document.querySelectorAll('[data-open-photo]').forEach(el=>el.setAttribute('aria-label',`${t('photoOpen')}: ${text(byId.get(el.dataset.openPhoto),'title')}`));
  document.querySelectorAll('[data-filter]').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.filter===filter)));
  document.querySelectorAll('.gallery-card').forEach(el=>{el.hidden=filter!=='all'&&el.dataset.category!==filter;});
  document.querySelector('#gallery-count').textContent=`${visible().length} ${t('photoCount')}`;
  if(dialog.open)renderDialog();
 }
 document.querySelectorAll('[data-filter]').forEach(el=>el.addEventListener('click',()=>{filter=el.dataset.filter;render();}));
 document.querySelectorAll('[data-open-photo]').forEach(el=>el.addEventListener('click',()=>{
  currentId=el.dataset.openPhoto;opener=el;
  if(!visible().some(p=>p.id===currentId)){filter='all';render();}
  renderDialog();dialog.showModal();document.querySelector('#photo-close').focus();
 }));
 function move(delta){const list=visible();const i=list.findIndex(p=>p.id===currentId);currentId=list[(i+delta+list.length)%list.length].id;renderDialog();}
 document.querySelector('#photo-prev').addEventListener('click',()=>move(-1));
 document.querySelector('#photo-next').addEventListener('click',()=>move(1));
 document.querySelector('#photo-close').addEventListener('click',()=>dialog.close());
 dialog.addEventListener('close',()=>{if(opener?.isConnected)opener.focus();});
 dialog.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'){e.preventDefault();move(-1);}if(e.key==='ArrowRight'){e.preventDefault();move(1);}});
 dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
 document.addEventListener('languagechange',render);render();
})();
