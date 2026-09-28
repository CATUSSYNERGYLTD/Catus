import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

type MaterialName = 'fur' | 'face' | 'shadow' | 'iris' | 'pupil' | 'glint';
type WeightedBone = readonly [name: string, weight: number];
type Point3 = readonly [number, number, number];

interface GorillaPart {
  material: MaterialName;
  center: Point3;
  radius: Point3;
  boneWeights: readonly WeightedBone[];
  saddle?: boolean;
  color?: string;
  rotation?: THREE.Quaternion;
}

interface BoneDefinition {
  name: string;
  parent: string | null;
  position: Point3;
}

export interface GorillaRig {
  root: THREE.Group;
  bones: Map<string, THREE.Bone>;
  fingerBones: Array<{ name: string; side: number; digit: number; segment: number }>;
}

export interface GorillaMotion {
  timeSeconds: number;
  pointerX: number;
  pointerY: number;
  scrollProgress: number;
}

const MATERIAL_COLORS: Record<MaterialName, string> = {
  fur: '#30353a',
  face: '#3b4248',
  shadow: '#07090b',
  iris: '#8b6239',
  pupil: '#090909',
  glint: '#f2e4ca',
};

function smoothstep(edge0: number, edge1: number, value: number) {
  const t = THREE.MathUtils.clamp((value - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

function createMaterials(): Record<MaterialName, THREE.MeshStandardMaterial> {
  const fur = new THREE.MeshStandardMaterial({
    color: MATERIAL_COLORS.fur,
    roughness: 0.92,
    metalness: 0.015,
    vertexColors: true,
  });

  fur.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader.replace(
      '#include <common>',
      '#include <common>\nvarying vec3 vGorillaFurPosition;',
    );
    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      '#include <begin_vertex>\nvGorillaFurPosition = position;',
    );
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <common>',
      '#include <common>\nvarying vec3 vGorillaFurPosition;',
    );
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <color_fragment>',
      `#include <color_fragment>
       float furGrain = sin(vGorillaFurPosition.x * 171.0
         + vGorillaFurPosition.y * 113.0
         + sin(vGorillaFurPosition.z * 89.0) * 2.4);
       diffuseColor.rgb *= 0.98 + furGrain * 0.025;`,
    );
  };
  fur.customProgramCacheKey = () => 'catus-gorilla-fur-grain-v1';

  return {
    fur,
    face: new THREE.MeshStandardMaterial({
      color: MATERIAL_COLORS.face,
      roughness: 0.5,
      metalness: 0.01,
      vertexColors: true,
    }),
    shadow: new THREE.MeshStandardMaterial({
      color: MATERIAL_COLORS.shadow,
      roughness: 0.78,
      metalness: 0.01,
      vertexColors: true,
    }),
    iris: new THREE.MeshStandardMaterial({
      color: MATERIAL_COLORS.iris,
      roughness: 0.28,
      metalness: 0.02,
      vertexColors: true,
    }),
    pupil: new THREE.MeshStandardMaterial({
      color: MATERIAL_COLORS.pupil,
      roughness: 0.2,
      metalness: 0.03,
      vertexColors: true,
    }),
    glint: new THREE.MeshStandardMaterial({
      color: MATERIAL_COLORS.glint,
      roughness: 0.12,
      metalness: 0,
      vertexColors: true,
    }),
  };
}

function addBone(
  definitions: BoneDefinition[],
  name: string,
  parent: string | null,
  position: Point3,
) {
  definitions.push({ name, parent, position });
}

