"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { 
  PerspectiveCamera, 
  MeshReflectorMaterial, 
  Environment, 
  ContactShadows,
  Float
} from "@react-three/drei";
import * as THREE from "three";
import axios from "axios";

const SPORT_THEMES = {
  cricket: { primary: "#059669", secondary: "#10b981", accent: "#34d399", videoWall: "#064e3b" },
  football: { primary: "#ca8a04", secondary: "#eab308", accent: "#fde047", videoWall: "#422006" },
};

interface Match {
  id: string; homeTeam: string; awayTeam: string; status: "LIVE" | "FINISHED" | "SCHEDULED";
  score: string; competition: string; date: string;
}
interface BroadcastSegment { speaker: string; text: string; }
interface SportsCenterDashboardProps { onExit: () => void; }

/**
 * UPDATED SPEAKER POSITIONS: 
 * Anchor on Left (-4 area), Analysts on Right (2 to 5 area) in a semi-circle.
 */
const SPEAKER_POSITIONS = [
  {
    id: 1,
    name: "Fan Voice",
    angle: 0.5,
    targetX: -1.7,
    z: 0,
    suit: "#221f1f",
    shirt: "#ffffff",
    hair: "#27272a",
    role: "anchor"
  },

  {
    id: 2,
    name: "Field Expert",
    angle: 0,
    targetX: -0.7,
    z: 0,
    suit: "#2d2d2d",
    shirt: "#ffffff",
    hair: "#451a03",
    role: "analyst"
  },

  {
    id: 3,
    name: "Anchor",
    angle: 0,
    targetX: 0,
    z: 0,
    suit: "#1e3a8a",
    shirt: "#ffffff",
    hair: "#b45309",
    role: "analyst"
  },

  {
    id: 4,
    name: "Data Analyst",
    angle: 0,
    targetX: 0.7,
    z: 0,
    suit: "#312e81",
    shirt: "#ffffff",
    hair: "#1e3a8a",
    role: "analyst"
  },

  {
    id: 5,
    name: "Tactical Analyst",
    angle: -0.5,
    targetX: 1.7,
    z: 0,
    suit: "#164e63",
    shirt: "#ffffff",
    hair: "#0f172a",
    role: "analyst"
  }
];



function createStarSportsTexture(
  width: number,
  height: number
) {
  const canvas = document.createElement("canvas");

  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d")!;
  ctx.translate(width, 0);
  ctx.scale(-1, 1);
  // Background

  const bg = ctx.createLinearGradient(
    0,
    0,
    0,
    height
  );

  bg.addColorStop(0, "#08112b");
  bg.addColorStop(0.5, "#0f2f7a");
  bg.addColorStop(1, "#020617");

  ctx.fillStyle = bg;
  ctx.fillRect(
    0,
    0,
    width,
    height
  );

  // Grid

  ctx.strokeStyle =
    "rgba(0,255,255,0.08)";

  for (let x = 0; x < width; x += 60) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }

  for (let y = 0; y < height; y += 60) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  // Dynamic swooshes

  const colors = [
    "#00d4ff",
    "#ef4444",
    "#f59e0b",
    "#10b981",
  ];

  colors.forEach((color, i) => {

    ctx.beginPath();

    ctx.strokeStyle = color;

    ctx.lineWidth = 18;

    ctx.moveTo(
      120,
      height - 180 - i * 25
    );

    ctx.bezierCurveTo(
      width * 0.25,
      height * 0.25,
      width * 0.55,
      height * 0.75,
      width - 160,
      180 + i * 20
    );

    ctx.stroke();
  });

  // Gold star

  const cx = width / 2;
  const cy = height / 2 - 70;

  ctx.beginPath();

  for (let i = 0; i < 10; i++) {

    const angle =
      Math.PI / 5 * i -
      Math.PI / 2;

    const r =
      i % 2 === 0
        ? 110
        : 45;

    const x =
      cx +
      Math.cos(angle) * r;

    const y =
      cy +
      Math.sin(angle) * r;

    if (i === 0)
      ctx.moveTo(x, y);
    else
      ctx.lineTo(x, y);
  }

  ctx.closePath();

  // Gold gradient

  const gold =
    ctx.createLinearGradient(
      cx - 100,
      cy - 100,
      cx + 100,
      cy + 100
    );

  gold.addColorStop(0, "#fff6b7");
  gold.addColorStop(0.4, "#ffd700");
  gold.addColorStop(1, "#c79200");

  ctx.fillStyle = gold;
  ctx.fill();

  // Glow

  ctx.shadowColor = "#ffd700";
  ctx.shadowBlur = 40;

  ctx.fillStyle = "#ffd700";
  ctx.fill();

  ctx.shadowBlur = 0;

  // Main title

  ctx.fillStyle = "#ffffff";

  ctx.textAlign = "center";

  ctx.font =
    "bold 90px Arial";

  ctx.fillText(
    "STAR SPORTS",
    cx,
    height * 0.72
  );

  // Subtitle

  ctx.fillStyle = "#00d4ff";

  ctx.font =
    "bold 34px Arial";

  ctx.fillText(
    "CRICKET • FOOTBALL • ANALYSIS",
    cx,
    height * 0.82
  );

  // Outer frame

  ctx.strokeStyle =
    "rgba(0,212,255,0.4)";

  ctx.lineWidth = 6;

  ctx.strokeRect(
    20,
    20,
    width - 40,
    height - 40
  );

  const texture =
    new THREE.CanvasTexture(canvas);

  texture.wrapS =
    THREE.RepeatWrapping;

  texture.repeat.x = -1;
  texture.offset.x = 1;

  return texture;
}

