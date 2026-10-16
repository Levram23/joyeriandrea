// Static HTML generation: Node built-ins only. Does not publish or contact a host.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function loadBusiness() {
  const context = { window: {} };
  vm.runInNewContext(read('src/data.js'), context);
  return context.window.ANDREA;
}
function render(config) {
  const b = loadBusiness();
  const images = JSON.parse(read('src/images.json'));
  let base = null;
  if (config.publicUrl) {
    base = new URL(config.publicUrl);
    if (base.protocol !== 'https:' || base.username || base.password || base.search || base.hash || /^(localhost|127\.|\[::1\]|.*\.(test|invalid|example))/.test(base.hostname)) {
      throw new Error('publicUrl debe ser la URL HTTPS real de producción, sin parámetros ni fragmentos.');
    }
    if (!base.pathname.endsWith('/')) base.pathname += '/';
  }
  if (config.indexable && !base) throw new Error('No se puede activar indexación sin publicUrl confirmada.');
  const absolute = p => new URL(p, base).href;
  const wa = message => `https://wa.me/${b.phone}?text=${encodeURIComponent(message)}`;
  const link = (url, label, attrs='') => `<a href="${escape(url)}" target="_blank" rel="noopener noreferrer" ${attrs}>${label}</a>`;
  function image(name, alt, hero=false) {
    const variants=images[name].variants;
    const largest=variants.at(-1);
    const fallback=hero ? largest : variants[1];
    return `<img src="${fallback.path}" srcset="${variants.map(v=>`${v.path} ${v.width}w`).join(', ')}" sizes="${hero ? '(max-width: 700px) 100vw, 50vw' : '(max-width: 700px) 88vw, 30vw'}" width="${largest.width}" height="${largest.height}" alt="${escape(alt)}" ${hero ? 'fetchpriority="high" loading="eager"' : 'loading="lazy" decoding="async"'}>`;
  }
  let html = read('src/index.html');
  function fill(id, content) {
    const pattern = new RegExp(`(<[a-z][a-z0-9]*[^>]*\\bid="${id}"[^>]*>)(</[a-z][a-z0-9]*>)`);
    if (!pattern.test(html)) throw new Error(`Contenedor vacío no encontrado: ${id}`);
    html = html.replace(pattern, (_, start, end) => start+content+end);
  }
  const alts={joyas:'Exhibición ilustrativa de anillos, collares, pulseras y aretes para adultos y niños',relojes:'Exhibición ilustrativa de relojes de pulsera analógicos y digitales',regalos:'Exhibición ilustrativa de joyeros, tazas, marcos de fotos y peluches'};
  fill('categories', b.categories.map((c,i)=>`<article class="category">${link(wa(`Hola, quisiera consultar precio y disponibilidad de ${c.name.toLowerCase()}.`),`${image(c.id,alts[c.id])}<span>0${i+1} / ${escape(c.name.toUpperCase())}</span><b aria-hidden="true">↗</b>`,`class="category-image" aria-label="Consultar ${escape(c.name)}"`)}<div class="category-title"><h3>${escape(c.name)}</h3><span>${c.price == null ? 'Consultar precio' : escape(`S/ ${c.price}`)}</span></div><p class="category-tagline">${escape(c.headline)}</p><p>${escape(c.description)}</p>${link(wa(`Hola, quisiera consultar disponibilidad de ${c.name.toLowerCase()}.`),'Consultar disponibilidad ↗',`class="text-link" aria-label="Consultar disponibilidad de ${escape(c.name.toLowerCase())}"`)}</article>`).join('\n'));
  fill('materials', b.materials.map(m=>`<span>${escape(m)}</span>`).join(''));
  fill('services', b.services.map(([name,description],i)=>`<article class="service"><span class="service-number" aria-hidden="true">0${i+1}</span><h3>${escape(name)}</h3><p>${escape(description)}</p>${link(wa(`Hola, quisiera cotizar: ${name.toLowerCase()}.`),'Cotizar por WhatsApp <span aria-hidden="true">↗</span>',`class="text-link" aria-label="Cotizar ${escape(name)} por WhatsApp"`)}</article>`).join('\n'));
  for (const id of ['address','location','district']) fill(id,escape(b[id]));
  fill('hours', b.hours.map(([day,time])=>`<div><dt>${escape(day)}</dt><dd>${escape(time)}</dd></div>`).join(''));
  fill('payments', b.payments.map(p=>`<span>${escape(p)}</span>`).join(''));
  fill('socials', Object.entries(b.socials).map(([name,url])=>link(url,`${escape(name)} ↗`)).join(''));
  html=html.replace(/<a id="directions"/,`<a href="${escape(b.maps)}" id="directions"`);
  html=html.replace(/<iframe id="map"/,`<iframe src="${escape(b.mapEmbed)}" width="600" height="450" id="map"`);
  html=html.replace(/<a\b([^>]*?) data-wa="([^"]*)"([^>]*)>/g,(_,before,message,after)=>`<a${before} href="${escape(wa(message))}" target="_blank" rel="noopener noreferrer"${after}>`);
  html=html.replace(/<img src="assets\/hero-joyas.png"[^>]*>/,image('hero-joyas','Composición ilustrativa de anillos de compromiso, cadenas con dijes, esclavas y aretes sobre soportes marfil y verde salvia',true));
  html=html.replace(/<title>.*?<\/title>/,`<title>${escape(config.title)}</title>`).replace(/<meta name="description"[^>]*>/,`<meta name="description" content="${escape(config.description)}">`);
  const robots=config.indexable ? 'index, follow, max-image-preview:large' : 'noindex, follow';
  const meta = [
    `<meta name="robots" content="${robots}">`,
    '<meta property="og:type" content="website">',
    '<meta property="og:locale" content="es_PE">',
    `<meta property="og:site_name" content="${escape(b.name)}">`,
    `<meta property="og:title" content="${escape(config.title)}">`,
    `<meta property="og:description" content="${escape(config.description)}">`,
    '<meta name="twitter:card" content="summary_large_image">',
    `<meta name="twitter:title" content="${escape(config.title)}">`,
    `<meta name="twitter:description" content="${escape(config.description)}">`
  ];
  const schema = {
    '@context':'https://schema.org', '@type':'JewelryStore', name:b.name,
    alternateName:'Joyería y Relojería Andrea', description:config.description,
    telephone:`+${b.phone}`, address:b.postalAddress,
    hasMap:b.maps, sameAs:Object.values(b.socials),
    openingHoursSpecification:b.openingHoursSpecification,
    paymentAccepted:b.payments.join(', '), areaServed:{'@type':'Country',name:'Perú'}
  };
  if(base) {
    meta.push(`<link rel="canonical" href="${escape(base.href)}">`,`<meta property="og:url" content="${escape(base.href)}">`);
    const share=images.social;
    meta.push(`<meta property="og:image" content="${escape(absolute(share.path))}">`, `<meta property="og:image:type" content="image/jpeg">`, `<meta property="og:image:width" content="${share.width}">`, `<meta property="og:image:height" content="${share.height}">`, '<meta property="og:image:alt" content="Composición ilustrativa de joyas; no representa existencias de la tienda">', `<meta name="twitter:image" content="${escape(absolute(share.path))}">`, '<meta name="twitter:image:alt" content="Composición ilustrativa de anillos, cadenas, esclavas y aretes">');
    schema.url=base.href;
    schema['@id']=absolute('#negocio');
    // The artwork is illustrative, not a photo documenting the store; no LocalBusiness image claim.
  } else {
    meta.push('<!-- PENDIENTE: dominio y alojamiento. Canonical, og:url e imágenes sociales absolutas se generan al configurar publicUrl. -->');
  }
  meta.push(`<script type="application/ld+json">${JSON.stringify(schema,null,2).replace(/</g,'\\u003c')}</script>`);
  html=html.replace('</head>',meta.join('\n')+'\n</head>');
  return {html, robots:`User-agent: *\nAllow: /\n${config.indexable && base ? `Sitemap: ${absolute('sitemap.xml')}\n` : '# Vista previa: noindex en HTML; permitir rastreo para que se lea la directiva.\n'}`, sitemap:config.indexable && base ? `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${escape(base.href)}</loc></url></urlset>\n` : null};
}
if (require.main === module) {
  const config=JSON.parse(read('site.config.json'));
  const result=render(config);
  for(const [file,content] of [['index.html',result.html],['robots.txt',result.robots]]) fs.writeFileSync(path.join(root,'dist',file),content);
  const sitemap=path.join(root,'dist','sitemap.xml');
  if(result.sitemap) fs.writeFileSync(sitemap,result.sitemap);
  else if(fs.existsSync(sitemap)) fs.unlinkSync(sitemap); // only the generated sitemap
  console.log(`HTML estático generado. Indexación: ${config.indexable ? 'activada' : 'desactivada (vista previa)'}.`);
}
module.exports={render,loadBusiness};
