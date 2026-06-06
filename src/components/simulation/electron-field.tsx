'use client';

import * as React from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ELECTRON_HEX, SCENE } from './sim-constants';
import { mulberry32, simulateFrame } from './sim-model';
import type { ClassConfig } from './simulation-types';

interface ElectronFieldProps {
  config: ClassConfig;
  progressRef: React.MutableRefObject<number>;
  count: number;
}

interface Spec {
  angle0: number;
  radius: number;
  spin: number;
  jitter: number;
  yStart: number;
  yTop: number;
}

/**
 * Instanced glowing electrons streaming up the working electrode (extracellular
 * electron transfer). A bright additive core + a larger additive halo fake a
 * bloom on the dark scope. Emission count / speed / brightness scale with the
 * class's instantaneous current.
 */
export function ElectronField({ config, progressRef, count }: ElectronFieldProps) {
  const coreRef = React.useRef<THREE.InstancedMesh>(null);
  const haloRef = React.useRef<THREE.InstancedMesh>(null);
  const dummy = React.useMemo(() => new THREE.Object3D(), []);
  const tmpColor = React.useMemo(() => new THREE.Color(), []);
  const electronColor = React.useMemo(() => new THREE.Color(ELECTRON_HEX), []);
  const phases = React.useRef<Float32Array>(new Float32Array(count));

  const specs = React.useMemo<Spec[]>(() => {
    const seed =
      config.key.split('').reduce((a, c) => a + c.charCodeAt(0), 13) * 40503;
    const rand = mulberry32(seed);
    const soilTop = SCENE.soilHeight;
    const out: Spec[] = [];
    for (let i = 0; i < count; i++) {
      phases.current[i] = rand();
      out.push({
        angle0: rand() * Math.PI * 2,
        radius: SCENE.electrodeRadius + 0.05 + rand() * 0.06,
        spin: (rand() - 0.5) * 2.6,
        jitter: 0.8 + rand() * 0.5,
        yStart: soilTop - 0.1,
        yTop: soilTop + 1.35 + rand() * 0.25,
      });
    }
    return out;
  }, [config.key, count]);

  useFrame((_, delta) => {
    const core = coreRef.current;
    const halo = haloRef.current;
    if (!core || !halo) return;
    const dt = Math.min(delta, 0.05);
    const { electronRate } = simulateFrame(config.key, progressRef.current);
    const active = Math.round(count * electronRate * 0.92 + count * 0.03);
    const speed = 0.3 + 1.2 * electronRate;

    for (let i = 0; i < count; i++) {
      const sp = specs[i];
      if (i >= active) {
        dummy.scale.setScalar(0.0001);
        dummy.position.set(0, sp.yStart, 0);
        dummy.updateMatrix();
        core.setMatrixAt(i, dummy.matrix);
        halo.setMatrixAt(i, dummy.matrix);
        continue;
      }
      let u = phases.current[i] + dt * speed * sp.jitter;
      u %= 1;
      phases.current[i] = u;
      const y = sp.yStart + (sp.yTop - sp.yStart) * u;
      const angle = sp.angle0 + u * sp.spin;
      const x = Math.cos(angle) * sp.radius;
      const z = Math.sin(angle) * sp.radius;
      const bri = Math.sin(Math.PI * u); // bright in the middle of the path

      dummy.position.set(x, y, z);
      dummy.scale.setScalar(0.03 + 0.01 * bri);
      dummy.updateMatrix();
      core.setMatrixAt(i, dummy.matrix);
      tmpColor.copy(electronColor).multiplyScalar(0.55 + 0.45 * bri);
      core.setColorAt(i, tmpColor);

      dummy.scale.setScalar(0.085 + 0.05 * bri);
      dummy.updateMatrix();
      halo.setMatrixAt(i, dummy.matrix);
      tmpColor.copy(electronColor).multiplyScalar(0.18 + 0.22 * bri);
      halo.setColorAt(i, tmpColor);
    }
    core.instanceMatrix.needsUpdate = true;
    halo.instanceMatrix.needsUpdate = true;
    if (core.instanceColor) core.instanceColor.needsUpdate = true;
    if (halo.instanceColor) halo.instanceColor.needsUpdate = true;
  });

  return (
    <group>
      <instancedMesh
        ref={haloRef}
        args={[undefined, undefined, count]}
        frustumCulled={false}
      >
        <sphereGeometry args={[1, 8, 8]} />
        <meshBasicMaterial
          color={ELECTRON_HEX}
          transparent
          opacity={0.9}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </instancedMesh>
      <instancedMesh
        ref={coreRef}
        args={[undefined, undefined, count]}
        frustumCulled={false}
      >
        <sphereGeometry args={[1, 10, 10]} />
        <meshBasicMaterial
          color={ELECTRON_HEX}
          transparent
          opacity={1}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </instancedMesh>
    </group>
  );
}
