import React from 'react';

const Home = ({ onSelect }) => (
  <div className="relative h-screen w-full flex flex-col items-center justify-center overflow-hidden bg-zinc-950 px-6 touch-none">
    
    {/* Decorative Background Glows - Adjusted for mobile viewports */}
    <div className="absolute top-[-10%] left-[-10%] w-[70%] h-[40%] bg-blue-600/15 blur-[100px] rounded-full" />
    <div className="absolute bottom-[-5%] right-[-5%] w-[60%] h-[30%] bg-indigo-600/10 blur-[100px] rounded-full" />

    {/* Hero Content */}
    <div className="relative z-10 text-center mb-12 sm:mb-16 space-y-3">
      <div className="inline-block bg-zinc-900/80 border border-zinc-800 px-3 py-1 rounded-full mb-2">
        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-500">
          Peer-to-Peer Live Stream
        </span>
      </div>
      
      {/* Title: Scaled down for mobile (text-6xl) and up for desktop (md:text-8xl) */}
      <h1 className="text-5xl md:text-7xl font-black italic tracking-tighter text-white leading-[0.85]">
        SNAP<span className="text-blue-600">SHARE</span>
      </h1>
      
      <p className="text-zinc-500 max-w-[280px] md:max-w-xs mx-auto text-xs md:text-sm font-medium leading-relaxed">
       Turn your event into a live, interactive gallery where everyone can be the photographer.
      </p>
    </div>

    {/* Action Buttons - Larger tap targets for mobile */}
    <div className="relative z-10 flex flex-col gap-4 w-full max-w-xs">
      <button 
        onClick={() => onSelect('host')}
        className="group relative w-full py-5 md:py-6 bg-white text-black font-bold rounded-2xl md:rounded-[2rem] text-lg md:text-xl transition-all active:scale-95 shadow-xl overflow-hidden"
      >
        <div className="relative z-10 flex items-center justify-center gap-2">
          <span>Host an Event</span>
          <span className="text-xl transition-transform group-hover:translate-x-1">→</span>
        </div>
      </button>

      <button 
        onClick={() => onSelect('guest')}
        className="w-full py-5 md:py-6 bg-zinc-900 border border-zinc-800 text-white font-bold rounded-2xl md:rounded-[2rem] text-lg md:text-xl transition-all active:bg-zinc-800 active:scale-95"
      >
        Join as Guest
      </button>
    </div>

    {/* Footer Info - Moved up slightly for devices with home bars (iPhone) */}
    <div className="absolute bottom-12 md:bottom-10 flex flex-col items-center gap-2">
      <div className="flex items-center gap-2 opacity-60">
        <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
        <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest">
          makkunii
        </span>
      </div>
    </div>

  </div>
);

export default Home;