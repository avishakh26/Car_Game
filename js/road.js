// ============================================================
// ROAD.JS — Procedural infinite spline road + terrain
// ============================================================

const Road = (() => {
  const SEG_LEN   = 50;   // units between control points
  const ROAD_W    = 10;   // road width
  const N_POINTS  = 80;   // control points to maintain
  const REBUILD_T = 0.45; // rebuild when car reaches this t

  let pts = [];           // THREE.Vector3 control points
  let curve = null;
  let roadMesh = null, lineMesh = null;
  let terrainL = null, terrainR = null;

  // Road generation drift state
  let driftAngle = 0, driftOmega = 0;

  function nextPoint(prev) {
    driftOmega += (Math.random() - 0.5) * 0.04;
    driftOmega *= 0.90;
    driftOmega = Math.max(-0.12, Math.min(0.12, driftOmega));
    driftAngle += driftOmega;
    const dx = Math.sin(driftAngle) * SEG_LEN;
    const dz = -Math.cos(driftAngle) * SEG_LEN;
    const nx = (prev.x + dx) * 0.018, nz = (prev.z + dz) * 0.018;
    const hy = Noise.fbm(nx, nz, 3) * 10;
    return new THREE.Vector3(prev.x + dx, hy, prev.z + dz);
  }

  function init() {
    pts = [new THREE.Vector3(0, 0, 0)];
    for (let i = 1; i < N_POINTS; i++) pts.push(nextPoint(pts[i - 1]));
    buildAll();
  }

  function buildCurve() {
    curve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.5);
  }

  function buildRoad() {
    if (roadMesh) { scene.remove(roadMesh); roadMesh.geometry.dispose(); }
    if (lineMesh) { scene.remove(lineMesh); lineMesh.geometry.dispose(); }

    const samples = curve.getPoints(1200);
    const up = new THREE.Vector3(0, 1, 0);
    const verts = [], idx = [], uvs = [];
    const lVerts = [], lIdx = [];

    for (let i = 0; i < samples.length - 1; i++) {
      const p0 = samples[i], p1 = samples[i + 1];
      const dir = new THREE.Vector3().subVectors(p1, p0).normalize();
      const right = new THREE.Vector3().crossVectors(dir, up).normalize();
      const hw = ROAD_W / 2;

      const L = p0.clone().addScaledVector(right, -hw); L.y += 0.05;
      const R = p0.clone().addScaledVector(right,  hw); R.y += 0.05;
      const b = i * 2;
      verts.push(L.x,L.y,L.z, R.x,R.y,R.z);
      uvs.push(0,i/samples.length, 1,i/samples.length);
      if (i < samples.length - 2) {
        idx.push(b,b+1,b+2, b+1,b+3,b+2);
      }
      // Center dashes
      if (i % 24 < 12) {
        const C = p0.clone(); C.y += 0.10;
        const lb = lVerts.length / 3;
        const CL = C.clone().addScaledVector(right, -0.18);
        const CR = C.clone().addScaledVector(right,  0.18);
        lVerts.push(CL.x,CL.y,CL.z, CR.x,CR.y,CR.z);
        if (lb >= 2) lIdx.push(lb-2,lb-1,lb, lb-1,lb+1,lb);
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
    geo.setAttribute('uv',       new THREE.Float32BufferAttribute(uvs,   2));
    geo.setIndex(idx);
    geo.computeVertexNormals();

    const b = BIOMES[G.biome];
    roadMesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: b.roadColor, roughness: 0.85 }));
    roadMesh.receiveShadow = true;
    scene.add(roadMesh);

    if (lVerts.length && lIdx.length) {
      const lg = new THREE.BufferGeometry();
      lg.setAttribute('position', new THREE.Float32BufferAttribute(lVerts, 3));
      lg.setIndex(lIdx);
      lineMesh = new THREE.Mesh(lg, new THREE.MeshBasicMaterial({ color: b.lineColor, opacity: 0.85, transparent: true }));
      scene.add(lineMesh);
    }
  }

  function buildTerrainSide(side) {
    const SIDE_W = 180, SIDE_SEGS_LAT = 16, CURVE_SEGS = 300;
    const pts2 = curve.getPoints(CURVE_SEGS);
    const up3 = new THREE.Vector3(0,1,0);
    const verts = [], idxArr = [], normals = [];

    for (let i = 0; i <= CURVE_SEGS; i++) {
      const p = pts2[Math.min(i, pts2.length - 1)];
      const pN = pts2[Math.min(i + 1, pts2.length - 1)];
      const dir = new THREE.Vector3().subVectors(pN, p).normalize();
      const right = new THREE.Vector3().crossVectors(dir, up3).normalize();
      for (let s = 0; s <= SIDE_SEGS_LAT; s++) {
        const t = s / SIDE_SEGS_LAT;
        const dist = ROAD_W / 2 + t * SIDE_W;
        const wp = p.clone().addScaledVector(right, side * dist);
        const noise = Noise.fbm(wp.x * 0.012, wp.z * 0.012, 5) * 28;
        const slope = t * t * 18;
        wp.y = p.y + slope + noise * t;
        verts.push(wp.x, wp.y, wp.z);
        normals.push(0, 1, 0);
      }
    }
    for (let i = 0; i < CURVE_SEGS; i++) {
      for (let s = 0; s < SIDE_SEGS_LAT; s++) {
        const a = i * (SIDE_SEGS_LAT + 1) + s;
        idxArr.push(a, a+1, a+SIDE_SEGS_LAT+1, a+1, a+SIDE_SEGS_LAT+2, a+SIDE_SEGS_LAT+1);
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
    geo.setIndex(idxArr);
    geo.computeVertexNormals();
    const b = BIOMES[G.biome];
    const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: b.groundColor, roughness: 1.0 }));
    mesh.receiveShadow = true;
    return mesh;
  }

  function buildTerrain() {
    if (terrainL) { scene.remove(terrainL); terrainL.geometry.dispose(); }
    if (terrainR) { scene.remove(terrainR); terrainR.geometry.dispose(); }
    terrainL = buildTerrainSide(-1); scene.add(terrainL);
    terrainR = buildTerrainSide( 1); scene.add(terrainR);
  }

  function buildAll() {
    buildCurve();
    buildRoad();
    buildTerrain();
  }

  // Returns { pos, quat } for car placement at roadT + lateralOffset
  function getCarTransform() {
    const t = Math.min(G.roadT, 0.9999);
    const roadPos  = curve.getPoint(t);
    const tangent  = curve.getTangent(t).normalize();
    const up3      = new THREE.Vector3(0, 1, 0);
    const right3   = new THREE.Vector3().crossVectors(tangent, up3).normalize();

    const pos = roadPos.clone().addScaledVector(right3, G.lateralOffset);
    pos.y += 0.38; // sit car on road

    const forward = tangent.clone().negate(); // car faces -Z local
    const quat = new THREE.Quaternion();
    const m = new THREE.Matrix4().lookAt(pos, pos.clone().add(tangent), up3);
    quat.setFromRotationMatrix(m);

    return { pos, quat, right: right3 };
  }

  function advance(dt) {
    const len = curve.getLength();
    const tPerSec = G.carSpeed / len;
    G.roadT += tPerSec * dt;
    G.distance += G.carSpeed * dt;

    // Regenerate when nearing the end
    if (G.roadT > REBUILD_T) {
      const drop = Math.floor(pts.length * 0.3);
      pts.splice(0, drop);
      for (let i = 0; i < drop + 10; i++) pts.push(nextPoint(pts[pts.length - 1]));
      buildAll();
      G.roadT = 0.08;
    }
  }

  function applyBiome() {
    if (roadMesh)  roadMesh.material.color.setHex(BIOMES[G.biome].roadColor);
    if (lineMesh)  lineMesh.material.color.setHex(BIOMES[G.biome].lineColor);
    if (terrainL)  terrainL.material.color.setHex(BIOMES[G.biome].groundColor);
    if (terrainR)  terrainR.material.color.setHex(BIOMES[G.biome].groundColor);
  }

  function getCurveLen() {
    return curve ? curve.getLength() : 3000;
  }

  return { init, advance, getCarTransform, applyBiome, getCurveLen };
})();

// _getPointAt: returns { pos, quat } for traffic module
Road._getPointAt = function(t) {
  try {
    const _t = Math.max(0.001, Math.min(0.999, t));
    // Reuse getCarTransform logic but at arbitrary t
    // We temporarily override G.roadT
    const savedT = G.roadT;
    G.roadT = _t;
    const result = Road.getCarTransform();
    G.roadT = savedT;
    return result;
  } catch(e) { return null; }
};
Road._curveLen = 3000; // approximate, updated each frame