function makeEllipsoid(
  part: GorillaPart,
  boneIndices: Map<string, number>,
  radialSegments: number,
  heightSegments: number,
): THREE.BufferGeometry {
  const geometry = new THREE.SphereGeometry(1, radialSegments, heightSegments);
  const [radiusX, radiusY, radiusZ] = part.radius;
  const colors: number[] = [];
  const baseColor = new THREE.Color(part.color ?? MATERIAL_COLORS[part.material]);
  const saddleColor = new THREE.Color('#747f89');
  const sourcePositions = geometry.getAttribute('position');

  for (let index = 0; index < sourcePositions.count; index += 1) {
    const x = sourcePositions.getX(index);
    const y = sourcePositions.getY(index);
    const z = sourcePositions.getZ(index);
    const localColor = baseColor.clone();

    if (part.saddle) {
      const back = smoothstep(0.12, 0.7, -z);
      const upper = smoothstep(0.04, 0.45, y);
      localColor.lerp(saddleColor, back * upper * 0.88);
    }

    const grain = Math.sin(x * 13.7 + y * 18.3 + z * 11.9) * 0.025;
    localColor.multiplyScalar(0.97 + grain);
    colors.push(localColor.r, localColor.g, localColor.b);
  }

  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.scale(radiusX, radiusY, radiusZ);
  if (part.rotation) geometry.applyQuaternion(part.rotation);
  geometry.translate(...part.center);

  const influenceList = part.boneWeights
    .filter(([name, weight]) => boneIndices.has(name) && weight > 0)
    .slice(0, 4);
  const totalWeight = influenceList.reduce((total, [, weight]) => total + weight, 0) || 1;
  const indices = new Uint16Array(sourcePositions.count * 4);
  const weights = new Float32Array(sourcePositions.count * 4);
  const normalizedInfluences = influenceList.map(([name, weight]) => [
    boneIndices.get(name) ?? 0,
    weight / totalWeight,
  ] as const);

  for (let vertex = 0; vertex < sourcePositions.count; vertex += 1) {
    normalizedInfluences.forEach(([boneIndex, weight], slot) => {
      const offset = vertex * 4 + slot;
      indices[offset] = boneIndex;
      weights[offset] = weight;
    });
  }

  geometry.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(indices, 4));
  geometry.setAttribute('skinWeight', new THREE.Float32BufferAttribute(weights, 4));
  geometry.computeVertexNormals();
  return geometry;
}

function addPart(
  parts: GorillaPart[],
  material: MaterialName,
  center: Point3,
  radius: Point3,
  boneWeights: readonly WeightedBone[],
  extras: Pick<GorillaPart, 'saddle' | 'color' | 'rotation'> = {},
) {
  parts.push({ material, center, radius, boneWeights, ...extras });
}

function addMuscleCapsule(
  parts: GorillaPart[],
  material: MaterialName,
  start: THREE.Vector3,
  end: THREE.Vector3,
  radiusX: number,
  radiusZ: number,
  boneWeights: readonly WeightedBone[],
  color?: string,
) {
  const direction = end.clone().sub(start);
  const center = start.clone().add(end).multiplyScalar(0.5);
  const rotation = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    direction.clone().normalize(),
  );
  addPart(
    parts,
    material,
    [center.x, center.y, center.z],
    [radiusX, direction.length() * 0.5 + radiusX * 0.38, radiusZ],
    boneWeights,
    { color, rotation },
  );
}

