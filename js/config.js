// ============================================================
// CONFIG.JS — Biomes, constants, shared state
// ============================================================

const BIOMES = {
  meadow: {
    groundColor: 0x4a7c3f, roadColor: 0x2a2a2a,
    skyTop: new THREE.Color(0x87CEEB), skyHorizon: new THREE.Color(0xc9e8f5),
    fogColor: 0xb5d8f0, treeColor: 0x2d6a4f, trunkColor: 0x6b4226,
    mountainColor: 0x3a6b38, ambientColor: 0xffeedd, sunColor: 0xffffff,
    lineColor: 0xffffff, grassDetail: 0x5a8a4a, cloudColor: 0xffffff,
  },
  autumn: {
    groundColor: 0x8b5e3c, roadColor: 0x2a2a2a,
    skyTop: new THREE.Color(0xe07030), skyHorizon: new THREE.Color(0xf5d0a0),
    fogColor: 0xf0c890, treeColor: 0xcc5500, trunkColor: 0x5c3a1a,
    mountainColor: 0xa0462d, ambientColor: 0xffddaa, sunColor: 0xffcc44,
    lineColor: 0xffeeaa, grassDetail: 0x9a7040, cloudColor: 0xffd0a0,
  },
  snow: {
    groundColor: 0xdce8f5, roadColor: 0x556677,
    skyTop: new THREE.Color(0x7090b0), skyHorizon: new THREE.Color(0xd0d8e8),
    fogColor: 0xd0d8e8, treeColor: 0x2a4a2a, trunkColor: 0x4a3a2a,
    mountainColor: 0xb0c0d0, ambientColor: 0xddeeff, sunColor: 0xeeeeff,
    lineColor: 0xffffff, grassDetail: 0xd8e4f5, cloudColor: 0xeeeeff,
  },
  desert: {
    groundColor: 0xd4a843, roadColor: 0x557755,
    skyTop: new THREE.Color(0x4a90d9), skyHorizon: new THREE.Color(0xffd580),
    fogColor: 0xf5e080, treeColor: 0x6b8e23, trunkColor: 0x8b7355,
    mountainColor: 0xc4872a, ambientColor: 0xffeecc, sunColor: 0xffdd00,
    lineColor: 0xfffaaa, grassDetail: 0xc4a840, cloudColor: 0xfffbe0,
  },
};

const G = {
  // Biome / scene
  biome: 'meadow',
  timeOfDay: 0.35,    // 0=midnight, 0.25=sunrise, 0.5=noon, 0.75=sunset
  weather: 'clear',  // 'clear' | 'rain' | 'snow'
  fogNear: 80,
  fogFar: 260,

  // Car physics
  carSpeed: 0,         // current speed (units/sec)
  maxSpeed: 60,        // max speed units/sec (~120 km/h display)
  acceleration: 18,
  braking: 30,
  lateralOffset: 0,   // offset from road center
  lateralVel: 0,
  steerForce: 18,
  steerFriction: 0.88,

  // Road traversal
  roadT: 0.05,        // 0..1 position along curve
  distance: 0,        // total meters driven

  // Flags
  started: false,
  autodrive: false,

  // Input
  keys: { left: false, right: false, up: false, down: false },
  
  // Timing
  delta: 0,
  clock: null,
};
