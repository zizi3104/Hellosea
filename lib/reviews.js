export const REVIEW_BUCKET='website-reviews';
export const REVIEW_PAGE_SIZE=10;
export const REVIEW_ADMIN_PAGE_SIZE=20;
export const REVIEW_PRIVACY_VERSION='2026-10-review-v1';
const uuid=x=>typeof x==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(x);
const types=new Set(['image/jpeg','image/png','image/webp']);
export const reviewExtension=type=>type==='image/png'?'png':type==='image/webp'?'webp':'jpg';
export const reviewPaths=(reviewId,index,type)=>{const n=String(index+1).padStart(2,'0');return {original:`${reviewId}/${n}-original.${reviewExtension(type)}`,preview:`${reviewId}/${n}-preview.jpg`};};
export function validateReviewSubmission(value){
 if(!value||typeof value!=='object'||!uuid(value.requestId)||value.consent!==true||value.privacyVersion!==REVIEW_PRIVACY_VERSION)return null;
 const displayName=typeof value.displayName==='string'?value.displayName.trim():'';
 const body=typeof value.body==='string'?value.body.trim():'';
 const bodyEn=typeof value.bodyEn==='string'?value.bodyEn.trim():'';
 const locale=['en','ko','ja'].includes(value.locale)?value.locale:'en';
 if(displayName.length>60||body.length<10||body.length>2500||bodyEn.length>2500)return null;
 if(!Array.isArray(value.media)||value.media.length>5)return null;
 const media=[];
 for(const item of value.media){
  if(!item||!types.has(item.mimeType)||!Number.isSafeInteger(item.size)||item.size<1||item.size>10*1024*1024||!Number.isSafeInteger(item.previewSize)||item.previewSize<1||item.previewSize>2*1024*1024||!Number.isSafeInteger(item.width)||item.width<1||item.width>12000||!Number.isSafeInteger(item.height)||item.height<1||item.height>12000)return null;
  media.push({mimeType:item.mimeType,size:item.size,previewSize:item.previewSize,width:item.width,height:item.height});
 }
 return {request_id:value.requestId,display_name:displayName||null,body,body_en:bodyEn||null,locale,media_count:media.length,consent:true,privacy_version:REVIEW_PRIVACY_VERSION,media};
}
export function reviewPage(value){const page=Number(value||1);return Number.isSafeInteger(page)&&page>0&&page<=10000?page:1;}
