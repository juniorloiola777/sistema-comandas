(()=>{
const A=window.APP;if(!A||document.body.dataset.page!=='admin'||window.__adminSalesStableV48)return;window.__adminSalesStableV48=true;
const $=s=>document.querySelector(s);const esc=v=>A.esc(String(v??'')),brl=v=>A.brl(Number(v||0));
const ts=s=>Number(s.closedAt||s.unpaidAt||0),qty=s=>(s.items||[]).reduce((a,i)=>a+Number(i.qty||0),0),sum=l=>l.reduce((a,s)=>a+Number(s.total||0),0);
let selectedMonth='',lastSignature='';
function monthKey(ms){const d=new Date(Number(ms));if(!Number.isFinite(d.getTime()))return'';return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`}
function monthLabel(key){const [y,m]=key.split('-').map(Number);const x=new Date(y,m-1,1).toLocaleDateString('pt-BR',{month:'long',year:'numeric'});return x.charAt(0).toUpperCase()+x.slice(1)}
function fmt(v){if(!v)return'—';return new Date(Number(v)).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',year:'2-digit',hour:'2-digit',minute:'2-digit'})}
function monthsWithSales(){return [...new Set((A.state().closedSales||[]).map(s=>monthKey(ts(s))).filter(Boolean))].sort().reverse()}
function salesForMonth(month){return (A.state().closedSales||[]).filter(s=>monthKey(ts(s))===month)}
function metric(id,value,sub){const e=$('#'+id);if(!e)return;e.querySelector('strong').textContent=value;e.querySelector('span').textContent=sub||''}
function ensureUi(){const page=$('[data-admin-page="sales"]');if(!page)return false;if($('#salesStableV48'))return true;
 [...page.children].forEach(el=>el.style.display='none');
 const wrap=document.createElement('div');wrap.id='salesStableV48';wrap.innerHTML=`
  <div class="page-head"><div><h2>Vendas</h2><p>Histórico e faturamento por mês.</p></div><div class="filters"><select id="stableSaleMonth" aria-label="Mês das vendas"></select><select id="stableSaleMethod"><option value="all">Todos pagamentos</option><option>Pix</option><option>Dinheiro</option><option>Débito</option><option>Crédito</option><option>Não pagou</option></select><input id="stableSaleSearch" placeholder="Cliente, mesa ou garçom"></div></div>
  <div class="kpis three"><div class="kpi" id="stableSalesRevenue"><label>Faturamento</label><strong>R$ 0,00</strong><span></span></div><div class="kpi" id="stableSalesTicket"><label>Ticket médio</label><strong>R$ 0,00</strong><span></span></div><div class="kpi" id="stableSalesItems"><label>Itens vendidos</label><strong>0</strong><span></span></div></div>
  <div class="panel-v44"><div style="overflow:auto"><table class="table-v44"><thead><tr><th>REFERÊNCIA</th><th>DATA</th><th>GARÇOM</th><th>PAGAMENTO</th><th>ITENS</th><th>VALOR</th></tr></thead><tbody id="stableSalesTable"></tbody></table></div></div>`;
 page.appendChild(wrap);
 $('#stableSaleMonth').addEventListener('change',e=>{selectedMonth=e.target.value;render(true)});
 $('#stableSaleMethod').addEventListener('change',()=>render(true));
 $('#stableSaleSearch').addEventListener('input',()=>render(true));
 return true}
function refreshMonths(){const sel=$('#stableSaleMonth');if(!sel)return;const months=monthsWithSales();if(!months.length){sel.innerHTML='<option value="">Nenhuma venda registrada</option>';sel.disabled=true;selectedMonth='';return}sel.disabled=false;const keep=selectedMonth&&months.includes(selectedMonth)?selectedMonth:(months.includes(sel.value)?sel.value:months[0]);const html=months.map(m=>`<option value="${m}">${monthLabel(m)}</option>`).join('');if(sel.innerHTML!==html)sel.innerHTML=html;sel.value=keep;selectedMonth=keep}
function render(force=false){if(!ensureUi())return;refreshMonths();const month=selectedMonth||$('#stableSaleMonth')?.value||'';const state=A.state(),all=state.closedSales||[];const sig=`${month}|${all.length}|${all.map(s=>`${s.id}:${s.total}:${s.closedAt}`).join(',')}|${$('#stableSaleMethod')?.value||''}|${$('#stableSaleSearch')?.value||''}`;if(!force&&sig===lastSignature)return;lastSignature=sig;if(!month){$('#stableSalesTable').innerHTML='<tr><td colspan="6" class="empty-cell">Nenhuma venda registrada.</td></tr>';metric('stableSalesRevenue',brl(0),'0 venda(s)');metric('stableSalesTicket',brl(0),'ticket médio');metric('stableSalesItems','0','itens vendidos');return}
 const method=$('#stableSaleMethod').value,q=$('#stableSaleSearch').value.toLowerCase().trim();const list=salesForMonth(month).filter(s=>(method==='all'||s.payment===method)&&(!q||String(s.client||'').toLowerCase().includes(q)||String(s.waiter||s.closedBy||'').toLowerCase().includes(q)||String(s.refId||'').includes(q))).sort((a,b)=>ts(b)-ts(a));
 $('#stableSalesTable').innerHTML=list.length?list.map(s=>`<tr><td><strong>${s.type==='mesa'?'Mesa '+s.refId:'Comanda #'+s.refId}</strong><small>${esc(s.client||'Cliente')}</small></td><td>${fmt(ts(s))}</td><td>${esc(s.waiter||s.closedBy||'—')}</td><td>${esc(s.payment||'—')}</td><td>${qty(s)}</td><td><strong>${brl(s.total)}</strong></td></tr>`).join(''):'<tr><td colspan="6" class="empty-cell">Nenhuma venda neste filtro.</td></tr>';
 metric('stableSalesRevenue',brl(sum(list)),`${list.length} venda(s) em ${monthLabel(month)}`);metric('stableSalesTicket',brl(list.length?sum(list)/list.length:0),'ticket médio do mês');metric('stableSalesItems',String(list.reduce((a,s)=>a+qty(s),0)),'itens vendidos no mês')}
let tries=0;const boot=setInterval(()=>{if(ensureUi()){clearInterval(boot);render(true)}else if(++tries>60)clearInterval(boot)},150);
setInterval(()=>render(false),2000);
})();