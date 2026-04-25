import * as THREE from 'three';
import { getHeightAt, CHUNK_SIZE } from '../terrain/Chunk';
import { buildChair, buildTable, buildDoorframe, buildStreetlight, buildTV, buildCabinet } from './builders';

const SPAWN_CHANCE = 0.1;
const PROP_SCALE = 1.6;

// XZ cylinder radius for pushback collision (0 = walk-through), before scale
const COLLISION_RADII = [0.45, 0.85, 0.0, 0.18, 0.5, 0.5];

function seededRand(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const BUILDERS = [buildChair, buildTable, buildDoorframe, buildStreetlight, buildTV, buildCabinet];

function hashCoords(cx: number, cz: number): number {
  let h = Math.imul(cx ^ 0xdeadbeef, 0x9e3779b9) ^ Math.imul(cz ^ 0x12345678, 0x6c62272e);
  h ^= h >>> 16;
  h = Math.imul(h, 0x45d9f3b);
  h ^= h >>> 16;
  return h >>> 0;
}

export function spawnPropsForChunk(cx: number, cz: number): THREE.Group | null {
  const rand = seededRand(hashCoords(cx, cz));

  if (rand() > SPAWN_CHANCE) return null;

  const idx = Math.floor(rand() * BUILDERS.length);
  const group = BUILDERS[idx]();

  const wx = cx * CHUNK_SIZE + (rand() - 0.5) * CHUNK_SIZE * 0.8;
  const wz = cz * CHUNK_SIZE + (rand() - 0.5) * CHUNK_SIZE * 0.8;
  const underground = rand() < 0.5;
  const sink = underground ? 0.35 + rand() * 1.2 : 0.05 + rand() * 0.08;
  const wy = getHeightAt(wx, wz) - sink;

  group.scale.setScalar(PROP_SCALE);
  group.position.set(wx, wy, wz);
  group.rotation.y = rand() * Math.PI * 2;
  group.rotation.x = rand() * Math.PI * 2;
  group.rotation.z = rand() * Math.PI * 2;
  group.userData.collisionRadius = COLLISION_RADII[idx] * PROP_SCALE;

  // Doorframe: two post colliders so the opening stays passable
  // offsets are in pre-scale local space; localToWorld handles scale+rotation
  if (idx === 2) {
    group.userData.subColliders = [
      { lx: -0.5, lz: 0, radius: 0.15 },
      { lx:  0.5, lz: 0, radius: 0.15 },
    ];
  }

  return group;
}
