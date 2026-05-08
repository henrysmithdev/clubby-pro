import test from 'node:test';
import assert from 'node:assert/strict';
import {
  sortTracerPoints,
  getVisibleTracerPoints,
  normalizeCanvasPoint,
  denormalizePoint,
} from '../src/components/ball-tracer/tracerMath.js';

test('sortTracerPoints orders points by video time', () => {
  const points = [
    { id: 'b', time: 1.2, x: 0.3, y: 0.4 },
    { id: 'a', time: 0.4, x: 0.1, y: 0.2 },
  ];

  assert.deepEqual(sortTracerPoints(points).map((point) => point.id), ['a', 'b']);
});

test('getVisibleTracerPoints only returns points at or before current playback time', () => {
  const points = [
    { id: 'a', time: 0.2, x: 0.1, y: 0.2 },
    { id: 'b', time: 0.8, x: 0.3, y: 0.4 },
    { id: 'c', time: 1.5, x: 0.5, y: 0.6 },
  ];

  assert.deepEqual(getVisibleTracerPoints(points, 0.9).map((point) => point.id), ['a', 'b']);
});

test('normalizeCanvasPoint converts click pixels into clamped normalized coordinates', () => {
  assert.deepEqual(normalizeCanvasPoint(250, 75, 500, 300), { x: 0.5, y: 0.25 });
  assert.deepEqual(normalizeCanvasPoint(-10, 400, 500, 300), { x: 0, y: 1 });
});

test('denormalizePoint converts normalized point into canvas pixels', () => {
  assert.deepEqual(denormalizePoint({ x: 0.25, y: 0.75 }, 800, 400), { x: 200, y: 300 });
});
