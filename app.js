(()=>{
  const VERSION='6';
  const css=document.createElement('link');
  css.rel='stylesheet';
  css.href=`/v2.css?v=${VERSION}`;
  document.head.appendChild(css);

  const shared=document.createElement('script');
  shared.src=`/shared.js?v=${VERSION}`;
  shared.onload=()=>{
    const page=document.createElement('script');
    const isAdmin=document.body.dataset.page==='admin';
    page.src=isAdmin?`/admin.js?v=${VERSION}`:`/waiter.js?v=${VERSION}`;
    page.onload=()=>{
      if(isAdmin){
        const patch=document.createElement('script');
        patch.src=`/admin-patch.js?v=${VERSION}`;
        document.body.appendChild(patch);
      }
    };
    document.body.appendChild(page);
  };
  document.body.appendChild(shared);
})();
