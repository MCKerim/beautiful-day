import * as THREE from 'three';

export class Sky {
  private clouds: THREE.Mesh[] = [];

  constructor(scene: THREE.Scene) {
    this.buildSky(scene);
    this.buildSun(scene);
    this.buildClouds(scene);
  }

  private buildSky(scene: THREE.Scene) {
    // Large sphere with gradient shader as the sky dome
    const geo = new THREE.SphereGeometry(400, 16, 8);
    geo.scale(-1, 1, 1); // invert so we see it from inside

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
          // slight overexposure on the lower sky
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
    // Blown-out sun disk — just a bright sprite
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

    // Soft halo
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
    const cloudMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.82,
      depthWrite: false,
    });

    for (let i = 0; i < 18; i++) {
      const angle = (i / 18) * Math.PI * 2;
      const radius = 80 + Math.random() * 120;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const y = 38 + Math.random() * 20;

      const cloud = this.makeCloud(x, y, z, cloudMat);
      scene.add(cloud);
      this.clouds.push(cloud);
    }
  }

  private makeCloud(x: number, y: number, z: number, mat: THREE.MeshBasicMaterial): THREE.Mesh {
    // Cloud = a few overlapping low-poly quads
    const group = new THREE.Group();
    const puffs = 3 + Math.floor(Math.random() * 3);

    for (let i = 0; i < puffs; i++) {
      const w = 10 + Math.random() * 14;
      const h = 4 + Math.random() * 5;
      const geo = new THREE.PlaneGeometry(w, h);
      const puff = new THREE.Mesh(geo, mat);
      puff.position.set((i - puffs / 2) * 7 + Math.random() * 4, Math.random() * 2, 0);
      group.add(puff);
    }

    const proxy = new THREE.Mesh(new THREE.BufferGeometry(), mat);
    proxy.position.set(x, y, z);
    proxy.add(group);
    return proxy;
  }

  update(_elapsed: number) {
    // Slowly drift clouds
    for (let i = 0; i < this.clouds.length; i++) {
      this.clouds[i].position.x += 0.005;
      this.clouds[i].position.z += 0.002;
    }
  }
}
