(()=>{
const A=window.APP;
if(!A||document.body.dataset.page!=='waiter'||window.__cpWaiterTimeFix)return;
window.__cpWaiterTimeFix=true;
function fmtBrasilia(ts){
  if(!ts)return'';
  return new Date(Number(ts)).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo',day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit',hour12:false});
}
function refresh(){
  const info=document.getElementById('waiterCashControlActor'),status=document.getElementById('waiterCashControlStatus'),openBtn=document.getElementById('waiterOpenCash');
  if(!info||!status)return;
  const c=A.state()?.cash||{status:'closed'},open=c.status==='open';
  status.textContent=open?'Caixa aberto':'Caixa fechado';
  if(open){
    const actor=c.openedBy||'';
    info.textContent=`${actor?'Aberto por '+actor+' • ':''}${fmtBrasilia(c.openedAt)}`;
  }else{
    info.textContent='Você pode abrir o caixa para iniciar o atendimento.';
    if(openBtn)openBtn.textContent='Abrir caixa';
  }
}
refresh();setInterval(refresh,350);
})();
