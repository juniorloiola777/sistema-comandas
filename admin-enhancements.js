(()=>{
const A=window.APP;
if(!A||document.body.dataset.page!=='admin'||window.__cpAdminEnhancements)return;
window.__cpAdminEnhancements=true;
const $=id=>document.getElementById(id);
let editingId=null;
let pendingPhoto='';
let imageBusy=false;

const style=document.createElement('style');
style.textContent=`
.cp-delete-product{background:#fff1f0!important;color:#b42318!important;border:1px solid #ffd6d2!important}
.cp-pay-debt{background:#138a48!important;color:#fff!important;border:0!important;border-radius:9px!important;padding:8px 10px!important;font-weight:900!important;white-space:nowrap}
#adminNav [data-tab="nao-pagaram"]{background:transparent!important;color:inherit!important}
#adminNav [data-tab="nao-pagaram"].active{background:var(--nav-active,#ffffff14)!important;color:inherit!important}
`;
document.head.appendChild(style);

function loadImage(src){return new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=reject;img.src=src})}
async function compressDataUrl(src,maxSide=820,quality=.72){
  if(!src||!String(src).startsWith('data:image'))return src;
  try{
    const img=await loadImage(src);
    const scale=Math.min(1,maxSide/Math.max(img.naturalWidth||img.width,img.naturalHeight||img.height));
    const w=Math.max(1,Math.round((img.naturalWidth||img.width)*scale));
    const h=Math.max(1,Math.round((img.naturalHeight||img.height)*scale));
    const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
    const ctx=canvas.getContext('2d',{alpha:true});ctx.drawImage(img,0,0,w,h);
    let out=canvas.toDataURL('image/webp',quality);
    if(!out.startsWith('data:image/webp'))out=canvas.toDataURL('image/jpeg',quality);
    return out.length<src.length?out:src;
  }catch(_){return src}
}
async function fileToCompressedDataUrl(file){
  const src=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(String(r.result||''));r.onerror=reject;r.readAsDataURL(file)});
  return compressDataUrl(src,820,.72);
}

function installProductHooks(){
  if(typeof window.editProduct==='function'&&!window.editProduct.__cpEnhanced){
    const original=window.editProduct;
    const wrapped=id=>{editingId=Number(id);const p=A.product(id);pendingPhoto=p?.photo||'';return original(id)};
    wrapped.__cpEnhanced=true;window.editProduct=wrapped;
  }
  const newBtn=$('newProduct');
  if(newBtn&&!newBtn.dataset.cpEnhanced){newBtn.dataset.cpEnhanced='1';newBtn.addEventListener('click',()=>{editingId=null;pendingPhoto=''},true)}
  const input=$('pPhoto');
  if(input&&!input.dataset.cpEnhanced){
    input.dataset.cpEnhanced='1';
    input.addEventListener('change',async e=>{
      e.stopImmediatePropagation();
      const f=e.target.files?.[0];if(!f)return;
      if(!f.type.startsWith('image/'))return A.toast('Escolha um arquivo de imagem.');
      if(f.size>12*1024*1024)return A.toast('A imagem é muito grande. Escolha uma foto menor que 12 MB.');
      imageBusy=true;A.toast('Preparando foto...');
      try{pendingPhoto=await fileToCompressedDataUrl(f);const preview=$('photoPreview');if(preview)preview.innerHTML=`<img src="${pendingPhoto}">`;A.toast('Foto pronta para salvar.')}catch(e){console.error(e);A.toast('Não foi possível preparar a foto.')}finally{imageBusy=false}
    },true);
  }
  const save=$('saveProduct');
  if(save&&!save.dataset.cpEnhanced){
    save.dataset.cpEnhanced='1';
    save.addEventListener('click',async e=>{
      e.preventDefault();e.stopImmediatePropagation();
      if(imageBusy)return A.toast('Aguarde a foto terminar de carregar.');
      const name=$('pName')?.value.trim()||'',cat=$('pCategory')?.value.trim()||'',price=Number($('pPrice')?.value),stock=Number($('pStock')?.value),min=Number($('pMin')?.value),emoji=$('pEmoji')?.value.trim()||A.icons[cat]||'📦',active=!!$('pActive')?.checked;
      if(!name||!cat||!Number.isFinite(price)||price<0||!Number.isFinite(stock)||stock<0||!Number.isFinite(min)||min<0)return A.toast('Preencha os dados corretamente');
      const edit=editingId!==null;
      const ok=await A.commit(s=>{
        if(!s.categories.includes(cat))s.categories.push(cat);
        if(edit){const p=s.products.find(x=>x.id===editingId);if(p)Object.assign(p,{name,cat,price,stock,min,emoji,photo:pendingPhoto,active})}
        else{const id=Math.max(0,...s.products.map(x=>x.id))+1;s.products.push({id,name,cat,price,stock,min,emoji,photo:pendingPhoto,active})}
      },edit?'Produto editado • garçom atualizado':'Novo produto adicionado • disponível para o garçom');
      if(ok){$('productOverlay')?.classList.add('hidden');editingId=null;pendingPhoto=''}
    },true);
  }
}

