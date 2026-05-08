"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  denormalizePoint,
  getVisibleTracerPoints,
  normalizeCanvasPoint,
  sortTracerPoints,
} from "@/components/ball-tracer/tracerMath.js";
import { traceBallFromFrameSamples } from "@/components/ball-tracer/ballDetection.js";

type TracerPoint = {
  id: string;
  time: number;
  x: number;
  y: number;
};

type TracerSettings = {
  color: string;
  glowColor: string;
  lineWidth: number;
  glowBlur: number;
  showBallDot: boolean;
};

type BallLocation = {
  x: number;
  y: number;
};

type TrackRegion = "full" | "upper" | "middle" | "right";
type TrackSensitivity = "balanced" | "brightSky" | "hardToSee";

const defaultSettings: TracerSettings = {
  color: "#F7D774",
  glowColor: "rgba(247, 215, 116, 0.45)",
  lineWidth: 5,
  glowBlur: 18,
  showBallDot: true,
};

const tracerPresets = [
  { label: "Clubby Gold", color: "#F7D774", glowColor: "rgba(247, 215, 116, 0.45)" },
  { label: "Tour White", color: "#FFFFFF", glowColor: "rgba(255, 255, 255, 0.45)" },
  { label: "Neon Green", color: "#66FF66", glowColor: "rgba(102, 255, 102, 0.45)" },
  { label: "Range Orange", color: "#FF8A3D", glowColor: "rgba(255, 138, 61, 0.45)" },
];

const sensitivityPresets: Record<
  TrackSensitivity,
  {
    label: string;
    helper: string;
    minBrightness: number;
    minDiff: number;
    minObjectContrast: number;
    maxDarkBrightness: number;
    maxAreaRatio: number;
  }
> = {
  balanced: {
    label: "Balanced",
    helper: "Good first try for most down-the-line videos.",
    minBrightness: 135,
    minDiff: 24,
    minObjectContrast: 24,
    maxDarkBrightness: 120,
    maxAreaRatio: 0.014,
  },
  brightSky: {
    label: "Bright sky / white ball",
    helper: "Better when the ball is small against the sky.",
    minBrightness: 150,
    minDiff: 18,
    minObjectContrast: 16,
    maxDarkBrightness: 145,
    maxAreaRatio: 0.012,
  },
  hardToSee: {
    label: "Hard to see / shadowed ball",
    helper: "More aggressive: can find dark balls but may need manual cleanup.",
    minBrightness: 105,
    minDiff: 14,
    minObjectContrast: 10,
    maxDarkBrightness: 165,
    maxAreaRatio: 0.018,
  },
};

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds)) return "0.00s";
  return `${seconds.toFixed(2)}s`;
}

