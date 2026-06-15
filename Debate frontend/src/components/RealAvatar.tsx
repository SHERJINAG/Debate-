"use client";

import React, { useRef, useMemo, useState, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, Html } from "@react-three/drei";
import * as THREE from "three";

const characterProfiles = {
  1: { name: "Gokul", role: "Public Supporter", colorCode: "bg-cyan-600/90" },
  2: { name: "Kavitha", role: "Supporter", colorCode: "bg-emerald-600/90" },
  3: { name: "Vijay", role: "Main Anchor", colorCode: "bg-red-600/90" },
  4: { name: "Vidya", role: "Neutral Expert", colorCode: "bg-indigo-600/90" },
  5: { name: "Mani", role: "Opposer", colorCode: "bg-orange-600/90" },
  6: { name: "Kavya", role: "Public Opposer", colorCode: "bg-rose-600/90" },
};


function SeatedDebater({ color = "#1e293b", hairColor = "#b45309", activeMouthScale = 1 }) {
  const mouthRef = useRef<THREE.Mesh | null>(null);

  useFrame(() => {
    if (mouthRef.current) {
      mouthRef.current.scale.y = activeMouthScale;
    }
  });

  return (
    <group position={[0, -0.15, -0.15]}>
      <mesh position={[0, 0.4, -0.3]}>
        <boxGeometry args={[0.5, 0.7, 0.08]} />
        <meshStandardMaterial color={[0.1, 0.1, 0.15]} roughness={0.4} metalness={0.6} />
      </mesh>
      <mesh position={[0, 0.05, -0.1]}>
        <boxGeometry args={[0.5, 0.06, 0.5]} />
        <meshStandardMaterial color="#111827" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.45, -0.05]} castShadow>
        <boxGeometry args={[0.45, 0.55, 0.25]} />
        <meshStandardMaterial color={color} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.58, 0.08]}>
        <planeGeometry args={[0.1, 0.2]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <mesh position={[0, 0.52, 0.085]}>
        <coneGeometry args={[0.02, 0.12, 4]} />
        <meshStandardMaterial color="#991b1b" />
      </mesh>
      <mesh position={[-0.23, 0.4, 0.05]} rotation={[0.4, 0, -0.1]}>
        <boxGeometry args={[0.1, 0.35, 0.12]} />
        <meshStandardMaterial color={color} roughness={0.3} />
      </mesh>
      <mesh position={[0.23, 0.4, 0.05]} rotation={[0.4, 0, 0.1]}>
        <boxGeometry args={[0.1, 0.35, 0.12]} />
        <meshStandardMaterial color={color} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.75, -0.05]}>
        <cylinderGeometry args={[0.06, 0.07, 0.1]} />
        <meshStandardMaterial color="#fbcfe8" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.92, -0.03]} castShadow>
        <sphereGeometry args={[0.13, 32, 32]} />
        <meshStandardMaterial color="#fcd34d" roughness={0.7} />
      </mesh>
      <mesh ref={mouthRef} position={[0, 0.88, 0.09]}>
        <boxGeometry args={[0.06, 0.015, 0.02]} />
        <meshStandardMaterial color="#991b1b" roughness={0.5} />
      </mesh>
      <mesh position={[0, 1.02, -0.05]}>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial color={hairColor} roughness={0.8} />
      </mesh>
    </group>
  );
}

