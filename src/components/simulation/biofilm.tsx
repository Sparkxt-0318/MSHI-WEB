'use client';

import * as React from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { SCENE } from './sim-constants';
import { mulberry32, simulateFrame, smoothstep } from './sim-model';
import type { ClassConfig } from './simulation-types';

interface BiofilmProps {
  config: ClassConfig;
  progressRef: React.MutableRefObject<number>;
  count: number;
}

interface Microbe {
  pos: THREE.Vector3;
  scale: number;
  threshold: number; // coverage fraction at which this microbe appears
}

/** A column of instanced microbe blobs hugging the working electrode; the
 *  visible/grown fraction tracks biofilm coverage for this soil class. */
export function Biofilm({ config, progressRef, count }: BiofilmProps) {
  const meshRef = React.useRef<THREE.InstancedMesh>(null);
  const dummy = React.useMemo(() => new THREE.Object3D(), []);

  const microbes = React.useMemo<Microbe[]>(() => {
    const seed = config.key.split('').reduce((a, c) => a + c.charCodeAt(0), 7);
    const rand = mulberry32(seed * 2654435761);
    const soilTop = SCENE.soilHeight;
    const out: Microbe[] = [];
    for (let i = 0; i < count; i++) {
      const angle = rand() * Math.PI * 2;
      const radius = SCENE.electrodeRadius + 0.04 + rand() * 0.2;
      const h = soilTop - 0.15 + rand() * 1.15;
      out.push({
        pos: new THREE.Vector3(
          Math.cos(angle) * radius,
          h,
          Math.sin(angle) * radius,
        ),
        scale: 0.05 + rand() * 0.06,
        // sort-ish growth: lower microbes appear first
        threshold: (i + rand() * 0.6) / count,
      });
    }
    return out;
  }, [config.key, count]);

  const emissive = React.useMemo(() => new THREE.Color(config.hex), [config.hex]);

  useFrame(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const { coverage } = simulateFrame(config.key, progressRef.current);
    const covFrac = coverage / config.K; // 0..1 toward maturity
    for (let i = 0; i < microbes.length; i++) {
      const m = microbes[i];
      const grow = smoothstep(m.threshold - 0.08, m.threshold + 0.02, covFrac);
      const s = m.scale * grow;
      dummy.position.copy(m.pos);
      dummy.scale.setScalar(Math.max(s, 0.0001));
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, count]}
      frustumCulled={false}
    >
      <icosahedronGeometry args={[1, 1]} />
      <meshStandardMaterial
        color={config.hex}
        emissive={emissive}
        emissiveIntensity={0.35}
        roughness={0.55}
        metalness={0.05}
      />
    </instancedMesh>
  );
}