function makeBoneDefinitions(): {
  definitions: BoneDefinition[];
  fingerBones: GorillaRig['fingerBones'];
} {
  const definitions: BoneDefinition[] = [
    { name: 'root', parent: null, position: [0, 0, 0] },
    { name: 'pelvis', parent: 'root', position: [0, 1.34, 0] },
    { name: 'spine', parent: 'pelvis', position: [0, 1.82, 0] },
    { name: 'chest', parent: 'spine', position: [0, 2.38, 0] },
    { name: 'neck', parent: 'chest', position: [0, 2.91, 0] },
    { name: 'head', parent: 'neck', position: [0, 3.19, 0] },
    { name: 'jaw', parent: 'head', position: [0, 2.91, 0.32] },
    { name: 'eye_L', parent: 'head', position: [-0.17, 3.2, 0.48] },
    { name: 'eye_R', parent: 'head', position: [0.17, 3.2, 0.48] },
  ];
  const fingerBones: GorillaRig['fingerBones'] = [];
  const fingerOffsets = [-0.22, -0.075, 0.075, 0.22];

  for (const side of [-1, 1]) {
    const suffix = side < 0 ? 'L' : 'R';
    addBone(definitions, `shoulder_${suffix}`, 'chest', [side * 0.63, 2.55, 0]);
    addBone(definitions, `upperArm_${suffix}`, `shoulder_${suffix}`, [side * 0.9, 2.08, 0.02]);
    addBone(definitions, `forearm_${suffix}`, `upperArm_${suffix}`, [side * 1.07, 1.39, 0.1]);
    addBone(definitions, `hand_${suffix}`, `forearm_${suffix}`, [side * 1.14, 0.73, 0.2]);

    addBone(definitions, `hip_${suffix}`, 'pelvis', [side * 0.36, 1.16, -0.02]);
    addBone(definitions, `thigh_${suffix}`, `hip_${suffix}`, [side * 0.39, 0.95, -0.02]);
    addBone(definitions, `shin_${suffix}`, `thigh_${suffix}`, [side * 0.43, 0.4, 0.02]);
    addBone(definitions, `foot_${suffix}`, `shin_${suffix}`, [side * 0.44, 0.13, 0.23]);

    for (let digit = 0; digit < 5; digit += 1) {
      const isThumb = digit === 0;
      const digitName = `finger_${suffix}_${digit}`;
      const baseX = side * 1.14 + (isThumb ? side * 0.23 : fingerOffsets[digit - 1]);
      const baseY = isThumb ? 0.67 : 0.63;
      const baseZ = isThumb ? 0.23 : 0.27;
      const middle = isThumb
        ? [side * 1.44, 0.49, 0.32] as const
        : [baseX + fingerOffsets[digit - 1] * 0.08, 0.42, 0.34] as const;
      const tip = isThumb
        ? [side * 1.5, 0.34, 0.4] as const
        : [middle[0] + fingerOffsets[digit - 1] * 0.08, digit === 2 ? 0.2 : 0.23, 0.38] as const;
      const end = isThumb
        ? [side * 1.46, 0.25, 0.43] as const
        : [tip[0], digit === 2 ? 0.09 : 0.12, 0.39] as const;

      addBone(definitions, `${digitName}_0`, `hand_${suffix}`, [baseX, baseY, baseZ]);
      addBone(definitions, `${digitName}_1`, `${digitName}_0`, middle);
      addBone(definitions, `${digitName}_2`, `${digitName}_1`, tip);
      fingerBones.push({ name: `${digitName}_0`, side, digit, segment: 0 });
      fingerBones.push({ name: `${digitName}_1`, side, digit, segment: 1 });
      fingerBones.push({ name: `${digitName}_2`, side, digit, segment: 2 });
    }
  }

  return { definitions, fingerBones };
}

