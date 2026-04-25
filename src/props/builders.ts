import * as THREE from 'three';

function mat(hex: number): THREE.MeshLambertMaterial {
  return new THREE.MeshLambertMaterial({ color: hex });
}

function box(w: number, h: number, d: number, color: number): THREE.Mesh {
  return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color));
}

export function buildChair(): THREE.Group {
  const g = new THREE.Group();
  const SEAT = 0xc8b48a;
  const LEG  = 0xa09070;

  const legGeo = new THREE.BoxGeometry(0.06, 0.45, 0.06);
  const legMat = mat(LEG);
  const legOffsets: [number, number][] = [[-0.21, -0.21], [0.21, -0.21], [-0.21, 0.21], [0.21, 0.21]];
  for (const [x, z] of legOffsets) {
    const l = new THREE.Mesh(legGeo, legMat);
    l.position.set(x, 0.225, z);
    g.add(l);
  }

  const seat = box(0.52, 0.05, 0.52, SEAT);
  seat.position.set(0, 0.475, 0);
  g.add(seat);

  const back = box(0.52, 0.55, 0.05, SEAT);
  back.position.set(0, 0.8, -0.235);
  g.add(back);

  return g;
}

export function buildTable(): THREE.Group {
  const g = new THREE.Group();
  const TOP = 0xdddbd2;
  const LEG = 0xb0aea8;

  const top = box(1.2, 0.06, 0.8, TOP);
  top.position.set(0, 0.78, 0);
  g.add(top);

  const legGeo = new THREE.BoxGeometry(0.07, 0.75, 0.07);
  const legMat = mat(LEG);
  const legOffsets: [number, number][] = [[-0.55, -0.35], [0.55, -0.35], [-0.55, 0.35], [0.55, 0.35]];
  for (const [x, z] of legOffsets) {
    const l = new THREE.Mesh(legGeo, legMat);
    l.position.set(x, 0.375, z);
    g.add(l);
  }

  return g;
}

export function buildDoorframe(): THREE.Group {
  const g = new THREE.Group();
  const COLOR = 0xc8bc9a;

  const left = box(0.1, 2.2, 0.12, COLOR);
  left.position.set(-0.5, 1.1, 0);
  g.add(left);

  const right = box(0.1, 2.2, 0.12, COLOR);
  right.position.set(0.5, 1.1, 0);
  g.add(right);

  const top = box(1.12, 0.1, 0.12, COLOR);
  top.position.set(0, 2.25, 0);
  g.add(top);

  return g;
}

export function buildStreetlight(): THREE.Group {
  const g = new THREE.Group();
  const POLE = 0x7a7a7a;

  const pole = box(0.08, 3.8, 0.08, POLE);
  pole.position.set(0, 1.9, 0);
  g.add(pole);

  const arm = box(0.06, 0.06, 0.9, POLE);
  arm.position.set(0, 3.8, -0.45);
  g.add(arm);

  const head = box(0.3, 0.12, 0.5, 0x4a4a3a);
  head.position.set(0, 3.72, -0.85);
  g.add(head);

  return g;
}

export function buildTV(): THREE.Group {
  const g = new THREE.Group();

  const stand = box(0.28, 0.06, 0.18, 0x222222);
  stand.position.set(0, 0.03, 0.08);
  g.add(stand);

  const body = box(0.82, 0.62, 0.42, 0x2a2a2a);
  body.position.set(0, 0.37, 0);
  g.add(body);

  const screen = box(0.64, 0.46, 0.02, 0x10101e);
  screen.position.set(0, 0.38, 0.215);
  g.add(screen);

  return g;
}

export function buildCabinet(): THREE.Group {
  const g = new THREE.Group();
  const BODY = 0x8a9a88;

  const body = box(0.52, 1.25, 0.56, BODY);
  body.position.set(0, 0.625, 0);
  g.add(body);

  const divMat = mat(0x6a7a68);
  const divGeo = new THREE.BoxGeometry(0.5, 0.02, 0.54);
  for (const y of [0.34, 0.68, 1.02]) {
    const div = new THREE.Mesh(divGeo, divMat);
    div.position.set(0, y, 0);
    g.add(div);
  }

  const handleMat = mat(0xaaaaaa);
  const handleGeo = new THREE.BoxGeometry(0.12, 0.025, 0.025);
  for (const y of [0.17, 0.51, 0.85, 1.19]) {
    const h = new THREE.Mesh(handleGeo, handleMat);
    h.position.set(0, y, 0.28);
    g.add(h);
  }

  return g;
}
