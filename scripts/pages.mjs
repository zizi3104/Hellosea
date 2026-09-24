export const customerPages = [
  {id:'home',path:'/',output:'index.html',title:'HELLO SEA — Surf at your own pace · Lombok',description:'A little more surf. A little less rush. Plan your surf session with HELLO SEA in Gerupuk, Lombok.'},
  {id:'story',path:'/our-story',output:'our-story/index.html',title:'Our Story · HELLO SEA Lombok',description:'Meet the story and spirit behind HELLO SEA in Gerupuk, Lombok.'},
  {id:'goods',path:'/goods',output:'goods/index.html',title:'PADO Goods · HELLO SEA Lombok',description:'Explore PADO goods available in person after HELLO SEA surf lessons in Gerupuk, Lombok.'},
  {id:'surf',path:'/ayo-surf',output:'ayo-surf/index.html',title:'AYO SURF · Lessons and instructors · HELLO SEA',description:'Explore surf lessons, instructors and prices with AYO SURF in Gerupuk, Lombok.'},
  {id:'photos',path:'/photos',output:'photos/index.html',title:'Photos · HELLO SEA Lombok',description:'Explore photographs of Gerupuk and the shores of Lombok with HELLO SEA.'},
  {id:'faq',path:'/q-and-a',output:'q-and-a/index.html',title:'Q&A · HELLO SEA Lombok',description:'Read answers about surf lessons, weather, equipment, booking and rentals in Lombok.'},
  {id:'booking',path:'/booking-inquiry',output:'booking-inquiry/index.html',title:'Booking inquiry · HELLO SEA Lombok',description:'Send a surf lesson inquiry to HELLO SEA and continue with the same details on WhatsApp.'}
];

export function pageForPath(pathname) {
  const normalized=pathname!=='/'?pathname.replace(/\/$/,''):pathname;
  return customerPages.find(page=>page.path===normalized);
}

export function renderCustomerPage(template,page) {
  return template
    .replace(/<body data-page="[^"]+">/,`<body data-page="${page.id}">`)
    .replace(/<title>[\s\S]*?<\/title>/,`<title>${page.title}</title>`)
    .replace(/<meta name="description" content="[^"]*">/,`<meta name="description" content="${page.description}">`);
}
