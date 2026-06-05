'use client';

import * as React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { ElectrochemCell } from './electrochem-cell';
import { BUDGET, CLASS_CONFIGS, SCENE, SCOPE_BG } from './sim-constants';

interface CellSceneProps {
  progressRef: React.MutableRefObject<number>;
  reducedMotion: boolean;
}

/** The interactive 3D stage: three cells the viewer can orbit, zoom and look around. */
function CellSceneImpl({ progressRef, reducedMotion }: CellSceneProps) {
  const coarse = React.useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(pointer: coarse)').matches;
  }, []);
  const microbeCount = coarse ? BUDGET.microbesMobile : BUDGET.microbesDesktop;
  const electronCount = coarse ? BUDGET.electronsMobile : BUDGET.electronsDesktop;

  return (
    <Canvas
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      camera={{ position: [0.5, 2.9, 9], fov: 42 }}
    >
      <fog attach="fog" args={[SCOPE_BG, 15, 32]} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 9, 5]} intensity={0.95} />
      <pointLight position={[-6, 3, 4]} intensity={0.4} color="#7fb4ff" />
      <pointLight position={[6, 2, -3]} intensity={0.3} color="#ffd9a0" />

      {/* dark floor to ground the cells */}
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[12, 64]} />
        <meshStandardMaterial color="#0b1622" roughness={0.95} metalness={0.1} />
      </mesh>

      {CLASS_CONFIGS.map((cfg, i) => (
        <ElectrochemCell
          key={cfg.key}
          config={cfg}
          progressRef={progressRef}
          position={[(i - 1) * SCENE.cellSpacing, 0, 0]}
          microbeCount={microbeCount}
          electronCount={electronCount}
        />
      ))}

      <OrbitControls
        makeDefault
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        autoRotate={!reducedMotion}
        autoRotateSpeed={0.5}
        minDistance={5}
        maxDistance={15}
        minPolarAngle={Math.PI * 0.12}
        maxPolarAngle={Math.PI * 0.52}
        target={[0, 1, 0]}
      />
    </Canvas>
  );
}

/** Memoized: the throttled chrome re-renders ~12×/s and must not re-reconcile
 *  the WebGL scene (props are stable refs/booleans). */
export const CellScene = React.memo(CellSceneImpl);
