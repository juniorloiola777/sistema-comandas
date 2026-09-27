(()=>{
const A=window.APP;
const waiterView=document.getElementById('waiterView');
waiterView?.classList.add('hidden');

// Garante que nenhuma camada antiga bloqueie toque/clique no login móvel.
document.querySelectorAll('.cp-boot').forEach(e=>e.remove());
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
`;
document.head.appendChild(style);

const gate=document.createElement('div');
gate.className='waiter-auth-gate';
gate.innerHTML=`<div class="waiter-auth-card"><div class="waiter-auth-brand"><div class="waiter-auth-logo">CP</div><div><strong>Comanda Prime</strong><span>Acesso do garçom</span></div></div><h1>Entrar</h1><p>Use o usuário e a senha cadastrados pelo administrador.</p><form id="waiterAuthForm"><div class="waiter-auth-field"><label>Usuário</label><input id="waiterAuthUser" autocomplete="username" autocapitalize="none" inputmode="text" required placeholder="Seu usuário"></div><div class="waiter-auth-field"><label>Senha</label><input id="waiterAuthPassword" type="password" autocomplete="current-password" required placeholder="Sua senha"></div><button id="waiterLoginBtn" class="waiter-auth-login" type="button">Entrar</button></form><div id="waiterAuthMessage" class="waiter-auth-message">Acesso simples, sem e-mail e sem código de verificação.</div><div class="waiter-auth-note">Cada garçom usa seu próprio acesso. Os pedidos continuam no mesmo sistema e ficam identificados pelo nome de quem lançou.</div></div>`;
document.body.prepend(gate);

const $=id=>document.getElementById(id);
const form=$('waiterAuthForm'),userInput=$('waiterAuthUser'),passInput=$('waiterAuthPassword'),loginBtn=$('waiterLoginBtn');
let loading=false,authBusy=false;
function msg(text,error=false){const e=$('waiterAuthMessage');if(!e)return;e.textContent=text;e.className='waiter-auth-message'+(error?' error':'')}
function busy(on){if(!loginBtn)return;loginBtn.disabled=on;loginBtn.textContent=on?'Entrando...':'Entrar'}
function loadWaiter(user){if(loading)return;loading=true;gate.remove();waiterView?.classList.remove('hidden');const label=document.getElementById('waiterNameLabel');if(label)label.textContent=user?.displayName||user?.username||'Garçom';const pill=document.querySelector('.user-pill');if(pill){const status=pill.querySelector('span:last-child');if(status){status.innerHTML='';const out=document.createElement('button');out.className='waiter-logout';out.textContent='Sair';out.onclick=async()=>{await A.waiterLogout();location.reload()};status.appendChild(out)}}const script=document.createElement('script');script.src='/waiter.js?v=21';document.body.appendChild(script)}
function timeout(ms){return new Promise((_,reject)=>setTimeout(()=>reject(new Error('timeout')),ms))}
async function enter(){
  if(authBusy||loading)return;
  const username=userInput?.value.trim()||'',password=passInput?.value||'';
  if(!username||!password)return msg('Informe usuário e senha.',true);
  authBusy=true;busy(true);msg('Validando acesso...');
  try{
    const login=await Promise.race([A.waiterLogin(username,password),timeout(15000)]);
    if(login?.ok){loadWaiter(login.user);return}
    if(login?.error)console.error(login.error);
    msg('Usuário ou senha incorretos, ou acesso desativado.',true);
  }catch(error){
    console.error(error);
    msg('Não foi possível conectar. Verifique a internet e tente novamente.',true);
  }finally{
    if(!loading){authBusy=false;busy(false)}
  }
}

form?.addEventListener('submit',e=>{e.preventDefault();enter()});
loginBtn?.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();enter()});
[userInput,passInput].forEach(input=>{
  if(!input)return;
  input.addEventListener('touchend',()=>{if(document.activeElement!==input)setTimeout(()=>input.focus(),0)},{passive:true});
  input.addEventListener('pointerup',()=>{if(document.activeElement!==input)setTimeout(()=>input.focus(),0)});
});

(async()=>{try{const s=await Promise.race([A.waiterSession(),timeout(8000)]);if(s?.ok)loadWaiter(s.user)}catch(error){console.warn('Sessão anterior não pôde ser validada',error)}})();
})();
