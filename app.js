const brl = v => Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const defaultIcons={"Cervejas":"🍺","Bebidas":"🥤","Espetinhos":"🍢","Porções":"🍟","Drinks":"🍹"};
const STORAGE_KEY='comandaPrimeStateV3';
const SUPABASE_URL='https://dsipffnmerbowaddbcxe.supabase.co';
const SUPABASE_KEY='sb_publishable_vI64CItP0mGD4HD2DFJ2zw_zyZaveCz';
const cloudMode=(location.protocol==='http:' || location.protocol==='https:') && !!window.supabase;
const db=cloudMode?window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY):null;
let stateVersion=1;
let realtimeChannel=null;
const channel=('BroadcastChannel' in window && !cloudMode)?new BroadcastChannel('comanda-prime-live-v3'):null;
const seedState={
 products:[
  {id:1,name:'Heineken 330ml',cat:'Cervejas',price:12,stock:84,min:20,active:true,emoji:'🍺',photo:''},{id:2,name:'Brahma Duplo Malte',cat:'Cervejas',price:9,stock:52,min:20,active:true,emoji:'🍺',photo:''},{id:3,name:'Budweiser',cat:'Cervejas',price:10,stock:37,min:18,active:true,emoji:'🍺',photo:''},
  {id:4,name:'Coca-Cola lata',cat:'Bebidas',price:7,stock:31,min:12,active:true,emoji:'🥤',photo:''},{id:5,name:'Água 500ml',cat:'Bebidas',price:5,stock:11,min:12,active:true,emoji:'💧',photo:''},{id:6,name:'Energético',cat:'Bebidas',price:14,stock:9,min:10,active:true,emoji:'⚡',photo:''},
  {id:7,name:'Espetinho bovino',cat:'Espetinhos',price:12,stock:63,min:20,active:true,emoji:'🍢',photo:''},{id:8,name:'Espetinho frango',cat:'Espetinhos',price:11,stock:38,min:15,active:true,emoji:'🍢',photo:''},{id:9,name:'Linguiça',cat:'Espetinhos',price:10,stock:24,min:12,active:true,emoji:'🍢',photo:''},
  {id:10,name:'Batata frita',cat:'Porções',price:28,stock:18,min:8,active:true,emoji:'🍟',photo:''},{id:11,name:'Mandioca frita',cat:'Porções',price:24,stock:14,min:8,active:true,emoji:'🍟',photo:''},{id:12,name:'Calabresa acebolada',cat:'Porções',price:32,stock:10,min:6,active:true,emoji:'🍽️',photo:''},
  {id:13,name:'Caipirinha',cat:'Drinks',price:18,stock:22,min:8,active:true,emoji:'🍹',photo:''},{id:14,name:'Gin tônica',cat:'Drinks',price:24,stock:16,min:6,active:true,emoji:'🍸',photo:''},{id:15,name:'Cuba Libre',cat:'Drinks',price:22,stock:12,min:6,active:true,emoji:'🥃',photo:''}
 ],
 tables:Array.from({length:14},(_,i)=>({id:i+1,type:'mesa',client:'',status:'free',opened:0,total:0,items:[]})),
 tabs:[{id:101,type:'comanda',client:'Diego',status:'busy',opened:24,total:42,items:[{pid:7,qty:2},{pid:1,qty:1}]}], updatedAt:Date.now()
};
Object.assign(seedState.tables[0],{client:'Carlos',status:'busy',opened:43,total:68,items:[{pid:1,qty:2},{pid:7,qty:2}]});
Object.assign(seedState.tables[2],{client:'Ana',status:'wait',opened:75,total:126,items:[{pid:13,qty:2},{pid:10,qty:1}]});
Object.assign(seedState.tables[4],{client:'Juliana',status:'wait',opened:28,total:87,items:[{pid:4,qty:1},{pid:8,qty:4}]});
Object.assign(seedState.tables[5],{client:'Marcos',status:'busy',opened:62,total:54,items:[{pid:2,qty:6}]});
Object.assign(seedState.tables[7],{client:'Fernanda',status:'busy',opened:10,total:112,items:[{pid:1,qty:4},{pid:13,qty:2}]});
Object.assign(seedState.tables[10],{client:'Ricardo',status:'wait',opened:37,total:73,items:[{pid:7,qty:3},{pid:5,qty:2}]});
let state=structuredClone(seedState);
let currentRef=null,cart={},activeCat='Cervejas',individualMode=false,editingProductId=null,pendingPhoto='';

