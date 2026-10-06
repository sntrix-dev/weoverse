// design: src/world/world3d-env.js — the four archetypes of place, rebuilt from scratch on each
// switch so it reads as travel. Ported to TS on `three`; geometry, palette and layout unchanged.
import * as THREE from 'three';

export type Rand = () => number;
export interface Theme {
  sky: number;
  sky2: number;
  fog: number;
  ground: number;
  built: number;
  built2: number;
  key: number;
  keyI: number;
  amb: number;
  ambI: number;
  accent: number;
  night: boolean;
}
export interface EnvCtx {
  easels: THREE.Vector3[];
  arch: string;
}

const srgb = <T extends THREE.Texture>(t: T): T => {
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
};
const canvas = (w: number, h: number) => {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return { c, x: c.getContext('2d')! };
};
const std = (p: THREE.MeshStandardMaterialParameters) => new THREE.MeshStandardMaterial(p);

/* ── procedural surfaces (canvas → texture) ── */
export function flagstoneTexture(rand: Rand) {
  const { c, x } = canvas(512, 512);
  x.fillStyle = '#b39a76';
  x.fillRect(0, 0, 512, 512);
  const tones = ['#cdb894', '#c4ac86', '#d6c19c', '#bfa47c', '#c9b18a', '#d2bd98'];
  for (let row = 0; row < 8; row++) {
    let xx = row % 2 ? -34 : 0;
    while (xx < 512) {
      const w = 54 + rand() * 46;
      const h = 64;
      x.fillStyle = tones[(rand() * tones.length) | 0]!;
      x.fillRect(xx + 3, row * 64 + 3, w - 6, h - 6);
      x.fillStyle = 'rgba(255,255,255,.08)';
      x.fillRect(xx + 3, row * 64 + 3, w - 6, 5);
      xx += w;
    }
  }
  for (let i = 0; i < 1400; i++) {
    x.fillStyle = `rgba(80,60,40,${rand() * 0.12})`;
    x.fillRect(rand() * 512, rand() * 512, 2, 2);
  }
  const t = srgb(new THREE.CanvasTexture(c));
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 4;
  return t;
}
function stripeTexture(a: string, b: string) {
  const { c, x } = canvas(128, 16);
  for (let i = 0; i < 8; i++) {
    x.fillStyle = i % 2 ? a : b;
    x.fillRect(i * 16, 0, 16, 16);
  }
  const t = srgb(new THREE.CanvasTexture(c));
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}
function stuccoTexture(hex: string, rand: Rand) {
  const { c, x } = canvas(128, 128);
  x.fillStyle = hex;
  x.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 900; i++) {
    x.fillStyle = `rgba(${rand() > 0.5 ? 255 : 60},${rand() > 0.5 ? 240 : 40},${rand() > 0.5 ? 220 : 30},${rand() * 0.07})`;
    x.fillRect(rand() * 128, rand() * 128, 2, 2);
  }
  const t = srgb(new THREE.CanvasTexture(c));
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}
function windowTexture(night: boolean, accent: number, rand: Rand) {
  const { c, x } = canvas(64, 128);
  x.fillStyle = night ? '#0f1626' : '#cfd7e3';
  x.fillRect(0, 0, 64, 128);
  const lit = new THREE.Color(accent);
  for (let row = 0; row < 12; row++)
    for (let col = 0; col < 5; col++) {
      const on = rand() > (night ? 0.42 : 0.72);
      x.fillStyle = on
        ? `rgba(${(lit.r * 255) | 0},${(lit.g * 255) | 0},${(lit.b * 255) | 0},${night ? 0.92 : 0.4})`
        : night
          ? 'rgba(255,255,255,.05)'
          : 'rgba(90,105,130,.28)';
      x.fillRect(6 + col * 11, 6 + row * 10, 7, 6);
    }
  const t = srgb(new THREE.CanvasTexture(c));
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

/* ── shared props ── */
function tree(x: number, z: number, scale: number, fid: number, broad: boolean) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.16 * scale, 0.22 * scale, 2.6 * scale, 7),
    std({ color: 0x6b563f, roughness: 1 }),
  );
  trunk.position.y = 1.3 * scale;
  trunk.castShadow = fid >= 4;
  g.add(trunk);
  const leafMat = std({ color: broad ? 0x4e7a3a : 0x5f8f45, roughness: 1, flatShading: true });
  if (broad) {
    // a cluster of crowns reads as foliage rather than a gem
    (
      [
        [0, 3.4, 0, 1.7],
        [0.9, 3.0, 0.4, 1.2],
        [-0.8, 3.1, -0.3, 1.25],
        [0.1, 4.2, -0.5, 1.1],
      ] as const
    ).forEach(([dx, dy, dz, r]) => {
      const m = new THREE.Mesh(new THREE.IcosahedronGeometry(r * scale, 1), leafMat);
      m.position.set(dx * scale, dy * scale, dz * scale);
      m.castShadow = fid >= 4;
      g.add(m);
    });
  } else {
    const crown = new THREE.Mesh(new THREE.ConeGeometry(1.15 * scale, 3.2 * scale, 7), leafMat);
    crown.position.y = 3.9 * scale;
    crown.castShadow = fid >= 4;
    g.add(crown);
  }
  return g;
}
function planter(x: number, z: number, fid: number, rand: Rand, tone?: number) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  const pot = new THREE.Mesh(
    new THREE.CylinderGeometry(0.42, 0.34, 0.6, 12),
    std({ color: 0xb8623a, roughness: 0.9 }),
  );
  pot.position.y = 0.3;
  pot.castShadow = fid >= 4;
  g.add(pot);
  const leaf = std({ color: 0x3f7a3a, roughness: 1, flatShading: true });
  const bloom = std({
    color: tone ?? [0xff5fa2, 0xff7a59, 0xf7c62b, 0xe94b8a][(rand() * 4) | 0],
    roughness: 0.8,
  });
  for (let i = 0; i < 7; i++) {
    const a = rand() * 6.28;
    const r = rand() * 0.34;
    const l = new THREE.Mesh(new THREE.IcosahedronGeometry(0.2 + rand() * 0.14, 0), leaf);
    l.position.set(Math.cos(a) * r, 0.72 + rand() * 0.2, Math.sin(a) * r);
    g.add(l);
    if (i % 2) {
      const b = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 6), bloom);
      b.position.set(Math.cos(a) * r * 1.1, 0.92 + rand() * 0.18, Math.sin(a) * r * 1.1);
      g.add(b);
    }
  }
  return g;
}
/* papel picado: one string of coloured pennants sagging between two anchors */
function bunting(
  root: THREE.Object3D,
  x1: number,
  x2: number,
  y: number,
  z: number,
  count: number,
  colours: string[],
  rand: Rand,
) {
  const mats = colours.map((c) => std({ color: c, roughness: 0.95, side: THREE.DoubleSide }));
  const wire = new THREE.Mesh(
    new THREE.CylinderGeometry(0.012, 0.012, Math.abs(x2 - x1), 4),
    std({ color: 0x3a3a3a }),
  );
  wire.rotation.z = Math.PI / 2;
  wire.position.set((x1 + x2) / 2, y - 0.3, z);
  root.add(wire);
  for (let f = 0; f < count; f++) {
    const u = (f + 0.5) / count;
    const x = x1 + (x2 - x1) * u;
    const sag = Math.sin(u * Math.PI) * 0.7;
    const flag = new THREE.Mesh(
      new THREE.PlaneGeometry(0.62, 0.8),
      mats[(f + ((rand() * 2) | 0)) % mats.length],
    );
    flag.position.set(x, y - sag - 0.45, z);
    flag.rotation.y = rand() * 0.3 - 0.15;
    flag.userData.flag = { ph: rand() * 6.28 };
    root.add(flag);
  }
}
function easel(x: number, z: number, ry: number, fid: number, rand: Rand) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  g.rotation.y = ry;
  const wood = std({ color: 0x8a6a45, roughness: 0.95 });
  (
    [
      [-0.32, 0.12],
      [0.32, 0.12],
      [0, -0.42],
    ] as const
  ).forEach(([dx, dz]) => {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.7, 5), wood);
    leg.position.set(dx, 0.85, dz);
    leg.rotation.x = dz < 0 ? 0.28 : -0.1;
    g.add(leg);
  });
  const { c, x: x2 } = canvas(128, 96);
  x2.fillStyle = '#f7f3ea';
  x2.fillRect(0, 0, 128, 96);
  ['#f7c62b', '#3a95f2', '#e94b8a', '#22c55e', '#ff7a59'].forEach((col) => {
    x2.fillStyle = col;
    x2.beginPath();
    x2.ellipse(20 + rand() * 90, 20 + rand() * 56, 12 + rand() * 18, 8 + rand() * 12, rand() * 3, 0, 6.28);
    x2.fill();
  });
  const cv = new THREE.Mesh(
    new THREE.PlaneGeometry(0.8, 0.6),
    std({ map: srgb(new THREE.CanvasTexture(c)), roughness: 0.9, side: THREE.DoubleSide }),
  );
  cv.position.set(0, 1.25, 0.16);
  cv.rotation.x = -0.1;
  cv.castShadow = fid >= 4;
  g.add(cv);
  return g;
}
function cafeTable(x: number, z: number, fid: number, rand: Rand, tone: string) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  const metal = std({ color: 0x3b3f47, roughness: 0.5, metalness: 0.4 });
  const top = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.05, 18), metal);
  top.position.y = 0.74;
  g.add(top);
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.74, 6), metal);
  stem.position.y = 0.37;
  g.add(stem);
  for (let i = 0; i < 2; i++) {
    const a = rand() * 6.28;
    const ch = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.04, 0.4), metal);
    ch.position.set(Math.cos(a) * 0.85, 0.46, Math.sin(a) * 0.85);
    g.add(ch);
    const bk = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.04), metal);
    bk.position.set(Math.cos(a) * 1.02, 0.68, Math.sin(a) * 1.02);
    bk.rotation.y = -a + Math.PI / 2;
    g.add(bk);
  }
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 2.4, 6), metal);
  pole.position.y = 1.2;
  g.add(pole);
  const map = stripeTexture(tone, '#fff7ea');
  map.repeat.set(4, 1);
  const um = new THREE.Mesh(
    new THREE.ConeGeometry(1.3, 0.5, 8, 1, true),
    std({ map, roughness: 0.9, side: THREE.DoubleSide }),
  );
  um.position.y = 2.5;
  um.castShadow = fid >= 4;
  g.add(um);
  return g;
}

