import * as THREE from 'three';

export interface PropCollider {
  position: THREE.Vector3;
  radius: number;
}

export interface IWorld {
  attach(scene: THREE.Scene): void;
  detach(scene: THREE.Scene): void;
  update(dt: number, elapsed: number, playerPos: THREE.Vector3): void;
  getHeightAt(x: number, z: number): number;
  getActiveProps(): PropCollider[];
  spawnPosition(): THREE.Vector3;
}
