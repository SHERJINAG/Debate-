"use client";

import { useRef, useState, useEffect, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Text } from "@react-three/drei";

const CAMERA_PRESETS = {
  DEFAULT:       { pos: [0, 2.0, 4.8],   look: [0, 1.2, 0] },
  HEADLINE_ZOOM: { pos: [0.0, 1.5, 2.0],  look: [0.0, 1.35, 0] }, // Adjusted X to 0 for centered look
  ANCHOR_DESK:   { pos: [0.0, 1.6, 2.4],  look: [0, 1.2, 0] },   // Adjusted X to 0 for centered look
  GRAPHIC_PAN:   { pos: [-1.8, 1.8, 3.2], look: [-1.5, 1.4, -1] },
  STUDIO_WIDE:   { pos: [0, 3.5, 8.0],   look: [0, 1.0, 0] }
};

const STUDIO_THEMES: Record<string, { primary: string; secondary: string; screenBase: string }> = {
  "tamil-nadu": { primary: "#ef4444", secondary: "#f59e0b", screenBase: "#0c1020" },
  "india":      { primary: "#f97316", secondary: "#22c55e", screenBase: "#05162e" },
  "global":     { primary: "#2563eb", secondary: "#38bdf8", screenBase: "#030712" },
  "sports":     { primary: "#eab308", secondary: "#ea580c", screenBase: "#021e17" },
  "tech":       { primary: "#06b6d4", secondary: "#a855f7", screenBase: "#020617" }
};


interface NewsSegment {
  segment_index: number;
  camera_angle: keyof typeof CAMERA_PRESETS;
  title: string;
  dialogue: string;
}

interface TVNewsStudioProps {
  initialTimeline: NewsSegment[];
  category: string;
  onExit: () => void;
}

interface Theme {
  primary: string;
  secondary: string;
  screenBase: string;
}



function CinematicCamera({ activeAngle }: { activeAngle: keyof typeof CAMERA_PRESETS }) {
  useFrame((state) => {
    const target = CAMERA_PRESETS[activeAngle] || CAMERA_PRESETS.DEFAULT;
    state.camera.position.lerp(new THREE.Vector3(...target.pos), 0.04);
    
    const currentLook = new THREE.Vector3(...CAMERA_PRESETS.DEFAULT.look);
    currentLook.lerp(new THREE.Vector3(...target.look), 0.04);
    state.camera.lookAt(currentLook);
  });
  return null;
}