function StudioPodium({speakerId, speakerColor, hairColor, activeMouthScale, isSpeaking }: { speakerId: string; speakerColor: string; hairColor: string; activeMouthScale: number; isSpeaking: boolean }) {
  const meta = characterProfiles[Number(speakerId) as keyof typeof characterProfiles] || { name: "Guest", role: "Panelist", colorCode: "bg-slate-600" }; 
  return (
    <group>
      {/* --- CONDITIONALLY RENDER NAMEPLATE ONLY WHEN SPEAKING --- */}
      {isSpeaking && (
        <mesh position={[0, 0.5, 0.1]}>
          <Html 
            distanceFactor={5.0}
            transform
            sprite
          >
            <div className="flex flex-col items-center tracking-wider font-sans transition-all duration-300 pointer-events-none select-none scale-110 opacity-100">
              <span className={`text-[9px] font-black text-white px-2 py-0.5 rounded shadow-xl uppercase border border-white/10 whitespace-nowrap ${meta.colorCode} ring-2 ring-amber-400 animate-pulse`}>
                🎙️ {meta.role}
              </span>
              <span className="text-[9px] font-bold text-slate-200 mt-1 px-2 py-0.5 bg-black/90 rounded backdrop-blur-md whitespace-nowrap border border-slate-700/50 shadow-2xl">
                {meta.name}
              </span>
            </div>
          </Html>
        </mesh>
      )}

      <group position={[0, 0.5, -0.1]}>
        <SeatedDebater color={speakerColor} hairColor={hairColor} activeMouthScale={activeMouthScale} />
      </group>

      <mesh position={[0, 0.45, 0.2]} castShadow receiveShadow>
        <boxGeometry args={[0.85, 0.9, 0.5]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.15} metalness={0.05} />
      </mesh>
      <mesh position={[0, 0.45, 0.46]}>
        <boxGeometry args={[0.5, 0.75, 0.02]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.9, 0.18]} rotation={[0.02, 0, 0]} castShadow>
        <boxGeometry args={[1.0, 0.04, 0.65]} />
        <meshStandardMaterial color="#ffffff" roughness={0.1} />
      </mesh>
      <mesh position={[-0.25, 1.02, 0.25]} rotation={[-0.6, 0.3, 0]}>
        <cylinderGeometry args={[0.006, 0.006, 0.25]} />
        <meshStandardMaterial color="#0f172a" roughness={0.5} />
      </mesh>
    </group>
  );
}

// --- CINEMATIC INTRO CAMERA CONTROLLER ---
function CinematicCameraControl({ activeSpeakerPosition, isTheater, isIntroActive }: { activeSpeakerPosition: THREE.Vector3 | null; isTheater: boolean; isIntroActive: boolean }) {
  const { camera } = useThree();
  const targetCamPos = useRef(new THREE.Vector3(0, 3.4, 6.8));
  const targetLookAt = useRef(new THREE.Vector3(0, 1.2, 0));
  const currentLookAt = useRef(new THREE.Vector3(0, 1.2, 0));

  useFrame((state) => {
    if (isTheater) {
      if (isIntroActive) {
        // Sweeping TV channel crane introduction camera path using elapsed running clock time
        const elapsedTime = state.clock.getElapsedTime();
        const radius = 9.5;
        const angle = elapsedTime * 0.45 - Math.PI / 2; // Smooth orbital pan rotation

        targetCamPos.current.set(
          Math.sin(angle) * radius,
          4.5 + Math.sin(elapsedTime * 1.5) * 1.2, // Continuous subtle crane lift up and down
          Math.cos(angle) * radius
        );
        targetLookAt.current.set(0, 1.0, -0.5);
      } else if (activeSpeakerPosition) {
        // Standard close up active panelist tracking focus matrix
        targetCamPos.current.set(
          activeSpeakerPosition.x * 0.85,
          activeSpeakerPosition.y + 1.4, 
          activeSpeakerPosition.z + 2.4
        );
        targetLookAt.current.set(
          activeSpeakerPosition.x,
          activeSpeakerPosition.y + 1.0,
          activeSpeakerPosition.z
        );
      }
    } else {
      targetCamPos.current.set(0, 3.8, 8.2);
      targetLookAt.current.set(0, 1.2, 0);
    }

    camera.position.lerp(targetCamPos.current, 0.045);
    currentLookAt.current.lerp(targetLookAt.current, 0.045);
    camera.lookAt(currentLookAt.current);
  });

  return null;
}

function seededRandom(seed: number) {
  let value = seed;
  return function () {
    value = (value * 9301 + 49297) % 233280;
    return value / 233280;
  };
}

