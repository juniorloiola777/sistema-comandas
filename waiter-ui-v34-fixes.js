(()=>{
const A=window.APP;if(!A||document.body.dataset.page!=='waiter'||window.__waiterUiV35)return;window.__waiterUiV35=true;
const $=s=>document.querySelector(s);
const SUPABASE_URL='https://dsipffnmerbowaddbcxe.supabase.co',SUPABASE_KEY='sb_publishable_vI64CItP0mGD4HD2DFJ2zw_zyZaveCz';
let loadingAdjustments=false;
const style=document.createElement('style');style.textContent=`
body[data-page="waiter"] .add-table-card{display:none!important}
body[data-page="waiter"].extra-table-allowed #tableGrid .add-table-card{display:grid!important}
body[data-page="waiter"] #waiterAdjustments.active{display:block!important}
body[data-page="waiter"] #waiterAdjustments .adjust-loading{padding:22px 12px;text-align:center;color:#747d92;font-weight:800}
`;document.head.appendChild(style);
function panel(){return $('#waiterAdjustments')}
function inAdjustments(){return !!panel()?.classList.contains('active')}
function clearHiddenSearch(){const s=$('#searchTable');if(s&&s.value){s.value='';s.dispatchEvent(new Event('input',{bubbles:true}))}}
function tables(){return Array.isArray(A.state()?.tables)?A.state().tables:[]}
function canAddExtra(){const t=tables();return !inAdjustments()&&t.length>=14&&t.every(x=>String(x.status||'free')!=='free')}
function updateExtraButton(){const allowed=canAddExtra();document.body.classList.toggle('extra-table-allowed',allowed);if(inAdjustments())$('#tableGrid')?.querySelectorAll('.add-table-card').forEach(x=>x.remove())}
function forceTables(){clearHiddenSearch();const btn=$('#bottomTables'),p=panel();if(btn&&typeof btn.onclick==='function')btn.onclick();if(p)p.classList.remove('active');const grid=$('#tableGrid'),legend=$('#waiterView .legend'),title=$('.screen-title');if(grid)grid.style.display='grid';if(legend)legend.style.display='flex';if(title)title.textContent='Mesas';btn?.classList.add('active');$('#bottomTabs')?.classList.remove('active');setTimeout(updateExtraButton,30)}
async function syncClosedSales(){
 try{
  const r=await fetch(`${SUPABASE_URL}/rest/v1/app_state?id=eq.1&select=data`,{headers:{apikey:SUPABASE_KEY,Accept:'application/json'},cache:'no-store'});
  if(!r.ok)throw new Error(`Erro ${r.status}`);
  const rows=await r.json(),fresh=rows?.[0]?.data;
  if(!fresh)throw new Error('Dados não encontrados');
  const s=A.state();
  s.closedSales=Array.isArray(fresh.closedSales)?fresh.closedSales:[];
  s.unpaidSales=Array.isArray(fresh.unpaidSales)?fresh.unpaidSales:[];
  return true;
 }catch(e){console.error('Falha ao carregar fechamentos em Ajustes',e);A.toast?.('Não foi possível atualizar os fechamentos.');return false}
}
async function forceAdjustments(){
 if(loadingAdjustments)return;
 loadingAdjustments=true;clearHiddenSearch();
 const btn=$('#bottomTabs'),p=panel(),grid=$('#tableGrid'),legend=$('#waiterView .legend'),title=$('.screen-title');
 if(p){p.classList.add('active');p.innerHTML='<div class="adjust-loading">Carregando contas fechadas...</div>'}
 if(grid)grid.style.display='none';if(legend)legend.style.display='none';if(title)title.textContent='Ajustes';$('#bottomTables')?.classList.remove('active');btn?.classList.add('active');document.body.classList.remove('extra-table-allowed');grid?.querySelectorAll('.add-table-card').forEach(x=>x.remove());
 try{
  await syncClosedSales();
  if(btn&&typeof btn.onclick==='function')btn.onclick();
  if(p&&!p.classList.contains('active'))p.classList.add('active');
  if(grid)grid.style.display='none';if(legend)legend.style.display='none';if(title)title.textContent='Ajustes';
  document.body.classList.remove('extra-table-allowed');grid?.querySelectorAll('.add-table-card').forEach(x=>x.remove());
 }finally{loadingAdjustments=false}
}
document.addEventListener('click',e=>{if(e.target.closest?.('#bottomTabs')){e.preventDefault();e.stopImmediatePropagation();setTimeout(forceAdjustments,0)}if(e.target.closest?.('#bottomTables'))setTimeout(forceTables,0)},true);
const observer=new MutationObserver(()=>{if(inAdjustments()){document.body.classList.remove('extra-table-allowed');$('#tableGrid')?.querySelectorAll('.add-table-card').forEach(x=>x.remove())}else updateExtraButton()});
const start=()=>{clearHiddenSearch();forceTables();const p=panel();if(p)observer.observe(p,{attributes:true,attributeFilter:['class']});const grid=$('#tableGrid');if(grid)observer.observe(grid,{childList:true,subtree:true});};
setTimeout(start,450);setTimeout(start,1400);
setInterval(()=>{clearHiddenSearch();updateExtraButton()},1200);
})();