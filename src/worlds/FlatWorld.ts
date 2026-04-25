import * as THREE from 'three';
import type { IWorld, PropCollider } from './IWorld';

const FOG_COLOR = 0xfff5cc;

export class FlatWorld implements IWorld {
  private floor: THREE.Mesh;
  private ambient: THREE.AmbientLight;
  private overhead: THREE.DirectionalLight;

  constructor() {
    const geo = new THREE.PlaneGeometry(4000, 4000);
    const mat = new THREE.MeshLambertMaterial({ color: 0xc0a050 });
    this.floor = new THREE.Mesh(geo, mat);
    this.floor.rotation.x = -Math.PI / 2;

    // Harsh fluorescent overhead
    this.ambient = new THREE.AmbientLight(0xfffde8, 1.8);
    this.overhead = new THREE.DirectionalLight(0xfffff8, 0.4);
    this.overhead.position.set(0, 1, 0);
  }

  attach(scene: THREE.Scene) {
    scene.fog = new THREE.Fog(FOG_COLOR, 6, 70);
    scene.background = new THREE.Color(FOG_COLOR);
    scene.add(this.floor, this.ambient, this.overhead);
  }

  detach(scene: THREE.Scene) {
    scene.remove(this.floor, this.ambient, this.overhead);
    scene.background = null;
  }

  update(_dt: number, _elapsed: number, _playerPos: THREE.Vector3) {}

  getHeightAt(_x: number, _z: number): number { return 0; }

  getActiveProps(): PropCollider[] { return []; }

  spawnPosition(): THREE.Vector3 { return new THREE.Vector3(0, 1.6, 0); }
}
