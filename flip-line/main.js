// ===== Настройки игры =====
const SETTINGS = {
  gravity: -9.82,
  gaugeSpeed: 1.6,         // скорость бегунка (высота/сек)
  gaugeGreenTop: 0.3,      // верх зеленой зоны (доля от высоты)
  gaugeGreenHeight: 0.3,   // высота зеленой зоны (доля)
  baseReward: 5,           // базовые монеты за установку на дно
  neckBonus: 5,            // доп. редкий бонус за установку на горлышко
  hardThrowMultiplier: 2,  // множитель за сложные броски (дальше/меньше поверхность)
  lineSegments: 30,        // сегменты траектории
  lineFraction: 0.5,       // доля видимой траектории (обрыв)
};

let coins = 0;

// ===== Инициализация Three.js =====
const canvas = document.getElementById('three');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setClearColor(0x000000, 1);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 200);
camera.position.set(0, 1.3, 3);

const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enabled = false; // для игры выключено

// Свет
const hemi = new THREE.HemisphereLight(0xbdd6ff, 0x203040, 1.1);
scene.add(hemi);
const dir = new THREE.DirectionalLight(0xffffff, 0.8);
dir.position.set(4, 6, 2);
scene.add(dir);

// Анимированный фон (небо двигается)
const skyTex = new THREE.TextureLoader().load('./assets/textures/sky.jpg');
skyTex.wrapS = skyTex.wrapT = THREE.RepeatWrapping;
skyTex.repeat.set(1.5, 1.0);
const skyGeo = new THREE.SphereGeometry(60, 32, 32);
const skyMat = new THREE.MeshBasicMaterial({ map: skyTex, side: THREE.BackSide });
const sky = new THREE.Mesh(skyGeo, skyMat);
scene.add(sky);

// ===== Физика (cannon.js) =====
const world = new CANNON.World();
world.gravity.set(0, SETTINGS.gravity, 0);
world.broadphase = new CANNON.NaiveBroadphase();
world.solver.iterations = 10;

// Материалы
const matGround = new CANNON.Material('ground');
const matBottle = new CANNON.Material('bottle');

const contact = new CANNON.ContactMaterial(matGround, matBottle, {
  friction: 0.6, restitution: 0.25
});
world.addContactMaterial(contact);

// Пол (плоскость) — невидимая, но на ней можно ставить
const groundBody = new CANNON.Body({ mass: 0, material: matGround });
groundBody.addShape(new CANNON.Plane());
groundBody.quaternion.setFromEuler(-Math.PI/2, 0, 0);
world.addBody(groundBody);

// Визуальная сетка пола для ориентира
const grid = new THREE.GridHelper(40, 40, 0x29425d, 0x1a2b3d);
grid.position.y = 0;
scene.add(grid);

// ===== Рука + бутылка =====
// Рука упрощена: предплечье (цилиндр) + ладонь (бокс). Браслет — тор.
// Тату — текстура на ладонь.
const armGroup = new THREE.Group();
scene.add(armGroup);

// Предплечье
const armMat = new THREE.MeshStandardMaterial({ color: 0xffe0c7, metalness: 0, roughness: 1 });
const forearm = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.15, 0.6, 16), armMat);
forearm.rotation.z = Math.PI / 2;
armGroup.add(forearm);

// Ладонь
const palm = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.04, 0.24), armMat);
palm.position.set(0.32, 0, 0);
armGroup.add(palm);

// Браслет (можно перекрашивать/вкл/выкл)
const braceletMat = new THREE.MeshStandardMaterial({ color: 0x4ab3ff, metalness: 0.3, roughness: 0.4 });
const bracelet = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.02, 12, 32), braceletMat);
bracelet.rotation.y = Math.PI / 2;
bracelet.position.set(-0.08, 0, 0);
armGroup.add(bracelet);

