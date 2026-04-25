import * as THREE from 'three';
import { ChunkManager } from '../terrain/ChunkManager';
import { Sky } from '../sky/Sky';
import type { IWorld, PropCollider } from './IWorld';

export class GrassWorld implements IWorld {
  private chunkManager: ChunkManager | null = null;
  private sky = new Sky();
  private sun: THREE.DirectionalLight;
  private ambient: THREE.AmbientLight;

  constructor() {
    this.sun = new THREE.DirectionalLight(0xfff5cc, 1.4);
    this.sun.position.set(80, 120, 60);
    this.ambient = new THREE.AmbientLight(0x88aacc, 0.6);
  }

  attach(scene: THREE.Scene) {
    scene.fog = new THREE.Fog(0xe8f4ff, 120, 380);
    scene.background = null;
    scene.add(this.sun, this.ambient, this.sky.group);
    this.chunkManager = new ChunkManager(scene);
  }

  detach(scene: THREE.Scene) {
    scene.remove(this.sun, this.ambient, this.sky.group);
    this.chunkManager?.dispose();
    this.chunkManager = null;
  }

  update(_dt: number, elapsed: number, playerPos: THREE.Vector3) {
    this.chunkManager?.update(playerPos);
    this.sky.update(elapsed);
  }

  getHeightAt(x: number, z: number): number {
    return this.chunkManager?.getHeightAt(x, z) ?? 0;
  }

  getActiveProps(): PropCollider[] {
    return this.chunkManager?.getActiveProps() ?? [];
  }

  spawnPosition(): THREE.Vector3 {
    return new THREE.Vector3(0, 1.6, 0);
  }
}
