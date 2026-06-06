'use client';

import * as React from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Biofilm } from './biofilm';
import { ElectronField } from './electron-field';
import { SCENE } from './sim-constants';
import { clamp, simulateFrame } from './sim-model';
import type { ClassConfig } from './simulation-types';

interface ElectrochemCellProps {
  config: ClassConfig;
  progressRef: React.MutableRefObject<number>;
  position: [number, number, number];
  microbeCount: number;
  electronCount: number;
}

const ELECTRODE_CENTER_Y =
  SCENE.soilHeight - 0.25 + SCENE.electrodeHeight / 2;

/** One bioelectrochemical cell: vessel + soil + 3 electrodes + biofilm + electrons. */
export function ElectrochemCell({
  config,
  progressRef,
  position,
  microbeCount,
  electronCount,
}: ElectrochemCellProps) {
  const workingMat = React.useRef<THREE.MeshStandardMaterial>(null);
  const nodeMat = React.useRef<THREE.MeshBasicMaterial>(null);
  const emissive = React.useMemo(() => new THREE.Color(config.hex), [config.hex]);

  useFrame(() => {
    const { current } = simulateFrame(config.key, progressRef.current);
    const norm = clamp(current / config.caPeak);
    if (workingMat.current) workingMat.current.emissiveIntensity = 0.18 + 1.25 * norm;
    if (nodeMat.current) nodeMat.current.opacity = 0.25 + 0.6 * norm;
  });

  const elec = SCENE.electrodes;

  return (
    <group position={position}>
      {/* base platform */}
      <mesh position={[0, 0.04, 0]}>
        <cylinderGeometry args={[SCENE.vesselRadius + 0.16, SCENE.vesselRadius + 0.22, 0.08, 40]} />
        <meshStandardMaterial color="#12202f" roughness={0.8} metalness={0.2} />
      </mesh>

      {/* soil medium */}
      <mesh position={[0, SCENE.soilHeight / 2 + 0.08, 0]}>
        <cylinderGeometry args={[SCENE.vesselRadius - 0.06, SCENE.vesselRadius - 0.06, SCENE.soilHeight, 40]} />
        <meshStandardMaterial color="#2c2118" roughness={1} metalness={0} />
      </mesh>

      {/* translucent vessel */}
      <mesh position={[0, SCENE.vesselHeight / 2 + 0.08, 0]}>
        <cylinderGeometry args={[SCENE.vesselRadius, SCENE.vesselRadius, SCENE.vesselHeight, 48, 1, true]} />
        <meshStandardMaterial
          color="#bfe0f0"
          transparent
          opacity={0.1}
          roughness={0.1}
          metalness={0}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      {/* vessel rim */}
      <mesh position={[0, SCENE.vesselHeight + 0.08, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[SCENE.vesselRadius, 0.02, 8, 48]} />
        <meshStandardMaterial color="#9fc7da" roughness={0.3} metalness={0.4} transparent opacity={0.5} />
      </mesh>

      {/* working electrode (glows with the current) */}
      <mesh position={[elec.working[0], ELECTRODE_CENTER_Y + 0.08, elec.working[1]]}>
        <cylinderGeometry args={[SCENE.electrodeRadius, SCENE.electrodeRadius, SCENE.electrodeHeight, 16]} />
        <meshStandardMaterial
          ref={workingMat}
          color="#2b2f36"
          emissive={emissive}
          emissiveIntensity={0.2}
          roughness={0.4}
          metalness={0.6}
        />
      </mesh>
      {/* counter electrode */}
      <mesh position={[elec.counter[0], ELECTRODE_CENTER_Y + 0.08, elec.counter[1]]}>
        <cylinderGeometry args={[SCENE.electrodeRadius * 0.8, SCENE.electrodeRadius * 0.8, SCENE.electrodeHeight, 12]} />
        <meshStandardMaterial color="#3a4048" roughness={0.5} metalness={0.7} />
      </mesh>
      {/* reference electrode */}
      <mesh position={[elec.reference[0], ELECTRODE_CENTER_Y + 0.08, elec.reference[1]]}>
        <cylinderGeometry args={[SCENE.electrodeRadius * 0.7, SCENE.electrodeRadius * 0.7, SCENE.electrodeHeight, 12]} />
        <meshStandardMaterial color="#9aa3ad" roughness={0.3} metalness={0.85} />
      </mesh>

      {/* collector node above the working electrode */}
      <mesh position={[0, ELECTRODE_CENTER_Y + SCENE.electrodeHeight / 2 + 0.18, 0]}>
        <sphereGeometry args={[0.06, 12, 12]} />
        <meshBasicMaterial ref={nodeMat} color={config.hex} transparent opacity={0.4} toneMapped={false} />
      </mesh>

      <group position={[0, 0.08, 0]}>
        <Biofilm config={config} progressRef={progressRef} count={microbeCount} />
        <ElectronField config={config} progressRef={progressRef} count={electronCount} />
      </group>
    </group>
  );
}
