const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {render,loadBusiness}=require('./build.cjs');
const root=path.resolve(__dirname,'..');
const config=JSON.parse(fs.readFileSync(path.join(root,'site.config.json'),'utf8'));
const b=loadBusiness();
const result=render(config);
const html=fs.readFileSync(path.join(root,'dist/index.html'),'utf8');
assert.equal(html,result.html,'HTML generado desactualizado: ejecutar build');
assert.equal((html.match(/<h1\b/g)||[]).length,1);
assert.match(html,/<html lang="es-PE">/);
assert.match(html,/<link rel="canonical" href="https:\/\/joyeriaandrea.pe\/">/);
assert.match(html,/og:image" content="https:\/\/joyeriaandrea.pe\/assets\/social-joyas.jpg/);
assert.match(html,/twitter:card" content="summary_large_image/);
assert(!html.includes('src="data.js"'),'No debe requerir datos del navegador');
for (const name of b.services.map(s=>s[0]).concat(b.categories.map(c=>c.name),b.address,b.location)) assert(html.includes(name),`Contenido estático ausente: ${name}`);
const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
assert.equal(new Set(ids).size,ids.length,'IDs duplicados');
for(const [,attrs] of html.matchAll(/<a\b([^>]*)>/g)) {
  const href=attrs.match(/\bhref="([^"]*)"/);
  assert(href&&href[1],'Enlace sin destino');
  if(href[1].startsWith('#') && href[1]!=='#') assert(ids.includes(href[1].slice(1)),`Ancla inexistente: ${href[1]}`);
  if(href[1].startsWith('https://wa.me/')) {
    const url=new URL(href[1].replaceAll('&amp;','&'));
    assert.equal(url.pathname,`/${b.phone}`);
    assert(url.searchParams.get('text')?.startsWith('Hola'),'Mensaje WhatsApp ausente');
  }
}
for(const [,attrs] of html.matchAll(/<img\b([^>]*)>/g)) {
  assert(/alt="[^"]+"/.test(attrs)); assert(/width="\d+"/.test(attrs)); assert(/height="\d+"/.test(attrs));
  assert(attrs.includes('srcset='));
  for(const [,file] of attrs.matchAll(/(?:src=")?(assets\/[^\s",]+\.webp)/g)) assert(fs.existsSync(path.join(root,'dist',file)),file);
  if(attrs.includes('hero-joyas')) {assert(attrs.includes('fetchpriority="high"'));assert(!attrs.includes('loading="lazy"'));}
}
const schema=JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
assert.equal(schema['@type'],'JewelryStore'); assert.equal(schema.address.postalCode,'15056');
assert.match(schema.address.streetAddress,/puesto 283/); assert.equal(schema.telephone,'+51960920199');
assert.equal(schema.openingHoursSpecification[0].closes,'19:00');
assert.equal(schema.openingHoursSpecification[1].closes,'16:00');
assert.equal(schema.openingHoursSpecification[2].closes,'13:00');
for(const key of ['priceRange','review','aggregateRating','foundingDate','image','logo']) assert(!Object.hasOwn(schema,key),`Dato no confirmado: ${key}`);
assert.equal(schema.sameAs.length,3);
// Validate release configuration entirely in memory: do not create a deployed release.
const release=render({...config,indexable:true});
assert.match(release.html,/content="index, follow, max-image-preview:large"/);
assert.match(release.sitemap,/<loc>https:\/\/joyeriaandrea.pe\/<\/loc>/);
assert.match(release.robots,/Sitemap: https:\/\/joyeriaandrea.pe\/sitemap.xml/);
const preview=render({...config,indexable:false});
assert.match(preview.html,/content="noindex, follow"/); assert.equal(preview.sitemap,null);
assert(!preview.robots.includes('Disallow: /'),'Permitir leer noindex');
assert.throws(()=>render({...config,publicUrl:null,indexable:true}));
const unconfigured=render({...config,publicUrl:null,indexable:false});
assert(!unconfigured.html.includes('rel="canonical"')); assert(!unconfigured.html.includes('property="og:image"'));
console.log('OK: HTML estático, metadatos, anclas, imágenes, WhatsApp, JSON-LD y configuraciones de vista previa/producción.');
