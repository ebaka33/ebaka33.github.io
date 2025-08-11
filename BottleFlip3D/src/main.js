import * as THREE from 'https://unpkg.com/three@0.159.0/build/three.module.js';
import { OrbitControls } from 'https://unpkg.com/three@0.159.0/examples/jsm/controls/OrbitControls.js';

import { createScene, updateEnvironment, createTrajectoryLine } from './scene.js';
import { createBottleWithHand, applyCosmetics } from './models.js';
import { computeThrow, updateWaterSlosh, randomLandingResult } from './physics.js';
import { initUI, setCoins, getGaugeValue, onThrowClick, onToggleShop, onToggleMusic, onBuyClick, setGaugeThumb } from './ui.js';
import { loadState, saveState, awardCoins } from './store.js';
import { initAudio, playDefaultLoop, toggleAudio, setMelody } from './audio.js';

let renderer, camera, controls, scene;
let bottleGroup, handGroup, trajectoryLine;
let clock;
let state = loadState(); // coins, owned, equipped, location, music
let gaugeDir = 1; // направление бегунка
let gaugePos = 0; // 0..1

const app = document.getElementById('app');

init();

async function init() {
  clock = new THREE.Clock();

  // Рендерер
  renderer = new THREE.WebGLRenderer({ antialias:true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  app.appendChild(renderer.domElement);

  // Сцена и камера
  const { scene:sc, camera:cam, env } = createScene(THREE);
  scene = sc;
  camera = cam;

  // Контролы (для удобства навигации)
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.minDistance = 3;
  controls.maxDistance = 12;
  controls.target.set(0, 1.2, 0);

  // Модели: рука + бутылка
  const { bottle, hand } = createBottleWithHand(THREE);
  bottleGroup = bottle;
  handGroup = hand;
  scene.add(handGroup);
  handGroup.add(bottleGroup);

  // Траектория (красная, обрываемая)
  trajectoryLine = createTrajectoryLine(THREE);
  scene.add(trajectoryLine);

  // UI
  initUI({
    onThrow: handleThrow,
    onToggleShop: () => onToggleShop(),
    onToggleMusic: () => onToggleMusic(toggleAudio),
    onBuy: (item) => {
      const ok = onBuyClick(item, state, awardCoins, saveState, applyCosmetics, { bottleGroup, handGroup });
      if (ok) setCoins(state.coins);
    }
  });
  setCoins(state.coins);

  // Косметика
  applyCosmetics({ state, bottleGroup, handGroup, THREE });

  // Аудио
  initAudio();
  playDefaultLoop(state.music.current);

  window.addEventListener('resize', onResize);

  animate();

  function onResize(){
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  // Клавиша пробел — бросок
  window.addEventListener('keydown', (e)=>{
    if (e.code === 'Space') handleThrow();
  });
}

let isThrowing = false;
let throwTime = 0;

function animate(){
  const dt = clock.getDelta();

  // Двигаем бегунок туда-сюда
  updateGauge(dt);

  // Лёгкое покачивание руки и бутылки, зависящее от скорости бегунка
  const wobble = 0.02 + 0.08 * Math.abs(gaugeDir);
  handGroup.rotation.z = Math.sin(perfNow()*0.0015) * wobble;
  bottleGroup.rotation.y = Math.cos(perfNow()*0.0012) * wobble * 0.3;

  // Простая “физика” воды (слош)
  updateWaterSlosh(bottleGroup, dt);

  // Обновляем окружение (анимированный фон)
  updateEnvironment(dt);

  // Если бутылка летит — проигрываем бросок
  if (isThrowing) {
    throwTime += dt;
    stepThrow(dt);
  } else {
    // Обновляем красную траекторию прицела (обрываем на середине)
    updateTrajectoryPreview();
  }

  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

function perfNow(){ return (performance || Date).now(); }

function updateGauge(dt){
  // скорость туда-сюда
  const speed = 0.6; // сек на проход
  gaugePos += dt / speed * gaugeDir;
  if (gaugePos >= 1) { gaugePos = 1; gaugeDir = -1; }
  if (gaugePos <= 0) { gaugePos = 0; gaugeDir = 1; }
  setGaugeThumb(gaugePos);
}

function updateTrajectoryPreview(){
  const power = gaugePos; // 0..1
  const origin = bottleGroup.getWorldPosition(new THREE.Vector3());
  origin.y += 0.1;
  const dir = new THREE.Vector3(0, 0.25 + power*0.45, -1).normalize();
  const speed = 4 + power*6;

  const points = computeThrow(origin, dir, speed, 1.2); // до 1.2 сек пути
  // Покажем только половину точек
  const half = Math.max(2, Math.floor(points.length/2));
  trajectoryLine.geometry.setFromPoints(points.slice(0, half));
}

let activeThrow = null;

function handleThrow(){
  if (isThrowing) return;
  const power = gaugePos; // зелёный ближе к 1

  // Настройки броска от шкалы
  const origin = bottleGroup.getWorldPosition(new THREE.Vector3());
  origin.y += 0.1;
  const dir = new THREE.Vector3(0, 0.2 + power*0.5, -1).normalize();
  const speed = 5 + power*8;

  // Подготовка состояния броска
  const path = computeThrow(origin, dir, speed, 2.0);
  activeThrow = {
    path,
    t: 0,
    duration: 1.2 + power*0.4,
    landed: false,
    power
  };

  isThrowing = true;
  throwTime = 0;
}

function stepThrow(dt){
  if (!activeThrow) return;

  activeThrow.t += dt;
  const p = Math.min(1, activeThrow.t / activeThrow.duration);
  const idx = Math.floor(p * (activeThrow.path.length-1));
  const pos = activeThrow.path[idx];

  bottleGroup.position.copy(pos);
  bottleGroup.rotation.x += 6 * dt; // немного крутится в полёте
  bottleGroup.rotation.z += 2 * dt;

  // Фиктивные “столкновения”: если достигли земли/площадки — решаем исход
  if (!activeThrow.landed && checkStopCondition(pos)) {
    activeThrow.landed = true;

    // Результат зависит от зелёности: больше power -> больше шанс “на дно”
    const { result, difficulty, neckBonus } = randomLandingResult(activeThrow.power, pos);
    finishThrow(result, difficulty, neckBonus);
  }

  if (p >= 1) {
    isThrowing = false;
    activeThrow = null;
  }
}

function checkStopCondition(pos){
  // В этом прототипе “площадки” — это y<=0 (земля) и несколько платформ из scene.userData.platforms
  if (pos.y <= 0.01) return true;
  if (scene.userData && scene.userData.platforms) {
    for (const pl of scene.userData.platforms) {
      const dx = Math.abs(pos.x - pl.position.x);
      const dz = Math.abs(pos.z - pl.position.z);
      const onTop = (dx < pl.size.x*0.5) && (dz < pl.size.z*0.5) && (Math.abs(pos.y - pl.topY) < 0.1);
      if (onTop) return true;
    }
  }
  return false;
}

function finishThrow(result, difficulty, neckBonus){
  // Встанем на место “contact” и зафиксируем ориентацию
  if (result === 'bottom' || result === 'neck') {
    // ставим бутылку вертикально
    bottleGroup.rotation.set(0, bottleGroup.rotation.y, 0);
  }
  // Награда
  if (result === 'bottom' || result === 'neck') {
    const base = 10;
    const reward = Math.round(base * difficulty * (0.5 + Math.pow(activeThrow.power, 1.5)) * (result==='neck' ? neckBonus : 1));
    awardCoins(state, reward);
    saveState(state);
    setCoins(state.coins);
  }
}

