(()=>{
const A=window.APP,$=id=>document.getElementById(id);
let current=null,cart={},cat='',individual=false,mode='all';
const currentWaiter=()=>A.waiterUser()?.displayName||A.state().settings.waiterName||'Garçom';
const currentUsername=()=>A.waiterUser()?.username||'';

const editStyle=document.createElement('style');
editStyle.textContent=`
.cart-existing-title{margin:10px 0 6px;font-size:11px;font-weight:950;color:#626c82;text-transform:uppercase;letter-spacing:.04em}.cart-line.existing{align-items:flex-start}.cart-line-main{display:flex;flex-direction:column;gap:2px;min-width:0}.cart-line-main small{font-size:10px;color:#8a92a6}.cart-actions.editing{flex-wrap:wrap;justify-content:flex-end}.cart-actions.editing button{width:auto!important;min-width:34px;padding:6px 8px;font-size:10px}.cart-actions .swap-item{background:#e8f0ff!important;color:#173e86!important}.cart-actions .remove-item{background:#feecec!important;color:#a60f17!important}
`;
document.head.appendChild(editStyle);

function tableCurrent(){if(!current)return null;const s=A.state();return current.type==='mesa'?s.tables.find(x=>x.id===current.id):s.tabs.find(x=>x.id===current.id)}
function render(){const s=A.state();$('waiterNameLabel').textContent=currentWaiter();renderTables($('searchTable').value);if(!$('overlay').classList.contains('hidden')){renderProducts();renderCart()}}
function setMode(next){mode=next;$('bottomTables').classList.toggle('active',mode==='all');$('bottomTabs').classList.toggle('active',mode==='tabs');renderTables($('searchTable').value)}
function renderTables(filter=''){const s=A.state(),grid=$('tableGrid'),q=String(filter||'').toLowerCase().trim();const src=mode==='tabs'?s.tabs:[...s.tables,...s.tabs];const list=src.filter(t=>!q||String(t.id).includes(q)||(t.client||'').toLowerCase().includes(q));grid.innerHTML=list.length?'':'<div class="empty-state">Nenhuma mesa ou comanda encontrada.</div>';list.forEach(t=>{const free=t.status==='free',b=document.createElement('button');b.className=`table-card ${free?'free':t.status==='wait'?'wait':'busy'}`;b.innerHTML=`<i class="corner"></i><div class="table-no">${t.type==='mesa'?'Mesa '+t.id:'Comanda #'+t.id}</div><div class="client">${free?'Livre':A.esc(t.client)}</div><div class="meta">${free?'Toque para abrir':`${t.opened||0} min • ${A.esc(t.waiter||'Garçom')}`}</div><div class="value">${free?'':A.brl(t.total)}</div>`;b.onclick=()=>openOrder(t.type,t.id);grid.appendChild(b)})}
function fillSelect(){const s=A.state(),el=$('tableSelect'),t=tableCurrent();el.innerHTML='';if(individual){el.innerHTML='<option>Comanda individual</option>';el.disabled=true;return}const available=s.tables.filter(x=>x.status==='free'||x.id===t?.id);if(!available.length){el.innerHTML='<option value="">Nenhuma mesa livre</option>';el.disabled=true;return}available.forEach(x=>{const o=document.createElement('option');o.value=x.id;o.textContent=`Mesa ${x.id}${x.status!=='free'?' • '+x.client:''}`;el.appendChild(o)});el.disabled=false}
function openOrder(type=null,id=null,newMode='mesa'){individual=newMode==='comanda'||type==='comanda';current=type&&id?{type,id}:null;cart={};const t=tableCurrent();if(!t&&!individual&&!A.state().tables.some(x=>x.status==='free'))return A.toast('Não há mesa livre no momento');$('sheetTitle').textContent=t?(t.type==='mesa'?`Mesa ${t.id} • ${t.client||'Livre'}`:`Comanda #${t.id} • ${t.client}`):(individual?'Nova comanda individual':'Abrir mesa');$('clientName').value=t?.client||'';fillSelect();if(t?.type==='mesa')$('tableSelect').value=t.id;$('requestClose').classList.toggle('hidden',!t||t.status==='wait');renderProducts();renderCart();$('overlay').classList.remove('hidden')}
function renderProducts(){const s=A.state(),active=s.products.filter(p=>p.active!==false),cats=s.categories.filter(c=>active.some(p=>p.cat===c));if(!cats.includes(cat))cat=cats[0]||'';$('categoryChips').innerHTML=cats.map(c=>`<button class="chip ${c===cat?'active':''}" data-cat="${encodeURIComponent(c)}">${A.icons[c]||'●'} ${A.esc(c)}</button>`).join('');document.querySelectorAll('#categoryChips [data-cat]').forEach(b=>b.onclick=()=>{cat=decodeURIComponent(b.dataset.cat);renderProducts()});const list=active.filter(p=>p.cat===cat);$('productsGrid').innerHTML=list.length?list.map(p=>`<div class="product"><div class="photo">${A.media(p)}</div><div class="pname">${A.esc(p.name)}</div><div class="pstock">${p.stock>0?'Estoque: '+p.stock:'SEM ESTOQUE'}</div><div class="prow"><span class="price">${A.brl(p.price)}</span><button class="add" data-add="${p.id}" ${p.stock-(cart[p.id]||0)<=0?'disabled':''}>+</button></div></div>`).join(''):'<div class="empty-state">Nenhum produto nesta categoria.</div>';document.querySelectorAll('[data-add]').forEach(b=>b.onclick=()=>addProd(Number(b.dataset.add)))}
function addProd(id){const p=A.product(id);if(!p||p.stock-(cart[id]||0)<=0)return A.toast('Produto sem estoque');cart[id]=(cart[id]||0)+1;renderProducts();renderCart()}
function removeProd(id){if(!cart[id])return;cart[id]--;if(cart[id]<=0)delete cart[id];renderProducts();renderCart()}
function fmtTime(ts){if(!ts)return'horário antigo não registrado';return new Date(Number(ts)).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}
function historyArray(s){if(!Array.isArray(s.itemHistory))s.itemHistory=[];return s.itemHistory}
function ensureLineIdentity(item){if(!item.lineId)item.lineId=`legacy-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;return item.lineId}
function syncHistory(s,t,item,prod,actor,extra={}){
  const hist=historyArray(s),lineId=ensureLineIdentity(item);let h=hist.find(x=>x.lineId===lineId);
  if(!h){h={lineId,pid:item.pid,qty:Number(item.qty||0),name:prod?.name||`Produto ${item.pid}`,price:Number(item.price??prod?.price??0),waiter:item.waiter||actor,username:item.username||currentUsername(),launchedAt:Number(item.launchedAt)||0,orderType:t.type,orderId:t.id,client:t.client||'',legacy:!item.launchedAt};hist.push(h)}
  Object.assign(h,{pid:item.pid,qty:Number(item.qty||0),name:prod?.name||h.name||`Produto ${item.pid}`,price:Number(item.price??prod?.price??h.price??0),waiter:item.waiter||h.waiter||actor,username:item.username||h.username||currentUsername(),orderType:t.type,orderId:t.id,client:t.client||h.client||''},extra);
  return h;
}
function renderCart(){
  const entries=Object.entries(cart),existing=tableCurrent(),base=Number(existing?.total||0);let pending=0,html='';
  if(existing){
    html+=`<div class="cart-current"><span>Total já lançado</span><strong>${A.brl(base)}</strong></div>`;
    const items=existing.items||[];
    if(items.length){html+='<div class="cart-existing-title">Itens já lançados • você pode corrigir</div>';html+=items.map((i,index)=>{const p=A.product(i.pid),price=Number(i.price??p?.price??0);return`<div class="cart-line existing"><div class="cart-line-main"><span>${Number(i.qty||0)}× ${A.esc(p?.name||'Produto')}</span><small>${A.esc(i.waiter||existing.waiter||'Garçom')} • ${fmtTime(i.launchedAt)}</small></div><div class="cart-actions editing"><strong>${A.brl(price*Number(i.qty||0))}</strong><button class="order-edit-btn" data-existing-minus="${index}">−1</button><button class="order-edit-btn" data-existing-plus="${index}">+1</button><button class="order-edit-btn swap-item" data-existing-swap="${index}">Trocar</button><button class="order-edit-btn remove-item" data-existing-remove="${index}">Remover</button></div></div>`}).join('')}
  }
  if(!entries.length)html+='<div class="cart-empty">Nenhum item novo adicionado.</div>';else html+=entries.map(([id,q])=>{const p=A.product(id);if(!p)return'';pending+=p.price*q;return`<div class="cart-line"><span>${q}× ${A.esc(p.name)}</span><div class="cart-actions"><strong>${A.brl(p.price*q)}</strong><button data-remove="${p.id}">−</button><button data-plus="${p.id}">+</button></div></div>`}).join('');
  $('cartLines').innerHTML=html;$('cartTotal').textContent=A.brl(base+pending);
  document.querySelectorAll('[data-remove]').forEach(b=>b.onclick=()=>removeProd(Number(b.dataset.remove)));document.querySelectorAll('[data-plus]').forEach(b=>b.onclick=()=>addProd(Number(b.dataset.plus)));
  document.querySelectorAll('[data-existing-minus]').forEach(b=>b.onclick=()=>changeExistingQty(Number(b.dataset.existingMinus),-1));
  document.querySelectorAll('[data-existing-plus]').forEach(b=>b.onclick=()=>changeExistingQty(Number(b.dataset.existingPlus),1));
  document.querySelectorAll('[data-existing-swap]').forEach(b=>b.onclick=()=>swapExisting(Number(b.dataset.existingSwap)));
  document.querySelectorAll('[data-existing-remove]').forEach(b=>b.onclick=()=>removeExisting(Number(b.dataset.existingRemove)));
}
async function changeExistingQty(index,delta){
  const before=tableCurrent(),item=before?.items?.[index],p=item?A.product(item.pid):null;if(!before||!item||!p)return;
  if(delta>0&&Number(p.stock||0)<delta)return A.toast('Estoque insuficiente para aumentar a quantidade.');
  const actor=currentWaiter(),editedAt=Date.now();
  const ok=await A.commit(s=>{const t=current.type==='mesa'?s.tables.find(x=>x.id===current.id):s.tabs.find(x=>x.id===current.id),i=t?.items?.[index];if(!t||!i)return;const prod=s.products.find(x=>x.id===i.pid);if(!prod)return;const oldQty=Number(i.qty||0),newQty=Math.max(0,oldQty+delta),diff=newQty-oldQty;if(diff>0&&Number(prod.stock||0)<diff)throw new Error('Estoque insuficiente');prod.stock=Number(prod.stock||0)-diff;t.total=Math.max(0,Number(t.total||0)+Number(prod.price||0)*diff);i.price=Number(prod.price||0);i.editedAt=editedAt;i.editedBy=actor;if(newQty<=0){i.qty=0;syncHistory(s,t,i,prod,actor,{qty:0,removed:true,editedAt,editedBy:actor});t.items.splice(index,1)}else{i.qty=newQty;syncHistory(s,t,i,prod,actor,{removed:false,editedAt,editedBy:actor})}},`Pedido corrigido por ${actor}`);
  if(ok){renderProducts();renderCart()}
}
async function removeExisting(index){const t=tableCurrent(),i=t?.items?.[index],p=i?A.product(i.pid):null;if(!t||!i||!p)return;if(!confirm(`Remover ${i.qty}× ${p.name} deste pedido?`))return;await changeExistingQty(index,-Number(i.qty||0))}
async function swapExisting(index){
  const t=tableCurrent(),item=t?.items?.[index],oldP=item?A.product(item.pid):null;if(!t||!item||!oldP)return;
  const q=prompt(`Trocar ${item.qty}× ${oldP.name}.\nDigite o nome ou ID do produto correto:`,'');if(!q?.trim())return;
  const query=q.trim().toLowerCase(),next=A.state().products.find(p=>String(p.id)===q.trim()||p.name.toLowerCase()===query)||A.state().products.find(p=>p.name.toLowerCase().includes(query));
  if(!next)return A.toast('Produto não encontrado.');if(next.id===oldP.id)return A.toast('Esse já é o produto lançado.');if(Number(next.stock||0)<Number(item.qty||0))return A.toast('Estoque insuficiente do produto correto.');
  const actor=currentWaiter(),editedAt=Date.now();
  const ok=await A.commit(s=>{const order=current.type==='mesa'?s.tables.find(x=>x.id===current.id):s.tabs.find(x=>x.id===current.id),it=order?.items?.[index];if(!order||!it)return;const oldProd=s.products.find(x=>x.id===it.pid),newProd=s.products.find(x=>x.id===next.id);if(!oldProd||!newProd)return;const qty=Number(it.qty||0);if(Number(newProd.stock||0)<qty)throw new Error('Estoque insuficiente');oldProd.stock=Number(oldProd.stock||0)+qty;newProd.stock=Number(newProd.stock||0)-qty;order.total=Math.max(0,Number(order.total||0)+(Number(newProd.price||0)-Number(oldProd.price||0))*qty);it.pid=newProd.id;it.price=Number(newProd.price||0);it.editedAt=editedAt;it.editedBy=actor;syncHistory(s,order,it,newProd,actor,{removed:false,editedAt,editedBy:actor})},`Produto corrigido por ${actor}`);
  if(ok){renderProducts();renderCart()}
}
async function confirmOrder(){
  const name=$('clientName').value.trim(),entries=Object.entries(cart),selected=Number($('tableSelect').value),existing=tableCurrent(),waiterName=currentWaiter(),username=currentUsername();
  if(!name)return A.toast('Informe o nome do cliente');if(!entries.length)return A.toast(existing?'Adicione um novo item para lançar':'Adicione pelo menos um produto');if(!existing&&!individual&&!selected)return A.toast('Nenhuma mesa livre disponível');
  for(const[id,q]of entries){const p=A.product(id);if(!p||p.stock<q)return A.toast(`Estoque insuficiente: ${p?.name||'produto'}`)}
  const ok=await A.commit(st=>{let t;if(current)t=current.type==='mesa'?st.tables.find(x=>x.id===current.id):st.tabs.find(x=>x.id===current.id);if(!t){if(individual){const next=Math.max(100,...st.tabs.map(x=>x.id))+1;t={id:next,type:'comanda',client:name,status:'busy',opened:0,total:0,items:[],waiter:waiterName};st.tabs.push(t)}else{t=st.tables.find(x=>x.id===selected);if(!t||t.status!=='free')throw new Error('Mesa indisponível');t.client=name;t.status='busy';t.waiter=waiterName}}const hist=historyArray(st);entries.forEach(([id,q],idx)=>{const p=st.products.find(x=>x.id===Number(id)),qty=Number(q),launchedAt=Date.now()+idx,lineId=`${launchedAt}-${username||'waiter'}-${p.id}-${Math.random().toString(36).slice(2,8)}`;p.stock-=qty;t.total=Number(t.total||0)+Number(p.price||0)*qty;const line={lineId,pid:Number(id),qty,waiter:waiterName,username,price:Number(p.price||0),launchedAt,launchedBy:waiterName};t.items.push(line);hist.push({lineId,pid:Number(id),qty,name:p.name,price:Number(p.price||0),waiter:waiterName,username,launchedAt,orderType:t.type,orderId:t.id,client:name,removed:false})});t.client=name;t.waiter=waiterName;if(t.status==='free')t.status='busy'},`Pedido lançado por ${waiterName}`);
  if(ok){$('overlay').classList.add('hidden');current=null;cart={}}
}
async function requestClose(){const t=tableCurrent();if(!t)return;const ok=await A.commit(st=>{const x=t.type==='mesa'?st.tables.find(y=>y.id===t.id):st.tabs.find(y=>y.id===t.id);if(x)x.status='wait'},'Fechamento solicitado ao caixa');if(ok){$('overlay').classList.add('hidden');current=null}}
$('closeSheet').onclick=()=>$('overlay').classList.add('hidden');$('newTable').onclick=()=>openOrder(null,null,'mesa');$('newTab').onclick=()=>openOrder(null,null,'comanda');$('confirmOrder').onclick=confirmOrder;$('requestClose').onclick=requestClose;$('searchBtn').onclick=()=>renderTables($('searchTable').value);$('searchTable').addEventListener('input',e=>renderTables(e.target.value));$('bottomSearch').onclick=()=>{$('searchTable').focus();window.scrollTo({top:120,behavior:'smooth'})};$('bottomTables').onclick=()=>{mode='all';$('searchTable').value='';setMode('all');window.scrollTo({top:0,behavior:'smooth'})};$('bottomTabs').onclick=()=>{mode='tabs';$('searchTable').value='';setMode('tabs');window.scrollTo({top:0,behavior:'smooth'})};
window.renderPage=render;A.init();
})();