function addGorillaBodyParts(parts: GorillaPart[]) {
  const blend = (primary: string, secondary: string, primaryWeight = 0.84) =>
    [[primary, primaryWeight], [secondary, 1 - primaryWeight]] as const;

  addPart(parts, 'fur', [0, 1.35, -0.01], [0.64, 0.48, 0.47], [['pelvis', 0.84], ['spine', 0.16]]);
  addPart(parts, 'fur', [0, 1.79, 0.01], [0.61, 0.56, 0.45], [['spine', 0.74], ['chest', 0.26]]);
  addPart(parts, 'fur', [0, 2.37, 0], [0.88, 0.68, 0.56], [['chest', 0.88], ['spine', 0.12]], { saddle: true });
  addPart(parts, 'fur', [0, 2.72, -0.03], [0.51, 0.37, 0.43], [['chest', 0.78], ['neck', 0.22]], { saddle: true });
  addPart(parts, 'fur', [0, 2.84, 0], [0.4, 0.4, 0.34], [['neck', 0.86], ['chest', 0.14]]);

  for (const side of [-1, 1]) {
    const suffix = side < 0 ? 'L' : 'R';
    addPart(
      parts,
      'fur',
      [side * 0.51, 2.69, 0.05],
      [0.34, 0.2, 0.31],
      [['chest', 0.56], [`shoulder_${suffix}`, 0.44]],
      { color: '#59636d' },
    );
    addPart(parts, 'fur', [side * 0.37, 2.37, 0.3], [0.48, 0.38, 0.29], [['chest', 0.82], [`shoulder_${suffix}`, 0.18]]);
    addPart(parts, 'fur', [side * 0.48, 2.69, -0.03], [0.4, 0.48, 0.37], [['chest', 0.78], [`shoulder_${suffix}`, 0.22]], { saddle: true });
    addPart(parts, 'fur', [side * 0.43, 2.13, -0.29], [0.39, 0.58, 0.3], [['spine', 0.48], ['chest', 0.52]], { saddle: true });

    const shoulder = new THREE.Vector3(side * 0.63, 2.55, 0);
    const elbow = new THREE.Vector3(side * 0.9, 1.98, 0.04);
    const forearmStart = new THREE.Vector3(side * 0.9, 1.98, 0.04);
    const wrist = new THREE.Vector3(side * 1.07, 1.32, 0.1);
    addMuscleCapsule(parts, 'fur', shoulder, elbow, 0.34, 0.32, blend(`upperArm_${suffix}`, `shoulder_${suffix}`, 0.72));
    addPart(parts, 'fur', [side * 0.93, 1.85, 0.05], [0.32, 0.34, 0.31], [['upperArm_' + suffix, 0.55], ['forearm_' + suffix, 0.45]]);
    addMuscleCapsule(parts, 'fur', forearmStart, wrist, 0.31, 0.3, blend(`forearm_${suffix}`, `upperArm_${suffix}`, 0.78));
    addPart(parts, 'fur', [side * 1.1, 0.91, 0.15], [0.25, 0.32, 0.25], [['hand_' + suffix, 0.68], ['forearm_' + suffix, 0.32]]);
    addPart(parts, 'fur', [side * 1.14, 0.63, 0.21], [0.31, 0.3, 0.23], [['hand_' + suffix, 0.88], ['forearm_' + suffix, 0.12]]);

    const hip = new THREE.Vector3(side * 0.36, 1.16, -0.02);
    const knee = new THREE.Vector3(side * 0.39, 0.88, 0.04);
    const lowerLegStart = new THREE.Vector3(side * 0.39, 0.88, 0.04);
    const ankle = new THREE.Vector3(side * 0.43, 0.34, 0.06);
    addPart(parts, 'fur', [side * 0.39, 1.02, -0.03], [0.4, 0.55, 0.42], [['thigh_' + suffix, 0.84], ['hip_' + suffix, 0.16]]);
    addPart(parts, 'fur', [side * 0.42, 0.75, 0.11], [0.34, 0.34, 0.34], [['thigh_' + suffix, 0.58], ['shin_' + suffix, 0.42]]);
    addMuscleCapsule(parts, 'fur', lowerLegStart, ankle, 0.28, 0.28, blend(`shin_${suffix}`, `thigh_${suffix}`, 0.82));
    addPart(parts, 'fur', [side * 0.44, 0.17, 0.25], [0.33, 0.18, 0.45], [['foot_' + suffix, 0.86], ['shin_' + suffix, 0.14]]);

    for (let digit = 0; digit < 5; digit += 1) {
      const isThumb = digit === 0;
      const offset = isThumb ? side * 0.23 : [-0.22, -0.075, 0.075, 0.22][digit - 1];
      const baseX = side * 1.14 + offset;
      const base = new THREE.Vector3(baseX, isThumb ? 0.67 : 0.63, isThumb ? 0.23 : 0.27);
      const middle = isThumb
        ? new THREE.Vector3(side * 1.44, 0.49, 0.32)
        : new THREE.Vector3(baseX + offset * 0.08, 0.42, 0.34);
      const tip = isThumb
        ? new THREE.Vector3(side * 1.5, 0.34, 0.4)
        : new THREE.Vector3(middle.x + offset * 0.08, digit === 2 ? 0.2 : 0.23, 0.38);
      const end = isThumb
        ? new THREE.Vector3(side * 1.46, 0.25, 0.43)
        : new THREE.Vector3(tip.x, digit === 2 ? 0.09 : 0.12, 0.39);
      const name = `finger_${suffix}_${digit}`;
      addMuscleCapsule(parts, 'fur', base, middle, isThumb ? 0.095 : 0.075, 0.075, blend(`${name}_0`, `hand_${suffix}`, 0.82));
      addMuscleCapsule(parts, 'fur', middle, tip, isThumb ? 0.078 : 0.064, 0.063, blend(`${name}_1`, `${name}_0`, 0.82));
      addMuscleCapsule(parts, 'fur', tip, end, isThumb ? 0.064 : 0.052, 0.052, blend(`${name}_2`, `${name}_1`, 0.84));
    }
  }
}