function clamp01(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

function seedSearchRegion(seed: BallLocation, radius = 0.28) {
  const x = clamp01(seed.x - radius);
  const y = clamp01(seed.y - radius);
  const maxX = clamp01(seed.x + radius);
  const maxY = clamp01(seed.y + radius);
  return {
    x,
    y,
    width: Math.max(0.12, maxX - x),
    height: Math.max(0.12, maxY - y),
  };
}

function generateEstimatedTracerPoints(seed: BallLocation, startSeconds: number, endSeconds: number, detected: TracerPoint[] = []) {
  const sortedDetected = sortTracerPoints(detected) as TracerPoint[];
  const firstDetected = sortedDetected[0];
  const secondDetected = sortedDetected[1];
  const hasDirection = firstDetected && Math.hypot(firstDetected.x - seed.x, firstDetected.y - seed.y) > 0.015;
  const duration = Math.max(1.2, Math.min(3.5, endSeconds - startSeconds || 2.5));
  const horizontalDirection = hasDirection
    ? Math.sign(firstDetected.x - seed.x) || (seed.x < 0.5 ? 1 : -1)
    : seed.x < 0.5 ? 1 : -1;
  const verticalDirection = hasDirection ? Math.sign(firstDetected.y - seed.y) || -1 : -1;
  const horizontalScale = hasDirection && secondDetected
    ? Math.min(0.42, Math.max(0.12, Math.abs(secondDetected.x - seed.x) * 4))
    : 0.18;
  const verticalScale = hasDirection && secondDetected
    ? Math.min(0.5, Math.max(0.18, Math.abs(secondDetected.y - seed.y) * 4))
    : 0.38;

  return Array.from({ length: 7 }, (_, index) => {
    const progress = index / 6;
    const curveLift = Math.sin(progress * Math.PI) * 0.08;
    return {
      id: `estimated-${index}-${crypto.randomUUID()}`,
      time: Number((startSeconds + progress * duration).toFixed(2)),
      x: clamp01(seed.x + horizontalDirection * horizontalScale * progress),
      y: clamp01(seed.y + verticalDirection * verticalScale * progress - curveLift),
    };
  });
}

function drawSmoothPath(
  ctx: CanvasRenderingContext2D,
  points: TracerPoint[],
  width: number,
  height: number,
  settings: TracerSettings,
) {
  if (points.length === 0) return;

  const pixelPoints = points.map((point) => denormalizePoint(point, width, height));

  if (pixelPoints.length === 1) {
    const only = pixelPoints[0];
    ctx.save();
    ctx.shadowColor = settings.color;
    ctx.shadowBlur = settings.glowBlur;
    ctx.fillStyle = settings.color;
    ctx.beginPath();
    ctx.arc(only.x, only.y, settings.lineWidth + 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    return;
  }

  const drawPath = (strokeStyle: string, lineWidth: number, shadowBlur = 0) => {
    ctx.save();
    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.shadowColor = strokeStyle;
    ctx.shadowBlur = shadowBlur;
    ctx.beginPath();
    ctx.moveTo(pixelPoints[0].x, pixelPoints[0].y);

    for (let i = 1; i < pixelPoints.length - 1; i += 1) {
      const current = pixelPoints[i];
      const next = pixelPoints[i + 1];
      const midX = (current.x + next.x) / 2;
      const midY = (current.y + next.y) / 2;
      ctx.quadraticCurveTo(current.x, current.y, midX, midY);
    }

    const last = pixelPoints[pixelPoints.length - 1];
    ctx.lineTo(last.x, last.y);
    ctx.stroke();
    ctx.restore();
  };

  drawPath(settings.glowColor, settings.lineWidth * 3.4, settings.glowBlur);
  drawPath(settings.color, settings.lineWidth, settings.glowBlur / 2);

  if (settings.showBallDot) {
    const last = pixelPoints[pixelPoints.length - 1];
    ctx.save();
    ctx.shadowColor = settings.color;
    ctx.shadowBlur = settings.glowBlur;
    ctx.fillStyle = settings.color;
    ctx.beginPath();
    ctx.arc(last.x, last.y, settings.lineWidth + 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.beginPath();
    ctx.arc(last.x - 1, last.y - 1, Math.max(2, settings.lineWidth / 2), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

export default function BallTracerPage() {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoName, setVideoName] = useState("Untitled shot");
  const [points, setPoints] = useState<TracerPoint[]>([]);
  const [settings, setSettings] = useState<TracerSettings>(defaultSettings);
  const [error, setError] = useState<string | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [preRecordBallLocation, setPreRecordBallLocation] = useState<BallLocation | null>(null);
  const [recording, setRecording] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [tracking, setTracking] = useState(false);
  const [trackingStatus, setTrackingStatus] = useState<string | null>(null);
  const [trackStart, setTrackStart] = useState(0);
  const [trackEnd, setTrackEnd] = useState(8);
  const [trackRegion, setTrackRegion] = useState<TrackRegion>("full");
  const [trackSensitivity, setTrackSensitivity] = useState<TrackSensitivity>("balanced");
  const [minConfidence, setMinConfidence] = useState(0.5);
  const [maxJump, setMaxJump] = useState(0.32);
  const [smoothAutoTrack, setSmoothAutoTrack] = useState(true);
  const [exportUrl, setExportUrl] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const liveVideoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const seededBallLocationRef = useRef<BallLocation | null>(null);
  const animationRef = useRef<number | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const loadVideoUrl = useCallback((url: string, name = "Recorded shot", seededBallLocation?: BallLocation | null) => {
    setVideoUrl((previous) => {
      if (previous) URL.revokeObjectURL(previous);
      return url;
    });
    seededBallLocationRef.current = seededBallLocation ?? null;
    setVideoName(name);
    setPoints(
      seededBallLocation
        ? [
            {
              id: `pre-record-ball-${crypto.randomUUID()}`,
              time: 0,
              x: seededBallLocation.x,
              y: seededBallLocation.y,
            },
          ]
        : [],
    );
    setExportUrl((previous) => {
      if (previous) URL.revokeObjectURL(previous);
      return null;
    });
    setError(null);
    setTrackingStatus(seededBallLocation ? "Ball marked before recording — using that spot to start tracking." : null);
    setTrackStart(0);
    setTrackEnd(8);
  }, []);

  useEffect(() => {
    return () => {
      if (videoUrl) URL.revokeObjectURL(videoUrl);
      if (exportUrl) URL.revokeObjectURL(exportUrl);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      cameraStream?.getTracks().forEach((track) => track.stop());
    };
  }, [cameraStream, exportUrl, videoUrl]);

  useEffect(() => {
    if (liveVideoRef.current && cameraStream) {
      liveVideoRef.current.srcObject = cameraStream;
    }
  }, [cameraStream]);

  const drawFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const videoWidth = video.videoWidth || 1280;
    const videoHeight = video.videoHeight || 720;
    if (canvas.width !== videoWidth || canvas.height !== videoHeight) {
      canvas.width = videoWidth;
      canvas.height = videoHeight;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const visiblePoints = getVisibleTracerPoints(points, video.currentTime) as TracerPoint[];
    drawSmoothPath(ctx, visiblePoints, canvas.width, canvas.height, settings);

    for (const point of points) {
      const marker = denormalizePoint(point, canvas.width, canvas.height);
      ctx.save();
      ctx.fillStyle = point.time <= video.currentTime ? settings.color : "rgba(255,255,255,0.65)";
      ctx.strokeStyle = "rgba(0,0,0,0.75)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(marker.x, marker.y, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
  }, [points, settings]);

  useEffect(() => {
    const tick = () => {
      drawFrame();
      animationRef.current = requestAnimationFrame(tick);
    };

    if (videoUrl) {
      animationRef.current = requestAnimationFrame(tick);
    }

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [drawFrame, videoUrl]);

  const handleFile = (file: File) => {
    if (!file.type.startsWith("video/")) {
      setError("Please choose a video file.");
      return;
    }

    if (file.size > 150 * 1024 * 1024) {
      setError("Video must be under 150MB for this first version.");
      return;
    }

    loadVideoUrl(URL.createObjectURL(file), file.name);
  };

  const handleUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) handleFile(file);
    event.target.value = "";
  };

  const startCamera = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      setCameraStream(stream);
      setPreRecordBallLocation(null);
    } catch {
      setError("Camera access was blocked. You can still upload a video from your camera roll.");
    }
  };

  const markPreRecordBallLocation = (event: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (!cameraStream || recording) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const client = "touches" in event ? event.touches[0] ?? event.changedTouches[0] : event;
    const pixelX = client.clientX - rect.left;
    const pixelY = client.clientY - rect.top;
    const normalized = normalizeCanvasPoint(pixelX, pixelY, rect.width, rect.height) as BallLocation;
    setPreRecordBallLocation(normalized);
    setError(null);
  };

  const startRecording = () => {
    if (!cameraStream) return;
    if (!preRecordBallLocation) {
      setError("Before recording, tap the ball in the camera preview so Clubby knows where to start tracking.");
      return;
    }

    const seedBallLocation = preRecordBallLocation;
    chunksRef.current = [];
    const recorder = new MediaRecorder(cameraStream, { mimeType: "video/webm" });
    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunksRef.current.push(event.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "video/webm" });
      loadVideoUrl(URL.createObjectURL(blob), "Clubby recorded shot.webm", seedBallLocation);
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
      setPreRecordBallLocation(null);
      setRecording(false);
    };

    recorder.start();
    setRecording(true);
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
  };

  const addPointFromCanvas = (event: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !videoUrl) return;

    const rect = canvas.getBoundingClientRect();
    const client = "touches" in event ? event.touches[0] ?? event.changedTouches[0] : event;
    const pixelX = client.clientX - rect.left;
    const pixelY = client.clientY - rect.top;
    const normalized = normalizeCanvasPoint(pixelX, pixelY, rect.width, rect.height) as { x: number; y: number };

    setPoints((current) =>
      sortTracerPoints([
        ...current,
        {
          id: crypto.randomUUID(),
          time: video.currentTime,
          x: normalized.x,
          y: normalized.y,
        },
      ]) as TracerPoint[],
    );
  };

  const removePoint = (id: string) => {
    setPoints((current) => current.filter((point) => point.id !== id));
  };

  const undoPoint = () => {
    setPoints((current) => current.slice(0, -1));
  };

  const seekVideo = (video: HTMLVideoElement, time: number) =>
    new Promise<void>((resolve) => {
      const target = Math.min(Math.max(time, 0), video.duration || time);
      if (Math.abs(video.currentTime - target) < 0.01) {
        resolve();
        return;
      }
      const onSeeked = () => {
        video.removeEventListener("seeked", onSeeked);
        resolve();
      };
      video.addEventListener("seeked", onSeeked);
      video.currentTime = target;
    });

  const selectedTrackRegion = (region: TrackRegion = trackRegion) => {
    if (region === "upper") return { x: 0, y: 0, width: 1, height: 0.55 };
    if (region === "middle") return { x: 0.15, y: 0.15, width: 0.7, height: 0.7 };
    if (region === "right") return { x: 0.4, y: 0, width: 0.6, height: 1 };
    return null;
  };

  const setTrackingBoundary = (boundary: "start" | "end") => {
    const video = videoRef.current;
    if (!video) return;
    const value = Number(video.currentTime.toFixed(2));
    if (boundary === "start") {
      setTrackStart(value);
      if (trackEnd <= value) setTrackEnd(Number(Math.min(value + 2, video.duration || value + 2).toFixed(2)));
    } else {
      setTrackEnd(value);
    }
  };

  const autoTrackBall = async (overrides: { start?: number; end?: number; automatic?: boolean } = {}) => {
    const video = videoRef.current;
    if (!video || !videoUrl) return;

    if (!Number.isFinite(video.duration) || video.duration <= 0) {
      setError("Video is not ready yet. Wait a second, then try Auto Track again.");
      return;
    }

    setTracking(true);
    setTrackingStatus(overrides.automatic ? "Finding the ball automatically…" : "Preparing video frames…");
    setError(null);

    try {
      video.pause();
      const analysisCanvas = document.createElement("canvas");
      const ctx = analysisCanvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) throw new Error("Canvas unavailable");

      const sourceWidth = video.videoWidth || 1280;
      const sourceHeight = video.videoHeight || 720;
      const analysisWidth = Math.min(480, sourceWidth);
      const analysisHeight = Math.max(1, Math.round((analysisWidth / sourceWidth) * sourceHeight));
      analysisCanvas.width = analysisWidth;
      analysisCanvas.height = analysisHeight;

      const startSeconds = Math.min(Math.max(overrides.start ?? trackStart, 0), video.duration);
      const defaultEnd = Math.min(video.duration, startSeconds + 12);
      const endSeconds = Math.min(Math.max(overrides.end ?? trackEnd ?? defaultEnd, startSeconds + 0.3), video.duration);
      const sampleInterval = video.duration <= 4 ? 0.05 : 0.07;
      const samples: Array<{ time: number; frame: ImageData }> = [];
      const sortedExistingPoints = sortTracerPoints(points) as TracerPoint[];
      const refSeed = seededBallLocationRef.current;
      const seedPoint = sortedExistingPoints.find(
        (point) => point.time >= startSeconds - 0.35 && point.time <= endSeconds,
      ) ?? (refSeed ? { id: "recorded-seed", time: startSeconds, x: refSeed.x, y: refSeed.y } : null);

      for (let time = startSeconds; time <= endSeconds; time += sampleInterval) {
        setTrackingStatus(`Scanning video for ball flight ${time.toFixed(1)}s / ${endSeconds.toFixed(1)}s…`);
        await seekVideo(video, time);
        ctx.drawImage(video, 0, 0, analysisWidth, analysisHeight);
        samples.push({ time, frame: ctx.getImageData(0, 0, analysisWidth, analysisHeight) });
      }

      setTrackingStatus("Choosing the most likely ball flight path…");
      const attempts = seedPoint
        ? [
            { preset: "hardToSee" as TrackSensitivity, region: "middle" as TrackRegion },
            { preset: "balanced" as TrackSensitivity, region: "middle" as TrackRegion },
            { preset: "hardToSee" as TrackSensitivity, region: "full" as TrackRegion },
            { preset: trackSensitivity, region: trackRegion },
          ]
        : [
            { preset: "balanced" as TrackSensitivity, region: "full" as TrackRegion },
            { preset: "brightSky" as TrackSensitivity, region: "upper" as TrackRegion },
            { preset: "hardToSee" as TrackSensitivity, region: "full" as TrackRegion },
            { preset: "hardToSee" as TrackSensitivity, region: "right" as TrackRegion },
          ];

      let bestDetected: Array<{ id: string; time: number; x: number; y: number; confidence?: number }> = [];
      let bestAttempt = attempts[0];
      let bestScore = -Infinity;

      for (const attempt of attempts) {
        const sensitivity = sensitivityPresets[attempt.preset];
        const region = seedPoint ? seedSearchRegion(seedPoint, attempt.region === "full" ? 0.42 : 0.28) : selectedTrackRegion(attempt.region);
        const detected = traceBallFromFrameSamples(samples, {
          minBrightness: sensitivity.minBrightness,
          minDiff: seedPoint ? Math.max(8, sensitivity.minDiff - 6) : sensitivity.minDiff,
          minObjectContrast: seedPoint ? Math.max(6, sensitivity.minObjectContrast - 6) : sensitivity.minObjectContrast,
          includeDarkObjects: true,
          maxDarkBrightness: sensitivity.maxDarkBrightness,
          minArea: 1,
          maxAreaRatio: seedPoint ? Math.min(0.01, sensitivity.maxAreaRatio) : sensitivity.maxAreaRatio,
          region,
          minConfidence: seedPoint ? Math.min(minConfidence, 0.15) : minConfidence,
          maxNormalizedJump: seedPoint ? Math.max(maxJump, 0.42) : maxJump,
          seedPoint: seedPoint ? { x: seedPoint.x, y: seedPoint.y } : null,
          followSeed: Boolean(seedPoint),
          autoSelectTrajectory: !seedPoint,
          smooth: smoothAutoTrack,
        }) as Array<{ id: string; time: number; x: number; y: number; confidence?: number }>;
        const averageConfidence = detected.reduce((sum, point) => sum + (point.confidence ?? 0), 0) / Math.max(1, detected.length);
        const score = detected.length * 20 + averageConfidence;
        if (score > bestScore) {
          bestDetected = detected;
          bestAttempt = attempt;
          bestScore = score;
        }
      }

      if (bestDetected.length < 2) {
        if (seedPoint) {
          const estimatedPoints = generateEstimatedTracerPoints(seedPoint, startSeconds, endSeconds, bestDetected as TracerPoint[]);
          setPoints(estimatedPoints);
          setTrackingStatus("Ball was marked, but the flight was not visible enough to truly track. Clubby generated an estimated tracer from the marked ball location.");
          await seekVideo(video, estimatedPoints[0]?.time ?? startSeconds);
          return;
        }

        setError("Clubby could not automatically find the ball flight in this clip. Try a slow-motion angle from behind the ball with the full launch in frame.");
        return;
      }

      const autoPoints = bestDetected.map((point, index) => ({
        id: `auto-${index}-${crypto.randomUUID()}`,
        time: point.time,
        x: point.x,
        y: point.y,
      }));
      const nextPoints = seedPoint
        ? sortTracerPoints([seedPoint, ...autoPoints]) as TracerPoint[]
        : autoPoints;

      setPoints(nextPoints);
      setTrackRegion(bestAttempt.region);
      setTrackSensitivity(bestAttempt.preset);
      setTrackingStatus(`Ball flight found automatically — ${bestDetected.length} tracking points added.`);
      await seekVideo(video, nextPoints[0]?.time ?? startSeconds);
    } catch {
      setError("Auto Track failed on this video. Try a slow-motion clip from behind the ball with the ball flight visible.");
    } finally {
      setTracking(false);
    }
  };

  const handleVideoReady = () => {
    const video = videoRef.current;
    drawFrame();
    if (!video || !Number.isFinite(video.duration) || video.duration <= 0) return;

    const end = Math.min(video.duration, 12);
    setTrackStart(0);
    setTrackEnd(Number(end.toFixed(2)));
    setTimeout(() => {
      void autoTrackBall({ start: 0, end, automatic: true });
    }, 0);
  };

  const exportReplay = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || points.length < 2) {
      setError("Add at least two tracer points before exporting.");
      return;
    }

    if (!canvas.captureStream || typeof MediaRecorder === "undefined") {
      setError("This browser cannot export the replay yet. Try Chrome, Edge, or Safari 17+.");
      return;
    }

    setExporting(true);
    setError(null);
    setExportUrl((previous) => {
      if (previous) URL.revokeObjectURL(previous);
      return null;
    });

    try {
      video.pause();
      video.currentTime = 0;

      await new Promise<void>((resolve) => {
        const onSeeked = () => {
          video.removeEventListener("seeked", onSeeked);
          resolve();
        };
        video.addEventListener("seeked", onSeeked);
      });

      drawFrame();
      const stream = canvas.captureStream(30);
      const chunks: Blob[] = [];
      const recorder = new MediaRecorder(stream, { mimeType: "video/webm" });

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunks.push(event.data);
      };

      const finished = new Promise<void>((resolve) => {
        recorder.onstop = () => resolve();
        video.onended = () => recorder.stop();
      });

      recorder.start();
      await video.play();
      await finished;

      const blob = new Blob(chunks, { type: "video/webm" });
      setExportUrl(URL.createObjectURL(blob));
    } catch {
      setError("Export failed. Try a shorter video or another browser.");
    } finally {
      video.onended = null;
      setExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-charcoal text-white pb-16 pt-24">
      <main className="max-w-7xl mx-auto px-4 py-10">
        <section className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-8 items-start">
          <div>
            <p className="text-gold text-sm font-semibold uppercase tracking-[0.25em]">New Replay Studio</p>
            <h1 className="font-[var(--font-heading)] text-4xl md:text-6xl font-bold mt-3 leading-tight">
              Ball Tracer <span className="text-gold">Replay</span>
            </h1>
            <p className="text-gray-300 text-lg mt-4 max-w-2xl">
              Record or upload a golf shot, add a pro-style glowing ball flight tracer, replay the shot, and download a shareable video.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-6 py-3 rounded-full bg-gold text-charcoal font-bold hover:bg-soft-gold transition"
              >
                Upload Video
              </button>
              <button
                type="button"
                onClick={startCamera}
                className="px-6 py-3 rounded-full border border-white/20 text-white font-semibold hover:border-gold hover:text-gold transition"
              >
                Open Camera + Mark Ball
              </button>
              <input ref={fileInputRef} type="file" accept="video/*" onChange={handleUpload} className="hidden" />
            </div>
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm text-gray-300">
              <div className="rounded-2xl bg-white/5 border border-white/10 p-4"><span className="text-gold font-bold">1.</span> Upload a video, or open the camera and tap the ball before recording.</div>
              <div className="rounded-2xl bg-white/5 border border-white/10 p-4"><span className="text-gold font-bold">2.</span> Clubby uses the marked ball location to find launch after impact.</div>
              <div className="rounded-2xl bg-white/5 border border-white/10 p-4"><span className="text-gold font-bold">3.</span> Review the tracer and export the replay.</div>
            </div>
          </div>

          <div className="rounded-3xl border border-gold/30 bg-gradient-to-br from-masters-green/30 to-black p-6 shadow-2xl">
            <h2 className="text-xl font-bold">Best results</h2>
            <ul className="mt-4 space-y-3 text-sm text-gray-300">
              <li>• Use a tripod or steady phone.</li>
              <li>• Keep the full ball flight in frame.</li>
              <li>• Use slow motion if possible; 60–120 fps is much easier to track.</li>
              <li>• Keep the ball visible immediately after impact and into the first part of flight.</li>
              <li>• If the tracer looks wrong, try “Find Ball Again” or a cleaner angle from behind the ball.</li>
            </ul>
          </div>
        </section>

        {error && (
          <div className="mt-8 rounded-2xl border border-red-400/40 bg-red-500/10 p-4 text-red-200">
            {error}
          </div>
        )}

        {cameraStream && (
          <section className="mt-10 rounded-3xl border border-white/10 bg-gray-950 p-5">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <div>
                <h2 className="text-xl font-bold">Camera</h2>
                <p className="mt-1 text-sm text-gray-400">
                  Step 1: tap the ball in the preview. Step 2: start recording and swing.
                </p>
              </div>
              {recording ? (
                <button type="button" onClick={stopRecording} className="px-5 py-2 rounded-full bg-red-500 text-white font-bold">Stop Recording</button>
              ) : (
                <button
                  type="button"
                  onClick={startRecording}
                  disabled={!preRecordBallLocation}
                  className="px-5 py-2 rounded-full bg-gold text-charcoal font-bold disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Start Recording
                </button>
              )}
            </div>
            <div
              className="relative rounded-2xl overflow-hidden bg-black border border-white/10 cursor-crosshair touch-none"
              onClick={markPreRecordBallLocation}
              onTouchEnd={markPreRecordBallLocation}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  setError("Tap or click directly on the ball in the camera preview before recording.");
                }
              }}
              role="button"
              tabIndex={0}
              aria-label="Tap the golf ball before recording"
            >
              <video ref={liveVideoRef} autoPlay muted playsInline className="w-full bg-black max-h-[70vh] object-contain" />
              {preRecordBallLocation && (
                <div
                  className="pointer-events-none absolute h-9 w-9 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-gold shadow-[0_0_22px_rgba(247,215,116,0.75)]"
                  style={{ left: `${preRecordBallLocation.x * 100}%`, top: `${preRecordBallLocation.y * 100}%` }}
                >
                  <span className="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold" />
                </div>
              )}
              {!recording && !preRecordBallLocation && (
                <div className="pointer-events-none absolute inset-x-4 bottom-4 rounded-2xl bg-black/70 p-3 text-center text-sm text-white backdrop-blur">
                  Tap the ball before recording so Clubby can lock onto its starting location.
                </div>
              )}
            </div>
            {preRecordBallLocation && !recording && (
              <p className="mt-3 text-gold text-sm">Ball marked. Start recording when the golfer is ready.</p>
            )}
            {recording && <p className="mt-3 text-red-300 text-sm">Recording… swing when ready, then tap Stop Recording.</p>}
          </section>
        )}

        {videoUrl && (
          <section className="mt-10 grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6">
            <div className="rounded-3xl border border-white/10 bg-gray-950 p-4 md:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div>
                  <h2 className="text-xl font-bold">Tracer Editor</h2>
                  <p className="text-sm text-gray-400">{videoName}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => autoTrackBall()} disabled={tracking} className="px-4 py-2 rounded-full bg-gold text-charcoal font-bold disabled:opacity-40 hover:bg-soft-gold transition">
                    {tracking ? "Finding Ball…" : "Find Ball Again"}
                  </button>
                  <button onClick={undoPoint} disabled={points.length === 0} className="px-4 py-2 rounded-full bg-white/10 disabled:opacity-40 hover:bg-white/20 transition">Undo</button>
                  <button onClick={() => setPoints([])} disabled={points.length === 0} className="px-4 py-2 rounded-full bg-white/10 disabled:opacity-40 hover:bg-white/20 transition">Clear</button>
                </div>
                <p className="mt-2 text-sm text-gray-400">
                  Clubby now scans the video automatically after upload and chooses the most likely ball flight. Use “Find Ball Again” only if you change settings or upload a new clip.
                </p>
              </div>

              <div className="relative rounded-2xl overflow-hidden bg-black">
                <video ref={videoRef} src={videoUrl} controls playsInline className="hidden" onLoadedMetadata={handleVideoReady} />
                <canvas
                  ref={canvasRef}
                  onClick={addPointFromCanvas}
                  onTouchEnd={addPointFromCanvas}
                  className="w-full h-auto cursor-crosshair touch-none"
                  aria-label="Tap the ball position to add a tracer point"
                />
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <button onClick={() => videoRef.current?.play()} className="px-5 py-2.5 rounded-full bg-gold text-charcoal font-bold">Play Replay</button>
                <button onClick={() => videoRef.current?.pause()} className="px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 transition">Pause</button>
                <button
                  onClick={() => {
                    if (videoRef.current) videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 0.1);
                  }}
                  className="px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 transition"
                >
                  -0.1s
                </button>
                <button
                  onClick={() => {
                    if (videoRef.current) videoRef.current.currentTime += 0.1;
                  }}
                  className="px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 transition"
                >
                  +0.1s
                </button>
                <button
                  onClick={exportReplay}
                  disabled={exporting || points.length < 2}
                  className="px-5 py-2.5 rounded-full bg-masters-green text-white font-bold disabled:opacity-40 hover:bg-fairway transition"
                >
                  {exporting ? "Exporting…" : "Export Replay"}
                </button>
              </div>

              {exportUrl && (
                <div className="mt-5 rounded-2xl border border-green-400/30 bg-green-500/10 p-4">
                  <p className="text-green-200 font-semibold">Replay exported.</p>
                  <a href={exportUrl} download="clubby-ball-tracer.webm" className="inline-flex mt-3 px-5 py-2 rounded-full bg-gold text-charcoal font-bold">
                    Download Replay Video
                  </a>
                </div>
              )}
            </div>

            <aside className="space-y-5">
              <div className="rounded-3xl border border-gold/20 bg-gray-950 p-5">
                <h3 className="font-bold text-lg">Automatic Ball Tracking</h3>
                <p className="text-sm text-gray-400 mt-1">
                  Upload a video and Clubby will scan for the ball flight automatically. You should not need to set start/end times.
                </p>

                <div className="mt-4 rounded-2xl border border-gold/20 bg-gold/10 p-3 text-sm text-gold">
                  {points.length > 1 ? "Tracer found. Review the path and export when it looks right." : "Clubby starts tracking automatically as soon as the video loads."}
                </div>

                {trackingStatus && <p className="mt-4 text-sm text-gold">{trackingStatus}</p>}

                <details className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                  <summary className="cursor-pointer text-sm font-semibold text-gray-200">Advanced rescue settings</summary>
                  <p className="mt-2 text-xs text-gray-500">Use these only if automatic tracking follows the club, body, shadows, or turf instead of the ball.</p>

                  <label className="block mt-4 text-sm text-gray-300">
                    Tracking preset
                    <select
                      value={trackSensitivity}
                      onChange={(event) => setTrackSensitivity(event.target.value as TrackSensitivity)}
                      className="mt-1 w-full rounded-xl bg-white/10 border border-white/10 px-3 py-2 text-white"
                    >
                      {Object.entries(sensitivityPresets).map(([value, preset]) => (
                        <option key={value} value={value}>{preset.label}</option>
                      ))}
                    </select>
                    <span className="mt-1 block text-xs text-gray-500">{sensitivityPresets[trackSensitivity].helper}</span>
                  </label>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <label className="text-sm text-gray-300">
                      Start second
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        value={trackStart}
                        onChange={(event) => setTrackStart(Number(event.target.value))}
                        className="mt-1 w-full rounded-xl bg-white/10 border border-white/10 px-3 py-2 text-white"
                      />
                    </label>
                    <label className="text-sm text-gray-300">
                      End second
                      <input
                        type="number"
                        min="0.3"
                        step="0.1"
                        value={trackEnd}
                        onChange={(event) => setTrackEnd(Number(event.target.value))}
                        className="mt-1 w-full rounded-xl bg-white/10 border border-white/10 px-3 py-2 text-white"
                      />
                    </label>
                  </div>

                  <div className="mt-3 flex gap-2">
                    <button onClick={() => setTrackingBoundary("start")} className="flex-1 rounded-full bg-white/10 px-3 py-2 text-sm hover:bg-white/20 transition">Set Start</button>
                    <button onClick={() => setTrackingBoundary("end")} className="flex-1 rounded-full bg-white/10 px-3 py-2 text-sm hover:bg-white/20 transition">Set End</button>
                  </div>

                  <label className="block mt-4 text-sm text-gray-300">
                    Search area
                    <select
                      value={trackRegion}
                      onChange={(event) => setTrackRegion(event.target.value as TrackRegion)}
                      className="mt-1 w-full rounded-xl bg-white/10 border border-white/10 px-3 py-2 text-white"
                    >
                      <option value="full">Full frame</option>
                      <option value="upper">Upper half / sky</option>
                      <option value="middle">Middle box</option>
                      <option value="right">Right side / downrange</option>
                    </select>
                  </label>

                  <label className="block mt-4 text-sm text-gray-300">
                    Minimum confidence: {minConfidence.toFixed(1)}
                    <input
                      type="range"
                      min="0"
                      max="8"
                      step="0.5"
                      value={minConfidence}
                      onChange={(event) => setMinConfidence(Number(event.target.value))}
                      className="w-full mt-2"
                    />
                  </label>

                  <label className="block mt-4 text-sm text-gray-300">
                    Max jump filter: {maxJump.toFixed(2)}
                    <input
                      type="range"
                      min="0.12"
                      max="0.6"
                      step="0.02"
                      value={maxJump}
                      onChange={(event) => setMaxJump(Number(event.target.value))}
                      className="w-full mt-2"
                    />
                  </label>

                  <label className="flex items-center gap-3 mt-4 text-sm text-gray-300">
                    <input
                      type="checkbox"
                      checked={smoothAutoTrack}
                      onChange={(event) => setSmoothAutoTrack(event.target.checked)}
                    />
                    Smooth suggested path
                  </label>
                </details>
              </div>

              <div className="rounded-3xl border border-white/10 bg-gray-950 p-5">
                <h3 className="font-bold text-lg">Tracer Style</h3>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {tracerPresets.map((preset) => (
                    <button
                      key={preset.label}
                      onClick={() => setSettings((current) => ({ ...current, color: preset.color, glowColor: preset.glowColor }))}
                      className="rounded-2xl border border-white/10 p-3 text-left hover:border-gold transition"
                    >
                      <span className="block w-full h-2 rounded-full mb-2" style={{ background: preset.color, boxShadow: `0 0 14px ${preset.color}` }} />
                      <span className="text-xs text-gray-300">{preset.label}</span>
                    </button>
                  ))}
                </div>
                <label className="block mt-5 text-sm text-gray-300">
                  Thickness
                  <input
                    type="range"
                    min="2"
                    max="10"
                    value={settings.lineWidth}
                    onChange={(event) => setSettings((current) => ({ ...current, lineWidth: Number(event.target.value) }))}
                    className="w-full mt-2"
                  />
                </label>
                <label className="flex items-center gap-3 mt-4 text-sm text-gray-300">
                  <input
                    type="checkbox"
                    checked={settings.showBallDot}
                    onChange={(event) => setSettings((current) => ({ ...current, showBallDot: event.target.checked }))}
                  />
                  Show glowing ball dot
                </label>
              </div>

              <div className="rounded-3xl border border-white/10 bg-gray-950 p-5">
                <h3 className="font-bold text-lg">Tracer Points</h3>
                <p className="text-sm text-gray-400 mt-1">Use Auto Track to suggest points, then tap/remove points to clean up the flight path.</p>
                <div className="mt-4 space-y-2 max-h-80 overflow-auto">
                  {points.length === 0 && <p className="text-sm text-gray-500">No points yet.</p>}
                  {points.map((point, index) => (
                    <div key={point.id} className="flex items-center justify-between gap-3 rounded-xl bg-white/5 px-3 py-2 text-sm">
                      <span>#{index + 1} at {formatTime(point.time)}</span>
                      <button onClick={() => removePoint(point.id)} className="text-red-300 hover:text-red-200">Remove</button>
                    </div>
                  ))}
                </div>
              </div>
            </aside>
          </section>
        )}
      </main>
    </div>
  );
}
