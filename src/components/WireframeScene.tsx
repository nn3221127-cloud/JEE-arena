import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface WireframeSceneProps {
  className?: string;
  opacity?: number;
}

/**
 * WireframeScene Component:
 * Single slowly rotating wireframe icosahedron rendered in thin ink-navy strokes.
 * Pure geometry motif for Login and Test Start screens.
 */
export const WireframeScene: React.FC<WireframeSceneProps> = ({
  className = '',
  opacity = 0.25
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth || 400;
    const height = container.clientHeight || 400;

    // Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 4;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Icosahedron Wireframe
    const geometry = new THREE.IcosahedronGeometry(1.2, 1);
    const wireframe = new THREE.WireframeGeometry(geometry);

    // Ink Navy color line material
    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0x1f2a44,
      transparent: true,
      opacity: opacity,
      linewidth: 1.5
    });

    const line = new THREE.LineSegments(wireframe, lineMaterial);
    scene.add(line);

    // Animation Loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      line.rotation.x += 0.002;
      line.rotation.y += 0.003;
      renderer.render(scene, camera);
    };

    animate();

    // Resize Handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      geometry.dispose();
      wireframe.dispose();
      lineMaterial.dispose();
      renderer.dispose();
    };
  }, [opacity]);

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden ${className}`}
      aria-hidden="true"
    />
  );
};
