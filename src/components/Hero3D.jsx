import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

/**
 * Hero3D — Apple-clean 3D centerpiece: an iridescent torus knot with a
 * surrounding particle field. Auto-rotates, follows the pointer with a soft
 * parallax, adapts to light/dark theme, and respects prefers-reduced-motion.
 *
 * Lazy-imported by its consumers so the three.js bundle stays out of the
 * initial load. Degrades to a CSS-only animated ring if WebGL is unavailable.
 */

function webglAvailable() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch {
    return false;
  }
}

export default function Hero3D() {
  const containerRef = useRef(null);
  // Lazy initializer: if WebGL is unavailable, skip straight to the fallback.
  const [failed, setFailed] = useState(() => !webglAvailable());

  useEffect(() => {
    const container = containerRef.current;
    if (!container || failed) return;

    let disposed = false;
    let cleanupFn = () => {};

    (async () => {
      const result = await initThree(container, () => disposed);
      if (disposed) {
        result.cleanup();
        return;
      }
      cleanupFn = result.cleanup;
    })().catch((err) => {
      if (!disposed) {
        console.warn('[Hero3D] WebGL init failed, using fallback:', err.message);
        setFailed(true);
      }
    });

    return () => {
      disposed = true;
      cleanupFn();
    };
  }, [failed]);

  return (
    <div ref={containerRef} className="hero3d" aria-hidden="true">
      {failed && (
        <div className="hero3d-fallback" aria-hidden="true">
          <span className="hero3d-ring" />
          <span className="hero3d-ring hero3d-ring--2" />
        </div>
      )}
    </div>
  );
}

async function initThree(container, isDisposed) {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;

  const canvas = renderer.domElement;
  canvas.style.cssText = 'width:100%;height:100%;display:block;';
  container.appendChild(canvas);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.z = 4.4;

  // Env reflections for a glassy "Apple" sheen; falls back to simple lights.
  let environmentSet = false;
  try {
    const { RoomEnvironment } = await import('three/examples/jsm/environments/RoomEnvironment.js');
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    environmentSet = true;
  } catch {
    environmentSet = false;
  }

  if (!environmentSet) {
    scene.add(new THREE.AmbientLight(0xffffff, isDark ? 0.6 : 0.7));
    const key = new THREE.DirectionalLight(0xffffff, 1.4);
    key.position.set(2, 3, 4);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0x5e5ce6, 1.0);
    rim.position.set(-3, 1, -2);
    scene.add(rim);
  }

  const group = new THREE.Group();

  const knotGeo = new THREE.TorusKnotGeometry(0.9, 0.28, 220, 32);
  const knotMat = new THREE.MeshPhysicalMaterial({
    color: isDark ? 0x4da3ff : 0x0a84ff,
    metalness: environmentSet ? 0.25 : 0.1,
    roughness: 0.16,
    clearcoat: 0.9,
    clearcoatRoughness: 0.25,
    envMapIntensity: 1.2,
  });
  const knot = new THREE.Mesh(knotGeo, knotMat);
  knot.rotation.x = -Math.PI / 2.4;
  group.add(knot);

  // Particle shell for depth
  const COUNT = 900;
  const positions = new Float32Array(COUNT * 3);
  for (let i = 0; i < COUNT; i++) {
    const r = 1.6 + Math.random() * 1.5;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);
  }
  const ptsGeo = new THREE.BufferGeometry();
  ptsGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const ptsMat = new THREE.PointsMaterial({
    color: isDark ? 0x7aa2ff : 0x0a84ff,
    size: 0.022,
    transparent: true,
    opacity: isDark ? 0.85 : 0.5,
    sizeAttenuation: true,
  });
  const points = new THREE.Points(ptsGeo, ptsMat);
  group.add(points);

  scene.add(group);

  // Sizing
  const setSize = () => {
    const w = container.clientWidth || 1;
    const h = container.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  setSize();
  const resizeObserver = new ResizeObserver(setSize);
  resizeObserver.observe(container);

  // Pointer parallax
  let targetX = 0;
  let targetY = 0;
  let mouseX = 0;
  let mouseY = 0;
  const onMove = (e) => {
    const rect = container.getBoundingClientRect();
    targetX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    targetY = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
  };
  container.addEventListener('pointermove', onMove);

  // Live theme switching
  const themeObserver = new MutationObserver(() => {
    const dark = document.documentElement.getAttribute('data-theme') === 'dark';
    knotMat.color.set(dark ? 0x4da3ff : 0x0a84ff);
    ptsMat.color.set(dark ? 0x7aa2ff : 0x0a84ff);
  });
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  // Animation
  let rafId = 0;
  let autoRotate = 0;
  const render = () => {
    if (isDisposed()) return;
    if (!reduceMotion) {
      autoRotate += 0.0032;
      mouseX += (targetX - mouseX) * 0.045;
      mouseY += (targetY - mouseY) * 0.045;
      group.rotation.y = autoRotate + mouseX * 0.4;
      group.rotation.x = -Math.PI / 2.4 + mouseY * 0.3;
      points.rotation.y = -autoRotate * 0.35;
    } else {
      group.rotation.y = 0.5;
      group.rotation.x = -Math.PI / 2.4;
    }
    renderer.render(scene, camera);
    if (!reduceMotion) rafId = requestAnimationFrame(render);
  };
  render();

  const cleanup = () => {
    cancelAnimationFrame(rafId);
    resizeObserver.disconnect();
    themeObserver.disconnect();
    container.removeEventListener('pointermove', onMove);
    knotGeo.dispose();
    knotMat.dispose();
    ptsGeo.dispose();
    ptsMat.dispose();
    renderer.dispose();
    canvas.remove();
  };

  return { cleanup };
}
