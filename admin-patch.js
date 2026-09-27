(()=>{
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