const createSportsWallTexture = (width: number, height: number) => {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d")!;

  const leftWidth = width * 0.3;
  const centerWidth = width * 0.4;
  const rightWidth = width * 0.3;

  // =========================
  // CRICKET PANEL
  // =========================
// =========================
// CRICKET PANEL
// =========================

const cricketGrad = ctx.createLinearGradient(0, 0, 0, height);

cricketGrad.addColorStop(0, "#022c22");
cricketGrad.addColorStop(1, "#064e3b");

ctx.fillStyle = cricketGrad;
ctx.fillRect(0, 0, leftWidth, height);

// Ground Circle
ctx.strokeStyle = "rgba(255,255,255,0.25)";
ctx.lineWidth = 4;

ctx.beginPath();
ctx.arc(leftWidth / 2, height / 2, 260, 0, Math.PI * 2);
ctx.stroke();

// Pitch
ctx.fillStyle = "#d4b483";

const pitchW = 55;
const pitchH = height - 680;

const pitchX = leftWidth / 2 - pitchW / 2;
const pitchY = height / 2 - pitchH / 2;

ctx.fillRect(
  pitchX,
  pitchY,
  pitchW,
  pitchH
);

// Stumps Top
ctx.strokeStyle = "#ffffff";
ctx.lineWidth = 4;

for (let i = -12; i <= 12; i += 12) {
  ctx.beginPath();
  ctx.moveTo(leftWidth / 2 + i, pitchY);
  ctx.lineTo(leftWidth / 2 + i, pitchY + 35);
  ctx.stroke();
}

// Stumps Bottom
for (let i = -12; i <= 12; i += 12) {
  ctx.beginPath();
  ctx.moveTo(leftWidth / 2 + i, pitchY + pitchH);
  ctx.lineTo(leftWidth / 2 + i, pitchY + pitchH - 35);
  ctx.stroke();
}

// Umpire
ctx.fillStyle = "#ffcc00";

ctx.beginPath();
ctx.arc(
  leftWidth / 2,
  height / 2,
  12,
  0,
  Math.PI * 2
);
ctx.fill();

// Fielders

const fielders = [
  [0.25,0.25],
  [0.75,0.25],
  [0.18,0.45],
  [0.82,0.45],
  [0.25,0.72],
  [0.75,0.72],
  [0.5,0.15],
  [0.5,0.85]
];

fielders.forEach(([fx,fy])=>{
  ctx.fillStyle = "#38bdf8";

  ctx.beginPath();
  ctx.arc(
    leftWidth*fx,
    height*fy,
    10,
    0,
    Math.PI*2
  );
  ctx.fill();
});
  // =========================
  // STAR SPORTS CENTER
  // =========================

  const centerX = leftWidth;

  const starGrad = ctx.createLinearGradient(
    centerX,
    0,
    centerX,
    height
  );

  starGrad.addColorStop(0, "#0a0f24");
  starGrad.addColorStop(0.5, "#1e3a8a");
  starGrad.addColorStop(1, "#020617");

  ctx.fillStyle = starGrad;

  ctx.fillRect(
    centerX,
    0,
    centerWidth,
    height
  );

  ctx.strokeStyle = "rgba(56,189,248,0.15)";

  for (let x = centerX; x < centerX + centerWidth; x += 80) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }

  const colors = [
    "#0ea5e9",
    "#ef4444",
    "#f59e0b",
    "#10b981",
  ];

  colors.forEach((color, i) => {
    ctx.beginPath();
    ctx.lineWidth = 12;
    ctx.strokeStyle = color;

    ctx.moveTo(centerX + 100, height - 200);

    ctx.bezierCurveTo(
      centerX + 250,
      200,
      centerX + 600,
      600,
      centerX + centerWidth - 100,
      150 + i * 25
    );

    ctx.stroke();
  });

  const cx = centerX + centerWidth / 2;
  const cy = height / 2 - 80;

  ctx.fillStyle = "#FFD700";

  ctx.beginPath();

  for (let i = 0; i < 10; i++) {
    const angle = (Math.PI / 5) * i - Math.PI / 2;
    const r = i % 2 === 0 ? 100 : 40;

    const x = cx + Math.cos(angle) * r;
    const y = cy + Math.sin(angle) * r;

    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }

  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "white";
  ctx.textAlign = "center";
  ctx.font = "bold 80px Arial";

  ctx.fillText(
    "STAR SPORTS",
    cx,
    height * 0.72
  );

  ctx.fillStyle = "#FFD700";
  ctx.font = "40px Arial";

  ctx.fillText(
    "CRICKET LIVE & ANALYSIS",
    cx,
    height * 0.82
  );

  // =========================
  // FOOTBALL PANEL
  // =========================
