(()=>{
  const VERSION='21';

  // Comportamento de app: trava a escala e evita zoom por gesto ou foco em campos no celular.
  const viewport=document.querySelector('meta[name="viewport"]');
  if(viewport)viewport.setAttribute('content','width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover');

  const noZoomStyle=document.createElement('style');
  noZoomStyle.textContent=`
    html,body{touch-action:manipulation;-webkit-text-size-adjust:100%;}
    @media (max-width:900px){input,select,textarea{font-size:16px!important;}}
    .cp-boot{position:fixed;inset:0;z-index:100000;display:grid;place-items:center;background:#08142f;color:#fff;font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Arial;padding:24px}.cp-boot-card{text-align:center;max-width:330px}.cp-boot-logo{width:62px;height:62px;margin:0 auto 14px;border-radius:19px;display:grid;place-items:center;background:#b51019;font-size:24px;font-weight:950}.cp-boot-title{font-size:22px;font-weight:950}.cp-boot-msg{margin-top:7px;color:#c9d0e1;font-size:13px;line-height:1.5}.cp-boot-retry{display:none;margin:16px auto 0;border:0;border-radius:12px;padding:11px 16px;background:#fff;color:#0b1739;font-weight:900}.cp-boot.error .cp-boot-retry{display:block}
  `;
  document.head.appendChild(noZoomStyle);

  ['gesturestart','gesturechange','gestureend'].forEach(type=>{
    document.addEventListener(type,event=>event.preventDefault(),{passive:false});
  });
  document.addEventListener('wheel',event=>{
    if(event.ctrlKey)event.preventDefault();
  },{passive:false});

  const isAdmin=document.body.dataset.page==='admin';
  const mainView=document.getElementById(isAdmin?'adminView':'waiterView');
  mainView?.classList.add('hidden');

  const boot=document.createElement('div');
  boot.className='cp-boot';
  boot.innerHTML=`<div class="cp-boot-card"><div class="cp-boot-logo">CP</div><div class="cp-boot-title">Comanda Prime</div><div class="cp-boot-msg">Carregando sistema...</div><button class="cp-boot-retry" type="button">Tentar novamente</button></div>`;
  document.body.appendChild(boot);
  boot.querySelector('.cp-boot-retry').onclick=()=>location.reload();
  function bootError(){if(!document.body.contains(boot))return;boot.classList.add('error');boot.querySelector('.cp-boot-msg').textContent='Não foi possível carregar os arquivos do sistema. Verifique a internet e tente novamente.'}
  function bootDone(){boot.remove()}

  const css=document.createElement('link');
  css.rel='stylesheet';
  css.href=`/v2.css?v=${VERSION}`;
  document.head.appendChild(css);

  function loadScript(path,onload,onerror){
    const s=document.createElement('script');
    s.src=`/${path}?v=${VERSION}`;
    if(onload)s.onload=onload;
    if(onerror)s.onerror=onerror;
    document.body.appendChild(s);
    return s;
  }

  function loadExtraModules(){
    (isAdmin?['admin-order-edit.js','admin-cash-control.js','admin-unpaid.js','admin-delete-user.js']:['waiter-close.js','waiter-cash-guard.js']).forEach(path=>loadScript(path));
  }

  const shared=document.createElement('script');
  shared.src=`/shared.js?v=${VERSION}`;
  shared.onload=()=>{
    const loadPage=()=>{
      const loadAuth=()=>{
        loadScript(isAdmin?'admin-auth.js':'waiter-auth.js',()=>{
          bootDone();
          loadExtraModules();
          if(isAdmin)loadScript('admin-reset.js');
        },bootError);
      };
      // Aplica a correção de interação antes de criar a tela de login.
      loadScript('login-interaction-fix.js',loadAuth,loadAuth);
    };
    if(isAdmin){
      loadScript('admin-access-fix.js',loadPage,loadPage);
    }else loadPage();
  };
  shared.onerror=bootError;
  document.body.appendChild(shared);

  setTimeout(()=>{if(document.body.contains(boot))bootError()},12000);
})();