// Тату (плоский “декаль” сверху ладони)
const tattooTex = new THREE.TextureLoader().load('./assets/textures/tattoo1.png');
tattooTex.wrapS = tattooTex.wrapT = THREE.ClampToEdgeWrapping;
const tattoo = new THREE.Mesh(
  new THREE.PlaneGeometry(0.16, 0.16),
  new THREE.MeshBasicMaterial({ map: tattooTex, transparent: true })
);
tattoo.position.set(0.32, 0.022, 0);
tattoo.rotation.x = -Math.PI/2;
armGroup.add(tattoo);

// Бутылка (две геометрии: пластиковая оболочка + вода)
const bottleGroup = new THREE.Group();
armGroup.add(bottleGroup);

const bottleMat = new THREE.MeshPhysicalMaterial({
  color: 0xffffff,
  metalness: 0,
  roughness: 0.2,
  transparent: true,
  opacity: 0.45,
  transmission: 0.75,
  thickness: 0.03
});
const bottleBodyGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.28, 20);
const bottleNeckGeo = new THREE.CylinderGeometry(0.025, 0.035, 0.06, 16);
const bottleMain = new THREE.Mesh(bottleBodyGeo, bottleMat);
const bottleNeck = new THREE.Mesh(bottleNeckGeo, bottleMat);
bottleNeck.position.y = 0.17;
bottleGroup.add(bottleMain, bottleNeck);

// Вода внутри — простая: внутренний цилиндр + “плоское” волнение по синусоиде
const waterTex = new THREE.TextureLoader().load('./assets/textures/water.png');
const waterMat = new THREE.MeshPhongMaterial({
  color: 0x66aadd,
  map: waterTex,
  transparent: true,
  opacity: 0.7
});
const water = new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.068, 0.18, 18, 1, true), waterMat);
water.position.y = -0.04;
bottleGroup.add(water);

// Положение руки и бутылки перед камерой
armGroup.position.set(-0.4, 1.05, 0.3);
armGroup.rotation.set(0, Math.PI*0.05, -Math.PI*0.08);
bottleGroup.position.set(0.42, 0, 0);
bottleGroup.rotation.z = Math.PI * 0.03;

// ===== Цели (задний план) =====
const targets = [];
function addTarget(type, position) {
  let mesh, body, topY;
  if (type === 'pole') {
    mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.9, 16), new THREE.MeshStandardMaterial({ color: 0x8b9bb2 }));
    topY = 0.45;
  } else if (type === 'chair') {
    const mat = new THREE.MeshStandardMaterial({ color: 0x6f5b3e });
    mesh = new THREE.Group();
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.05, 0.4), mat); seat.position.y = 0.35; mesh.add(seat);
    const legs = [ [-0.18,0.2,-0.18], [0.18,0.2,-0.18], [-0.18,0.2,0.18], [0.18,0.2,0.18] ];
    legs.forEach(p=>{ const l = new THREE.Mesh(new THREE.CylinderGeometry(0.03,0.03,0.4,8), mat); l.position.set(p[0],0.2,p[2]); mesh.add(l); });
    topY = 0.38;
  } else if (type === 'branch') {
    mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.05,0.05,1.2,12), new THREE.MeshStandardMaterial({ color: 0x4a6a3a }));
    mesh.rotation.z = Math.PI/2;
    topY = 0.8; // ветка выше
  }
  mesh.position.copy(position);
  scene.add(mesh);

  // Физическое “место” (простая статическая платформа)
  const shape = new CANNON.Box(new CANNON.Vec3(0.25, 0.02, 0.25));
  body = new CANNON.Body({ mass: 0, material: matGround });
  body.addShape(shape);
  body.position.set(position.x, position.y + topY, position.z);
  world.addBody(body);

  targets.push({ type, mesh, body });
}

// Добавим несколько мест
addTarget('pole',   new THREE.Vector3(0.4, 0, -1.8));
addTarget('chair',  new THREE.Vector3(-0.8, 0, -2.2));
addTarget('branch', new THREE.Vector3(0.9, 0.8, -2.6));

