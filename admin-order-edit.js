(()=>{
const A=window.APP;if(!A)return;
const style=document.createElement('style');
style.textContent=`
.admin-order-edit-note{margin:12px 0;padding:11px 12px;border-radius:12px;background:#fff7ed;color:#9a4b00;font-size:12px;line-height:1.45}.admin-order-line-actions{display:flex;gap:6px;flex-wrap:wrap;margin-left:auto}.admin-order-line-actions button{border:0;border-radius:9px;padding:7px 9px;font-size:11px;font-weight:900;cursor:pointer}.admin-order-line-actions .qty{background:#eef1f6;color:#0b1739}.admin-order-line-actions .swap{background:#e8f0ff;color:#173e86}.admin-order-line-actions .remove{background:#feecec;color:#a60f17}.detail-lines>div{gap:10px;flex-wrap:wrap}
`;
document.head.appendChild(style);

function getOrder(type,id){const s=A.state();return type==='mesa'?s.tables.find(x=>x.id===Number(id)):s.tabs.find(x=>x.id===Number(id))}
function refresh(type,id){setTimeout(()=>window.viewOrder?.(type,id),60)}
async function changeQty(type,id,index,delta){
  const before=getOrder(type,id),item=before?.items?.[index],p=item?A.product(item.pid):null;if(!before||!item||!p)return;
  if(delta>0&&Number(p.stock||0)<delta)return A.toast('Estoque insuficiente para aumentar a quantidade.');
  const ok=await A.commit(s=>{const t=type==='mesa'?s.tables.find(x=>x.id===Number(id)):s.tabs.find(x=>x.id===Number(id));const i=t?.items?.[index];if(!t||!i)return;const prod=s.products.find(x=>x.id===i.pid);if(!prod)return;const oldQty=Number(i.qty||0),newQty=Math.max(0,oldQty+delta),diff=newQty-oldQty;if(diff>0&&Number(prod.stock||0)<diff)throw new Error('Estoque insuficiente');prod.stock=Number(prod.stock||0)-diff;t.total=Math.max(0,Number(t.total||0)+Number(prod.price||0)*diff);if(newQty<=0)t.items.splice(index,1);else i.qty=newQty},'Comanda corrigida e estoque ajustado');if(ok)refresh(type,id)
}
async function removeItem(type,id,index){const t=getOrder(type,id),i=t?.items?.[index],p=i?A.product(i.pid):null;if(!t||!i||!p)return;if(!confirm(`Remover ${i.qty}× ${p.name} desta comanda?`))return;const ok=await A.commit(s=>{const order=type==='mesa'?s.tables.find(x=>x.id===Number(id)):s.tabs.find(x=>x.id===Number(id));const item=order?.items?.[index];if(!order||!item)return;const prod=s.products.find(x=>x.id===item.pid);if(!prod)return;const q=Number(item.qty||0);prod.stock=Number(prod.stock||0)+q;order.total=Math.max(0,Number(order.total||0)-Number(prod.price||0)*q);order.items.splice(index,1)},'Item removido • estoque devolvido');if(ok)refresh(type,id)}
async function swapItem(type,id,index){
  const t=getOrder(type,id),item=t?.items?.[index],oldP=item?A.product(item.pid):null;if(!t||!item||!oldP)return;
  const q=prompt(`Trocar ${item.qty}× ${oldP.name}.\nDigite o nome ou ID do produto correto:`,'');if(!q?.trim())return;
  const query=q.trim().toLowerCase();const next=A.state().products.find(p=>String(p.id)===q.trim()||p.name.toLowerCase()===query)||A.state().products.find(p=>p.name.toLowerCase().includes(query));
  if(!next)return A.toast('Produto não encontrado.');if(next.id===oldP.id)return A.toast('Esse já é o produto lançado.');if(Number(next.stock||0)<Number(item.qty||0))return A.toast('Estoque insuficiente do produto correto.');
  const ok=await A.commit(s=>{const order=type==='mesa'?s.tables.find(x=>x.id===Number(id)):s.tabs.find(x=>x.id===Number(id));const it=order?.items?.[index];if(!order||!it)return;const oldProd=s.products.find(x=>x.id===it.pid),newProd=s.products.find(x=>x.id===next.id);if(!oldProd||!newProd)return;const qty=Number(it.qty||0);if(Number(newProd.stock||0)<qty)throw new Error('Estoque insuficiente');oldProd.stock=Number(oldProd.stock||0)+qty;newProd.stock=Number(newProd.stock||0)-qty;order.total=Math.max(0,Number(order.total||0)+(Number(newProd.price||0)-Number(oldProd.price||0))*qty);it.pid=newProd.id},'Produto corrigido • estoque ajustado');if(ok)refresh(type,id)
}
function decorate(type,id){
  const body=document.getElementById('orderDetailBody'),t=getOrder(type,id);if(!body||!t)return;
  if(!body.querySelector('.admin-order-edit-note')){const note=document.createElement('div');note.className='admin-order-edit-note';note.innerHTML='<strong>Correção de lançamento:</strong> altere quantidade, troque ou remova um item. O estoque é corrigido automaticamente.';const lines=body.querySelector('.detail-lines');lines?.before(note)}
  const rows=[...body.querySelectorAll('.detail-lines > div')];
  (t.items||[]).forEach((item,index)=>{const row=rows[index];if(!row||row.querySelector('.admin-order-line-actions'))return;const actions=document.createElement('div');actions.className='admin-order-line-actions';actions.innerHTML=`<button class="qty" data-act="minus">−1</button><button class="qty" data-act="plus">+1</button><button class="swap" data-act="swap">Trocar</button><button class="remove" data-act="remove">Remover</button>`;actions.querySelector('[data-act="minus"]').onclick=()=>changeQty(type,id,index,-1);actions.querySelector('[data-act="plus"]').onclick=()=>changeQty(type,id,index,1);actions.querySelector('[data-act="swap"]').onclick=()=>swapItem(type,id,index);actions.querySelector('[data-act="remove"]').onclick=()=>removeItem(type,id,index);row.appendChild(actions)})
}
function install(){if(typeof window.viewOrder!=='function'||window.__adminOrderEditInstalled)return false;window.__adminOrderEditInstalled=true;const original=window.viewOrder;window.viewOrder=(type,id)=>{original(type,id);setTimeout(()=>decorate(type,id),0)};return true}
if(!install()){const timer=setInterval(()=>{if(install())clearInterval(timer)},120);setTimeout(()=>clearInterval(timer),12000)}
})();
