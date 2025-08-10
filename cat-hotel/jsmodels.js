// URL внешних моделей. Замените на свои GLTF/GLB (CORS-включен).
// Идеально: кошки с анимациями (walk/idle), мебель по уровням.

export const CAT_MODELS = [
  // Пример: временная зверушка, замените на реальную модель кота
  // 'https://threejs.org/examples/models/gltf/Fox/glTF/Fox.gltf',
];

export const STAFF_MODELS = {
  receptionist: [
    // 'https://your-cdn.com/models/cat_receptionist.glb'
  ],
  cleaner: [
    // 'https://your-cdn.com/models/cat_cleaner.glb'
  ],
  bellhop: [
    // 'https://your-cdn.com/models/cat_bellhop.glb'
  ]
};

export const FURNITURE_MODELS = {
  // уровни мебели: от старого к новомодному
  1: [
    // 'https://your-cdn.com/models/furniture/bed_old.glb',
    // 'https://your-cdn.com/models/furniture/table_old.glb',
  ],
  2: [
    // 'https://your-cdn.com/models/furniture/bed_basic.glb',
  ],
  3: [
    // 'https://your-cdn.com/models/furniture/bed_modern.glb',
  ],
  4: [
    // 'https://your-cdn.com/models/furniture/bed_premium.glb',
  ],
  5: [
    // 'https://your-cdn.com/models/furniture/bed_lux.glb',
  ]
};

export const DECOR_MODELS = [
  // 'https://your-cdn.com/models/plant.glb',
  // 'https://your-cdn.com/models/sofa.glb'
];

export const HOTEL_LOBBY_MODEL = null; // например: 'https://your-cdn.com/models/reception_desk.glb'