function StudioEnvironment({ theme }: { theme: Theme }) {
  return (
    <group>
      {/* Glossy Dark Studio Floor Floor Reflection */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[60, 60]} />
        <meshStandardMaterial color="#02040a" roughness={0.05} metalness={0.95} />
      </mesh>

      {/* Main Multi-tiered Rounded Stage Platform */}
      <group position={[0, 0, 0]}>
        {/* Lower Rim */}
        <mesh position={[0, 0.04, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[4.6, 4.7, 0.08, 64]} />
          <meshStandardMaterial color="#1e293b" roughness={0.2} metalness={0.8} />
        </mesh>
        {/* Upper Main Reflective Stage Surface */}
        <mesh position={[0, 0.12, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[4.4, 4.4, 0.08, 64]} />
          <meshStandardMaterial color="#070d19" roughness={0.05} metalness={0.9} />
        </mesh>
        {/* Dynamic Circular Border Neon Piping */}
        <mesh position={[0, 0.165, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[4.32, 4.38, 64]} />
          <meshBasicMaterial color={theme.primary} side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* Massive World Map Panoramic Main Screen Wall */}
      

      {/* Light bars flanking the left and right background sides */}
      <mesh position={[-6.8, 2.5, -3.8]}><boxGeometry args={[0.15, 3.5, 0.1]} /><meshBasicMaterial color={theme.primary} /></mesh>
      <mesh position={[6.8, 2.5, -3.8]}><boxGeometry args={[0.15, 3.5, 0.1]} /><meshBasicMaterial color={theme.primary} /></mesh>

      {/* Lighting Rig Setup */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[0, 10, 5]} intensity={1.5} castShadow />
      <pointLight position={[0, 4, -2]} intensity={1.5} color={theme.secondary} />
      <pointLight position={[0, 3, 2]} intensity={2.0} color={theme.primary} />
    </group>
  );
}

// --- UPDATED: CENTERED GLASS/CHROME DESK SETUP ---
function PresentationSet({
  theme,
  currentTitle,
}: {
  theme: Theme;
  currentTitle: string;
  
}) { 
  const worldMapRef = useRef<THREE.Mesh>(null);
  useFrame((state) => {
  if (worldMapRef.current) {
    worldMapRef.current.rotation.y =
      state.clock.elapsedTime * 0.15;
  }
  
});
  return (
    <group>

      {/* ========================= */}
      {/* MAIN ANCHOR DESK */}
      {/* ========================= */}

      <group position={[0, 0, 0.3]}>

        {/* Desk Base */}
        <mesh
          position={[0, 0.45, 0]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[2.6, 0.85, 0.9]} />
          <meshStandardMaterial
            color="#dbe4ee"
            metalness={0.7}
            roughness={0.2}
          />
        </mesh>

        {/* Curved Front LED Panel */}
        <mesh position={[0, 0.45, 0.46]}>
          <cylinderGeometry
            args={[
              1.25,
              1.25,
              0.75,
              64,
              1,
              false,
              -Math.PI / 2,
              Math.PI,
            ]}
          />
          <meshStandardMaterial
            color="#06111f"
            emissive={theme.primary}
            emissiveIntensity={0.4}
          />
        </mesh>

        {/* Front Display */}
        <mesh position={[0, 0.45, 0.5]}>
          <planeGeometry args={[1.7, 0.45]} />
          <meshStandardMaterial
            color="#021224"
            emissive={theme.primary}
            emissiveIntensity={1.2}
          />
        </mesh>

        {/* Glass Top */}
        <mesh position={[0, 0.9, 0]}>
          <boxGeometry args={[2.7, 0.04, 0.95]} />
          <meshStandardMaterial
            color="#e2e8f0"
            transparent
            opacity={0.4}
            metalness={1}
            roughness={0.02}
          />
        </mesh>

        {/* Left Support */}
        <mesh position={[-1.05, 0.35, 0]}>
          <boxGeometry args={[0.18, 0.7, 0.65]} />
          <meshStandardMaterial
            color="#475569"
            metalness={0.9}
          />
        </mesh>

        {/* Right Support */}
        <mesh position={[1.05, 0.35, 0]}>
          <boxGeometry args={[0.18, 0.7, 0.65]} />
          <meshStandardMaterial
            color="#475569"
            metalness={0.9}
          />
        </mesh>

        {/* Laptop */}
        <group
          position={[0.5, 0.95, 0]}
          rotation={[0, 4, 0]}
        >
          <mesh>
            <boxGeometry args={[0.32, 0.015, 0.22]} />
            <meshStandardMaterial
              color="#94a3b8"
            />
          </mesh>

          <mesh
            position={[0, 0.12, -0.1]}
            rotation={[0.35, 0, 0]}
          >
            <boxGeometry args={[0.32, 0.22, 0.015]} />
            <meshStandardMaterial
              color="#475569"
            />
          </mesh>

          <mesh
            position={[0, 0.12, -0.092]}
            rotation={[0.35, 0, 0]}
          >
            <planeGeometry args={[0.28, 0.18]} />
            <meshBasicMaterial
              color={theme.primary}
            />
          </mesh>
        </group>

        {/* Notes */}
        <mesh
          position={[-0.4, 0.93, 0]}
          rotation={[-Math.PI / 2, 0, 0.08]}
        >
          <planeGeometry args={[0.25, 0.18]} />
          <meshStandardMaterial
            color="#ffffff"
          />
        </mesh>
      </group>

      {/* ========================= */}
      {/* BREAKING NEWS SCREEN */}
      {/* ========================= */}
<group
  position={[0, 2.2, -4]}
  rotation={[0, 0, 0]}
>
  {/* TV Frame */}
  <mesh castShadow>
    <boxGeometry args={[7.5, 3.2, 0.15]} />
    <meshStandardMaterial
      color="#111827"
      metalness={0.8}
      roughness={0.2}
    />
  </mesh>

  {/* Screen */}
  <mesh position={[0, 0, 0.09]}>
    <planeGeometry args={[7.2, 2.9]} />
    <meshStandardMaterial
      color="#04152d"
      emissive="#1e3a8a"
      emissiveIntensity={0.8}
    />
  </mesh>

  {/* Top News Line */}
  <mesh position={[0, 1.1, 0.12]}>
    <boxGeometry args={[5.8, 0.03, 0.01]} />
    <meshBasicMaterial color="#38bdf8" />
  </mesh>

  {/* Bottom News Line */}
  <mesh position={[0, -1.1, 0.12]}>
    <boxGeometry args={[5.8, 0.03, 0.01]} />
    <meshBasicMaterial color="#38bdf8" />
  </mesh>

  {/* Outer Ring */}
  <mesh position={[0, 0.05, 0.13]}>
    <ringGeometry args={[1.0, 1.08, 64]} />
    <meshBasicMaterial
      color="#60a5fa"
      transparent
      opacity={0.5}
      side={THREE.DoubleSide}
    />
  </mesh>

  {/* Inner Ring */}
  <mesh position={[0, 0.05, 0.14]}>
    <ringGeometry args={[0.75, 0.8, 64]} />
    <meshBasicMaterial
      color="#38bdf8"
      transparent
      opacity={0.3}
      side={THREE.DoubleSide}
    />
  </mesh>

  {/* MEDIA Banner */}
  <mesh position={[0, 0.45, 0.15]}>
    <boxGeometry args={[4.2, 0.75, 0.03]} />
    <meshBasicMaterial color="#0047AB" />
  </mesh>

  <Text
    position={[0, 0.45, 0.18]}
    fontSize={0.42}
    color="white"
    anchorX="center"
    anchorY="middle"
  >
    MEDIA
  </Text>

  {/* Red TV Banner */}
  <mesh position={[0, -0.25, 0.15]}>
    <boxGeometry args={[3.4, 0.85, 0.03]} />
    <meshBasicMaterial color="#D40000" />
  </mesh>

  <Text
    position={[-0.2, -0.25, 0.18]}
    fontSize={0.6}
    color="white"
    anchorX="center"
    anchorY="middle"
  >
    TV
  </Text>

  {/* Play Icon */}
  <mesh
    position={[1.15, -0.25, 0.18]}
    rotation={[0, 0, -Math.PI / 2]}
  >
    <coneGeometry args={[0.16, 0.32, 3]} />
    <meshBasicMaterial color="white" />
  </mesh>

  {/* Tagline */}
  <Text
    position={[0, -0.85, 0.18]}
    fontSize={0.12}
    color="#93c5fd"
    anchorX="center"
    anchorY="middle"
  >
    AI NEWS • REAL IMPACT
  </Text>

  {/* Small Accent Lines */}
  <mesh position={[-2.2, 0.85, 0.15]}>
    <boxGeometry args={[0.8, 0.04, 0.01]} />
    <meshBasicMaterial color="#38bdf8" />
  </mesh>

  <mesh position={[2.2, 0.85, 0.15]}>
    <boxGeometry args={[0.8, 0.04, 0.01]} />
    <meshBasicMaterial color="#38bdf8" />
  </mesh>

  <mesh position={[-2.2, -0.85, 0.15]}>
    <boxGeometry args={[0.8, 0.04, 0.01]} />
    <meshBasicMaterial color="#38bdf8" />
  </mesh>

  <mesh position={[2.2, -0.85, 0.15]}>
    <boxGeometry args={[0.8, 0.04, 0.01]} />
    <meshBasicMaterial color="#38bdf8" />
  </mesh>
</group>

      {/* ========================= */}
      {/* PREMIUM ANCHOR CHAIR */}
      {/* ========================= */}

      <group position={[0, 0, -0.4]}>

        <mesh position={[0, 0.4, 0]}>
          <cylinderGeometry
            args={[0.03, 0.03, 0.45]}
          />
          <meshStandardMaterial
            color="#64748b"
            metalness={1}
          />
        </mesh>

        <mesh position={[0, 0.65, 0]}>
          <boxGeometry args={[0.65, 0.08, 0.55]} />
          <meshStandardMaterial
            color="#111827"
          />
        </mesh>

        <mesh
          position={[0, 1.05, -0.18]}
          rotation={[0.1, 0, 0]}
        >
          <boxGeometry args={[0.6, 0.7, 0.08]} />
          <meshStandardMaterial
            color="#111827"
          />
        </mesh>
      </group>

    </group>
  );
}

// --- UPDATED: CENTERED NEWS ANCHOR AVATAR ---
function SeatedNewsAnchor({ theme, isSpeaking }: { theme: Theme; isSpeaking: boolean }) {
  const rightArmRef = useRef<THREE.Mesh>(null);
  const leftArmRef = useRef<THREE.Mesh>(null);
  const headRef = useRef<THREE.Group>(null);
  const mouthRef = useRef<THREE.Mesh>(null);
  const leftEyeRef = useRef<THREE.Mesh>(null);
  const rightEyeRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();

    if (mouthRef.current) {
      if (isSpeaking) {
        const mouthOpenIntensity = Math.abs(Math.sin(time * 15) * 0.6) + Math.abs(Math.cos(time * 9) * 0.2);
        mouthRef.current.scale.y = THREE.MathUtils.lerp(mouthRef.current.scale.y, Math.max(0.1, mouthOpenIntensity), 0.25);
      } else {
        mouthRef.current.scale.y = THREE.MathUtils.lerp(mouthRef.current.scale.y, 0.1, 0.2);
      }
    }

    const blinkCycle = Math.floor(time) % 5 === 0 && (time % 1 < 0.12);
    if (leftEyeRef.current && rightEyeRef.current) {
      leftEyeRef.current.scale.y = blinkCycle ? 0.05 : 1.0;
      rightEyeRef.current.scale.y = blinkCycle ? 0.05 : 1.0;
    }

    if (headRef.current) {
      headRef.current.rotation.y = Math.sin(time * 0.6) * 0.05; // Removed rotation offset to look forward
      headRef.current.rotation.x = (Math.cos(time * 0.4) * 0.015) + 0.04;
    }

    if (rightArmRef.current && leftArmRef.current) {
      const armWobbleA = Math.sin(time * 1.8) * 0.05;
      const armWobbleB = Math.cos(time * 1.3) * 0.03;

      rightArmRef.current.rotation.x = -Math.PI / 2.8 + armWobbleA;
      rightArmRef.current.rotation.y = -Math.PI / 8 + armWobbleB;

      leftArmRef.current.rotation.x = -Math.PI / 3.0 + armWobbleB;
      leftArmRef.current.rotation.y = Math.PI / 10 + armWobbleA;
    }
  });

  return (
    // Positioned at X: 0 to sit perfectly center on the main stage axis
    <group position={[0, 0.52, -0.12]}>

  {/* TORSO */}
  <mesh position={[0, 0.48, 0]} castShadow>
    <boxGeometry args={[0.42, 0.55, 0.24]} />
    <meshStandardMaterial color="#dcdcdc" roughness={0.4} />
  </mesh>

  {/* LEGS */}
  <mesh position={[0, 0.12, -0.05]} castShadow>
    <boxGeometry args={[0.38, 0.16, 0.32]} />
    <meshStandardMaterial color="#1f2937" />
  </mesh>

  {/* SHIRT */}
  <mesh position={[0, 0.65, 0.13]}>
    <boxGeometry args={[0.12, 0.12, 0.02]} />
    <meshStandardMaterial color="#111827" />
  </mesh>

  {/* RIGHT ARM */}
  <mesh
    ref={rightArmRef}
    position={[0.22, 0.55, 0.12]}
    rotation={[-1.15, -0.2, 0]}
    castShadow
  >
    <boxGeometry args={[0.1, 0.38, 0.1]} />
    <meshStandardMaterial color="#dcdcdc" />

    <mesh position={[0, -0.22, 0]}>
      <sphereGeometry args={[0.05, 16, 16]} />
      <meshStandardMaterial color="#fcd34d" />
    </mesh>
  </mesh>

  {/* LEFT ARM */}
  <mesh
    ref={leftArmRef}
    position={[-0.22, 0.55, 0.12]}
    rotation={[-1.15, 0.2, 0]}
    castShadow
  >
    <boxGeometry args={[0.1, 0.38, 0.1]} />
    <meshStandardMaterial color="#dcdcdc" />

    <mesh position={[0, -0.22, 0]}>
      <sphereGeometry args={[0.05, 16, 16]} />
      <meshStandardMaterial color="#fcd34d" />
    </mesh>
  </mesh>

  {/* HEAD */}
  <group
    ref={headRef}
    position={[0, 0.92, 0.02]}
  >
    {/* FACE */}
    <mesh castShadow>
      <sphereGeometry args={[0.15, 48, 48]} />
      <meshStandardMaterial
        color="#fcd34d"
        roughness={0.6}
      />
    </mesh>

    {/* HAIR */}
    <mesh position={[0, 0.07, -0.01]} castShadow>
      <sphereGeometry
        args={[
          0.165,
          32,
          32,
          0,
          Math.PI * 2,
          0,
          Math.PI / 1.4,
        ]}
      />
      <meshStandardMaterial
        color="#2b1d0e"
        roughness={0.9}
      />
    </mesh>

    {/* EYEBROWS */}
    <mesh position={[-0.05, 0.07, 0.12]}>
      <boxGeometry args={[0.04, 0.01, 0.01]} />
      <meshBasicMaterial color="black" />
    </mesh>

    <mesh position={[0.05, 0.07, 0.12]}>
      <boxGeometry args={[0.04, 0.01, 0.01]} />
      <meshBasicMaterial color="black" />
    </mesh>

    {/* EYE WHITE LEFT */}
    <mesh position={[-0.05, 0.03, 0.115]}>
      <sphereGeometry args={[0.018, 16, 16]} />
      <meshStandardMaterial color="white" />
    </mesh>

    {/* EYE WHITE RIGHT */}
    <mesh position={[0.05, 0.03, 0.115]}>
      <sphereGeometry args={[0.018, 16, 16]} />
      <meshStandardMaterial color="white" />
    </mesh>

    {/* LEFT EYE */}
    <mesh
      ref={leftEyeRef}
      position={[-0.05, 0.03, 0.13]}
    >
      <sphereGeometry args={[0.009, 16, 16]} />
      <meshBasicMaterial color="black" />
    </mesh>

    {/* RIGHT EYE */}
    <mesh
      ref={rightEyeRef}
      position={[0.05, 0.03, 0.13]}
    >
      <sphereGeometry args={[0.009, 16, 16]} />
      <meshBasicMaterial color="black" />
    </mesh>

    {/* NOSE */}
    <mesh
      position={[0, 0.0, 0.135]}
      rotation={[Math.PI / 2, 0, 0]}
    >
      <coneGeometry args={[0.015, 0.04, 8]} />
      <meshStandardMaterial color="#eab308" />
    </mesh>

    {/* UPPER LIP */}
    <mesh position={[0, -0.05, 0.135]}>
      <boxGeometry args={[0.05, 0.01, 0.01]} />
      <meshStandardMaterial color="#b91c1c" />
    </mesh>

    {/* LOWER LIP - ANIMATED */}
    <mesh
      ref={mouthRef}
      position={[0, -0.065, 0.135]}
    >
      <boxGeometry args={[0.05, 0.01, 0.01]} />
      <meshStandardMaterial color="#991b1b" />
    </mesh>
  </group>
</group>
  );
}