/* ── the plaza: built + open + sunlit (the Discover clip's square) ── */
export function envPlaza(root: THREE.Object3D, _T: Theme, fid: number, rand: Rand, ctx: EnvCtx) {
  const creams = [0xf3e6cc, 0xefd9b5, 0xf6efe0, 0xe8c79a, 0xdfae7a, 0xf1dcc2];
  const roofMat = std({ color: 0xb8623a, roughness: 0.95 });
  const shutterMat = std({ color: 0x3f7a55, roughness: 0.85 });
  const glassMat = std({ color: 0x2a3446, roughness: 0.35, metalness: 0.2 });
  const railMat = std({ color: 0x2e2e33, roughness: 0.6, metalness: 0.5 });
  const trimMat = std({ color: 0xfaf4e6, roughness: 0.95 });
  const palette = ['#e94b8a', '#3a95f2', '#f7c62b', '#22c55e', '#ff7a59', '#a855f7', '#ffffff'];
  const setback = 12;

  const hillMat = std({ color: 0x6e9a58, roughness: 1, flatShading: true });
  for (let i = 0; i < 7; i++) {
    const h = new THREE.Mesh(new THREE.SphereGeometry(28 + rand() * 22, 12, 8), hillMat);
    h.scale.set(1.6, 0.45, 1);
    h.position.set(-90 + i * 32 + rand() * 10, -4, -120 - rand() * 30);
    root.add(h);
  }

  const count = fid <= 1 ? 8 : fid === 2 ? 12 : 16;
  for (let i = 0; i < count; i++) {
    const side = i % 2 ? 1 : -1;
    const z = -44 + (i >> 1) * (fid <= 1 ? 12 : 8.4) + rand() * 1.4;
    const w = 6.4 + rand() * 3;
    const d = 7 + rand() * 4;
    const floors = 2 + ((rand() * 2) | 0);
    const h = floors * 3.3;
    const cream = creams[i % creams.length]!;
    const wallMat = std({
      map: fid >= 3 ? stuccoTexture('#' + cream.toString(16).padStart(6, '0'), rand) : null,
      color: fid >= 3 ? 0xffffff : cream,
      roughness: 0.95,
    });
    const house = new THREE.Group();
    house.position.set(side * (setback + w / 2), 0, z);
    const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wallMat);
    body.position.y = h / 2;
    body.castShadow = fid >= 4;
    body.receiveShadow = fid >= 4;
    house.add(body);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(Math.max(w, d) * 0.78, 1.6, 4), roofMat);
    roof.position.y = h + 0.8;
    roof.rotation.y = Math.PI / 4;
    roof.scale.set(w / Math.max(w, d), 1, d / Math.max(w, d));
    roof.castShadow = fid >= 4;
    house.add(roof);
    const eave = new THREE.Mesh(new THREE.BoxGeometry(w + 0.5, 0.18, d + 0.5), roofMat);
    eave.position.y = h + 0.05;
    house.add(eave);
    if (fid >= 2) {
      const fx = -side * (w / 2 + 0.02);
      const cols = Math.max(2, Math.round(w / 2.4));
      for (let f = 0; f < floors; f++)
        for (let k = 0; k < cols; k++) {
          const wz = -d / 2 + (k + 0.5) * (d / cols);
          const wy = f * 3.3 + 2.1;
          if (f === 0 && k === Math.floor(cols / 2)) {
            const door = new THREE.Mesh(
              new THREE.PlaneGeometry(1.1, 2.3),
              std({ color: 0x5b3b25, roughness: 0.9 }),
            );
            door.position.set(fx, 1.15, wz);
            door.rotation.y = (-side * Math.PI) / 2;
            house.add(door);
            continue;
          }
          const win = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 1.4), glassMat);
          win.position.set(fx, wy, wz);
          win.rotation.y = (-side * Math.PI) / 2;
          house.add(win);
          [-0.7, 0.7].forEach((o) => {
            const sh = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.4, 0.42), shutterMat);
            sh.position.set(fx - side * 0.02, wy, wz + o);
            house.add(sh);
          });
          if (f > 0 && fid >= 3 && (k + f) % 2 === 0) {
            const slab = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.12, 1.6), trimMat);
            slab.position.set(fx - side * 0.4, wy - 0.72, wz);
            slab.castShadow = fid >= 4;
            house.add(slab);
            for (let b = -3; b <= 3; b++) {
              const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.9, 4), railMat);
              bar.position.set(fx - side * 0.76, wy - 0.25, wz + b * 0.24);
              house.add(bar);
            }
            const top = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.05, 1.6), railMat);
            top.position.set(fx - side * 0.76, wy + 0.2, wz);
            house.add(top);
            if (rand() > 0.5)
              house.add(planter(fx - side * 0.5, wz + (rand() - 0.5), fid, rand).translateY(wy - 0.66));
          }
        }
      const map = stripeTexture(palette[i % 5]!, '#fff7ea');
      map.repeat.set(Math.round((d * 0.7) / 0.6), 1);
      const aw = new THREE.Mesh(
        new THREE.PlaneGeometry(d * 0.7, 1.8),
        std({ map, roughness: 0.9, side: THREE.DoubleSide }),
      );
      aw.position.set(fx - side * 0.8, 3.1, 0);
      aw.rotation.set(0, (-side * Math.PI) / 2, 0);
      aw.rotateX(side * 0.5);
      aw.castShadow = fid >= 4;
      house.add(aw);
    }
    root.add(house);
    if (fid >= 2 && i % 3 === 0)
      root.add(cafeTable(side * (setback - 2.6), z + 1.5, fid, rand, palette[(i + 2) % 5]!));
    if (fid >= 2) root.add(planter(side * (setback - 0.9), z - d / 2 + 0.6, fid, rand));
  }

  /* the mural wall at the head of the square */
  const wall = new THREE.Group();
  wall.position.set(0, 0, -52);
  const back = new THREE.Mesh(
    new THREE.BoxGeometry(34, 10.5, 1.2),
    std({ map: stuccoTexture('#f4ecdc', rand), roughness: 0.95 }),
  );
  back.position.y = 5.25;
  back.castShadow = fid >= 4;
  back.receiveShadow = fid >= 4;
  wall.add(back);
  const cap = new THREE.Mesh(new THREE.BoxGeometry(34.6, 0.3, 1.8), roofMat);
  cap.position.y = 10.6;
  wall.add(cap);
  const muralMat = std({ color: 0xffffff, roughness: 0.92 });
  new THREE.TextureLoader().load(
    '/media/plaza-mural.png',
    (t) => {
      muralMat.map = srgb(t);
      muralMat.needsUpdate = true;
    },
    undefined,
    () => muralMat.color.set(0xf7c62b),
  );
  const mural = new THREE.Mesh(new THREE.PlaneGeometry(27, 9), muralMat);
  mural.position.set(0, 4.9, 0.62);
  wall.add(mural);
  for (let i = 0; i < (fid >= 3 ? 6 : 3); i++) wall.add(planter(-12 + i * 4.8 + rand(), 1.2, fid, rand));
  for (let i = 0; i < (fid >= 2 ? 4 : 2); i++) {
    const e = easel(-9 + i * 6 + rand() * 1.5, 3.6 + rand(), Math.PI + (rand() - 0.5) * 0.4, fid, rand);
    wall.add(e);
    ctx.easels.push(new THREE.Vector3(e.position.x, 0, wall.position.z + e.position.z + 0.9));
  }
  for (let i = 0; i < 6; i++) {
    const pot = new THREE.Mesh(
      new THREE.CylinderGeometry(0.16, 0.14, 0.26, 10),
      std({ color: palette[i % palette.length], roughness: 0.8 }),
    );
    pot.position.set(-6 + i * 2.3 + rand(), 0.13, 5 + rand() * 1.5);
    wall.add(pot);
  }
  root.add(wall);

  if (fid >= 2)
    for (let z = -46; z <= 10; z += 7)
      bunting(root, -setback + 0.3, setback - 0.3, 6.8 + rand() * 0.8, z, 20, palette, rand);
  for (let i = 0; i < (fid >= 3 ? 10 : 6); i++) {
    const side = i % 2 ? 1 : -1;
    const z = -40 + (i >> 1) * 12 + rand() * 3;
    root.add(tree(side * (setback - 3.4), z, 1.4 + rand() * 0.5, fid, true));
  }
}

