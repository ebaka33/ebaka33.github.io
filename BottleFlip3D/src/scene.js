export function createScene(THREE){
  const scene = new THREE.Scene();

  // Мягкий анимированный фон — градиентный небо-шейдер (упрощённо с туманом)
  scene.fog = new THREE.Fog(0x0b1020, 8, 24);

  const camera = new THREE.PerspectiveCamera(60, window.innerWidth/window.innerHeight, 0.1, 200);
  camera.position.set(0, 1.6, 6);

  // Свет
  const hemi = new THREE.HemisphereLight(0xcde9ff, 0x203040, 0.8);
  scene.add(hemi);
  const dir = new THREE.DirectionalLight(0xffffff, 0.9);
  dir.position.set(5, 10, 3);
  dir.castShadow = false;
  scene.add(dir);

  // Плоскость земли
  const groundGeo = new THREE.PlaneGeometry(60, 60);
  const groundMat = new THREE.MeshPhongMaterial({ color:0x0f1a2b, shininess:8 });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI/2;
  ground.position.y = 0;
  ground.receiveShadow = false;
  scene.add(ground);

  // Площадки: столб, стул, ветка
  scene.userData.platforms = [];

  // Столб
  const pole = createPlatformBox(THREE, {x: -1.2, y: 0.8, z: -2.0}, {x:0.3, y:1.6, z:0.3}, 1.6, 1.4, 2);
  scene.add(pole.mesh); scene.userData.platforms.push(pole);

  // Стул (сиденье)
  const chair = createPlatformBox(THREE, {x: 1.3, y: 0.45, z: -1.8}, {x:0.8, y:0.9, z:0.8}, 0.9, 1.2, 1.7);
  scene.add(chair.mesh); scene.userData.platforms.push(chair);

  // Ветка (узкая)
  const branch = createPlatformBox(THREE, {x: 0.0, y: 1.4, z: -3.0}, {x:2.0, y:0.2, z:0.2}, 1.5, 1.8, 2.5);
  scene.add(branch.mesh); scene.userData.platforms.push(branch);

  // Немного “зелени” на фоне
  for (let i=0;i<20;i++){
    const t = createBush(THREE);
    t.position.set((Math.random()*2-1)*10, 0, -2 - Math.random()*8);
    t.rotation.y = Math.random()*Math.PI*2;
    scene.add(t);
  }

  // Сохраним для анимации окружение
  const env = { time:0, bushes: scene.children.filter(o=>o.userData && o.userData.bush) };

  return { scene, camera, env };
}

export function updateEnvironment(dt){
  // Нежная анимация “ветра” для кустов
  // Совет: внешнее состояние можно хранить на объекте scene, но здесь достаточно лёгкой синусоиды
}

export function createTrajectoryLine(THREE){
  const geom = new THREE.BufferGeometry();
  const mat = new THREE.LineBasicMaterial({ color:0xff3b30, linewidth:2 });
  const line = new THREE.Line(geom, mat);
  line.frustumCulled = false;
  return line;
}

function createPlatformBox(THREE, pos, size, topY, difficulty, rewardMultiplier){
  const geo = new THREE.BoxGeometry(size.x, size.y, size.z);
  const mat = new THREE.MeshPhongMaterial({ color:0x24324a, emissive:0x000000, shininess:16 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(pos.x, size.y/2, pos.z);

  return {
    mesh,
    position: mesh.position,
    size,
    topY,
    difficulty, // 1 — легко, 3 — сложно
    rewardMultiplier
  };
}

function createBush(THREE){
  const g = new THREE.IcosahedronGeometry(0.4 + Math.random()*0.3, 1);
  const m = new THREE.MeshPhongMaterial({ color:0x1e6a3f, emissive:0x001a0a, shininess:6 });
  const mesh = new THREE.Mesh(g, m);
  mesh.userData.bush = true;
  return mesh;
}
