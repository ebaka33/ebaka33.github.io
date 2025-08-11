import { Bottle } from './bottle.js';
import { Physics } from './physics.js';
import { Locations } from './locations.js';
import { Player } from './player.js';
import { Utils } from './utils.js';

export class Game {
  constructor(canvas, ui, audio) {
    this.canvas = canvas;
    this.ui = ui;
    this.audio = audio;
    this.physics = new Physics();
    this.locations = new Locations();
    this.player = new Player();
    this.running = false;
    this.paused = false;
    this.bottle = null;
    this.handModel = null;
    this.currentLocation = this.locations.getDefault();
    this.init3D();
    this.lastUpdate = performance.now();
    this.coinReward = 0;
    this.lineColor = 0xff0000;
    this.sliderValue = 50;
    this.throwInProgress = false;
    this.animate = this.animate.bind(this);
    this.ui.setCoins(this.player.coins);
    this.ui.setLocation(this.currentLocation.name);
    this.ui.setSlider(this.sliderValue);
  }
  async init3D() {
    const THREE = await Utils.loadThree();
    this.THREE = THREE;
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setClearColor(0x181818);
    this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
    this.camera.position.set(0, 1.5, 4);
    this.scene = new THREE.Scene();
    this.scene.background = null;
    await this.loadLocation(this.currentLocation);
    await this.loadHandAndBottle();
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }
  async loadLocation(loc) {
    const locationObj = await this.locations.loadLocation(loc, this.THREE);
    this.scene.add(locationObj.scene);
    this.currentLocationObj = locationObj;
  }
  async loadHandAndBottle() {
    if (this.handModel) this.scene.remove(this.handModel);
    if (this.bottle) this.scene.remove(this.bottle.mesh);
    this.handModel = await Utils.loadHand(this.THREE, this.player.handSkin, this.player.tattoo, this.player.bracelet);
    this.scene.add(this.handModel);
    this.bottle = new Bottle(this.THREE, this.player.bottleSkin);
    this.handModel.add(this.bottle.mesh);
    this.bottle.mesh.position.set(0, -0.22, 0.15);
  }
  start() {
    this.running = true;
    this.lastUpdate = performance.now();
    requestAnimationFrame(this.animate);
    this.audio.playCurrentTrack();
  }
  pause() {
    this.paused = true;
    this.audio.pause();
    this.ui.showPause();
  }
  resume() {
    this.paused = false;
    this.audio.playCurrentTrack();
    this.ui.hidePause();
    this.lastUpdate = performance.now();
    requestAnimationFrame(this.animate);
  }
  animate() {
    if (!this.running || this.paused) return;
    const now = performance.now();
    const dt = Math.min((now - this.lastUpdate) / 1000, 0.05);
    this.lastUpdate = now;
    this.bottle.animateShake(this.sliderValue, dt);
    this.bottle.animateWater(dt);
    this.renderLine();
    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(this.animate);
  }
  renderLine() {
    if (this.line) this.scene.remove(this.line);
    const dir = new this.THREE.Vector3(0, 0.7 + (this.sliderValue - 50) * 0.01, -1.2);
    dir.applyQuaternion(this.handModel.quaternion);
    const points = [];
    points.push(new this.THREE.Vector3(0, -0.15, 0.25));
    points.push(new this.THREE.Vector3(0, -0.15, 0.25).add(dir.multiplyScalar(1.4)));
    const geometry = new this.THREE.BufferGeometry().setFromPoints(points);
    const material = new this.THREE.LineBasicMaterial({ color: this.lineColor, linewidth: 3 });
    this.line = new this.THREE.Line(geometry, material);
    this.handModel.add(this.line);
  }
  throwBottle() {
    if (this.throwInProgress) return;
    this.throwInProgress = true;
    const successChance = this.sliderValue / 100;
    this.physics.throw(this.bottle, this.handModel, successChance, this.currentLocationObj.targets, (result, target) => {
      this.throwInProgress = false;
      let reward = 0;
      if (result === 'bottom') reward = 10 + target.difficulty * 5;
      else if (result === 'neck') reward = 100 + target.difficulty * 20;
      else reward = 0;
      this.player.coins += reward;
      this.ui.setCoins(this.player.coins);
      this.ui.showResult(result, reward, target ? target.name : null);
      setTimeout(() => {
        this.loadHandAndBottle();
        this.ui.hideResult();
      }, 2000);
    });
  }
  setChance(value) {
    this.sliderValue = value;
    this.ui.setSlider(value);
    this.ui.setChanceColor(value);
  }
  buyItem(item) {
    const cost = item.cost;
    if (this.player.coins >= cost) {
      this.player.coins -= cost;
      this.player.buyItem(item);
      this.ui.setCoins(this.player.coins);
      this.loadHandAndBottle();
    }
  }
  changeLocation(loc) {
    this.locations.unloadLocation(this.currentLocationObj, this.scene);
    this.currentLocation = loc;
    this.ui.setLocation(loc.name);
    this.loadLocation(loc);
    this.loadHandAndBottle();
  }
}