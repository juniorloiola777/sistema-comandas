(()=>{
  const A=window.APP;
  if(!A||document.body.dataset.page!=='admin')return;

  function employeeById(id){return A.state().employees.find(e=>e.id===Number(id))}
  function isWaiter(e){return String(e?.role||'').toLowerCase().includes('garç')}
  function isAdminEmployee(e){return String(e?.role||'').toLowerCase().includes('administrador')}

  function addDeleteButtons(){
    const table=document.getElementById('employeeTable');
    if(!table)return false;
    const employees=A.state().employees||[];
    [...table.querySelectorAll('tr')].forEach((row,i)=>{
      const e=employees[i];if(!e)return;
      const cells=row.querySelectorAll('td');if(cells.length<4)return;
      const actions=cells[3].querySelector('.row-actions')||cells[3];
      if(isAdminEmployee(e)){
        actions.querySelectorAll('[data-delete-user]').forEach(b=>b.remove());
        return;
      }
      if(actions.querySelector(`[data-delete-user="${e.id}"]`))return;
      const btn=document.createElement('button');
      btn.type='button';btn.className='minus';btn.dataset.deleteUser=String(e.id);btn.textContent='Excluir usuário';
      actions.appendChild(btn);
    });
    return true;
  }

  window.deleteEmployeeUser=async id=>{
    const e=employeeById(id);if(!e)return;
    if(isAdminEmployee(e))return A.toast('O usuário administrador principal não pode ser excluído aqui.');
    const login=e.username?` (@${e.username})`:'';
    if(!confirm(`Excluir ${e.name}${login}?\n\nO acesso será bloqueado imediatamente. O histórico dos pedidos já lançados será mantido.`))return;

    if(isWaiter(e)&&e.username){
      const out=await A.adminUpsertWaiter(e.name,e.username,'',false);
      if(!out.ok){console.error(out.error);return A.toast(out.error?.message||'Não foi possível bloquear o acesso deste usuário.')}
    }

    const ok=await A.commit(s=>{s.employees=(s.employees||[]).filter(x=>Number(x.id)!==Number(id))},'Usuário excluído • acesso bloqueado');
    if(ok)setTimeout(addDeleteButtons,50);
  };

  document.addEventListener('click',e=>{
    const b=e.target.closest?.('[data-delete-user]');if(!b)return;
    e.preventDefault();e.stopImmediatePropagation();window.deleteEmployeeUser(Number(b.dataset.deleteUser));
  },true);

  const observer=new MutationObserver(()=>setTimeout(addDeleteButtons,0));
  observer.observe(document.body,{childList:true,subtree:true});
  let tries=0;const timer=setInterval(()=>{if(addDeleteButtons()||++tries>40)clearInterval(timer)},250);
})();
