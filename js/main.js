// ============================================================
// MAIN.JS — Game bootstrap & main loop
// ============================================================

function initGame() {
  G.clock = new THREE.Clock();

  // Init subsystems in order
  Road.init();             // Road + terrain (needs scene/noise)
  Environment.init();      // Clouds + mountains
  Environment.initTrees(); // Trees + grass (needs Road)
  Traffic.init();          // NPC cars
  Weather.init();          // Rain + snow
  UI.init();               // Keyboard + touch
  Audio.init();            // Music (pre-loads default playlist)

  // Initial sky / lighting
  updateSky(G.timeOfDay, G.biome);

  // Start render loop
  loop();
}

function loop() {
  requestAnimationFrame(loop);

  G.delta = Math.min(G.clock.getDelta(), 0.05); // cap at 50ms

  if (!G.started) {
    renderer.render(scene, camera);
    return;
  }

  // Advance road
  Road.advance(G.delta);
  Road._curveLen = Road.getCurveLen(); // keep traffic in sync

  // Car transform
  const { pos, quat } = Road.getCarTransform();

  // Vehicle physics
  Vehicle.update(G.delta);
  Vehicle.setPosition(pos, quat);

  // Environment
  Environment.update(G.delta, pos);
  Weather.update(G.delta, pos);

  // NPC traffic
  Traffic.update(G.delta);

  // Sky
  skyMesh.position.copy(pos);

  // Camera
  updateCamera(pos, quat);

  // HUD
  UI.update();

  renderer.render(scene, camera);
}

// Kick off
initGame();