/* ── built + everyday after dark: a street canyon and a night market ── */
export function envStreet(
  root: THREE.Object3D,
  T: Theme,
  fid: number,
  rand: Rand,
  dense: boolean,
  ctx: EnvCtx,
) {
  const winTex = fid >= 3 && dense ? windowTexture(T.night, T.accent, rand) : null;
  const bMat = [std({ color: T.built, roughness: 0.88 }), std({ color: T.built2, roughness: 0.82 })];
  const wMat = winTex
    ? std({
        map: winTex,
        roughness: 0.6,
        emissiveMap: T.night ? winTex : null,
        emissive: new THREE.Color(T.night ? 0xffffff : 0x000000),
        emissiveIntensity: T.night ? 0.85 : 0,
      })
    : null;
  const count = dense ? (fid <= 1 ? 14 : fid === 2 ? 24 : 36) : fid <= 1 ? 8 : fid === 2 ? 14 : 20;
  const setback = dense ? 9 : 15;
  for (let i = 0; i < count; i++) {
    const side = i % 2 ? 1 : -1;
    const z = -62 + (i >> 1) * (dense ? 4.6 : 7.4) + rand() * 1.8;
    const w = (dense ? 6 : 8) + rand() * 6;
    const d = 6 + rand() * 7;
    const h = dense ? (fid <= 1 ? 7 : 6) + rand() * (fid <= 1 ? 10 : 24) : 5 + rand() * 7;
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wMat && rand() > 0.28 ? wMat : bMat[i % 2]);
    m.position.set(side * (setback + w / 2 + rand() * 2.4), h / 2, z);
    m.castShadow = fid >= 4;
    m.receiveShadow = fid >= 4;
    root.add(m);
    if (dense && fid >= 4 && rand() > 0.55) {
      const l = new THREE.PointLight(T.accent, 14, 22, 2.2);
      l.position.set(side * 8.4, 3.6, z);
      root.add(l);
      const bulb = new THREE.Mesh(
        new THREE.SphereGeometry(0.16, 12, 10),
        new THREE.MeshBasicMaterial({ color: T.accent }),
      );
      bulb.position.copy(l.position);
      root.add(bulb);
    }
  }
  if (dense && fid >= 2) {
    const canopy = std({ color: T.accent, roughness: 0.75, transparent: true, opacity: 0.9 });
    const post = std({ color: T.built2, roughness: 0.9 });
    for (let i = 0; i < (fid >= 3 ? 14 : 8); i++) {
      const side = i % 2 ? 1 : -1;
      const z = -50 + (i >> 1) * 8 + rand() * 3;
      const g = new THREE.Group();
      g.position.set(side * (5.6 + rand()), 0, z);
      const top = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.12, 2.4), canopy);
      top.position.y = 2.3;
      top.castShadow = fid >= 4;
      g.add(top);
      const table = new THREE.Mesh(new THREE.BoxGeometry(3, 0.16, 1.5), post);
      table.position.y = 0.92;
      table.castShadow = fid >= 4;
      g.add(table);
      (
        [
          [-1.4, -1],
          [1.4, -1],
          [-1.4, 1],
          [1.4, 1],
        ] as const
      ).forEach(([x, zz]) => {
        const p = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 2.3, 6), post);
        p.position.set(x, 1.15, zz * 1.05);
        g.add(p);
      });
      for (let k = 0; k < 4; k++) {
        const b = new THREE.Mesh(
          new THREE.BoxGeometry(0.4 + rand() * 0.3, 0.25 + rand() * 0.2, 0.35),
          std({ color: [0xe94b8a, 0xf7c62b, 0x3a95f2, 0x22c55e][k], roughness: 0.8 }),
        );
        b.position.set(-1.1 + k * 0.72, 1.15, (rand() - 0.5) * 0.6);
        g.add(b);
      }
      root.add(g);
      ctx.easels.push(new THREE.Vector3(g.position.x - side * 1.6, 0, z));
    }
    if (fid >= 3)
      for (let z = -46; z <= 6; z += 8) {
        for (let f = 0; f < 12; f++) {
          const u = f / 11;
          const b = new THREE.Mesh(
            new THREE.SphereGeometry(0.08, 8, 6),
            new THREE.MeshBasicMaterial({ color: 0xffe0a0 }),
          );
          b.position.set(-7 + u * 14, 4.6 - Math.sin(u * Math.PI) * 0.6, z);
          root.add(b);
        }
      }
  }
}

