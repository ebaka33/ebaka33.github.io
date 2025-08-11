const KEY = 'bottle-flip-state-v1';

const defaultState = {
  coins: 0,
  owned: {
    skin: [],
    tattoo: [],
    location: [],
    music: []
  },
  equipped: {
    skin: null,
    tattoo: null
  },
  location: 'default',
  music: { enabled: true, current: 'melody1' }
};

export function loadState(){
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...defaultState };
    const parsed = JSON.parse(raw);
    return { ...defaultState, ...parsed };
  } catch {
    return { ...defaultState };
  }
}

export function saveState(st){
  localStorage.setItem(KEY, JSON.stringify(st));
}

export function awardCoins(st, amount){
  st.coins = Math.max(0, (st.coins||0) + amount);
  saveState(st);
}

export function spendCoins(st, amount){
  if (st.coins < amount) return false;
  st.coins -= amount;
  saveState(st);
  return true;
}

export function onBuyClick(item, state, awardCoinsFn, saveStateFn, applyCosmeticsFn, refs){
  const { type, id, cost } = item;
  if (!spendCoins(state, cost)) {
    alert('Недостаточно монет.');
    return false;
  }
  if (type === 'skin') {
    if (!state.owned.skin.includes(id)) state.owned.skin.push(id);
    state.equipped.skin = id;
  } else if (type === 'tattoo') {
    if (!state.owned.tattoo.includes(id)) state.owned.tattoo.push(id);
    state.equipped.tattoo = id;
  } else if (type === 'location') {
    if (!state.owned.location.includes(id)) state.owned.location.push(id);
    state.location = id;
  } else if (type === 'music') {
    if (!state.owned.music.includes(id)) state.owned.music.push(id);
    state.music.current = id;
  }
  saveStateFn(state);
  applyCosmeticsFn({ state, bottleGroup: refs.bottleGroup, handGroup: refs.handGroup, THREE: null });
  alert('Куплено!');
  return true;
}
