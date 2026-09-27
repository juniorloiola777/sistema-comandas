(()=>{
  const VERSION='7';
  const isAdmin=document.body.dataset.page==='admin';
  if(isAdmin)document.getElementById('adminView')?.classList.add('hidden');

  const css=document.createElement('link');
  css.rel='stylesheet';
  css.href=`/v2.css?v=${VERSION}`;
  document.head.appendChild(css);

  const shared=document.createElement('script');
  shared.src=`/shared.js?v=${VERSION}`;
  shared.onload=()=>{
    const page=document.createElement('script');
    page.src=isAdmin?`/admin-auth.js?v=${VERSION}`:`/waiter.js?v=${VERSION}`;
    document.body.appendChild(page);
  };
  document.body.appendChild(shared);
})();
