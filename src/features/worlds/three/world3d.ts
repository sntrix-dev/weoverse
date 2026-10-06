// design: src/world/world3d.js `<weo-world>` — the rehearsal surface, walkable. Ported from a
// custom element to a plain class the React stage owns (mount → setScene → dispose). A WeO in a
// world is its orb in its ring, drifting in a soap bubble; every figure in the crowd is one
// cohort's demand, and when a rehearsal runs the figures that convert are the collect-through.
import * as THREE from 'three';
import {
  envField,
  envPlaza,
  envRoom,
  envStreet,
  flagstoneTexture as flagstones,
  type EnvCtx,
  type Theme,
} from './env';

const THEMES: Record<string, Theme> = {
  daylight: {
    sky: 0x5fa8ee,
    sky2: 0xeaf4ff,
    fog: 0xd9e8f7,
    ground: 0xc9b48f,
    built: 0xf1e3c8,
    built2: 0xd9a06a,
    key: 0xfff1d6,
    keyI: 3.2,
    amb: 0x9cc4f0,
    ambI: 1.4,
    accent: 0x3a95f2,
    night: false,
  },
  dusk: {
    sky: 0x2c2246,
    sky2: 0x6b3b62,
    fog: 0x3a2a4d,
    ground: 0x2a2338,
    built: 0x413553,
    built2: 0x35293f,
    key: 0xffb27a,
    keyI: 2.2,
    amb: 0x6b5aa0,
    ambI: 1.1,
    accent: 0xd946ef,
    night: true,
  },
  night: {
    sky: 0x0a0e1c,
    sky2: 0x141d33,
    fog: 0x0d1526,
    ground: 0x131a2b,
    built: 0x1d2740,
    built2: 0x161f33,
    key: 0xffd6a0,
    keyI: 1.5,
    amb: 0x2a3c66,
    ambI: 0.9,
    accent: 0xf7c62b,
    night: true,
  },
  studio: {
    sky: 0xf2f3f5,
    sky2: 0xffffff,
    fog: 0xeceef2,
    ground: 0xdfe2e8,
    built: 0xe8eaee,
    built2: 0xd8dce3,
    key: 0xffffff,
    keyI: 3,
    amb: 0xbfc6d2,
    ambI: 1.8,
    accent: 0x22c55e,
    night: false,
  },
};
/* each world is an archetype of place */
const ARCH: Record<string, string> = {
  night: 'street-dense',
  daylight: 'plaza',
  dusk: 'field',
  studio: 'room',
};

const SKIN = [0xf1c9a5, 0xe0ac86, 0xc68a5c, 0xa86a42, 0x7d4a2b, 0x5b3520, 0xf6d7bd, 0xb87a52];
const HAIR = [0x1d1612, 0x3a2418, 0x5c3a22, 0x8a5a3a, 0xc9a24a, 0xa855f7, 0xe11d48, 0x2b2b30];
const LEGS = [0x2f4a7a, 0x3b5a8f, 0x1f2f4f, 0x6b5a45, 0x8b7355, 0x3a3a40, 0x9a7d5a];

/** deterministic — the same world every time you enter it */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
}

function bubbleMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.FrontSide,
    uniforms: { t: { value: 0 } },
    vertexShader:
      'varying vec3 vN; varying vec3 vV; void main(){ vec4 mv = modelViewMatrix * vec4(position,1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }',
    fragmentShader:
      'uniform float t; varying vec3 vN; varying vec3 vV; void main(){ float f = 1.0 - max(dot(vN, vV), 0.0); float rim = pow(f, 3.2); vec3 iri = 0.5 + 0.5 * cos(6.2831 * (f * 1.6 + t * 0.05 + vec3(0.0, 0.33, 0.67))); vec3 col = mix(vec3(1.0), iri, 0.28); float spec = pow(max(dot(reflect(-vV, vN), normalize(vec3(-0.5, 0.8, 0.4))), 0.0), 40.0); gl_FragColor = vec4(col + spec, rim * 0.6 + 0.04 + spec * 0.6); }',
  });
}

export interface WorldMarker {
  id: string;
  name: string;
  type: string;
  img: string | null;
  os: number;
  tone: string;
  subject?: boolean;
  provisional?: boolean;
}
export interface WorldCohort {
  id: string;
  color: string;
  on: boolean;
  intent: number;
  share: number;
}
export interface WorldScene {
  theme: string;
  fidelity: number;
  markers: WorldMarker[];
  cohorts: WorldCohort[];
  subjectId: string | null;
}

