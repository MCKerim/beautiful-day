import * as THREE from 'three';
import { createNoise2D } from 'simplex-noise';

export const CHUNK_SIZE = 64;
export const CHUNK_SEGMENTS = 48;

const noise2D     = createNoise2D();
const noiseColor  = createNoise2D();

const cDark  = new THREE.Color(0x6ab530);
const cMid   = new THREE.Color(0x82cc3c);
const cLight = new THREE.Color(0x9ee048);

function sampleHeight(wx: number, wz: number): number {
  return noise2D(wx * 0.011, wz * 0.011) * 3.5
       + noise2D(wx * 0.022, wz * 0.022) * 0.8;
}

export function getHeightAt(wx: number, wz: number): number {
  return sampleHeight(wx, wz);
}

export class Chunk {
  mesh: THREE.Mesh;
  readonly cx: number;
  readonly cz: number;

  constructor(cx: number, cz: number) {
    this.cx = cx;
    this.cz = cz;

    const geo = new THREE.PlaneGeometry(CHUNK_SIZE, CHUNK_SIZE, CHUNK_SEGMENTS, CHUNK_SEGMENTS);
    geo.rotateX(-Math.PI / 2);

    const pos = geo.attributes.position;
    const worldOffsetX = cx * CHUNK_SIZE;
    const worldOffsetZ = cz * CHUNK_SIZE;

    // Displace vertices and compute vertex colors in one pass
    const colors = new Float32Array(pos.count * 3);
    const col    = new THREE.Color();

    for (let i = 0; i < pos.count; i++) {
      const wx = pos.getX(i) + worldOffsetX;
      const wz = pos.getZ(i) + worldOffsetZ;
      pos.setY(i, sampleHeight(wx, wz));

      // Large patches blended with finer detail
      const t = (noiseColor(wx * 0.032, wz * 0.032) * 0.65
               + noiseColor(wx * 0.095, wz * 0.095) * 0.35) * 0.5 + 0.5;

      if (t < 0.5) {
        col.copy(cDark).lerp(cMid, t * 2.0);
      } else {
        col.copy(cMid).lerp(cLight, (t - 0.5) * 2.0);
      }

      colors[i * 3]     = col.r;
      colors[i * 3 + 1] = col.g;
      colors[i * 3 + 2] = col.b;
    }

    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();

    const mat = new THREE.MeshLambertMaterial({ vertexColors: true });

    this.mesh = new THREE.Mesh(geo, mat);
    this.mesh.position.set(worldOffsetX, 0, worldOffsetZ);
  }

  dispose() {
    this.mesh.geometry.dispose();
    (this.mesh.material as THREE.Material).dispose();
  }
}
