function brightnessAt(frame, pixelIndex) {
  const dataIndex = pixelIndex * 4;
  return (frame.data[dataIndex] + frame.data[dataIndex + 1] + frame.data[dataIndex + 2]) / 3;
}

function colorDistance(previousFrame, currentFrame, pixelIndex) {
  const dataIndex = pixelIndex * 4;
  const red = Math.abs(currentFrame.data[dataIndex] - previousFrame.data[dataIndex]);
  const green = Math.abs(currentFrame.data[dataIndex + 1] - previousFrame.data[dataIndex + 1]);
  const blue = Math.abs(currentFrame.data[dataIndex + 2] - previousFrame.data[dataIndex + 2]);
  return (red + green + blue) / 3;
}

function normalize(value, size) {
  if (!Number.isFinite(value) || !Number.isFinite(size) || size <= 0) return 0;
  return Math.min(1, Math.max(0, value / size));
}

function clamp01(value) {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

function distance(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function getOptions(options = {}) {
  return {
    minBrightness: options.minBrightness ?? 175,
    minDiff: options.minDiff ?? 35,
    minArea: options.minArea ?? 1,
    maxAreaRatio: options.maxAreaRatio ?? 0.05,
    minCompactness: options.minCompactness ?? 0.08,
    minObjectContrast: options.minObjectContrast ?? 35,
    includeDarkObjects: options.includeDarkObjects ?? false,
    maxDarkBrightness: options.maxDarkBrightness ?? 120,
    region: options.region ?? null,
    minConfidence: options.minConfidence ?? 0,
    smooth: options.smooth ?? true,
    maxNormalizedJump: options.maxNormalizedJump ?? 0.32,
    minLaunchStep: options.minLaunchStep ?? 0.025,
    autoSelectTrajectory: options.autoSelectTrajectory ?? false,
    seedPoint: options.seedPoint ?? null,
    followSeed: options.followSeed ?? false,
    preferPoint: options.preferPoint ?? null,
  };
}

function getPixelRegion(width, height, region) {
  if (!region) {
    return { minX: 0, maxX: width - 1, minY: 0, maxY: height - 1 };
  }

  const minX = Math.floor(clamp01(region.x) * width);
  const minY = Math.floor(clamp01(region.y) * height);
  const maxX = Math.ceil(clamp01(region.x + region.width) * width) - 1;
  const maxY = Math.ceil(clamp01(region.y + region.height) * height) - 1;

  return {
    minX: Math.max(0, Math.min(width - 1, minX)),
    maxX: Math.max(0, Math.min(width - 1, maxX)),
    minY: Math.max(0, Math.min(height - 1, minY)),
    maxY: Math.max(0, Math.min(height - 1, maxY)),
  };
}

function averageBrightness(frame, width, region) {
  let total = 0;
  let count = 0;
  for (let y = region.minY; y <= region.maxY; y += 1) {
    for (let x = region.minX; x <= region.maxX; x += 1) {
      total += brightnessAt(frame, y * width + x);
      count += 1;
    }
  }
  return count > 0 ? total / count : 0;
}

function componentFromSeed(mask, visited, width, height, seedX, seedY) {
  const stack = [[seedX, seedY]];
  let area = 0;
  let sumX = 0;
  let sumY = 0;
  let minX = seedX;
  let maxX = seedX;
  let minY = seedY;
  let maxY = seedY;

  while (stack.length > 0) {
    const [x, y] = stack.pop();
    if (x < 0 || y < 0 || x >= width || y >= height) continue;

    const index = y * width + x;
    if (visited[index] || !mask[index]) continue;

    visited[index] = 1;
    area += 1;
    sumX += x;
    sumY += y;
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);

    stack.push([x + 1, y]);
    stack.push([x - 1, y]);
    stack.push([x, y + 1]);
    stack.push([x, y - 1]);
  }

  if (area === 0) return null;

  const boxWidth = maxX - minX + 1;
  const boxHeight = maxY - minY + 1;
  const boxArea = boxWidth * boxHeight;
  const compactness = area / boxArea;

  return {
    area,
    pixelX: sumX / area,
    pixelY: sumY / area,
    minX,
    maxX,
    minY,
    maxY,
    boxWidth,
    boxHeight,
    compactness,
  };
}

function candidatePreferenceScore(candidate, options, width, height) {
  const aspect = candidate.boxWidth / candidate.boxHeight;
  const roundnessPenalty = Math.abs(1 - aspect);
  const contrastScore = (candidate.objectContrast ?? 0) / 45;
  const compactnessScore = candidate.compactness * 4;
  const sizePenalty = Math.max(0, candidate.area - 9) * 0.45;
  const tinyNoisePenalty = candidate.area <= 1 ? 0.35 : 0;
  let score = compactnessScore + contrastScore - roundnessPenalty * 2 - sizePenalty - tinyNoisePenalty;

  const preferPoint = options.preferPoint;
  if (preferPoint) {
    const normalizedCandidate = { x: normalize(candidate.pixelX, width), y: normalize(candidate.pixelY, height) };
    const jump = distance(preferPoint, normalizedCandidate);
    if (jump > options.maxNormalizedJump) {
      score -= 100 + jump * 100;
    } else {
      score += Math.max(0, options.maxNormalizedJump - jump) * 20;
    }
  }

  return score;
}

function findMovingBallCandidates(previousFrame, currentFrame, options = {}) {
  if (!previousFrame || !currentFrame) return [];
  if (previousFrame.width !== currentFrame.width || previousFrame.height !== currentFrame.height) return [];

  const width = currentFrame.width;
  const height = currentFrame.height;
  const totalPixels = width * height;
  const resolved = getOptions(options);
  const maxArea = Math.max(resolved.minArea, totalPixels * resolved.maxAreaRatio);
  const region = getPixelRegion(width, height, resolved.region);
  const backgroundBrightness = averageBrightness(currentFrame, width, region);
  const mask = new Uint8Array(totalPixels);

  for (let y = region.minY; y <= region.maxY; y += 1) {
    for (let x = region.minX; x <= region.maxX; x += 1) {
      const pixelIndex = y * width + x;
      const currentBrightness = brightnessAt(currentFrame, pixelIndex);
      const diff = colorDistance(previousFrame, currentFrame, pixelIndex);
      const objectContrast = Math.abs(currentBrightness - backgroundBrightness);
      const isContrasty = objectContrast >= resolved.minObjectContrast;
      const isBrightBall = currentBrightness >= resolved.minBrightness && isContrasty;
      const isDarkBall =
        resolved.includeDarkObjects &&
        currentBrightness <= resolved.maxDarkBrightness &&
        isContrasty;

      if (diff >= resolved.minDiff && (isBrightBall || isDarkBall)) {
        mask[pixelIndex] = 1;
      }
    }
  }

  const visited = new Uint8Array(totalPixels);
  const candidates = [];

  for (let y = region.minY; y <= region.maxY; y += 1) {
    for (let x = region.minX; x <= region.maxX; x += 1) {
      const index = y * width + x;
      if (visited[index] || !mask[index]) continue;

      const component = componentFromSeed(mask, visited, width, height, x, y);
      if (!component) continue;
      if (component.area < resolved.minArea || component.area > maxArea) continue;
      if (component.compactness < resolved.minCompactness) continue;

      const componentIndex = Math.round(component.pixelY) * width + Math.round(component.pixelX);
      const componentBrightness = brightnessAt(currentFrame, componentIndex);
      const objectContrast = Math.abs(componentBrightness - backgroundBrightness);
      const candidate = {
        ...component,
        objectContrast,
      };
      const score = candidatePreferenceScore(candidate, resolved, width, height);
      const confidence = Math.max(0.01, score);
      if (confidence < resolved.minConfidence) continue;

      candidates.push({
        pixelX: candidate.pixelX,
        pixelY: candidate.pixelY,
        x: normalize(candidate.pixelX, width),
        y: normalize(candidate.pixelY, height),
        area: candidate.area,
        confidence,
        score,
      });
    }
  }

  return candidates.sort((a, b) => b.score - a.score);
}

export function findBrightMovingBall(previousFrame, currentFrame, options = {}) {
  return findMovingBallCandidates(previousFrame, currentFrame, options)[0] ?? null;
}

export function filterTrajectoryOutliers(points, options = {}) {
  if (points.length <= 2) return [...points];

  const maxNormalizedJump = options.maxNormalizedJump ?? 0.32;
  const sorted = [...points].sort((a, b) => a.time - b.time);
  const kept = [sorted[0]];

  for (let i = 1; i < sorted.length; i += 1) {
    const point = sorted[i];
    const previous = kept[kept.length - 1];
    const next = sorted[i + 1];
    const jumpFromPrevious = distance(previous, point);
    const canBridgeToNext = next ? distance(previous, next) <= maxNormalizedJump : true;

    if (jumpFromPrevious <= maxNormalizedJump || !canBridgeToNext) {
      kept.push(point);
    }
  }

  return kept;
}

export function smoothTracerPoints(points) {
  if (points.length < 3) return [...points];

  const sorted = [...points].sort((a, b) => a.time - b.time);
  return sorted.map((point, index) => {
    if (index === 0 || index === sorted.length - 1) return point;

    const previous = sorted[index - 1];
    const next = sorted[index + 1];
    return {
      ...point,
      x: (previous.x + point.x + next.x) / 3,
      y: (previous.y + point.y + next.y) / 3,
    };
  });
}

function trimToConsistentLaunch(points) {
  if (points.length < 3) return points;

  const deltas = [];
  for (let i = 1; i < points.length; i += 1) {
    const dx = points[i].x - points[i - 1].x;
    if (Math.abs(dx) >= 0.01) deltas.push(dx);
  }

  if (deltas.length < 2) return points;

  const positive = deltas.filter((dx) => dx > 0).length;
  const dominantSign = positive >= deltas.length - positive ? 1 : -1;
  let startIndex = 0;

  while (startIndex < points.length - 2) {
    const dx = points[startIndex + 1].x - points[startIndex].x;
    if (Math.sign(dx) === dominantSign && Math.abs(dx) >= 0.01) break;
    startIndex += 1;
  }

  return points.slice(startIndex);
}

function selectBestTrajectory(samples, options) {
  const groups = [];

  for (let i = 1; i < samples.length; i += 1) {
    const previous = samples[i - 1];
    const current = samples[i];
    const candidates = findMovingBallCandidates(previous.frame, current.frame, options)
      .slice(0, 8)
      .map((candidate) => ({
        id: `auto-${i}-${Math.round(candidate.pixelX)}-${Math.round(candidate.pixelY)}`,
        time: current.time,
        x: candidate.x,
        y: candidate.y,
        confidence: candidate.confidence,
        baseScore: candidate.score,
        bestScore: candidate.score,
        path: null,
      }));

    if (candidates.length > 0) groups.push(candidates);
  }

  if (groups.length === 0) return [];

  let bestPath = [];
  let bestPathScore = -Infinity;

  for (let groupIndex = 0; groupIndex < groups.length; groupIndex += 1) {
    const group = groups[groupIndex];
    const previousGroups = groups.slice(Math.max(0, groupIndex - 3), groupIndex).flat();

    for (const candidate of group) {
      let bestPrevious = null;
      let bestScore = candidate.baseScore;

      for (const previous of previousGroups) {
        const jump = distance(previous, candidate);
        if (jump > options.maxNormalizedJump) continue;

        const stepBonus = jump >= options.minLaunchStep ? 10 : -30;
        const continuityBonus = Math.max(0, options.maxNormalizedJump - jump) * 6;
        let motionBonus = 0;

        if (previous.path.length >= 2) {
          const before = previous.path[previous.path.length - 2];
          const prevDx = previous.x - before.x;
          const prevDy = previous.y - before.y;
          const nextDx = candidate.x - previous.x;
          const nextDy = candidate.y - previous.y;
          const prevSpeed = Math.sqrt(prevDx * prevDx + prevDy * prevDy);
          const nextSpeed = Math.sqrt(nextDx * nextDx + nextDy * nextDy);

          if (prevSpeed > 0 && nextSpeed > 0) {
            const directionCosine = (prevDx * nextDx + prevDy * nextDy) / (prevSpeed * nextSpeed);
            motionBonus += directionCosine * 24;
            motionBonus -= Math.abs(nextSpeed - prevSpeed) * 30;
          }
        }

        const score = previous.bestScore + candidate.baseScore + stepBonus + continuityBonus + motionBonus;
        if (score > bestScore) {
          bestScore = score;
          bestPrevious = previous;
        }
      }

      candidate.bestScore = bestScore;
      candidate.path = bestPrevious ? [...bestPrevious.path, candidate] : [candidate];
      const lengthBonus = candidate.path.length * 18;
      const launchScore = bestScore + lengthBonus;
      if (candidate.path.length >= 2 && launchScore > bestPathScore) {
        bestPathScore = launchScore;
        bestPath = candidate.path;
      }
    }
  }

  return trimToConsistentLaunch(bestPath.map((point) => ({
    id: point.id,
    time: point.time,
    x: point.x,
    y: point.y,
    confidence: point.confidence,
  })));
}

export function traceBallFromFrameSamples(samples, options = {}) {
  const resolved = getOptions(options);

  if (resolved.autoSelectTrajectory && !resolved.followSeed) {
    const selected = selectBestTrajectory(samples, resolved);
    const filtered = filterTrajectoryOutliers(selected, resolved);
    return resolved.smooth ? smoothTracerPoints(filtered) : filtered;
  }

  const points = [];
  let previousAccepted = resolved.seedPoint;

  for (let i = 1; i < samples.length; i += 1) {
    const previous = samples[i - 1];
    const current = samples[i];
    const preferPoint = resolved.followSeed ? previousAccepted : null;
    const candidate = findBrightMovingBall(previous.frame, current.frame, {
      ...resolved,
      preferPoint,
    });

    if (candidate) {
      const point = {
        id: `auto-${i}-${Math.round(candidate.pixelX)}-${Math.round(candidate.pixelY)}`,
        time: current.time,
        x: candidate.x,
        y: candidate.y,
        confidence: candidate.confidence,
      };
      points.push(point);
      previousAccepted = point;
    }
  }

  const filtered = filterTrajectoryOutliers(points, resolved);
  return resolved.smooth ? smoothTracerPoints(filtered) : filtered;
}
