import * as THREE from 'three';
import { ChunkManager } from './terrain/ChunkManager';
import { Sky } from './sky/Sky';
import { FPSController } from './player/FPSController';
import { PostFXPipeline } from './postfx/Pipeline';
import { AudioManager } from './audio/AudioManager';

// --- Renderer ---
const renderer = new THREE.WebGLRenderer({ antialias: false });
renderer.setPixelRatio(1); // we handle resolution in postfx
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// --- Scene ---
const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0xe8f4ff, 120, 380);

// --- Camera ---
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 500);
camera.position.set(0, 2, 0);

// --- Lighting ---
const sun = new THREE.DirectionalLight(0xfff5cc, 1.4);
sun.position.set(80, 120, 60);
scene.add(sun);

const ambient = new THREE.AmbientLight(0x88aacc, 0.6);
scene.add(ambient);

// --- Systems ---
const audio = new AudioManager();
const sky = new Sky(scene);
const chunkManager = new ChunkManager(scene);
const player = new FPSController(camera, renderer.domElement, audio);
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

  if (document.pointerLockElement) player.update(dt, chunkManager);
  chunkManager.update(camera.position);
  sky.update(elapsed);
  postfx.render(elapsed);
}

animate();
