"use client";

import React, { useState } from "react";
import Studio from "../components/RealAvatar";
import TVNewsStudio from "../components/TVNewsStudio";
import type { NewsSegment } from "../components/TVNewsStudio";
import SportsCenterDashboard from "../components/SportsCenterDashboard";

export default function Home() {
  // State to track which studio channel or sub-view is active
  const [activeChannel, setActiveChannel] = useState<"hub" | "debate" | "news-selector" | "news-live" | "sports">("hub");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [newsTimeline, setNewsTimeline] = useState<NewsSegment[]>([]);
  const [loadingNews, setLoadingNews] = useState<boolean>(false);

  // --- CONTROLLER: FETCH LIVE NEWS FEED FROM BACKEND ---
  const handleLaunchNewsBroadcast = async (category: string) => {
    setLoadingNews(true);
    setSelectedCategory(category);
    try {
      const res = await fetch("https://debate-system.onrender.com/api/studio/process-news", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category })
      });
      const data = await res.json();
      
      if (data.success && data.broadcast_timeline && data.broadcast_timeline.length > 0) {
        setNewsTimeline(data.broadcast_timeline);
        setActiveChannel("news-live"); // Pivot to full 3D viewport once data arrives
      } else {
        alert("Failed to compile news feed timeline.");
      }
    } catch (err) {
      console.error("Failed connecting to satellite backend production feed:", err);
      alert("Backend feed connection failed. Please verify your FastAPI server loop is active.");
    } finally {
      setLoadingNews(false);
    }
  };

  // ==========================================================
  // VIEW 1: IF USER SELECTS DEBATE ARENA
  // ==========================================================
  if (activeChannel === "debate") {
    return (
      <div className="relative w-screen h-screen">
        <button 
          onClick={() => setActiveChannel("hub")}
          className="absolute top-4 left-4 z-50 bg-slate-900/80 hover:bg-slate-800 text-white font-bold px-4 py-2 rounded-lg border border-slate-700 backdrop-blur transition"
        >
          ⬅️ Back to Main Hub
        </button>
        <Studio />
      </div>
    );
  }
  // 2. WEATHER SHOW
  

  // ==========================================================
  // VIEW 2: SUB-MENU NEWS CATEGORY FEED SELECTOR SCREEN
  // ==========================================================
  if (activeChannel === "news-selector") {
    return (
      <div className="w-screen h-screen bg-[#030712] flex flex-col items-center justify-center text-white p-6 font-sans select-none relative">
        {/* Decorative Grid Network Background Element */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-40 pointer-events-none" />

        <button 
          onClick={() => setActiveChannel("hub")}
          className="absolute top-4 left-4 z-50 bg-slate-900/80 hover:bg-slate-800 text-white font-bold px-4 py-2 rounded-lg border border-slate-700 backdrop-blur transition"
        >
          ⬅️ Back to Main Hub
        </button>

        <div className="text-center mb-12 z-10">
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-red-500 via-amber-500 to-yellow-400 mb-3">
            SNAPPYTIMES NEWS BUREAU
          </h1>
          <p className="text-slate-400 font-semibold tracking-wide text-sm md:text-base">
            SELECT A DEPLOYED SATELLITE FEED TO INITIALIZE LIVE 3D ANCHOR TRANSMISSION
          </p>
        </div>

        {/* Grid Selection Menu */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 w-full max-w-5xl z-10">
          {[
            { id: "tamil-nadu", label: "தமிழ்நாடு", icon: "🏛️", desc: "Regional Bulletins" },
            { id: "india", label: "இந்தியா", icon: "🇮🇳", desc: "National Desktop" },
            { id: "global", label: "உலகச் செய்திகள்", icon: "🌐", desc: "International Bureau" },
            { id: "sports", label: "விளையாட்டு", icon: "🏏", desc: "Live Sports Wire" },
            { id: "tech", label: "தொழில்நுட்பம்", icon: "🚀", desc: "Advanced AI & Tech" }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => handleLaunchNewsBroadcast(item.id)}
              disabled={loadingNews}
              className="bg-slate-900/80 border border-slate-800 hover:border-red-500/60 p-6 rounded-2xl flex flex-col items-center text-center justify-between group transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(239,68,68,0.1)] active:scale-95 disabled:opacity-50"
            >
              <span className="text-3xl mb-3 block group-hover:scale-110 transition-transform">{item.icon}</span>
              <div>
                <h3 className="font-bold text-base text-slate-100 group-hover:text-red-400 transition-colors">{item.label}</h3>
                <p className="text-[10px] text-slate-500 font-medium mt-1 uppercase tracking-wider">{item.desc}</p>
              </div>
            </button>
          ))}
        </div>

        {/* LOADING SCREEN OVERLAY LINKED VIA SATELLITE LOOP */}
        {loadingNews && (
          <div className="absolute inset-0 bg-[#020617]/95 backdrop-blur-md flex flex-col items-center justify-center z-50">
            <div className="w-14 h-14 border-4 border-t-red-500 border-slate-800 rounded-full animate-spin mb-4" />
            <div className="text-xs font-bold tracking-widest text-red-500 uppercase animate-pulse">
              Establishing Satellite Uplink // Generating Script Bulletins...
            </div>
          </div>
        )}
      </div>
    );
  }

  // ==========================================================
  // VIEW 3: LIVE RE-CONFIGURED 3D ENVIRONMENT CHANNEL STAGE VIEW
  // ==========================================================
  if (activeChannel === "news-live") {
    return (
      <div className="w-screen h-screen relative">
        <TVNewsStudio 
          initialTimeline={newsTimeline} 
          category={selectedCategory} 
          onExit={() => {
            setNewsTimeline([]);
            setActiveChannel("news-selector");
          }} 
        />
      </div>
    );
  }

  // ==========================================================
  // VIEW 4: AI SPORTS CENTER DASHBOARD
  // ==========================================================
  if (activeChannel === "sports") {
    return (
      <SportsCenterDashboard onExit={() => setActiveChannel("hub")} />
    );
  }

  // ==========================================================
  // VIEW 4: DEFAULT PORTAL LANDING HUB (CHANNEL SELECTOR)
  // ==========================================================
  return (
    <div className="w-screen h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-6 font-sans selection:bg-cyan-500/30">
      
      {/* Header Section */}
      <div className="text-center mb-12 max-w-xl animate-fade-in">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500 mb-4">
          ProjectVerse Media Engine
        </h1>
        <p className="text-slate-400 text-lg font-medium">
          Select a 3D AI production transmission channel to begin broadcasting.
        </p>
      </div>

      {/* Grid Container for Selection Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl">
        
        {/* Card 1: 3D Debate Arena */}
        <div 
          onClick={() => setActiveChannel("debate")}
          className="group cursor-pointer bg-slate-900 border border-slate-800 hover:border-cyan-500/50 p-8 rounded-2xl shadow-2xl flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-cyan-950/20"
        >
          <div>
            <div className="text-4xl mb-4 p-3 bg-cyan-950/40 border border-cyan-800/30 w-fit rounded-xl group-hover:scale-110 transition-transform">
              🎙️
            </div>
            <h2 className="text-2xl font-bold mb-2 group-hover:text-cyan-400 transition-colors">
              3D Debate Arena
            </h2>
            <p className="text-slate-400 leading-relaxed text-sm">
              Launch a multi-agent analytical discussion simulation panel. Powered by local MERN databases and Gemini agents executing real-time counter-arguments.
            </p>
          </div>
          <div className="mt-6 flex items-center text-cyan-400 font-semibold text-sm group-hover:translate-x-2 transition-transform">
            Enter Arena <span className="ml-2">→</span>
          </div>
        </div>

        {/* Card 2: AI TV News Studio */}
        <div 
          onClick={() => setActiveChannel("news-selector")}
          className="group cursor-pointer bg-slate-900 border border-slate-800 hover:border-blue-500/50 p-8 rounded-2xl shadow-2xl flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-blue-950/20"
        >
          <div>
            <div className="text-4xl mb-4 p-3 bg-blue-950/40 border border-blue-800/30 w-fit rounded-xl group-hover:scale-110 transition-transform">
              📺
            </div>
            <h2 className="text-2xl font-bold mb-2 group-hover:text-blue-400 transition-colors">
              Live TV News Station
            </h2>
            <p className="text-slate-400 leading-relaxed text-sm">
              Tune into an automated media anchor network broadcast. Dynamically gathers global, tech, sports, or regional Tamil Nadu current events directly from AI intelligence pipelines.
            </p>
          </div>
          <div className="mt-6 flex items-center text-blue-400 font-semibold text-sm group-hover:translate-x-2 transition-transform">
            Tune In Live <span className="ml-2">→</span>
          </div>
        </div>

        {/* Card 3: AI Sports Center */}
        <div 
          onClick={() => setActiveChannel("sports")}
          className="group cursor-pointer bg-slate-900 border border-slate-800 hover:border-emerald-500/50 p-8 rounded-2xl shadow-2xl flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-emerald-950/20"
        >
          <div>
            <div className="text-4xl mb-4 p-3 bg-emerald-950/40 border border-emerald-800/30 w-fit rounded-xl group-hover:scale-110 transition-transform">
              🏟️
            </div>
            <h2 className="text-2xl font-bold mb-2 group-hover:text-emerald-400 transition-colors">
              AI Sports Center
            </h2>
            <p className="text-slate-400 leading-relaxed text-sm">
              Live cricket analysis with Ashwin-style tactical breakdown and football World Cup coverage with AI-powered panel discussions.
            </p>
          </div>
          <div className="mt-6 flex items-center text-emerald-400 font-semibold text-sm group-hover:translate-x-2 transition-transform">
            Enter Arena <span className="ml-2">→</span>
          </div>
        </div>


      </div>

      {/* Footer Branding */}
      <div className="absolute bottom-6 text-xs font-semibold tracking-widest text-slate-600 uppercase">
        Broadcast Control Network // ProjectVerse Media Engine
      </div>

    </div>
  );
}
