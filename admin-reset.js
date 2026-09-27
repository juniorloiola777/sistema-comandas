(()=>{
  const A=window.APP;
  const settingsPanel=document.querySelector('[data-section="configuracoes"] .settings-panel');
  if(!settingsPanel||document.getElementById('resetRecordsBtn'))return;

  const style=document.createElement('style');
  style.textContent=`
    .danger-zone{margin-top:22px;border:1px solid #fecaca;background:#fff7f7;border-radius:18px;padding:20px;display:flex;align-items:center;justify-content:space-between;gap:18px;flex-wrap:wrap}.danger-zone-copy{max-width:720px}.danger-zone .danger-kicker{font-size:11px;font-weight:950;letter-spacing:.08em;color:#b91c1c;text-transform:uppercase;margin-bottom:5px}.danger-zone h3{margin:0 0 6px;color:#7f1d1d;font-size:18px}.danger-zone p{margin:0;color:#7c5151;font-size:13px;line-height:1.55}.danger-button{border:0;border-radius:12px;padding:12px 16px;background:#b91c1c;color:#fff;font-weight:900;cursor:pointer;white-space:nowrap}.danger-button:hover{background:#991b1b}.reset-modal-card{width:min(500px,calc(100vw - 28px));background:#fff;border-radius:22px;padding:24px;box-shadow:0 25px 70px rgba(0,0,0,.28)}.reset-modal-card h3{margin:0 0 8px;color:#7f1d1d;font-size:22px}.reset-modal-card p{color:#667085;font-size:13px;line-height:1.55;margin:0 0 14px}.reset-list{margin:12px 0 18px;padding:14px 16px;background:#fff7f7;border:1px solid #fee2e2;border-radius:13px;color:#7f1d1d;font-size:13px;line-height:1.65}.reset-preserve{margin:0 0 18px;padding:12px 14px;background:#f4f7fb;border-radius:12px;color:#475467;font-size:12px;line-height:1.5}.reset-confirm-label{display:block;font-size:12px;font-weight:900;color:#344054;margin-bottom:7px}.reset-confirm-input{width:100%;border:1px solid #d0d5dd;border-radius:12px;padding:12px 13px;font-weight:800;outline:none}.reset-confirm-input:focus{border-color:#b91c1c;box-shadow:0 0 0 3px rgba(185,28,28,.08)}.reset-actions{display:flex;justify-content:flex-end;gap:9px;margin-top:18px}.reset-actions button{border:0;border-radius:11px;padding:11px 15px;font-weight:900;cursor:pointer}.reset-cancel{background:#eef1f6;color:#344054}.reset-confirm{background:#b91c1c;color:#fff}.reset-confirm:disabled{opacity:.38;cursor:not-allowed}
  `;
  document.head.appendChild(style);

  const zone=document.createElement('div');
  zone.className='danger-zone';
  zone.innerHTML=`<div class="danger-zone-copy"><div class="danger-kicker">Zona de perigo</div><h3>Zerar todos os registros</h3><p>Limpa completamente a movimentação do sistema para começar uma operação nova do zero.</p></div><button id="resetRecordsBtn" class="danger-button" type="button">Zerar registros</button>`;
  settingsPanel.appendChild(zone);

  const overlay=document.createElement('div');
  overlay.id='resetRecordsOverlay';
  overlay.className='overlay hidden';
  overlay.innerHTML=`<div class="reset-modal-card"><h3>Zerar todos os registros?</h3><p>Esta ação é permanente e será sincronizada imediatamente com todos os celulares dos garçons.</p><div class="reset-list"><strong>Será apagado:</strong><br>• todas as mesas e comandas abertas<br>• todos os itens/pedidos lançados<br>• todas as vendas fechadas<br>• caixa, formas de pagamento e histórico de fechamentos do caixa<br>• dados usados nos relatórios de vendas</div><div class="reset-preserve"><strong>Será mantido:</strong> produtos, fotos, preços, estoque atual, categorias, funcionários, logins, senhas e configurações.</div><label class="reset-confirm-label" for="resetConfirmInput">Digite ZERAR para confirmar</label><input id="resetConfirmInput" class="reset-confirm-input" autocomplete="off" placeholder="ZERAR"><div class="reset-actions"><button id="cancelResetRecords" class="reset-cancel" type="button">Cancelar</button><button id="confirmResetRecords" class="reset-confirm" type="button" disabled>Zerar tudo</button></div></div>`;
  document.body.appendChild(overlay);

  const openBtn=document.getElementById('resetRecordsBtn');
  const cancelBtn=document.getElementById('cancelResetRecords');
  const confirmBtn=document.getElementById('confirmResetRecords');
  const input=document.getElementById('resetConfirmInput');

  function closeModal(){overlay.classList.add('hidden');input.value='';confirmBtn.disabled=true;confirmBtn.textContent='Zerar tudo'}
  function openModal(){input.value='';confirmBtn.disabled=true;confirmBtn.textContent='Zerar tudo';overlay.classList.remove('hidden');setTimeout(()=>input.focus(),50)}

  openBtn.onclick=openModal;
  cancelBtn.onclick=closeModal;
  overlay.addEventListener('click',e=>{if(e.target===overlay)closeModal()});
  input.addEventListener('input',()=>{confirmBtn.disabled=input.value.trim().toUpperCase()!=='ZERAR'});

  confirmBtn.onclick=async()=>{
    if(input.value.trim().toUpperCase()!=='ZERAR')return;
    confirmBtn.disabled=true;
    confirmBtn.textContent='Zerando...';
    const ok=await A.commit(s=>{
      s.closedSales=[];
      s.cashClosings=[];
      s.cash={status:'closed',openedAt:null,openingAmount:0,pausedAt:null,lastClosedAt:null};
      s.tabs=[];
      s.tables.forEach(t=>{
        t.client='';
        t.status='free';
        t.opened=0;
        t.total=0;
        t.items=[];
        t.waiter=s.settings?.waiterName||'Garçom';
      });
    },'Todos os registros foram zerados');
    if(ok){
      closeModal();
      A.toast('Sistema zerado • caixa fechado e registros apagados');
    }else{
      confirmBtn.textContent='Zerar tudo';
      confirmBtn.disabled=input.value.trim().toUpperCase()!=='ZERAR';
    }
  };
})();
