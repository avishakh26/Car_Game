// ============================================================
// ENVIRONMENT.JS — Realistic trees, grass, clouds, mountains
// ============================================================

const Environment = (() => {
  const TREE_COUNT  = 400;
  const GRASS_COUNT = 1200;
  const CLOUD_COUNT = 18;
  const MTN_COUNT   = 14;

  let cloudMeshes = [];
  let mountainGroup = null;
  let dummy = new THREE.Object3D();

  // ---- TREES (layered cones + cylinder trunk) ----
  let foliage1Inst = null, foliage2Inst = null, foliage3Inst = null, trunkInst = null;
  let treePositions = []; // cached {x,y,z,scale}

  function buildTrees() {
    // Remove old
    [foliage1Inst, foliage2Inst, foliage3Inst, trunkInst].forEach(m => { if (m) scene.remove(m); });

    const b = BIOMES[G.biome];

    // Three layered cones for realistic tree silhouette
    const f1Geo = new THREE.ConeGeometry(1.4, 2.2, 8);
    const f2Geo = new THREE.ConeGeometry(1.1, 2.0, 8);
    const f3Geo = new THREE.ConeGeometry(0.7, 1.6, 8);
    const fMat  = new THREE.MeshStandardMaterial({ color: b.treeColor, roughness: 0.85, flatShading: true });

    foliage1Inst = new THREE.InstancedMesh(f1Geo, fMat.clone(), TREE_COUNT);
    foliage2Inst = new THREE.InstancedMesh(f2Geo, fMat.clone(), TREE_COUNT);
    foliage3Inst = new THREE.InstancedMesh(f3Geo, fMat.clone(), TREE_COUNT);
    [foliage1Inst, foliage2Inst, foliage3Inst].forEach(m => { m.castShadow = true; scene.add(m); });

    const trkGeo = new THREE.CylinderGeometry(0.14, 0.22, 2.2, 7);
    const trkMat = new THREE.MeshStandardMaterial({ color: b.trunkColor, roughness: 1.0 });
    trunkInst = new THREE.InstancedMesh(trkGeo, trkMat, TREE_COUNT);
    trunkInst.castShadow = true;
    scene.add(trunkInst);

    _generateTreePositions();
    _uploadTreeMatrices();
  }

  function _generateTreePositions() {
    treePositions = [];
    const carPos = _getCarPos();
    for (let i = 0; i < TREE_COUNT; i++) {
      const t = Math.random();
      const roadPt = Road._getCurvePoint(t);
      const side = Math.random() > 0.5 ? 1 : -1;
      const lateralDist = 8 + Math.random() * 65;
      const x = roadPt.x + side * lateralDist;
      const z = roadPt.z;
      const noise = Noise.fbm(x * 0.012, z * 0.012, 4) * 22;
      const slopeDist = (lateralDist - 8) / 65;
      const y = roadPt.y + slopeDist * slopeDist * 18 + noise * slopeDist;
      const scale = 0.6 + Math.random() * 1.0;
      const rotY = Math.random() * Math.PI * 2;
      treePositions.push({ x, y, z, scale, rotY });
    }
  }

  function _uploadTreeMatrices() {
    for (let i = 0; i < TREE_COUNT; i++) {
      const { x, y, z, scale, rotY } = treePositions[i];

      // Bottom foliage layer
      dummy.position.set(x, y + 1.4 * scale, z);
      dummy.scale.set(scale, scale, scale);
      dummy.rotation.set(0, rotY, 0);
      dummy.updateMatrix();
      foliage1Inst.setMatrixAt(i, dummy.matrix);

      // Mid foliage layer
      dummy.position.set(x, y + 2.5 * scale, z);
      dummy.scale.set(scale * 0.85, scale * 0.85, scale * 0.85);
      dummy.updateMatrix();
      foliage2Inst.setMatrixAt(i, dummy.matrix);

      // Top foliage layer
      dummy.position.set(x, y + 3.4 * scale, z);
      dummy.scale.set(scale * 0.65, scale * 0.65, scale * 0.65);
      dummy.updateMatrix();
      foliage3Inst.setMatrixAt(i, dummy.matrix);

      // Trunk
      dummy.position.set(x, y + 1.1 * scale, z);
      dummy.scale.set(scale, scale * 1.2, scale);
      dummy.rotation.set(0, rotY, 0);
      dummy.updateMatrix();
      trunkInst.setMatrixAt(i, dummy.matrix);
    }
    foliage1Inst.instanceMatrix.needsUpdate = true;
    foliage2Inst.instanceMatrix.needsUpdate = true;
    foliage3Inst.instanceMatrix.needsUpdate = true;
    trunkInst.instanceMatrix.needsUpdate = true;
  }

  function _getCarPos() {
    try { return Road.getCarTransform().pos; } catch(e) { return new THREE.Vector3(0,0,0); }
  }

  // ---- GRASS ----
  let grassInst = null;

  function buildGrass() {
    if (grassInst) scene.remove(grassInst);

    const b = BIOMES[G.biome];
    // Simple grass blade: flat quad standing upright
    const geo = new THREE.PlaneGeometry(0.4, 0.9);
    geo.translate(0, 0.45, 0); // pivot at bottom

    // Slightly darker / more saturated than ground
    const c = new THREE.Color(b.groundColor).multiplyScalar(0.85);
    c.r = Math.min(1, c.r * 0.80 + 0.05);
    c.g = Math.min(1, c.g * 1.10);
    const mat = new THREE.MeshStandardMaterial({ color: c, roughness: 1, side: THREE.DoubleSide });
    grassInst = new THREE.InstancedMesh(geo, mat, GRASS_COUNT);
    grassInst.receiveShadow = false;
    _placeGrass();
    scene.add(grassInst);
  }

  function _placeGrass() {
    for (let i = 0; i < GRASS_COUNT; i++) {
      const t = Math.random();
      const roadPt = Road._getCurvePoint(t);
      const side = Math.random() > 0.5 ? 1 : -1;
      const lat = 6 + Math.random() * 55;
      const x = roadPt.x + side * lat;
      const z = roadPt.z + (Math.random() - 0.5) * 10;
      const noise = Noise.fbm(x * 0.018, z * 0.018, 3) * 12;
      const slopeDist = (lat - 6) / 55;
      const y = roadPt.y + slopeDist * slopeDist * 18 + noise * slopeDist + 0.02;

      const scale = 0.6 + Math.random() * 0.8;
      dummy.position.set(x, y, z);
      dummy.scale.set(scale, scale, scale);
      dummy.rotation.set(0, Math.random() * Math.PI, Math.random() * 0.3 - 0.15);
      dummy.updateMatrix();
      grassInst.setMatrixAt(i, dummy.matrix);
    }
    grassInst.instanceMatrix.needsUpdate = true;
  }

  // ---- CLOUDS ----
  function buildClouds() {
    cloudMeshes.forEach(m => scene.remove(m));
    cloudMeshes = [];
    const b = BIOMES[G.biome];
    const mat = new THREE.MeshStandardMaterial({ color: b.cloudColor, roughness: 1, transparent: true, opacity: 0.88 });
    for (let i = 0; i < CLOUD_COUNT; i++) {
      const cloud = new THREE.Group();
      const puffs = 3 + Math.floor(Math.random() * 4);
      for (let p = 0; p < puffs; p++) {
        const geo = new THREE.SphereGeometry(8 + Math.random() * 8, 7, 5);
        const m = new THREE.Mesh(geo, mat);
        m.position.set((Math.random() - 0.5) * 20, (Math.random() - 0.5) * 4, (Math.random() - 0.5) * 10);
        cloud.add(m);
      }
      cloud.position.set(
        (Math.random() - 0.5) * 600,
        90 + Math.random() * 50,
        -Math.random() * 500
      );
      cloud.userData.speed = 0.5 + Math.random() * 1.5;
      cloud.userData.driftX = (Math.random() - 0.5) * 0.3;
      scene.add(cloud);
      cloudMeshes.push(cloud);
    }
  }

  // ---- MOUNTAINS ----
  function buildMountains() {
    if (mountainGroup) scene.remove(mountainGroup);
    mountainGroup = new THREE.Group();
    const b = BIOMES[G.biome];
    const mat = new THREE.MeshStandardMaterial({ color: b.mountainColor, roughness: 1.0, flatShading: true });
    for (let i = 0; i < MTN_COUNT; i++) {
      const h = 80 + Math.random() * 130;
      const w = 60 + Math.random() * 90;
      const geo = new THREE.ConeGeometry(w, h, 5 + Math.floor(Math.random() * 3));
      const m = new THREE.Mesh(geo, mat);
      const side = (i % 2 === 0 ? 1 : -1) * (180 + Math.random() * 130);
      m.position.set(side, h / 2 - 10, -200 - Math.random() * 900);
      m.castShadow = true;
      mountainGroup.add(m);
    }
    scene.add(mountainGroup);
  }

  // ---- LIFECYCLE ----
  function init() {
    buildClouds();
    buildMountains();
  }

  function initTrees() {
    buildTrees();
    buildGrass();
  }

  // Tree recycling counter — rebuild every N road rebuilds
  let _treeRefreshTimer = 0;

  function update(dt, carPos) {
    // Drift clouds
    cloudMeshes.forEach(c => {
      c.position.x += c.userData.driftX * dt * 10;
      const dx = c.position.x - carPos.x;
      if (Math.abs(dx) > 400) c.position.x = carPos.x + (Math.random() - 0.5) * 600;
      const dz = c.position.z - carPos.z;
      if (dz > 200) c.position.z = carPos.z - 500;
      c.position.z += 2 * dt;
      c.position.y += Math.sin(Date.now() * 0.0001 + c.userData.speed) * 0.02;
    });

    // Mountains follow
    if (mountainGroup) {
      mountainGroup.children.forEach(m => {
        const dz = m.position.z - carPos.z;
        if (dz > 300) m.position.z -= 1200;
      });
    }

    // Refresh trees + grass periodically when car moves forward
    _treeRefreshTimer += dt;
    if (_treeRefreshTimer > 8) {
      _treeRefreshTimer = 0;
      _generateTreePositions();
      _uploadTreeMatrices();
      _placeGrass();
    }
  }

  function applyBiome() {
    const b = BIOMES[G.biome];
    if (foliage1Inst) { foliage1Inst.material.color.setHex(b.treeColor); foliage2Inst.material.color.setHex(b.treeColor); foliage3Inst.material.color.setHex(b.treeColor); }
    if (trunkInst)   trunkInst.material.color.setHex(b.trunkColor);
    cloudMeshes.forEach(c => c.children.forEach(m => m.material.color.setHex(b.cloudColor)));
    if (mountainGroup) mountainGroup.children.forEach(m => m.material.color.setHex(b.mountainColor));
    if (grassInst) {
      const c = new THREE.Color(b.groundColor).multiplyScalar(0.85);
      c.r = Math.min(1, c.r * 0.80 + 0.05);
      c.g = Math.min(1, c.g * 1.10);
      grassInst.material.color.copy(c);
    }
  }

  function refreshTrees() { _generateTreePositions(); _uploadTreeMatrices(); _placeGrass(); }

  return { init, initTrees, update, applyBiome, refreshTrees };
})();

// Monkey-patch Road to expose curve point helper for trees
Road._getCurvePoint = function(t) {
  try { return Road.getCarTransform ? Road.getCarTransform().pos : new THREE.Vector3(0,0,-t*3000); }
  catch(e) { return new THREE.Vector3(0,0,-t*3000); }
};
