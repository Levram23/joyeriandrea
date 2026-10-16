document.documentElement.classList.add('js');
const el = id => document.getElementById(id);
const menu=document.querySelector('.menu-toggle');
function closeMenu(){menu.setAttribute('aria-expanded','false');el('navigation').classList.remove('open');}
menu.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')!=='true';menu.setAttribute('aria-expanded',String(open));el('navigation').classList.toggle('open',open);});
el('navigation').querySelectorAll('a').forEach(a=>a.addEventListener('click',closeMenu));
document.addEventListener('keydown',e=>{
  if(e.key==='Escape' && menu.getAttribute('aria-expanded')==='true'){
    closeMenu();
    menu.focus();
  }
});
