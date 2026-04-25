import * as THREE from 'three';
import { Chunk, CHUNK_SIZE, getHeightAt } from './Chunk';
import { spawnPropsForChunk } from '../props/PropSpawner';

const LOAD_RADIUS = 3; // chunks in each direction

export class ChunkManager {
  private scene: THREE.Scene;
  private chunks = new Map<string, Chunk>();
  private props = new Map<string, THREE.Group>();

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  private key(cx: number, cz: number): string {
    return `${cx},${cz}`;
  }

  update(playerPos: THREE.Vector3) {
    const pcx = Math.round(playerPos.x / CHUNK_SIZE);
    const pcz = Math.round(playerPos.z / CHUNK_SIZE);

    // Load needed chunks
    for (let dx = -LOAD_RADIUS; dx <= LOAD_RADIUS; dx++) {
      for (let dz = -LOAD_RADIUS; dz <= LOAD_RADIUS; dz++) {
        const cx = pcx + dx;
        const cz = pcz + dz;
        const k = this.key(cx, cz);
        if (!this.chunks.has(k)) {
          const chunk = new Chunk(cx, cz);
          this.scene.add(chunk.mesh);
          this.chunks.set(k, chunk);

          const propGroup = spawnPropsForChunk(cx, cz);
          if (propGroup) {
            this.scene.add(propGroup);
            this.props.set(k, propGroup);
          }
        }
      }
    }

    // Unload distant chunks
    for (const [k, chunk] of this.chunks) {
      if (
        Math.abs(chunk.cx - pcx) > LOAD_RADIUS + 1 ||
        Math.abs(chunk.cz - pcz) > LOAD_RADIUS + 1
      ) {
        this.scene.remove(chunk.mesh);
        chunk.dispose();
        this.chunks.delete(k);

        const propGroup = this.props.get(k);
        if (propGroup) {
          this.scene.remove(propGroup);
          propGroup.traverse((obj) => {
            if (obj instanceof THREE.Mesh) {
              obj.geometry.dispose();
              (obj.material as THREE.Material).dispose();
            }
          });
          this.props.delete(k);
        }
      }
    }
  }

  // Used by FPS controller to get ground height at a world position
  getHeightAt(wx: number, wz: number): number {
    return getHeightAt(wx, wz);
  }
}