// =========================
// FOOTBALL PANEL
// =========================

const footballX = leftWidth + centerWidth;

const footballGrad = ctx.createLinearGradient(
  footballX,
  0,
  footballX,
  height
);

footballGrad.addColorStop(0, "#0f172a");
footballGrad.addColorStop(1, "#0c1e43");

ctx.fillStyle = footballGrad;

ctx.fillRect(
  footballX,
  0,
  rightWidth,
  height
);

// Pitch

const px = footballX + 40;
const py = 140;
const pw = rightWidth - 80;
const ph = 500;

ctx.strokeStyle = "rgba(255,255,255,0.8)";
ctx.lineWidth = 3;

ctx.strokeRect(px, py, pw, ph);

// Half Line

ctx.beginPath();
ctx.moveTo(px + pw/2, py);
ctx.lineTo(px + pw/2, py + ph);
ctx.stroke();

// Center Circle

ctx.beginPath();
ctx.arc(
  px + pw/2,
  py + ph/2,
  55,
  0,
  Math.PI * 2
);
ctx.stroke();

// Team A (Red)

const redPlayers = [
  [0.18,0.15],
  [0.22,0.35],
  [0.18,0.55],
  [0.28,0.75],
  [0.35,0.22],
  [0.38,0.48],
  [0.32,0.82]
];

redPlayers.forEach(([x,y])=>{
  ctx.fillStyle = "#ef4444";

  ctx.beginPath();
  ctx.arc(
    px + pw*x,
    py + ph*y,
    10,
    0,
    Math.PI*2
  );
  ctx.fill();
});

// Team B (Blue)

const bluePlayers = [
  [0.82,0.15],
  [0.78,0.35],
  [0.82,0.55],
  [0.72,0.75],
  [0.65,0.22],
  [0.62,0.48],
  [0.68,0.82]
];

bluePlayers.forEach(([x,y])=>{
  ctx.fillStyle = "#3b82f6";

  ctx.beginPath();
  ctx.arc(
    px + pw*x,
    py + ph*y,
    10,
    0,
    Math.PI*2
  );
  ctx.fill();
});

// Ball

ctx.fillStyle = "#ffffff";

ctx.beginPath();
ctx.arc(
  px + pw*0.52,
  py + ph*0.45,
  6,
  0,
  Math.PI*2
);
ctx.fill();

  return new THREE.CanvasTexture(canvas);
};
/**
 * PREMIUM BROADCAST STUDIO ENVIRONMENT
 */
