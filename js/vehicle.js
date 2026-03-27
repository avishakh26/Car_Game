// ============================================================
// VEHICLE.JS — Car mesh + physics + wheel spin
// ============================================================

const Vehicle = (() => {
  const root = new THREE.Group();
  scene.add(root);

  // --- Car body ---
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x1a6fcf, roughness: 0.3, metalness: 0.7 });
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x88ccff, roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.5 });
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9, metalness: 0.1 });
  const rimMat  = new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.2, metalness: 0.9 });
  const lightMat = new THREE.MeshStandardMaterial({ color: 0xffffaa, emissive: 0xffee88, emissiveIntensity: 1.5 });
  const tailMat  = new THREE.MeshStandardMaterial({ color: 0xff2200, emissive: 0xff0000, emissiveIntensity: 0.5 });

  // Lower body
  const lowerBody = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.65, 4.2), bodyMat);
  lowerBody.position.y = 0.5;
  lowerBody.castShadow = true;
  root.add(lowerBody);

  // Upper body (cabin)
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.55, 2.2), bodyMat);
  cabin.position.set(0, 1.1, -0.1);
  cabin.castShadow = true;
  root.add(cabin);

  // Windshield
  const wind = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.5, 0.05), glassMat);
  wind.position.set(0, 1.05, 0.96);
  wind.rotation.x = 0.3;
  root.add(wind);

  // Rear window
  const rear = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.5, 0.05), glassMat);
  rear.position.set(0, 1.05, -1.2);
  rear.rotation.x = -0.3;
  root.add(rear);

  // Side windows
  [-0.8, 0.8].forEach(x => {
    const sw = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.4, 1.8), glassMat);
    sw.position.set(x, 1.1, -0.1);
    root.add(sw);
  });

  // Hood
  const hood = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.1, 1.2), bodyMat);
  hood.position.set(0, 0.88, 1.3);
  hood.rotation.x = -0.12;
  root.add(hood);

  // Bumpers
  const frontBumper = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.3, 0.15), bodyMat);
  frontBumper.position.set(0, 0.38, 2.15);
  root.add(frontBumper);

  // Headlights
  [-0.65, 0.65].forEach(x => {
    const hl = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.15, 0.05), lightMat);
    hl.position.set(x, 0.6, 2.12);
    root.add(hl);
  });

  // Taillights
  [-0.65, 0.65].forEach(x => {
    const tl = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.15, 0.05), tailMat);
    tl.position.set(x, 0.6, -2.12);
    root.add(tl);
  });

  // Headlight cones (SpotLight)
  const headlightL = new THREE.SpotLight(0xffffff, 0, 60, Math.PI * 0.15, 0.4);
  headlightL.position.set(-0.65, 0.6, 2.1);
  headlightL.target.position.set(-2, -1, -30);
  root.add(headlightL); root.add(headlightL.target);
  const headlightR = headlightL.clone();
  headlightR.target.position.set(2, -1, -30);
  root.add(headlightR); root.add(headlightR.target);

  // --- Wheels ---
  const wheelGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.28, 24);
  const rimGeo   = new THREE.CylinderGeometry(0.22, 0.22, 0.30, 8);
  const wheelPositions = [
    [-1.05, 0.38,  1.4],  // FL
    [ 1.05, 0.38,  1.4],  // FR
    [-1.05, 0.38, -1.4],  // RL
    [ 1.05, 0.38, -1.4],  // RR
  ];
  const wheels = wheelPositions.map(p => {
    const w = new THREE.Mesh(wheelGeo, wheelMat);
    w.rotation.z = Math.PI / 2;
    w.position.set(...p);
    w.castShadow = true;
    root.add(w);
    const rim = new THREE.Mesh(rimGeo, rimMat);
    rim.rotation.z = Math.PI / 2;
    rim.position.set(...p);
    root.add(rim);
    return w;
  });

  // Car paint color options per biome (just blue by default; can be extended)
  function setColor(hex) { bodyMat.color.setHex(hex); }

  // Physics state
  let steerAngle = 0;    // current steering angle applied to front wheels

  function update(dt) {
    const keys = G.keys;
    const maxSpd = G.maxSpeed;

    // --- Speed ---
    if (keys.up && !G.autodrive) {
      G.carSpeed = Math.min(G.carSpeed + G.acceleration * dt, maxSpd);
    } else if (keys.down) {
      G.carSpeed = Math.max(G.carSpeed - G.braking * dt, 0);
    } else {
      // Gentle deceleration (no braking)
      G.carSpeed = Math.max(G.carSpeed - 8 * dt, G.autodrive ? G.maxSpeed * 0.75 : 0);
    }

    // Autodrive always maintains speed
    if (G.autodrive) {
      G.carSpeed = Math.min(G.carSpeed + G.acceleration * dt, G.maxSpeed * 0.75);
    }

    // --- Steering ---
    let steerInput = 0;
    if (keys.left)  steerInput = -1;
    if (keys.right) steerInput =  1;
    // Autodrive gently steers toward center
    if (G.autodrive) steerInput = -Math.sign(G.lateralOffset) * Math.min(Math.abs(G.lateralOffset) * 0.15, 1);

    const steerMax = 3.5;
    const speedFactor = Math.max(0.3, 1 - G.carSpeed / maxSpd * 0.6);
    G.lateralVel += steerInput * G.steerForce * speedFactor * dt;
    G.lateralVel *= Math.pow(G.steerFriction, dt * 60);
    G.lateralOffset += G.lateralVel * dt;
    G.lateralOffset = Math.max(-steerMax, Math.min(steerMax, G.lateralOffset));

    steerAngle += (steerInput * 0.35 - steerAngle) * 0.25;

    // --- Wheel spin ---
    const spinRate = G.carSpeed / 0.38;
    wheels.forEach((w, i) => {
      w.rotation.y += spinRate * dt;
      if (i < 2) {
        w.rotation.z = Math.PI / 2;
        // Slight steering rotation on front wheels (visual)
        w.parent; // keep ref
      }
    });

    // Body roll based on lateral velocity
    root.rotation.z = -G.lateralVel * 0.03;

    // Headlights — on at night (timeOfDay < 0.25 or > 0.75)
    const isNight = G.timeOfDay < 0.2 || G.timeOfDay > 0.8;
    headlightL.intensity = isNight ? 2.0 : 0;
    headlightR.intensity = isNight ? 2.0 : 0;
  }

  function setPosition(pos, quat) {
    root.position.copy(pos);
    root.quaternion.copy(quat);
  }

  function getRoot() { return root; }
  function setColor2(hex) { bodyMat.color.setHex(hex); }

  return { update, setPosition, getRoot, setColor: setColor2 };
})();
