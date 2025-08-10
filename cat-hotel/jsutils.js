export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

export function formatMoney(n) {
  if (n >= 1e9) return (n/1e9).toFixed(2)+'B';
  if (n >= 1e6) return (n/1e6).toFixed(2)+'M';
  if (n >= 1e3) return (n/1e3).toFixed(2)+'K';
  return Math.floor(n).toString();
}

// Тайпрайтер для диалогов
export async function typeText(el, text, speed = 20) {
  el.textContent = '';
  for (let i = 0; i < text.length; i++) {
    el.textContent += text[i];
    await new Promise(r => setTimeout(r, speed));
  }
}

// Простая система тостов
export function toast(msg, color = null) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.style.borderColor = color || 'rgba(255,255,255,0.15)';
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 2000);
}

// Локальное сохранение
const SAVE_KEY = 'cat_hotel_save_v1';
export function saveState(state) {
  localStorage.setItem(SAVE_KEY, JSON.stringify(state));
}
export function loadState() {
  try {
    const s = localStorage.getItem(SAVE_KEY);
    return s ? JSON.parse(s) : null;
  } catch { return null; }
}
export function resetState() {
  localStorage.removeItem(SAVE_KEY);
}
