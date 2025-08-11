// Простейшая баллистика, линия полёта и упрощённая “физика” воды

export function computeThrow(origin, dir, speed, totalSeconds){
  const g = -9.8; // гравитация по Y
  const dt = 1/60;
  const v = { x: dir.x*speed, y: dir.y*speed, z: dir.z*speed };
  const p = { x: origin.x, y: origin.y, z: origin.z };

  const points = [];
  for (let t=0; t<=totalSeconds; t+=dt){
    const x = p.x + v.x * t;
    const y = p.y + v.y * t + 0.5 * g * t * t;
    const z = p.z + v.z * t;

    points.push({ x, y, z });

    if (y <= 0) break; // “земля”
  }
  return points.map(o => new THREE.Vector3(o.x, o.y, o.z)); // THREE — глобальной нет, но setFromPoints примет объекты; либо мы создадим здесь new THREE.Vector3 — перенесём импорт
}

import * as THREE from 'https://unpkg.com/three@0.159.0/build/three.module.js';

export function updateWaterSlosh(bottleGroup, dt){
  // Имитируем качку воды: противоположная фаза относительно вращения бутылки с затуханием
  const water = bottleGroup.getObjectByName('water');
  if (!water) return;

  const tiltX = -bottleGroup.rotation.x * 0.5;
  const tiltZ = -bottleGroup.rotation.z * 0.5;
  // Плавно интерполируем
  water.rotation.x += (tiltX - water.rotation.x) * Math.min(1, dt*6);
  water.rotation.z += (tiltZ - water.rotation.z) * Math.min(1, dt*6);

  // Лёгкое покачивание уровня
  water.scale.y = 0.95 + Math.sin(performance.now()*0.002)*0.02;
}

// Возвращаем результат и сложность
export function randomLandingResult(power, pos){
  // power 0..1: чем ближе к 1, тем больше шанс “bottom”
  const difficulty = estimateDifficulty(pos);
  const baseBottom = 0.35 + 0.5 * power; // 0.35..0.85
  const chanceBottom = clamp01(baseBottom - (difficulty-1)*0.12);

  // Редкий шанс на горлышко, усиливается при очень высокой “зелени”
  const chanceNeck = clamp01(0.02 + (power>0.9 ? 0.05 : 0));
  const roll = Math.random();

  if (roll < chanceNeck * 0.4) return { result:'neck', difficulty, neckBonus: 2.0 };
  if (roll < chanceBottom) return { result:'bottom', difficulty, neckBonus: 1.0 };
  return { result:'fail', difficulty, neckBonus: 1.0 };
}

function estimateDifficulty(pos){
  // Чем дальше по Z и выше Y — тем сложнее
  const dist = Math.sqrt(pos.x*pos.x + pos.z*pos.z);
  if (pos.y > 1.2 || dist > 3.0) return 3;
  if (pos.y > 0.5 || dist > 2.0) return 2;
  return 1;
}

function clamp01(v){ return Math.max(0, Math.min(1, v)); }
