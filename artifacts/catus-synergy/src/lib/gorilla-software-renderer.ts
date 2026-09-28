import * as THREE from 'three';
import type { GorillaRig } from '@/lib/gorilla-rig';

interface SoftwareTriangle {
  depth: number;
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  fill: string;
}

const linearToSrgb = (value: number) => {
  const linear = Math.max(0, Math.min(1, value));
  return linear <= 0.0031308
    ? linear * 12.92
    : 1.055 * linear ** (1 / 2.4) - 0.055;
};

export function renderSoftwareGorilla(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  rig: GorillaRig,
  camera: THREE.PerspectiveCamera,
) {
  context.clearRect(0, 0, width, height);
  context.imageSmoothingEnabled = true;

  const glow = context.createRadialGradient(
    width * 0.51,
    height * 0.46,
    0,
    width * 0.51,
    height * 0.46,
    width * 0.44,
  );
  glow.addColorStop(0, 'rgba(34, 79, 164, .16)');
  glow.addColorStop(0.62, 'rgba(13, 36, 79, .08)');
  glow.addColorStop(1, 'rgba(7, 17, 31, 0)');
  context.fillStyle = glow;
  context.fillRect(0, 0, width, height);

  context.save();
  context.strokeStyle = 'rgba(93, 142, 236, .25)';
  context.lineWidth = Math.max(1, width / 900);
  context.beginPath();
  context.ellipse(width * 0.5, height * 0.47, width * 0.35, height * 0.42, 0, 0, Math.PI * 2);
  context.stroke();
  const groundGlow = context.createRadialGradient(
    width * 0.5,
    height * 0.86,
    1,
    width * 0.5,
    height * 0.86,
    width * 0.31,
  );
  groundGlow.addColorStop(0, 'rgba(29, 73, 157, .34)');
  groundGlow.addColorStop(1, 'rgba(9, 22, 43, 0)');
  context.fillStyle = groundGlow;
  context.beginPath();
  context.ellipse(width * 0.5, height * 0.86, width * 0.31, height * 0.075, 0, 0, Math.PI * 2);
  context.fill();
  context.restore();

  rig.root.updateMatrixWorld(true);
  camera.updateMatrixWorld(true);

  const viewProjection = new THREE.Matrix4().multiplyMatrices(
    camera.projectionMatrix,
    camera.matrixWorldInverse,
  );
  const cameraPosition = camera.getWorldPosition(new THREE.Vector3());
  const keyDirection = new THREE.Vector3(-0.42, 0.7, 0.58).normalize();
  const blueRimDirection = new THREE.Vector3(0.7, 0.15, -0.68).normalize();
  const triangles: SoftwareTriangle[] = [];
  const localVertex = new THREE.Vector3();
  const worldVertex = new THREE.Vector3();
  const clipVertex = new THREE.Vector3();
  const viewVertex = new THREE.Vector3();

  rig.root.traverse((object) => {
    if (!(object instanceof THREE.SkinnedMesh)) return;

    object.skeleton.update();
    object.updateMatrixWorld(true);
    const geometry = object.geometry;
    const positions = geometry.getAttribute('position');
    const colors = geometry.getAttribute('color');
    const indices = geometry.getIndex();
    if (!positions || !colors) return;

    const projected = new Float32Array(positions.count * 6);
    for (let index = 0; index < positions.count; index += 1) {
      localVertex.fromBufferAttribute(positions, index);
      object.applyBoneTransform(index, localVertex);
      worldVertex.copy(localVertex).applyMatrix4(object.matrixWorld);
      viewVertex.copy(worldVertex).applyMatrix4(camera.matrixWorldInverse);
      clipVertex.copy(worldVertex).applyMatrix4(viewProjection);

      const offset = index * 6;
      projected[offset] = (clipVertex.x * 0.5 + 0.5) * width;
      projected[offset + 1] = (1 - (clipVertex.y * 0.5 + 0.5)) * height;
      projected[offset + 2] = -viewVertex.z;
      projected[offset + 3] = worldVertex.x;
      projected[offset + 4] = worldVertex.y;
      projected[offset + 5] = worldVertex.z;
    }

    const triangleCount = indices ? indices.count / 3 : positions.count / 3;
    const vertexNormals = new Float32Array(positions.count * 3);
    for (let face = 0; face < triangleCount; face += 1) {
      const indexOffset = face * 3;
      const a = indices ? indices.getX(indexOffset) : indexOffset;
      const b = indices ? indices.getX(indexOffset + 1) : indexOffset + 1;
      const c = indices ? indices.getX(indexOffset + 2) : indexOffset + 2;
      const offsetA = a * 6;
      const offsetB = b * 6;
      const offsetC = c * 6;
      const depthA = projected[offsetA + 2];
      const depthB = projected[offsetB + 2];
      const depthC = projected[offsetC + 2];
      if (
        depthA < camera.near || depthA > camera.far ||
        depthB < camera.near || depthB > camera.far ||
        depthC < camera.near || depthC > camera.far
      ) continue;

      const abx = projected[offsetB + 3] - projected[offsetA + 3];
      const aby = projected[offsetB + 4] - projected[offsetA + 4];
      const abz = projected[offsetB + 5] - projected[offsetA + 5];
      const acx = projected[offsetC + 3] - projected[offsetA + 3];
      const acy = projected[offsetC + 4] - projected[offsetA + 4];
      const acz = projected[offsetC + 5] - projected[offsetA + 5];
      let normalX = aby * acz - abz * acy;
      let normalY = abz * acx - abx * acz;
      let normalZ = abx * acy - aby * acx;
      const normalLength = Math.hypot(normalX, normalY, normalZ) || 1;
      normalX /= normalLength;
      normalY /= normalLength;
      normalZ /= normalLength;

      for (const vertexIndex of [a, b, c]) {
        const normalOffset = vertexIndex * 3;
        vertexNormals[normalOffset] += normalX;
        vertexNormals[normalOffset + 1] += normalY;
        vertexNormals[normalOffset + 2] += normalZ;
      }
    }

    for (let vertexIndex = 0; vertexIndex < positions.count; vertexIndex += 1) {
      const normalOffset = vertexIndex * 3;
      const normalLength = Math.hypot(
        vertexNormals[normalOffset],
        vertexNormals[normalOffset + 1],
        vertexNormals[normalOffset + 2],
      ) || 1;
      vertexNormals[normalOffset] /= normalLength;
      vertexNormals[normalOffset + 1] /= normalLength;
      vertexNormals[normalOffset + 2] /= normalLength;
    }

    for (let face = 0; face < triangleCount; face += 1) {
      const indexOffset = face * 3;
      const a = indices ? indices.getX(indexOffset) : indexOffset;
      const b = indices ? indices.getX(indexOffset + 1) : indexOffset + 1;
      const c = indices ? indices.getX(indexOffset + 2) : indexOffset + 2;
      const offsetA = a * 6;
      const offsetB = b * 6;
      const offsetC = c * 6;
      const depthA = projected[offsetA + 2];
      const depthB = projected[offsetB + 2];
      const depthC = projected[offsetC + 2];
      if (
        depthA < camera.near || depthA > camera.far ||
        depthB < camera.near || depthB > camera.far ||
        depthC < camera.near || depthC > camera.far
      ) continue;

      const normalOffsetA = a * 3;
      const normalOffsetB = b * 3;
      const normalOffsetC = c * 3;
      let normalX = (
        vertexNormals[normalOffsetA] +
        vertexNormals[normalOffsetB] +
        vertexNormals[normalOffsetC]
      ) / 3;
      let normalY = (
        vertexNormals[normalOffsetA + 1] +
        vertexNormals[normalOffsetB + 1] +
        vertexNormals[normalOffsetC + 1]
      ) / 3;
      let normalZ = (
        vertexNormals[normalOffsetA + 2] +
        vertexNormals[normalOffsetB + 2] +
        vertexNormals[normalOffsetC + 2]
      ) / 3;
      const normalLength = Math.hypot(normalX, normalY, normalZ) || 1;
      normalX /= normalLength;
      normalY /= normalLength;
      normalZ /= normalLength;

      const centerX = (
        projected[offsetA + 3] + projected[offsetB + 3] + projected[offsetC + 3]
      ) / 3;
      const centerY = (
        projected[offsetA + 4] + projected[offsetB + 4] + projected[offsetC + 4]
      ) / 3;
      const centerZ = (
        projected[offsetA + 5] + projected[offsetB + 5] + projected[offsetC + 5]
      ) / 3;
      const toCameraX = cameraPosition.x - centerX;
      const toCameraY = cameraPosition.y - centerY;
      const toCameraZ = cameraPosition.z - centerZ;
      if (normalX * toCameraX + normalY * toCameraY + normalZ * toCameraZ <= 0) continue;

      const keyLight = Math.max(
        0,
        normalX * keyDirection.x + normalY * keyDirection.y + normalZ * keyDirection.z,
      );
      const rimLight = Math.max(
        0,
        normalX * blueRimDirection.x + normalY * blueRimDirection.y + normalZ * blueRimDirection.z,
      );
      const shading = 0.72 + keyLight * 0.58 + rimLight * 0.34;
      const red = (
        colors.getX(a) + colors.getX(b) + colors.getX(c)
      ) / 3 * shading;
      const green = (
        colors.getY(a) + colors.getY(b) + colors.getY(c)
      ) / 3 * shading;
      const blue = (
        colors.getZ(a) + colors.getZ(b) + colors.getZ(c)
      ) / 3 * shading;
      const fill = `rgb(${Math.round(linearToSrgb(red) * 255)},${Math.round(linearToSrgb(green) * 255)},${Math.round(linearToSrgb(blue) * 255)})`;
      triangles.push({
        depth: (depthA + depthB + depthC) / 3,
        x0: projected[offsetA],
        y0: projected[offsetA + 1],
        x1: projected[offsetB],
        y1: projected[offsetB + 1],
        x2: projected[offsetC],
        y2: projected[offsetC + 1],
        fill,
      });
    }
  });

  triangles.sort((left, right) => right.depth - left.depth);
  context.save();
  context.globalAlpha = 1;
  context.lineJoin = 'round';
  context.lineWidth = Math.max(0.6, width / 1800);
  for (const triangle of triangles) {
    context.beginPath();
    context.moveTo(triangle.x0, triangle.y0);
    context.lineTo(triangle.x1, triangle.y1);
    context.lineTo(triangle.x2, triangle.y2);
    context.closePath();
    context.fillStyle = triangle.fill;
    context.fill();
    context.strokeStyle = triangle.fill;
    context.stroke();
  }
  context.restore();
}