/* ── natural + festive: an open field, a main stage, marquees, bunting, braziers ── */
export function envField(root: THREE.Object3D, T: Theme, fid: number, rand: Rand, ctx: EnvCtx) {
  const tone = new THREE.Color(T.accent);
  const trees = fid <= 1 ? 16 : fid === 2 ? 28 : 46;
  for (let i = 0; i < trees; i++) {
    const a = (i / trees) * Math.PI * 2 + rand() * 0.2;
    const r = 44 + rand() * 30;
    root.add(tree(Math.sin(a) * r, -12 + Math.cos(a) * r, 2.4 + rand() * 2.2, fid, true));
  }
  const stage = new THREE.Group();
  stage.position.set(0, 0, -54);
  const deck = new THREE.Mesh(new THREE.BoxGeometry(24, 1.6, 11), std({ color: T.built2, roughness: 0.92 }));
  deck.position.y = 0.8;
  deck.castShadow = fid >= 4;
  deck.receiveShadow = fid >= 4;
  stage.add(deck);
  const back = new THREE.Mesh(
    new THREE.BoxGeometry(24, 12, 0.6),
    std({ color: T.built, roughness: 0.9, emissive: tone, emissiveIntensity: T.night ? 0.22 : 0 }),
  );
  back.position.set(0, 6.6, -5.2);
  stage.add(back);
  const truss = std({ color: 0x2a2a30, roughness: 0.6, metalness: 0.5 });
  [-12.4, 12.4].forEach((x) => {
    const t = new THREE.Mesh(new THREE.BoxGeometry(1.1, 14, 1.1), truss);
    t.position.set(x, 7, -1);
    stage.add(t);
    const sp = new THREE.Mesh(new THREE.BoxGeometry(2, 5, 1.8), truss);
    sp.position.set(x * 0.86, 4.1, 2.2);
    stage.add(sp);
  });
  const roof = new THREE.Mesh(new THREE.BoxGeometry(26, 0.5, 12), std({ color: 0x1e1e24, roughness: 0.8 }));
  roof.position.set(0, 14, -1);
  stage.add(roof);
  if (fid >= 3)
    [-7, 0, 7].forEach((x) => {
      const l = new THREE.PointLight(tone, fid >= 4 ? 34 : 18, 46, 2);
      l.position.set(x, 12.4, 1.4);
      stage.add(l);
      const lens = new THREE.Mesh(
        new THREE.SphereGeometry(0.4, 14, 12),
        new THREE.MeshBasicMaterial({ color: tone }),
      );
      lens.position.copy(l.position);
      stage.add(lens);
    });
  root.add(stage);
  ctx.easels.push(new THREE.Vector3(-3, 0, -47), new THREE.Vector3(3, 0, -47));
  const tentMat = std({ color: tone, roughness: 0.8, side: THREE.DoubleSide });
  const tentMat2 = std({ color: T.built, roughness: 0.85, side: THREE.DoubleSide });
  const tents = fid <= 1 ? 5 : fid === 2 ? 9 : 14;
  for (let i = 0; i < tents; i++) {
    const side = i % 2 ? 1 : -1;
    const z = -46 + (i >> 1) * 11 + rand() * 4;
    const Rr = 3.4 + rand() * 1.8;
    const g = new THREE.Group();
    g.position.set(side * (13 + rand() * 8), 0, z);
    const cone = new THREE.Mesh(new THREE.ConeGeometry(Rr, 3.4, 4), i % 3 ? tentMat2 : tentMat);
    cone.position.y = 3.6;
    cone.rotation.y = Math.PI / 4;
    cone.castShadow = fid >= 4;
    g.add(cone);
    const walls = new THREE.Mesh(new THREE.CylinderGeometry(Rr * 0.72, Rr * 0.72, 2.1, 4), tentMat2);
    walls.position.y = 1.05;
    walls.rotation.y = Math.PI / 4;
    g.add(walls);
    root.add(g);
  }
  if (fid >= 2) {
    const cols = ['#' + tone.getHexString(), '#ffffff', '#f7c62b', '#e94b8a'];
    for (let i = 0; i < (fid >= 3 ? 12 : 7); i++) {
      const z = -46 + i * 8;
      [-1, 1].forEach((side) => {
        const pole = new THREE.Mesh(
          new THREE.CylinderGeometry(0.09, 0.09, 5.2, 6),
          std({ color: 0x6b5b45, roughness: 0.95 }),
        );
        pole.position.set(side * 8.6, 2.6, z);
        root.add(pole);
      });
      bunting(root, -8.6, 8.6, 5.4, z, 12, cols, rand);
    }
    for (let i = 0; i < (fid >= 3 ? 10 : 6); i++) {
      const side = i % 2 ? 1 : -1;
      const z = -44 + (i >> 1) * 12;
      const bowl = new THREE.Mesh(
        new THREE.CylinderGeometry(0.5, 0.34, 0.7, 10),
        std({ color: 0x3a3238, roughness: 0.85 }),
      );
      bowl.position.set(side * 6.4, 0.9, z);
      root.add(bowl);
      const fire = new THREE.Mesh(
        new THREE.SphereGeometry(0.34, 12, 10),
        new THREE.MeshBasicMaterial({ color: T.key }),
      );
      fire.position.set(side * 6.4, 1.32, z);
      fire.userData.fire = true;
      root.add(fire);
      if (fid >= 4) {
        const l = new THREE.PointLight(T.key, 12, 16, 2.2);
        l.position.copy(fire.position);
        root.add(l);
      }
    }
    for (let i = 0; i < (fid >= 3 ? 12 : 6); i++) {
      const side = i % 2 ? 1 : -1;
      const bale = new THREE.Mesh(
        new THREE.CylinderGeometry(0.8, 0.8, 1.6, 12),
        std({ color: 0xc9a961, roughness: 1 }),
      );
      bale.rotation.z = Math.PI / 2;
      bale.position.set(side * (10 + rand() * 3), 0.8, -40 + i * 6.5 + rand() * 2);
      bale.castShadow = fid >= 4;
      root.add(bale);
    }
  }
}

