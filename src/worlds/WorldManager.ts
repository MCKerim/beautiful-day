import * as THREE from 'three';
import { GrassWorld } from './GrassWorld';
import { FlatWorld } from './FlatWorld';
import type { IWorld } from './IWorld';

export class WorldManager {
  private grass: GrassWorld;
  private flat: FlatWorld;
  private current: IWorld;
  private scene: THREE.Scene;
  private camera: THREE.Camera;

  private clipTimer = 0;
  private nextClipAt: number;

  private falling = false;
  private fallVelocity = 0;
  private fallElapsed = 0;
  private overlayShown = false;

  private overlay: HTMLDivElement;

  constructor(scene: THREE.Scene, camera: THREE.Camera) {
    this.scene = scene;
    this.camera = camera;

    this.grass = new GrassWorld();
    this.flat = new FlatWorld();

    this.current = this.grass;
    this.grass.attach(scene);
    this.nextClipAt = this.randomClipTime();
    this.overlay = this.createOverlay();
  }

  get activeWorld(): IWorld { return this.current; }
  get isFalling(): boolean { return this.falling; }

  switchWorld() {
    if (!this.falling) this.triggerClip();
  }

  update(dt: number, elapsed: number, playerPos: THREE.Vector3, isMoving: boolean) {
    if (this.falling) {
      this.updateFall(dt);
      return;
    }

    this.current.update(dt, elapsed, playerPos);

    if (isMoving) {
      this.clipTimer += dt;
      if (this.clipTimer >= this.nextClipAt) {
        this.triggerClip();
      }
    }
  }

  private updateFall(dt: number) {
    this.fallElapsed += dt;
    this.fallVelocity += 28 * dt;
    this.camera.position.y -= this.fallVelocity * dt;

    if (this.fallElapsed >= 0.55 && !this.overlayShown) {
      this.overlay.style.opacity = '1';
      this.overlayShown = true;
    }

    if (this.fallElapsed >= 1.05) {
      this.swapWorld();
      this.falling = false;
      this.fallElapsed = 0;
      this.fallVelocity = 0;
      this.overlayShown = false;
      setTimeout(() => { this.overlay.style.opacity = '0'; }, 80);
    }
  }

  private triggerClip() {
    this.falling = true;
    this.fallElapsed = 0;
    this.fallVelocity = 0;
    this.overlayShown = false;
    this.clipTimer = 0;
  }

  private swapWorld() {
    const next: IWorld = this.current === this.grass ? this.flat : this.grass;
    this.current.detach(this.scene);
    this.current = next;
    this.current.attach(this.scene);
    this.camera.position.copy(this.current.spawnPosition());
    this.nextClipAt = this.randomClipTime();
  }

  private randomClipTime(): number {
    return 30 + Math.random() * 90;
  }

  private createOverlay(): HTMLDivElement {
    const div = document.createElement('div');
    div.style.cssText = 'position:fixed;inset:0;background:black;opacity:0;transition:opacity 0.45s ease;pointer-events:none;z-index:100';
    document.body.appendChild(div);
    return div;
  }
}