// ===== Красная линия траектории (обрывается на середине) =====
const trajGeo = new THREE.BufferGeometry();
const trajMat = new THREE.LineBasicMaterial({ color: 0xff3a36 });
const trajLine = new THREE.Line(trajGeo, trajMat);
scene.add(trajLine);

// ===== Игровые состояния =====
let isAiming = true;     // целимся, рука держит бутылку
let isFlying = false;    // бутылка летит (физика)
let bottleBody = null;   // физическое тело бутылки (когда отпущена)
let lastThrowDifficulty = 1;

// ===== Шкала с ползунком =====
const gaugeEl = document.getElementById('gauge');
const sliderEl = document.getElementById('slider');
const coinCountEl = document.getElementById('coinCount');

let gaugeT = 0;          // 0..1 — позиция ползунка
let gaugeDir = 1;        // направление
function updateGauge(dt) {
  gaugeT += SETTINGS.gaugeSpeed * dt * gaugeDir;
  if (gaugeT > 1) { gaugeT = 1; gaugeDir = -1; }
  if (gaugeT < 0) { gaugeT = 0; gaugeDir = 1; }
  const h = gaugeEl.clientHeight || 260;
  const y = (1 - gaugeT) * (h - 6);
  sliderEl.style.top = `${y}px`;
}

// Вероятностная логика “зеленее — легче поставить”
function getThrowQuality() {
  // Зеленая зона:
  const gTop = SETTINGS.gaugeGreenTop;           // 0.3 (от верха)
  const gH = SETTINGS.gaugeGreenHeight;          // 0.3
  const gBottom = gTop + gH;
  const inGreen = (gaugeT >= gTop && gaugeT <= gBottom);
  // Чем ближе к середине зеленой зоны — тем лучше
  const center = gTop + gH/2;
  const dist = Math.abs(gaugeT - center) / (gH/2);
  const greenScore = inGreen ? (1 - dist) : 0;
  return greenScore; // 0..1
}

// ===== Музыка =====
const audio = new Audio();
audio.loop = true;
let musicOn = true;
const tracks = [
  { id: 'track1', name: 'Мелодия 1 (старт)', url: './assets/audio/track1.mp3', owned: true, price: 0 },
  { id: 'track2', name: 'Мелодия 2', url: './assets/audio/track2.mp3', owned: false, price: 30 },
  { id: 'track3', name: 'Мелодия 3', url: './assets/audio/track3.mp3', owned: false, price: 50 },
];

const musicSelect = document.getElementById('musicSelect');
function refreshMusicSelect() {
  musicSelect.innerHTML = '';
  tracks.forEach(t => {
    const opt = document.createElement('option');
    opt.value = t.id; opt.textContent = `${t.name}${t.owned ? '' : ' (купить в магазине)'}`;
    musicSelect.appendChild(opt);
  });
  musicSelect.value = tracks.find(t=>t.owned)?.id || 'track1';
}
refreshMusicSelect();

function playSelectedTrack() {
  const t = tracks.find(x => x.id === musicSelect.value && x.owned) || tracks.find(x=>x.owned);
  if (!t) return;
  audio.src = t.url;
  if (musicOn) audio.play().catch(()=>{});
}
playSelectedTrack();

document.getElementById('musicToggle').onclick = () => {
  musicOn = !musicOn;
  document.getElementById('musicToggle').textContent = `Музыка: ${musicOn ? 'вкл' : 'выкл'}`;
  if (musicOn) playSelectedTrack(); else audio.pause();
};
musicSelect.onchange = () => playSelectedTrack();

// ===== Магазин =====
const shopEl = document.getElementById('shop');
document.getElementById('btnShop').onclick = () => { shopEl.classList.remove('hidden'); };
document.getElementById('closeShop').onclick = () => { shopEl.classList.add('hidden'); };

const shopBottleEl = document.getElementById('shopBottle');
const shopCosmeticsEl = document.getElementById('shopCosmetics');
const shopLocationsEl = document.getElementById('shopLocations');
const shopMusicEl = document.getElementById('shopMusic');

