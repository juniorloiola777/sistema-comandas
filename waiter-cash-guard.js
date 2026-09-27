(()=>{
const A=window.APP;
if(!A||document.getElementById('waiterCashBanner'))return;
const content=document.querySelector('#waiterView .content');if(!content)return;
const style=document.createElement('style');
style.textContent=`
.waiter-cash-banner{margin-bottom:12px;border-radius:14px;padding:12px 14px;background:#fff0f0;border:1px solid #ffd1d1;color:#8e1018;font-size:12px;font-weight:850;line-height:1.45}.waiter-cash-banner.hidden{display:none}.waiter-cash-banner strong{display:block;font-size:13px;margin-bottom:2px}.cash-blocked{opacity:.48!important;cursor:not-allowed!important}
`;
document.head.appendChild(style);
const banner=document.createElement('div');banner.id='waiterCashBanner';banner.className='waiter-cash-banner hidden';banner.innerHTML='<strong>Caixa fechado</strong>Aguarde o administrador abrir o caixa para lançar pedidos ou fechar contas.';content.prepend(banner);
function isOpen(){return A.state()?.cash?.status==='open'}
function refresh(){const open=isOpen();banner.classList.toggle('hidden',open);['newTable','newTab','confirmOrder','requestClose'].forEach(id=>{const b=document.getElementById(id);if(b){b.disabled=!open;b.classList.toggle('cash-blocked',!open)}});document.querySelectorAll('#productsGrid .add').forEach(b=>{if(!open){b.disabled=true;b.classList.add('cash-blocked')}else b.classList.remove('cash-blocked')})}
function block(e){if(isOpen())return;const t=e.target.closest?.('#newTable,#newTab,#confirmOrder,#requestClose,#productsGrid .add');if(!t)return;e.preventDefault();e.stopImmediatePropagation();A.toast('Caixa fechado. Aguarde o administrador abrir o caixa.')}
document.addEventListener('click',block,true);refresh();setInterval(refresh,500);
})();
