import { Utils } from './utils.js';

const LOCATIONS = [
  {
    name: "Двор",
    file: "location1.glb",
    background: "#aee6fa",
    targets: [
      { name: "Столб", position: [0.5,0.5, -2], difficulty: 2 },
      { name: "Стул", position: [-1,0.3, -1.7], difficulty: 1 },
      { name: "Ветка", position: [1.2,1.2, -2.2], difficulty: 4 }
    ]
  },
  {
    name: "Кухня",
    file: "location2.glb",
    background: "#f9e6b2",
    targets: [
      { name: "Стол", position: [0,0.5, -2], difficulty: 1 },
      { name: "Микроволновка", position: [-1.2,1, -1.8], difficulty: 3 },
      { name: "Холодильник", position: [1.5,1, -2.4], difficulty: 2 }
    ]
  }
];

export class Locations {
  constructor() {
    this.locations = LOCATIONS;
  }
  getDefault() { return this.locations[0]; }
  getAll() { return this.locations; }
  async loadLocation(location, THREE) {
    const locationObj = await Utils.loadLocationGLB(THREE, location.file, location.background, location.targets);
    return locationObj;
  }
  unloadLocation(locationObj, scene) {
    scene.remove(locationObj.scene);
  }
}