/* ── technical + enclosed: a sealed studio room ── */
export function envRoom(root: THREE.Object3D, T: Theme, fid: number, rand: Rand, ctx: EnvCtx) {
  const wall = std({ color: T.built, roughness: 0.95, side: THREE.DoubleSide });
  const W = 30;
  const L = 120;
  const H = 15;
  const back = new THREE.Mesh(new THREE.PlaneGeometry(W * 2, H), wall);
  back.position.set(0, H / 2, -64);
  root.add(back);
  const front = new THREE.Mesh(new THREE.PlaneGeometry(W * 2, H), wall);
  front.position.set(0, H / 2, 26);
  front.rotation.y = Math.PI;
  root.add(front);
  [-1, 1].forEach((side) => {
    const s = new THREE.Mesh(new THREE.PlaneGeometry(L, H), wall);
    s.position.set(side * W, H / 2, -19);
    s.rotation.y = (-side * Math.PI) / 2;
    s.receiveShadow = fid >= 4;
    root.add(s);
  });
  const ceil = new THREE.Mesh(
    new THREE.PlaneGeometry(W * 2, L),
    std({ color: T.built2, roughness: 1, side: THREE.DoubleSide }),
  );
  ceil.position.set(0, H, -19);
  ceil.rotation.x = Math.PI / 2;
  root.add(ceil);
  const panel = new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false });
  for (let i = 0; i < 7; i++) {
    const z = -56 + i * 12;
    [-8, 8].forEach((x) => {
      const p = new THREE.Mesh(new THREE.PlaneGeometry(5.4, 2.4), panel);
      p.position.set(x, H - 0.06, z);
      p.rotation.x = Math.PI / 2;
      root.add(p);
      if (fid >= 3) {
        const l = new THREE.PointLight(0xffffff, fid >= 4 ? 16 : 9, 34, 2);
        l.position.set(x, H - 1.4, z);
        root.add(l);
      }
    });
  }
  const pm = std({ color: T.built2, roughness: 0.6, metalness: 0.05 });
  for (let i = 0; i < (fid >= 3 ? 8 : 5); i++) {
    const side = i % 2 ? 1 : -1;
    const p = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.3, 1.05, 28), pm);
    p.position.set(side * (6.2 + rand() * 0.6), 0.52, -46 + (i >> 1) * 13);
    p.castShadow = fid >= 4;
    p.receiveShadow = fid >= 4;
    root.add(p);
    ctx.easels.push(new THREE.Vector3(p.position.x - side * 2.2, 0, p.position.z));
  }
}
