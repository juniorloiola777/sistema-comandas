(()=>{
  const css=document.createElement('link');
  css.rel='stylesheet';
  css.href='/v2.css';
  document.head.appendChild(css);
  const shared=document.createElement('script');
  shared.src='/shared.js';
  shared.onload=()=>{
    const page=document.createElement('script');
    page.src=document.body.dataset.page==='admin'?'/admin.js':'/waiter.js';
    document.body.appendChild(page);
  };
  document.body.appendChild(shared);
})();
