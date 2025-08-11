export class Physics {
  constructor() {
    // Could use Cannon.js, Ammo.js, or simple math
  }
  throw(bottle, hand, chance, targets, callback) {
    // Simulate bottle throw and landing
    const sliderValue = chance * 100;
    let result = 'fail', target = null;
    let rand = Math.random();
    let targetObj = targets[Math.floor(Math.random() * targets.length)];
    if (rand < chance * 0.9 && sliderValue > 30) { result = 'bottom'; target = targetObj; }
    else if (rand > 0.98 && sliderValue > 95) { result = 'neck'; target = targetObj; }
    setTimeout(() => callback(result, target), 1200);
  }
}