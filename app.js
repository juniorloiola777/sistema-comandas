(()=>{
  const VERSION='13';

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

  const shared=document.createElement('script');
  shared.src=`/shared.js?v=${VERSION}`;
  shared.onload=()=>{
    const loadPage=()=>{
      const page=document.createElement('script');
      page.src=isAdmin?`/admin-auth.js?v=${VERSION}`:`/waiter-auth.js?v=${VERSION}`;
      document.body.appendChild(page);
      if(isAdmin){
        const reset=document.createElement('script');
        reset.src=`/admin-reset.js?v=${VERSION}`;
        document.body.appendChild(reset);
      }
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
