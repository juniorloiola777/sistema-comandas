(()=>{
const A=window.APP;
const waiterView=document.getElementById('waiterView');
waiterView?.classList.add('hidden');
document.body.classList.remove('waiter-ui-ready');

const SUPABASE_URL='https://dsipffnmerbowaddbcxe.supabase.co';
const SUPABASE_KEY='sb_publishable_vI64CItP0mGD4HD2DFJ2zw_zyZaveCz';
const SESSION_KEY='comandaPrimeWaiterSessionV1';
const APP_VERSION='41';

document.querySelectorAll('body > .overlay').forEach(e=>e.classList.add('hidden'));
document.documentElement.style.pointerEvents='auto';
document.body.style.pointerEvents='auto';

const style=document.createElement('style');
style.textContent=`
.waiter-auth-gate{position:fixed!important;inset:0!important;z-index:2147483647!important;min-height:100vh;display:grid;place-items:center;padding:22px;background:radial-gradient(circle at top right,#b7141d 0,#7a080f 38%,#410407 100%);font-family:Inter,ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Arial;color:#0c1d4a;pointer-events:auto!important;touch-action:manipulation!important;overflow:auto!important;-webkit-overflow-scrolling:touch}
.waiter-auth-gate *{pointer-events:auto!important}.waiter-auth-card{position:relative;z-index:2;width:min(410px,100%);background:#fff;border-radius:28px;padding:28px;box-shadow:0 30px 70px rgba(0,0,0,.34)}
.waiter-auth-brand{display:flex;align-items:center;gap:12px;margin-bottom:24px}.waiter-auth-logo{width:50px;height:50px;border-radius:16px;display:grid;place-items:center;background:#a60f17;color:#fff;font-weight:950;font-size:21px}.waiter-auth-brand strong{display:block;font-size:21px}.waiter-auth-brand span{display:block;color:#77809a;font-size:12px;margin-top:2px}
.waiter-auth-card h1{font-size:29px;margin:0 0 7px}.waiter-auth-card>p{color:#77809a;font-size:14px;line-height:1.5;margin:0 0 22px}
.waiter-auth-field{display:flex;flex-direction:column;gap:7px;margin-top:13px}.waiter-auth-field label{font-size:12px;font-weight:900;color:#4e5872}.waiter-auth-field input{position:relative;z-index:3;width:100%;border:1px solid #dfe3ed;border-radius:14px;padding:14px;outline:none;background:#fff;font-size:16px;touch-action:manipulation!important;-webkit-user-select:text!important;user-select:text!important}.waiter-auth-field input:focus{border-color:#a60f17;box-shadow:0 0 0 3px rgba(166,15,23,.09)}
.waiter-auth-login{position:relative;z-index:3;width:100%;border:0;border-radius:14px;padding:14px;margin-top:20px;background:#a60f17;color:#fff;font-weight:900;font-size:16px;cursor:pointer;touch-action:manipulation!important}.waiter-auth-login:disabled{opacity:.55;cursor:wait}.waiter-auth-message{min-height:20px;margin-top:13px;font-size:12px;line-height:1.45;color:#77809a}.waiter-auth-message.error{color:#b91c1c}.waiter-auth-note{margin-top:17px;padding-top:15px;border-top:1px solid #eef0f5;color:#8a92a6;font-size:11px;line-height:1.5}.waiter-logout{border:0;background:rgba(255,255,255,.16);color:#fff;border-radius:10px;padding:7px 10px;font-size:11px;font-weight:900;cursor:pointer}
.waiter-auth-gate.loading-panel .waiter-auth-field,.waiter-auth-gate.loading-panel .waiter-auth-login,.waiter-auth-gate.loading-panel .waiter-auth-note{display:none!important}.waiter-auth-gate.loading-panel .waiter-auth-card>p{margin-bottom:8px}.waiter-auth-gate.loading-panel .waiter-auth-message{font-size:14px;font-weight:800;color:#4e5872}
`;
document.head.appendChild(style);

const gate=document.createElement('div');
gate.className='waiter-auth-gate';
gate.innerHTML=`<div class="waiter-auth-card"><div class="waiter-auth-brand"><div class="waiter-auth-logo">C</div><div><strong>COMANDA</strong><span>Acesso do garçom</span></div></div><h1>Entrar</h1><p>Use o usuário e a senha cadastrados pelo administrador.</p><form id="waiterAuthForm"><div class="waiter-auth-field"><label>Usuário</label><input id="waiterAuthUser" autocomplete="username" autocapitalize="none" inputmode="text" required placeholder="Seu usuário"></div><div class="waiter-auth-field"><label>Senha</label><input id="waiterAuthPassword" type="password" autocomplete="current-password" required placeholder="Sua senha"></div><button id="waiterLoginBtn" class="waiter-auth-login" type="button">Entrar</button></form><div id="waiterAuthMessage" class="waiter-auth-message">Acesso simples, sem e-mail e sem código de verificação.</div><div class="waiter-auth-note">Cada garçom usa seu próprio acesso. Os pedidos continuam no mesmo sistema e ficam identificados pelo nome de quem lançou.</div></div>`;
document.body.prepend(gate);

document.querySelectorAll('.cp-boot').forEach(e=>e.remove());

const $=id=>document.getElementById(id);
const form=$('waiterAuthForm'),userInput=$('waiterAuthUser'),passInput=$('waiterAuthPassword'),loginBtn=$('waiterLoginBtn');
let loading=false,authBusy=false;
function msg(text,error=false){const e=$('waiterAuthMessage');if(!e)return;e.textContent=text;e.className='waiter-auth-message'+(error?' error':'')}
function busy(on){if(!loginBtn)return;loginBtn.disabled=on;loginBtn.textContent=on?'Entrando...':'Entrar'}
function loadScript(path){return new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=`/${path}?v=${APP_VERSION}`;s.onload=()=>resolve(s);s.onerror=()=>reject(new Error(`Falha ao carregar ${path}`));document.body.appendChild(s)})}
function delay(ms){return new Promise(r=>setTimeout(r,ms))}
function enforceFinalWaiterLayout(){
  document.querySelector('#waiterView .search')?.style.setProperty('display','none','important');
  document.querySelector('#waiterView .action-row')?.style.setProperty('display','none','important');
  document.querySelector('#bottomSearch')?.style.setProperty('display','none','important');
  const nav=document.querySelector('.bottom-nav');if(nav)nav.style.gridTemplateColumns='1fr 1fr';
  const title=document.querySelector('.screen-title');if(title)title.textContent='Mesas';
  const grid=document.querySelector('#tableGrid');if(grid)grid.style.display='grid';
  const legend=document.querySelector('#waiterView .legend');if(legend)legend.style.display='flex';
}
async function waitForFinalUi(){
  const deadline=Date.now()+2200;
  while(Date.now()<deadline){
    enforceFinalWaiterLayout();
    const search=document.querySelector('#waiterView .search');
    const actions=document.querySelector('#waiterView .action-row');
    const bottomSearch=document.querySelector('#bottomSearch');
    const tabs=document.querySelector('#bottomTabs');
    const tables=document.querySelectorAll('#tableGrid .table-card');
    const oldHidden=(!search||getComputedStyle(search).display==='none')&&(!actions||getComputedStyle(actions).display==='none')&&(!bottomSearch||getComputedStyle(bottomSearch).display==='none');
    const newReady=tabs&&/Ajustes/i.test(tabs.textContent||'')&&tables.length>=14;
    if(oldHidden&&newReady){await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));return true}
    await delay(80);
  }
  enforceFinalWaiterLayout();
  await delay(180);
  return true;
}
async function loadWaiter(user){
  if(loading)return;
  loading=true;
  gate.classList.add('loading-panel');
  const h=gate.querySelector('h1');if(h)h.textContent='Carregando';
  const p=gate.querySelector('.waiter-auth-card>p');if(p)p.textContent='Preparando seu painel de atendimento.';
  msg('Carregando mesas, caixa e ajustes...');
  try{
    const label=document.getElementById('waiterNameLabel');if(label)label.textContent=user?.displayName||user?.username||'Garçom';
    const pill=document.querySelector('.user-pill');if(pill){const status=pill.querySelector('span:last-child');if(status){status.innerHTML='';const out=document.createElement('button');out.className='waiter-logout';out.textContent='Sair';out.onclick=async()=>{await A.waiterLogout();location.reload()};status.appendChild(out)}}
    await loadScript('waiter.js');
    await loadScript('waiter-cash-control.js');
    await loadScript('waiter-cash-guard.js');
    await loadScript('waiter-ui-v34-fixes.js');
    await waitForFinalUi();
    document.body.classList.add('waiter-ui-ready');
    waiterView?.classList.remove('hidden');
    await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
    gate.remove();
    window.dispatchEvent(new CustomEvent('cp-waiter-ui-ready'));
  }catch(error){
    console.error(error);
    loading=false;
    document.body.classList.remove('waiter-ui-ready');
    gate.classList.remove('loading-panel');
    if(h)h.textContent='Erro ao carregar';
    if(p)p.textContent='Não foi possível preparar o painel.';
    msg('Verifique a internet e abra o app novamente.',true);
  }
}
async function directLogin(username,password){
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),8000);
  try{
    const res=await fetch(`${SUPABASE_URL}/rest/v1/rpc/waiter_login`,{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json','apikey':SUPABASE_KEY},body:JSON.stringify({p_username:username,p_password:password}),signal:controller.signal,cache:'no-store'});
    const text=await res.text();
    let data=null;try{data=text?JSON.parse(text):null}catch(_){data=null}
    if(!res.ok)throw new Error(data?.message||`Falha HTTP ${res.status}`);
    const r=Array.isArray(data)?data[0]:data;
    if(!r?.success||!r?.session_token)return{ok:false,reason:'invalid'};
    const session={token:r.session_token,username:r.username,displayName:r.display_name,expiresAt:r.expires_at};
    try{localStorage.setItem(SESSION_KEY,JSON.stringify(session))}catch(_){}
    return{ok:true,user:{username:session.username,displayName:session.displayName}};
  }finally{clearTimeout(timer)}
}
async function enter(){
  if(authBusy||loading)return;
  const username=userInput?.value.trim().toLowerCase()||'',password=passInput?.value||'';
  if(!username||!password)return msg('Informe usuário e senha.',true);
  authBusy=true;busy(true);msg('Validando acesso...');
  await delay(60);
  try{
    const login=await directLogin(username,password);
    if(login?.ok){await loadWaiter(login.user);return}
    msg('Usuário ou senha incorretos, ou acesso desativado.',true);
  }catch(error){
    console.error(error);
    msg(error?.name==='AbortError'?'A conexão demorou demais. Tente novamente.':'Não foi possível conectar ao servidor. Tente novamente.',true);
  }finally{
    if(!loading){authBusy=false;busy(false)}
  }
}
window.__cpWaiterEnter=enter;
form?.addEventListener('submit',e=>{e.preventDefault();enter()});
const trigger=e=>{e?.preventDefault?.();e?.stopPropagation?.();enter()};
loginBtn?.addEventListener('click',trigger);
loginBtn?.addEventListener('pointerup',trigger);
loginBtn?.addEventListener('touchend',trigger,{passive:false});
[userInput,passInput].forEach(input=>{if(!input)return;const focus=()=>{if(document.activeElement!==input)setTimeout(()=>input.focus(),0)};input.addEventListener('pointerup',focus);input.addEventListener('touchend',focus,{passive:true})});
(async()=>{try{const s=await Promise.race([A.waiterSession(),new Promise((_,reject)=>setTimeout(()=>reject(new Error('timeout')),5000))]);if(s?.ok)await loadWaiter(s.user)}catch(error){console.warn('Sessão anterior não pôde ser validada',error)}})();
})();
