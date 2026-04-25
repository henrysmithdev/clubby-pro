"use client";
import { useState, useRef, useCallback } from "react";
import Link from "next/link";

interface SwingLine {
  label: string;
  color: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

interface SwingPhase {
  phase: string;
  score: number;
  notes: string;
  lines: SwingLine[];
}

interface SwingAnalysis {
  phases: SwingPhase[];
  overallScore: number;
  strengths: string[];
  improvements: string[];
  swingType: string;
  tempo: string;
  handicapEstimate: string;
  error?: string;
  raw?: string;
}

const phaseLabels: Record<string, string> = {
  address: "Address", takeaway: "Takeaway", backswing: "Backswing",
  top: "Top of Swing", downswing: "Downswing", impact: "Impact",
  follow_through: "Follow Through", finish: "Finish",
};

const phaseIcons: Record<string, string> = {
  address: "🏌️", takeaway: "↩️", backswing: "🔄",
  top: "⬆️", downswing: "⚡", impact: "💥",
  follow_through: "🌀", finish: "🎯",
};

function ScoreRing({ score, size = 120 }: { score: number; size?: number }) {
  const r = (size - 12) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - score / 100);
  const color = score >= 80 ? "#2AB419" : score >= 60 ? "#F5A623" : score >= 40 ? "#FF8C00" : "#FF3B30";
  return (
    <svg width={size} height={size} className="mx-auto">
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#1a1a1a" strokeWidth="8" />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="8"
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`}
        style={{ transition: "stroke-dashoffset 1.5s ease" }} />
      <text x={size/2} y={size/2 - 8} textAnchor="middle" fill="white" fontSize="32" fontWeight="900">{score}</text>
      <text x={size/2} y={size/2 + 16} textAnchor="middle" fill="#999" fontSize="12" fontWeight="600">/ 100</text>
    </svg>
  );
}

function FrameCanvas({ frame, lines, width }: { frame: string; lines: SwingLine[]; width: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const drawLines = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    ctx.drawImage(img, 0, 0);

    for (const line of lines) {
      const sx = (line.startX / 100) * canvas.width;
      const sy = (line.startY / 100) * canvas.height;
      const ex = (line.endX / 100) * canvas.width;
      const ey = (line.endY / 100) * canvas.height;
      
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(ex, ey);
      ctx.strokeStyle = line.color || "#FF5529";
      ctx.lineWidth = 3;
      ctx.stroke();

      // Label
      const mx = (sx + ex) / 2;
      const my = (sy + ey) / 2;
      ctx.font = "bold 14px sans-serif";
      ctx.fillStyle = line.color || "#FF5529";
      ctx.strokeStyle = "rgba(0,0,0,0.7)";
      ctx.lineWidth = 3;
      ctx.strokeText(line.label, mx + 5, my - 5);
      ctx.fillText(line.label, mx + 5, my - 5);
    }
  }, [lines]);

  return (
    <div className="relative rounded-xl overflow-hidden bg-black">
      <img ref={imgRef} src={frame} alt="" className="hidden" onLoad={drawLines} />
      <canvas ref={canvasRef} className="w-full h-auto" style={{ maxWidth: width }} />
    </div>
  );
}

export default function SwingAnalyzerPage() {
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [frames, setFrames] = useState<string[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<SwingAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activePhase, setActivePhase] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const extractFrames = async (file: File) => {
    setError(null);
    setAnalysis(null);
    const url = URL.createObjectURL(file);
    setVideoSrc(url);

    return new Promise<string[]>((resolve) => {
      const video = document.createElement("video");
      video.src = url;
      video.muted = true;
      video.playsInline = true;

      video.addEventListener("loadedmetadata", () => {
        const duration = video.duration;
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d")!;
        
        // Extract 6 evenly spaced frames
        const times = Array.from({ length: 4 }, (_, i) => (duration * (i + 0.5)) / 5);
        const extracted: string[] = [];
        let idx = 0;

        const captureFrame = () => {
          canvas.width = Math.min(video.videoWidth, 480);
          canvas.height = Math.round((canvas.width / video.videoWidth) * video.videoHeight);
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          extracted.push(canvas.toDataURL("image/jpeg", 0.5));
          idx++;
          if (idx < times.length) {
            video.currentTime = times[idx];
          } else {
            resolve(extracted);
          }
        };

        video.addEventListener("seeked", captureFrame);
        video.currentTime = times[0];
      });
    });
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith("video/")) {
      setError("Please upload a video file");
      return;
    }
    if (file.size > 100 * 1024 * 1024) {
      setError("Video must be under 100MB");
      return;
    }

    setAnalyzing(true);
    try {
      const extracted = await extractFrames(file);
      setFrames(extracted);

      // Send to API
      const res = await fetch("/api/analyze-swing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ frames: extracted }),
      });

      const data = await res.json();
      if (data.error) {
        setError(typeof data.error === 'string' ? data.error : JSON.stringify(data.error));
      } else if (data.analysis) {
        setAnalysis(data.analysis);
      } else {
        setError('No analysis returned. Please try a different video.');
      }
    } catch (err) {
      setError("Failed to analyze swing. Please try again.");
    }
    setAnalyzing(false);
  };

  return (
    <div className="min-h-screen bg-charcoal">
      {/* Header */}
      <nav className="border-b border-gray-800 bg-charcoal/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-1.5">
            <img src="/images/clubby-bear.png" alt="" className="h-10" />
            <span className="font-[var(--font-heading)] text-2xl font-bold tracking-wider text-white" style={{ fontVariant: "small-caps" }}>Clubby</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/fit" className="text-sm text-gray-400 hover:text-white transition">Get Fitted</Link>
            <span className="text-sm font-semibold text-gold">Swing Analyzer</span>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 py-10">
        {/* Hero */}
        {!analysis && (
          <div className="text-center mb-10">
            <h1 className="font-[var(--font-heading)] text-4xl md:text-5xl font-bold text-white mb-3">
              AI Swing <span className="text-gold">Analyzer</span>
            </h1>
            <p className="text-gray-400 text-lg max-w-xl mx-auto">
              Upload a video of your swing. Our AI analyzes your mechanics, draws reference lines, and gives you a score with personalized tips.
            </p>
          </div>
        )}

        {/* Upload Area */}
        {!analysis && !analyzing && (
          <div
            onClick={() => fileRef.current?.click()}
            className="max-w-lg mx-auto border-2 border-dashed border-gray-700 rounded-2xl p-16 text-center cursor-pointer hover:border-gold/50 transition-all group"
          >
            <input ref={fileRef} type="file" accept="video/*" onChange={handleUpload} className="hidden" />
            <div className="text-6xl mb-4 group-hover:scale-110 transition-transform">🎥</div>
            <p className="text-white font-semibold text-lg">Upload Your Swing Video</p>
            <p className="text-gray-500 text-sm mt-2">MP4, MOV, or WebM • Max 100MB • Face-on or down-the-line angle</p>
            <button className="mt-6 px-8 py-3 rounded-full bg-gold text-charcoal font-semibold hover:bg-soft-gold transition">
              Choose Video
            </button>
          </div>
        )}

        {/* Analyzing State */}
        {analyzing && (
          <div className="max-w-lg mx-auto text-center py-20">
            <div className="text-6xl mb-6 animate-bounce">🏌️</div>
            <h2 className="text-2xl font-bold text-white mb-3">Analyzing Your Swing...</h2>
            <p className="text-gray-400">Extracting frames and running AI analysis. This takes about 10 seconds.</p>
            <div className="mt-8 w-64 mx-auto h-2 bg-gray-800 rounded-full overflow-hidden">
              <div className="h-full bg-gold rounded-full animate-pulse" style={{ width: "60%" }} />
            </div>
            {frames.length > 0 && (
              <div className="mt-8 flex gap-2 justify-center">
                {frames.map((f, i) => (
                  <img key={i} src={f} alt="" className="w-16 h-12 rounded object-cover opacity-50" />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="max-w-lg mx-auto mt-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-center">
            {error}
            <button onClick={() => { setError(null); setAnalyzing(false); }} className="block mx-auto mt-3 text-sm text-gold underline">Try Again</button>
          </div>
        )}

        {/* Results */}
        {analysis && !analysis.error && (
          <div className="space-y-8">
            {/* Score Header */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gray-900 rounded-2xl p-8 text-center border border-gray-800">
                <ScoreRing score={analysis.overallScore} />
                <h3 className="text-white font-bold mt-4 text-lg">Overall Score</h3>
                <p className="text-gray-500 text-sm mt-1">Est. Handicap: {analysis.handicapEstimate || "N/A"}</p>
              </div>
              <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
                <h3 className="text-gold font-bold mb-3 flex items-center gap-2">💪 Strengths</h3>
                <ul className="space-y-2">
                  {(analysis.strengths || []).map((s, i) => (
                    <li key={i} className="text-gray-300 text-sm flex items-start gap-2">
                      <span className="text-green-400 mt-0.5">✓</span> {s}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
                <h3 className="text-gold font-bold mb-3 flex items-center gap-2">🎯 Improvements</h3>
                <ul className="space-y-2">
                  {(analysis.improvements || []).map((s, i) => (
                    <li key={i} className="text-gray-300 text-sm flex items-start gap-2">
                      <span className="text-orange-400 mt-0.5">→</span> {s}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Phase Selector */}
            <div>
              <h3 className="text-white font-bold text-lg mb-4">Swing Breakdown</h3>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {(analysis.phases || []).map((p, i) => (
                  <button key={i} onClick={() => setActivePhase(i)}
                    className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition ${
                      activePhase === i
                        ? "bg-gold text-charcoal"
                        : "bg-gray-800 text-gray-400 hover:text-white"
                    }`}>
                    {phaseIcons[p.phase] || "📍"} {phaseLabels[p.phase] || p.phase}
                    <span className={`ml-2 px-1.5 py-0.5 rounded text-xs ${
                      p.score >= 8 ? "bg-green-500/20 text-green-400"
                        : p.score >= 6 ? "bg-yellow-500/20 text-yellow-400"
                        : "bg-red-500/20 text-red-400"
                    }`}>{p.score}/10</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Active Phase Detail */}
            {analysis.phases?.[activePhase] && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  {frames[activePhase] && (
                    <FrameCanvas
                      frame={frames[activePhase]}
                      lines={analysis.phases[activePhase].lines || []}
                      width={640}
                    />
                  )}
                </div>
                <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-3xl">{phaseIcons[analysis.phases[activePhase].phase] || "📍"}</span>
                    <div>
                      <h4 className="text-white font-bold text-xl">
                        {phaseLabels[analysis.phases[activePhase].phase] || analysis.phases[activePhase].phase}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="h-2 w-24 bg-gray-800 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all"
                            style={{
                              width: `${analysis.phases[activePhase].score * 10}%`,
                              backgroundColor: analysis.phases[activePhase].score >= 8 ? "#2AB419"
                                : analysis.phases[activePhase].score >= 6 ? "#F5A623" : "#FF3B30"
                            }} />
                        </div>
                        <span className="text-sm text-gray-400 font-mono">{analysis.phases[activePhase].score}/10</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-300 leading-relaxed">{analysis.phases[activePhase].notes}</p>

                  {/* Line legend */}
                  {analysis.phases[activePhase].lines?.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-800">
                      <p className="text-xs text-gray-500 mb-2 font-semibold">REFERENCE LINES</p>
                      <div className="flex flex-wrap gap-2">
                        {analysis.phases[activePhase].lines.map((l, i) => (
                          <span key={i} className="flex items-center gap-1.5 text-xs text-gray-400">
                            <span className="w-4 h-0.5 rounded" style={{ backgroundColor: l.color }} />
                            {l.label}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Swing Info */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 text-center">
                <p className="text-xs text-gray-500 mb-1">SWING TYPE</p>
                <p className="text-white font-bold">{analysis.swingType || "Full Swing"}</p>
              </div>
              <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 text-center">
                <p className="text-xs text-gray-500 mb-1">TEMPO</p>
                <p className="text-white font-bold">{analysis.tempo || "N/A"}</p>
              </div>
              <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 text-center">
                <p className="text-xs text-gray-500 mb-1">EST. HANDICAP</p>
                <p className="text-white font-bold">{analysis.handicapEstimate || "N/A"}</p>
              </div>
            </div>

            {/* Try Again */}
            <div className="text-center pt-4">
              <button onClick={() => { setAnalysis(null); setFrames([]); setVideoSrc(null); setError(null); }}
                className="px-8 py-3 rounded-full bg-gold text-charcoal font-semibold hover:bg-soft-gold transition">
                Analyze Another Swing
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
