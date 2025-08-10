import { formatMoney, clamp, toast } from './utils.js';
import { FURNITURE_MODELS } from './models.js';

// Баланс и экономика
export const Balance = {
  baseRoomPrice: 25,
  furnitureMultipliers: { 1:1.0, 2:1.2, 3:1.5, 4:2.0, 5:2.6 },
  floorCostBase: 500, // стоимость открытия следующего этажа = base * pow
  floorCostPow: 2.15,
  roomCostBase: 100,
  roomCostPow: 1.45,
  furnitureUpgradeCostBase: 150,
  furnitureUpgradePow: 2.2,
  hireCost: { receptionist: 120, cleaner: 150, bellhop: 180 },
  marketingCostBase: 200,
  marketingPow: 1.8,
  guestSpawnBaseMs: 6000,
  guestSpawnMinMs: 1800,
  reputationPerGuest: 0.3,
  vipChanceBase: 0.02,
  vipMultiplier: 3.5
};

export function initialGameState() {
  return {
    day: 1,
    money: 250,
    reputation: 0,
    floors: 1,
    roomsPerFloor: 3,
    rooms: [{ floor: 1, index: 0, level: 1, occupied: false }],
    furnitureLevel: 1,
    staff: { receptionist: 0, cleaner: 0, bellhop: 0 },
    marketingLevel: 0,
    capacity: 3,
    guests: 0,
    spawnIntervalMs: Balance.guestSpawnBaseMs,
  };
}

export function computeRoomPrice(state) {
  const mult = Balance.furnitureMultipliers[state.furnitureLevel] || 1;
  return Balance.baseRoomPrice * mult * (1 + state.reputation * 0.03);
}

export function computeCapacity(state) {
  return state.floors * state.roomsPerFloor;
}

export function floorCost(nextFloor) {
  return Math.floor(Balance.floorCostBase * Math.pow(Balance.floorCostPow, nextFloor-1));
}
export function roomCost(roomCount) {
  return Math.floor(Balance.roomCostBase * Math.pow(Balance.roomCostPow, roomCount));
}
export function furnitureUpgradeCost(level) {
  return Math.floor(Balance.furnitureUpgradeCostBase * Math.pow(Balance.furnitureUpgradePow, level-1));
}
export function marketingCost(level) {
  return Math.floor(Balance.marketingCostBase * Math.pow(Balance.marketingPow, level));
}

export function applyMarketing(state) {
  const cost = marketingCost(state.marketingLevel);
  if (state.money < cost) return { ok:false, reason:'Недостаточно монет' };
  state.money -= cost;
  state.marketingLevel++;
  // ускоряем спавн гостей
  const factor = Math.max(0.75, 1 - state.marketingLevel*0.12);
  state.spawnIntervalMs = clamp(Balance.guestSpawnBaseMs * factor, Balance.guestSpawnMinMs, Balance.guestSpawnBaseMs);
  return { ok:true };
}

export function tryAddFloor(state) {
  const cost = floorCost(state.floors+1);
  if (state.money < cost) return { ok:false, reason:'Недостаточно монет' };
  state.money -= cost;
  state.floors++;
  // добавим базовые комнаты этого этажа
  for (let i=0;i<state.roomsPerFloor;i++) {
    state.rooms.push({ floor: state.floors, index: i, level: state.furnitureLevel, occupied:false });
  }
  state.capacity = computeCapacity(state);
  return { ok:true };
}

export function tryAddRoom(state) {
  const cost = roomCost(state.rooms.length);
  if (state.money < cost) return { ok:false, reason:'Недостаточно монет' };
  // добавляем комнату на существующем последнем этаже
  const index = state.rooms.filter(r=>r.floor===state.floors).length;
  state.money -= cost;
  state.rooms.push({ floor: state.floors, index, level: state.furnitureLevel, occupied:false });
  state.capacity = computeCapacity(state);
  return { ok:true };
}

export function tryUpgradeFurniture(state) {
  if (state.furnitureLevel >= 5) return { ok:false, reason:'Макс. уровень' };
  const cost = furnitureUpgradeCost(state.furnitureLevel+1);
  if (state.money < cost) return { ok:false, reason:'Недостаточно монет' };
  state.money -= cost;
  state.furnitureLevel++;
  // обновим уровень мебели во всех комнатах
  state.rooms.forEach(r=> r.level = state.furnitureLevel);
  return { ok:true };
}

