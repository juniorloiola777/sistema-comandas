(()=>{
  const VERSION='12';
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
