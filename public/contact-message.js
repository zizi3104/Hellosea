function buildWhatsAppInquiry(fields,locale='en') {
 const labels={en:['HELLO SEA · Surf inquiry','Name','Email','Preferred date (Lombok)','Surfers','Lesson / package','Estimated total','Experience','Contact number','Message','To be decided','This is an inquiry, not a confirmed booking.'],ko:['HELLO SEA · 서핑 문의','이름','이메일','희망 날짜 (롬복)','인원','수업 / 패키지','예상 합계','서핑 경험','연락처','메시지','미정','예약 확정 전 문의입니다.'],ja:['HELLO SEA · サーフィンのお問い合わせ','名前','メール','希望日（ロンボク）','人数','レッスン / パッケージ','概算合計','サーフィン経験','連絡先','メッセージ','未定','これはお問い合わせであり、予約確定ではありません。']}[locale]||[];
 const l=labels.length?labels:['HELLO SEA · Surf inquiry','Name','Email','Date','Surfers','Lesson','Total','Experience','Phone','Message','TBD','Booking not confirmed.'];
 const keys=['name','email','date','people','plan','total','level','phone','message'];
 return [l[0],'',...keys.map((k,i)=>`${l[i+1]}: ${String(fields[k]||l[10]).trim()}`),'',l[11]].join('\n');
}

function buildWhatsAppLinks(number,text) {
 const phone=String(number||'').replace(/\D/g,'');
 const message=encodeURIComponent(String(text||''));
 return {
  app:`whatsapp://send?phone=${phone}&text=${message}`,
  universal:`https://wa.me/${phone}?text=${message}`,
  web:`https://web.whatsapp.com/send?phone=${phone}&text=${message}`
 };
}
