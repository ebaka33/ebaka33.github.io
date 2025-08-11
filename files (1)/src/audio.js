export class AudioManager {
  constructor() {
    this.tracks = [
      { file: 'music1.mp3', owned: true },
      { file: 'music2.mp3', owned: false }
    ];
    this.currentTrack = this.tracks[0];
    this.audio = new Audio(`/assets/${this.currentTrack.file}`);
    this.audio.loop = true;
  }
  playCurrentTrack() {
    this.audio.src = `/assets/${this.currentTrack.file}`;
    this.audio.play();
  }
  pause() {
    this.audio.pause();
  }
  buyTrack(trackFile) {
    let track = this.tracks.find(t => t.file === trackFile);
    if (track) track.owned = true;
  }
  selectTrack(trackFile) {
    let track = this.tracks.find(t => t.file === trackFile);
    if (track && track.owned) {
      this.currentTrack = track;
      this.playCurrentTrack();
    }
  }
}