// Товары
const items = {
  bottleSkins: [
    { id: 'skin_blue', name: 'Синий пластик', price: 20, apply: ()=> bottleMat.color.set(0xaad3ff) },
    { id: 'skin_green', name: 'Зеленый пластик', price: 20, apply: ()=> bottleMat.color.set(0xa7ffcd) },
    { id: 'skin_tex', name: 'Текстура бутылки', price: 25, apply: ()=> {
      const tex = new THREE.TextureLoader().load('./assets/textures/bottle_skin1.png');
      bottleMat.map = tex; bottleMat.needsUpdate = true;
    }},
  ],
  cosmetics: [
    { id: 'bracelet_red', name: 'Браслет красный', price: 15, apply: ()=> braceletMat.color.set(0xff5a65) },
    { id: 'bracelet_gold', name: 'Браслет золото', price: 30, apply: ()=> { braceletMat.color.set(0xffd166); braceletMat.metalness=0.9; braceletMat.roughness=0.2; } },
    { id: 'tattoo_off', name: 'Без тату', price: 5, apply: ()=> tattoo.visible = false },
    { id: 'tattoo_on', name: 'Тату', price: 5, apply: ()=> tattoo.visible = true },
  ],
  locations: [
    { id: 'loc_city', name: 'Городской двор', price: 40, apply: ()=> { skyTex.offset.x = 0; skyMat.color.set(0xffffff); } },
    { id: 'loc_sunset', name: 'Закат', price: 40, apply: ()=> { skyMat.color.set(0xffb080); } },
    { id: 'loc_night', name: 'Ночь', price: 40, apply: ()=> { skyMat.color.set(0x99bbff); } },
  ]
};

// Музыка как товары
function renderShopSection(container, list, ownedSet, onBuyOrUse) {
  container.innerHTML = '';
  list.forEach(item => {
    const div = document.createElement('div');
    div.className = 'shop-item';
    const owned = ownedSet.has(item.id);
    div.innerHTML = `
      <div><strong>${item.name}</strong></div>
      <div>Цена: ${item.price ?? 0} мон.</div>
      <div>
        <button>${owned ? 'Применить' : 'Купить'}</button>
      </div>
    `;
    const btn = div.querySelector('button');
    btn.onclick = () => onBuyOrUse(item, owned);
    container.appendChild(div);
  });
}

const owned = {
  bottle: new Set(), cosmetics: new Set(), locations: new Set(), music: new Set(tracks.filter(t=>t.owned).map(t=>t.id))
};

function refreshShop() {
  renderShopSection(shopBottleEl, items.bottleSkins, owned.bottle, (it, isOwned)=>{
    if (!isOwned) {
      if (coins < it.price) return;
      coins -= it.price; owned.bottle.add(it.id); updateCoins();
    }
    it.apply();
  });
  renderShopSection(shopCosmeticsEl, items.cosmetics, owned.cosmetics, (it, isOwned)=>{
    if (!isOwned) { if (coins < it.price) return; coins -= it.price; owned.cosmetics.add(it.id); updateCoins(); }
    it.apply();
  });
  renderShopSection(shopLocationsEl, items.locations, owned.locations, (it, isOwned)=>{
    if (!isOwned) { if (coins < it.price) return; coins -= it.price; owned.locations.add(it.id); updateCoins(); }
    it.apply();
  });
  // Музыка
  shopMusicEl.innerHTML = '';
  tracks.forEach(t=>{
    const div = document.createElement('div'); div.className='shop-item';
    const isOwned = t.owned;
    div.innerHTML = `
      <div><strong>${t.name}</strong></div>
      <div>Цена: ${t.price} мон.</div>
      <div><button>${isOwned ? 'Выбрать' : 'Купить'}</button></div>
    `;
    div.querySelector('button').onclick = ()=>{
      if (!t.owned) {
        if (coins < t.price) return;
        coins -= t.price; t.owned = true; owned.music.add(t.id); updateCoins(); refreshMusicSelect();
      }
      musicSelect.value = t.id; playSelectedTrack();
    };
    shopMusicEl.appendChild(div);
  });
}
refreshShop();

