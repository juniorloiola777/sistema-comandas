(()=>{
const A=window.APP;
if(!A)return;
const SUPABASE_URL='https://dsipffnmerbowaddbcxe.supabase.co';
const SUPABASE_KEY='sb_publishable_vI64CItP0mGD4HD2DFJ2zw_zyZaveCz';
const ADMIN_SESSION_KEY='comandaPrimeAdminSessionV1';

window.deleteProduct=async function(id){
  id=Number(id);
  const p=A.product(id);
  if(!p)return A.toast('Produto não encontrado.');
  if(!confirm(`Excluir o produto “${p.name}”?\n\nEssa ação remove o produto do sistema.`))return;
  const token=localStorage.getItem(ADMIN_SESSION_KEY)||'';
  if(!token)return A.toast('Sua sessão expirou. Entre novamente.');
  try{
    const res=await fetch(`${SUPABASE_URL}/rest/v1/rpc/admin_delete_product`,{
      method:'POST',
      headers:{'Content-Type':'application/json','Accept':'application/json','apikey':SUPABASE_KEY},
      body:JSON.stringify({p_admin_session_token:token,p_product_id:id}),
      cache:'no-store'
    });
    const data=await res.json().catch(()=>null);
    const r=Array.isArray(data)?data[0]:data;
    if(!res.ok)throw new Error(r?.message||`Erro ${res.status}`);
    if(!r?.success){A.toast(r?.error||'Não foi possível excluir o produto.');return;}
    A.toast('Produto excluído com sucesso.');
    setTimeout(()=>location.reload(),450);
  }catch(e){
    console.error('Falha ao excluir produto',e);
    A.toast('Erro ao excluir produto. Tente novamente.');
  }
};
})();
