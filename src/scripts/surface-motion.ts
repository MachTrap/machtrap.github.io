import { spring, stepSpring, clamp } from './motion';

/** Drag is positional; momentum is estimated once and applied only after release. */
export class SurfaceMotion {
  readonly x = spring();
  readonly y = spring();
  readonly rotationX = spring();
  readonly rotationY = spring();
  readonly energy = spring();
  readonly hold = spring();
  readonly visibility = spring(1);
  readonly scroll = spring();
  private drag: {
    id: number;
    x: number;
    y: number;
    time: number;
    vx: number;
    vy: number;
  } | null = null;
  private coastX = 0;
  private coastY = 0;
  visualTime = 0;
  effectTime = 0;
  rippleAge = 100;
  ripplePoint = [0, 0];
  get holding() {
    return this.drag !== null;
  }
  begin(
    id: number,
    x: number,
    y: number,
    time: number,
    width: number,
    height: number,
  ) {
    this.drag = { id, x, y, time, vx: 0, vy: 0 };
    this.coastX = 0;
    this.coastY = 0;
    this.rotationX.velocity = 0;
    this.rotationY.velocity = 0;
    this.hold.target = 1;
    this.ripplePoint = [
      clamp((x / width) * 2 - 1, -1, 1),
      clamp(1 - (y / height) * 2, -1, 1),
    ];
    this.rippleAge = 0;
    this.energy.target = 0.18;
    this.x.target = 0;
    this.y.target = 0;
  }
  move(
    id: number,
    x: number,
    y: number,
    time: number,
    width: number,
    height: number,
  ) {
    const d = this.drag;
    if (!d || id !== d.id) return false;
    const px = x - d.x,
      py = y - d.y;
    // Ignore sensor noise and zero-distance pointermove events; never restart ripples.
    if (Math.hypot(px, py) < 1.75) return false;
    const dx = (px / Math.max(width, 300)) * 5,
      dy = (py / Math.max(height, 300)) * 4;
    const dt = clamp((time - d.time) / 1000, 1 / 120, 0.1);
    // Move the illumination brush with the drag without restarting its ripple.
    this.ripplePoint = [
      clamp((x / width) * 2 - 1, -1, 1),
      clamp(1 - (y / height) * 2, -1, 1),
    ];
    this.rotationY.target += dx;
    this.rotationX.target += dy;
    d.vy = d.vy * 0.65 + clamp(dx / dt, -4, 4) * 0.35;
    d.vx = d.vx * 0.65 + clamp(dy / dt, -4, 4) * 0.35;
    this.energy.target = Math.min(0.65, Math.hypot(dx, dy) * 1.5);
    d.x = x;
    d.y = y;
    d.time = time;
    return true;
  }
  hover(x: number, y: number) {
    if (this.holding) return;
    this.x.target = clamp(x, -1, 1);
    this.y.target = clamp(y, -1, 1);
  }
  end(id: number, time: number, cancelled = false) {
    const d = this.drag;
    if (!d || d.id !== id) return;
    const recent = time - d.time < 100 && !cancelled;
    this.coastX = recent ? d.vx : 0;
    this.coastY = recent ? d.vy : 0;
    this.drag = null;
    this.hold.target = 0;
    this.energy.target = 0;
  }
  cancel() {
    if (this.drag) this.end(this.drag.id, Infinity, true);
    this.coastX = 0;
    this.coastY = 0;
  }
  step(delta: number, effectsActive = true) {
    const dt = clamp(delta, 0, 0.08);
    if (!this.holding) {
      const distance = (1 - Math.exp(-5 * dt)) / 5;
      this.rotationX.target += this.coastX * distance;
      this.rotationY.target += this.coastY * distance;
      this.coastX *= Math.exp(-5 * dt);
      this.coastY *= Math.exp(-5 * dt);
    }
    stepSpring(this.rotationX, dt, 80, 20);
    stepSpring(this.rotationY, dt, 80, 20);
    stepSpring(this.x, dt, 35, 13);
    stepSpring(this.y, dt, 35, 13);
    stepSpring(this.hold, dt, 70, 18);
    stepSpring(this.scroll, dt, 55, 16);
    stepSpring(this.visibility, dt, 60, 17);
    this.energy.target *= Math.exp(-8 * dt);
    stepSpring(this.energy, dt, 40, 14);
    // Ambient deformation eases to a complete stop while the surface is held.
    if (effectsActive) {
      this.visualTime += dt * Math.max(0, 1 - this.hold.value);
      this.effectTime += dt;
      this.rippleAge += dt;
    }
  }
}
export function heroVisibility(
  bottom: number,
  viewportHeight: number,
  headerHeight: number,
) {
  return clamp((bottom - headerHeight) / (viewportHeight - headerHeight), 0, 1);
}