export function tryHire(state, role) {
  const cost = Balance.hireCost[role];
  if (state.money < cost) return { ok:false, reason:'Недостаточно монет' };
  state.money -= cost;
  state.staff[role]++;
  return { ok:true };
}

export function tickEconomy(state, dtSec) {
  // Пассивный доход от заселенных (имитация мини-таймера пребывания)
  const roomPrice = computeRoomPrice(state);
  const earnPerSec = (state.guests * roomPrice) / 60; // 1 мин = 1 оплата
  state.money += earnPerSec * dtSec;
}

export function updateHUD(state) {
  document.getElementById('money').textContent = formatMoney(state.money);
  document.getElementById('reputation').textContent = Math.floor(state.reputation);
  document.getElementById('guests').textContent = state.guests;
  document.getElementById('capacity').textContent = state.capacity;
  document.getElementById('floors').textContent = state.floors;
  document.getElementById('furnLevel').textContent = state.furnitureLevel;
}

export function buildUpgradeRows(state, handlers) {
  const el = document.getElementById('upgrades');
  el.innerHTML = '';
  const rows = [
    {
      title: 'Открыть этаж',
      desc: `Увеличивает вместимость. Стоимость: ${formatMoney(floorCost(state.floors+1))}`,
      action: handlers.onAddFloor
    },
    {
      title: 'Построить номер',
      desc: `Расширяет склад номеров. Стоимость: ${formatMoney(roomCost(state.rooms.length))}`,
      action: handlers.onAddRoom
    },
    {
      title: 'Улучшить мебель',
      desc: state.furnitureLevel < 5
        ? `До ур. ${state.furnitureLevel+1}. Стоимость: ${formatMoney(furnitureUpgradeCost(state.furnitureLevel+1))}`
        : 'Макс. уровень мебели достигнут',
      action: handlers.onUpgradeFurn
    },
    {
      title: 'Нанять персонал',
      desc: `Админ: ${formatMoney(Balance.hireCost.receptionist)}, Горничная: ${formatMoney(Balance.hireCost.cleaner)}, Носильщик: ${formatMoney(Balance.hireCost.bellhop)}`,
      action: handlers.onHire
    },
    {
      title: 'Маркетинг',
      desc: `Приток гостей быстрее. Стоимость: ${formatMoney(marketingCost(state.marketingLevel))}`,
      action: handlers.onMarketing
    }
  ];
  for (const r of rows) {
    const row = document.createElement('div'); row.className='row';
    const left = document.createElement('div');
    left.innerHTML = `<div><b>${r.title}</b></div><div class="meta">${r.desc}</div>`;
    const btn = document.createElement('button'); btn.textContent = 'Купить';
    btn.onclick = r.action;
    row.append(left, btn);
    el.appendChild(row);
  }
  updateHUD(state);
}

export function showDialog(text, actions = []) {
  const dialog = document.getElementById('dialog');
  const textEl = document.getElementById('dialogText');
  const actEl = document.getElementById('dialogActions');
  dialog.classList.remove('hidden');
  textEl.textContent = '';
  actEl.innerHTML = '';
  // типизация
  let i=0; const tmr = setInterval(()=> {
    textEl.textContent = text.slice(0, i++);
    if (i > text.length) clearInterval(tmr);
  }, 15);
  for (const a of actions) {
    const b = document.createElement('button');
    b.textContent = a.title;
    b.onclick = () => { a.onClick?.(); hideDialog(); };
    actEl.appendChild(b);
  }
}
export function hideDialog() {
  document.getElementById('dialog').classList.add('hidden');
}

// События/ивенты
export function randomEvent(state) {
  const r = Math.random();
  if (r < 0.15) {
    // VIP волна
    toast('VIP-выходные: +доход', '#ffd166');
    state.reputation += 3;
  } else if (r < 0.25) {
    toast('Проверка сервиса: следите за чистотой!', '#90e0ef');
  }
}
