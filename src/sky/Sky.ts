import * as THREE from 'three';

export class Sky {
  readonly group = new THREE.Group();

  constructor() {
    this.buildSky();
    this.buildSun();
  }

  private buildSky() {
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
    this.group.add(dome);
  }

  private buildSun() {
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
    this.group.add(sun);

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
    this.group.add(halo);
  }

  update(_elapsed: number) {
  }
}
