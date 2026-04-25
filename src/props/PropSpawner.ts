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

export function spawnPropsForChunk(cx: number, cz: number): THREE.Group | null {
  const seed = (cx * 73856093) ^ (cz * 19349663);
  const rand = seededRand(seed);

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

  return group;
}
