export function createBottleWithHand(THREE){
  const groupHand = new THREE.Group();
  groupHand.position.set(0, 1.2, 0.8);
  groupHand.rotation.y = Math.PI; // смотрим “вперёд”

  // Рука (упрощённо: предплечье + ладонь)
  const skin = new THREE.MeshPhongMaterial({ color:0xffd2b3, shininess:30 });
  const forearm = new THREE.Mesh(new THREE.CapsuleGeometry(0.16, 0.6, 6, 12), skin);
  forearm.rotation.z = Math.PI/2.2;
  forearm.position.set(0.25, -0.05, 0);
  groupHand.add(forearm);

  const palm = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.12, 0.18), skin);
  palm.position.set(0.1, -0.25, 0);
  groupHand.add(palm);

  // Браслет (можно менять цвет)
  const bracelet = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.025, 12, 24), new THREE.MeshPhongMaterial({ color:0x444444, metalness:0.2, shininess:50 }));
  bracelet.rotation.x = Math.PI/2;
  bracelet.position.set(0.25, -0.02, 0);
  bracelet.name = 'bracelet';
  groupHand.add(bracelet);

  // Тату (плоская плоскость на предплечье)
  const tattoo = new THREE.Mesh(new THREE.PlaneGeometry(0.18, 0.18), new THREE.MeshBasicMaterial({ color:0xffffff, transparent:true, opacity:0.0 }));
  tattoo.rotation.y = Math.PI/2;
  tattoo.position.set(0.35, -0.02, 0.0);
  tattoo.name = 'tattoo';
  groupHand.add(tattoo);

  // Бутылка
  const groupBottle = new THREE.Group();
  groupBottle.position.set(0.1, -0.18, 0);
  groupBottle.name = 'bottleGroup';

  const bottleMat = new THREE.MeshPhysicalMaterial({
    color:0x99ccff,
    transmission:0.95,
    thickness:0.02,
    roughness:0.2,
    metalness:0.0,
    transparent:true,
    opacity:0.9
  });

  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.34, 24, 1, true), bottleMat);
  body.position.y = 0.18;
  groupBottle.add(body);

  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.16, 24, 1, true), bottleMat);
  neck.position.y = 0.42;
  groupBottle.add(neck);

  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.04, 24), new THREE.MeshPhongMaterial({ color:0x2e6ee6 }));
  cap.position.y = 0.52;
  groupBottle.add(cap);

  // Вода внутри (просто внутренний цилиндр, с “качкой”)
  const waterMat = new THREE.MeshPhongMaterial({ color:0x3ba7ff, transparent:true, opacity:0.6 });
  const water = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.28, 24, 1, true), waterMat);
  water.position.y = 0.18;
  water.name = 'water';
  groupBottle.add(water);

  groupHand.add(groupBottle);

  return { bottle: groupBottle, hand: groupHand };
}

export function applyCosmetics({ state, bottleGroup, handGroup, THREE }){
  // Бутылка с окантовкой (меняем цвет крышки)
  const cap = bottleGroup.children.find(o => o.geometry && o.geometry.type === 'CylinderGeometry' && o.material && o.material.color && o.position.y > 0.5);
  if (cap && state.equipped.skin === 'bottleRed') {
    cap.material.color.setHex(0xff4444);
  }

  // Браслет
  const bracelet = handGroup.getObjectByName('bracelet');
  if (bracelet) {
    if (state.equipped.skin === 'braceletGold') bracelet.material.color.setHex(0xD4AF37);
  }

  // Тату
  const tattoo = handGroup.getObjectByName('tattoo');
  if (tattoo) {
    if (state.equipped.tattoo === 'tattooStar') {
      tattoo.material.opacity = 1.0;
      // Если есть файлы в assets/tattoos/star.png — можно загрузить. Иначе оставим белый знак.
      // Простой белый принт тоже работает.
    } else {
      tattoo.material.opacity = 0.0;
    }
  }
}