function safeClone(v){return JSON.parse(JSON.stringify(v))}
function toast(msg){const el=document.getElementById('toast');el.textContent=msg;el.classList.remove('hidden');clearTimeout(window.__toastTimer);window.__toastTimer=setTimeout(()=>el.classList.add('hidden'),2000)}
function saveLocal(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state))}catch(e){console.warn('Não foi possível salvar localmente',e)}}
function loadLocal(){try{const raw=localStorage.getItem(STORAGE_KEY);if(raw){const data=JSON.parse(raw);if(data?.products&&data?.tables)return data}}catch(e){}return safeClone(seedState)}
function announceLocal(){if(channel)channel.postMessage(state)}
function renderAll(){renderTables(document.getElementById('searchTable')?.value||'');renderAdmin();if(!document.getElementById('overlay').classList.contains('hidden'))renderProducts();updateLiveLabels()}
function applyRemote(next,version=null){if(!next?.products||!next?.tables)return;state=next;if(version!==null)stateVersion=Number(version)||stateVersion;saveLocal();renderAll()}
async function saveCloud(mutator){
 for(let attempt=0;attempt<4;attempt++){
  const candidate=safeClone(state);
  mutator(candidate);candidate.updatedAt=Date.now();
  const {data,error}=await db.rpc('update_app_state',{p_expected_version:stateVersion,p_data:candidate});
  if(error)throw error;
  const row=Array.isArray(data)?data[0]:data;
  if(row?.success){stateVersion=Number(row.new_version);state=candidate;saveLocal();renderAll();return true}
  if(row?.current_data){state=row.current_data;stateVersion=Number(row.new_version)||stateVersion;saveLocal();renderAll();continue}
 }
 throw new Error('Conflito de atualização. Tente novamente.');
}
async function commit(mutator,msg){
 try{
  if(cloudMode) await saveCloud(mutator);
  else{mutator(state);state.updatedAt=Date.now();saveLocal();renderAll();announceLocal()}
  if(msg)toast(msg);
 }catch(e){console.error(e);toast('Não foi possível salvar. Verifique a conexão e tente novamente.')}
}
function updateLiveLabels(){const text=cloudMode?'Supabase • tempo real online':'Modo local neste dispositivo';document.getElementById('adminLiveText').textContent=text;document.getElementById('waiterLiveText').textContent=cloudMode?'Sincronizado em tempo real':'Atualização local'}
async function initSync(){
 if(cloudMode){
  try{
   const {data,error}=await db.from('app_state').select('data,version').eq('id',1).single();
   if(error)throw error;
   if(data?.data)applyRemote(data.data,data.version);
   realtimeChannel=db.channel('comanda-prime-state')
    .on('postgres_changes',{event:'UPDATE',schema:'public',table:'app_state',filter:'id=eq.1'},payload=>{
      const next=payload.new;if(next?.data)applyRemote(next.data,next.version);
    })
    .subscribe(status=>{if(status==='CHANNEL_ERROR'||status==='TIMED_OUT')console.warn('Realtime:',status)});
  }catch(e){console.error('Falha ao carregar Supabase',e);state=loadLocal();toast('Sem conexão com o servidor. Exibindo dados locais.')}
 }else{
  state=loadLocal();
  if(channel)channel.onmessage=e=>applyRemote(e.data);
  window.addEventListener('storage',e=>{if(e.key===STORAGE_KEY&&e.newValue){try{applyRemote(JSON.parse(e.newValue))}catch(_){}}});
 }
 renderAll();
 if('serviceWorker' in navigator && location.protocol==='https:') navigator.serviceWorker.register('/sw.js').catch(()=>{});
}
function iconFor(p){return p.emoji||defaultIcons[p.cat]||'📦'}
function mediaFor(p,cls=''){return p.photo?`<img class="${cls}" src="${p.photo}" alt="${p.name}">`:iconFor(p)}
function renderTables(filter=''){
 const grid=document.getElementById('tableGrid');if(!grid)return;grid.innerHTML='';const q=(filter||'').toLowerCase().trim();
 const list=[...state.tables,...state.tabs].filter(t=>!q||String(t.id).includes(q)||(t.client||'').toLowerCase().includes(q));
 list.forEach(t=>{const free=t.status==='free';const card=document.createElement('div');card.className=`table-card ${t.status==='free'?'free':t.status==='wait'?'wait':'busy'}`;card.innerHTML=`<i class="corner"></i><div class="table-no">${t.type==='mesa'?'Mesa '+t.id:'Comanda #'+t.id}</div><div class="client">${free?'Livre':t.client}</div><div class="meta">${free?'Toque para abrir':`${t.opened} min • Garçom 01`}</div><div class="value">${free?'':brl(t.total)}</div>`;card.onclick=()=>openOrder(t.type,t.id);grid.appendChild(card)});
}
function getCurrent(){if(!currentRef)return null;return currentRef.type==='mesa'?state.tables.find(x=>x.id===currentRef.id):state.tabs.find(x=>x.id===currentRef.id)}
function fillTableSelect(){const s=document.getElementById('tableSelect');s.innerHTML='';if(individualMode){s.innerHTML='<option>Comanda individual</option>';s.disabled=true}else{state.tables.forEach(t=>{const o=document.createElement('option');o.value=t.id;o.textContent=`Mesa ${t.id}${t.status!=='free'?' • '+t.client:''}`;s.appendChild(o)});s.disabled=false}}
function openOrder(type=null,id=null,mode='mesa'){
 individualMode=mode==='comanda'||type==='comanda';currentRef=type&&id?{type,id}:null;cart={};const t=getCurrent();
 document.getElementById('sheetTitle').textContent=t?(t.type==='mesa'?`Mesa ${t.id} • ${t.client||'Livre'}`:`Comanda #${t.id} • ${t.client}`):(individualMode?'Nova comanda individual':'Abrir mesa');document.getElementById('clientName').value=t?.client||'';fillTableSelect();if(t?.type==='mesa')document.getElementById('tableSelect').value=t.id;renderProducts();renderCart();document.getElementById('overlay').classList.remove('hidden');
}
function renderProducts(){
 const active=state.products.filter(p=>p.active!==false);const cats=[...new Set(active.map(p=>p.cat))];if(!cats.includes(activeCat))activeCat=cats[0]||'';
 document.getElementById('categoryChips').innerHTML=cats.map(c=>`<button class="chip ${c===activeCat?'active':''}" onclick="setCat(${JSON.stringify(c)})">${defaultIcons[c]||'●'} ${c}</button>`).join('');
 const list=active.filter(p=>p.cat===activeCat);document.getElementById('productsGrid').innerHTML=list.length?list.map(p=>`<div class="product"><div class="photo">${mediaFor(p)}</div><div class="pname">${p.name}</div><div class="pstock">${p.stock>0?'Estoque: '+p.stock:'SEM ESTOQUE'}</div><div class="prow"><span class="price">${brl(p.price)}</span><button class="add" ${p.stock<=0?'disabled':''} onclick="addProd(${p.id})">+</button></div></div>`).join(''):'<div class="help">Nenhum produto ativo nesta categoria.</div>';
}
window.setCat=c=>{activeCat=c;renderProducts()};
window.addProd=id=>{const p=state.products.find(x=>x.id===id);if(!p||p.stock-(cart[id]||0)<=0)return toast('Produto sem estoque');cart[id]=(cart[id]||0)+1;renderCart()};
function renderCart(){const lines=document.getElementById('cartLines');const entries=Object.entries(cart);if(!entries.length){lines.innerHTML='<div style="color:#8991a6;font-size:13px">Nenhum item adicionado.</div>';document.getElementById('cartTotal').textContent=brl(0);return}let total=0;lines.innerHTML=entries.map(([id,qty])=>{const p=state.products.find(x=>x.id==id);if(!p)return'';total+=p.price*qty;return `<div class="cart-line"><span>${qty}× ${p.name}</span><strong>${brl(p.price*qty)}</strong></div>`}).join('');document.getElementById('cartTotal').textContent=brl(total)}
function confirmOrder(){
 const name=document.getElementById('clientName').value.trim();if(!name)return toast('Informe o nome do cliente');const entries=Object.entries(cart);let selectedTableId=+document.getElementById('tableSelect').value;
 for(const [id,qty] of entries){const p=state.products.find(x=>x.id==id);if(!p||p.stock<qty)return toast(`Estoque insuficiente: ${p?.name||'produto'}`)}
 const existing=getCurrent();if(!entries.length&&existing?.total===0)return toast('Adicione pelo menos um produto');
 commit(s=>{
  let t;if(currentRef)t=currentRef.type==='mesa'?s.tables.find(x=>x.id===currentRef.id):s.tabs.find(x=>x.id===currentRef.id);
  if(!t){if(individualMode){const nextId=Math.max(100,...s.tabs.map(x=>x.id))+1;t={id:nextId,type:'comanda',client:name,status:'busy',opened:0,total:0,items:[]};s.tabs.push(t)}else{t=s.tables.find(x=>x.id===selectedTableId);if(!t)return;t.client=name;t.status='busy';t.opened=0}}
  entries.forEach(([id,qty])=>{const p=s.products.find(x=>x.id==id);p.stock-=qty;t.total+=p.price*qty;t.items.push({pid:+id,qty})});t.client=name;if(t.status==='free')t.status='busy';
 },'Pedido lançado • painel atualizado em tempo real').then(()=>{document.getElementById('overlay').classList.add('hidden');currentRef=null;cart={}});
}
function renderAdmin(){
 const all=[...state.tables,...state.tabs].filter(t=>t.status!=='free');const sales=all.reduce((s,t)=>s+t.total,0),items=all.reduce((s,t)=>s+t.items.reduce((a,i)=>a+i.qty,0),0),low=state.products.filter(p=>p.active!==false&&p.stock<=p.min).length;
 document.getElementById('mSales').textContent=brl(sales);document.getElementById('mOpen').textContent=all.length;document.getElementById('mItems').textContent=items;document.getElementById('mLow').textContent=low;
 document.getElementById('openTable').innerHTML=all.map(t=>`<tr><td><strong>${t.type==='mesa'?'Mesa '+t.id:'Comanda #'+t.id}</strong><br><span style="color:#77809a">${t.client}</span></td><td>Garçom 01</td><td>${t.opened} min</td><td><strong>${brl(t.total)}</strong></td><td><span class="status open">Aberta</span></td></tr>`).join('');
 document.getElementById('stockTable').innerHTML=state.products.map(p=>`<tr><td><div class="product-cell"><div class="thumb">${mediaFor(p)}</div><strong>${p.name}</strong></div></td><td>${p.cat}</td><td>${p.stock}</td><td>${p.min}</td><td><span class="status ${p.stock<=p.min?'low':'ok'}">${p.stock<=p.min?'Baixo':'Normal'}</span></td><td><div class="stock-actions"><button class="plus" onclick="stock(${p.id},1)">+1</button><button class="minus" onclick="stock(${p.id},-1)">−1</button></div></td></tr>`).join('');
 document.getElementById('productTable').innerHTML=state.products.map(p=>`<tr><td><div class="product-cell"><div class="thumb">${mediaFor(p)}</div><div><strong>${p.name}</strong><div class="help">ID ${p.id}</div></div></div></td><td>${p.cat}</td><td><strong>${brl(p.price)}</strong></td><td>${p.stock}</td><td><span class="status ${p.active!==false?'ok':'off'}">${p.active!==false?'Visível':'Oculto'}</span></td><td><div class="row-actions"><button class="edit" onclick="editProduct(${p.id})">Editar</button><button class="toggle" onclick="toggleProduct(${p.id})">${p.active!==false?'Ocultar':'Ativar'}</button></div></td></tr>`).join('');
 const cats=[...new Set(state.products.map(p=>p.cat))];document.getElementById('categoryOptions').innerHTML=cats.map(c=>`<option value="${c}"></option>`).join('');
}
window.stock=(id,delta)=>commit(s=>{const p=s.products.find(x=>x.id===id);if(p)p.stock=Math.max(0,p.stock+delta)},'Estoque atualizado • telas sincronizadas');
window.toggleProduct=id=>commit(s=>{const p=s.products.find(x=>x.id===id);if(p)p.active=p.active===false},'Visibilidade atualizada para os garçons');
function resetProductForm(){editingProductId=null;pendingPhoto='';document.getElementById('productSheetTitle').textContent='Adicionar novo produto';document.getElementById('pName').value='';document.getElementById('pCategory').value='';document.getElementById('pPrice').value='';document.getElementById('pStock').value='';document.getElementById('pMin').value='';document.getElementById('pEmoji').value='📦';document.getElementById('pPhoto').value='';document.getElementById('pActive').checked=true;document.getElementById('photoPreview').innerHTML='📦'}
function openProductModal(){resetProductForm();document.getElementById('productOverlay').classList.remove('hidden')}
window.editProduct=id=>{const p=state.products.find(x=>x.id===id);if(!p)return;editingProductId=id;pendingPhoto=p.photo||'';document.getElementById('productSheetTitle').textContent='Editar produto';document.getElementById('pName').value=p.name;document.getElementById('pCategory').value=p.cat;document.getElementById('pPrice').value=p.price;document.getElementById('pStock').value=p.stock;document.getElementById('pMin').value=p.min;document.getElementById('pEmoji').value=p.emoji||defaultIcons[p.cat]||'📦';document.getElementById('pPhoto').value='';document.getElementById('pActive').checked=p.active!==false;document.getElementById('photoPreview').innerHTML=p.photo?`<img src="${p.photo}">`:(p.emoji||defaultIcons[p.cat]||'📦');document.getElementById('productOverlay').classList.remove('hidden')}
function saveProduct(){const name=document.getElementById('pName').value.trim(),cat=document.getElementById('pCategory').value.trim(),price=Number(document.getElementById('pPrice').value),stock=Number(document.getElementById('pStock').value),min=Number(document.getElementById('pMin').value),emoji=document.getElementById('pEmoji').value.trim()||defaultIcons[cat]||'📦',active=document.getElementById('pActive').checked;if(!name||!cat||Number.isNaN(price)||price<0||Number.isNaN(stock)||stock<0||Number.isNaN(min)||min<0)return toast('Preencha nome, categoria, preço e estoque corretamente');const wasEdit=editingProductId!==null;commit(s=>{if(wasEdit){const p=s.products.find(x=>x.id===editingProductId);Object.assign(p,{name,cat,price,stock,min,emoji,photo:pendingPhoto,active})}else{const id=Math.max(0,...s.products.map(x=>x.id))+1;s.products.push({id,name,cat,price,stock,min,emoji,photo:pendingPhoto,active})}},wasEdit?'Produto editado • garçom atualizado':'Novo produto adicionado • já disponível para o garçom').then(()=>{document.getElementById('productOverlay').classList.add('hidden');activeCat=cat})}
window.scrollToId=id=>document.getElementById(id)?.scrollIntoView({behavior:'smooth',block:'start'});

