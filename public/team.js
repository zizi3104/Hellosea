(() => {
 const node=document.getElementById('team-data');
 let data=JSON.parse(node.textContent);
 const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined&&text!==null)n.textContent=text;if(cls)n.className=cls;return n;};
 const profilePhotos={
  Yudha:[
   {thumb:'/assets/team/yudha-01-9283-thumb.jpg',full:'/assets/team/yudha-01-9283-full.jpg',width:1608,height:3456,position:'50% 55%',alt:{en:'Yudha longboarding on a clean wave in Lombok',ko:'롬복의 잔잔한 파도 위에서 롱보드를 타는 Yudha',ja:'ロンボクの穏やかな波でロングボードに乗るYudha'}},
   {thumb:'/assets/team/yudha-02-1905-thumb.jpg',full:'/assets/team/yudha-02-1905-full.jpg',width:6000,height:4000,position:'50% 50%',alt:{en:'Yudha surfing through a burst of spray',ko:'물보라를 가르며 서핑하는 Yudha',ja:'水しぶきを上げながらサーフィンするYudha'}},
   {thumb:'/assets/team/yudha-03-0000-thumb.jpg',full:'/assets/team/yudha-03-0000-full.jpg',width:1242,height:2208,position:'50% 42%',alt:{en:'Yudha riding out by boat for a morning surf session',ko:'아침 서핑을 위해 보트를 타고 나가는 Yudha',ja:'朝のサーフィンへボートで向かうYudha'}}
  ]
 };
 const dialog=el('dialog',null,'team-photo-dialog');dialog.setAttribute('aria-labelledby','team-photo-title');
 const toolbar=el('div',null,'team-photo-toolbar');
 const prev=el('button','←');prev.type='button';
 const position=el('span','');
 const next=el('button','→');next.type='button';
 const close=el('button','×');close.type='button';close.className='team-photo-close';
 const full=el('img');full.className='team-photo-full';
 const title=el('h3','Yudha');title.id='team-photo-title';
 const caption=el('p','', 'team-photo-caption');
 toolbar.append(prev,position,next,close);dialog.append(toolbar,full,title,caption);document.body.append(dialog);
 let activePhotos=[],activeIndex=0,opener=null,activeName='';
 const localText=value=>value?.[language]||value?.en||'';
 const controlLabels=()=>language==='ko'?{prev:'이전 사진',next:'다음 사진',close:'사진 닫기'}:language==='ja'?{prev:'前の写真',next:'次の写真',close:'写真を閉じる'}:{prev:'Previous photo',next:'Next photo',close:'Close photo'};
 function showPhoto(){
  const photo=activePhotos[activeIndex],labels=controlLabels();if(!photo)return;
  full.src=photo.full;full.alt=localText(photo.alt);full.width=photo.width;full.height=photo.height;
  title.textContent=activeName;caption.textContent=localText(photo.alt);position.textContent=`${activeIndex+1} / ${activePhotos.length}`;
  prev.disabled=next.disabled=activePhotos.length<2;prev.setAttribute('aria-label',labels.prev);next.setAttribute('aria-label',labels.next);close.setAttribute('aria-label',labels.close);
 }
 function movePhoto(step){activeIndex=(activeIndex+step+activePhotos.length)%activePhotos.length;showPhoto();}
 function openPhoto(photos,index,button,name){activePhotos=photos;activeIndex=index;opener=button;activeName=name;showPhoto();dialog.showModal();close.focus();}
 prev.addEventListener('click',()=>movePhoto(-1));next.addEventListener('click',()=>movePhoto(1));close.addEventListener('click',()=>dialog.close());
 dialog.addEventListener('keydown',event=>{if(event.key==='ArrowLeft'){event.preventDefault();movePhoto(-1);}if(event.key==='ArrowRight'){event.preventDefault();movePhoto(1);}});
 dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close();});
 dialog.addEventListener('close',()=>{full.removeAttribute('src');if(opener?.isConnected)opener.focus();});
 function photoLabel(name,index){if(language==='ko')return `${name} 사진 ${index+1} 원본 크기로 보기`;if(language==='ja')return `${name}の写真${index+1}を大きく表示`;return `View ${name} photo ${index+1} full size`;}
 function renderMedia(person,card){
  const photos=profilePhotos[person.name]||[];
  if(photos.length){
   const frame=el('div',null,photos.length===3?'team-triptych':'team-photo-frame');frame.setAttribute('aria-label',`${person.name} photos`);
   photos.forEach((photo,index)=>{const button=el('button',null,'team-photo-button');button.type='button';button.setAttribute('aria-label',photoLabel(person.name,index));const img=el('img');img.src=photo.thumb;img.alt=localText(photo.alt);img.loading='lazy';img.decoding='async';img.style.objectPosition=photo.position;button.append(img);button.addEventListener('click',()=>openPhoto(photos,index,button,person.name));frame.append(button);});
   card.append(frame);return;
  }
  if(person.photo){const img=el('img');img.src=person.photo;img.alt=person.name;img.width=600;img.height=650;card.append(img);return;}
  const placeholder=el('div',null,'team-placeholder');placeholder.append(el('strong',person.name[0]),el('span',t('teamPhoto')));card.append(placeholder);
 }
 function render(){
  document.querySelector('.team-sample').hidden=data.sample===false;
  document.getElementById('team-intro').textContent=data.intro[language];
  const cards=document.getElementById('team-cards');cards.replaceChildren();
  data.people.forEach(person=>{const card=el('article',null,'team-card');renderMedia(person,card);const body=el('div',null,'team-card-body');body.append(el('p','AYO SURF','eyebrow'),el('h3',person.name),el('p',person.bio[language]));card.append(body);cards.append(card);});
 }
 render();document.addEventListener('languagechange',()=>{render();if(dialog.open)showPhoto();});
 if(document.documentElement.dataset.preview!=='true')fetch('/api/content',{cache:'no-store'}).then(r=>r.ok?r.json():null).then(result=>{if(result?.content){data=result.content;render();}}).catch(()=>{});
})();
