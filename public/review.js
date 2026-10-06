(() => {
 const section=document.querySelector('[data-page-panel="review"]');
 if(!section)return;
 const original=document.getElementById('review-original');
 const english=document.getElementById('review-english');
 const translate=document.getElementById('review-translate');
 const copy=document.getElementById('review-copy');
 const status=document.getElementById('review-status');
 const input=document.getElementById('review-media');
 const previews=document.getElementById('review-media-preview');
 const empty=document.getElementById('review-media-empty');
 const clear=document.getElementById('review-media-clear');
 const maps=document.getElementById('review-google');
 const MAX_FILES=10,MAX_FILE_BYTES=100*1024*1024,MAX_TOTAL_BYTES=300*1024*1024;
 let objectUrls=[];
 const text=key=>typeof t==='function'?t(key):key;
 const announce=key=>{status.textContent=text(key);status.focus();};
 function openTranslation(){
  const value=original.value.trim();
  if(!value){announce('reviewWriteFirst');original.focus();return;}
  const url=new URL('https://translate.google.com/');
  url.searchParams.set('sl','auto');url.searchParams.set('tl','en');url.searchParams.set('text',value);url.searchParams.set('op','translate');
  window.open(url.toString(),'_blank','noopener,noreferrer');
  announce('reviewTranslateOpened');
 }
 async function copyEnglish(){
  const value=english.value.trim();
  if(!value){announce('reviewEnglishFirst');english.focus();return;}
  try{await navigator.clipboard.writeText(value);}catch{
   english.select();document.execCommand('copy');english.setSelectionRange(value.length,value.length);
  }
  announce('reviewCopied');
 }
 function clearUrls(){for(const url of objectUrls)URL.revokeObjectURL(url);objectUrls=[];}
 function removeFile(index){
  const files=[...input.files];files.splice(index,1);
  const transfer=new DataTransfer();for(const file of files)transfer.items.add(file);input.files=transfer.files;renderMedia();
 }
 function renderMedia(){
  clearUrls();previews.replaceChildren();
  const files=[...input.files];empty.hidden=files.length>0;clear.hidden=files.length===0;
  files.forEach((file,index)=>{
   const card=document.createElement('article');card.className='review-media-card';
   const url=URL.createObjectURL(file);objectUrls.push(url);
   const media=file.type.startsWith('video/')?document.createElement('video'):document.createElement('img');
   media.src=url;if(media.tagName==='VIDEO'){media.controls=true;media.preload='metadata';media.playsInline=true;}else media.alt=file.name;
   const details=document.createElement('div');details.className='review-media-meta';
   const name=document.createElement('span');name.textContent=file.name;
   const remove=document.createElement('button');remove.type='button';remove.textContent='×';remove.setAttribute('aria-label',`${text('reviewRemoveMedia')} ${file.name}`);remove.addEventListener('click',()=>removeFile(index));
   details.append(name,remove);card.append(media,details);previews.append(card);
  });
  if(files.length)status.textContent=text('reviewMediaReady').replace('{count}',String(files.length));
 }
 function validateFiles(){
  const files=[...input.files];
  if(files.length>MAX_FILES){input.value='';announce('reviewTooManyFiles');renderMedia();return;}
  if(files.some(file=>file.size>MAX_FILE_BYTES)||files.reduce((sum,file)=>sum+file.size,0)>MAX_TOTAL_BYTES){input.value='';announce('reviewFilesTooLarge');renderMedia();return;}
  if(files.some(file=>!/^image\/(jpeg|png|webp)$|^video\/(mp4|quicktime|webm)$/.test(file.type))){input.value='';announce('reviewUnsupportedFile');renderMedia();return;}
  renderMedia();
 }
 translate.addEventListener('click',openTranslation);
 copy.addEventListener('click',copyEnglish);
 input.addEventListener('change',validateFiles);
 clear.addEventListener('click',()=>{input.value='';renderMedia();announce('reviewMediaCleared');});
 maps.addEventListener('click',()=>{const url=maps.dataset.reviewUrl;if(url)window.open(url,'_blank','noopener,noreferrer');else announce('reviewMapsPendingStatus');});
 document.addEventListener('languagechange',()=>{renderMedia();if(!maps.dataset.reviewUrl)maps.textContent=text('reviewMapsPending');});
 window.addEventListener('beforeunload',clearUrls);
 renderMedia();
})();
