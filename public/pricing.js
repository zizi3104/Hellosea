(() => {
 let plans=JSON.parse(document.getElementById('pricing-data').textContent), select=document.getElementById('pricing-plan'), people=document.querySelector('[name=people]');
 const requestedPlan=new URLSearchParams(location.search).get('plan');
 const money=n=>'IDR '+new Intl.NumberFormat('en-US').format(n);
 const node=(tag,text)=>{const n=document.createElement(tag);if(text)n.textContent=text;return n;};
 function total(){const p=plans.find(p=>p.id===select.value);document.getElementById('pricing-total').textContent=p?`${t('priceTotal')}: ${money(p.price*Number(people.value))} · ${people.value} ${t('pricePeople')}`:t('priceEmpty');}
 function render(){const chosen=select.value||requestedPlan;select.replaceChildren();const empty=node('option',t('planNone'));empty.value='';select.append(empty);const grid=document.getElementById('pricing-cards');grid.replaceChildren();plans.forEach(p=>{const option=node('option',`${p.title[language]} — ${money(p.price)}`);option.value=p.id;select.append(option);const card=node('article');card.className='pricing-card';const price=node('p',money(p.price));price.className='plan-price';const detail=node('p',p.detail[language]);detail.className='plan-detail';const link=node('a',t('pricingChoose'));link.className='text-link';link.href=`/booking-inquiry?plan=${encodeURIComponent(p.id)}`;card.append(node('h3',p.title[language]),price,detail,link);grid.append(card);});select.value=plans.some(p=>p.id===chosen)?chosen:'';total();}
 select.addEventListener('change',total);people.addEventListener('change',total);document.getElementById('inquiry-form').addEventListener('reset',()=>setTimeout(total,0));document.addEventListener('languagechange',render);render();
 fetch('/api/manage?section=pricing',{cache:'no-store'}).then(r=>r.ok?r.json():null).then(r=>{if(r?.content){plans=r.content;render();}}).catch(()=>{});
})();
