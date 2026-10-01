(()=>{
  const VERSION='34';

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
  document.addEventListener('wheel',event=>{if(event.ctrlKey)event.preventDefault()},{passive:false});

  const isAdmin=document.body.dataset.page==='admin';
  if(!isAdmin){
    const waiterOrderStyle=document.createElement('style');
    waiterOrderStyle.textContent=`
      body[data-page="waiter"] #overlay .sheet{height:93vh;max-height:93vh;overflow:hidden;display:flex;flex-direction:column}
      body[data-page="waiter"] #overlay .sheet-head{position:relative;top:auto;flex:0 0 auto;z-index:3}
      body[data-page="waiter"] #overlay .sheet-body{flex:1 1 auto;min-height:0;overflow:hidden;display:flex;flex-direction:column;padding:16px}
      body[data-page="waiter"] #overlay .client-line{flex:0 0 auto}
      body[data-page="waiter"] #overlay .chips{flex:0 0 auto;scrollbar-width:none}
      body[data-page="waiter"] #overlay .chips::-webkit-scrollbar{display:none}
      body[data-page="waiter"] #overlay .products{flex:1 1 auto;min-height:180px;overflow-y:auto;overflow-x:hidden;-webkit-overflow-scrolling:touch;overscroll-behavior:contain;padding:2px 1px 14px}
      body[data-page="waiter"] #overlay .cart{flex:0 0 auto;max-height:32vh;overflow-y:auto;-webkit-overflow-scrolling:touch;margin-top:10px}
      @media(max-height:700px){body[data-page="waiter"] #overlay .products{min-height:135px}body[data-page="waiter"] #overlay .cart{max-height:29vh}}
    `;
    document.head.appendChild(waiterOrderStyle);
  }

  const mainView=document.getElementById(isAdmin?'adminView':'waiterView');mainView?.classList.add('hidden');
  const boot=document.createElement('div');boot.className='cp-boot';boot.innerHTML=`<div class="cp-boot-card"><div class="cp-boot-logo">C</div><div class="cp-boot-title">Comanda</div><div class="cp-boot-msg">Carregando sistema...</div><button class="cp-boot-retry" type="button">Tentar novamente</button></div>`;document.body.appendChild(boot);boot.querySelector('.cp-boot-retry').onclick=()=>location.reload();
  function bootError(){if(!document.body.contains(boot))return;boot.classList.add('error');boot.querySelector('.cp-boot-msg').textContent='Não foi possível carregar os arquivos do sistema. Verifique a internet e tente novamente.'}
  function bootDone(){boot.remove()}
  const css=document.createElement('link');css.rel='stylesheet';css.href=`/v2.css?v=${VERSION}`;document.head.appendChild(css);
  function loadScript(path,onload,onerror){const s=document.createElement('script');s.src=`/${path}?v=${VERSION}`;if(onload)s.onload=onload;if(onerror)s.onerror=onerror;document.body.appendChild(s);return s}
  function loadExtraModules(){
    if(isAdmin){
      ['admin-order-edit.js','admin-cash-control.js','admin-unpaid.js','admin-delete-user.js','admin-report-detail.js','admin-product-actions.js','admin-product-delete-lock.js','admin-audit-v28.js'].forEach(path=>loadScript(path));
    }else{
      loadScript('waiter-cash-control.js',()=>{
        loadScript('waiter-cash-guard.js',()=>{
          loadScript('waiter-ui-v28.js',()=>loadScript('waiter-ui-v30-fixes.js',()=>loadScript('waiter-ui-v34-fixes.js')));
        });
      });
    }
  }
  function installPersistentWaiterSession(){
    if(isAdmin||!window.APP)return;const A=window.APP;
    const SUPABASE_URL='https://dsipffnmerbowaddbcxe.supabase.co';const SUPABASE_KEY='sb_publishable_vI64CItP0mGD4HD2DFJ2zw_zyZaveCz';const SESSION_KEY='comandaPrimeWaiterSessionV1';const THIRTY_DAYS=30*24*60*60*1000;
    const readSession=()=>{try{return JSON.parse(localStorage.getItem(SESSION_KEY)||'null')}catch(_){return null}};const saveSession=s=>{try{s?localStorage.setItem(SESSION_KEY,JSON.stringify(s)):localStorage.removeItem(SESSION_KEY)}catch(_){}};
    A.waiterSession=async()=>{const s=readSession();if(!s?.token)return{ok:false,reason:'no_session'};const localUser={username:s.username,displayName:s.displayName||s.username};const exp=s.expiresAt?Date.parse(s.expiresAt):NaN;if(Number.isFinite(exp)&&exp<=Date.now()){saveSession(null);return{ok:false,reason:'expired'}}if(!A.cloud)return{ok:true,user:localUser};const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),4500);try{const res=await fetch(`${SUPABASE_URL}/rest/v1/rpc/waiter_validate_session`,{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json','apikey':SUPABASE_KEY},body:JSON.stringify({p_session_token:s.token}),signal:controller.signal,cache:'no-store'});if(!res.ok)throw new Error(`Falha HTTP ${res.status}`);const data=await res.json();const r=Array.isArray(data)?data[0]:data;if(!r?.valid){saveSession(null);return{ok:false,reason:'invalid'}}const next={...s,username:r.username,displayName:r.display_name||s.displayName,expiresAt:new Date(Date.now()+THIRTY_DAYS).toISOString()};saveSession(next);return{ok:true,user:{username:next.username,displayName:next.displayName}}}catch(error){console.warn('Validação online indisponível; mantendo sessão local do garçom.',error);return{ok:true,user:localUser,offline:true}}finally{clearTimeout(timer)}};
  }
  const shared=document.createElement('script');shared.src=`/shared.js?v=${VERSION}`;shared.onload=()=>{installPersistentWaiterSession();const loadPage=()=>{const loadAuth=()=>{loadScript(isAdmin?'admin-auth.js':'waiter-auth.js',()=>{bootDone();loadExtraModules();if(isAdmin)loadScript('admin-reset.js')},bootError)};loadScript('login-interaction-fix.js',loadAuth,loadAuth)};if(isAdmin)loadScript('admin-access-fix.js',loadPage,loadPage);else loadPage()};shared.onerror=bootError;document.body.appendChild(shared);
  setTimeout(()=>{if(document.body.contains(boot))bootError()},12000);
})();