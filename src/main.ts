import * as THREE from 'three';
import { FPSController } from './player/FPSController';
import { PostFXPipeline } from './postfx/Pipeline';
import { AudioManager } from './audio/AudioManager';
import { WorldManager } from './worlds/WorldManager';

// --- Renderer ---
const renderer = new THREE.WebGLRenderer({ antialias: false });
renderer.setPixelRatio(1); // we handle resolution in postfx
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// --- Scene ---
const scene = new THREE.Scene();

// --- Camera ---
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 500);
camera.position.set(0, 2, 0);

// --- Systems ---
const audio = new AudioManager();
const player = new FPSController(camera, renderer.domElement, audio);
const worldManager = new WorldManager(scene, camera);
const postfx = new PostFXPipeline(renderer, scene, camera);

// --- Pointer lock overlay ---
const overlay = document.getElementById('overlay')!;
overlay.addEventListener('click', () => {
  renderer.domElement.requestPointerLock();
  audio.init();
});
document.addEventListener('pointerlockchange', () => {
  const locked = !!document.pointerLockElement;
  overlay.style.display = locked ? 'none' : 'flex';
  locked ? audio.resume() : audio.suspend();
});

// --- Resize ---
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  postfx.resize(window.innerWidth, window.innerHeight);
});

// --- Loop ---
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);
  const elapsed = clock.getElapsedTime();

  if (document.pointerLockElement && !worldManager.isFalling) {
    player.update(dt, worldManager.activeWorld);
  }
  worldManager.update(dt, elapsed, camera.position, player.isMoving);
  postfx.render(elapsed);
}

animate();
