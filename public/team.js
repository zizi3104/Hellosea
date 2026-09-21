(() => {
 const node = document.getElementById('team-data');
 let data = JSON.parse(node.textContent);
 const el = (tag, text, cls) => { const n=document.createElement(tag); if(text)n.textContent=text;if(cls)n.className=cls;return n; };
 function render() {
  document.querySelector('.team-sample').hidden=data.sample===false;
  document.getElementById('team-intro').textContent=data.intro[language];
  const cards=document.getElementById('team-cards');cards.replaceChildren();
  data.people.forEach(p=>{const card=el('article',null,'team-card');if(p.photo){const img=el('img');img.src=p.photo;img.alt=p.name;img.width=600;img.height=650;card.append(img);}else{const ph=el('div',null,'team-placeholder');ph.append(el('strong',p.name[0]),el('span',t('teamPhoto')));card.append(ph);}const body=el('div',null,'team-card-body');body.append(el('p','AYO SURF','eyebrow'),el('h3',p.name),el('p',p.bio[language]));card.append(body);cards.append(card);});
 }
 render();document.addEventListener('languagechange',render);
 if(document.documentElement.dataset.preview!=='true')fetch('/api/content',{cache:'no-store'}).then(r=>r.ok?r.json():null).then(result=>{if(result?.content){data=result.content;render();}}).catch(()=>{});
})();
