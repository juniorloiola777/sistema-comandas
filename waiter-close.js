(()=>{
const A=window.APP;
if(!A||document.getElementById('waiterPaymentOverlay'))return;
const SUPABASE_URL='https://dsipffnmerbowaddbcxe.supabase.co';
const SUPABASE_KEY='sb_publishable_vI64CItP0mGD4HD2DFJ2zw_zyZaveCz';
const db=window.supabase?.createClient(SUPABASE_URL,SUPABASE_KEY);
let target=null,payment='';

const style=document.createElement('style');
style.textContent=`
.waiter-pay-overlay{position:fixed;inset:0;z-index:9999;background:rgba(5,12,32,.68);display:grid;place-items:end center;padding:14px}.waiter-pay-overlay.hidden{display:none}.waiter-pay-sheet{width:min(470px,100%);background:#fff;border-radius:24px 24px 18px 18px;padding:20px;box-shadow:0 25px 70px rgba(0,0,0,.3)}.waiter-pay-head{display:flex;align-items:center;justify-content:space-between;gap:12px}.waiter-pay-head h3{margin:0;color:#0b1739;font-size:22px}.waiter-pay-x{border:0;background:#eef1f6;border-radius:10px;width:38px;height:38px;font-size:22px;color:#0b1739}.waiter-pay-summary{margin:14px 0;padding:14px;border-radius:14px;background:#f6f7fb;display:flex;justify-content:space-between;gap:12px;align-items:center}.waiter-pay-summary span{display:block;color:#727b94;font-size:12px;margin-top:3px}.waiter-pay-total{font-size:22px;color:#0b1739}.waiter-pay-label{font-weight:900;color:#4e5872;font-size:12px;margin:4px 0 9px}.waiter-pay-methods{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.waiter-pay-method{border:2px solid #e4e7ef;background:#fff;border-radius:14px;padding:14px 8px;font-weight:900;color:#0b1739}.waiter-pay-method.active{border-color:#b51019;background:#fff3f3;color:#a60f17}.waiter-pay-confirm{width:100%;border:0;border-radius:14px;padding:15px;margin-top:15px;background:#b51019;color:#fff;font-weight:950;font-size:16px}.waiter-pay-confirm:disabled{opacity:.55}.waiter-pay-note{font-size:11px;color:#858da3;line-height:1.45;margin-top:10px;text-align:center}
`;
document.head.appendChild(style);

const overlay=document.createElement('div');
overlay.id='waiterPaymentOverlay';
overlay.className='waiter-pay-overlay hidden';
overlay.innerHTML=`<div class="waiter-pay-sheet"><div class="waiter-pay-head"><h3>Fechar conta</h3><button class="waiter-pay-x" type="button">×</button></div><div id="waiterPaySummary" class="waiter-pay-summary"></div><div class="waiter-pay-label">Forma de pagamento</div><div class="waiter-pay-methods"><button class="waiter-pay-method" data-pay="Pix" type="button">Pix</button><button class="waiter-pay-method" data-pay="Débito" type="button">Débito</button><button class="waiter-pay-method" data-pay="Crédito" type="button">Crédito</button></div><button id="waiterPayConfirm" class="waiter-pay-confirm" type="button" disabled>Confirmar fechamento</button><div class="waiter-pay-note">Ao confirmar, a venda entra no caixa e a mesa/comanda é liberada imediatamente.</div></div>`;
document.body.appendChild(overlay);

function session(){try{return JSON.parse(localStorage.getItem('comandaPrimeWaiterSessionV1')||'null')}catch(_){return null}}
function identifyOpenOrder(){
  const title=document.getElementById('sheetTitle')?.textContent||'';
  let m=title.match(/^Mesa\s+(\d+)/i);if(m)return{type:'mesa',id:Number(m[1])};
  m=title.match(/^Comanda\s+#(\d+)/i);if(m)return{type:'comanda',id:Number(m[1])};
  return null;
}
function findOrder(ref){const s=A.state();return ref?.type==='mesa'?s.tables.find(x=>x.id===ref.id):s.tabs.find(x=>x.id===ref?.id)}
function openPayment(){
  if(A.state()?.cash?.status!=='open')return A.toast('Caixa fechado. Aguarde o administrador abrir o caixa.');
  target=identifyOpenOrder();payment='';
  const order=findOrder(target);if(!target||!order)return A.toast('Abra uma mesa ou comanda existente para fechar.');
  if(!(order.items||[]).length)return A.toast('Não há itens para fechar.');
  document.querySelectorAll('.waiter-pay-method').forEach(b=>b.classList.remove('active'));
  document.getElementById('waiterPayConfirm').disabled=true;
  document.getElementById('waiterPaySummary').innerHTML=`<div><strong>${target.type==='mesa'?'Mesa '+target.id:'Comanda #'+target.id}</strong><span>${A.esc(order.client||'Cliente')}</span></div><strong class="waiter-pay-total">${A.brl(order.total)}</strong>`;
  overlay.classList.remove('hidden');
}
function closePayment(){overlay.classList.add('hidden');target=null;payment=''}
async function finish(){
  if(!target||!payment||!db)return;
  if(A.state()?.cash?.status!=='open'){closePayment();return A.toast('Caixa fechado. Fechamento bloqueado.')}
  const s=session();if(!s?.token){A.toast('Sessão encerrada. Entre novamente.');return}
  const btn=document.getElementById('waiterPayConfirm');btn.disabled=true;btn.textContent='Fechando...';
  const {data,error}=await db.rpc('waiter_close_sale_guarded',{p_session_token:s.token,p_type:target.type,p_id:target.id,p_payment:payment});
  btn.textContent='Confirmar fechamento';
  if(error){console.error(error);btn.disabled=false;const m=String(error.message||'');return A.toast(m.toLowerCase().includes('caixa fechado')?'Caixa fechado. Aguarde o administrador abrir.':(m||'Não foi possível fechar a conta.'))}
  const r=Array.isArray(data)?data[0]:data;
  if(!r?.success){btn.disabled=false;return A.toast('Essa conta já foi fechada ou não está mais disponível.')}
  const paid=payment;
  closePayment();
  document.getElementById('overlay')?.classList.add('hidden');
  A.toast(`Pagamento em ${paid} confirmado • conta fechada`);
}

overlay.querySelector('.waiter-pay-x').onclick=closePayment;
overlay.addEventListener('click',e=>{if(e.target===overlay)closePayment()});
overlay.querySelectorAll('[data-pay]').forEach(b=>b.onclick=()=>{payment=b.dataset.pay;overlay.querySelectorAll('[data-pay]').forEach(x=>x.classList.toggle('active',x===b));document.getElementById('waiterPayConfirm').disabled=false});
document.getElementById('waiterPayConfirm').onclick=finish;

function labelButton(){const b=document.getElementById('requestClose');if(b)b.textContent='Fechar conta'}
labelButton();new MutationObserver(labelButton).observe(document.body,{childList:true,subtree:true});
document.addEventListener('click',e=>{const b=e.target.closest?.('#requestClose');if(!b||b.classList.contains('hidden'))return;e.preventDefault();e.stopImmediatePropagation();openPayment()},true);
})();
