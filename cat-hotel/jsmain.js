import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';
import { OrbitControls } from 'https://unpkg.com/three@0.160.0/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'https://unpkg.com/three@0.160.0/examples/jsm/loaders/GLTFLoader.js';
import { Sky } from 'https://unpkg.com/three@0.160.0/examples/jsm/objects/Sky.js';

import { CAT_MODELS, STAFF_MODELS, FURNITURE_MODELS, DECOR_MODELS, HOTEL_LOBBY_MODEL } from './models.js';
import { initialGameState, computeRoomPrice, tickEconomy, updateHUD, buildUpgradeRows, showDialog, hideDialog, tryAddFloor, tryAddRoom, tryUpgradeFurniture, tryHire, applyMarketing, Balance } from './gameplay.js';
import { saveState, loadState, resetState, formatMoney, toast, clamp } from './utils.js';

/** Глобалы игры */
const canvas = document.getElementById('game');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;

const scene = new THREE.Scene();
scene.background = new THREE.Color('#0a0c10');

const camera = new THREE.PerspectiveCamera(60, innerWidth/innerHeight, 0.1, 1000);
camera.position.set(12, 12, 24);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 2.4, 0);
controls.enableDamping = true;

window.addEventListener('resize', () => {
  camera.aspect = innerWidth/innerHeight; camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

// Живое небо
const sky = new Sky();
sky.scale.setScalar(450000);
scene.add(sky);
const sun = new THREE.Vector3();
const effectController = { turbidity: 10, rayleigh: 2, mieCoefficient: 0.005, mieDirectionalG: 0.8, elevation: 2, azimuth: 180, exposure: renderer.toneMappingExposure };
function updateSky(time=0) {
  const t = (time*0.00005) % 1;
  const elevation = 2 + Math.sin(t*Math.PI*2)*6;
  effectController.elevation = elevation;
  const uniforms = sky.material.uniforms;
  uniforms['turbidity'].value = effectController.turbidity;
  uniforms['rayleigh'].value = effectController.rayleigh;
  uniforms['mieCoefficient'].value = effectController.mieCoefficient;
  uniforms['mieDirectionalG'].value = effectController.mieDirectionalG;
  const phi = THREE.MathUtils.degToRad(90 - effectController.elevation);
  const theta = THREE.MathUtils.degToRad(effectController.azimuth);
  sun.setFromSphericalCoords(1, phi, theta);
  uniforms['sunPosition'].value.copy(sun);
}

// Свет
const hemi = new THREE.HemisphereLight(0xffffff, 0x445566, 0.8);
scene.add(hemi);
const dir = new THREE.DirectionalLight(0xffffff, 1.1);
dir.position.set(20, 30, 10);
dir.castShadow = true;
scene.add(dir);

// Пол
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(100, 100),
  new THREE.MeshStandardMaterial({ color: '#1a1d23', roughness: 0.9, metalness: 0.0 })
);
ground.rotation.x = -Math.PI/2;
ground.receiveShadow = true;
scene.add(ground);

// Отель: параметры
const HOTEL = {
  floors: [], // массив этажей (группа)
  roomsPerFloor: 3,
  roomSize: { w: 4, h: 3, d: 6 },
  floorHeight: 3.2,
  corridorWidth: 2.4,
  origin: new THREE.Vector3(0, 0, 0),
};

// Лоадеры и ассеты
const loader = new GLTFLoader();
const mixers = new Set();

async function loadGLTF(url) {
  return new Promise((resolve, reject) => {
    loader.load(url, gltf => resolve(gltf), undefined, err => reject(err));
  });
}

// Фолбэк-модель котика (стилизованный lowpoly)
function createPrimitiveCat(color = 0xffb703) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(0.7, 0.5, 1.1),
    new THREE.MeshStandardMaterial({ color, roughness: 0.8 })
  );
  body.position.y = 0.3;
  const head = new THREE.Mesh(
    new THREE.BoxGeometry(0.45, 0.45, 0.45),
    new THREE.MeshStandardMaterial({ color })
  );
  head.position.set(0, 0.75, 0.35);
  const earGeom = new THREE.ConeGeometry(0.12, 0.18, 4);
  const earMat = new THREE.MeshStandardMaterial({ color: 0xffd166 });
  const ear1 = new THREE.Mesh(earGeom, earMat); ear1.position.set(-0.15, 1.0, 0.35); ear1.rotation.z = Math.PI;
  const ear2 = ear1.clone(); ear2.position.x *= -1;
  const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.7, 6), new THREE.MeshStandardMaterial({ color }));
  tail.position.set(0, 0.6, -0.5); tail.rotation.x = Math.PI/3;
  [body, head, ear1, ear2, tail].forEach(m=>{ m.castShadow = true; m.receiveShadow=true; });
  g.add(body, head, ear1, ear2, tail);
  g.userData.type='cat';
  return g;
}

