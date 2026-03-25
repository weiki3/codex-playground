import * as THREE from "https://unpkg.com/three@0.162.0/build/three.module.js";

const canvas = document.getElementById("scene");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0xd4dde8, 9, 24);

const camera = new THREE.PerspectiveCamera(38, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 0.1, 7.8);
scene.add(camera);

scene.add(new THREE.AmbientLight(0xf8fbff, 0.85));
const keyLight = new THREE.DirectionalLight(0xffffff, 1.15);
keyLight.position.set(3.8, 4.2, 5.5);
scene.add(keyLight);
const fillLight = new THREE.DirectionalLight(0xbfd4ff, 0.5);
fillLight.position.set(-4.5, 0.7, 2.5);
scene.add(fillLight);

const backdrop = new THREE.Mesh(
  new THREE.CircleGeometry(8.2, 72),
  new THREE.MeshStandardMaterial({ color: 0xeaf0f7, roughness: 0.95, metalness: 0.02 })
);
backdrop.position.set(0, -1.2, -1.2);
scene.add(backdrop);

const pinnedY = 2.7;
const width = 2.45;
const height = 5.4;
const segmentsX = 24;
const segmentsY = 92;
const mass = 1;
const gravity = new THREE.Vector3(0, -34, 0);
const damping = 0.985;
const windStrength = 2.6;
const dragInfluence = 0.78;

class Particle {
  constructor(x, y, z) {
    this.position = new THREE.Vector3(x, y, z);
    this.previous = new THREE.Vector3(x, y, z);
    this.original = new THREE.Vector3(x, y, z);
    this.acceleration = new THREE.Vector3();
    this.invMass = 1 / mass;
    this.pinned = false;
    this.dragged = false;
  }

  addForce(force) {
    this.acceleration.addScaledVector(force, this.invMass);
  }

  integrate(deltaSq) {
    if (this.pinned || this.dragged) {
      this.previous.copy(this.position);
      this.acceleration.set(0, 0, 0);
      return;
    }

    const velocity = this.position.clone().sub(this.previous).multiplyScalar(damping);
    const next = this.position.clone().add(velocity).addScaledVector(this.acceleration, deltaSq);
    this.previous.copy(this.position);
    this.position.copy(next);
    this.acceleration.set(0, 0, 0);
  }
}

function idx(x, y) {
  return y * (segmentsX + 1) + x;
}

const particles = [];
const constraints = [];

for (let y = 0; y <= segmentsY; y += 1) {
  for (let x = 0; x <= segmentsX; x += 1) {
    const px = (x / segmentsX - 0.5) * width;
    const py = pinnedY - (y / segmentsY) * height;
    const pz = 0;
    const particle = new Particle(px, py, pz);
    if (y === 0) {
      particle.pinned = true;
    }
    particles.push(particle);
  }
}

const restX = width / segmentsX;
const restY = height / segmentsY;

for (let y = 0; y <= segmentsY; y += 1) {
  for (let x = 0; x <= segmentsX; x += 1) {
    if (x < segmentsX) constraints.push([idx(x, y), idx(x + 1, y), restX]);
    if (y < segmentsY) constraints.push([idx(x, y), idx(x, y + 1), restY]);
    if (x < segmentsX && y < segmentsY) {
      constraints.push([idx(x, y), idx(x + 1, y + 1), Math.sqrt(restX ** 2 + restY ** 2)]);
      constraints.push([idx(x + 1, y), idx(x, y + 1), Math.sqrt(restX ** 2 + restY ** 2)]);
    }
    if (x < segmentsX - 1) constraints.push([idx(x, y), idx(x + 2, y), restX * 2]);
    if (y < segmentsY - 1) constraints.push([idx(x, y), idx(x, y + 2), restY * 2]);
  }
}

const geometry = new THREE.PlaneGeometry(width, height, segmentsX, segmentsY);
geometry.translate(0, pinnedY - height * 0.5, 0);