function ProfessionalStudio({ sport }: { sport: "cricket" | "football" }) {
  const theme = SPORT_THEMES[sport];
  const sportsWallTexture = useMemo(
  () => createSportsWallTexture(4096, 1024),
  []
);
const starSportsTexture = useMemo(
  () => createStarSportsTexture(2048, 1024),
  []
);

  return (
    <group>
      {/* Glossy Broadcast Floor with Reflection */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[100, 100]} />
        <MeshReflectorMaterial
          blur={[300, 100]}
          resolution={1024}
          mixBlur={1}
          mixStrength={60}
          roughness={1}
          depthScale={1.2}
          minDepthThreshold={0.4}
          maxDepthThreshold={1.4}
          color="#0a0a0a"
          metalness={0.8}
        />
      </mesh>

      {/* Main Curved LED Video Wall (Central Background) */}
     <group position={[0, 4.5, -10]}>

  <mesh>
    <cylinderGeometry
      args={[
        18,
        18,
        10,
        128,
        1,
        true,
        Math.PI * 1.3,
        -Math.PI * 0.6
      ]}
    />

    <meshStandardMaterial
      map={sportsWallTexture}
      emissive="#000000"
      emissiveIntensity={0.4}
      side={THREE.DoubleSide}
    />
  </mesh>

</group>

    
    {/* ========================================= */}
{/* STAR SPORTS CURVED DISCUSSION DESK */}
{/* ========================================= */}

<group position={[0, 0, 2]}>

  {/* DESK BODY SEGMENTS */}

  {[...Array(24)].map((_, i) => {

  const deskRadius = 5.5;
  const deskCenterZ = 4.3;
  const deskSweepAngle = 1.2;

  const t = i / 23;

  const angle =
    -deskSweepAngle / 2 +
    t * deskSweepAngle;

  const x =
    Math.sin(angle) *
    deskRadius;

  const z =
    deskCenterZ -
    Math.cos(angle) *
    deskRadius;

  return (
    <group
      key={i}
      position={[x, 0, z]}
      rotation={[0, angle, 0]}
    >

      {/* Main Desk Segment */}

      <mesh position={[0, 0.42, 0]}>
        <boxGeometry args={[1.15, 0.85, 0.7]} />
        <meshStandardMaterial
          color="#311b0b"
          roughness={0.22}
          metalness={0.12}
        />
      </mesh>

      {/* Upper LED */}

      <mesh position={[0, 0.72, 0.36]}>
        <boxGeometry args={[1.16, 0.04, 0.04]} />
        <meshBasicMaterial color="#00f0ff" />
      </mesh>

      {/* Lower LED */}

      <mesh position={[0, 0.58, 0.36]}>
        <boxGeometry args={[1.16, 0.04, 0.04]} />
        <meshBasicMaterial color="#00f0ff" />
      </mesh>

    </group>
  );
})}

  {/* CONTINUOUS GLASS TOP */}

  <mesh
    position={[0, 0.92, -0.05]}
    rotation={[0, Math.PI, 0]}
  >
    <cylinderGeometry
      args={[
        5.55,
        5.55,
        0.08,
        128,
        1,
        true,
        Math.PI * 0.2,
        Math.PI * 0.6
      ]}
    />

    <meshPhysicalMaterial
      color="#082f49"
      transparent
      opacity={0.65}
      roughness={0.03}
      metalness={0.95}
      transmission={1}
      thickness={0.6}
      side={THREE.DoubleSide}
    />
  </mesh>

  {/* STAR SPORTS LOGO */}

  <group position={[0, 0.55, 0.8]}
   >

    <mesh >
      <planeGeometry args={[2.8, 1.2]} />
      <meshBasicMaterial
        map={starSportsTexture}
        transparent
      />
    </mesh>

  </group>

</group>

{/* ========================================= */}
{/* FLOOR PLATFORM */}
{/* ========================================= */}

<group>

  <mesh
    rotation={[-Math.PI / 2, 0, 0]}
    position={[0, 0.01, 2]}
  >
    <circleGeometry args={[8, 128]} />
    <meshStandardMaterial
      color="#101010"
      roughness={0.8}
      metalness={0.4}
    />
  </mesh>

  <mesh
    rotation={[-Math.PI / 2, 0, 0]}
    position={[0, 0.02, 2]}
  >
    <ringGeometry args={[7.8, 8, 128]} />
    <meshBasicMaterial
      color="#00f0ff"
    />
  </mesh>

</group>

{/* ========================================= */}
{/* ARCHITECTURAL PILLARS */}
{/* ========================================= */}

<group position={[-14, 5, -8]}>
  <mesh castShadow>
    <boxGeometry args={[1, 10, 2]} />
    <meshStandardMaterial color="#111111" />
  </mesh>
</group>

<group position={[14, 5, -8]}>
  <mesh castShadow>
    <boxGeometry args={[1, 10, 2]} />
    <meshStandardMaterial color="#111111" />
  </mesh>
</group>

{/* ========================================= */}
{/* STUDIO LIGHTING */}
{/* ========================================= */}

<ambientLight intensity={0.35} />

<spotLight
  position={[-6, 8, 4]}
  angle={0.55}
  penumbra={1}
  intensity={3}
  castShadow
  color="#ffffff"
/>

<spotLight
  position={[6, 8, 4]}
  angle={0.55}
  penumbra={1}
  intensity={3}
  castShadow
  color="#ffffff"
/>

<spotLight
  position={[0, 9, 2]}
  angle={0.45}
  penumbra={1}
  intensity={4}
  castShadow
  color="#feffff"
/>

<rectAreaLight
  position={[0, 3.2, 2]}
  rotation={[-Math.PI / 2, 0, 0]}
  width={8}
  height={2}
  intensity={8}
  color="#ffffff"
/>

<rectAreaLight
  position={[0, 4, -9.5]}
  width={12}
  height={6}
  intensity={6}
  color={theme.primary}
/></group>
  );
}

/**
 * REALISTIC PRESENTER AVATAR (Redesigned for Seated Broadcast Look)
 */