function updateCoins() { coinCountEl.textContent = String(coins); }

// ===== Подготовка броска =====
let aimYaw = 0;   // поворот влево/вправо
let aimPitch = -0.1; // наклон вверх/вниз

window.addEventListener('mousemove', (e)=>{
  const nx = (e.clientX / window.innerWidth) * 2 - 1;
  const ny = (e.clientY / window.innerHeight) * 2 - 1;
  aimYaw = nx * 0.6;
  aimPitch = -0.05 - ny * 0.3;
});

// Слегка покачиваем руку и бутылку, а вода “отстаёт”
function updateHandAndWater(t) {
  // Покачивание связано с бегунком: чем быстрее меняет направление — тем сильнее дрожь
  const sway = Math.sin(t*3) * 0.02 + (Math.random()*0.004-0.002);
  bottleGroup.rotation.z = Math.PI * 0.03 + sway;
  // Вода: простая “инерция” — немного наклоняется противоположно
  water.rotation.z += ( -bottleGroup.rotation.z*0.4 - water.rotation.z ) * 0.08;
  // Лёгкая волна
  water.material.opacity = 0.65 + Math.sin(t*5)*0.05;
}

// Красная линия траектории
function updateTrajectory() {
  const start = new THREE.Vector3();
  bottleGroup.getWorldPosition(start);
  start.y += 0.06;

  // Качество броска влияет на силу и спин
  const q = getThrowQuality();
  const baseSpeed = 4.2 + q*1.6;
  // Направление из aimYaw/aimPitch
  const dir = new THREE.Vector3(0,0,-1).applyAxisAngle(new THREE.Vector3(0,1,0), aimYaw).applyAxisAngle(new THREE.Vector3(1,0,0), aimPitch).normalize();

  const totalSeg = SETTINGS.lineSegments;
  const showUntil = Math.floor(totalSeg * SETTINGS.lineFraction);
  const positions = new Float32Array(showUntil * 3);
  for (let i=0;i<showUntil;i++){
    const t = i * 0.07;
    const x = start.x + dir.x * baseSpeed * t;
    const z = start.z + dir.z * baseSpeed * t;
    const y = start.y + dir.y * baseSpeed * t + 0.5 * (SETTINGS.gravity) * t*t * 0.2; // немного сглаженная гравитация
    positions[i*3+0] = x;
    positions[i*3+1] = y;
    positions[i*3+2] = z;
  }
  trajGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  trajGeo.computeBoundingSphere();
}

// Бросок
function throwBottle() {
  if (!isAiming) return;
  isAiming = false; isFlying = true;
  trajLine.visible = false;

  // Создаем физическое тело бутылки (цилиндр)
  const shape = new CANNON.Cylinder(0.07, 0.07, 0.28, 12);
  const body = new CANNON.Body({ mass: 0.5, material: matBottle });
  body.addShape(shape);
  const start = new THREE.Vector3(); bottleGroup.getWorldPosition(start); start.y += 0.06;
  body.position.set(start.x, start.y, start.z);

  // Направление и сила зависят от шкалы
  const q = getThrowQuality();
  const dir3 = new THREE.Vector3(0,0,-1)
    .applyAxisAngle(new THREE.Vector3(0,1,0), aimYaw)
    .applyAxisAngle(new THREE.Vector3(1,0,0), aimPitch)
    .normalize();
  const speed = 4.2 + q*1.6;
  body.velocity.set(dir3.x*speed, dir3.y*speed + 1.5*q, dir3.z*speed);

  // Небольшой спин: хороший (зелёный) бросок даёт шанс “поставить на дно”
  body.angularVelocity.set(
    (Math.random()*0.4-0.2) * (1-q*0.5),
    (Math.random()*0.6-0.3) * (1-q*0.5),
    (Math.random()*2.2-1.1) * (0.5 + (1-q))   // хуже качество — больше кувырок
  );

  world.addBody(body);
  bottleBody = body;

  // Прячем удерживаемую модель, делаем “летящую” модель
  bottleGroup.visible = false;

  // Создаём летящую визуальную бутылку
  const flyGroup = bottleGroup.clone();
  scene.add(flyGroup);
  bottleGroup._fly = flyGroup;

  // Сложность броска (для награды): дальность и малая площадь целей
  lastThrowDifficulty = 1 + Math.max(0, Math.abs(dir3.z)*1.2 + Math.abs(dir3.x)*0.5);
}

