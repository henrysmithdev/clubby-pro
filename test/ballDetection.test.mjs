import test from 'node:test';
import assert from 'node:assert/strict';
import {
  findBrightMovingBall,
  filterTrajectoryOutliers,
  smoothTracerPoints,
  traceBallFromFrameSamples,
} from '../src/components/ball-tracer/ballDetection.js';

function makeFrame(width, height, spots = []) {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < data.length; i += 4) {
    data[i] = 20;
    data[i + 1] = 80;
    data[i + 2] = 35;
    data[i + 3] = 255;
  }

  for (const spot of spots) {
    const radius = spot.radius ?? 1;
    for (let y = spot.y - radius; y <= spot.y + radius; y += 1) {
      for (let x = spot.x - radius; x <= spot.x + radius; x += 1) {
        if (x < 0 || y < 0 || x >= width || y >= height) continue;
        const idx = (y * width + x) * 4;
        data[idx] = spot.r ?? 245;
        data[idx + 1] = spot.g ?? 245;
        data[idx + 2] = spot.b ?? 245;
      }
    }
  }

  return { width, height, data };
}

test('findBrightMovingBall detects a small bright object that moved between frames', () => {
  const previousFrame = makeFrame(20, 10, [{ x: 4, y: 5 }]);
  const currentFrame = makeFrame(20, 10, [{ x: 12, y: 6 }]);

  const candidate = findBrightMovingBall(previousFrame, currentFrame);

  assert.ok(candidate, 'expected a candidate');
  assert.equal(Math.round(candidate.pixelX), 12);
  assert.equal(Math.round(candidate.pixelY), 6);
  assert.ok(candidate.confidence > 0);
  assert.equal(Number(candidate.x.toFixed(2)), 0.6);
  assert.equal(Number(candidate.y.toFixed(2)), 0.6);
});

test('findBrightMovingBall ignores large moving blobs that are unlikely to be a golf ball', () => {
  const previousFrame = makeFrame(40, 20);
  const currentFrame = makeFrame(40, 20, [{ x: 20, y: 10, radius: 8 }]);

  const candidate = findBrightMovingBall(previousFrame, currentFrame, { maxAreaRatio: 0.03 });

  assert.equal(candidate, null);
});

test('findBrightMovingBall returns null when there is no meaningful bright movement', () => {
  const previousFrame = makeFrame(20, 10);
  const currentFrame = makeFrame(20, 10);

  assert.equal(findBrightMovingBall(previousFrame, currentFrame), null);
});

test('traceBallFromFrameSamples converts detected movement into sorted tracer points', () => {
  const samples = [
    { time: 0, frame: makeFrame(20, 10, [{ x: 3, y: 4 }]) },
    { time: 0.1, frame: makeFrame(20, 10, [{ x: 6, y: 4 }]) },
    { time: 0.2, frame: makeFrame(20, 10, [{ x: 10, y: 5 }]) },
  ];

  const points = traceBallFromFrameSamples(samples);

  assert.equal(points.length, 2);
  assert.deepEqual(points.map((point) => point.time), [0.1, 0.2]);
  assert.equal(Math.round(points[0].x * 20), 6);
  assert.equal(Math.round(points[1].x * 20), 10);
});

test('findBrightMovingBall can restrict search to a region of interest', () => {
  const previousFrame = makeFrame(40, 20, [{ x: 4, y: 5 }, { x: 28, y: 15 }]);
  const currentFrame = makeFrame(40, 20, [{ x: 10, y: 5 }, { x: 34, y: 15 }]);

  const candidate = findBrightMovingBall(previousFrame, currentFrame, {
    region: { x: 0, y: 0, width: 0.5, height: 0.5 },
  });

  assert.ok(candidate, 'expected a candidate inside the region');
  assert.equal(Math.round(candidate.pixelX), 10);
  assert.equal(Math.round(candidate.pixelY), 5);
});

test('filterTrajectoryOutliers removes detections that jump too far from the flight path', () => {
  const points = [
    { id: 'a', time: 0.1, x: 0.1, y: 0.5, confidence: 5 },
    { id: 'b', time: 0.2, x: 0.2, y: 0.48, confidence: 5 },
    { id: 'bad', time: 0.3, x: 0.9, y: 0.1, confidence: 3 },
    { id: 'c', time: 0.4, x: 0.32, y: 0.45, confidence: 5 },
  ];

  const filtered = filterTrajectoryOutliers(points, { maxNormalizedJump: 0.28 });

  assert.deepEqual(filtered.map((point) => point.id), ['a', 'b', 'c']);
});

test('smoothTracerPoints averages noisy middle points without changing endpoints', () => {
  const points = [
    { id: 'a', time: 0.1, x: 0.1, y: 0.5 },
    { id: 'b', time: 0.2, x: 0.22, y: 0.6 },
    { id: 'c', time: 0.3, x: 0.3, y: 0.48 },
  ];

  const smoothed = smoothTracerPoints(points);

  assert.deepEqual(smoothed[0], points[0]);
  assert.deepEqual(smoothed[2], points[2]);
  assert.equal(Number(smoothed[1].x.toFixed(2)), 0.21);
  assert.equal(Number(smoothed[1].y.toFixed(2)), 0.53);
});