// Пул моделей
const AssetPool = {
  cats: [],
  staff: { receptionist: [], cleaner: [], bellhop: [] },
  furniture: {},
  decor: [],
  async init() {
    // загрузка котов
    for (const url of CAT_MODELS) {
      try {
        const gltf = await loadGLTF(url);
        gltf.scene.traverse(o=> { o.castShadow = true; o.receiveShadow = true; });
        AssetPool.cats.push(gltf);
      } catch (e) { console.warn('Cat model failed', e); }
    }
    // персонал
    for (const role of Object.keys(STAFF_MODELS)) {
      for (const url of STAFF_MODELS[role]) {
        try {
          const gltf = await loadGLTF(url);
          gltf.scene.traverse(o=> { o.castShadow = true; o.receiveShadow = true; });
          AssetPool.staff[role].push(gltf);
        } catch(e){ console.warn(role, 'model failed', e); }
      }
    }
    // мебель
    for (const lvl of Object.keys(FURNITURE_MODELS)) {
      AssetPool.furniture[lvl] = [];
      for (const url of FURNITURE_MODELS[lvl]) {
        try {
          const gltf = await loadGLTF(url);
          gltf.scene.traverse(o=> { o.castShadow = true; o.receiveShadow = true; });
          AssetPool.furniture[lvl].push(gltf);
        } catch(e){ console.warn('furniture failed', e); }
      }
    }
    // декор
    for (const url of DECOR_MODELS) {
      try {
        const gltf = await loadGLTF(url);
        gltf.scene.traverse(o=> { o.castShadow = true; o.receiveShadow = true; });
        AssetPool.decor.push(gltf);
      } catch(e){ console.warn('decor failed', e); }
    }
  },
  spawnCat() {
    // если есть gltf — клонируем; иначе — примитив
    if (AssetPool.cats.length) {
      const src = AssetPool.cats[Math.floor(Math.random()*AssetPool.cats.length)];
      const clone = src.scene.clone(true);
      const mixer = new THREE.AnimationMixer(clone);
      if (src.animations && src.animations.length) {
        const clip = src.animations.find(a=>/walk|idle/i.test(a.name)) || src.animations[0];
        mixer.clipAction(clip).play();
        mixers.add(mixer);
        clone.userData.mixer = mixer;
      }
      return clone;
    }
    return createPrimitiveCat();
  }
};