// Проверка “поставил на дно” или “на горлышко”
function evaluateLanding() {
  if (!bottleBody) return;
  const v = bottleBody.velocity.length();
  const w = bottleBody.angularVelocity.length();
  // Считаем, что “остановилась”
  if (v < 0.05 && w < 0.2) {
    // Посмотрим направление “вверх” бутылки
    const up = new CANNON.Vec3(0,1,0);
    const quat = bottleBody.quaternion;
    // Вектор оси бутылки (в мире)
    const axis = new CANNON.Vec3(0,1,0);
    quat.vmult(axis, axis);
    const dot = axis.dot(up); // 1 — вверх (дно вниз), -1 — вниз (горлышко вниз)
    let reward = 0;
    let success = false;
    let neck = false;
    if (dot > 0.9) { // почти вертикально
      reward = SETTINGS.baseReward;
      success = true;
    } else if (dot < -0.9) { // вверх ногами — редкость
      reward = SETTINGS.baseReward + SETTINGS.neckBonus;
      success = true; neck = true;
    }
    if (success) {
      // Множитель за сложность
      const bonus = Math.round(reward * (1 + (lastThrowDifficulty-1)*SETTINGS.hardThrowMultiplier));
      coins += bonus;
      updateCoins();
      // Снова целимся для следующего броска
      resetToAim();
      showToast(`Поставлено ${neck ? 'на горлышко' : 'на дно'}! +${bonus} монет`);
    } else {
      // Не получилось — просто вернуть управление
      resetToAim();
    }
  }
}

function resetToAim() {
  // Удаляем летящую модель
  if (bottleGroup._fly) { scene.remove(bottleGroup._fly); bottleGroup._fly = null; }
  // Удаляем физику
  if (bottleBody) { world.remove(bottleBody); bottleBody = null; }
  // Показываем удерживаемую
  bottleGroup.visible = true;
  isAiming = true; isFlying = false;
  trajLine.visible = true;
}

// Простое уведомление
let toastTimer = null;
function showToast(text) {
  const hint = document.getElementById('hint');
  const old = hint.textContent;
  hint.textContent = text;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=> hint.textContent = old, 1800);
}

// События ввода
window.addEventListener('keydown', (e)=>{
  if (e.code === 'Space') { e.preventDefault(); throwBottle(); }
});
window.addEventListener('mousedown', ()=> throwBottle());

// ===== Главный цикл =====
let last = performance.now();
function tick(now) {
  const dt = Math.min(0.033, (now - last) / 1000); last = now;

  // Аним. фон
  skyTex.offset.x += dt * 0.01;

  if (isAiming) {
    updateGauge(dt);
    updateHandAndWater(now/1000);
    updateTrajectory();
  }

  // Шаг физики
  world.step(1/60, dt);

  // Синхронизация летящей бутылки с физикой
  if (isFlying && bottleBody && bottleGroup._fly) {
    const g = bottleGroup._fly;
    g.position.set(bottleBody.position.x, bottleBody.position.y, bottleBody.position.z);
    g.quaternion.set(bottleBody.quaternion.x, bottleBody.quaternion.y, bottleBody.quaternion.z, bottleBody.quaternion.w);
    evaluateLanding();
  }

  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);

// Адаптация под размер окна
window.addEventListener('resize', ()=>{
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix();
});