export default function TVNewsStudio({ initialTimeline, category, onExit }: TVNewsStudioProps) {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const theme = useMemo(() => STUDIO_THEMES[category] || STUDIO_THEMES["global"], [category]);

  const activeAngle = useMemo(() => {
    if (initialTimeline && initialTimeline[currentIndex]) {
      return initialTimeline[currentIndex].camera_angle;
    }
    return "DEFAULT" as keyof typeof CAMERA_PRESETS;
  }, [currentIndex, initialTimeline]);

  useEffect(() => {
    if (initialTimeline && initialTimeline[currentIndex]) {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(initialTimeline[currentIndex].dialogue);
        utterance.lang = "ta-IN";
        utterance.rate = 1.05;

        utterance.onstart = () => setIsSpeaking(true);

        utterance.onend = () => {
          setIsSpeaking(false);
          if (currentIndex < initialTimeline.length - 1) {
            setCurrentIndex((prev) => prev + 1);
          } else {
            onExit();
          }
        };
        window.speechSynthesis.speak(utterance);
      }
    }
    
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [currentIndex, initialTimeline, onExit]);

  const currentTitle = useMemo(() => {
    return initialTimeline[currentIndex]?.title || "BREAKING NEWS";
  }, [currentIndex, initialTimeline]);

  return (
    <div className="w-screen h-screen bg-[#020617] flex flex-col overflow-hidden text-white relative font-sans">
      
      {/* 3D Main Viewport */}
      <div className="flex-1 w-full bg-slate-950 relative">
        <Canvas shadows camera={{ fov: 40 }}>
          <CinematicCamera activeAngle={activeAngle} />
          <StudioEnvironment theme={theme} />
          <PresentationSet theme={theme} currentTitle={currentTitle} />
          <SeatedNewsAnchor theme={theme} isSpeaking={isSpeaking} />
        </Canvas>
      </div>

      {/* BOTTOM RUNNING TICKER MARQUEE */}
      <div className="w-full h-12 flex items-center z-20 overflow-hidden relative shadow-2xl border-t border-slate-900" style={{ backgroundColor: theme.primary }}>
        <div className="bg-slate-950 h-full px-6 flex items-center text-white font-black tracking-widest text-xs uppercase shrink-0 z-30 shadow-2xl">
          FLASH NEWS
        </div>
        <div className="w-full relative flex items-center overflow-hidden h-full">
          <div className="absolute whitespace-nowrap flex gap-16 items-center text-white font-bold text-sm tracking-wide uppercase px-4 animate-marquee">
            {initialTimeline.map((item, idx) => (
              <span key={idx} className="flex gap-4 items-center shrink-0">
                <span className="text-slate-950 font-black">• UPDATE {idx + 1}:</span>
                <span className="text-white font-medium">{item.title}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes marquee {
          0% { transform: translateX(5%); }
          100% { transform: translateX(-100%); }
        }
        .animate-marquee {
          animation: marquee 50s linear infinite;
        }
      `}</style>
    </div>
  );
}

export type { NewsSegment };
export { CAMERA_PRESETS };
