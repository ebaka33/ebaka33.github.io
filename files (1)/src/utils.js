export class Utils {
  static async loadThree() {
    // Load Three.js from CDN if not present
    if (window.THREE) return window.THREE;
    await import('https://cdn.jsdelivr.net/npm/three@0.141.0/build/three.module.js');
    return window.THREE;
  }
  static loadBottle(THREE, skin) {
    // For simplicity, create a basic bottle mesh, with water as separate mesh inside
    let bottle = new THREE.Group();
    let mat = new THREE.MeshStandardMaterial({ color: 0xeeeeff, metalness: 0.3, roughness: 0.5 });
    let geom = new THREE.CylinderGeometry(0.12, 0.09, 0.32, 32);
    let mesh = new THREE.Mesh(geom, mat);
    bottle.add(mesh);
    // Water
    let waterMat = new THREE.MeshPhysicalMaterial({ color: 0x55aaff, transparent: true, opacity: 0.7 });
    waterMat.uniforms = { time: { value: 0 }, offset: { value: 0 } };
    let waterGeom = new THREE.CylinderGeometry(0.11, 0.085, 0.22, 32);
    let water = new THREE.Mesh(waterGeom, waterMat);
    water.name = 'Water';
    water.position.y = -0.04;
    bottle.add(water);
    return bottle;
  }
  static async loadHand(THREE, skin, tattoo, bracelet) {
    // For simplicity, hand is a box with a cylinder (wrist)
    let hand = new THREE.Group();
    let mat = new THREE.MeshStandardMaterial({ color: 0xffe2c2 });
    let palm = new THREE.Mesh(new THREE.BoxGeometry(0.22,0.09,0.12), mat);
    palm.position.set(0,0,0);
    hand.add(palm);
    let wrist = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.09, 16), mat);
    wrist.position.set(0,-0.09,0);
    hand.add(wrist);
    // Bracelet
    if (bracelet) {
      let braceletMat = new THREE.MeshStandardMaterial({ color: bracelet.includes('red')?0xff5555:0x55ff55 });
      let braceletMesh = new THREE.Mesh(new THREE.TorusGeometry(0.08,0.013,16,20), braceletMat);
      braceletMesh.position.set(0,-0.09,0);
      hand.add(braceletMesh);
    }
    // Tattoo
    if (tattoo) {
      let tattooMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
      let tattooMesh = new THREE.Mesh(new THREE.BoxGeometry(0.06,0.01,0.06), tattooMat);
      tattooMesh.position.set(0,0.03,0.09);
      hand.add(tattooMesh);
    }
    return hand;
  }
  static async loadLocationGLB(THREE, file, background, targets) {
    // For simplicity, generate scene objects
    let scene = new THREE.Group();
    scene.name = 'LocationScene';
    let bg = new THREE.Mesh(new THREE.PlaneGeometry(10,6), new THREE.MeshBasicMaterial({ color: background, side: THREE.DoubleSide }));
    bg.position.set(0,2,-5.5);
    scene.add(bg);
    for (let t of targets) {
      let mat = new THREE.MeshStandardMaterial({ color: 0x888888 });
      let geom;
      if (t.name.includes('Столб')) geom = new THREE.CylinderGeometry(0.1, 0.12, 0.9, 12);
      else if (t.name.includes('Стул')) geom = new THREE.BoxGeometry(0.45,0.45,0.45);
      else if (t.name.includes('Ветка')) geom = new THREE.CylinderGeometry(0.04,0.04,0.7,8);
      else if (t.name.includes('Стол')) geom = new THREE.BoxGeometry(0.7,0.1,0.7);
      else geom = new THREE.BoxGeometry(0.3,0.5,0.3);
      let mesh = new THREE.Mesh(geom, mat);
      mesh.position.set(...t.position);
      scene.add(mesh);
    }
    return { scene, targets };
  }
}