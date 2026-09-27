(()=>{
const A=window.APP;
const adminView=document.getElementById('adminView');
adminView?.classList.add('hidden');

const style=document.createElement('style');
style.textContent=`
.admin-auth-gate{min-height:100vh;display:grid;place-items:center;padding:24px;background:radial-gradient(circle at top right,#172750 0,#0b1739 38%,#071027 100%);font-family:Inter,ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Arial;color:#0c1d4a}
.admin-auth-card{width:min(430px,100%);background:#fff;border-radius:26px;padding:30px;box-shadow:0 28px 70px rgba(0,0,0,.32)}
.admin-auth-brand{display:flex;align-items:center;gap:12px;margin-bottom:24px}.admin-auth-logo{width:48px;height:48px;border-radius:15px;display:grid;place-items:center;background:#a60f17;color:#fff;font-weight:950;font-size:21px}.admin-auth-brand strong{display:block;font-size:20px}.admin-auth-brand span{display:block;color:#77809a;font-size:12px;margin-top:2px}
.admin-auth-card h1{font-size:27px;margin:0 0 7px}.admin-auth-card>p{color:#77809a;font-size:13px;line-height:1.55;margin:0 0 21px}.admin-auth-field{display:flex;flex-direction:column;gap:7px;margin-top:12px}.admin-auth-field label{font-size:12px;font-weight:900;color:#4e5872}.admin-auth-field input{width:100%;border:1px solid #dfe3ed;border-radius:13px;padding:13px 14px;outline:none;background:#fff}.admin-auth-field input:focus{border-color:#a60f17;box-shadow:0 0 0 3px rgba(166,15,23,.09)}
.admin-auth-actions{display:grid;gap:9px;margin-top:19px}.admin-auth-actions button{border:0;border-radius:13px;padding:13px;font-weight:900;cursor:pointer}.admin-auth-login{background:#a60f17;color:#fff}.admin-auth-create{background:#eef1f6;color:#0c1d4a}.admin-auth-actions button:disabled{opacity:.55;cursor:wait}.admin-auth-message{min-height:20px;margin-top:13px;font-size:12px;line-height:1.45;color:#77809a}.admin-auth-message.error{color:#b91c1c}.admin-auth-message.ok{color:#15803d}.admin-auth-note{margin-top:18px;padding-top:16px;border-top:1px solid #eef0f5;color:#8a92a6;font-size:11px;line-height:1.5}
.admin-logout{margin-top:7px;border:0;background:#eef1f6;color:#0c1d4a;border-radius:9px;padding:7px 10px;font-size:11px;font-weight:900;cursor:pointer}
`;
document.head.appendChild(style);

const gate=document.createElement('div');
gate.className='admin-auth-gate';
gate.innerHTML=`<div class="admin-auth-card">
  <div class="admin-auth-brand"><div class="admin-auth-logo">CP</div><div><strong>Comanda Prime</strong><span>Área administrativa protegida</span></div></div>
  <h1>Acesso do administrador</h1>
  <p>Entre com seu e-mail e senha. O painel dos garçons continua separado e não recebe acesso a esta área.</p>
  <form id="adminAuthForm">
    <div class="admin-auth-field"><label>E-mail</label><input id="adminAuthEmail" type="email" autocomplete="username" required placeholder="seu@email.com"></div>
    <div class="admin-auth-field"><label>Senha</label><input id="adminAuthPassword" type="password" autocomplete="current-password" required minlength="6" placeholder="Sua senha"></div>
    <div class="admin-auth-actions"><button class="admin-auth-login" id="adminLoginBtn" type="submit">Entrar</button><button class="admin-auth-create" id="adminCreateBtn" type="button">Criar primeiro administrador</button></div>
  </form>
  <div id="adminAuthMessage" class="admin-auth-message">Se ainda não existe administrador, use “Criar primeiro administrador”.</div>
  <div class="admin-auth-note">O primeiro cadastro confirmado assume a administração. Depois disso, novos usuários não recebem acesso administrativo automaticamente.</div>
</div>`;
document.body.prepend(gate);

const $=id=>document.getElementById(id);
let loadingAdmin=false;
function message(text,type=''){const e=$('adminAuthMessage');e.textContent=text;e.className='admin-auth-message '+type}
function busy(on){$('adminLoginBtn').disabled=on;$('adminCreateBtn').disabled=on;$('adminLoginBtn').textContent=on?'Verificando...':'Entrar'}
function friendly(error){const m=String(error?.message||'').toLowerCase();if(m.includes('invalid login'))return'E-mail ou senha incorretos.';if(m.includes('email not confirmed'))return'Confirme seu e-mail antes de entrar.';if(m.includes('already registered'))return'Este e-mail já está cadastrado. Use Entrar.';if(m.includes('password'))return'A senha precisa ter pelo menos 6 caracteres.';return error?.message||'Não foi possível autenticar.'}

function loadAdmin(user){
  if(loadingAdmin)return;loadingAdmin=true;
  gate.remove();
  adminView?.classList.remove('hidden');
  document.body.classList.add('admin-ready');
  const userBox=document.querySelector('.admin-user');
  if(userBox){
    const label=userBox.querySelector('span');
    if(label)label.textContent=user?.email||'Administrador autenticado';
    const out=document.createElement('button');out.className='admin-logout';out.textContent='Sair';out.onclick=async()=>{await A.signOut();location.reload()};userBox.appendChild(out);
  }
  const script=document.createElement('script');
  script.src='/admin.js?v=7';
  script.onload=()=>{const patch=document.createElement('script');patch.src='/admin-patch.js?v=7';document.body.appendChild(patch)};
  document.body.appendChild(script);
}

async function authorizeExisting(){
  const access=await A.ensureAdmin();
  if(access.ok)return loadAdmin(access.user);
  if(access.reason==='not_admin'){
    await A.signOut();
    message('Esta conta não possui permissão de administrador.','error');
  }
}

async function enter(){
  const email=$('adminAuthEmail').value.trim(),password=$('adminAuthPassword').value;
  if(!email||!password)return message('Informe e-mail e senha.','error');
  busy(true);message('Validando acesso...');
  const login=await A.signIn(email,password);
  if(!login.ok){busy(false);return message(friendly(login.error),'error')}
  const access=await A.ensureAdmin();
  if(access.ok)return loadAdmin(access.user);
  await A.signOut();busy(false);
  message(access.reason==='not_admin'?'Conta válida, mas sem permissão administrativa.':'Não foi possível validar a permissão.','error');
}

async function createFirst(){
  const email=$('adminAuthEmail').value.trim(),password=$('adminAuthPassword').value;
  if(!email||!password)return message('Informe e-mail e uma senha com pelo menos 6 caracteres.','error');
  if(password.length<6)return message('A senha precisa ter pelo menos 6 caracteres.','error');
  busy(true);message('Criando conta segura...');
  const signup=await A.signUp(email,password);
  if(!signup.ok){busy(false);return message(friendly(signup.error),'error')}
  if(!signup.session){busy(false);return message('Conta criada. Confirme o e-mail recebido e depois volte aqui para entrar.','ok')}
  const access=await A.ensureAdmin();
  if(access.ok)return loadAdmin(access.user);
  await A.signOut();busy(false);message('Já existe um administrador. Esta conta não recebeu acesso.','error');
}

$('adminAuthForm').addEventListener('submit',e=>{e.preventDefault();enter()});
$('adminCreateBtn').onclick=createFirst;
authorizeExisting();
})();
