// ============================================================
// WEATHER.JS — Rain & Snow particle systems
// ============================================================

const Weather = (() => {
  const PARTICLE_COUNT = 3000;
  let rainSystem = null;
  let snowSystem = null;
  let currentWeather = 'clear';

  function createRain() {
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(PARTICLE_COUNT * 3);
    const vel = new Float32Array(PARTICLE_COUNT);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      pos[i*3]   = (Math.random() - 0.5) * 120;
      pos[i*3+1] = Math.random() * 80;
      pos[i*3+2] = (Math.random() - 0.5) * 120;
      vel[i] = 28 + Math.random() * 12;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.userData.vel = vel;
    const mat = new THREE.PointsMaterial({
      color: 0xaaccff, size: 0.08, transparent: true, opacity: 0.55,
      sizeAttenuation: true, blending: THREE.AdditiveBlending, depthWrite: false
    });
    rainSystem = new THREE.Points(geo, mat);
    rainSystem.visible = false;
    scene.add(rainSystem);
  }

  function createSnow() {
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(PARTICLE_COUNT * 3);
    const vel = new Float32Array(PARTICLE_COUNT * 2); // x drift, fall speed
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      pos[i*3]   = (Math.random() - 0.5) * 100;
      pos[i*3+1] = Math.random() * 60;
      pos[i*3+2] = (Math.random() - 0.5) * 100;
      vel[i*2]   = (Math.random() - 0.5) * 0.5;
      vel[i*2+1] = 1.5 + Math.random() * 2;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.userData.vel = vel;
    const mat = new THREE.PointsMaterial({
      color: 0xffffff, size: 0.5, transparent: true, opacity: 0.7,
      sizeAttenuation: true
    });
    snowSystem = new THREE.Points(geo, mat);
    snowSystem.visible = false;
    scene.add(snowSystem);
  }

  function init() {
    createRain();
    createSnow();
  }

  function setWeather(w) {
    currentWeather = w;
    if (rainSystem) rainSystem.visible = (w === 'rain');
    if (snowSystem) snowSystem.visible = (w === 'snow');
  }

  function update(dt, carPos) {
    if (!carPos) return;

    if (currentWeather === 'rain' && rainSystem) {
      const pos = rainSystem.geometry.attributes.position.array;
      const vel = rainSystem.geometry.userData.vel;
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        pos[i*3+1] -= vel[i] * dt;
        if (pos[i*3+1] < carPos.y - 2) {
          pos[i*3]   = carPos.x + (Math.random() - 0.5) * 120;
          pos[i*3+1] = carPos.y + 60 + Math.random() * 20;
          pos[i*3+2] = carPos.z + (Math.random() - 0.5) * 120;
        }
      }
      rainSystem.position.set(0, 0, 0);
      rainSystem.geometry.attributes.position.needsUpdate = true;
    }

    if (currentWeather === 'snow' && snowSystem) {
      const pos = snowSystem.geometry.attributes.position.array;
      const vel = snowSystem.geometry.userData.vel;
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        pos[i*3]   += vel[i*2]   * dt * 5;
        pos[i*3+1] -= vel[i*2+1] * dt;
        if (pos[i*3+1] < carPos.y - 2) {
          pos[i*3]   = carPos.x + (Math.random() - 0.5) * 100;
          pos[i*3+1] = carPos.y + 50 + Math.random() * 10;
          pos[i*3+2] = carPos.z + (Math.random() - 0.5) * 100;
        }
      }
      snowSystem.geometry.attributes.position.needsUpdate = true;
    }
  }

  return { init, setWeather, update };
})();
