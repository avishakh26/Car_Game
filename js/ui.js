// ============================================================
// UI.JS — HUD updates, settings panel, biome switching
// ============================================================

const UI = (() => {
  let settingsOpen = false;

  function init() {
    // Keyboard settings
    document.addEventListener('keydown', e => {
      if (!G.started) return;
      const k = e.key;
      if (k === 'ArrowLeft'  || k === 'a' || k === 'A') G.keys.left  = true;
      if (k === 'ArrowRight' || k === 'd' || k === 'D') G.keys.right = true;
      if (k === 'ArrowUp'   || k === 'w' || k === 'W') G.keys.up    = true;
      if (k === 'ArrowDown'  || k === 's' || k === 'S') G.keys.down  = true;
      if (k === 'Escape') closeSettings();
    });
    document.addEventListener('keyup', e => {
      const k = e.key;
      if (k === 'ArrowLeft'  || k === 'a' || k === 'A') G.keys.left  = false;
      if (k === 'ArrowRight' || k === 'd' || k === 'D') G.keys.right = false;
      if (k === 'ArrowUp'   || k === 'w' || k === 'W') G.keys.up    = false;
      if (k === 'ArrowDown'  || k === 's' || k === 'S') G.keys.down  = false;
    });

    // Touch/mobile
    document.addEventListener('touchstart', handleTouch, { passive: true });
    document.addEventListener('touchend',   handleTouchEnd, { passive: true });
  }

  let touchStartX = 0;
  function handleTouch(e) {
    const t = e.touches[0];
    touchStartX = t.clientX;
    if (t.clientX < window.innerWidth * 0.4) G.keys.left = true;
    else if (t.clientX > window.innerWidth * 0.6) G.keys.right = true;
    else G.keys.up = true;
  }
  function handleTouchEnd() {
    G.keys.left = G.keys.right = G.keys.up = false;
  }

  function closeSettings() {
    settingsOpen = false;
    document.getElementById('settingsPanel').classList.remove('open');
  }

  function update() {
    // Speed (km/h display = units/sec * 3.6 ≈ display)
    const kmh = Math.round(G.carSpeed * 3.0);
    document.getElementById('speedVal').textContent = kmh;
    document.getElementById('distVal').textContent = (G.distance / 1000).toFixed(2) + ' km';
  }

  return { init, update };
})();

// Global functions for one-liner HTML onClick calls
function startDrive() {
  document.getElementById('splash').classList.add('hidden');
  setTimeout(() => { document.getElementById('splash').style.display = 'none'; }, 1000);
  document.getElementById('hud').style.display = 'block';
  G.started = true;
  G.carSpeed = G.maxSpeed * 0.5; // Start at half speed
  Audio.startPlayback(); // Auto-play default music on journey start
}

function toggleSettings() {
  const p = document.getElementById('settingsPanel');
  p.classList.toggle('open');
}

function setBiome(biome) {
  G.biome = biome;
  document.querySelectorAll('.biome-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('biome-' + biome).classList.add('active');
  Road.applyBiome();
  Environment.applyBiome();
  updateSky(G.timeOfDay, G.biome);
}

function setTimeOfDay(v) {
  G.timeOfDay = parseFloat(v);
  updateSky(G.timeOfDay, G.biome);
}

function setWeather(w) {
  G.weather = w;
  Weather.setWeather(w);
}

function setFog(v) {
  G.fogFar = parseFloat(v);
  if (scene.fog) { scene.fog.near = G.fogNear; scene.fog.far = G.fogFar; }
}

function setAutodrive(v) {
  G.autodrive = v;
}

function setSpeedLimit(v) {
  G.maxSpeed = parseFloat(v) / 3.0; // convert km/h display to internal units
}

// Spawn twinkle stars on splash
(function spawnStars() {
  const cont = document.getElementById('splashStars');
  if (!cont) return;
  for (let i = 0; i < 100; i++) {
    const s = document.createElement('div');
    s.className = 'star';
    s.style.left  = Math.random() * 100 + '%';
    s.style.top   = Math.random() * 100 + '%';
    s.style.setProperty('--dur', (2 + Math.random() * 4) + 's');
    s.style.setProperty('--delay', (Math.random() * 4) + 's');
    cont.appendChild(s);
  }
})();