function RealisticPresenter({ 
  suitColor, shirtColor, hairColor, isSpeaking, targetPos, role 
}: { 
  suitColor: string; shirtColor: string; hairColor: string; 
  isSpeaking: boolean; targetPos: { x: number; z: number }; role: string;
}) {
  const group = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const jaw = useRef<THREE.Mesh>(null);
  const lArm = useRef<THREE.Group>(null);
  const rArm = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!group.current) return;
    group.current.position.x = THREE.MathUtils.lerp(group.current.position.x, targetPos.x, 0.05);
    group.current.position.z = THREE.MathUtils.lerp(group.current.position.z, targetPos.z, 0.05);
    
    // Seated Height Adjustment
    group.current.position.y = role === "anchor" ? 0.1 : 0.05;

    if (head.current) {
      if (isSpeaking) {
        head.current.rotation.y = Math.sin(state.clock.elapsedTime * 2.5) * 0.15;
        head.current.rotation.x = Math.sin(state.clock.elapsedTime * 4) * 0.05;
        if (jaw.current) jaw.current.position.y = -0.08 - Math.abs(Math.sin(state.clock.elapsedTime * 12)) * 0.03;
      } else {
        // Naturally look towards the "center" of the studio
        head.current.rotation.y = THREE.MathUtils.lerp(head.current.rotation.y, role === "anchor" ? 0.5 : -0.5, 0.02);
        if (jaw.current) jaw.current.position.y = -0.08;
      }
    }

    if (lArm.current && rArm.current) {
      const gesture = isSpeaking ? Math.sin(state.clock.elapsedTime * 3) * 0.2 : 0;
      lArm.current.rotation.x = -0.6 + gesture;
      rArm.current.rotation.x = -0.6 + (isSpeaking ? Math.cos(state.clock.elapsedTime * 2) * 0.2 : 0);
    }
  });

  return (
  <group ref={group}>

    {/* PROFESSIONAL ERGONOMIC CHAIR */}
    <group position={[0, 0.38, -0.15]}>

      {/* Chrome Lift */}
      <mesh position={[0, -0.25, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 0.35, 24]} />
        <meshStandardMaterial
          color="#cbd5e1"
          metalness={1}
          roughness={0.15}
        />
      </mesh>

      {/* Five Star Base */}
      {[0,1,2,3,4].map((_,i)=>{
        const a = (i/5) * Math.PI * 2;

        return (
          <group key={i} rotation={[0,a,0]}>
            <mesh position={[0,-0.42,0.22]}>
              <boxGeometry args={[0.04,0.03,0.42]} />
              <meshStandardMaterial
                color="#94a3b8"
                metalness={1}
              />
            </mesh>

            <mesh position={[0,-0.42,0.42]}>
              <sphereGeometry args={[0.05,16,16]} />
              <meshStandardMaterial color="#18181b" />
            </mesh>
          </group>
        );
      })}

      {/* Seat */}
      <mesh position={[0,0.05,0]}>
        <boxGeometry args={[0.65,0.12,0.6]} />
        <meshStandardMaterial
          color="#111827"
          roughness={0.9}
        />
      </mesh>

      {/* Back Rest */}
      <mesh position={[0,0.45,-0.22]}>
        <boxGeometry args={[0.55,0.8,0.08]} />
        <meshStandardMaterial
          color="#111827"
          roughness={0.9}
        />
      </mesh>

      {/* Chrome Spine */}
      <mesh position={[0,0.15,-0.18]}>
        <boxGeometry args={[0.05,0.7,0.05]} />
        <meshStandardMaterial
          color="#94a3b8"
          metalness={1}
        />
      </mesh>

      {/* Armrests */}
      <mesh position={[-0.35,0.15,0]}>
        <boxGeometry args={[0.08,0.04,0.35]} />
        <meshStandardMaterial color="#111827" />
      </mesh>

      <mesh position={[0.35,0.15,0]}>
        <boxGeometry args={[0.08,0.04,0.35]} />
        <meshStandardMaterial color="#111827" />
      </mesh>

    </group>

    {/* BODY */}

    <group position={[0,0.95,0]}>

      {/* Suit */}
      <mesh castShadow>
        <boxGeometry args={[0.48,0.62,0.26]} />
        <meshStandardMaterial
          color={suitColor}
          roughness={0.55}
        />
      </mesh>

      {/* Shirt */}
      <mesh position={[0,0.02,0.135]}>
        <boxGeometry args={[0.16,0.46,0.02]} />
        <meshStandardMaterial color={shirtColor}/>
      </mesh>

      {/* Tie */}
      <mesh position={[0,-0.02,0.145]}>
        <boxGeometry args={[0.04,0.3,0.01]} />
        <meshStandardMaterial color="#0ea5e9"/>
      </mesh>

    </group>

    {/* HEAD */}

    <group ref={head} position={[0,1.45,0]}>

      {/* Neck */}
      <mesh position={[0,-0.12,0]}>
        <cylinderGeometry args={[0.05,0.06,0.12,16]} />
        <meshStandardMaterial color="#f5c6a5" />
      </mesh>

      {/* Face */}
      <mesh castShadow>
        <sphereGeometry args={[0.15,32,32]} />
        <meshStandardMaterial
          color="#f5c6a5"
          roughness={0.8}
        />
      </mesh>

      {/* Nose */}
      <mesh position={[0,0,0.14]}>
        <boxGeometry args={[0.025,0.04,0.03]} />
        <meshStandardMaterial color="#f5c6a5" />
      </mesh>

      {/* Hair Cap */}
      <mesh position={[0,0.08,-0.02]}>
        <sphereGeometry
          args={[
            0.16,
            32,
            32,
            0,
            Math.PI*2,
            0,
            Math.PI*0.6
          ]}
        />
        <meshStandardMaterial color={hairColor}/>
      </mesh>

      {/* Curly Hair */}
      {[...Array(8)].map((_,i)=>(
        <mesh
          key={i}
          position={[
            Math.sin(i)*0.11,
            0.03,
            Math.cos(i)*0.03
          ]}
        >
          <sphereGeometry args={[0.04,8,8]} />
          <meshStandardMaterial color={hairColor}/>
        </mesh>
      ))}

      {/* Jaw */}
      <mesh
        ref={jaw}
        position={[0,-0.08,0.1]}
      >
        <boxGeometry args={[0.08,0.025,0.05]} />
        <meshStandardMaterial color="#f5c6a5"/>
      </mesh>

    </group>

    {/* LEFT ARM */}

    <group
      ref={lArm}
      position={[-0.28,1.05,0.08]}
    >
      {/* <mesh rotation={[0,0,0.4]}>
        <capsuleGeometry args={[0.05,0.22,4,8]} />
        <meshStandardMaterial color={suitColor}/>
      </mesh> */}

      <mesh
        position={[-0.02,-0.12,0.12]}
        rotation={[-1.2,0,0]}
      >
        <capsuleGeometry args={[0.045,0.28,4,8]} />
        <meshStandardMaterial color={suitColor}/>
      </mesh>
    </group>

    {/* RIGHT ARM */}

    <group
      ref={rArm}
      position={[0.28,1.05,0.08]}
    >
      {/* <mesh rotation={[0,0,-0.4]}>
        <capsuleGeometry args={[0.05,0.22,4,8]} />
        <meshStandardMaterial color={suitColor}/>
      </mesh> */}

      <mesh
        position={[0.02,-0.12,0.12]}
        rotation={[-1.2,0,0]}
      >
        <capsuleGeometry args={[0.045,0.28,4,8]} />
        <meshStandardMaterial color={suitColor}/>
      </mesh>
    </group>

  </group>
);
}

