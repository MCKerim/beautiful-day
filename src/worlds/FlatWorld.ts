import * as THREE from 'three';
import type { IWorld, PropCollider } from './IWorld';

const CEILING_Y      = 2.8;
const FOG_HEX        = 0xfff5cc;
const FOG_NEAR       = 6;
const FOG_FAR        = 70;
const FIXTURE_SPACING = 8;
const FIXTURE_RADIUS  = 9; // ±9 steps → 19×19 = 361 instances

// World-space checker tile pattern + manual fog, so the floor looks right
// regardless of plane position.
function buildFloor(): THREE.Mesh {
  const geo = new THREE.PlaneGeometry(4000, 4000);
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uFogColor: { value: new THREE.Color(FOG_HEX) },
      uFogNear:  { value: FOG_NEAR },
      uFogFar:   { value: FOG_FAR },
    },
    vertexShader: `
      varying float vFogDepth;
      varying vec2  vWorldXZ;
      void main() {
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vWorldXZ  = worldPos.xz;
        vec4 mvPos = viewMatrix * worldPos;
        vFogDepth  = -mvPos.z;
        gl_Position = projectionMatrix * mvPos;
      }
    `,
    fragmentShader: `
      uniform vec3  uFogColor;
      uniform float uFogNear;
      uniform float uFogFar;
      varying float vFogDepth;
      varying vec2  vWorldXZ;
      void main() {
        const float TILE = 1.2;
        vec2  tile    = floor(vWorldXZ / TILE);
        float checker = mod(tile.x + tile.y, 2.0);
        // Yellow-beige carpet tiles
        vec3 col = mix(vec3(0.75, 0.65, 0.28), vec3(0.67, 0.56, 0.21), checker);
        float t  = clamp((uFogFar - vFogDepth) / (uFogFar - uFogNear), 0.0, 1.0);
        col = mix(uFogColor, col, t);
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = -Math.PI / 2;
  return mesh;
}

function buildCeiling(): THREE.Mesh {
  const geo = new THREE.PlaneGeometry(4000, 4000);
  const mat = new THREE.MeshBasicMaterial({
    color: 0xede8d0,
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = Math.PI / 2;
  mesh.position.y = CEILING_Y;
  return mesh;
}

// Fluorescent tube fixtures — InstancedMesh in a grid that tracks the player.
// Some tubes are dim or dead for atmosphere.
function buildFixtures(): THREE.Group {
  const count = (FIXTURE_RADIUS * 2 + 1) ** 2;
  const geo   = new THREE.BoxGeometry(2.8, 0.05, 0.18);
  const mat   = new THREE.MeshBasicMaterial({ color: 0xfffde8 });
  const imesh = new THREE.InstancedMesh(geo, mat, count);
  imesh.position.y = CEILING_Y - 0.03;

  const dummy = new THREE.Object3D();
  let i = 0;
  for (let ix = -FIXTURE_RADIUS; ix <= FIXTURE_RADIUS; ix++) {
    for (let iz = -FIXTURE_RADIUS; iz <= FIXTURE_RADIUS; iz++) {
      dummy.position.set(ix * FIXTURE_SPACING, 0, iz * FIXTURE_SPACING);
      dummy.updateMatrix();
      imesh.setMatrixAt(i, dummy.matrix);

      // Deterministic hash → normal / dim / dead fixture
      const h = Math.abs(Math.sin(ix * 127.1 + iz * 311.7 + 0.5));
      let c: THREE.Color;
      if      (h > 0.94) c = new THREE.Color(0x3a3018); // dead
      else if (h > 0.80) c = new THREE.Color(0xb8b070); // dim / flickering
      else               c = new THREE.Color(0xfffde8); // normal
      imesh.setColorAt(i, c);
      i++;
    }
  }
  imesh.instanceMatrix.needsUpdate = true;
  imesh.instanceColor!.needsUpdate = true;

  const group = new THREE.Group();
  group.add(imesh);
  return group;
}

export class FlatWorld implements IWorld {
  private group        = new THREE.Group();
  private fixtureGroup = buildFixtures();
  private ambient      = new THREE.AmbientLight(0xfffde8, 1.8);

  constructor() {
    this.group.add(buildFloor(), buildCeiling(), this.fixtureGroup);
  }

  attach(scene: THREE.Scene) {
    scene.fog        = new THREE.Fog(FOG_HEX, FOG_NEAR, FOG_FAR);
    scene.background = new THREE.Color(FOG_HEX);
    scene.add(this.group, this.ambient);
  }

  detach(scene: THREE.Scene) {
    scene.remove(this.group, this.ambient);
    scene.background = null;
  }

  update(_dt: number, _elapsed: number, playerPos: THREE.Vector3) {
    // Snap fixture grid to player so lights appear infinite
    const s = FIXTURE_SPACING;
    this.fixtureGroup.position.x = Math.round(playerPos.x / s) * s;
    this.fixtureGroup.position.z = Math.round(playerPos.z / s) * s;
  }

  getHeightAt(_x: number, _z: number): number { return 0; }

  getActiveProps(): PropCollider[] { return []; }

  spawnPosition(): THREE.Vector3 { return new THREE.Vector3(0, 1.6, 0); }
}
