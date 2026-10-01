(()=>{
const A=window.APP;if(!A||document.body.dataset.page!=='waiter'||window.__waiterUiV34)return;window.__waiterUiV34=true;
const $=s=>document.querySelector(s);
const style=document.createElement('style');style.textContent=`
body[data-page="waiter"] .add-table-card{display:none!important}
body[data-page="waiter"].extra-table-allowed #tableGrid .add-table-card{display:grid!important}
body[data-page="waiter"] #waiterAdjustments.active~* .add-table-card{display:none!important}
`;document.head.appendChild(style);
function panel(){return $('#waiterAdjustments')}
function inAdjustments(){return !!panel()?.classList.contains('active')}
function clearHiddenSearch(){const s=$('#searchTable');if(s&&s.value){s.value='';s.dispatchEvent(new Event('input',{bubbles:true}))}}
function tables(){return Array.isArray(A.state()?.tables)?A.state().tables:[]}
function canAddExtra(){const t=tables();return !inAdjustments()&&t.length>=14&&t.every(x=>String(x.status||'free')!=='free')}
function ensurePlus(){const grid=$('#tableGrid');if(!grid)return;let plus=grid.querySelector('.add-table-card');const allowed=canAddExtra();document.body.classList.toggle('extra-table-allowed',allowed);if(!allowed){if(inAdjustments())plus?.remove();return}
 if(!plus){plus=document.createElement('button');plus.type='button';plus.className='table-card add-table-card';plus.innerHTML='<div class="table-no">＋</div><div class="client">Adicionar mesa</div><div class="meta">Cria a próxima mesa</div>';const legacy=$('#tableGrid .add-table-card');if(legacy?.onclick)plus.onclick=legacy.onclick;grid.appendChild(plus)}
}
function forceTables(){clearHiddenSearch();const btn=$('#bottomTables'),p=panel();if(btn&&typeof btn.onclick==='function')btn.onclick();if(p)p.classList.remove('active');const grid=$('#tableGrid'),legend=$('#waiterView .legend'),title=$('.screen-title');if(grid)grid.style.display='grid';if(legend)legend.style.display='flex';if(title)title.textContent='Mesas';btn?.classList.add('active');$('#bottomTabs')?.classList.remove('active');setTimeout(ensurePlus,30)}
function forceAdjustments(){clearHiddenSearch();const btn=$('#bottomTabs'),p=panel();if(btn&&typeof btn.onclick==='function')btn.onclick();if(p&&!p.classList.contains('active')){p.classList.add('active');const grid=$('#tableGrid'),legend=$('#waiterView .legend'),title=$('.screen-title');if(grid)grid.style.display='none';if(legend)legend.style.display='none';if(title)title.textContent='Ajustes';$('#bottomTables')?.classList.remove('active');btn?.classList.add('active')}
 document.body.classList.remove('extra-table-allowed');$('#tableGrid')?.querySelectorAll('.add-table-card').forEach(x=>x.remove());
 if(p&&(!p.innerHTML.trim()||p.textContent.includes('Nenhuma conta fechada'))&&typeof btn?.onclick==='function')btn.onclick();
}
document.addEventListener('click',e=>{if(e.target.closest?.('#bottomTabs'))setTimeout(forceAdjustments,0);if(e.target.closest?.('#bottomTables'))setTimeout(forceTables,0)},true);
const observer=new MutationObserver(()=>{if(inAdjustments()){document.body.classList.remove('extra-table-allowed');$('#tableGrid')?.querySelectorAll('.add-table-card').forEach(x=>x.remove())}else ensurePlus()});
const start=()=>{clearHiddenSearch();forceTables();const p=panel();if(p)observer.observe(p,{attributes:true,attributeFilter:['class']});const grid=$('#tableGrid');if(grid)observer.observe(grid,{childList:true,subtree:true});};
setTimeout(start,450);
setTimeout(start,1400);
setInterval(()=>{clearHiddenSearch();if(inAdjustments())forceAdjustments();else ensurePlus()},1200);
})();