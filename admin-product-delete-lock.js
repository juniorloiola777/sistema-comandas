(()=>{
  if(document.body.dataset.page!=='admin')return;
  let attempts=0;
  const timer=setInterval(()=>{
    attempts++;
    const fn=window.deleteProduct;
    if(typeof fn!=='function'||!String(fn).includes('admin_delete_product')){
      if(attempts>80)clearInterval(timer);
      return;
    }
    clearInterval(timer);
    const protectedDelete=fn;
    try{
      Object.defineProperty(window,'deleteProduct',{
        configurable:true,
        enumerable:true,
        get(){return protectedDelete},
        set(next){
          if(typeof next==='function'&&String(next).includes('admin_delete_product'))return;
          console.warn('Função antiga de excluir produto ignorada.');
        }
      });
    }catch(_){
      window.deleteProduct=protectedDelete;
    }
  },100);
})();
