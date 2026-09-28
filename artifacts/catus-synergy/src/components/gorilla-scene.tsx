import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import {
  animateGorillaRig,
  createGorillaRig,
  disposeGorillaRig,
} from '@/lib/gorilla-rig';
import { renderSoftwareGorilla } from '@/lib/gorilla-software-renderer';

const clampPointer = (value: number) => Math.max(-1, Math.min(1, value));

export function GorillaScene() {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const softwareCanvasRef = useRef<HTMLCanvasElement>(null);
  const [webglUnavailable, setWebglUnavailable] = useState(false);
  const [softwareFallback, setSoftwareFallback] = useState(false);

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    const softwareCanvas = softwareCanvasRef.current;
    if (!host || !canvas || !softwareCanvas) return;

    let renderer: THREE.WebGLRenderer | undefined;
    let softwareContext: CanvasRenderingContext2D | null = null;
    try {
      const webglContext = canvas.getContext('webgl2', {
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance',
      });
      if (webglContext) {
        renderer = new THREE.WebGLRenderer({
          canvas,
          context: webglContext,
          alpha: true,
          antialias: true,
          powerPreference: 'high-performance',
        });
      } else {
        softwareContext = softwareCanvas.getContext('2d');
      }
    } catch {
      softwareContext = softwareCanvas.getContext('2d');
    }

    const softwareMode = !renderer && softwareContext !== null;
    setSoftwareFallback(softwareMode);
    setWebglUnavailable(!renderer && !softwareContext);
    if (renderer) {
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.12;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.setClearColor(0x000000, 0);
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 40);
    const gorilla = createGorillaRig({ softwareFallback: softwareMode });
    scene.add(gorilla.root);

    const hemisphere = new THREE.HemisphereLight(0xa9c5f4, 0x111724, 1.55);
    scene.add(hemisphere);

    const keyLight = new THREE.DirectionalLight(0xe0e9ff, 3.3);
    keyLight.position.set(-3.5, 5.5, 4.5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.camera.left = -4;
    keyLight.shadow.camera.right = 4;
    keyLight.shadow.camera.top = 5;
    keyLight.shadow.camera.bottom = -1;
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 16;
    keyLight.shadow.bias = -0.00015;
    keyLight.shadow.radius = 5;
    scene.add(keyLight);

    const blueRim = new THREE.PointLight(0x3978ff, 18, 12, 2);
    blueRim.position.set(3.4, 2.8, -2.8);
    scene.add(blueRim);

    const softFill = new THREE.PointLight(0xa7b8d5, 5, 10, 2);
    softFill.position.set(3.2, 2.6, 4.4);
    scene.add(softFill);

    const faceFill = new THREE.PointLight(0xdce7fb, 3.2, 8, 2);
    faceFill.position.set(-0.8, 3.5, 5.6);
    scene.add(faceFill);

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(32, 32),
      new THREE.ShadowMaterial({ color: 0x02050b, opacity: 0.42 }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0.025;
    floor.receiveShadow = true;
    scene.add(floor);

    const groundRing = new THREE.Mesh(
      new THREE.RingGeometry(1.65, 1.67, 112),
      new THREE.MeshBasicMaterial({
        color: 0x4b83ff,
        transparent: true,
        opacity: 0.4,
        side: THREE.DoubleSide,
      }),
    );
    groundRing.rotation.x = -Math.PI / 2;
    groundRing.position.y = 0.043;
    scene.add(groundRing);

    const halo = new THREE.Mesh(
      new THREE.TorusGeometry(2.04, 0.008, 8, 160),
      new THREE.MeshBasicMaterial({
        color: 0x3f72d8,
        transparent: true,
        opacity: 0.32,
      }),
    );
    halo.position.set(0, 1.86, -0.92);
    scene.add(halo);

    const pointerTarget = new THREE.Vector2();
    const pointerCurrent = new THREE.Vector2();
    const interaction = { seatAmount: 0 };
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const heroSection = host.closest<HTMLElement>('#home');
    let isVisible = true;
    let pageIsVisible = !document.hidden;
    let animationFrame = 0;
    let startTime = performance.now();
    let previousFrameTime = startTime;
    let lastSoftwareFrame = 0;

    const resize = () => {
      const width = Math.max(host.clientWidth, 1);
      const height = Math.max(host.clientHeight, 1);
      const aspect = width / height;
      const halfFov = THREE.MathUtils.degToRad(camera.fov / 2);
      const fitHeight = 4.05 / (2 * Math.tan(halfFov));
      const fitWidth = 3.65 / (2 * Math.tan(halfFov) * aspect);
      const distance = Math.max(6.5, fitHeight, fitWidth) * 1.05;

      camera.position.set(0.12, 2.03, distance);
      camera.lookAt(0, 1.91, 0);
      camera.aspect = aspect;
      camera.updateProjectionMatrix();
      if (renderer) {
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.8));
        renderer.setSize(width, height, false);
      } else if (softwareCanvas) {
        const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.15);
        softwareCanvas.width = Math.max(1, Math.round(width * pixelRatio));
        softwareCanvas.height = Math.max(1, Math.round(height * pixelRatio));
      }
      drawStaticPose();
    };

    const updateScroll = () => {
      if (!heroSection) return;
      const bounds = heroSection.getBoundingClientRect();
      const downwardTravel = Math.max(0, -bounds.top);
      const sitDistance = Math.max(window.innerHeight * 0.42, 1);
      interaction.seatAmount = THREE.MathUtils.smoothstep(
        THREE.MathUtils.clamp(downwardTravel / sitDistance, 0, 1),
        0,
        1,
      );
      if (reducedMotion.matches) requestRender();
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return;
      const bounds = host.getBoundingClientRect();
      if (!bounds.width || !bounds.height) return;
      pointerTarget.x = clampPointer(((event.clientX - bounds.left) / bounds.width) * 2 - 1);
      pointerTarget.y = clampPointer(1 - ((event.clientY - bounds.top) / bounds.height) * 2);
      if (reducedMotion.matches) requestRender();
    };

    const resetPointer = () => {
      pointerTarget.set(0, 0);
      if (reducedMotion.matches) requestRender();
    };

    const renderFrame = (now: number) => {
      animationFrame = 0;
      if (!isVisible || !pageIsVisible) return;

      if (softwareMode && now - lastSoftwareFrame < 1000 / 24) {
        animationFrame = window.requestAnimationFrame(renderFrame);
        return;
      }
      if (softwareMode) lastSoftwareFrame = now;

      const elapsed = (now - startTime) / 1000;
      const delta = Math.min((now - previousFrameTime) / 1000, 0.06);
      previousFrameTime = now;
      const smoothing = 1 - Math.exp(-delta * 5.5);

      if (reducedMotion.matches) {
        pointerCurrent.copy(pointerTarget);
        animateGorillaRig(gorilla, {
          timeSeconds: 0,
          pointerX: pointerCurrent.x,
          pointerY: pointerCurrent.y,
          seatAmount: interaction.seatAmount,
        });
        renderCurrentPose();
        return;
      }

      pointerCurrent.lerp(pointerTarget, smoothing);
      animateGorillaRig(gorilla, {
        timeSeconds: elapsed,
        pointerX: pointerCurrent.x,
        pointerY: pointerCurrent.y,
        seatAmount: interaction.seatAmount,
      });
      renderCurrentPose();
      animationFrame = window.requestAnimationFrame(renderFrame);
    };

    const requestRender = () => {
      if (!animationFrame && isVisible && pageIsVisible) {
        animationFrame = window.requestAnimationFrame(renderFrame);
      }
    };

    const handleMotionPreference = () => {
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
      animationFrame = 0;
      startTime = performance.now();
      previousFrameTime = startTime;
      requestRender();
    };

    const handleVisibilityChange = () => {
      pageIsVisible = !document.hidden;
      if (pageIsVisible) requestRender();
      else if (animationFrame) {
        window.cancelAnimationFrame(animationFrame);
        animationFrame = 0;
      }
    };

    const visibilityObserver = 'IntersectionObserver' in window
      ? new IntersectionObserver(([entry]) => {
          isVisible = entry.isIntersecting;
          if (isVisible) requestRender();
          else if (animationFrame) {
            window.cancelAnimationFrame(animationFrame);
            animationFrame = 0;
          }
        }, { threshold: 0.01 })
      : undefined;

    const resizeObserver = 'ResizeObserver' in window
      ? new ResizeObserver(resize)
      : undefined;

    host.addEventListener('pointermove', handlePointerMove, { passive: true });
    host.addEventListener('pointerleave', resetPointer);
    window.addEventListener('scroll', updateScroll, { passive: true });
    window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    reducedMotion.addEventListener('change', handleMotionPreference);
    visibilityObserver?.observe(host);
    resizeObserver?.observe(host);

    updateScroll();
    resize();
    if (!reducedMotion.matches) requestRender();
    else drawStaticPose();

    function drawStaticPose() {
      animateGorillaRig(gorilla, {
        timeSeconds: 0,
        pointerX: 0,
        pointerY: 0,
        seatAmount: interaction.seatAmount,
      });
      renderCurrentPose();
    }

    function renderCurrentPose() {
      if (renderer) renderer.render(scene, camera);
      else if (softwareContext && softwareCanvas) {
        renderSoftwareGorilla(
          softwareContext,
          softwareCanvas.width,
          softwareCanvas.height,
          gorilla,
          camera,
        );
      }
    }

    return () => {
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
      host.removeEventListener('pointermove', handlePointerMove);
      host.removeEventListener('pointerleave', resetPointer);
      window.removeEventListener('scroll', updateScroll);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      reducedMotion.removeEventListener('change', handleMotionPreference);
      visibilityObserver?.disconnect();
      resizeObserver?.disconnect();
      disposeGorillaRig(gorilla);
      floor.geometry.dispose();
      (floor.material as THREE.Material).dispose();
      groundRing.geometry.dispose();
      (groundRing.material as THREE.Material).dispose();
      halo.geometry.dispose();
      (halo.material as THREE.Material).dispose();
      renderer?.dispose();
    };
  }, []);

  return (
    <div ref={hostRef} className="gorilla-scene" data-testid="gorilla-scene">
      <canvas
        ref={canvasRef}
        className={`gorilla-scene__canvas${softwareFallback ? ' gorilla-scene__canvas--hidden' : ''}`}
        role="img"
        aria-label="Interactive 3D silverback gorilla with continuous breathing and natural body movement"
      />
      <canvas
        ref={softwareCanvasRef}
        className={`gorilla-scene__canvas${softwareFallback ? '' : ' gorilla-scene__canvas--hidden'}`}
        aria-hidden="true"
      />
      {webglUnavailable && (
        <div className="gorilla-scene__fallback" role="status">
          <p>This browser cannot render the 3D gorilla.</p>
        </div>
      )}
      <span className="sr-only">A full-body silverback gorilla breathes, shifts its weight, moves its head and hands, and follows your cursor.</span>
    </div>
  );
}