// Геометрия отеля
function buildHotelFloors(state) {
  // очистить старые этажи
  HOTEL.floors.forEach(f=> scene.remove(f));
  HOTEL.floors.length = 0;

  const { roomSize, corridorWidth, floorHeight } = HOTEL;
  for (let f=0; f<state.floors; f++) {
    const group = new THREE.Group();
    group.position.y = f * floorHeight;

    // платформы пола/коридора
    const floorMesh = new THREE.Mesh(
      new THREE.BoxGeometry(HOTEL.roomsPerFloor * (roomSize.w+0.5) + corridorWidth, 0.2, roomSize.d + 2),
      new THREE.MeshStandardMaterial({ color: '#1f232b', roughness: 0.95 })
    );
    floorMesh.position.set( (HOTEL.roomsPerFloor-1)*(roomSize.w+0.5)/2, 0, 0 );
    floorMesh.receiveShadow = true;
    group.add(floorMesh);

    // комнаты
    for (let i=0; i<state.roomsPerFloor; i++) {
      const room = new THREE.Mesh(
        new THREE.BoxGeometry(roomSize.w, roomSize.h, roomSize.d),
        new THREE.MeshStandardMaterial({ color: '#2a303a', roughness: 0.9, metalness: 0.05 })
      );
      room.position.set(i*(roomSize.w+0.5), roomSize.h/2, 0);
      room.castShadow = true; room.receiveShadow = true;
      group.add(room);

      // дверь отметить рамкой
      const door = new THREE.Mesh(
        new THREE.BoxGeometry(0.1, 2.2, 1.0),
        new THREE.MeshStandardMaterial({ color: '#ffc857', emissive: '#332b00', emissiveIntensity: 0.2 })
      );
      door.position.set(room.position.x - roomSize.w/2 + 0.05, 1.2, room.position.z + roomSize.d/2 - 0.5);
      group.add(door);
    }

    HOTEL.floors.push(group);
    scene.add(group);
  }

  // Ресепшен (на земле, перед первым этажом)
  if (HOTEL.reception) scene.remove(HOTEL.reception);
  const desk = new THREE.Mesh(
    new THREE.BoxGeometry(4, 1.2, 1),
    new THREE.MeshStandardMaterial({ color: '#3a3f4b' })
  );
  desk.position.set(-3, 0.6, 5);
  desk.castShadow = true;
  const sign = new THREE.Mesh(
    new THREE.BoxGeometry(3.6, 0.4, 0.2),
    new THREE.MeshStandardMaterial({ color: '#ffb703', emissive: '#4b3a0a', emissiveIntensity: 0.4 })
  );
  sign.position.set(-3, 1.5, 5.5);
  const rec = new THREE.Group();
  rec.add(desk, sign);
  HOTEL.reception = rec;
  scene.add(rec);

  // Лифт — простая колонна
  if (HOTEL.elevator) scene.remove(HOTEL.elevator);
  const elev = new THREE.Mesh(
    new THREE.BoxGeometry(1.6, state.floors * floorHeight + 1, 1.6),
    new THREE.MeshStandardMaterial({ color: '#2f3541', metalness: 0.3, roughness: 0.5 })
  );
  elev.position.set(-0.5, (state.floors * floorHeight)/2, -3.5);
  elev.receiveShadow = true; elev.castShadow = true;
  HOTEL.elevator = elev;
  scene.add(elev);
}

// Позиции маршрутов
function waypoint(name, state) {
  switch(name) {
    case 'entrance': return new THREE.Vector3(8, 0, 8);
    case 'reception': return new THREE.Vector3(-3, 0, 4.2);
    case 'elevator': return HOTEL.elevator.position.clone().add(new THREE.Vector3(0.8, -HOTEL.elevator.geometry.parameters.height/2 + 0.8, 1.2));
    case 'corridor': return new THREE.Vector3( (HOTEL.roomsPerFloor-1)*(HOTEL.roomSize.w+0.5)/2, 0, 0 );
    default:
      // номер: {floor, index}
      const { floor, index } = name;
      const y = (floor-1) * HOTEL.floorHeight;
      const x = index*(HOTEL.roomSize.w+0.5);
      const z = HOTEL.roomSize.d/2 + 0.2;
      return new THREE.Vector3(x, y, z);
  }
}

// Сущности
const Entities = {
  guests: [],
  staff: [],
};

function lerpVec(a, b, t) {
  return new THREE.Vector3(
    THREE.MathUtils.lerp(a.x, b.x, t),
    THREE.MathUtils.lerp(a.y, b.y, t),
    THREE.MathUtils.lerp(a.z, b.z, t),
  );
}

function moveTowards(obj, target, speed, dt) {
  const pos = obj.position.clone();
  const dir = target.clone().sub(pos);
  const dist = dir.length();
  if (dist < 0.05) return true;
  dir.normalize();
  obj.position.addScaledVector(dir, speed*dt);
  obj.lookAt(target.x, obj.position.y, target.z);
  return false;
}

function spawnGuest(state) {
  if (state.guests >= state.capacity) return false;

  const model = AssetPool.spawnCat();
  const guest = new THREE.Group();
  guest.add(model);
  guest.position.copy(waypoint('entrance', state));
  scene.add(guest);

  const vip = Math.random() < (Balance.vipChanceBase + state.reputation*0.001);
  guest.userData = {
    type: 'guest',
    state: 'toReception',
    vip,
    target: waypoint('reception', state),
    speed: vip ? 1.6 : 1.2,
    room: null,
    stayTimer: 10 + Math.random()*10, // секунд
    mixer: model.userData?.mixer
  };
  Entities.guests.push(guest);
  state.guests++;
  return true;
}

