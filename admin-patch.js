(()=>{
  const note=document.querySelector('.security-note');
  if(note){
    const title=note.querySelector('strong');
    const text=note.querySelector('span');
    if(title)title.textContent='Área administrativa protegida.';
    if(text)text.textContent='O acesso exige autenticação e permissão de administrador. O painel do garçom permanece separado e não libera produtos, estoque, caixa, relatórios ou configurações administrativas.';
  }

  document.addEventListener('click',event=>{
    const target=event.target.closest('button');
    const card=event.target.closest('.category-admin-card');
    if(!target||!card)return;
    const category=card.querySelector('strong')?.textContent?.trim();
    if(!category)return;
    if(target.classList.contains('edit')){
      event.preventDefault();event.stopImmediatePropagation();
      window.renameCategory?.(category);
    }
    if(target.classList.contains('minus')){
      event.preventDefault();event.stopImmediatePropagation();
      window.deleteCategory?.(category);
    }
  },true);
})();
