const coinsEl = document.getElementById('coins');
const shopEl = document.getElementById('shop');
const thumb = document.getElementById('gauge-thumb');
const btnThrow = document.getElementById('btn-throw');
const btnShop = document.getElementById('btn-shop');
const btnMusic = document.getElementById('btn-music');

let gaugeValue = 0;

export function initUI({ onThrow, onToggleShop, onToggleMusic, onBuy }){
  btnThrow.addEventListener('click', onThrow);
  btnShop.addEventListener('click', ()=>{
    onToggleShop();
    shopEl.classList.toggle('open');
  });
  btnMusic.addEventListener('click', ()=>{
    const on = onToggleMusic();
    btnMusic.textContent = 'Музыка: ' + (on ? 'Вкл' : 'Выкл');
  });

  shopEl.addEventListener('click', (e)=>{
    const btn = e.target.closest('.buy');
    if (!btn) return;
    const item = {
      type: btn.dataset.type,
      id: btn.dataset.id,
      cost: parseInt(btn.dataset.cost, 10)
    };
    onBuy(item);
  });
}

export function setCoins(value){
  coinsEl.textContent = value;
}

export function getGaugeValue(){
  return gaugeValue;
}

export function setGaugeThumb(v){
  gaugeValue = v;
  const bar = thumb.parentElement.getBoundingClientRect();
  const x = (bar.width - 6) * v; // 6 — ширина ползунка
  thumb.style.transform = `translateX(${x}px)`;
}