/**
 * DYNAMIC BROADCAST CAMERA (Preserved Logic, Adjusted Framing)
 */
function CinematicCamera({ activeSpeaker }: { activeSpeaker: number | null }) {
  const { camera } = useThree();

  const defaultPos = new THREE.Vector3(0, 4, 10); // higher + safer
  const defaultLook = new THREE.Vector3(0, 1.5, 0);

  // ✅ IMPORTANT: set initial camera position ONCE
  useEffect(() => {
    camera.position.copy(defaultPos);
    camera.lookAt(defaultLook);
  }, [camera]);

  useFrame((state) => {
    const targetPos = new THREE.Vector3(0, 4, 10);
    const targetLook = new THREE.Vector3(0, 1.5, 0);

    if (activeSpeaker !== null) {
      const speaker = SPEAKER_POSITIONS.find(s => s.id === activeSpeaker);

      if (speaker) {
        // tighter broadcast framing
        targetPos.set(speaker.targetX * 0.8, 2.8, 6);
        targetLook.set(speaker.targetX, 1.5, speaker.z);
      }
    } else {
      // slow cinematic studio orbit
      targetPos.x = Math.sin(state.clock.elapsedTime * 0.1) * 3;
    }

    camera.position.lerp(targetPos, 0.04);
    camera.lookAt(targetLook);
  });

  return <PerspectiveCamera makeDefault fov={35} />;
}