function createReceiptTexture() {
  const texCanvas = document.createElement("canvas");
  texCanvas.width = 1024;
  texCanvas.height = 2048;
  const ctx = texCanvas.getContext("2d");

  const gradient = ctx.createLinearGradient(0, 0, texCanvas.width, texCanvas.height);
  gradient.addColorStop(0, "#fffef8");
  gradient.addColorStop(0.45, "#fffdf4");
  gradient.addColorStop(1, "#f7f4ea");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, texCanvas.width, texCanvas.height);

  ctx.strokeStyle = "rgba(52,46,40,0.1)";
  ctx.lineWidth = 2;
  ctx.strokeRect(36, 28, texCanvas.width - 72, texCanvas.height - 56);

  ctx.fillStyle = "#25303c";
  ctx.font = "700 50px 'Courier New', monospace";
  ctx.fillText("NOVA MARKET", 118, 128);

  ctx.font = "600 24px 'Courier New', monospace";
  ctx.fillStyle = "#516071";
  ctx.fillText("1124 Orchard Ave   #047", 118, 166);
  ctx.fillText("March 25, 2026   14:07", 118, 196);

  ctx.strokeStyle = "rgba(58,72,86,0.35)";
  ctx.setLineDash([16, 10]);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(90, 236);
  ctx.lineTo(texCanvas.width - 90, 236);
  ctx.stroke();
  ctx.setLineDash([]);

  const items = [
    ["Organic Bananas", "$3.19"],
    ["Sourdough Bread", "$4.85"],
    ["Whole Milk 1L", "$2.39"],
    ["Atlantic Salmon", "$13.42"],
    ["Ground Coffee", "$8.75"],
    ["Olive Oil", "$11.20"],
    ["Free-range Eggs", "$6.90"],
    ["Pasta", "$2.50"],
    ["Tomato Sauce", "$3.30"],
    ["Dark Chocolate", "$5.15"]
  ];

  ctx.font = "500 26px 'Courier New', monospace";
  let y = 290;
  items.forEach(([label, amount], i) => {
    const alpha = 0.96 - i * 0.015;
    ctx.fillStyle = `rgba(29, 36, 45, ${alpha.toFixed(2)})`;
    ctx.fillText(label, 100, y);
    ctx.fillText(amount, texCanvas.width - 250, y);
    y += 58;
  });

  ctx.strokeStyle = "rgba(55,67,80,0.28)";
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(90, y + 8);
  ctx.lineTo(texCanvas.width - 90, y + 8);
  ctx.stroke();

  ctx.font = "700 30px 'Courier New', monospace";
  ctx.fillStyle = "#1e2a37";
  ctx.fillText("SUBTOTAL", 100, y + 64);
  ctx.fillText("$61.65", texCanvas.width - 258, y + 64);
  ctx.fillText("TAX", 100, y + 108);
  ctx.fillText("$5.44", texCanvas.width - 258, y + 108);

  ctx.font = "700 40px 'Courier New', monospace";
  ctx.fillStyle = "#102236";
  ctx.fillText("TOTAL", 100, y + 182);
  ctx.fillText("$67.09", texCanvas.width - 280, y + 182);

  ctx.font = "500 22px 'Courier New', monospace";
  ctx.fillStyle = "#4b5f70";
  ctx.fillText("Thank you for shopping local", 100, y + 270);
  ctx.fillText("www.novamarket.example", 100, y + 304);

  for (let i = 0; i < 7000; i += 1) {
    const x = Math.random() * texCanvas.width;
    const yy = Math.random() * texCanvas.height;
    const shade = 245 + Math.random() * 10;
    ctx.fillStyle = `rgba(${shade}, ${shade}, ${shade - 8}, 0.05)`;
    ctx.fillRect(x, yy, 1, 1);
  }

  const texture = new THREE.CanvasTexture(texCanvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  texture.needsUpdate = true;
  return texture;
}

const receiptMaterial = new THREE.MeshPhysicalMaterial({
  map: createReceiptTexture(),
  side: THREE.DoubleSide,
  roughness: 0.86,
  metalness: 0,
  sheen: 0.34,
  sheenColor: new THREE.Color(0xf6efe3),
  clearcoat: 0.03,
  transmission: 0,
  thickness: 0.08
});

const receiptMesh = new THREE.Mesh(geometry, receiptMaterial);
receiptMesh.castShadow = false;
scene.add(receiptMesh);

const pinBar = new THREE.Mesh(
  new THREE.CylinderGeometry(0.06, 0.06, width + 0.15, 24),
  new THREE.MeshStandardMaterial({ color: 0x74849a, roughness: 0.45, metalness: 0.75 })
);
pinBar.rotation.z = Math.PI * 0.5;
pinBar.position.y = pinnedY + 0.035;
scene.add(pinBar);

const raycaster = new THREE.Raycaster();
const pointerNdc = new THREE.Vector2();
const grabPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
const tempVec = new THREE.Vector3();

