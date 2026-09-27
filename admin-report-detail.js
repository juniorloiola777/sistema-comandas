(()=>{
const A=window.APP;
if(!A||document.getElementById('launchReportPanel'))return;
const section=document.querySelector('[data-section="relatorios"]');
if(!section)return;

const style=document.createElement('style');
style.textContent=`
.launch-report-panel{margin-top:16px}.launch-report-toolbar{display:flex;align-items:flex-end;justify-content:space-between;gap:12px;flex-wrap:wrap}.launch-report-toolbar h3{margin:0;color:#0b1739}.launch-report-toolbar p{margin:4px 0 0;color:#7b8499;font-size:12px}.launch-report-date{display:flex;flex-direction:column;gap:5px}.launch-report-date label{font-size:11px;font-weight:900;color:#606a80}.launch-report-date input{border:1px solid #dfe3ed;border-radius:10px;padding:9px 10px;background:#fff;color:#0b1739}.launch-report-metrics{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin:14px 0}.launch-report-metric{padding:12px;border-radius:12px;background:#f7f8fb}.launch-report-metric span{display:block;color:#7b8499;font-size:10px;font-weight:850;margin-bottom:4px}.launch-report-metric strong{color:#0b1739;font-size:17px}.launch-report-note{margin-top:10px;font-size:11px;color:#858da3;line-height:1.45}@media(max-width:700px){.launch-report-metrics{grid-template-columns:1fr}.launch-report-toolbar{align-items:stretch}}
`;
document.head.appendChild(style);

function dateKey(ts){if(!ts)return'';const d=new Date(Number(ts));return`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
function todayKey(){return dateKey(Date.now())}
function fmtTime(ts){if(!ts)return'—';return new Date(Number(ts)).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit',second:'2-digit'})}
function orderLabel(h){return h.orderType==='mesa'?`Mesa ${h.orderId}`:`Comanda #${h.orderId}`}

const panel=document.createElement('div');
panel.id='launchReportPanel';
panel.className='panel launch-report-panel';
panel.innerHTML=`<div class="launch-report-toolbar"><div><h3>Lançamentos por horário</h3><p>Cada item entra no dia e horário em que foi lançado no pedido.</p></div><div class="launch-report-date"><label>DATA DO LANÇAMENTO</label><input id="launchReportDate" type="date"></div></div><div class="launch-report-metrics"><div class="launch-report-metric"><span>LANÇAMENTOS</span><strong id="launchReportCount">0</strong></div><div class="launch-report-metric"><span>ITENS</span><strong id="launchReportItems">0</strong></div><div class="launch-report-metric"><span>VALOR LANÇADO</span><strong id="launchReportValue">R$ 0,00</strong></div></div><div class="table-wrap"><table><thead><tr><th>HORÁRIO</th><th>PRODUTO</th><th>QTD.</th><th>MESA / COMANDA</th><th>CLIENTE</th><th>GARÇOM</th><th>VALOR</th></tr></thead><tbody id="launchReportTable"></tbody></table></div><div class="launch-report-note">Exemplo: um item lançado às 23:58 pertence a esse dia; outro lançado às 00:01 pertence ao dia seguinte. O relatório usa a data/hora de cada lançamento, não a hora do fechamento da conta.</div>`;
section.appendChild(panel);
const dateInput=document.getElementById('launchReportDate');dateInput.value=todayKey();

function render(){
  const selected=dateInput.value||todayKey();
  const all=(Array.isArray(A.state().itemHistory)?A.state().itemHistory:[]).filter(h=>Number(h.qty||0)>0&&Number(h.launchedAt||0)>0);
  const rows=all.filter(h=>dateKey(h.launchedAt)===selected).sort((a,b)=>Number(a.launchedAt)-Number(b.launchedAt));
  const qty=rows.reduce((a,h)=>a+Number(h.qty||0),0),value=rows.reduce((a,h)=>a+Number(h.price||0)*Number(h.qty||0),0);
  document.getElementById('launchReportCount').textContent=rows.length;
  document.getElementById('launchReportItems').textContent=qty;
  document.getElementById('launchReportValue').textContent=A.brl(value);
  document.getElementById('launchReportTable').innerHTML=rows.length?rows.map(h=>`<tr><td><strong>${fmtTime(h.launchedAt)}</strong></td><td><strong>${A.esc(h.name||A.product(h.pid)?.name||'Produto')}</strong>${h.editedAt?`<div class="help">corrigido por ${A.esc(h.editedBy||'usuário')}</div>`:''}</td><td>${Number(h.qty||0)}</td><td>${A.esc(orderLabel(h))}</td><td>${A.esc(h.client||'—')}</td><td>${A.esc(h.waiter||'Garçom')}</td><td><strong>${A.brl(Number(h.price||0)*Number(h.qty||0))}</strong></td></tr>`).join(''):'<tr><td colspan="7" class="empty-cell">Nenhum lançamento registrado nesta data.</td></tr>';
}
dateInput.addEventListener('change',render);
render();setInterval(render,1000);
})();