export default function SportsCenterDashboard({ onExit }: SportsCenterDashboardProps) {
  const [sport, setSport] = useState<"cricket" | "football" | null>(null);
  const [language, setLanguage] = useState<"en" | "ta">("en");
  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [broadcastSegments, setBroadcastSegments] = useState<BroadcastSegment[]>([]);
  const [activeSpeaker, setActiveSpeaker] = useState<number | null>(null);
  const [isLoadingStudio, setIsLoadingStudio] = useState(false);
  useEffect(() => {
    if (!sport) return;
    (async () => {
      try {
        const endpoint = sport === "cricket" ? "/api/sports/cricket" : "/api/sports/football";
        const res = await axios.get(`http://localhost:8000${endpoint}`);
        if (res.data.success) setMatches(res.data.matches);
      } catch (err) { console.error("Failed to fetch matches:", err); }
    })();
  }, [sport]);

  const handleMatchSelect = async (matchIndex: number) => {
    const match = matches[matchIndex];

setIsLoadingStudio(true);

setTimeout(() => {
  setSelectedMatch(match);
  setIsLoadingStudio(false);
}, 2000);
    try {
      const res = await axios.post("http://localhost:8000/api/sports/broadcast", {
        choice: sport === "cricket" ? "1" : "2",
        language: language === "ta" ? "2" : "1",
        match_index: matchIndex
      });
      if (res.data.success) {
        setBroadcastSegments(res.data.broadcast);
      }
    } catch (err) { console.error("Failed to get broadcast:", err); }
  };

  useEffect(() => {
    if (broadcastSegments.length === 0) return;
    let index = 0;
    const speakNext = () => {
      if (index >= broadcastSegments.length) {
  setActiveSpeaker(null);

  setTimeout(() => {
    setSelectedMatch(null);
    setBroadcastSegments([]);
    setMatches([]);
    setSport(null);              // Return to main menu
    window.speechSynthesis.cancel();
  }, 5000);

  return;
}
      const segment = broadcastSegments[index];
      if (segment) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(segment.text);
        utterance.lang = language === "ta" ? "ta-IN" : "en-US";
        const speakerMap: Record<string, number> = { "Anchor": 3, "Tactical Analyst": 5, "Field Expert": 2, "Data Analyst": 4, "Fan Voice": 1 };
        const speakerId = speakerMap[segment.speaker] || 3;
        utterance.onstart = () => setActiveSpeaker(speakerId);
        utterance.onend = () => { setTimeout(() => { index++; speakNext(); }, 1200); };
        window.speechSynthesis.speak(utterance);
      }
    };
    speakNext();
    return () => { window.speechSynthesis.cancel(); setActiveSpeaker(null); };
  }, [broadcastSegments, language]);

  if (!sport) {
   return (
  <div className="w-full min-h-screen bg-[#030712] flex flex-col items-center px-4 py-6 relative overflow-x-hidden">

    {/* Back Button */}
    <button
      onClick={onExit}
      className="absolute top-3 left-3 sm:top-4 sm:left-4 bg-slate-900/80 hover:bg-slate-800 px-3 sm:px-4 py-2 rounded-lg border border-slate-700 transition-all text-sm sm:text-base z-50"
    >
      ← Back
    </button>

    {/* Header */}
    <div className="text-center space-y-4 mt-16 sm:mt-20 mb-10 sm:mb-12 max-w-2xl">
      
      <div className="inline-block px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-bold tracking-widest uppercase">
        Broadcast Portal
      </div>

      <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tighter">
        SPORTS<span className="text-emerald-500">CENTER</span>
      </h1>
    </div>

    {/* Grid */}
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 max-w-4xl w-full">

      {/* Cricket */}
      <button
        onClick={() => setSport("cricket")}
        className="group relative overflow-hidden bg-slate-900 border border-slate-800 hover:border-emerald-500 p-6 sm:p-10 rounded-3xl transition-all text-left"
      >
        <div className="relative z-10">
          <span className="text-4xl sm:text-6xl mb-4 sm:mb-6 block">🏏</span>
          <h2 className="text-xl sm:text-3xl font-bold">Cricket</h2>
          <p className="text-slate-400 mt-2 text-sm sm:text-base">
            Live Analysis & Commentary
          </p>
        </div>

        <div className="absolute top-0 right-0 w-24 sm:w-32 h-24 sm:h-32 bg-emerald-500/10 blur-3xl group-hover:bg-emerald-500/20 transition-all" />
      </button>

      {/* Football */}
      <button
        onClick={() => setSport("football")}
        className="group relative overflow-hidden bg-slate-900 border border-slate-800 hover:border-amber-500 p-6 sm:p-10 rounded-3xl transition-all text-left"
      >
        <div className="relative z-10">
          <span className="text-4xl sm:text-6xl mb-4 sm:mb-6 block">⚽</span>
          <h2 className="text-xl sm:text-3xl font-bold">Football</h2>
          <p className="text-slate-400 mt-2 text-sm sm:text-base">
            World Cup Coverage
          </p>
        </div>

        <div className="absolute top-0 right-0 w-24 sm:w-32 h-24 sm:h-32 bg-amber-500/10 blur-3xl group-hover:bg-amber-500/20 transition-all" />
      </button>

    </div>
  </div>
);
  }

  if (isLoadingStudio) {
return (
  <div className="w-full min-h-screen bg-[#020617] flex items-center justify-center overflow-hidden px-4">

    {/* Background */}
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#0f172a,#000)]" />

    {/* Content */}
    <div className="relative z-10 text-center w-full max-w-md">

      {/* Icon */}
      <div className="text-5xl sm:text-6xl md:text-7xl mb-4 sm:mb-6">
        📡
      </div>

      {/* Title */}
      <h1 className="text-white text-3xl sm:text-5xl md:text-6xl font-black leading-tight">
        SPORTS
        <span className="text-emerald-500">CENTER</span>
      </h1>

      {/* Subtitle */}
      <p className="text-emerald-400 mt-4 sm:mt-6 tracking-[0.25em] sm:tracking-[0.4em] uppercase animate-pulse text-xs sm:text-sm md:text-base">
        Connecting To Studio
      </p>

      {/* Progress Bar */}
      <div className="mt-6 sm:mt-8 w-full max-w-xs sm:max-w-sm md:w-80 h-2 bg-white/10 rounded-full overflow-hidden mx-auto">
        <div className="h-full bg-emerald-500 animate-pulse w-full" />
      </div>

    </div>
  </div>
);
}

