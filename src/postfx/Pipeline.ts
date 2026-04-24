import * as THREE from 'three';

// Internal render resolution — lower = more pixelated/VHS
const RENDER_SCALE = 0.45;

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

          // --- Barrel distortion (subtle) ---
          vec2 centered = uv * 2.0 - 1.0;
          float r2 = dot(centered, centered);
          centered *= 1.0 + 0.018 * r2;
          uv = centered * 0.5 + 0.5;

          // Clamp to avoid sampling outside
          if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
            gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
            return;
          }

          // --- Chromatic aberration ---
          float ca = 0.003;
          float r = texture2D(tDiffuse, uv + vec2( ca,  0.0)).r;
          float g = texture2D(tDiffuse, uv).g;
          float b = texture2D(tDiffuse, uv + vec2(-ca,  0.0)).b;
          vec3 col = vec3(r, g, b);

          // --- Color grading: slightly warm, washed out ---
          col = pow(col, vec3(0.88));          // slight gamma lift (blown out)
          col *= vec3(1.04, 1.0, 0.93);        // warm tint
          col = mix(col, vec3(0.55), 0.07);    // desaturate a touch

          // --- Film grain ---
          float grain = rand(uv + fract(uTime * 0.31)) * 0.10 - 0.05;
          col += grain;

          // --- Scan lines (horizontal, subtle) ---
          float line = sin(uv.y * uRes.y * 3.14159) * 0.5 + 0.5;
          col *= 0.93 + 0.07 * line;

          // --- Occasional horizontal tracking noise (rare) ---
          float trackBand = step(0.997, rand(vec2(floor(uTime * 8.0), uv.y * 12.0)));
          col += trackBand * 0.06 * vec3(1.0, 0.95, 0.8);

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
