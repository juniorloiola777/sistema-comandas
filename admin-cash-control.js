(()=>{
const A=window.APP;
if(!A||document.getElementById('cashControlPanel'))return;
const section=document.querySelector('[data-section="caixa"]');
if(!section)return;

const style=document.createElement('style');
style.textContent=`
.cash-control-panel{margin-bottom:16px;border:1px solid #e3e7ef;background:#fff;border-radius:18px;padding:18px}.cash-control-head{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;flex-wrap:wrap}.cash-status{display:inline-flex;align-items:center;gap:7px;border-radius:999px;padding:7px 11px;font-size:12px;font-weight:950}.cash-status.open{background:#eaf8ef;color:#14723a}.cash-status.closed{background:#fff0f0;color:#a60f17}.cash-status i{width:8px;height:8px;border-radius:50%;background:currentColor}.cash-control-title h3{margin:0 0 5px;color:#0b1739;font-size:20px}.cash-control-title p{margin:0;color:#7b8499;font-size:12px;line-height:1.45}.cash-actions{display:flex;gap:8px;flex-wrap:wrap}.cash-actions button{border:0;border-radius:11px;padding:11px 14px;font-weight:900;cursor:pointer}.cash-open-btn{background:#138a48;color:#fff}.cash-close-btn{background:#f0f2f6;color:#0b1739}.cash-day-btn{background:#a60f17;color:#fff}.cash-actions button:disabled{opacity:.42;cursor:not-allowed}.cash-session-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-top:16px}.cash-session-card{background:#f7f8fb;border-radius:13px;padding:12px}.cash-session-card span{display:block;color:#7b8499;font-size:11px;margin-bottom:4px}.cash-session-card strong{display:block;color:#0b1739;font-size:15px}.cash-history{margin-top:16px;border-top:1px solid #edf0f5;padding-top:14px}.cash-history h4{margin:0 0 9px;color:#0b1739;font-size:14px}.cash-history-list{display:grid;gap:7px}.cash-history-row{display:flex;justify-content:space-between;gap:12px;align-items:center;padding:10px 11px;border-radius:11px;background:#f7f8fb}.cash-history-row span{display:block;color:#727b94;font-size:11px;margin-top:2px}.cash-history-row strong{color:#0b1739}.cash-empty{color:#8b93a6;font-size:12px;padding:8px 0}@media(max-width:900px){.cash-session-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
`;
document.head.appendChild(style);

const panel=document.createElement('div');
panel.id='cashControlPanel';
panel.className='cash-control-panel';
panel.innerHTML=`
  <div class="cash-control-head">
    <div class="cash-control-title"><h3>Controle do caixa</h3><p>O garçom só consegue lançar pedidos e fechar contas enquanto o caixa estiver aberto.</p></div>
    <div id="cashStatusBadge" class="cash-status closed"><i></i><span>Caixa fechado</span></div>
  </div>
  <div class="cash-actions" style="margin-top:14px">
    <button id="openCashBtn" class="cash-open-btn" type="button">Abrir caixa</button>
    <button id="closeCashBtn" class="cash-close-btn" type="button">Fechar caixa</button>
    <button id="dayCloseBtn" class="cash-day-btn" type="button">Registrar fechamento do dia</button>
  </div>
  <div id="cashSessionGrid" class="cash-session-grid"></div>
  <div class="cash-history"><h4>Histórico de fechamentos do caixa</h4><div id="cashHistoryList" class="cash-history-list"></div></div>`;
const metrics=section.querySelector('.metrics');
metrics?.before(panel);
if(!metrics)section.prepend(panel);

const $=id=>document.getElementById(id);
function cash(){const c=A.state().cash||{};return{status:c.status==='open'?'open':'closed',openedAt:Number(c.openedAt)||null,openingAmount:Number(c.openingAmount)||0,pausedAt:Number(c.pausedAt)||null,lastClosedAt:Number(c.lastClosedAt)||null}}
function sessionSales(c){if(!c.openedAt)return[];return(A.state().closedSales||[]).filter(s=>Number(s.closedAt||0)>=c.openedAt)}
function fmtDate(ts){if(!ts)return'—';try{return new Date(ts).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})}catch(_){return'—'}}
function render(){
  const c=cash(),sales=sessionSales(c),total=sales.reduce((a,s)=>a+Number(s.total||0),0),cashMoney=sales.filter(s=>s.payment==='Dinheiro').reduce((a,s)=>a+Number(s.total||0),0);
  const badge=$('cashStatusBadge');if(!badge)return;
  badge.className=`cash-status ${c.status}`;badge.querySelector('span').textContent=c.status==='open'?'Caixa aberto':'Caixa fechado';
  $('openCashBtn').textContent=c.openedAt&&c.status==='closed'?'Reabrir caixa':'Abrir caixa';
  $('openCashBtn').disabled=c.status==='open';$('closeCashBtn').disabled=c.status!=='open';$('dayCloseBtn').disabled=!c.openedAt;
  $('cashSessionGrid').innerHTML=`<div class="cash-session-card"><span>Abertura</span><strong>${fmtDate(c.openedAt)}</strong></div><div class="cash-session-card"><span>Fundo inicial</span><strong>${A.brl(c.openingAmount)}</strong></div><div class="cash-session-card"><span>Vendas da sessão</span><strong>${A.brl(total)}</strong></div><div class="cash-session-card"><span>Dinheiro esperado</span><strong>${A.brl(c.openingAmount+cashMoney)}</strong></div>`;
  const hist=(A.state().cashClosings||[]).slice().reverse().slice(0,10);
  $('cashHistoryList').innerHTML=hist.length?hist.map(h=>`<div class="cash-history-row"><div><strong>${fmtDate(h.closedAt)}</strong><span>${Number(h.salesCount||0)} venda(s) • abertura ${fmtDate(h.openedAt)}</span></div><strong>${A.brl(h.salesTotal)}</strong></div>`).join(''):'<div class="cash-empty">Nenhum fechamento de caixa registrado.</div>';
}
async function openCash(){
  const c=cash();if(c.status==='open')return;
  let opening=c.openingAmount;
  if(!c.openedAt){const raw=prompt('Valor inicial do caixa (fundo/troco):','0');if(raw===null)return;opening=Number(String(raw).replace(',','.'));if(!Number.isFinite(opening)||opening<0)return A.toast('Informe um valor inicial válido.');}
  await A.commit(s=>{s.cashClosings=Array.isArray(s.cashClosings)?s.cashClosings:[];if(!s.cash||!Number(s.cash.openedAt)){s.cash={status:'open',openedAt:Date.now(),openingAmount:opening,pausedAt:null,lastClosedAt:s.cash?.lastClosedAt||null}}else{s.cash.status='open';s.cash.pausedAt=null}},c.openedAt?'Caixa reaberto • garçons liberados':'Caixa aberto • garçons liberados');
  render();
}
async function closeCash(){
  if(A.openOrders().length)return A.toast('Feche todas as mesas e comandas antes de fechar o caixa.');
  if(!confirm('Fechar o caixa agora? Os garçons não poderão lançar pedidos até ele ser reaberto.'))return;
  await A.commit(s=>{s.cash=s.cash||{};s.cash.status='closed';s.cash.pausedAt=Date.now()},'Caixa fechado • lançamentos bloqueados');render();
}
async function registerDayClose(){
  const c=cash();if(!c.openedAt)return A.toast('Não existe uma sessão de caixa para registrar.');
  if(A.openOrders().length)return A.toast('Feche todas as mesas e comandas antes do fechamento do dia.');
  const sales=sessionSales(c),total=sales.reduce((a,s)=>a+Number(s.total||0),0),payments={};sales.forEach(s=>{const k=s.payment||'Não informado';payments[k]=(payments[k]||0)+Number(s.total||0)});
  if(!confirm(`Registrar fechamento do dia com ${sales.length} venda(s) e total de ${A.brl(total)}?\n\nO caixa ficará fechado após o registro.`))return;
  const now=Date.now();
  await A.commit(s=>{s.cashClosings=Array.isArray(s.cashClosings)?s.cashClosings:[];s.cashClosings.push({id:now,openedAt:c.openedAt,closedAt:now,openingAmount:c.openingAmount,salesCount:sales.length,salesTotal:total,payments});s.cash={status:'closed',openedAt:null,openingAmount:0,pausedAt:null,lastClosedAt:now}},'Fechamento do dia registrado • caixa fechado');render();
}
$('openCashBtn').onclick=openCash;$('closeCashBtn').onclick=closeCash;$('dayCloseBtn').onclick=registerDayClose;
render();setInterval(render,800);
})();