type PartKey = 'head' | 'hair' | 'torso' | 'hips' | 'armL' | 'armR' | 'legL' | 'legR';
type PartSet = Record<PartKey, THREE.InstancedMesh>;
interface Agent {
  x: number;
  z: number;
  sp: number;
  ph: number;
  h: number;
  tx: number;
  tz: number;
  idx: number;
  set: PartSet;
  state: 'wander' | 'pause' | 'paint' | 'approach' | 'pass' | 'landed';
  t: number;
  face: number;
  p: THREE.Vector3;
}
interface FreeBubble {
  x: number;
  y: number;
  z: number;
  r: number;
  ph: number;
  sp: number;
}

/** WebGL is available here (the flat stage stands in when it is not). */
export function canWebGL(): boolean {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

export class WeoWorld {
  private host: HTMLElement;
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(74, 1, 0.1, 700);
  private raycaster = new THREE.Raycaster();
  private ro: ResizeObserver;
  private clock = new THREE.Clock();
  private bubbleMat = bubbleMaterial();
  private cfg: WorldScene = { theme: 'night', fidelity: 3, markers: [], cohorts: [], subjectId: null };
  private world: THREE.Group | null = null;
  private mGroup: THREE.Group | null = null;
  private crowd: THREE.Group | null = null;
  private markerMeshes: THREE.Group[] = [];
  private agents: Agent[] = [];
  private free: FreeBubble[] | null = null;
  private freeMesh: THREE.InstancedMesh | null = null;
  private sway: THREE.Object3D[] = [];
  private ctx: EnvCtx = { easels: [], arch: 'street-dense' };
  private keys: Record<string, boolean> = {};
  private look = { yaw: 0, pitch: -0.02 };
  private pos = new THREE.Vector3(0, 1.62, 13);
  private tour = true;
  private focused = false;
  private ptr: { x: number; y: number } | null = null;
  private subjectPos: THREE.Vector3 | null = null;
  private dead = false;
  private raf = 0;
  private partGeo: Record<string, THREE.BufferGeometry> | null = null;
  private M = new THREE.Matrix4();
  private q = new THREE.Quaternion();
  private q2 = new THREE.Quaternion();
  private v = new THREE.Vector3();
  private s = new THREE.Vector3();
  private onSelect: (id: string) => void;
  private offs: (() => void)[] = [];

  constructor(host: HTMLElement, onSelect: (id: string) => void) {
    this.host = host;
    this.onSelect = onSelect;
    const r = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    r.outputColorSpace = THREE.SRGBColorSpace;
    r.toneMapping = THREE.ACESFilmicToneMapping;
    r.toneMappingExposure = 1.05;
    r.domElement.style.cssText =
      'display:block;position:absolute;inset:0;width:100%;height:100%;border-radius:inherit;cursor:grab;touch-action:none';
    host.appendChild(r.domElement);
    this.renderer = r;
    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(host);
    this.resize();
    this.bind();
    this.loop();
  }

  dispose() {
    this.dead = true;
    cancelAnimationFrame(this.raf);
    this.ro.disconnect();
    this.offs.forEach((f) => f());
    if (this.world) this.disposeObj(this.world);
    this.bubbleMat.dispose();
    Object.values(this.partGeo ?? {}).forEach((g) => g.dispose());
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }

  private resize() {
    const b = this.host.getBoundingClientRect();
    const w = Math.round(b.width || 640);
    const h = Math.round(b.height || 380);
    this.renderer.setSize(w, h, false);
    const aspect = w / Math.max(1, h);
    this.camera.aspect = aspect;
    const hFov = (82 * Math.PI) / 180;
    const vFov = 2 * Math.atan(Math.tan(hFov / 2) / Math.max(0.55, aspect));
    this.camera.fov = Math.min(88, Math.max(52, (vFov * 180) / Math.PI));
    this.camera.updateProjectionMatrix();
  }

  private bind() {
    const el = this.renderer.domElement;
    let dragging = false;
    let lx = 0;
    let ly = 0;
    let moved = 0;
    const on = <K extends keyof HTMLElementEventMap>(
      t: HTMLElement,
      k: K,
      f: (e: HTMLElementEventMap[K]) => void,
      o?: AddEventListenerOptions,
    ) => {
      t.addEventListener(k, f, o);
      this.offs.push(() => t.removeEventListener(k, f));
    };
    on(el, 'pointerdown', (e) => {
      dragging = true;
      moved = 0;
      lx = e.clientX;
      ly = e.clientY;
      this.tour = false;
      el.setPointerCapture(e.pointerId);
      el.style.cursor = 'grabbing';
    });
    on(el, 'pointermove', (e) => {
      const r = el.getBoundingClientRect();
      this.ptr = {
        x: ((e.clientX - r.left) / r.width) * 2 - 1,
        y: -((e.clientY - r.top) / r.height) * 2 + 1,
      };
      if (!dragging) return;
      const dx = e.clientX - lx;
      const dy = e.clientY - ly;
      lx = e.clientX;
      ly = e.clientY;
      moved += Math.abs(dx) + Math.abs(dy);
      this.look.yaw -= dx * 0.0042;
      this.look.pitch = Math.max(-0.55, Math.min(0.42, this.look.pitch - dy * 0.0035));
    });
    on(el, 'pointerup', () => {
      dragging = false;
      el.style.cursor = 'grab';
      if (moved < 5) this.pick();
    });
    on(
      el,
      'wheel',
      (e) => {
        e.preventDefault();
        this.tour = false;
        const f = new THREE.Vector3(-Math.sin(this.look.yaw), 0, -Math.cos(this.look.yaw));
        this.pos.addScaledVector(f, -e.deltaY * 0.012);
        this.clampPos();
      },
      { passive: false },
    );
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (!['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'shift'].includes(k))
        return;
      // the keys walk only while the pointer is over the world — never while typing elsewhere
      if (!this.focused) return;
      if (e.type === 'keydown') this.tour = false;
      this.keys[k] = e.type === 'keydown';
      e.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('keyup', onKey);
    this.offs.push(() => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('keyup', onKey);
    });
    on(this.host, 'pointerenter', () => {
      this.focused = true;
    });
    on(this.host, 'pointerleave', () => {
      this.focused = false;
      this.keys = {};
    });
  }

  private clampPos() {
    this.pos.x = Math.max(-10, Math.min(10, this.pos.x));
    this.pos.z = Math.max(-44, Math.min(18, this.pos.z));
    this.pos.y = 1.62;
  }

  private colour(v: string, fallback: string) {
    const s = (v ?? '').trim();
    if (!s) return fallback;
    if (s.startsWith('var(')) {
      const name = s.slice(4, -1).split(',')[0]!.trim();
      return getComputedStyle(this.host).getPropertyValue(name).trim() || fallback;
    }
    return s;
  }

  private pick() {
    if (!this.ptr) return;
    this.raycaster.setFromCamera(new THREE.Vector2(this.ptr.x, this.ptr.y), this.camera);
    const hits = this.raycaster.intersectObjects(this.markerMeshes, true);
    let o: THREE.Object3D | null = hits[0]?.object ?? null;
    let id: string | null = null;
    while (o && !id) {
      id = (o.userData.id as string | undefined) ?? null;
      o = o.parent;
    }
    if (id) {
      this.select(id);
      this.onSelect(id);
    }
  }

  resetView() {
    this.pos.set(0, 1.62, 13);
    this.look.yaw = 0;
    this.look.pitch = -0.02;
    this.tour = true;
  }

  select(id: string | null) {
    this.cfg.subjectId = id;
    this.markerMeshes.forEach((g) =>
      (g.userData.setSel as ((on: boolean) => void) | undefined)?.(g.userData.id === id),
    );
  }

  setScene(next: WorldScene) {
    const prev = this.cfg;
    this.cfg = { ...next };
    if (prev.theme !== next.theme || prev.fidelity !== next.fidelity || !this.world) this.buildWorld();
    this.buildMarkers();
    this.buildCrowd();
    this.select(next.subjectId);
  }

  private buildWorld() {
    const c = this.cfg;
    const T = THEMES[c.theme] ?? THEMES.night!;
    const fid = c.fidelity;
    if (this.world) {
      this.scene.remove(this.world);
      this.disposeObj(this.world);
    }
    this.mGroup = null;
    this.crowd = null;
    const root = new THREE.Group();
    this.world = root;
    this.scene.add(root);
    const arch = ARCH[c.theme] ?? 'street-dense';
    const indoors = arch === 'room';
    this.ctx = { easels: [], arch };
    this.scene.background = new THREE.Color(T.sky);
    this.scene.fog = indoors ? null : new THREE.Fog(T.fog, fid <= 1 ? 46 : 70, fid <= 1 ? 130 : 240);
    this.renderer.shadowMap.enabled = fid >= 4;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;

    const sky = new THREE.Mesh(
      new THREE.SphereGeometry(320, 32, 16),
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        uniforms: { a: { value: new THREE.Color(T.sky) }, b: { value: new THREE.Color(T.sky2) } },
        vertexShader:
          'varying float h; void main(){ h = normalize(position).y; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
        fragmentShader:
          'uniform vec3 a; uniform vec3 b; varying float h; void main(){ gl_FragColor = vec4(mix(b, a, clamp(h*1.5+0.35,0.0,1.0)), 1.0); }',
      }),
    );
    if (!indoors) root.add(sky);
    const rand = rng(9021 + c.fidelity * 7);
    if (arch === 'plaza' && fid >= 2) {
      const cm = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.9,
        fog: false,
      });
      for (let i = 0; i < 9; i++) {
        const cl = new THREE.Mesh(new THREE.SphereGeometry(6 + rand() * 8, 10, 6), cm);
        cl.scale.set(2.2, 0.5, 1);
        cl.position.set(-120 + rand() * 240, 48 + rand() * 18, -110 - rand() * 80);
        root.add(cl);
      }
    }

    root.add(new THREE.HemisphereLight(T.amb, T.ground, T.ambI));
    const key = new THREE.DirectionalLight(T.key, T.keyI);
    key.position.set(arch === 'plaza' ? 22 : -24, 40, 18);
    if (fid >= 4) {
      key.castShadow = true;
      key.shadow.mapSize.set(2048, 2048);
      const s = key.shadow.camera;
      s.left = -40;
      s.right = 40;
      s.top = 40;
      s.bottom = -40;
      s.near = 1;
      s.far = 140;
      key.shadow.bias = -0.0012;
    }
    root.add(key);

    const gMat =
      arch === 'plaza' && fid >= 2
        ? new THREE.MeshStandardMaterial({ map: flagstones(rand), roughness: 0.9 })
        : new THREE.MeshStandardMaterial({
            color:
              arch === 'field' ? new THREE.Color(T.ground).lerp(new THREE.Color(0x5f7a4a), 0.55) : T.ground,
            roughness: indoors ? 0.5 : 0.92,
          });
    if (gMat.map) gMat.map.repeat.set(60, 60);
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), gMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = fid >= 4;
    root.add(ground);
    if (arch !== 'plaza') {
      const lane = new THREE.Mesh(
        new THREE.PlaneGeometry(arch === 'field' ? 22 : 15, 96),
        new THREE.MeshStandardMaterial({ color: arch === 'field' ? 0x8c7a5c : T.built2, roughness: 0.95 }),
      );
      lane.rotation.x = -Math.PI / 2;
      lane.position.set(0, 0.012, -10);
      lane.receiveShadow = fid >= 4;
      root.add(lane);
    }

    if (arch === 'room') envRoom(root, T, fid, rand, this.ctx);
    else if (arch === 'field') envField(root, T, fid, rand, this.ctx);
    else if (arch === 'plaza') envPlaza(root, T, fid, rand, this.ctx);
    else envStreet(root, T, fid, rand, true, this.ctx);

    if (!indoors && fid >= 2) {
      const n = fid >= 3 ? 40 : 18;
      const im = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 18, 14), this.bubbleMat, n);
      im.frustumCulled = false;
      this.free = [];
      const m = new THREE.Matrix4();
      for (let i = 0; i < n; i++) {
        const b = {
          x: (rand() * 2 - 1) * 11,
          y: 1 + rand() * 7,
          z: -46 + rand() * 62,
          r: 0.12 + rand() * 0.3,
          ph: rand() * 6.28,
          sp: 0.15 + rand() * 0.25,
        };
        this.free.push(b);
        m.compose(new THREE.Vector3(b.x, b.y, b.z), new THREE.Quaternion(), new THREE.Vector3(b.r, b.r, b.r));
        im.setMatrixAt(i, m);
      }
      root.add(im);
      this.freeMesh = im;
    } else {
      this.free = null;
      this.freeMesh = null;
    }
    this.sway = [];
    root.traverse((o) => {
      if (o.userData.flag || o.userData.fire) this.sway.push(o);
    });
  }

  private buildMarkers() {
    const c = this.cfg;
    const T = THEMES[c.theme] ?? THEMES.night!;
    const fid = c.fidelity;
    if (!this.world) return;
    if (this.mGroup) {
      this.world.remove(this.mGroup);
      this.disposeObj(this.mGroup);
    }
    const g = new THREE.Group();
    this.mGroup = g;
    this.world.add(g);
    this.markerMeshes = [];
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin('anonymous');
    const spots = [
      [-4.4, 8],
      [4.6, -1],
      [-5, -11],
      [5.2, -20],
      [-4.2, -29],
      [5, -38],
      [0, -46],
    ] as const;
    c.markers.slice(0, spots.length).forEach((m, i) => {
      const tone = new THREE.Color(this.colour(m.tone, '#D946EF'));
      const node = new THREE.Group();
      node.position.set(spots[i]![0], 0, spots[i]![1]);
      node.userData.id = m.id;
      const R = m.subject ? 1.15 : 0.9;
      const discMat = new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false });
      const disc = new THREE.Mesh(new THREE.CircleGeometry(R * 0.72, 48), discMat);
      disc.userData.id = m.id;
      if (m.img)
        loader.load(
          m.img,
          (t) => {
            t.colorSpace = THREE.SRGBColorSpace;
            discMat.map = t;
            discMat.needsUpdate = true;
          },
          undefined,
          () => discMat.color.copy(tone),
        );
      else discMat.color.copy(tone);
      const ringMat = new THREE.MeshStandardMaterial({
        color: tone,
        roughness: 0.35,
        metalness: 0.2,
        emissive: tone,
        emissiveIntensity: T.night ? 0.65 : 0.18,
      });
      const ring = new THREE.Mesh(new THREE.TorusGeometry(R * 0.8, R * 0.055, 10, 56), ringMat);
      const bubble = new THREE.Mesh(new THREE.SphereGeometry(R, 32, 24), this.bubbleMat);
      bubble.userData.id = m.id;
      const glowMat = new THREE.MeshBasicMaterial({
        color: tone,
        transparent: true,
        opacity: T.night ? 0.14 : 0.06,
        depthWrite: false,
      });
      const glow = new THREE.Mesh(new THREE.CircleGeometry(R * 1.6, 32), glowMat);
      const shade = new THREE.Mesh(
        new THREE.CircleGeometry(R * 0.7, 28),
        new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.16, depthWrite: false }),
      );
      shade.rotation.x = -Math.PI / 2;
      shade.position.y = 0.02;
      const head = new THREE.Group();
      head.position.y = 2.4 + R * 0.4;
      head.add(glow, disc, ring, bubble);
      node.add(shade, head);
      if (fid >= 4) {
        const l = new THREE.PointLight(tone, m.subject ? 9 : 5, 12, 2.4);
        l.position.y = 2.9;
        node.add(l);
      }
      node.userData.head = head;
      node.userData.base = 2.4 + R * 0.4;
      node.userData.phase = i * 1.7;
      node.userData.shade = shade;
      node.userData.setSel = (on: boolean) => {
        ringMat.emissiveIntensity = on ? (T.night ? 1.5 : 0.6) : T.night ? 0.65 : 0.18;
        node.scale.setScalar(on ? 1.18 : 1);
        glowMat.opacity = on ? (T.night ? 0.3 : 0.14) : T.night ? 0.14 : 0.06;
      };
      g.add(node);
      this.markerMeshes.push(node);
      if (m.subject) this.subjectPos = node.position.clone();
    });
  }

  /* the crowd: articulated figures, one instanced part-set per cohort */
  private buildCrowd() {
    const c = this.cfg;
    const fid = c.fidelity;
    if (!this.world) return;
    if (this.crowd) {
      this.world.remove(this.crowd);
      this.disposeObj(this.crowd);
    }
    const cohorts = c.cohorts.filter((x) => x.on);
    const root = new THREE.Group();
    this.crowd = root;
    this.world.add(root);
    this.agents = [];
    const cap = fid <= 1 ? 36 : fid === 2 ? 90 : 140;
    const total = Math.min(
      cap,
      cohorts.reduce((s, x) => s + Math.max(3, Math.round(x.share * cap)), 0),
    );
    const G = (this.partGeo ??= {
      head: new THREE.SphereGeometry(0.13, 14, 12),
      hair: new THREE.SphereGeometry(0.145, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.62),
      torso: new THREE.CapsuleGeometry(0.17, 0.34, 4, 10),
      hips: new THREE.CapsuleGeometry(0.16, 0.12, 3, 10),
      arm: new THREE.CapsuleGeometry(0.05, 0.5, 3, 8),
      leg: new THREE.CapsuleGeometry(0.07, 0.56, 3, 8),
    });
    const PARTS: PartKey[] = ['head', 'hair', 'torso', 'hips', 'armL', 'armR', 'legL', 'legR'];
    const col = new THREE.Color();
    cohorts.forEach((co) => {
      const n = Math.max(3, Math.round(co.share * total));
      const r = rng(co.id.length * 977 + n);
      const cohortCol = new THREE.Color(this.colour(co.color, '#3A95F2'));
      const set = {} as PartSet;
      PARTS.forEach((p) => {
        const geo = G[p.replace(/[LR]$/, '')]!;
        const im = new THREE.InstancedMesh(
          geo,
          new THREE.MeshStandardMaterial({
            color: 0xffffff,
            roughness: p === 'hair' ? 0.55 : 0.8,
            metalness: 0,
          }),
          n,
        );
        im.castShadow = fid >= 4;
        im.frustumCulled = false;
        set[p] = im;
        root.add(im);
      });
      for (let i = 0; i < n; i++) {
        const skin = SKIN[(r() * SKIN.length) | 0]!;
        const hair = HAIR[(r() * HAIR.length) | 0]!;
        const legs = LEGS[(r() * LEGS.length) | 0]!;
        const shirt = cohortCol.clone().offsetHSL((r() - 0.5) * 0.04, (r() - 0.5) * 0.2, (r() - 0.5) * 0.22);
        set.head.setColorAt(i, col.set(skin));
        set.armL.setColorAt(i, col.set(skin));
        set.armR.setColorAt(i, col.set(skin));
        set.hair.setColorAt(i, col.set(hair));
        set.torso.setColorAt(i, shirt);
        set.hips.setColorAt(i, col.set(legs));
        set.legL.setColorAt(i, col.set(legs));
        set.legR.setColorAt(i, col.set(legs));
        const painter = this.ctx.easels.length > 0 && r() < 0.12;
        const spot = painter ? this.ctx.easels[(r() * this.ctx.easels.length) | 0]! : null;
        this.agents.push({
          x: spot ? spot.x : (r() * 2 - 1) * 8,
          z: spot ? spot.z : -46 + r() * 62,
          sp: 0.7 + r() * 0.8,
          ph: r() * 6.28,
          h: 0.9 + r() * 0.2,
          tx: (r() * 2 - 1) * 8,
          tz: -46 + r() * 62,
          idx: i,
          set,
          state: painter ? 'paint' : 'wander',
          t: r() * 3,
          face: r() * 6.28,
          p: new THREE.Vector3(),
        });
      }
      PARTS.forEach((p) => {
        if (set[p].instanceColor) set[p].instanceColor.needsUpdate = true;
      });
    });
  }

  /** The rehearsal, played: converters walk to the subject and gather at it. */
  runSim({ through, subjectId }: { through: number; subjectId: string | null }) {
    const sub = this.markerMeshes.find((m) => m.userData.id === subjectId) ?? this.markerMeshes[0];
    if (!sub) return;
    this.subjectPos = sub.position.clone();
    const list = this.agents.filter((a) => a.state !== 'paint');
    for (let i = list.length - 1; i > 0; i--) {
      const j = (Math.random() * (i + 1)) | 0;
      [list[i], list[j]] = [list[j]!, list[i]!];
    }
    const want = Math.round(list.length * Math.max(0.02, Math.min(0.98, through)));
    list.forEach((a, i) => {
      if (i < want) {
        a.state = 'approach';
        const ang = Math.random() * 6.28;
        const rr = 1.4 + Math.random() * 1.6;
        a.tx = this.subjectPos!.x + Math.cos(ang) * rr;
        a.tz = this.subjectPos!.z + Math.sin(ang) * rr;
        a.t = 0;
      } else {
        a.state = 'pass';
        a.tx = (Math.random() * 2 - 1) * 8;
        a.tz = this.subjectPos!.z + 14 + Math.random() * 20;
      }
    });
  }

  private pose(a: Agent, y: number, yaw: number, phase: number, moving: boolean, time: number) {
    const { M, q, v, s, q2 } = this;
    const h = a.h;
    const i = a.idx;
    const set = a.set;
    const Y = new THREE.Vector3(0, 1, 0);
    const X = new THREE.Vector3(1, 0, 0);
    const swing = moving ? Math.sin(phase) * 0.42 : Math.sin(time * 1.3 + a.ph) * 0.04;
    const body = q.setFromAxisAngle(Y, yaw);
    a.p.set(a.x, y, a.z);
    const place = (mesh: THREE.InstancedMesh, dx: number, dy: number, dz: number, rx: number) => {
      v.set(dx, dy, dz).applyQuaternion(body).add(a.p);
      q2.setFromAxisAngle(X, rx).premultiply(body);
      s.set(h, h, h);
      M.compose(v, q2, s);
      mesh.setMatrixAt(i, M);
    };
    const hipY = 0.86 * h;
    const legOff = 0.34 * h;
    (
      [
        [set.legL, -0.1, swing],
        [set.legR, 0.1, -swing],
      ] as const
    ).forEach(([m, dx, sw]) => {
      v.set(dx * h, hipY - Math.cos(sw) * legOff, Math.sin(sw) * legOff)
        .applyQuaternion(body)
        .add(a.p);
      q2.setFromAxisAngle(X, sw).premultiply(body);
      s.set(h, h, h);
      M.compose(v, q2, s);
      m.setMatrixAt(i, M);
    });
    place(set.hips, 0, hipY + 0.02 * h, 0, 0);
    place(set.torso, 0, hipY + 0.36 * h, 0, moving ? 0.04 : 0);
    const armOff = 0.28 * h;
    const shY = hipY + 0.6 * h;
    const paint = a.state === 'paint';
    (
      [
        [set.armL, -0.22, paint ? -0.4 : -swing * 0.7],
        [set.armR, 0.22, paint ? -1.5 + Math.sin(time * 2.2 + a.ph) * 0.35 : swing * 0.7],
      ] as const
    ).forEach(([m, dx, sw]) => {
      v.set(dx * h, shY - Math.cos(sw) * armOff, Math.sin(sw) * armOff)
        .applyQuaternion(body)
        .add(a.p);
      q2.setFromAxisAngle(X, sw).premultiply(body);
      s.set(h, h, h);
      M.compose(v, q2, s);
      m.setMatrixAt(i, M);
    });
    const headY = hipY + 0.8 * h;
    place(set.head, 0, headY, 0, 0);
    place(set.hair, 0, headY + 0.03 * h, -0.015 * h, -0.12);
  }

  private step(dt: number, time: number) {
    const sp = (this.keys.shift ? 9 : 4.6) * dt;
    let fwd = 0;
    let side = 0;
    if (this.keys.w || this.keys.arrowup) fwd += 1;
    if (this.keys.s || this.keys.arrowdown) fwd -= 1;
    if (this.keys.a || this.keys.arrowleft) side -= 1;
    if (this.keys.d || this.keys.arrowright) side += 1;
    if (this.tour) {
      this.pos.z -= dt * 1.2;
      if (this.pos.z < -40) this.pos.z = 14;
      this.look.yaw = Math.sin(time * 0.09) * 0.14;
    }
    if (fwd || side) {
      const f = new THREE.Vector3(-Math.sin(this.look.yaw), 0, -Math.cos(this.look.yaw));
      const rt = new THREE.Vector3(Math.cos(this.look.yaw), 0, -Math.sin(this.look.yaw));
      this.pos.addScaledVector(f, fwd * sp).addScaledVector(rt, side * sp);
    }
    this.clampPos();
    const dir = new THREE.Vector3(
      -Math.sin(this.look.yaw),
      Math.sin(this.look.pitch),
      -Math.cos(this.look.yaw),
    );
    this.camera.position.copy(this.pos);
    this.camera.lookAt(this.pos.clone().add(dir));
    this.bubbleMat.uniforms.t!.value = time;

    this.markerMeshes.forEach((n) => {
      const h = n.userData.head as THREE.Group;
      const ph = n.userData.phase as number;
      h.position.y = (n.userData.base as number) + Math.sin(time * 0.9 + ph) * 0.22;
      h.position.x = Math.sin(time * 0.5 + ph) * 0.3;
      h.position.z = Math.cos(time * 0.42 + ph) * 0.3;
      h.rotation.y = Math.atan2(this.pos.x - n.position.x, this.pos.z - n.position.z);
      (n.userData.shade as THREE.Mesh).position.set(h.position.x, 0.02, h.position.z);
    });
    if (this.free && this.freeMesh) {
      const { M, q } = this;
      this.free.forEach((b, i) => {
        b.y += b.sp * dt;
        b.x += Math.sin(time * 0.7 + b.ph) * dt * 0.3;
        if (b.y > 9) {
          b.y = 0.6;
          b.x = (Math.random() * 2 - 1) * 11;
          b.z = -46 + Math.random() * 62;
        }
        M.compose(new THREE.Vector3(b.x, b.y, b.z), q.identity(), new THREE.Vector3(b.r, b.r, b.r));
        this.freeMesh!.setMatrixAt(i, M);
      });
      this.freeMesh.instanceMatrix.needsUpdate = true;
    }
    this.sway.forEach((o) => {
      if (o.userData.flag)
        o.rotation.y = Math.sin(time * 1.6 + (o.userData.flag as { ph: number }).ph) * 0.35;
      else if (o.userData.fire) o.scale.setScalar(0.9 + Math.sin(time * 9 + o.position.z) * 0.12);
    });

    const sub = this.subjectPos;
    this.agents.forEach((a) => {
      let moving = false;
      let yaw = a.face;
      if (a.state === 'paint') {
        if (this.ctx.arch === 'plaza') a.face = Math.PI;
        yaw = a.face;
      } else {
        const dx = a.tx - a.x;
        const dz = a.tz - a.z;
        let d = Math.hypot(dx, dz);
        if (d < 0.5) {
          if (a.state === 'approach' && sub) {
            a.state = 'landed';
            a.t = 0;
          } else if (a.state !== 'landed' && a.state !== 'pause') {
            a.state = 'pause';
            a.t = 0;
          }
        }
        if (a.state === 'landed' && sub) {
          a.t += dt;
          yaw = a.face = Math.atan2(sub.x - a.x, sub.z - a.z);
          if (a.t > 6) {
            a.state = 'wander';
            a.tx = (Math.random() * 2 - 1) * 8;
            a.tz = -46 + Math.random() * 62;
          }
        } else if (a.state === 'pause') {
          a.t += dt;
          if (a.t > 1.5 + (a.ph % 2)) {
            a.state = 'wander';
            a.tx = (Math.random() * 2 - 1) * 8;
            a.tz = -46 + Math.random() * 62;
          }
        } else {
          const vv = a.sp * dt * (a.state === 'approach' ? 1.35 : 1);
          d = Math.max(0.001, d);
          a.x += (dx / d) * vv;
          a.z += (dz / d) * vv;
          moving = true;
          const want = Math.atan2(dx, dz);
          let dd = want - a.face;
          dd = Math.atan2(Math.sin(dd), Math.cos(dd));
          a.face += dd * Math.min(1, dt * 6);
          yaw = a.face;
        }
      }
      a.ph += moving ? dt * a.sp * 7.5 : 0;
      const y = moving
        ? Math.abs(Math.sin(a.ph)) * 0.035
        : a.state === 'landed'
          ? Math.abs(Math.sin(a.t * 5)) * 0.05
          : 0;
      this.pose(a, y, yaw, a.ph, moving, time);
    });
    const touched = new Set<PartSet>();
    this.agents.forEach((a) => {
      if (touched.has(a.set)) return;
      Object.values(a.set).forEach((m) => {
        m.instanceMatrix.needsUpdate = true;
      });
      touched.add(a.set);
    });
  }

  private loop() {
    if (this.dead) return;
    this.raf = requestAnimationFrame(() => this.loop());
    const dt = Math.min(0.05, this.clock.getDelta());
    if (this.world) {
      this.step(dt, this.clock.elapsedTime);
      this.renderer.render(this.scene, this.camera);
    }
  }

  private disposeObj(obj: THREE.Object3D) {
    const shared = new Set<unknown>(Object.values(this.partGeo ?? {}));
    obj.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (mesh.geometry && !shared.has(mesh.geometry)) mesh.geometry.dispose();
      const mats = mesh.material ? (Array.isArray(mesh.material) ? mesh.material : [mesh.material]) : [];
      mats.forEach((m) => {
        if (m === this.bubbleMat) return;
        const map = (m as THREE.MeshStandardMaterial).map;
        if (map) map.dispose();
        m.dispose();
      });
    });
  }
}
