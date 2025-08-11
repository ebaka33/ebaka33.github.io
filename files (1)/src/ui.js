import { Locations } from './locations.js';
const locations = new Locations();

export class UI {
  constructor() {
    this.coinsEl = document.getElementById('coins');
    this.locationEl = document.getElementById('location-name');
    this.sliderEl = document.getElementById('chance-slider');
    this.chanceColorEl = document.getElementById('chance-color');
    this.shopBtn = document.getElementById('shop-btn');
    this.musicBtn = document.getElementById('music-btn');
    this.shopModal = document.getElementById('shop-modal');
    this.musicModal = document.getElementById('music-modal');
    this.resultModal = document.getElementById('result-modal');
    this.pauseOverlay = null;
    this.sliderEl.addEventListener('input', (e) => {
      if (this.onSliderChange) this.onSliderChange(Number(e.target.value));
    });
    this.shopBtn.addEventListener('click', () => {
      this.shopModal.classList.remove('hidden');
      if (this.onShopOpen) this.onShopOpen();
      this.renderShop();
    });
    this.musicBtn.addEventListener('click', () => {
      this.musicModal.classList.remove('hidden');
      if (this.onMusicOpen) this.onMusicOpen();
      this.renderMusic();
    });
    this.shopModal.addEventListener('click', (e) => {
      if (e.target.classList.contains('modal')) {
        this.shopModal.classList.add('hidden');
        if (this.onShopClose) this.onShopClose();
      }
    });
    this.musicModal.addEventListener('click', (e) => {
      if (e.target.classList.contains('modal')) {
        this.musicModal.classList.add('hidden');
        if (this.onMusicClose) this.onMusicClose();
      }
    });
  }
  setCoins(amount) {
    this.coinsEl.textContent = `Монеты: ${amount}`;
  }
  setLocation(name) {
    this.locationEl.textContent = `Локация: ${name}`;
  }
  setSlider(value) {
    this.sliderEl.value = value;
  }
  setChanceColor(value) {
    let color = `rgb(${255-value*2.4},${value*2.55},70)`;
    this.chanceColorEl.style.background = color;
  }
  showResult(result, reward, target) {
    let txt = "";
    if (result === "bottom") txt = `Успех! Бутылка стоит на дне<br>+${reward} монет<br>(${target})`;
    else if (result === "neck") txt = `Редкий успех! Бутылка стоит на горлышке<br>+${reward} монет<br>(${target})`;
    else txt = "Неудача! Попробуй снова";
    this.resultModal.innerHTML = txt;
    this.resultModal.classList.remove('hidden');
  }
  hideResult() {
    this.resultModal.classList.add('hidden');
  }
  showPause() {
    // Not implemented, could show overlay
  }
  hidePause() {
    // Not implemented, could hide overlay
  }
  onShopOpen(cb) { this.onShopOpen = cb; }
  onShopClose(cb) { this.onShopClose = cb; }
  onMusicOpen(cb) { this.onMusicOpen = cb; }
  onMusicClose(cb) { this.onMusicClose = cb; }
  onBuy(cb) { this.onBuy = cb; }
  onBuyMusic(cb) { this.onBuyMusic = cb; }
  onSelectMusic(cb) { this.onSelectMusic = cb; }
  onThrow(cb) { this.onThrow = cb; }
  onSliderChange(cb) { this.onSliderChange = cb; }
  onLocationChange(cb) { this.onLocationChange = cb; }

  renderShop() {
    // Render shop UI (skins, bracelets, tattoos, locations)
    let html = `
      <h2>Магазин</h2>
      <div>
        <button onclick="document.querySelector('.modal').classList.add('hidden')">Закрыть</button>
      </div>
      <div>
        <h3>Скины бутылки</h3>
        <button onclick="window.buyShopItem({type:'bottle',file:'bottle.glb',cost:100})">Стандарт (100 монет)</button>
        <button onclick="window.buyShopItem({type:'bottle',file:'bottle2.glb',cost:300})">Синий (300 монет)</button>
      </div>
      <div>
        <h3>Браслеты</h3>
        <button onclick="window.buyShopItem({type:'bracelet',file:'bracelet1.png',cost:150})">Красный (150 монет)</button>
        <button onclick="window.buyShopItem({type:'bracelet',file:'bracelet2.png',cost:250})">Зелёный (250 монет)</button>
      </div>
      <div>
        <h3>Татуировки</h3>
        <button onclick="window.buyShopItem({type:'tattoo',file:'tattoo1.png',cost:200})">Дракон (200 монет)</button>
        <button onclick="window.buyShopItem({type:'tattoo',file:'tattoo2.png',cost:400})">Череп (400 монет)</button>
      </div>
      <div>
        <h3>Локации</h3>
        ${locations.getAll().map(loc=>`
          <button onclick="window.buyShopItem({type:'location',file:'${loc.file}',name:'${loc.name}',cost:500})">${loc.name} (500 монет)</button>
        `).join('')}
      </div>
    `;
    this.shopModal.innerHTML = html;
    window.buyShopItem = (item) => {
      if (this.onBuy) this.onBuy(item);
    };
  }
  renderMusic() {
    let html = `
      <h2>Музыка</h2>
      <div>
        <button onclick="document.querySelector('#music-modal').classList.add('hidden')">Закрыть</button>
      </div>
      <div>
        <h3>Треки</h3>
        <button onclick="window.selectMusic('music1.mp3')">Трек 1 (стандарт)</button>
        <button onclick="window.buyMusicTrack('music2.mp3')">Трек 2 (150 монет)</button>
      </div>
    `;
    this.musicModal.innerHTML = html;
    window.buyMusicTrack = (track) => {
      if (this.onBuyMusic) this.onBuyMusic(track);
    };
    window.selectMusic = (track) => {
      if (this.onSelectMusic) this.onSelectMusic(track);
    };
  }
}