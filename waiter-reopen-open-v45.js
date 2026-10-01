(()=>{
const A=window.APP;
if(!A||document.body.dataset.page!=='waiter'||window.__waiterReopenOpenV45)return;
window.__waiterReopenOpenV45=true;
let pending=null,observer=null,timer=null;
function cardRef(card){const txt=card?.querySelector('.table-no')?.textContent||'';let m=txt.match(/^Mesa\s+(\d+)/i);if(m)return{type:'mesa',id:Number(m[1])};m=txt.match(/^Comanda\s*#?(\d+)/i);return m?{type:'comanda',id:Number(m[1])}:null}
function stop(){if(observer){observer.disconnect();observer=null}if(timer){clearTimeout(timer);timer=null}pending=null}
function tryOpen(){if(!pending)return false;const grid=document.getElementById('tableGrid');if(!grid)return false;for(const card of grid.querySelectorAll('.table-card')){const r=cardRef(card);if(!r||r.type!==pending.type||r.id!==pending.id)continue;if(card.classList.contains('free'))continue;stop();requestAnimationFrame(()=>card.click());return true}return false}
function watch(ref){stop();pending=ref;const grid=document.getElementById('tableGrid');if(!grid)return;observer=new MutationObserver(()=>tryOpen());observer.observe(grid,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});timer=setTimeout(stop,12000)}
document.addEventListener('click',e=>{const b=e.target.closest?.('.waiter-reopen[data-r]');if(!b)return;const card=b.closest('.waiter-adjust-card');const title=card?.querySelector('.waiter-adjust-head strong')?.textContent||'';let m=title.match(/^Mesa\s+(\d+)/i);if(m)return watch({type:'mesa',id:Number(m[1])});m=title.match(/^Comanda\s*#?(\d+)/i);if(m)watch({type:'comanda',id:Number(m[1])})},true);
})();