function addGorillaFaceParts(parts: GorillaPart[]) {
  addPart(parts, 'fur', [0, 3.2, -0.02], [0.49, 0.59, 0.44], [['head', 0.88], ['neck', 0.12]]);
  addPart(parts, 'face', [0, 3.16, 0.29], [0.36, 0.43, 0.22], [['head', 1]], { color: '#25292d' });
  addPart(parts, 'face', [-0.28, 3.08, 0.24], [0.24, 0.28, 0.22], [['head', 1]], { color: '#25292d' });
  addPart(parts, 'face', [0.28, 3.08, 0.24], [0.24, 0.28, 0.22], [['head', 1]], { color: '#25292d' });
  addPart(parts, 'face', [0, 2.97, 0.5], [0.31, 0.23, 0.27], [['head', 0.88], ['jaw', 0.12]], { color: '#303337' });
  addPart(parts, 'face', [0, 3.075, 0.73], [0.205, 0.135, 0.12], [['head', 1]], { color: '#34373a' });
  addPart(parts, 'shadow', [-0.094, 3.095, 0.826], [0.052, 0.037, 0.024], [['head', 1]], { color: '#07090b' });
  addPart(parts, 'shadow', [0.094, 3.095, 0.826], [0.052, 0.037, 0.024], [['head', 1]], { color: '#07090b' });
  addPart(parts, 'face', [0, 2.79, 0.55], [0.25, 0.095, 0.19], [['jaw', 0.9], ['head', 0.1]], { color: '#24282c' });
  addPart(parts, 'shadow', [0, 2.865, 0.72], [0.19, 0.026, 0.025], [['jaw', 0.85], ['head', 0.15]], { color: '#0a0d10' });

  for (const side of [-1, 1]) {
    const suffix = side < 0 ? 'L' : 'R';
    addPart(parts, 'fur', [side * 0.175, 3.36, 0.39], [0.22, 0.12, 0.16], [['head', 1]], { color: '#171b1e' });
    addPart(parts, 'shadow', [side * 0.17, 3.2, 0.49], [0.115, 0.078, 0.066], [[`eye_${suffix}`, 1]], { color: '#090b0d' });
    addPart(parts, 'face', [side * 0.17, 3.2, 0.535], [0.064, 0.044, 0.034], [[`eye_${suffix}`, 1]], { color: '#9a7446' });
    addPart(parts, 'iris', [side * 0.17, 3.2, 0.562], [0.031, 0.032, 0.021], [[`eye_${suffix}`, 1]], { color: '#6d4823' });
    addPart(parts, 'pupil', [side * 0.17, 3.2, 0.578], [0.014, 0.022, 0.014], [[`eye_${suffix}`, 1]], { color: '#090909' });
    addPart(parts, 'glint', [side * 0.18, 3.211, 0.591], [0.008, 0.008, 0.006], [[`eye_${suffix}`, 1]], { color: '#f2e4ca' });
    addPart(parts, 'face', [side * 0.52, 3.17, -0.015], [0.13, 0.19, 0.13], [['head', 1]], { color: '#202428' });
    addPart(parts, 'shadow', [side * 0.565, 3.17, 0.05], [0.057, 0.105, 0.035], [['head', 1]], { color: '#131619' });
  }
}

