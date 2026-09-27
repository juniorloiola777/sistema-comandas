(()=>{
  const A=window.APP;
  if(!A)return;
  const ENDPOINT='https://dsipffnmerbowaddbcxe.supabase.co/functions/v1/admin-waiter-access';
  const APIKEY='sb_publishable_vI64CItP0mGD4HD2DFJ2zw_zyZaveCz';
  const SESSION_KEY='comandaPrimeAdminSessionV1';

  function token(){try{return localStorage.getItem(SESSION_KEY)||''}catch(_){return''}}
  async function call(action,payload={}){
    const t=token();
    if(!t)return{ok:false,error:new Error('Sessão do administrador expirada. Entre novamente.')};
    try{
      const res=await fetch(ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json','apikey':APIKEY},body:JSON.stringify({action,token:t,...payload})});
      let data={};try{data=await res.json()}catch(_){}
      if(res.status===401){try{localStorage.removeItem(SESSION_KEY)}catch(_){};return{ok:false,error:new Error('Sessão do administrador expirada. Entre novamente.')};}
      if(!res.ok||!data?.ok)return{ok:false,error:new Error(data?.error||'Não foi possível salvar o acesso do garçom.')};
      return{ok:true,data:data.data||null};
    }catch(error){return{ok:false,error}}
  }

  A.adminUpsertWaiter=async(displayName,username,password='',active=true)=>call('upsert',{displayName:String(displayName||''),username:String(username||''),password:String(password||''),active:!!active});
  A.adminListWaiters=async()=>{
    const out=await call('list');
    return out.ok?{ok:true,data:out.data||[]}:{ok:false,error:out.error,data:[]};
  };
})();
