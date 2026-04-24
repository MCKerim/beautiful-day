import * as THREE from 'three';
import { ChunkManager } from '../terrain/ChunkManager';

const MOVE_SPEED = 6;
const PLAYER_HEIGHT = 1.7;
const HEAD_BOB_SPEED = 7;
const HEAD_BOB_AMOUNT = 0.055;

export class FPSController {
  private camera: THREE.Camera;
  private yaw = 0;
  private pitch = 0;
  private keys: Record<string, boolean> = {};
  private bobTime = 0;
  private baseY = PLAYER_HEIGHT;

  constructor(camera: THREE.Camera, canvas: HTMLElement) {
    this.camera = camera;

    document.addEventListener('keydown', (e) => { this.keys[e.code] = true; });
    document.addEventListener('keyup',   (e) => { this.keys[e.code] = false; });

    document.addEventListener('mousemove', (e) => {
      if (document.pointerLockElement !== canvas) return;
      this.yaw   -= e.movementX * 0.0018;
      this.pitch -= e.movementY * 0.0018;
      this.pitch  = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, this.pitch));
    });
  }

  update(dt: number, terrain: ChunkManager) {
    const moving = this.keys['KeyW'] || this.keys['KeyS'] || this.keys['KeyA'] || this.keys['KeyD'];

    // Movement direction from yaw only
    const forward = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    const right   = new THREE.Vector3( Math.cos(this.yaw), 0, -Math.sin(this.yaw));
    const vel     = new THREE.Vector3();

    if (this.keys['KeyW']) vel.addScaledVector(forward,  1);
    if (this.keys['KeyS']) vel.addScaledVector(forward, -1);
    if (this.keys['KeyA']) vel.addScaledVector(right,   -1);
    if (this.keys['KeyD']) vel.addScaledVector(right,    1);

    if (vel.lengthSq() > 0) vel.normalize();
    vel.multiplyScalar(MOVE_SPEED * dt);

    this.camera.position.add(vel);

    // Snap to terrain
    const groundY = terrain.getHeightAt(this.camera.position.x, this.camera.position.z);
    this.baseY = groundY + PLAYER_HEIGHT;

    // Head bob
    let bobOffset = 0;
    if (moving) {
      this.bobTime += dt * HEAD_BOB_SPEED;
      bobOffset = Math.sin(this.bobTime) * HEAD_BOB_AMOUNT;
    } else {
      this.bobTime = 0;
    }

    this.camera.position.y = this.baseY + bobOffset;

    // Apply rotation via quaternion (yaw then pitch)
    const qYaw   = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);
    const qPitch  = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), this.pitch);
    this.camera.quaternion.copy(qYaw).multiply(qPitch);
  }
}
