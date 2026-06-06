'use client';

import * as React from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ElectrochemCell } from '@/components/simulation/electrochem-cell';
import { CLASS_CONFIGS } from '@/components/simulation/sim-constants';

/**
 * A single, fully-grown, gently auto-rotating electrochemical cell for the
 * cm layer of the homepage scale-zoom. Reuses the simulation's ElectrochemCell
 * with a static progress (= 1, mature biofilm + steady electron stream). No
 * OrbitControls (keeps drei out of this chunk); the render loop is parked when
 * the layer is not active.
 */
function RotatingCell({ count }: { count: { microbes: number; electrons: number } }) {
  const groupRef = React.useRef<THREE.Group>(null);
  const progressRef = React.useRef(1);
  useFrame((_, dt) => {
    if (groupRef.current) groupRef.current.rotation.y += dt * 0.18;
  });
  return (
    <group ref={groupRef}>
      <ElectrochemCell
        config={CLASS_CONFIGS[0]}
        progressRef={progressRef}
        position={[0, 0, 0]}
        microbeCount={count.microbes}
        electronCount={count.electrons}
      />
    </group>
  );
}

export function ZoomCell({ active = true }: { active?: boolean }) {
  const count = React.useMemo(() => {
    const coarse =
      typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;
    return coarse ? { microbes: 30, electrons: 34 } : { microbes: 64, electrons: 80 };
  }, []);

  return (
    <Canvas
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      camera={{ position: [0.3, 2.4, 5.6], fov: 38 }}
      frameloop={active ? 'always' : 'never'}
      onCreated={({ camera }) => camera.lookAt(0, 1.1, 0)}
    >
      <ambientLight intensity={0.55} />
      <directionalLight position={[5, 9, 5]} intensity={0.95} />
      <pointLight position={[-6, 3, 4]} intensity={0.45} color="#7fb4ff" />
      <pointLight position={[6, 2, -3]} intensity={0.3} color="#ffd9a0" />
      <RotatingCell count={count} />
    </Canvas>
  );
}
