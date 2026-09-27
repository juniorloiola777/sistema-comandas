(()=>{
  const VERSION='15';

  // Comportamento de app: trava a escala e evita zoom por gesto ou foco em campos no celular.
  const viewport=document.querySelector('meta[name="viewport"]');
  if(viewport)viewport.setAttribute('content','width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover');

  const noZoomStyle=document.createElement('style');
  noZoomStyle.textContent=`
    html,body{touch-action:manipulation;-webkit-text-size-adjust:100%;}
    @media (max-width:900px){input,select,textarea{font-size:16px!important;}}
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

  const css=document.createElement('link');
  css.rel='stylesheet';
  css.href=`/v2.css?v=${VERSION}`;
  document.head.appendChild(css);

  function loadScript(path){const s=document.createElement('script');s.src=`/${path}?v=${VERSION}`;document.body.appendChild(s)}
  function loadExtraModules(){
    (isAdmin?['admin-order-edit.js','admin-cash-control.js']:['waiter-close.js','waiter-cash-guard.js']).forEach(loadScript);
  }

  const shared=document.createElement('script');
  shared.src=`/shared.js?v=${VERSION}`;
  shared.onload=()=>{
    const loadPage=()=>{
      loadScript(isAdmin?'admin-auth.js':'waiter-auth.js');
      loadExtraModules();
      if(isAdmin)loadScript('admin-reset.js');
    };
    if(isAdmin){
      const fix=document.createElement('script');
      fix.src=`/admin-access-fix.js?v=${VERSION}`;
      fix.onload=loadPage;
      fix.onerror=loadPage;
      document.body.appendChild(fix);
    }else loadPage();
  };
  document.body.appendChild(shared);
})();
