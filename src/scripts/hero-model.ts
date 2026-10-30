export type Vec3 = [number, number, number];
export interface HeroPose {
  geometryTime: number;
  rotationX: number;
  rotationY: number;
  pointerX: number;
  pointerY: number;
  scroll: number;
}
export function objectMatrix(pose: HeroPose) {
  const a = 0.48 + pose.rotationY + pose.pointerX * 0.09 + pose.scroll * 0.42;
  const b = -0.48 + pose.rotationX * 0.35 + pose.scroll * 0.13;
  const c =
    0.83 +
    pose.rotationX +
    Math.sin(pose.geometryTime * 0.11) * 0.12 +
    pose.pointerY * 0.07;
  const rotate = (v: Vec3, i: number, j: number, angle: number) => {
    const x = v[i],
      y = v[j];
    v[i] = Math.cos(angle) * x + Math.sin(angle) * y;
    v[j] = -Math.sin(angle) * x + Math.cos(angle) * y;
  };
  const matrix = new Float32Array(9);
  for (let i = 0; i < 3; i++) {
    const v: Vec3 = [0, 0, 0];
    v[i] = 1;
    rotate(v, 0, 2, a);
    rotate(v, 0, 1, b);
    rotate(v, 1, 2, c);
    matrix.set(v, i * 3);
  }
  return matrix;
}
export function transform(v: Vec3, m: Float32Array, inverse = false): Vec3 {
  return inverse
    ? [
        m[0] * v[0] + m[1] * v[1] + m[2] * v[2],
        m[3] * v[0] + m[4] * v[1] + m[5] * v[2],
        m[6] * v[0] + m[7] * v[1] + m[8] * v[2],
      ]
    : [
        m[0] * v[0] + m[3] * v[1] + m[6] * v[2],
        m[1] * v[0] + m[4] * v[1] + m[7] * v[2],
        m[2] * v[0] + m[5] * v[1] + m[8] * v[2],
      ];
}
export function surfacePoint(theta: number, phi: number, time: number): Vec3 {
  const radius = 0.93 + 0.045 * Math.sin(theta * 3 + time * 0.16),
    tube = 0.29 + 0.025 * Math.cos(theta * 3 - time * 0.12);
  const r = radius + Math.cos(phi) * tube;
  return [
    Math.cos(theta) * r,
    Math.sin(phi) * tube - 0.025 * Math.sin(theta * 2 + time * 0.15),
    Math.sin(theta) * r,
  ];
}
function distance(v: Vec3, time: number) {
  const angle = Math.atan2(v[2], v[0]);
  return (
    Math.hypot(
      Math.hypot(v[0], v[2]) -
        (0.93 + 0.045 * Math.sin(angle * 3 + time * 0.16)),
      v[1] + 0.025 * Math.sin(angle * 2 + time * 0.15),
    ) -
    (0.29 + 0.025 * Math.cos(angle * 3 - time * 0.12))
  );
}
export function project(
  point: Vec3,
  aspect: number,
  scroll: number,
): [number, number] {
  const zoom = 1 + Math.min(scroll, 1.4) * 0.12,
    portrait = aspect < 1,
    scale = portrait ? 1.8 : 1;
  let x = (point[0] * 2.6) / (4.6 - point[2]) / (zoom * scale),
    y = (point[1] * 2.6) / (4.6 - point[2]) / (zoom * scale);
  y -= scroll * 0.1;
  x += portrait ? 0.02 : aspect * 0.25;
  y += portrait ? 0.27 : 0.12;
  return [x / aspect, y];
}
export function pickSurface(
  x: number,
  y: number,
  aspect: number,
  pose: HeroPose,
  matrix: Float32Array,
): [number, number] {
  const portrait = aspect < 1,
    zoom = (1 + Math.min(pose.scroll, 1.4) * 0.12) * (portrait ? 1.8 : 1);
  let px = (x * aspect - (portrait ? 0.02 : aspect * 0.25)) * zoom,
    py = (y - (portrait ? 0.27 : 0.12) + pose.scroll * 0.1) * zoom;
  const len = Math.hypot(px, py, 2.6),
    ray: Vec3 = [px / len, py / len, -2.6 / len];
  let travel = 2.9;
  for (let i = 0; i < 80 && travel < 6.4; i++) {
    const local = transform(
      [ray[0] * travel, ray[1] * travel, 4.6 + ray[2] * travel],
      matrix,
    );
    const d = distance(local, pose.geometryTime);
    if (d < 0.004) {
      const theta = Math.atan2(local[2], local[0]);
      return [
        theta,
        Math.atan2(local[1], Math.hypot(local[0], local[2]) - 0.93),
      ];
    }
    travel += Math.max(0.003, d * 0.7);
  }
  // Outside the silhouette: choose the nearest visible surface sample.
  let best = Infinity,
    result: [number, number] = [0, 0];
  for (let i = 0; i < 16; i++)
    for (let j = 0; j < 8; j++) {
      const t = (i * Math.PI) / 8,
        p = (j * Math.PI) / 4,
        world = transform(surfacePoint(t, p, pose.geometryTime), matrix, true),
        uv = project(world, aspect, pose.scroll);
      const score =
        (uv[0] - x) ** 2 + (uv[1] - y) ** 2 + (4.6 - world[2]) * 0.0002;
      if (score < best) {
        best = score;
        result = [t, p];
      }
    }
  return result;
}
/** Fixed storage: dead slots are recycled; no particles or arrays are allocated during emission. */
export class ParticlePool {
  readonly capacity = 256;
  // origin.xyz, velocity.xyz, birth, lifetime, size, seed
  readonly data = new Float32Array(256 * 10);
  private cursor = 0;
  private carry = 0;
  private seed = 17;
  emitted = 0;
  constructor() {
    for (let i = 0; i < this.capacity; i++) this.data[i * 10 + 6] = -100;
  }
  private random() {
    this.seed = (Math.imul(this.seed, 1664525) + 1013904223) >>> 0;
    return this.seed / 4294967296;
  }
  clear() {
    for (let i = 0; i < this.capacity; i++) this.data[i * 10 + 6] = -100;
    this.carry = 0;
  }
  step(
    dt: number,
    time: number,
    rate: number,
    limit: number,
    matrix: Float32Array,
    geometryTime: number,
    contact: [number, number] | null,
  ) {
    this.carry = Math.min(
      limit,
      this.carry + Math.max(0, rate) * Math.min(dt, 0.08),
    );
    const count = Math.floor(this.carry);
    this.carry -= count;
    for (let i = 0; i < count; i++) {
      const index = this.cursor++ % limit,
        offset = index * 10;
      const theta = contact
        ? contact[0] + (this.random() - 0.5) * 0.36
        : this.random() * Math.PI * 2;
      const phi = contact
        ? contact[1] + (this.random() - 0.5) * 0.7
        : this.random() * Math.PI * 2;
      const radius = 0.93 + 0.045 * Math.sin(theta * 3 + geometryTime * 0.16),
        tube = 0.29 + 0.025 * Math.cos(theta * 3 - geometryTime * 0.12);
      const ct = Math.cos(theta),
        st = Math.sin(theta),
        cp = Math.cos(phi),
        sp = Math.sin(phi);
      const lx = ct * (radius + cp * tube),
        ly = sp * tube - 0.025 * Math.sin(theta * 2 + geometryTime * 0.15),
        lz = st * (radius + cp * tube);
      const nx = ct * cp,
        ny = sp,
        nz = st * cp,
        speed = 0.18 + this.random() * 0.32;
      for (let axis = 0; axis < 3; axis++) {
        const m = axis * 3;
        const n = matrix[m] * nx + matrix[m + 1] * ny + matrix[m + 2] * nz;
        this.data[offset + axis] =
          matrix[m] * lx + matrix[m + 1] * ly + matrix[m + 2] * lz + n * 0.015;
        this.data[offset + 3 + axis] = n * speed;
      }
      this.data[offset + 6] = time;
      this.data[offset + 7] = 1.1 + this.random() * 1.5;
      this.data[offset + 8] = 0.012 + this.random() * 0.014;
      this.data[offset + 9] = this.random();
      this.emitted++;
    }
  }
  active(time: number, limit: number) {
    let count = 0;
    for (let i = 0; i < limit; i++) {
      const o = i * 10,
        age = time - this.data[o + 6];
      if (age >= 0 && age < this.data[o + 7]) count++;
    }
    return count;
  }
}
