import * as THREE from 'three';

export class Sky {
  private clouds: THREE.Group[] = [];

  constructor(scene: THREE.Scene) {
    this.buildSky(scene);
    this.buildSun(scene);
    this.buildClouds(scene);
  }

  private buildSky(scene: THREE.Scene) {
    const geo = new THREE.SphereGeometry(400, 16, 8);
    geo.scale(-1, 1, 1);

    const mat = new THREE.ShaderMaterial({
      uniforms: {
        topColor:    { value: new THREE.Color(0x3a8fd4) },
        bottomColor: { value: new THREE.Color(0xc8e8ff) },
        horizon:     { value: 0.12 },
      },
      vertexShader: `
        varying vec3 vWorldPos;
        void main() {
          vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 topColor;
        uniform vec3 bottomColor;
        uniform float horizon;
        varying vec3 vWorldPos;
        void main() {
          float t = clamp((normalize(vWorldPos).y + horizon) / (1.0 + horizon), 0.0, 1.0);
          vec3 col = mix(bottomColor, topColor, pow(t, 0.6));
          gl_FragColor = vec4(col, 1.0);
        }
      `,
      side: THREE.FrontSide,
      depthWrite: false,
    });

    const dome = new THREE.Mesh(geo, mat);
    dome.renderOrder = -1;
    scene.add(dome);
  }

  private buildSun(scene: THREE.Scene) {
    const geo = new THREE.CircleGeometry(8, 16);
    const mat = new THREE.MeshBasicMaterial({
      color: 0xfffce0,
      transparent: true,
      opacity: 0.98,
      depthWrite: false,
      depthTest: false,
    });
    const sun = new THREE.Mesh(geo, mat);
    sun.position.set(160, 200, 80).normalize().multiplyScalar(390);
    sun.lookAt(0, 0, 0);
    scene.add(sun);

    const haloGeo = new THREE.CircleGeometry(22, 16);
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0xfffce0,
      transparent: true,
      opacity: 0.18,
      depthWrite: false,
      depthTest: false,
    });
    const halo = new THREE.Mesh(haloGeo, haloMat);
    halo.position.copy(sun.position);
    halo.lookAt(0, 0, 0);
    scene.add(halo);
  }

  private buildClouds(scene: THREE.Scene) {
    // Soft radial gradient baked into a canvas texture
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 128;
    const ctx = canvas.getContext('2d')!;
    const grd = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    grd.addColorStop(0,    'rgba(255,255,255,1.0)');
    grd.addColorStop(0.35, 'rgba(255,255,255,0.9)');
    grd.addColorStop(1,    'rgba(255,255,255,0)');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, 128, 128);

    const tex = new THREE.CanvasTexture(canvas);
    const mat = new THREE.SpriteMaterial({
      map: tex,
      transparent: true,
      depthWrite: false,
    });

    for (let i = 0; i < 22; i++) {
      const angle = (i / 22) * Math.PI * 2 + Math.random() * 0.3;
      const radius = 100 + Math.random() * 160;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const y = 42 + Math.random() * 22;

      const group = new THREE.Group();
      group.position.set(x, y, z);

      const puffs = 3 + Math.floor(Math.random() * 3);
      for (let p = 0; p < puffs; p++) {
        const sprite = new THREE.Sprite(mat);
        const w = 18 + Math.random() * 20;
        sprite.scale.set(w, w * (0.55 + Math.random() * 0.2), 1);
        sprite.position.set(
          (p - puffs / 2) * 13 + Math.random() * 5,
          Math.random() * 3 - 1,
          0
        );
        group.add(sprite);
      }

      scene.add(group);
      this.clouds.push(group);
    }
  }

  update(_elapsed: number) {
    for (const cloud of this.clouds) {
      cloud.position.x += 0.005;
      cloud.position.z += 0.002;
    }
  }
}