function freeRoom(state) {
  const available = state.rooms.find(r=>!r.occupied);
  return available || null;
}

function assignRoom(state, guest) {
  const room = freeRoom(state);
  if (!room) return false;
  room.occupied = true;
  guest.userData.room = room;
  guest.userData.state = 'toElevator';
  guest.userData.target = waypoint('elevator', state);
  return true;
}

function updateGuest(g, dt, state) {
  const ud = g.userData;
  if (ud.mixer) ud.mixer.update(dt);

  switch (ud.state) {
    case 'toReception':
      if (moveTowards(g, ud.target, ud.speed, dt)) {
        // оплатить
        const price = computeRoomPrice(state) * (ud.vip ? Balance.vipMultiplier : 1);
        state.money += price;
        state.reputation += Balance.reputationPerGuest * (ud.vip?2:1);
        // назначить комнату
        if (!assignRoom(state, g)) {
          // нет комнат — ожидает
          ud.state = 'waiting';
          ud.waitTimer = 8;
        }
      }
      break;
    case 'waiting':
      ud.waitTimer -= dt;
      if (ud.waitTimer <= 0) {
        if (!assignRoom(state, g)) {
          // уходит
          ud.state = 'leaving';
          ud.target = waypoint('entrance', state);
        }
      }
      break;
    case 'toElevator':
      if (moveTowards(g, ud.target, ud.speed, dt)) {
        // “телепорт” на этаж
        const r = ud.room;
        g.position.y = (r.floor-1)*HOTEL.floorHeight;
        ud.state = 'toRoom';
        ud.target = waypoint({ floor: r.floor, index: r.index }, state);
      }
      break;
    case 'toRoom':
      if (moveTowards(g, ud.target, ud.speed, dt)) {
        ud.state = 'staying';
      }
      break;
    case 'staying':
      ud.stayTimer -= dt;
      if (ud.stayTimer <= 0) {
        ud.state = 'leaving';
        ud.target = waypoint('entrance', state);
        // освободить комнату
        if (ud.room) ud.room.occupied = false;
      }
      break;
    case 'leaving':
      if (moveTowards(g, ud.target, ud.speed, dt)) {
        scene.remove(g);
        Entities.guests = Entities.guests.filter(x=>x!==g);
        state.guests = Math.max(0, state.guests-1);
      }
      break;
  }
}

// Персонал (AI упрощён)
function spawnStaff(role) {
  const g = new THREE.Group();
  const model = AssetPool.spawnCat(); // подмените на AssetPool.staff[role] при наличии моделей персонала
  g.add(model);
  g.position.copy(waypoint('reception'));
  g.userData = { type:'staff', role, state:'idle', speed:1.4, mixer: model.userData?.mixer, timer: Math.random()*5 };
  scene.add(g);
  Entities.staff.push(g);
}

function updateStaff(s, dt, state) {
  const ud = s.userData;
  if (ud.mixer) ud.mixer.update(dt);
  ud.timer -= dt;
  if (ud.timer <= 0) {
    ud.timer = 4 + Math.random()*4;
    if (ud.state === 'idle') {
      // пройтись по коридору и вернуться
      ud.state = 'patrol';
      ud.path = [ waypoint('corridor', state), waypoint('reception', state) ];
      ud.target = ud.path.shift();
    } else {
      ud.state = 'idle';
    }
  }
  if (ud.state === 'patrol' && ud.target) {
    if (moveTowards(s, ud.target, ud.speed, dt)) {
      if (ud.path.length) ud.target = ud.path.shift();
      else ud.state = 'idle';
    }
  }
}

// UI handlers
const state = loadState() || initialGameState();
state.capacity = state.capacity || (state.floors * state.roomsPerFloor);