if (!selectedMatch) {
  return (
  <div className="w-full min-h-screen overflow-x-hidden bg-[#020617] text-white px-4 py-6 sm:p-8">

    {/* Back Button */}
    <button
      onClick={() => {
        setSport(null);
        setMatches([]);
      }}
      className="mb-6 sm:mb-8 bg-white/5 hover:bg-white/10 backdrop-blur-xl px-4 sm:px-5 py-2 rounded-full border border-white/10 text-sm sm:text-base"
    >
      ← Back to Menu
    </button>

    {/* Header */}
    <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 mb-6 sm:mb-8">

      {/* Title */}
      <div>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-black uppercase">
          {sport} Central
        </h2>

        <p className="text-slate-500 text-sm sm:text-base">
          Select a live feed to enter the studio
        </p>
      </div>

      {/* Language Switch */}
      <div className="flex gap-2 p-1 bg-white/5 rounded-xl w-fit">
        {["en", "ta"].map((l) => (
          <button
            key={l}
            onClick={() => setLanguage(l as "en" | "ta")}
            className={`px-4 sm:px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition ${
              language === l
                ? "bg-emerald-500 text-black"
                : "text-slate-400"
            }`}
          >
            {l === "en" ? "English" : "Tamil"}
          </button>
        ))}
      </div>
    </div>

    {/* Match Grid */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">

      {matches.map((match, idx) => (
        <button
          key={match.id}
          onClick={() => handleMatchSelect(idx)}
          className="bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-6 text-left hover:bg-white/10 hover:border-emerald-500/50 transition-all"
        >
          <div className="text-[10px] text-emerald-500 font-black uppercase tracking-widest mb-2">
            {match.competition}
          </div>

          <div className="text-lg sm:text-xl font-bold">
            {match.homeTeam}
          </div>

          <div className="text-center text-slate-500 py-2 text-sm sm:text-base">
            VS
          </div>

          <div className="text-lg sm:text-xl font-bold">
            {match.awayTeam}
          </div>

          <div className="flex justify-between items-center mt-4 sm:mt-6">
            <span className="text-[10px] sm:text-xs bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded">
              {match.status}
            </span>

            <span className="font-mono text-sm sm:text-base">
              {match.score}
            </span>
          </div>
        </button>
      ))}

    </div>
  </div>
);
}

return (
  <div className="w-full min-h-screen bg-black relative overflow-hidden font-sans">

    {/* Safe area wrapper for mobile */}
    <div className="absolute inset-0 flex flex-col">

      {/* ================= HUD TOP ================= */}
      <div className="absolute top-0 left-0 w-full p-3 sm:p-6 md:p-8 flex justify-between items-start z-50 pointer-events-none">

        <button
          onClick={() => {
            setSelectedMatch(null);
            setBroadcastSegments([]);
            window.speechSynthesis.cancel();
          }}
          className="pointer-events-auto bg-white/5 backdrop-blur-2xl border border-white/10 text-white px-3 sm:px-5 md:px-6 py-2 rounded-full text-[10px] sm:text-xs font-black tracking-widest hover:bg-emerald-500 hover:text-black transition-all"
        >
          DISCONNECT FEED
        </button>

      </div>

      {/* ================= 3D SCENE WRAPPER ================= */}
      <div className="flex-1 w-full h-full">
        <Canvas shadows dpr={[1, 2]}>
          <Environment preset="night" />
          <CinematicCamera activeSpeaker={activeSpeaker} />

          <ProfessionalStudio sport={sport} />

          {SPEAKER_POSITIONS.map((p, i) => (
            <group
              key={i}
              position={[p.targetX, 0, p.z]}
              rotation={[0, p.angle, 0]}
            >
              <RealisticPresenter
                suitColor={p.suit}
                shirtColor={p.shirt}
                hairColor={p.hair}
                role={p.role}
                isSpeaking={activeSpeaker === p.id}
                targetPos={{
                  x: p.targetX,
                  z: p.z
                }}
              />
            </group>
          ))}

          <ContactShadows opacity={0.6} scale={30} blur={2} far={10} />
        </Canvas>
      </div>

      {/* ================= SPEAKER NAME ================= */}
      {activeSpeaker && (
        <div className="absolute bottom-16 sm:bottom-20 md:bottom-24 left-1/2 -translate-x-1/2 z-50 px-2">
          <div className="bg-black/80 backdrop-blur-xl px-4 sm:px-6 md:px-8 py-2 sm:py-3 rounded-full border border-emerald-500 shadow-2xl">
            <div className="text-emerald-400 text-[10px] sm:text-sm font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] text-center">
              {SPEAKER_POSITIONS.find(s => s.id === activeSpeaker)?.name || "SPEAKER"}
            </div>
          </div>
        </div>
      )}

      {/* ================= TICKER ================= */}
    <div className="absolute bottom-0 left-0 w-full bg-emerald-600 h-8 sm:h-10 flex items-center overflow-hidden z-50 border-t border-emerald-400/30 pb-[env(safe-area-inset-bottom)]">

  {/* BREAKING LABEL */}
  <div className="bg-black h-full px-2 sm:px-6 flex items-center z-10 shrink-0">
    <span className="text-white font-black italic tracking-tighter text-[10px] sm:text-sm">
      BREAKING
    </span>
  </div>

  {/* MARQUEE */}
  <div className="flex-1 overflow-hidden whitespace-nowrap">

    <div className="inline-flex animate-marquee text-black font-black items-center">

      {/* 🔥 MOBILE SHORT VERSION */}
      <span className="sm:hidden mx-4 uppercase text-[10px] leading-none">
        {(selectedMatch?.homeTeam ?? "HOME")} vs {(selectedMatch?.awayTeam ?? "AWAY")} •
        LIVE • {language === "en" ? "EN" : "TA"} • AI ANALYSIS
      </span>

      {/* 💻 DESKTOP FULL VERSION */}
      <span className="hidden sm:flex mx-20 uppercase gap-4 text-sm leading-none">
        {(selectedMatch?.competition ?? "LIVE")} •
        LIVE IN {(language === "en" ? "ENGLISH" : "TAMIL")} •
        {(selectedMatch?.homeTeam ?? "HOME")} VS {(selectedMatch?.awayTeam ?? "AWAY")} •
        AI ANALYSIS IN PROGRESS •
      </span>

    </div>

  </div>

</div>

    </div>

  </div>
);
}
