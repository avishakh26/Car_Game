// ============================================================
// SCENE.JS — Three.js renderer, scene, camera, lighting, sky
// ============================================================

// --- Renderer & Scene ---
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('canvas'), antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 2000);
camera.position.set(0, 4, 10);

window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
});

// --- Lighting ---
const ambientLight = new THREE.AmbientLight(0xffeedd, 0.5);
scene.add(ambientLight);

const sunLight = new THREE.DirectionalLight(0xffffff, 1.5);
sunLight.castShadow = true;
sunLight.shadow.mapSize.set(2048, 2048);
sunLight.shadow.camera.near = 0.5;
sunLight.shadow.camera.far = 400;
sunLight.shadow.camera.left = -120;
sunLight.shadow.camera.right = 120;
sunLight.shadow.camera.top = 120;
sunLight.shadow.camera.bottom = -120;
sunLight.shadow.bias = -0.0005;
scene.add(sunLight);

const hemiLight = new THREE.HemisphereLight(0x87CEEB, 0x4a7c59, 0.4);
scene.add(hemiLight);

// --- Sky Mesh ---
const skyGeo = new THREE.SphereGeometry(800, 32, 16);
const skyMat = new THREE.ShaderMaterial({
  side: THREE.BackSide,
  uniforms: {
    topColor:    { value: new THREE.Color(0x87CEEB) },
    horizonColor:{ value: new THREE.Color(0xc8e8f5) },
    bottomColor: { value: new THREE.Color(0x4a7c3f) },
    offset:      { value: 0.2 },
    exponent:    { value: 0.6 },
  },
  vertexShader: `
    varying vec3 vWorldPos;
    void main() {
      vec4 wp = modelMatrix * vec4(position, 1.0);
      vWorldPos = wp.xyz;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform vec3 topColor;
    uniform vec3 horizonColor;
    uniform vec3 bottomColor;
    uniform float offset;
    uniform float exponent;
    varying vec3 vWorldPos;
    void main() {
      float h = normalize(vWorldPos).y + offset;
      float t = max(pow(max(h, 0.0), exponent), 0.0);
      vec3 col = mix(horizonColor, topColor, t);
      if (h < 0.0) col = mix(bottomColor, horizonColor, clamp(h + 1.0, 0.0, 1.0));
      gl_FragColor = vec4(col, 1.0);
    }
  `,
});
const skyMesh = new THREE.Mesh(skyGeo, skyMat);
scene.add(skyMesh);

// --- Stars ---
const starCount = 1500;
const starPos = new Float32Array(starCount * 3);
for (let i = 0; i < starCount; i++) {
  const phi = Math.random() * Math.PI;
  const theta = Math.random() * Math.PI * 2;
  const r = 750;
  starPos[i*3]   = r * Math.sin(phi) * Math.cos(theta);
  starPos[i*3+1] = Math.abs(r * Math.cos(phi));
  starPos[i*3+2] = r * Math.sin(phi) * Math.sin(theta);
}
const starGeo = new THREE.BufferGeometry();
starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 2.0, sizeAttenuation: false, transparent: true, opacity: 0.0 });
const starPoints = new THREE.Points(starGeo, starMat);
scene.add(starPoints);

// Moon
const moonMesh = new THREE.Mesh(
  new THREE.SphereGeometry(8, 16, 16),
  new THREE.MeshBasicMaterial({ color: 0xeeeeff })
);
moonMesh.visible = false;
scene.add(moonMesh);

// --- Update sky/lighting per frame ---
function updateSky(timeOfDay, biome) {
  const b = BIOMES[biome];
  const angle = (timeOfDay - 0.25) * Math.PI * 2;
  const sunH = Math.sin(angle);
  const sunX = Math.cos(angle) * 150;
  const sunY = sunH * 120;

  sunLight.position.set(sunX, sunY, -60);

  const t = Math.max(0, Math.min(sunH, 1));
  if (sunH > 0) {
    sunLight.intensity = t * 1.8;
    ambientLight.intensity = 0.3 + t * 0.5;
    hemiLight.intensity   = 0.2 + t * 0.4;
    // Sunrise / Sunset tints
    if (timeOfDay > 0.18 && timeOfDay < 0.32) {
      sunLight.color.setHex(0xff9944);
      ambientLight.color.setHex(0xffccaa);
    } else if (timeOfDay > 0.68 && timeOfDay < 0.82) {
      sunLight.color.setHex(0xff7744);
      ambientLight.color.setHex(0xffaa88);
    } else {
      sunLight.color.setHex(b.sunColor);
      ambientLight.color.setHex(b.ambientColor);
    }
    skyMat.uniforms.topColor.value.copy(b.skyTop);
    skyMat.uniforms.horizonColor.value.copy(b.skyHorizon);
    starMat.opacity = 0;
    moonMesh.visible = false;
  } else {
    sunLight.intensity = 0;
    ambientLight.intensity = 0.06;
    ambientLight.color.setHex(0x223366);
    hemiLight.intensity = 0.04;
    skyMat.uniforms.topColor.value.set(0x02030a);
    skyMat.uniforms.horizonColor.value.set(0x060820);
    starMat.opacity = Math.min(1, -sunH * 4);
    moonMesh.visible = true;
    const moonAngle = angle + Math.PI;
    moonMesh.position.set(Math.cos(moonAngle)*700, Math.abs(Math.sin(moonAngle)*700), -200);
  }
  skyMat.uniforms.bottomColor.value.setHex(b.groundColor);

  scene.fog = new THREE.Fog(b.fogColor, G.fogNear, G.fogFar);
  hemiLight.groundColor.setHex(b.groundColor);
}

// Smooth camera follow with spring
let camTarget = new THREE.Vector3();
let camPos = new THREE.Vector3(0, 4, 10);
function updateCamera(carPos, carQuat) {
  const offset = new THREE.Vector3(0, 3.5, 8);
  offset.applyQuaternion(carQuat);
  camTarget.copy(carPos).add(offset);
  camPos.lerp(camTarget, 0.08);
  camera.position.copy(camPos);
  const lookAt = carPos.clone().add(new THREE.Vector3(0, 1, 0));
  camera.lookAt(lookAt);
}
