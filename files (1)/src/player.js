export class Player {
  constructor() {
    this.coins = 0;
    this.bottleSkin = "bottle.glb";
    this.handSkin = "hand.glb";
    this.tattoo = null;
    this.bracelet = null;
    this.ownedItems = [];
  }
  buyItem(item) {
    if (item.type === 'bottle') this.bottleSkin = item.file;
    if (item.type === 'bracelet') this.bracelet = item.file;
    if (item.type === 'tattoo') this.tattoo = item.file;
    if (item.type === 'location') this.location = item;
    this.ownedItems.push(item);
  }
}