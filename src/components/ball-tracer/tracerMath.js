export function clamp01(value) {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

export function sortTracerPoints(points) {
  return [...points].sort((a, b) => a.time - b.time);
}

export function getVisibleTracerPoints(points, currentTime) {
  return sortTracerPoints(points).filter((point) => point.time <= currentTime);
}

export function normalizeCanvasPoint(pixelX, pixelY, width, height) {
  return {
    x: clamp01(pixelX / width),
    y: clamp01(pixelY / height),
  };
}

export function denormalizePoint(point, width, height) {
  return {
    x: Math.round(clamp01(point.x) * width),
    y: Math.round(clamp01(point.y) * height),
  };
}