export function createGorillaRig(options: { softwareFallback?: boolean } = {}): GorillaRig {
  const root = new THREE.Group();
  root.name = 'CatusSilverbackRig';
  const { definitions, fingerBones } = makeBoneDefinitions();
  const bones = new Map<string, THREE.Bone>();
  const globalPositions = new Map<string, THREE.Vector3>();

  for (const definition of definitions) {
    const bone = new THREE.Bone();
    bone.name = definition.name;
    const globalPosition = new THREE.Vector3(...definition.position);
    const parentBone = definition.parent ? bones.get(definition.parent) : undefined;
    if (parentBone && definition.parent) {
      bone.position.copy(globalPosition).sub(globalPositions.get(definition.parent)!);
      parentBone.add(bone);
    } else {
      bone.position.copy(globalPosition);
      root.add(bone);
    }
    bones.set(definition.name, bone);
    globalPositions.set(definition.name, globalPosition);
  }

  const skeleton = new THREE.Skeleton(Array.from(bones.values()));
  const boneIndices = new Map(Array.from(bones.keys()).map((name, index) => [name, index]));
  const parts: GorillaPart[] = [];
  const radialSegments = options.softwareFallback ? 16 : 28;
  const heightSegments = options.softwareFallback ? 10 : 20;
  addGorillaBodyParts(parts);
  addGorillaFaceParts(parts);

  const geometriesByMaterial = new Map<MaterialName, THREE.BufferGeometry[]>();
  parts.forEach((part) => {
    const geometry = makeEllipsoid(part, boneIndices, radialSegments, heightSegments);
    const geometries = geometriesByMaterial.get(part.material) ?? [];
    geometries.push(geometry);
    geometriesByMaterial.set(part.material, geometries);
  });

  const materials = createMaterials();
  geometriesByMaterial.forEach((geometries, materialName) => {
    const merged = mergeGeometries(geometries, false);
    geometries.forEach((geometry) => geometry.dispose());
    if (!merged) return;
    merged.computeBoundingBox();
    merged.computeBoundingSphere();

    const mesh = new THREE.SkinnedMesh(merged, materials[materialName]);
    mesh.name = `gorilla-${materialName}`;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.frustumCulled = false;
    root.add(mesh);
    mesh.bind(skeleton);
    mesh.normalizeSkinWeights();
  });

  root.updateMatrixWorld(true);
  skeleton.calculateInverses();
  return { root, bones, fingerBones };
}

function gesturePulse(time: number, start: number, end: number) {
  const progress = (time - start) / (end - start);
  if (progress <= 0 || progress >= 1) return 0;
  const eased = progress * progress * (3 - 2 * progress);
  return Math.sin(Math.PI * eased);
}

