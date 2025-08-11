import { Utils } from './utils.js';

export class Bottle {
  constructor(THREE, skin) {
    this.THREE = THREE;
    this.skin = skin;
    this.mesh = Utils.loadBottle(THREE, skin); // Returns THREE.Group
    this.water = this.mesh.getObjectByName('Water');
    this.shakePhase = 0;
    this.shakePower = 0.01;
  }
  animateShake(sliderValue, dt) {
    // Simulate bottle shaking based on slider value
    this.shakePhase += dt * (sliderValue / 20);
    const shakeY = Math.sin(this.shakePhase) * 0.05 * (sliderValue / 100);
    const shakeX = Math.cos(this.shakePhase * 1.3) * 0.03 * (sliderValue / 100);
    this.mesh.rotation.z = shakeX;
    this.mesh.rotation.y = shakeY;
    if (this.water) {
      this.water.material.uniforms.time.value += dt * (sliderValue / 80);
    }
  }
  animateWater(dt) {
    // Simulate basic water physics inside bottle
    if (!this.water) return;
    const t = this.water.material.uniforms.time.value;
    this.water.material.uniforms.offset.value = Math.sin(t) * 0.05 + Math.random() * 0.02;
  }
}