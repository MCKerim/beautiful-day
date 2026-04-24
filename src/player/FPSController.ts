import * as THREE from 'three';
import { ChunkManager } from '../terrain/ChunkManager';

const MOVE_SPEED   = 4;
const SPRINT_SPEED = 8;
const PLAYER_HEIGHT = 1.7;

// Normal walk
const BOB_SPEED_WALK    = 3.5;
const BOB_VERTICAL_WALK = 0.07;
const BOB_LATERAL_WALK  = 0.02;
const BOB_ROLL_WALK     = 0.006;

// Sprint
const BOB_SPEED_SPRINT    = 6;
const BOB_VERTICAL_SPRINT = 0.16;
const BOB_LATERAL_SPRINT  = 0.05;
const BOB_ROLL_SPRINT     = 0.014;

export class FPSController {
  private camera: THREE.Camera;
  private yaw = 0;
  private pitch = 0;
  private keys: Record<string, boolean> = {};
  private bobTime = 0;
  private baseY = PLAYER_HEIGHT;
  private lateralBob = 0; // tracked to apply as delta, avoiding world-space drift

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
    const moving   = this.keys['KeyW'] || this.keys['KeyS'] || this.keys['KeyA'] || this.keys['KeyD'];
    const sprinting = moving && (this.keys['ShiftLeft'] || this.keys['ShiftRight']);

    const forward = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    const right   = new THREE.Vector3( Math.cos(this.yaw), 0, -Math.sin(this.yaw));
    const vel     = new THREE.Vector3();

    if (this.keys['KeyW']) vel.addScaledVector(forward,  1);
    if (this.keys['KeyS']) vel.addScaledVector(forward, -1);
    if (this.keys['KeyA']) vel.addScaledVector(right,   -1);
    if (this.keys['KeyD']) vel.addScaledVector(right,    1);

    if (vel.lengthSq() > 0) vel.normalize();
    vel.multiplyScalar((sprinting ? SPRINT_SPEED : MOVE_SPEED) * dt);

    this.camera.position.add(vel);

    // Snap to terrain
    const groundY = terrain.getHeightAt(this.camera.position.x, this.camera.position.z);
    this.baseY = groundY + PLAYER_HEIGHT;

    // Head bob
    const bobSpeed    = sprinting ? BOB_SPEED_SPRINT    : BOB_SPEED_WALK;
    const bobVertical = sprinting ? BOB_VERTICAL_SPRINT : BOB_VERTICAL_WALK;
    const bobLateral  = sprinting ? BOB_LATERAL_SPRINT  : BOB_LATERAL_WALK;
    const bobRoll     = sprinting ? BOB_ROLL_SPRINT     : BOB_ROLL_WALK;

    let verticalOffset = 0;
    let newLateralBob  = 0;
    let roll           = 0;

    if (moving) {
      this.bobTime   += dt * bobSpeed;
      verticalOffset  = Math.sin(this.bobTime) * bobVertical;
      newLateralBob   = Math.sin(this.bobTime) * bobLateral;
      roll            = -Math.sin(this.bobTime * 0.5) * bobRoll;
    } else {
      this.bobTime = 0;
    }

    this.camera.position.y = this.baseY + verticalOffset;

    // Apply lateral sway as a delta in local right direction to avoid world drift
    const lateralDelta = newLateralBob - this.lateralBob;
    this.lateralBob    = newLateralBob;
    this.camera.position.addScaledVector(right, lateralDelta);

    // Rotation — roll tilt makes the left/right clearly readable to the eye
    const qYaw   = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);
    const qPitch = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), this.pitch);
    const qRoll  = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), roll);
    this.camera.quaternion.copy(qYaw).multiply(qPitch).multiply(qRoll);
  }
}