window.deleteProduct=async id=>{
  const p=A.product(id);if(!p)return;
  const used=A.openOrders().some(o=>(o.items||[]).some(i=>Number(i.pid)===Number(id)));
  if(used)return A.toast('Este produto está em uma comanda aberta. Feche a comanda antes de excluir.');
  if(!confirm(`Excluir o produto "${p.name}"? Esta ação remove o produto do cardápio.`))return;
  await A.commit(s=>{s.products=s.products.filter(x=>Number(x.id)!==Number(id))},'Produto excluído');
};
function enhanceProductRows(){
  document.querySelectorAll('#productTable tr').forEach(tr=>{
    const edit=tr.querySelector('button[onclick^="editProduct("]');if(!edit||tr.querySelector('.cp-delete-product'))return;
    const m=edit.getAttribute('onclick')?.match(/editProduct\((\d+)\)/);if(!m)return;
    const id=Number(m[1]),b=document.createElement('button');b.className='cp-delete-product';b.type='button';b.textContent='Excluir';b.onclick=()=>window.deleteProduct(id);edit.parentElement?.appendChild(b);
  });
}

window.markUnpaidAsPaid=async id=>{
  const d=(A.state().unpaidSales||[]).find(x=>Number(x.id)===Number(id));if(!d)return A.toast('Registro não encontrado.');
  if(!confirm(`Marcar ${d.client||'este cliente'} como PAGO no valor de ${A.brl(d.total)}?`))return;
  const now=Date.now();
  await A.commit(s=>{
    s.unpaidSales=Array.isArray(s.unpaidSales)?s.unpaidSales:[];
    const idx=s.unpaidSales.findIndex(x=>Number(x.id)===Number(id));if(idx<0)return;
    const debt=s.unpaidSales[idx];
    s.paidDebts=Array.isArray(s.paidDebts)?s.paidDebts:[];
    s.paidDebts.push({...debt,status:'paid',paidAt:now});
    s.unpaidSales.splice(idx,1);
    s.closedSales=Array.isArray(s.closedSales)?s.closedSales:[];
    s.closedSales.push({id:now,type:debt.type,refId:debt.refId,client:debt.client||'',total:Number(debt.total||0),items:Array.isArray(debt.items)?debt.items:[],payment:'Pago depois',waiter:debt.waiter||debt.recordedBy||'Garçom',closedAt:now,originalUnpaidAt:Number(debt.unpaidAt||0)});
  },'Pagamento confirmado • retirado dos não pagantes');
};
function enhanceUnpaid(){
  const nav=document.querySelector('#adminNav [data-tab="nao-pagaram"]');if(nav)nav.classList.remove('unpaid-alert');
  const tbody=$('unpaidTable');if(!tbody)return;
  const table=tbody.closest('table'),head=table?.querySelector('thead tr');
  if(head&&!head.querySelector('[data-cp-action-head]')){const th=document.createElement('th');th.dataset.cpActionHead='1';th.textContent='AÇÃO';head.appendChild(th)}
  const q=String($('unpaidSearch')?.value||'').toLowerCase().trim();
  const list=(A.state().unpaidSales||[]).slice().sort((a,b)=>Number(b.unpaidAt||0)-Number(a.unpaidAt||0)).filter(d=>!q||String(d.client||'').toLowerCase().includes(q)||String(d.waiter||'').toLowerCase().includes(q));
  const rows=[...tbody.querySelectorAll('tr')];
  if(!list.length){rows.forEach(r=>{const td=r.querySelector('td[colspan]');if(td)td.colSpan=6});return}
  rows.forEach((tr,i)=>{
    if(!list[i]||tr.querySelector('.cp-debt-action'))return;
    const td=document.createElement('td');td.className='cp-debt-action';
    const b=document.createElement('button');b.className='cp-pay-debt';b.type='button';b.textContent='Marcar como pago';b.onclick=()=>window.markUnpaidAsPaid(list[i].id);td.appendChild(b);tr.appendChild(td);
  });
}

let optimizing=false;
async function optimizeLegacyPhotos(){
  if(optimizing||sessionStorage.getItem('cpPhotoOptimizationAttempted')==='1')return;
  const candidates=(A.state().products||[]).filter(p=>String(p.photo||'').startsWith('data:image')&&String(p.photo).length>140000);
  if(!candidates.length)return;
  optimizing=true;sessionStorage.setItem('cpPhotoOptimizationAttempted','1');
  try{
    const replacements={};
    for(const p of candidates){const out=await compressDataUrl(p.photo,820,.70);if(out&&out.length<p.photo.length)replacements[p.id]=out}
    if(Object.keys(replacements).length){
      await A.commit(s=>{s.products.forEach(p=>{if(replacements[p.id])p.photo=replacements[p.id]})},'Fotos otimizadas • novos uploads liberados');
    }
  }catch(e){console.warn('Não foi possível otimizar fotos antigas.',e)}finally{optimizing=false}
}

const timer=setInterval(()=>{installProductHooks();enhanceProductRows();enhanceUnpaid()},300);
setTimeout(optimizeLegacyPhotos,1800);
window.addEventListener('beforeunload',()=>clearInterval(timer),{once:true});
})();