export function animateGorillaRig(rig: GorillaRig, motion: GorillaMotion) {
  const { timeSeconds, pointerX, pointerY, scrollProgress } = motion;
  const time = Math.max(0, timeSeconds);
  const breath = 0.5 + 0.5 * Math.sin((time * Math.PI * 2) / 4.8 - Math.PI / 2);
  const cycleLength = 12.4;
  const cycleTime = (time + 1.8) % cycleLength;
  const action = gesturePulse(cycleTime, 6.2, 10.1);
  const actionSide = Math.floor((time + 1.8) / cycleLength) % 2 === 0 ? 1 : -1;
  const weightShift = Math.sin(time * 0.31) * 0.025 + action * actionSide * 0.045;
  const getBone = (name: string) => rig.bones.get(name);
  const pelvis = getBone('pelvis');
  const spine = getBone('spine');
  const chest = getBone('chest');
  const neck = getBone('neck');
  const head = getBone('head');
  const jaw = getBone('jaw');

  rig.root.rotation.y = pointerX * 0.16 + scrollProgress * 0.19;
  rig.root.rotation.z = pointerX * -0.018 + weightShift * 0.12;
  rig.root.position.y = Math.sin(time * 0.72) * 0.008 + scrollProgress * 0.035;

  if (pelvis) {
    pelvis.rotation.z = weightShift * 0.42;
    pelvis.rotation.y = Math.sin(time * 0.2) * 0.012;
  }
  if (spine) {
    spine.scale.set(1 + breath * 0.01, 1, 1 + breath * 0.028);
    spine.rotation.z = -weightShift * 0.3;
  }
  if (chest) {
    chest.scale.set(
      1 + breath * 0.034,
      1 + breath * 0.014,
      1 + breath * 0.058,
    );
    chest.rotation.x = 0.06 + Math.sin(time * 0.28) * 0.012 + breath * 0.022;
    chest.rotation.z = -weightShift * 0.48;
    chest.rotation.y = pointerX * 0.08 + Math.sin(time * 0.17) * 0.012;
  }
  if (neck) {
    neck.rotation.x = -0.045 + pointerY * 0.075 - breath * 0.009;
    neck.rotation.y = pointerX * 0.2 + action * actionSide * 0.045;
    neck.rotation.z = Math.sin(time * 0.2) * 0.012;
  }
  if (head) {
    head.rotation.x = pointerY * 0.13 + Math.sin(time * 0.44) * 0.012 + action * 0.035;
    head.rotation.y = pointerX * 0.34 + action * actionSide * 0.19 + Math.sin(time * 0.21) * 0.035;
    head.rotation.z = Math.sin(time * 0.33) * 0.018 + weightShift * 0.16;
  }
  if (jaw) jaw.rotation.x = Math.sin(time * 0.52) * 0.006 + breath * 0.005;

  for (const side of [-1, 1]) {
    const suffix = side < 0 ? 'L' : 'R';
    const shoulder = getBone(`shoulder_${suffix}`);
    const upperArm = getBone(`upperArm_${suffix}`);
    const forearm = getBone(`forearm_${suffix}`);
    const hand = getBone(`hand_${suffix}`);
    const hip = getBone(`hip_${suffix}`);
    const thigh = getBone(`thigh_${suffix}`);
    const shin = getBone(`shin_${suffix}`);
    const foot = getBone(`foot_${suffix}`);
    const phase = side < 0 ? 0 : Math.PI;

    if (shoulder) {
      shoulder.rotation.z = side * (breath * 0.032 + Math.sin(time * 0.56 + phase) * 0.01);
      shoulder.rotation.x = Math.sin(time * 0.31 + phase) * 0.015;
    }
    if (upperArm) {
      upperArm.rotation.x = 0.025 + Math.sin(time * 0.48 + phase) * 0.026 + action * 0.018;
      upperArm.rotation.z = side * (0.018 + weightShift * 0.28);
    }
    if (forearm) {
      forearm.rotation.x = 0.012 + Math.sin(time * 0.62 + phase) * 0.024 + action * 0.028;
      forearm.rotation.z = side * (0.018 + Math.sin(time * 0.29 + phase) * 0.012);
    }
    if (hand) {
      hand.rotation.x = Math.sin(time * 0.62 + phase) * 0.03 + action * 0.035;
      hand.rotation.z = side * Math.sin(time * 0.3 + phase) * 0.018;
    }
    if (hip) hip.rotation.z = side * weightShift * 0.18;
    if (thigh) {
      thigh.rotation.z = side * weightShift * 0.22;
      thigh.rotation.x = Math.sin(time * 0.3 + phase) * 0.008;
    }
    if (shin) shin.rotation.z = -side * Math.max(0, weightShift * side) * 0.12;
    if (foot) foot.rotation.x = Math.sin(time * 0.3 + phase) * 0.008;

    const eye = getBone(`eye_${suffix}`);
    if (eye) {
      eye.rotation.y = pointerX * 0.11 + action * actionSide * 0.035;
      eye.rotation.x = pointerY * 0.04;
    }
  }

  rig.fingerBones.forEach(({ name, side, digit, segment }) => {
    const finger = getBone(name);
    if (!finger) return;
    const phase = time * 0.8 + digit * 0.52 + (side < 0 ? 0 : Math.PI);
    const curl = 0.055 + action * 0.055 + Math.sin(phase) * 0.018;
    finger.rotation.x = curl * (segment === 0 ? 0.72 : segment === 1 ? 1 : 0.8);
    if (digit === 0) finger.rotation.z = side * (segment === 0 ? -0.14 : -0.08);
  });
}

export function disposeGorillaRig(rig: GorillaRig) {
  rig.root.traverse((object) => {
    if (object instanceof THREE.SkinnedMesh) {
      object.geometry.dispose();
      if (Array.isArray(object.material)) object.material.forEach((material) => material.dispose());
      else object.material.dispose();
    }
  });
}