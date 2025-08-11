import { Game } from './src/game.js';
import { UI } from './src/ui.js';
import { AudioManager } from './src/audio.js';

window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game-canvas');
  const ui = new UI();
  const audio = new AudioManager();
  const game = new Game(canvas, ui, audio);

  // UI callbacks
  ui.onShopOpen(() => game.pause());
  ui.onShopClose(() => game.resume());
  ui.onMusicOpen(() => game.pause());
  ui.onMusicClose(() => game.resume());
  ui.onBuy((item) => game.buyItem(item));
  ui.onBuyMusic((track) => audio.buyTrack(track));
  ui.onSelectMusic((track) => audio.selectTrack(track));
  ui.onThrow(() => game.throwBottle());
  ui.onSliderChange((value) => game.setChance(value));
  ui.onLocationChange((loc) => game.changeLocation(loc));

  // Start Game
  game.start();
});