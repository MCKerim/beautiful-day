import * as THREE from 'three';
import { createNoise2D } from 'simplex-noise';

export const CHUNK_SIZE = 64;
export const CHUNK_SEGMENTS = 32;

const noise2D = createNoise2D();

function sampleHeight(wx: number, wz: number): number {
  // Layered noise for rolling hills
  let h = 0;
  h += noise2D(wx * 0.008, wz * 0.008) * 10;  // large hills
  h += noise2D(wx * 0.025, wz * 0.025) * 3;   // medium bumps
  h += noise2D(wx * 0.07,  wz * 0.07)  * 0.8; // small detail
  return h;
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

    // Displace vertices by noise
    for (let i = 0; i < pos.count; i++) {
      const wx = pos.getX(i) + worldOffsetX;
      const wz = pos.getZ(i) + worldOffsetZ;
      pos.setY(i, sampleHeight(wx, wz));
    }

    geo.computeVertexNormals();

    const mat = new THREE.MeshLambertMaterial({
      color: 0x5a9e3a,
    });

    this.mesh = new THREE.Mesh(geo, mat);
    this.mesh.position.set(worldOffsetX, 0, worldOffsetZ);
  }

  dispose() {
    this.mesh.geometry.dispose();
    (this.mesh.material as THREE.Material).dispose();
  }
}
