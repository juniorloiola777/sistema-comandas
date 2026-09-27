(()=>{
const A=window.APP;
if(!A||document.getElementById('unpaidAdminSection'))return;
const nav=document.getElementById('adminNav'),main=document.querySelector('.admin-main');
if(!nav||!main)return;

const style=document.createElement('style');
style.textContent=`
.unpaid-alert{background:#fff3f0!important;color:#a63a20!important}.unpaid-metrics{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-bottom:16px}.unpaid-card{background:#fff;border:1px solid #e7eaf0;border-radius:16px;padding:16px}.unpaid-card span{display:block;color:#7a8398;font-size:11px;font-weight:800;margin-bottom:6px}.unpaid-card strong{font-size:22px;color:#0b1739}.unpaid-card.danger strong{color:#b42318}.unpaid-row-client{display:flex;flex-direction:column;gap:3px}.unpaid-row-client span{font-size:11px;color:#858da3}.unpaid-cash-box{margin-top:14px;padding:14px;border:1px solid #ffd9d4;background:#fff8f6;border-radius:14px}.unpaid-cash-head{display:flex;justify-content:space-between;gap:12px;align-items:center;margin-bottom:9px}.unpaid-cash-head h4{margin:0;color:#8f2518;font-size:14px}.unpaid-cash-head strong{color:#b42318}.unpaid-cash-list{display:grid;gap:7px}.unpaid-cash-row{display:flex;justify-content:space-between;gap:12px;padding:9px 10px;border-radius:10px;background:#fff}.unpaid-cash-row span{display:block;font-size:11px;color:#7d8495;margin-top:2px}.unpaid-cash-row strong{color:#0b1739}.unpaid-history-box{margin-top:12px;padding-top:12px;border-top:1px solid #f0d8d4}.unpaid-history-box h5{margin:0 0 8px;color:#8f2518;font-size:12px}.unpaid-history-item{padding:9px 10px;background:#fff;border-radius:10px;margin-top:6px;font-size:11px;line-height:1.5;color:#6f778a}.unpaid-history-item strong{display:block;color:#0b1739;font-size:12px;margin-bottom:2px}@media(max-width:900px){.unpaid-metrics{grid-template-columns:1fr}.unpaid-cash-row{align-items:flex-start}}
`;
document.head.appendChild(style);

const navBtn=document.createElement('button');
navBtn.dataset.tab='nao-pagaram';
navBtn.innerHTML='⚠ Não pagaram';
navBtn.className='unpaid-alert';
const caixaBtn=nav.querySelector('[data-tab="caixa"]');
nav.insertBefore(navBtn,caixaBtn||null);

const section=document.createElement('section');
section.id='unpaidAdminSection';
section.className='admin-section';
section.dataset.section='nao-pagaram';
section.innerHTML=`
  <div class="section-toolbar"><div><h2>Pessoas que saíram sem pagar</h2><p>Esses valores ficam separados do faturamento recebido.</p></div><div class="toolbar-actions"><input id="unpaidSearch" placeholder="Buscar cliente ou garçom"></div></div>
  <div class="unpaid-metrics">
    <div class="unpaid-card danger"><span>NÃO PAGARAM HOJE</span><strong id="unpaidTodayCount">0</strong></div>
    <div class="unpaid-card danger"><span>VALOR NÃO RECEBIDO HOJE</span><strong id="unpaidTodayTotal">R$ 0,00</strong></div>
    <div class="unpaid-card"><span>TOTAL REGISTRADO</span><strong id="unpaidAllTotal">R$ 0,00</strong></div>
  </div>
  <div class="panel"><div class="table-wrap"><table><thead><tr><th>CLIENTE</th><th>DATA / HORA</th><th>MESA / COMANDA</th><th>GARÇOM</th><th>VALOR</th></tr></thead><tbody id="unpaidTable"></tbody></table></div></div>`;
const cashSection=main.querySelector('[data-section="caixa"]');
main.insertBefore(section,cashSection||null);

const $=id=>document.getElementById(id);
const debts=()=>Array.isArray(A.state().unpaidSales)?A.state().unpaidSales:[];
function fmtDate(ts){if(!ts)return'—';return new Date(Number(ts)).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'})}
function refLabel(d){return d.type==='mesa'?`Mesa ${d.refId}`:`Comanda #${d.refId}`}
function renderUnpaid(){
  const all=debts().slice().sort((a,b)=>Number(b.unpaidAt||0)-Number(a.unpaidAt||0));
  const today=all.filter(d=>A.today(d.unpaidAt)===A.today());
  const q=String($('unpaidSearch')?.value||'').toLowerCase().trim();
  const list=all.filter(d=>!q||String(d.client||'').toLowerCase().includes(q)||String(d.waiter||'').toLowerCase().includes(q));
  if($('unpaidTodayCount'))$('unpaidTodayCount').textContent=today.length;
  if($('unpaidTodayTotal'))$('unpaidTodayTotal').textContent=A.brl(today.reduce((a,d)=>a+Number(d.total||0),0));
  if($('unpaidAllTotal'))$('unpaidAllTotal').textContent=A.brl(all.reduce((a,d)=>a+Number(d.total||0),0));
  if($('unpaidTable'))$('unpaidTable').innerHTML=list.length?list.map(d=>`<tr><td><div class="unpaid-row-client"><strong>${A.esc(d.client||'Sem nome')}</strong><span>${(d.items||[]).reduce((a,i)=>a+Number(i.qty||0),0)} item(ns)</span></div></td><td>${fmtDate(d.unpaidAt)}</td><td>${A.esc(refLabel(d))}</td><td>${A.esc(d.waiter||d.recordedBy||'Garçom')}</td><td><strong style="color:#b42318">${A.brl(d.total)}</strong></td></tr>`).join(''):'<tr><td colspan="5" class="empty-cell">Nenhum cliente registrado como não pago.</td></tr>';
}
$('unpaidSearch')?.addEventListener('input',renderUnpaid);

navBtn.addEventListener('click',()=>{
  document.querySelectorAll('#adminNav button').forEach(b=>b.classList.toggle('active',b===navBtn));
  document.querySelectorAll('.admin-section').forEach(s=>s.classList.toggle('active',s===section));
  const title=$('adminPageTitle');if(title)title.textContent='Não pagaram';
  renderUnpaid();window.scrollTo({top:0,behavior:'smooth'});
});

const paymentSelect=$('paymentMethod');
if(paymentSelect&&!Array.from(paymentSelect.options).some(o=>o.value==='Não pagou')){
  const o=document.createElement('option');o.value='Não pagou';o.textContent='Não pagou';paymentSelect.appendChild(o);
}
function updateAdminConfirmLabel(){const b=$('confirmCloseSale');if(!b||!paymentSelect)return;b.textContent=paymentSelect.value==='Não pagou'?'Registrar não pagamento':'Confirmar pagamento'}
paymentSelect?.addEventListener('change',updateAdminConfirmLabel);

let closingRef=null;
function installStartCloseWrapper(){
  if(window.__cpUnpaidStartWrapped||typeof window.startCloseSale!=='function')return false;
  const original=window.startCloseSale;
  window.startCloseSale=(type,id)=>{closingRef={type,id:Number(id)};if(paymentSelect)paymentSelect.value='Pix';updateAdminConfirmLabel();return original(type,id)};
  window.__cpUnpaidStartWrapped=true;return true;
}
function orderFor(ref,s=A.state()){return ref?.type==='mesa'?s.tables.find(x=>x.id===ref.id):s.tabs.find(x=>x.id===ref?.id)}
async function closeAsUnpaid(){
  const ref=closingRef,order=orderFor(ref);if(!ref||!order)return A.toast('Não foi possível identificar a comanda.');
  if(A.state()?.cash?.status!=='open')return A.toast('Abra o caixa antes de registrar o fechamento.');
  if(!confirm(`Registrar ${order.client||'este cliente'} como NÃO PAGO no valor de ${A.brl(order.total)}?`))return;
  const now=Date.now();
  const ok=await A.commit(s=>{
    const t=orderFor(ref,s);if(!t)return;
    s.unpaidSales=Array.isArray(s.unpaidSales)?s.unpaidSales:[];
    const items=(t.items||[]).map(i=>{const p=s.products.find(x=>x.id===i.pid);return{pid:i.pid,qty:Number(i.qty||0),name:p?.name||`Produto ${i.pid}`,price:Number(p?.price||0),waiter:i.waiter||t.waiter}});
    s.unpaidSales.push({id:now,type:ref.type,refId:ref.id,client:t.client||'',total:Number(t.total||0),items,waiter:t.waiter||s.settings?.waiterName||'Garçom',recordedBy:'Administrador',unpaidAt:now,status:'unpaid'});
    if(ref.type==='mesa')Object.assign(t,{client:'',status:'free',opened:0,total:0,items:[],waiter:s.settings?.waiterName||'Garçom'});else s.tabs=s.tabs.filter(x=>x.id!==ref.id);
  },'Conta registrada como não paga • mesa liberada');
  if(ok){closingRef=null;$('closeSaleOverlay')?.classList.add('hidden');renderUnpaid();renderCashExtras()}
}
document.addEventListener('click',e=>{
  const b=e.target.closest?.('#confirmCloseSale');if(!b||paymentSelect?.value!=='Não pagou')return;
  e.preventDefault();e.stopImmediatePropagation();closeAsUnpaid();
},true);

function ensureCashExtras(){
  const panel=$('cashControlPanel');if(!panel||$('cashUnpaidBox'))return;
  const box=document.createElement('div');box.id='cashUnpaidBox';box.className='unpaid-cash-box';
  box.innerHTML='<div class="unpaid-cash-head"><h4>Não pagos desta sessão</h4><strong id="cashUnpaidTotal">R$ 0,00</strong></div><div id="cashUnpaidList" class="unpaid-cash-list"></div><div class="unpaid-history-box"><h5>Fechamentos do dia com não pagamentos</h5><div id="cashUnpaidHistory"></div></div>';
  const hist=panel.querySelector('.cash-history');hist?.before(box);if(!hist)panel.appendChild(box);
}
function currentCashDebts(){const openedAt=Number(A.state()?.cash?.openedAt)||0;return openedAt?debts().filter(d=>Number(d.unpaidAt||0)>=openedAt):[]}
function renderCashExtras(){
  ensureCashExtras();if(!$('cashUnpaidBox'))return;
  const current=currentCashDebts(),total=current.reduce((a,d)=>a+Number(d.total||0),0);
  $('cashUnpaidTotal').textContent=`${current.length} • ${A.brl(total)}`;
  $('cashUnpaidList').innerHTML=current.length?current.map(d=>`<div class="unpaid-cash-row"><div><strong>${A.esc(d.client||'Sem nome')}</strong><span>${fmtDate(d.unpaidAt)} • ${A.esc(d.waiter||'Garçom')}</span></div><strong>${A.brl(d.total)}</strong></div>`).join(''):'<div class="cash-empty">Nenhum não pagamento nesta sessão.</div>';
  const hist=(A.state().cashClosings||[]).slice().reverse().filter(h=>Number(h.unpaidCount||0)>0).slice(0,6);
  $('cashUnpaidHistory').innerHTML=hist.length?hist.map(h=>`<div class="unpaid-history-item"><strong>${fmtDate(h.closedAt)} • ${h.unpaidCount} não pago(s) • ${A.brl(h.unpaidTotal)}</strong>${(h.unpaid||[]).map(d=>`${A.esc(d.client||'Sem nome')} — ${A.brl(d.total)} — ${fmtDate(d.unpaidAt)}`).join('<br>')}</div>`).join(''):'<div class="cash-empty">Nenhum fechamento com não pagamentos.</div>';
}

async function enhancedDayClose(e){
  e.preventDefault();e.stopImmediatePropagation();
  const c=A.state().cash||{},openedAt=Number(c.openedAt)||0;if(!openedAt)return A.toast('Não existe uma sessão de caixa para registrar.');
  if(A.openOrders().length)return A.toast('Feche todas as mesas e comandas antes do fechamento do dia.');
  const sales=(A.state().closedSales||[]).filter(s=>Number(s.closedAt||0)>=openedAt),unpaid=currentCashDebts();
  const total=sales.reduce((a,s)=>a+Number(s.total||0),0),unpaidTotal=unpaid.reduce((a,d)=>a+Number(d.total||0),0),payments={};
  sales.forEach(s=>{const k=s.payment||'Não informado';payments[k]=(payments[k]||0)+Number(s.total||0)});
  const names=unpaid.length?'\n\nNão pagaram:\n'+unpaid.map(d=>`• ${d.client||'Sem nome'} — ${A.brl(d.total)}`).join('\n'):'';
  if(!confirm(`Registrar fechamento do dia com ${sales.length} venda(s) recebida(s), total de ${A.brl(total)} e ${unpaid.length} não pagamento(s) somando ${A.brl(unpaidTotal)}?${names}\n\nO caixa ficará fechado.`))return;
  const now=Date.now();
  const snapshot=unpaid.map(d=>({id:d.id,client:d.client||'',total:Number(d.total||0),unpaidAt:Number(d.unpaidAt||0),waiter:d.waiter||'',type:d.type,refId:d.refId}));
  await A.commit(s=>{
    s.cashClosings=Array.isArray(s.cashClosings)?s.cashClosings:[];
    s.cashClosings.push({id:now,openedAt,closedAt:now,openingAmount:Number(c.openingAmount)||0,salesCount:sales.length,salesTotal:total,payments,unpaidCount:unpaid.length,unpaidTotal,unpaid:snapshot});
    s.cash={status:'closed',openedAt:null,openingAmount:0,pausedAt:null,lastClosedAt:now};
  },'Fechamento do dia registrado • caixa fechado');
  renderCashExtras();
}
function installDayClose(){const b=$('dayCloseBtn');if(!b||b.dataset.unpaidEnhanced)return false;b.dataset.unpaidEnhanced='1';b.addEventListener('click',enhancedDayClose,true);return true}
function wrapRenderPage(){if(window.__cpUnpaidRenderWrapped||typeof window.renderPage!=='function')return false;const original=window.renderPage;window.renderPage=(...args)=>{const r=original(...args);renderUnpaid();renderCashExtras();return r};window.__cpUnpaidRenderWrapped=true;return true}

renderUnpaid();renderCashExtras();
const timer=setInterval(()=>{installStartCloseWrapper();installDayClose();wrapRenderPage();renderCashExtras()},250);
window.addEventListener('beforeunload',()=>clearInterval(timer),{once:true});
})();
