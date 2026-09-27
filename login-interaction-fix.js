(()=>{
  document.querySelectorAll('.cp-boot').forEach(e=>e.remove());
  document.querySelectorAll('body > .overlay').forEach(e=>e.classList.add('hidden'));
  document.documentElement.style.pointerEvents='auto';
  document.body.style.pointerEvents='auto';
  const style=document.createElement('style');
  style.textContent=`
    .waiter-auth-gate,.admin-auth-gate{position:fixed!important;inset:0!important;z-index:2147483647!important;pointer-events:auto!important;touch-action:manipulation!important;overflow:auto!important;-webkit-overflow-scrolling:touch}
    .waiter-auth-gate *,.admin-auth-gate *{pointer-events:auto!important}
    .waiter-auth-gate input,.admin-auth-gate input{touch-action:manipulation!important;-webkit-user-select:text!important;user-select:text!important}
  `;
  document.head.appendChild(style);
})();
