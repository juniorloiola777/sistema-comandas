(()=>{
const A=window.APP;
const waiterView=document.getElementById('waiterView');
waiterView?.classList.add('hidden');

const style=document.createElement('style');
style.textContent=`
.waiter-auth-gate{min-height:100vh;display:grid;place-items:center;padding:22px;background:radial-gradient(circle at top right,#b7141d 0,#7a080f 38%,#410407 100%);font-family:Inter,ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Arial;color:#0c1d4a}
.waiter-auth-card{width:min(410px,100%);background:#fff;border-radius:28px;padding:28px;box-shadow:0 30px 70px rgba(0,0,0,.34)}
.waiter-auth-brand{display:flex;align-items:center;gap:12px;margin-bottom:24px}.waiter-auth-logo{width:50px;height:50px;border-radius:16px;display:grid;place-items:center;background:#a60f17;color:#fff;font-weight:950;font-size:21px}.waiter-auth-brand strong{display:block;font-size:21px}.waiter-auth-brand span{display:block;color:#77809a;font-size:12px;margin-top:2px}
.waiter-auth-card h1{font-size:29px;margin:0 0 7px}.waiter-auth-card>p{color:#77809a;font-size:14px;line-height:1.5;margin:0 0 22px}
.waiter-auth-field{display:flex;flex-direction:column;gap:7px;margin-top:13px}.waiter-auth-field label{font-size:12px;font-weight:900;color:#4e5872}.waiter-auth-field input{width:100%;border:1px solid #dfe3ed;border-radius:14px;padding:14px;outline:none;background:#fff;font-size:16px}.waiter-auth-field input:focus{border-color:#a60f17;box-shadow:0 0 0 3px rgba(166,15,23,.09)}
.waiter-auth-login{width:100%;border:0;border-radius:14px;padding:14px;margin-top:20px;background:#a60f17;color:#fff;font-weight:900;font-size:16px;cursor:pointer}.waiter-auth-login:disabled{opacity:.55;cursor:wait}.waiter-auth-message{min-height:20px;margin-top:13px;font-size:12px;line-height:1.45;color:#77809a}.waiter-auth-message.error{color:#b91c1c}.waiter-auth-note{margin-top:17px;padding-top:15px;border-top:1px solid #eef0f5;color:#8a92a6;font-size:11px;line-height:1.5}.waiter-logout{border:0;background:rgba(255,255,255,.16);color:#fff;border-radius:10px;padding:7px 10px;font-size:11px;font-weight:900;cursor:pointer}
`;
document.head.appendChild(style);

const gate=document.createElement('div');
gate.className='waiter-auth-gate';
gate.innerHTML=`<div class="waiter-auth-card"><div class="waiter-auth-brand"><div class="waiter-auth-logo">CP</div><div><strong>Comanda Prime</strong><span>Acesso do garçom</span></div></div><h1>Entrar</h1><p>Use o usuário e a senha cadastrados pelo administrador.</p><form id="waiterAuthForm"><div class="waiter-auth-field"><label>Usuário</label><input id="waiterAuthUser" autocomplete="username" autocapitalize="none" required placeholder="Seu usuário"></div><div class="waiter-auth-field"><label>Senha</label><input id="waiterAuthPassword" type="password" autocomplete="current-password" required placeholder="Sua senha"></div><button id="waiterLoginBtn" class="waiter-auth-login" type="submit">Entrar</button></form><div id="waiterAuthMessage" class="waiter-auth-message">Acesso simples, sem e-mail e sem código de verificação.</div><div class="waiter-auth-note">Cada garçom usa seu próprio acesso. Os pedidos continuam no mesmo sistema e ficam identificados pelo nome de quem lançou.</div></div>`;
document.body.prepend(gate);

const $=id=>document.getElementById(id);let loading=false;
function msg(text,error=false){const e=$('waiterAuthMessage');e.textContent=text;e.className='waiter-auth-message'+(error?' error':'')}
function busy(on){$('waiterLoginBtn').disabled=on;$('waiterLoginBtn').textContent=on?'Entrando...':'Entrar'}
function loadWaiter(user){if(loading)return;loading=true;gate.remove();waiterView?.classList.remove('hidden');const label=document.getElementById('waiterNameLabel');if(label)label.textContent=user?.displayName||user?.username||'Garçom';const pill=document.querySelector('.user-pill');if(pill){const status=pill.querySelector('span:last-child');if(status){status.innerHTML='';const out=document.createElement('button');out.className='waiter-logout';out.textContent='Sair';out.onclick=async()=>{await A.waiterLogout();location.reload()};status.appendChild(out)}}const script=document.createElement('script');script.src='/waiter.js?v=10';document.body.appendChild(script)}
async function enter(){const username=$('waiterAuthUser').value.trim(),password=$('waiterAuthPassword').value;if(!username||!password)return msg('Informe usuário e senha.',true);busy(true);msg('Validando acesso...');const login=await A.waiterLogin(username,password);if(login.ok)return loadWaiter(login.user);busy(false);msg('Usuário ou senha incorretos, ou acesso desativado.',true)}
$('waiterAuthForm').addEventListener('submit',e=>{e.preventDefault();enter()});
(async()=>{const s=await A.waiterSession();if(s.ok)loadWaiter(s.user)})();
})();
