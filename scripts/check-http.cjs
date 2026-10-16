// Local preview smoke check. Does not request external WhatsApp/social URLs.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
(async()=>{
  const origin=process.env.SITE_TEST_URL || 'http://127.0.0.1:4173/';
  const home=await fetch(origin);
  assert.equal(home.status,200);
  const html=await home.text();
  assert.equal(html,fs.readFileSync(path.join(__dirname,'../dist/index.html'),'utf8'));
  const files=new Set(['styles.css','app.js','robots.txt','assets/social-joyas.jpg']);
  for(const [,file] of html.matchAll(/(assets\/[^\s",<>]+\.(?:webp|jpg))/g)) files.add(file);
  const types={webp:'image/webp',jpg:'image/jpeg',css:'text/css',js:'text/javascript',txt:'text/plain'};
  for(const file of files){
    const response=await fetch(new URL(file,origin));
    assert.equal(response.status,200,file);
    assert(response.headers.get('content-type').startsWith(types[file.split('.').at(-1)]),`MIME: ${file}`);
  }
  assert.equal((await fetch(new URL('pagina-inexistente',origin))).status,404);
  const config=JSON.parse(fs.readFileSync(path.join(__dirname,'../site.config.json'),'utf8'));
  assert.equal((await fetch(new URL('sitemap.xml',origin))).status,config.indexable ? 200 : 404);
  console.log(`OK: HTML servido, ${files.size} recursos con MIME correcto, 404 real y estado esperado del sitemap.`);
})().catch(error=>{console.error(error);process.exitCode=1;});