document.getElementById('btnAddFloor').onclick = () => {
  const res = tryAddFloor(state);
  if (!res.ok) toast(res.reason, '#ef476f'); else { buildHotelFloors(state); toast('Новый этаж!', '#80ed99'); }
  buildUpgradeRows(state, handlers);
};
document.getElementById('btnAddRoom').onclick = () => {
  const res = tryAddRoom(state);
  if (!res.ok) toast(res.reason, '#ef476f'); else { buildHotelFloors(state); toast('Построен новый номер', '#80ed99'); }
  buildUpgradeRows(state, handlers);
};
document.getElementById('btnUpgradeFurn').onclick = () => {
  const res = tryUpgradeFurniture(state);
  if (!res.ok) toast(res.reason, '#ef476f'); else toast('Мебель улучшена!', '#80ed99');
  buildUpgradeRows(state, handlers);
};
document.getElementById('btnHireStaff').onclick = () => {
  // мини-меню найма
  showDialog('Кого нанять? Админ ускоряет заселение, горничная держит номера в порядке, носильщик ускоряет перемещения.', [
    { title: `Администратор (${formatMoney(Balance.hireCost.receptionist)})`, onClick: ()=>{
      const r = tryHire(state, 'receptionist'); if (!r.ok) return toast(r.reason, '#ef476f');
      spawnStaff('receptionist'); toast('Нанят администратор', '#80ed99'); buildUpgradeRows(state, handlers);
    }},
    { title: `Горничная (${formatMoney(Balance.hireCost.cleaner)})`, onClick: ()=>{
      const r = tryHire(state, 'cleaner'); if (!r.ok) return toast(r.reason, '#ef476f');
      spawnStaff('cleaner'); toast('Нанята горничная', '#80ed99'); buildUpgradeRows(state, handlers);
    }},
    { title: `Носильщик (${formatMoney(Balance.hireCost.bellhop)})`, onClick: ()=>{
      const r = tryHire(state, 'bellhop'); if (!r.ok) return toast(r.reason, '#ef476f');
      spawnStaff('bellhop'); toast('Нанят носильщик', '#80ed99'); buildUpgradeRows(state, handlers);
    }},
  ]);
};
document.getElementById('btnMarketing').onclick = () => {
  const r = applyMarketing(state);
  if (!r.ok) toast(r.reason, '#ef476f'); else toast('Маркетинг запущен!', '#ffd166');
  buildUpgradeRows(state, handlers);
};
document.getElementById('btnSave').onclick = () => { saveState(state); toast('Сохранено', '#90be6d'); };
document.getElementById('btnReset').onclick = () => { resetState(); location.reload(); };

const handlers = {
  onAddFloor: () => document.getElementById('btnAddFloor').onclick(),
  onAddRoom: () => document.getElementById('btnAddRoom').onclick(),
  onUpgradeFurn: () => document.getElementById('btnUpgradeFurn').onclick(),
  onHire: () => document.getElementById('btnHireStaff').onclick(),
  onMarketing: () => document.getElementById('btnMarketing').onclick(),
};

// Инициализация
await AssetPool.init();
buildHotelFloors(state);
buildUpgradeRows(state, handlers);

// Сюжетный стартовый диалог
if (!loadState()) {
  showDialog(
    'Племяш, это твой шанс. Я — дядя Барсик, передаю тебе отель. Старинная мебель, добрый дух, но нужна новая жизнь! Сможешь принять первых гостей сегодня?',
    [
      { title: 'Да, дядя Барсик!', onClick: ()=> toast('Дядя улыбается усами.', '#ffd166') },
      { title: 'Я немного волнуюсь…', onClick: ()=> toast('Волнение — признак заботы. Всё получится.', '#ffd166') }
    ]
  );
}

// Спавн гостей
let spawnTimer = 0;

// Главный цикл
let last = performance.now();
function animate(now) {
  const dt = (now - last) / 1000;
  last = now;

  updateSky(now);

  // экономика
  tickEconomy(state, dt);

  // гости
  spawnTimer += dt*1000;
  if (spawnTimer >= state.spawnIntervalMs) {
    spawnTimer = 0;
    spawnGuest(state);
  }
  for (const g of [...Entities.guests]) updateGuest(g, dt, state);

  // персонал
  for (const s of Entities.staff) updateStaff(s, dt, state);

  // UI
  updateHUD(state);

  controls.update();
  for (const m of mixers) m.update(dt);
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
requestAnimationFrame(animate);

// Доп: периодические события
setInterval(()=> {
  // раз в 45–70 сек — событие
  if (Math.random() < 0.35) {
    import('./gameplay.js').then(m=> m.randomEvent(state));
  }
}, 60000);
