(()=>{
const A=window.APP;
if(!A||document.getElementById('cashControlPanel'))return;
const section=document.querySelector('[data-section="caixa"]');
if(!section)return;

const ADMIN_ACTOR='Administrador';
if(!window.__cpCashAuditWrapped){
  window.__cpCashAuditWrapped=true;
  const originalCommit=A.commit;
  A.commit=async(mutator,msg)=>originalCommit(s=>{
    const before=Object.assign({},s.cash||{}),beforeStatus=before.status==='open'?'open':'closed',beforeOpenedAt=Number(before.openedAt)||null;
    mutator(s);
    const after=s.cash||{},afterStatus=after.status==='open'?'open':'closed',afterOpenedAt=Number(after.openedAt)||null;
    if(beforeStatus!==afterStatus){
      const now=Date.now();s.cashHistory=Array.isArray(s.cashHistory)?s.cashHistory:[];
      let action='close';
      if(beforeStatus==='closed'&&afterStatus==='open')action=beforeOpenedAt?'reopen':'open';
      else if(beforeStatus==='open'&&afterStatus==='closed')action=afterOpenedAt?'close':'day_close';
      if(action==='open'||action==='reopen'){after.openedBy=ADMIN_ACTOR;after.openedByUsername='admin'}else{after.closedBy=ADMIN_ACTOR;after.closedByUsername='admin'}
      s.cashHistory.push({id:now,action,actor:ADMIN_ACTOR,username:'admin',at:now,openingAmount:Number(after.openingAmount||before.openingAmount||0)});
    }
  },msg);
}

const style=document.createElement('style');
style.textContent=`
.cash-control-panel{margin-bottom:16px;border:1px solid #e3e7ef;background:#fff;border-radius:18px;padding:18px}.cash-control-head{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;flex-wrap:wrap}.cash-status{display:inline-flex;align-items:center;gap:7px;border-radius:999px;padding:7px 11px;font-size:12px;font-weight:950}.cash-status.open{background:#eaf8ef;color:#14723a}.cash-status.closed{background:#fff0f0;color:#a60f17}.cash-status i{width:8px;height:8px;border-radius:50%;background:currentColor}.cash-control-title h3{margin:0 0 5px;color:#0b1739;font-size:20px}.cash-control-title p{margin:0;color:#7b8499;font-size:12px;line-height:1.45}.cash-actions{display:flex;gap:8px;flex-wrap:wrap}.cash-actions button{border:0;border-radius:11px;padding:11px 14px;font-weight:900;cursor:pointer}.cash-open-btn{background:#138a48;color:#fff}.cash-close-btn{background:#f0f2f6;color:#0b1739}.cash-day-btn{background:#a60f17;color:#fff}.cash-actions button:disabled{opacity:.42;cursor:not-allowed}.cash-session-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-top:16px}.cash-session-card{background:#f7f8fb;border-radius:13px;padding:12px}.cash-session-card span{display:block;color:#7b8499;font-size:11px;margin-bottom:4px}.cash-session-card strong{display:block;color:#0b1739;font-size:15px}.cash-history{margin-top:16px;border-top:1px solid #edf0f5;padding-top:14px}.cash-history h4{margin:0 0 9px;color:#0b1739;font-size:14px}.cash-history-list{display:grid;gap:7px}.cash-history-row{display:flex;justify-content:space-between;gap:12px;align-items:center;padding:10px 11px;border-radius:11px;background:#f7f8fb}.cash-history-row span{display:block;color:#727b94;font-size:11px;margin-top:2px}.cash-history-row strong{color:#0b1739}.cash-action-label{font-weight:950}.cash-empty{color:#8b93a6;font-size:12px;padding:8px 0}@media(max-width:900px){.cash-session-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
`;
document.head.appendChild(style);

const panel=document.createElement('div');
panel.id='cashControlPanel';panel.className='cash-control-panel';
panel.innerHTML=`<div class="cash-control-head"><div class="cash-control-title"><h3>Controle do caixa</h3><p>Administrador e garçons podem abrir ou fechar o caixa. Toda ação fica registrada com nome, data e hora.</p></div><div id="cashStatusBadge" class="cash-status closed"><i></i><span>Caixa fechado</span></div></div><div class="cash-actions" style="margin-top:14px"><button id="openCashBtn" class="cash-open-btn" type="button">Abrir caixa</button><button id="closeCashBtn" class="cash-close-btn" type="button">Fechar caixa</button><button id="dayCloseBtn" class="cash-day-btn" type="button">Registrar fechamento do dia</button></div><div id="cashSessionGrid" class="cash-session-grid"></div><div class="cash-history"><h4>Histórico de abertura e fechamento</h4><div id="cashHistoryList" class="cash-history-list"></div></div>`;
const metrics=section.querySelector('.metrics');metrics?.before(panel);if(!metrics)section.prepend(panel);
const $=id=>document.getElementById(id);
function cash(){const c=A.state().cash||{};return{status:c.status==='open'?'open':'closed',openedAt:Number(c.openedAt)||null,openingAmount:Number(c.openingAmount)||0,pausedAt:Number(c.pausedAt)||null,lastClosedAt:Number(c.lastClosedAt)||null,openedBy:c.openedBy||'',closedBy:c.closedBy||''}}
function sessionSales(c){if(!c.openedAt)return[];return(A.state().closedSales||[]).filter(s=>Number(s.closedAt||0)>=c.openedAt)}
function fmtDate(ts){if(!ts)return'—';try{return new Date(Number(ts)).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'})}catch(_){return'—'}}
function actionText(a){return a==='open'?'Abertura':a==='reopen'?'Reabertura':a==='day_close'?'Fechamento do dia':'Fechamento'}
function render(){
  const c=cash(),sales=sessionSales(c),total=sales.reduce((a,s)=>a+Number(s.total||0),0),cashMoney=sales.filter(s=>s.payment==='Dinheiro').reduce((a,s)=>a+Number(s.total||0),0),badge=$('cashStatusBadge');if(!badge)return;
  badge.className=`cash-status ${c.status}`;badge.querySelector('span').textContent=c.status==='open'?'Caixa aberto':'Caixa fechado';
  $('openCashBtn').textContent=c.openedAt&&c.status==='closed'?'Reabrir caixa':'Abrir caixa';$('openCashBtn').disabled=c.status==='open';$('closeCashBtn').disabled=c.status!=='open';$('dayCloseBtn').disabled=!c.openedAt;
  $('cashSessionGrid').innerHTML=`<div class="cash-session-card"><span>Abertura</span><strong>${fmtDate(c.openedAt)}</strong></div><div class="cash-session-card"><span>Aberto por</span><strong>${A.esc(c.openedBy||'—')}</strong></div><div class="cash-session-card"><span>Vendas da sessão</span><strong>${A.brl(total)}</strong></div><div class="cash-session-card"><span>Dinheiro esperado</span><strong>${A.brl(c.openingAmount+cashMoney)}</strong></div>`;
  const hist=(A.state().cashHistory||[]).slice().reverse().slice(0,30);
  $('cashHistoryList').innerHTML=hist.length?hist.map(h=>`<div class="cash-history-row"><div><strong class="cash-action-label">${actionText(h.action)} • ${A.esc(h.actor||'Usuário')}</strong><span>${fmtDate(h.at)}${h.username?` • login ${A.esc(h.username)}`:''}</span></div><strong>${h.action==='open'||h.action==='reopen'?A.brl(h.openingAmount||0):''}</strong></div>`).join(''):'<div class="cash-empty">Nenhuma abertura ou fechamento registrado.</div>';
}
async function openCash(){const c=cash();if(c.status==='open')return;let opening=c.openingAmount;if(!c.openedAt){const raw=prompt('Valor inicial do caixa (fundo/troco):','0');if(raw===null)return;opening=Number(String(raw).replace(',','.'));if(!Number.isFinite(opening)||opening<0)return A.toast('Informe um valor inicial válido.')}await A.commit(s=>{s.cashClosings=Array.isArray(s.cashClosings)?s.cashClosings:[];if(!s.cash||!Number(s.cash.openedAt)){s.cash={status:'open',openedAt:Date.now(),openingAmount:opening,pausedAt:null,lastClosedAt:s.cash?.lastClosedAt||null}}else{s.cash.status='open';s.cash.pausedAt=null}},c.openedAt?'Caixa reaberto':'Caixa aberto');render()}
async function closeCash(){if(A.openOrders().length)return A.toast('Feche todas as mesas e comandas antes de fechar o caixa.');if(!confirm('Fechar o caixa agora? Esta ação ficará registrada no histórico.'))return;await A.commit(s=>{s.cash=s.cash||{};s.cash.status='closed';s.cash.pausedAt=Date.now()},'Caixa fechado');render()}
async function registerDayClose(){const c=cash();if(!c.openedAt)return A.toast('Não existe uma sessão de caixa para registrar.');if(A.openOrders().length)return A.toast('Feche todas as mesas e comandas antes do fechamento do dia.');const sales=sessionSales(c),total=sales.reduce((a,s)=>a+Number(s.total||0),0),payments={};sales.forEach(s=>{const k=s.payment||'Não informado';payments[k]=(payments[k]||0)+Number(s.total||0)});if(!confirm(`Registrar fechamento do dia com ${sales.length} venda(s) e total de ${A.brl(total)}?\n\nO caixa ficará fechado após o registro.`))return;const now=Date.now();await A.commit(s=>{s.cashClosings=Array.isArray(s.cashClosings)?s.cashClosings:[];s.cashClosings.push({id:now,openedAt:c.openedAt,closedAt:now,openingAmount:c.openingAmount,salesCount:sales.length,salesTotal:total,payments,openedBy:s.cash?.openedBy||'',closedBy:ADMIN_ACTOR});s.cash={status:'closed',openedAt:null,openingAmount:0,pausedAt:null,lastClosedAt:now,closedBy:ADMIN_ACTOR}},'Fechamento do dia registrado • caixa fechado');render()}
$('openCashBtn').onclick=openCash;$('closeCashBtn').onclick=closeCash;$('dayCloseBtn').onclick=registerDayClose;
render();setInterval(render,800);
})();