function StudioBackgroundSet() {
  const screenTexture = useMemo(() => {
    if (typeof window === "undefined") return null;

    const canvas = document.createElement("canvas");
    canvas.width = 2048;
    canvas.height = 1024;

    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    // ==========================
    // BACKGROUND
    // ==========================
    const bg = ctx.createLinearGradient(0, 0, 0, 1024);
    bg.addColorStop(0, "#020617");
    bg.addColorStop(0.5, "#08142c");
    bg.addColorStop(1, "#020617");

    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 2048, 1024);

    // Scan lines
    for (let y = 0; y < 1024; y += 6) {
      ctx.fillStyle = "rgba(255,255,255,0.02)";
      ctx.fillRect(0, y, 2048, 1);
    }

    // ==========================
    // LEFT STOCK SCREEN
    // ==========================
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.fillRect(40, 180, 450, 620);

    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.lineWidth = 1;

    for (let x = 40; x < 490; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 180);
      ctx.lineTo(x, 800);
      ctx.stroke();
    }

    for (let y = 180; y < 800; y += 40) {
      ctx.beginPath();
      ctx.moveTo(40, y);
      ctx.lineTo(490, y);
      ctx.stroke();
    }

    ctx.strokeStyle = "#00ff88";
    ctx.lineWidth = 6;
    ctx.beginPath();

    const pts = [
      [80, 720],
      [120, 680],
      [180, 650],
      [240, 600],
      [300, 610],
      [360, 520],
      [420, 420],
      [470, 320]
    ];

    pts.forEach(([x, y], i) => {
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });

    ctx.stroke();

    ctx.fillStyle = "#00ff88";
    ctx.font = "bold 40px Arial";
    ctx.fillText("MARKET LIVE", 80, 140);

    // ==========================
    // CENTER MEDIA TV
    // ==========================
    const centerX = 1024;

    ctx.strokeStyle = "rgba(255,255,255,0.05)";
    ctx.lineWidth = 4;

    ctx.beginPath();
    ctx.arc(centerX, 500, 280, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(centerX, 500, 380, 0, Math.PI * 2);
    ctx.stroke();

    // MEDIA PANEL
    ctx.fillStyle = "#003da8";

    roundRect(ctx, 670, 240, 700, 180, 20);
    ctx.fill();

    // RED SWOOSH
    ctx.strokeStyle = "#ff2020";
    ctx.lineWidth = 10;

    ctx.beginPath();
    ctx.moveTo(760, 340);
    ctx.quadraticCurveTo(1020, 220, 1260, 310);
    ctx.stroke();

    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.font = "bold 120px Arial";
    ctx.fillText("MEDIA", centerX, 360);

    // TV PANEL
    ctx.fillStyle = "#d70000";

    roundRect(ctx, 700, 450, 650, 190, 20);
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 150px Arial";
    ctx.fillText("TV", centerX - 30, 590);

    // PLAY ICON
    ctx.beginPath();
    ctx.moveTo(1220, 500);
    ctx.lineTo(1290, 545);
    ctx.lineTo(1220, 590);
    ctx.closePath();
    ctx.fill();

    ctx.font = "bold 34px Arial";
    ctx.fillText(
      "AI NEWS. REAL IMPACT.",
      centerX,
      720
    );

    // ==========================
    // RIGHT ANALYTICS SCREEN
    // ==========================
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.fillRect(1560, 180, 450, 620);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 40px Arial";
    ctx.fillText("SURVEY DATA", 1630, 140);

    const cx = 1720;
    const cy = 470;
    const r = 140;

    const values = [40, 25, 20, 15];
    const colors = [
      "#2563eb",
      "#dc2626",
      "#16a34a",
      "#facc15"
    ];

    let start = 0;

    values.forEach((value, i) => {
      const end =
        start + (Math.PI * 2 * value) / 100;

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, start, end);
      ctx.closePath();

      ctx.fillStyle = colors[i];
      ctx.fill();

      start = end;
    });

    // BAR CHART
    const bars = [140, 220, 180, 260];

    bars.forEach((h, i) => {
      ctx.fillStyle = "#38bdf8";

      ctx.fillRect(
        1840 + i * 35,
        760 - h,
        25,
        h
      );
    });

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;

    return texture;
  }, []);

  return (
    <group position={[0, 2.5, -6.5]}>
      <mesh>
        <planeGeometry args={[10.5, 4.5]} />
        <meshStandardMaterial
          map={screenTexture}
          roughness={0.25}
          metalness={0.1}
          emissive="#ffffff"
          emissiveIntensity={0.35}
        />
      </mesh>

      <mesh position={[0, 0, -0.05]}>
        <boxGeometry args={[10.65, 4.65, 0.05]} />
        <meshStandardMaterial
          color="#0f172a"
          roughness={0.4}
        />
      </mesh>
    </group>
  );
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function HighGlossStageFloor() {
  return (
    <group position={[0, 0, -1]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, -1.0]}>
        <ringGeometry args={[8.1, 8.25, 64]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={1.0} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
        <planeGeometry args={[50, 40]} />
        <meshStandardMaterial color="#010307" roughness={0.8} />
      </mesh>
    </group>
  );
}

