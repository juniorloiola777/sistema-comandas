(()=>{
const A=window.APP;if(!A||document.body.dataset.page!=='admin'||window.__adminSalesMonthV45)return;window.__adminSalesMonthV45=true;
const $=s=>document.querySelector(s);let selectedMonth='';let observer=null;let rendering=false;
const esc=v=>A.esc(String(v??'')),brl=v=>A.brl(Number(v||0));
const ts=s=>Number(s.closedAt||s.unpaidAt||0),qty=s=>(s.items||[]).reduce((a,i)=>a+Number(i.qty||0),0),sum=l=>l.reduce((a,s)=>a+Number(s.total||0),0);
function fmt(v){if(!v)return'—';try{return new Date(Number(v)).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',year:'2-digit',hour:'2-digit',minute:'2-digit'})}catch(_){return'—'}}
function metric(id,value,sub){const e=$('#'+id);if(!e)return;const b=e.querySelector('strong'),s=e.querySelector('span');if(b)b.textContent=value;if(s)s.textContent=sub||''}
function monthKey(ms){const d=new Date(Number(ms));return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`}
function availableMonths(){const keys=[...(new Set((A.state().closedSales||[]).map(s=>monthKey(ts(s))).filter(Boolean)))].sort().reverse();const now=new Date(),cur=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;if(!keys.includes(cur))keys.unshift(cur);return keys}
function render(){if(rendering)return;rendering=true;try{
 const month=$('#saleMonthPick')?.value||selectedMonth;if(!month)return;selectedMonth=month;
 const method=$('#saleMethod')?.value||'all',q=($('#saleSearch')?.value||'').toLowerCase().trim();
 const list=(A.state().closedSales||[]).filter(s=>monthKey(ts(s))===month).filter(s=>(method==='all'||s.payment===method)&&(!q||String(s.client||'').toLowerCase().includes(q)||String(s.waiter||s.closedBy||'').toLowerCase().includes(q)||String(s.refId||'').includes(q))).sort((a,b)=>ts(b)-ts(a));
 const tb=$('#salesTable');if(tb)tb.innerHTML=list.length?list.map(s=>`<tr><td><strong>${s.type==='mesa'?'Mesa '+s.refId:'Comanda #'+s.refId}</strong><small>${esc(s.client||'Cliente')}</small></td><td>${fmt(ts(s))}</td><td>${esc(s.waiter||s.closedBy||'—')}</td><td>${esc(s.payment||'—')}</td><td>${qty(s)}</td><td><strong>${brl(s.total)}</strong></td></tr>`).join(''):'<tr><td colspan="6" class="empty-cell">Nenhuma venda neste mês.</td></tr>';
 metric('salesRevenue',brl(sum(list)),`${list.length} venda(s) no mês selecionado`);metric('salesTicket',brl(list.length?sum(list)/list.length:0),'ticket médio do mês');metric('salesItems',String(list.reduce((a,s)=>a+qty(s),0)),'itens vendidos no mês');
 }finally{rendering=false}}
function init(){const filters=$('[data-admin-page="sales"] .filters');if(!filters||!$('#salesTable'))return false;const old=$('#salePeriod');if(old){old.value='all';old.dispatchEvent(new Event('change',{bubbles:true}));old.style.display='none'}
 if(!$('#saleMonthPick')){const select=document.createElement('select');select.id='saleMonthPick';const months=availableMonths();selectedMonth=months[0]||'';select.innerHTML=months.map(m=>{const [y,mo]=m.split('-').map(Number),label=new Date(y,mo-1,1).toLocaleDateString('pt-BR',{month:'long',year:'numeric'});return `<option value="${m}">${label.charAt(0).toUpperCase()+label.slice(1)}</option>`}).join('');filters.prepend(select);select.onchange=render}
 $('#saleMethod')?.addEventListener('change',()=>setTimeout(render,0));$('#saleSearch')?.addEventListener('input',()=>setTimeout(render,0));
 const tb=$('#salesTable');observer=new MutationObserver(()=>{if(!rendering)setTimeout(render,0)});observer.observe(tb,{childList:true});render();return true}
let tries=0;const t=setInterval(()=>{if(init()||++tries>40)clearInterval(t)},150);setInterval(()=>{if($('#saleMonthPick'))render()},2600);
})();