const dragState = {
  active: false,
  particle: null,
  offset: new THREE.Vector3(),
  intersection: new THREE.Vector3()
};

function satisfyConstraint(a, b, distance) {
  tempVec.subVectors(b.position, a.position);
  const current = tempVec.length();
  if (!current) return;
  const correction = tempVec.multiplyScalar((current - distance) / current);

  if (a.pinned || a.dragged) {
    if (!b.pinned && !b.dragged) {
      b.position.sub(correction);
    }
    return;
  }

  if (b.pinned || b.dragged) {
    a.position.add(correction);
    return;
  }

  a.position.addScaledVector(correction, 0.5);
  b.position.addScaledVector(correction, -0.5);
}

function updateGeometry() {
  const pos = geometry.attributes.position;
  for (let i = 0; i < particles.length; i += 1) {
    const p = particles[i].position;
    pos.setXYZ(i, p.x, p.y, p.z);
  }
  pos.needsUpdate = true;
  geometry.computeVertexNormals();
}

function applyWind(time) {
  const sway = Math.sin(time * 0.65) * windStrength;
  const curl = Math.cos(time * 0.45) * windStrength * 0.45;
  for (let y = 1; y <= segmentsY; y += 1) {
    for (let x = 0; x <= segmentsX; x += 1) {
      const p = particles[idx(x, y)];
      const t = y / segmentsY;
      p.addForce(new THREE.Vector3(
        (Math.sin((x * 0.6 + time * 2.2)) * 0.5 + sway) * t * 0.08,
        0,
        (Math.cos((x * 0.2 + y * 0.06 + time * 1.8)) * 0.35 + curl) * t * 0.12
      ));
    }
  }
}

function getNearestParticle(worldPoint, radius = 0.22) {
  let best = null;
  let bestDist = radius;
  for (const p of particles) {
    if (p.pinned) continue;
    const dist = p.position.distanceTo(worldPoint);
    if (dist < bestDist) {
      bestDist = dist;
      best = p;
    }
  }
  return best;
}

function pointerToNDC(event) {
  const rect = canvas.getBoundingClientRect();
  pointerNdc.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointerNdc.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
}

function startDrag(event) {
  pointerToNDC(event);
  raycaster.setFromCamera(pointerNdc, camera);

  if (!raycaster.ray.intersectPlane(grabPlane, dragState.intersection)) return;

  const closest = getNearestParticle(dragState.intersection);
  if (!closest) return;

  dragState.active = true;
  dragState.particle = closest;
  closest.dragged = true;
  dragState.offset.copy(closest.position).sub(dragState.intersection);
  canvas.classList.add("dragging");
}

function moveDrag(event) {
  pointerToNDC(event);
  raycaster.setFromCamera(pointerNdc, camera);
  if (!dragState.active || !dragState.particle) return;
  if (!raycaster.ray.intersectPlane(grabPlane, dragState.intersection)) return;

  const target = dragState.intersection.clone().add(dragState.offset);
  dragState.particle.position.lerp(target, dragInfluence);
}

function endDrag() {
  if (dragState.particle) {
    dragState.particle.dragged = false;
  }
  dragState.active = false;
  dragState.particle = null;
  canvas.classList.remove("dragging");
}

canvas.addEventListener("pointerdown", (event) => {
  canvas.setPointerCapture(event.pointerId);
  startDrag(event);
});
canvas.addEventListener("pointermove", moveDrag);
canvas.addEventListener("pointerup", endDrag);
canvas.addEventListener("pointercancel", endDrag);
canvas.addEventListener("lostpointercapture", endDrag);

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

const clock = new THREE.Clock();

function stepPhysics(delta) {
  const deltaSq = delta * delta;
  const now = clock.elapsedTime;

  applyWind(now);

  for (const p of particles) {
    p.addForce(gravity);
    p.integrate(deltaSq);
  }

  for (let i = 0; i < 5; i += 1) {
    for (const [a, b, dist] of constraints) {
      satisfyConstraint(particles[a], particles[b], dist);
    }

    for (let x = 0; x <= segmentsX; x += 1) {
      const top = particles[idx(x, 0)];
      top.position.copy(top.original);
      top.previous.copy(top.original);
    }
  }

  updateGeometry();
}

function render() {
  const delta = Math.min(clock.getDelta(), 1 / 30);
  stepPhysics(delta);
  renderer.render(scene, camera);
  requestAnimationFrame(render);
}

render();