document.getElementById('pPhoto').addEventListener('change',e=>{const f=e.target.files?.[0];if(!f)return;const reader=new FileReader();reader.onload=()=>{pendingPhoto=reader.result;document.getElementById('photoPreview').innerHTML=`<img src="${pendingPhoto}">`};reader.readAsDataURL(f)});
document.getElementById('swWaiter').onclick=()=>{document.getElementById('waiterView').classList.remove('hidden');document.getElementById('adminView').classList.add('hidden');swWaiter.classList.add('active');swAdmin.classList.remove('active')};
document.getElementById('swAdmin').onclick=()=>{document.getElementById('adminView').classList.remove('hidden');document.getElementById('waiterView').classList.add('hidden');swAdmin.classList.add('active');swWaiter.classList.remove('active');renderAdmin()};
document.getElementById('closeSheet').onclick=()=>document.getElementById('overlay').classList.add('hidden');document.getElementById('newTable').onclick=()=>openOrder(null,null,'mesa');document.getElementById('newTab').onclick=()=>openOrder(null,null,'comanda');document.getElementById('confirmOrder').onclick=confirmOrder;document.getElementById('searchBtn').onclick=()=>renderTables(document.getElementById('searchTable').value);document.getElementById('searchTable').addEventListener('input',e=>renderTables(e.target.value));document.getElementById('bottomSearch').onclick=()=>document.getElementById('searchTable').focus();
document.getElementById('addDemoStock').onclick=()=>commit(s=>{const a=s.products.find(p=>p.id===1),b=s.products.find(p=>p.id===5);if(a)a.stock+=24;if(b)b.stock+=12},'Entrada rápida registrada • garçons atualizados');
document.getElementById('newProduct').onclick=openProductModal;document.getElementById('newProductTop').onclick=openProductModal;document.getElementById('closeProductSheet').onclick=()=>document.getElementById('productOverlay').classList.add('hidden');document.getElementById('cancelProduct').onclick=()=>document.getElementById('productOverlay').classList.add('hidden');document.getElementById('saveProduct').onclick=saveProduct;

initSync().then(()=>{const view=new URLSearchParams(location.search).get('view');if(view==='admin')document.getElementById('swAdmin').click();if(view==='order'){openOrder('mesa',1)}});
