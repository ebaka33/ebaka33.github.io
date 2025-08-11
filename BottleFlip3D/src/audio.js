let ctx;
let isOn = true;
let current = 'melody1';
let intervalId = null;

const MELODIES = {
  melody1: [ 440, 494, 523, 587, 523, 494, 440, 392 ],
  melody2: [ 392, 440, 392, 349, 330, 349, 392, 440 ],
  melody3: [ 523, 587, 659, 698, 659, 587, 523, 494 ]
};

export function initAudio(){
  ctx = new (window.AudioContext || window.webkitAudioContext)();
}

export function playDefaultLoop(id='melody1'){
  current = id;
  if (!isOn) return;
  loopMelody(MELODIES[current]);
}

export function toggleAudio(){
  isOn = !isOn;
  if (isOn) {
    playDefaultLoop(current);
  } else {
    stopMelody();
  }
  return isOn;
}

export function setMelody(id){
  current = id;
  if (isOn) {
    stopMelody();
    playDefaultLoop(current);
  }
}

function loopMelody(seq){
  stopMelody();
  let i = 0;
  intervalId = setInterval(()=>{
    beep(seq[i % seq.length], 0.18);
    i++;
  }, 220);
}

function stopMelody(){
  if (intervalId) clearInterval(intervalId);
  intervalId = null;
}

function beep(freq, dur){
  if (!ctx) return;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = 'sine';
  o.frequency.value = freq;
  g.gain.value = 0.04;
  o.connect(g).connect(ctx.destination);
  o.start();
  o.stop(ctx.currentTime + dur);
}
