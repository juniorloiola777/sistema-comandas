(()=>{
  const A=window.APP;
  const note=document.querySelector('.security-note');
  if(note){
    const title=note.querySelector('strong');
    const text=note.querySelector('span');
    if(title)title.textContent='Áreas separadas por acesso.';
    if(text)text.textContent='Administrador usa o painel do computador. Cada garçom entra no celular com seu próprio usuário e senha, sem e-mail e sem segunda etapa.';
  }

  const photoHelp=[...document.querySelectorAll('.field')].find(x=>x.querySelector('label')?.textContent?.includes('Foto do produto'))?.querySelector('.help');
  if(photoHelp)photoHelp.textContent='Escolha uma foto do produto. Ela aparece automaticamente no cardápio dos garçons.';

  function employeeById(id){return A.state().employees.find(e=>e.id===Number(id))}
  function isWaiter(e){return String(e?.role||'').toLowerCase().includes('garç')}
  function refreshEmployees(){
    const table=document.getElementById('employeeTable');if(!table)return;
    const employees=A.state().employees;
    [...table.querySelectorAll('tr')].forEach((row,i)=>{
      const e=employees[i];if(!e||row.dataset.accessReady==='1')return;
      row.dataset.accessReady='1';
      const cells=row.querySelectorAll('td');if(cells.length<4)return;
      if(isWaiter(e)){
        const hint=document.createElement('div');hint.className='help waiter-login-label';hint.textContent=e.username?`Login: @${e.username}`:'Sem login configurado';cells[0].appendChild(hint);
        cells[3].innerHTML=`<div class="row-actions"><button class="edit" data-access-id="${e.id}">${e.username?'Alterar acesso':'Criar acesso'}</button><button class="toggle" data-toggle-employee="${e.id}">${e.active!==false?'Desativar':'Ativar'}</button></div>`;
      }
    });
  }

  const employeeTable=document.getElementById('employeeTable');
  if(employeeTable)new MutationObserver(()=>setTimeout(refreshEmployees,0)).observe(employeeTable,{childList:true,subtree:true});
  setTimeout(refreshEmployees,0);

  async function saveAccess(e,username,password,active=e.active!==false){
    const u=String(username||'').trim().toLowerCase();
    if(!/^[a-z0-9._-]{3,30}$/.test(u)){A.toast('Use um login com 3 a 30 caracteres, sem espaços.');return false}
    const out=await A.adminUpsertWaiter(e.name,u,password,active);
    if(!out.ok){console.error(out.error);A.toast(out.error?.message||'Não foi possível salvar o acesso.');return false}
    const ok=await A.commit(s=>{const x=s.employees.find(v=>v.id===e.id);if(x){x.username=u;x.active=active}},'Acesso do garçom atualizado');
    return ok;
  }

  window.manageWaiterAccess=async id=>{
    const e=employeeById(id);if(!e)return;
    const username=prompt('Usuário de acesso do garçom:',e.username||e.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'.').replace(/^\.|\.$/g,''));
    if(!username?.trim())return;
    const password=prompt(e.username?'Nova senha (deixe em branco para manter a atual):':'Senha do garçom:','');
    if(!e.username&&!password)return A.toast('Informe uma senha para o novo acesso.');
    await saveAccess(e,username,password||'',e.active!==false);
  };

  window.toggleEmployee=async id=>{
    const e=employeeById(id);if(!e)return;
    const next=e.active===false;
    if(isWaiter(e)&&e.username){
      const out=await A.adminUpsertWaiter(e.name,e.username,'',next);
      if(!out.ok){console.error(out.error);return A.toast('Não foi possível alterar o acesso do garçom.')}
    }
    await A.commit(s=>{const x=s.employees.find(v=>v.id===e.id);if(x)x.active=next},next?'Funcionário ativado':'Funcionário desativado');
  };

  const addEmployeeBtn=document.getElementById('addEmployeeBtn');
  if(addEmployeeBtn)addEmployeeBtn.onclick=async()=>{
    const name=prompt('Nome do funcionário:');if(!name?.trim())return;
    const role=prompt('Função:','Garçom');if(!role?.trim())return;
    let username='';
    if(String(role).toLowerCase().includes('garç')){
      username=prompt('Usuário para o garçom entrar no celular:',name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'.').replace(/^\.|\.$/g,''))||'';
      if(!username.trim())return A.toast('Informe o usuário do garçom.');
      const password=prompt('Senha do garçom:','');if(!password)return A.toast('Informe a senha do garçom.');
      const temp={name:name.trim(),role:role.trim(),active:true};
      const out=await A.adminUpsertWaiter(temp.name,username.trim().toLowerCase(),password,true);
      if(!out.ok){console.error(out.error);return A.toast(out.error?.message||'Não foi possível criar o login.')}
    }
    await A.commit(s=>{const id=Math.max(0,...s.employees.map(e=>e.id))+1;s.employees.push({id,name:name.trim(),role:role.trim(),active:true,username:username.trim().toLowerCase()})},'Funcionário e acesso cadastrados');
  };

  const originalViewOrder=window.viewOrder;
  if(originalViewOrder)window.viewOrder=(type,id)=>{
    originalViewOrder(type,id);
    const s=A.state(),t=type==='mesa'?s.tables.find(x=>x.id===id):s.tabs.find(x=>x.id===id);
    const rows=document.querySelectorAll('#orderDetailBody .detail-lines > div');
    (t?.items||[]).forEach((item,i)=>{if(!item.waiter||!rows[i])return;const small=document.createElement('small');small.className='muted';small.textContent=` • ${item.waiter}`;rows[i].querySelector('span')?.appendChild(small)});
  };

  document.addEventListener('click',event=>{
    const target=event.target.closest('button');if(!target)return;
    if(target.dataset.accessId){event.preventDefault();event.stopImmediatePropagation();window.manageWaiterAccess(Number(target.dataset.accessId));return}
    if(target.dataset.toggleEmployee){event.preventDefault();event.stopImmediatePropagation();window.toggleEmployee(Number(target.dataset.toggleEmployee));return}
    const card=event.target.closest('.category-admin-card');
    if(!card)return;
    const category=card.querySelector('strong')?.textContent?.trim();if(!category)return;
    if(target.classList.contains('edit')){event.preventDefault();event.stopImmediatePropagation();window.renameCategory?.(category)}
    if(target.classList.contains('minus')){event.preventDefault();event.stopImmediatePropagation();window.deleteCategory?.(category)}
  },true);
})();
