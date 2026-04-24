import * as THREE from 'three';

// Internal render resolution — camcorder is sharper than VHS
const RENDER_SCALE = 0.72;

export class PostFXPipeline {
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.Camera;

  // Off-screen low-res target
  private renderTarget: THREE.WebGLRenderTarget;

  // Full-screen quad for compositing
  private quadScene: THREE.Scene;
  private quadCamera: THREE.OrthographicCamera;
  private material: THREE.ShaderMaterial;

  constructor(renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.Camera) {
    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;

    const w = Math.floor(window.innerWidth  * RENDER_SCALE);
    const h = Math.floor(window.innerHeight * RENDER_SCALE);

    this.renderTarget = new THREE.WebGLRenderTarget(w, h, {
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
      format: THREE.RGBAFormat,
    });

    this.quadCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.quadScene  = new THREE.Scene();

    this.material = new THREE.ShaderMaterial({
      uniforms: {
        tDiffuse: { value: this.renderTarget.texture },
        uTime:    { value: 0 },
        uRes:     { value: new THREE.Vector2(w, h) },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position.xy, 0.0, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform float uTime;
        uniform vec2 uRes;
        varying vec2 vUv;

        float rand(vec2 co) {
          return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
        }

        void main() {
          vec2 uv = vUv;

          // --- Minimal lens barrel (consumer optics) ---
          vec2 centered = uv * 2.0 - 1.0;
          float r2 = dot(centered, centered);
          centered *= 1.0 + 0.006 * r2;
          uv = centered * 0.5 + 0.5;

          if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
            gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
            return;
          }

          vec3 col = texture2D(tDiffuse, uv).rgb;

          // --- AGC highlight compression (auto-gain control) ---
          col = col / (col + vec3(0.14));
          col *= 1.18;

          // --- Saturation boost (camcorder colors are punchy) ---
          float lum = dot(col, vec3(0.2126, 0.7152, 0.0722));
          col = mix(vec3(lum), col, 1.22);

          // --- Fine digital noise ---
          float grain = rand(uv + fract(uTime * 0.61)) * 0.032 - 0.016;
          col += grain;

          // --- Interlacing (every other horizontal line slightly dim) ---
          float interlace = mod(floor(vUv.y * uRes.y), 2.0);
          col *= 0.975 + 0.025 * interlace;

          gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
        }
      `,
      depthTest: false,
      depthWrite: false,
    });

    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.material);
    this.quadScene.add(quad);
  }

  resize(w: number, h: number) {
    const rw = Math.floor(w * RENDER_SCALE);
    const rh = Math.floor(h * RENDER_SCALE);
    this.renderTarget.setSize(rw, rh);
    this.material.uniforms.uRes.value.set(rw, rh);
  }

  render(elapsed: number) {
    this.material.uniforms.uTime.value = elapsed;

    // 1. Render scene into low-res target
    this.renderer.setRenderTarget(this.renderTarget);
    this.renderer.render(this.scene, this.camera);

    // 2. Composite to screen with post effects
    this.renderer.setRenderTarget(null);
    this.renderer.render(this.quadScene, this.quadCamera);
  }
}