interface TimelineSegment {
  dialogue: string;
  speaker_id: number;
}

export default function RealStudioPage() {
  const [screen, setScreen] = useState("setup");
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [isDataReady, setIsDataReady] = useState(false);
  const [timeline, setTimeline] = useState<TimelineSegment[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1); // Changed to -1 to capture the Intro State
  const [isIntroActive, setIsIntroActive] = useState(false);
  const [mouthScale, setMouthScale] = useState(1);

  const mouthAnimationRef = useRef<number | null>(null);

  const U_SpeakersSetup = useMemo(() => [
    { id: 3, targetX: -0.9, rotY: 0.1,  suit: "#1e293b", hair: "#27272a" },
    { id: 4, targetX: 0.9,  rotY: -0.1, suit: "#111827", hair: "#78350f" },
    { id: 2, targetX: -2.8, rotY: 1,    suit: "#0f172a", hair: "#f59e0b" },
    { id: 5, targetX: 2.8,  rotY: -1,   suit: "#1e3a8a", hair: "#d97706" },
    { id: 1, targetX: -4.6, rotY: 1.5,  suit: "#1e3a8a", hair: "#b45309" },
    { id: 6, targetX: 4.6,  rotY: -1.5, suit: "#0f172a", hair: "#451a03" },
  ], []);

  const handleFetchScript = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!topic.trim()) return;
    setLoading(true);
    setIsDataReady(false);
    try {
      const res = await fetch("https://debate-system.onrender.com/api/studio/process-debate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic })
      });
      const data = await res.json();
      if (data.success) {
        setTimeline(data.timeline);
        setIsDataReady(true);
      }
    } catch {
      alert("Error parsing elements from FastAPI backend server.");
    } finally {
      setLoading(false);
    }
  };

  const startProceduralLipSync = () => {
    const runAnimation = () => {
      const talkingWave = 1 + Math.abs(Math.sin(Date.now() * 0.015)) * 0.8 + Math.random() * 0.6;
      setMouthScale(talkingWave);
      mouthAnimationRef.current = requestAnimationFrame(runAnimation);
    };
    runAnimation();
  };

  const stopProceduralLipSync = () => {
    if (mouthAnimationRef.current) {
      cancelAnimationFrame(mouthAnimationRef.current);
    }
    setMouthScale(1);
  };

  const playSpeechSegment = (index: number) => {
    if (index >= timeline.length) {
      stopProceduralLipSync();
      setScreen("setup");
      setIsDataReady(false);
      setCurrentIndex(-1);
      alert("Live debate transmission finished.");
      return;
    }

    const activeSegment = timeline[index];
    if (!activeSegment) return;
   

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(String(activeSegment?.dialogue || ""));
    utterance.lang = "ta-IN";

    switch (Number(activeSegment?.speaker_id)) { 
      case 3:
        utterance.pitch = 1.0; utterance.rate = 1.05;
        break;
      case 5:
        utterance.pitch = 0.85; utterance.rate = 1.15;
        break;
      case 4:
        utterance.pitch = 1.15; utterance.rate = 0.95;
        break;
      default:
        utterance.pitch = 1.0; utterance.rate = 1.0;
    }

    utterance.onstart = () => {
      startProceduralLipSync();
    };

    utterance.onend = () => {
      stopProceduralLipSync();
      setCurrentIndex(index + 1);
    };

    utterance.onerror = (e) => {
      console.error("Speech Synthesis Error:", e);
      stopProceduralLipSync();
      setCurrentIndex(index + 1);
    };

    window.speechSynthesis.speak(utterance);
  };

  // --- TRIGGER THE 3D CINEMATIC CRANE INTRO SEQUENCE ---
  const handleStartBroadcast = () => {
    setScreen("theater");
    setIsIntroActive(true);
    setCurrentIndex(-1);

    // Runs a 5-second dynamic introductory camera sweep before the debate starts speaking
    setTimeout(() => {
      setIsIntroActive(false);
      setCurrentIndex(0); // Safely jumps index cursor to trigger the initial debate script segment
    }, 5000);
  };

  const prevIndexRef = useRef(currentIndex);

  useEffect(() => {
    if (screen === "theater" && timeline.length > 0 && currentIndex >= 0 && prevIndexRef.current !== currentIndex) {
      prevIndexRef.current = currentIndex;
      playSpeechSegment(currentIndex);
    }
    return () => {
      window.speechSynthesis.cancel();
      if (mouthAnimationRef.current) {
        cancelAnimationFrame(mouthAnimationRef.current);
      }
    };
  }, [screen, currentIndex, timeline]);

  const activeSpeakerId = currentIndex >= 0 ? timeline[currentIndex]?.speaker_id : null;
  
  const activeSpeakerPosition = useMemo(() => {
    if (activeSpeakerId === null) return new THREE.Vector3(0, 0, 0);
    const config = U_SpeakersSetup.find(s => s.id === activeSpeakerId);
    if (!config) return new THREE.Vector3(0, 0, 0);
    const zPos = 0.16 * Math.pow(config.targetX, 2) - 1.2;
    return new THREE.Vector3(config.targetX, 0, zPos);
  }, [activeSpeakerId, U_SpeakersSetup]);

  if (screen === "setup") {
    return (
      <div className="w-screen h-screen bg-[#03050d] text-white flex flex-col items-center justify-center font-sans p-6">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 p-8 rounded-xl shadow-2xl space-y-6">
          <div className="text-center">
            <h1 className="text-lg font-black tracking-widest text-amber-500 uppercase">MedaTV Control Room</h1>
            <p className="text-xs text-slate-400 mt-1">Configure parameters before initializing live 3D stream feed</p>
          </div>

          <form onSubmit={handleFetchScript} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Debate Topic</label>
              <textarea
                className="w-full p-3 text-xs bg-black border border-slate-700 rounded-lg text-amber-400 focus:outline-none focus:border-amber-500 font-sans resize-none"
                rows={3} value={topic} onChange={e => setTopic(e.target.value)}
                placeholder="Type the debate argument context..." disabled={loading}
              />
            </div>

            <button 
              type="submit"
              className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-slate-800 disabled:text-slate-500 text-black font-bold text-xs p-3 rounded-lg tracking-wide transition-all uppercase" 
              disabled={loading}
            >
              {loading ? "Compiling Script Parameters..." : "Send Topic Parameters"}
            </button>
          </form>

          <div className="border-t border-slate-800 pt-4">
            <button 
              onClick={handleStartBroadcast}
              disabled={!isDataReady}
              className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 disabled:text-slate-600 text-black font-black text-xs py-3 rounded-lg tracking-widest transition-all uppercase shadow-lg shadow-emerald-500/10 enabled:animate-pulse"
            >
              {isDataReady ? "🚀 Launch Live Studio" : "Awaiting Engine Compilation"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen bg-black text-white relative select-none overflow-hidden flex flex-col justify-between font-mono">
      {/* HUD Telemetry Banner */}
      <div className="absolute top-4 left-4 z-50 bg-slate-900/90 border border-slate-700/50 px-4 py-2 rounded shadow-2xl flex items-center space-x-3 backdrop-blur-sm">
        <span className="text-[10px] text-red-500 font-bold animate-pulse flex items-center gap-1">● LIVE FEED</span>
        <span className="text-slate-400 text-xs">|</span>
        <p className="text-xs text-slate-300 max-w-xs truncate font-sans font-medium">{topic}</p>
        <button 
          onClick={() => { window.speechSynthesis.cancel(); setScreen("setup"); setIsDataReady(false); setCurrentIndex(-1); }} 
          className="text-[10px] text-slate-400 hover:text-rose-400 underline pl-2"
        >
          Return to Deck
        </button>
      </div>

      {/* OVERLAY NEWS BROADCAST HUD GRAPHICS (Displays during the 5s Intro loop) */}
      {isIntroActive && (
  <div className="absolute inset-0 z-40 pointer-events-none flex flex-col justify-between p-12 bg-gradient-to-t from-black/40 via-transparent to-black/20">
    <div className="self-end bg-amber-500 text-black text-[11px] px-3 py-1 font-black uppercase tracking-widest rounded shadow-2xl animate-bounce">
      Broadcasting Intro Sweep...
    </div>
    {/* Removed max-w-2xl or expanded it to max-w-3xl to give long text more breathing room */}
    <div className="w-full max-w-3xl bg-red-700/90 border-l-8 border-amber-400 text-white p-4 backdrop-blur-sm shadow-2xl font-sans animate-fade-in">
      <span className="text-[10px] bg-white text-red-800 px-1.5 py-0.5 rounded font-black uppercase tracking-wider">Breaking News</span>
      
      {/* 
        CHANGED: Removed 'truncate'
        ADDED: 'whitespace-normal' (allows wrapping) and 'break-words' (prevents long single words from overflowing)
      */}
      <h2 className="text-xl font-black uppercase tracking-wide mt-1 whitespace-normal break-words leading-snug">
        {topic}
      </h2>
      
      <p className="text-xs text-slate-200 font-medium mt-1">MedaTV Studio Live Discussion Engine</p>
    </div>
  </div>
)}

      {/* 3D WebGL Canvas Layer */}
      <div className="w-full flex-1 relative bg-[#03050d]">
        <Canvas shadows>
          <PerspectiveCamera makeDefault position={[0, 3.4, 6.8]} fov={38} />
          <ambientLight intensity={0.8} />
          <directionalLight position={[0, 9, 3]} intensity={2.4} castShadow shadow-mapSize={[2048, 2048]} />
          <directionalLight position={[-7, 6, 4]} intensity={1.2} /><directionalLight position={[6, 6, 4]} intensity={1.2} />
          <pointLight position={[0, 2.2, -3]} intensity={1.5} color="#38bdf8" />

          <HighGlossStageFloor />
          <StudioBackgroundSet />

          {U_SpeakersSetup.map((speaker) => {
            const x = speaker.targetX;
            const z = 0.16 * Math.pow(x, 2) - 1.2;
            const isSpeakingNow = speaker.id === activeSpeakerId;

            return (
              <group key={speaker.id} position={[x, 0, z]} rotation={[0, speaker.rotY, 0]}>
                <StudioPodium 
                  speakerId={String(speaker.id)}
                  speakerColor={speaker.suit} 
                  hairColor={speaker.hair} 
                  activeMouthScale={isSpeakingNow ? mouthScale : 1} 
                  isSpeaking={isSpeakingNow}
                />
              </group>
            );
          })}

          <CinematicCameraControl 
            activeSpeakerPosition={activeSpeakerPosition} 
            isTheater={true} 
            isIntroActive={isIntroActive} 
          />
          {!isIntroActive && (
            <OrbitControls enableZoom={true} minDistance={4} maxDistance={12} maxPolarAngle={Math.PI / 2.05} minPolarAngle={Math.PI / 4} />
          )}
        </Canvas>
      </div>
    </div>
  );
}
