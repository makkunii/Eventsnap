import React, { useEffect, useRef, useState } from 'react';
import { useCamera } from '../hooks/useCamera';

const CameraView = ({ onSend, isLocked, facingMode, onToggleCamera }) => {
  const { 
    videoRef, photo, setPhoto, videoBlob, setVideoBlob,
    isRecording, startRecording, stopRecording,
    hasPermission, requestPermission, takePhoto
  } = useCamera(facingMode);

  const [isSending, setIsSending] = useState(false);
  const isSendingRef = useRef(false); 
  const holdTimerRef = useRef(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    requestPermission();
  }, [facingMode]);

  // Visual feedback for recording duration
  useEffect(() => {
    let interval;
    if (isRecording) {
      setProgress(0);
      interval = setInterval(() => {
        setProgress(prev => Math.min(prev + (100 / 100), 100)); // Assuming 10s max recording
      }, 100);
    } else {
      setProgress(0);
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const handlePressStart = () => {
    if (isLocked) return; 
    holdTimerRef.current = setTimeout(() => startRecording(), 250);
  };

  const handlePressEnd = () => {
    if (isLocked) return;
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
      isRecording ? stopRecording() : takePhoto();
    }
  };

  const handleDiscard = async () => {
    setPhoto(null);
    setVideoBlob(null);
    isSendingRef.current = false;
    setIsSending(false);
    setTimeout(() => requestPermission(), 50);
  };

  return (
    <div className="fixed inset-0 bg-black flex flex-col items-center overflow-hidden touch-none font-sans">
      {(!photo && !videoBlob) ? (
        <>
          {/* Main Camera Feed */}
          <div className="absolute inset-0 z-0">
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              className={`h-full w-full object-cover transition-opacity duration-700 ${facingMode === 'user' ? '-scale-x-100' : ''} ${isLocked ? 'opacity-40 grayscale' : 'opacity-100'}`} 
            />
          </div>

          {/* Vignette Overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60 pointer-events-none" />
          
          {/* Controls HUD */}
          <div className="absolute bottom-12 flex flex-col items-center w-full z-20">
            <p className="text-white/40 text-[9px] font-black uppercase tracking-[0.4em] mb-8 animate-pulse">
              {isRecording ? 'Recording Motion' : isLocked ? 'Camera Locked' : 'Tap for Photo • Hold for Video'}
            </p>

            <div className="flex items-center justify-between w-full px-12 max-w-md">
              {/* Flash/Options Placeholder */}
              <div className="w-14 h-14 rounded-full bg-black/20 backdrop-blur-md border border-white/5 flex items-center justify-center">
                 <div className="w-1.5 h-1.5 bg-white/20 rounded-full" />
              </div>

              {/* Master Capture Button */}
              <div className="relative group">
                {/* Progress Ring */}
                <svg className="absolute -inset-4 w-28 h-28 -rotate-90 pointer-events-none">
                  <circle
                    cx="56" cy="56" r="50"
                    fill="transparent"
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth="4"
                  />
                  <circle
                    cx="56" cy="56" r="50"
                    fill="transparent"
                    stroke={isRecording ? "#ef4444" : "white"}
                    strokeWidth="4"
                    strokeDasharray="314"
                    strokeDashoffset={314 - (314 * progress) / 100}
                    className="transition-all duration-100 ease-linear"
                    strokeLinecap="round"
                  />
                </svg>

                <button 
                  onMouseDown={handlePressStart} onMouseUp={handlePressEnd}
                  onTouchStart={(e) => { e.preventDefault(); handlePressStart(); }}
                  onTouchEnd={(e) => { e.preventDefault(); handlePressEnd(); }}
                  className={`relative z-10 w-20 h-20 rounded-full border-[4px] transition-all duration-300 active:scale-90 shadow-[0_0_30px_rgba(0,0,0,0.5)] ${
                    isLocked 
                    ? 'bg-zinc-900 border-zinc-800' 
                    : isRecording 
                      ? 'bg-red-500 border-white scale-125' 
                      : 'bg-white border-white/20'
                  }`}
                />
              </div>

              {/* Flip Camera Button */}
              <button 
                onClick={onToggleCamera}
                className="w-14 h-14 bg-white/10 backdrop-blur-xl border border-white/20 rounded-full flex items-center justify-center active:rotate-180 transition-all duration-500 hover:bg-white/20"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                  <path d="M3 3v5h5" />
                  <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                  <path d="M16 16h5v5" />
                </svg>
              </button>
            </div>
          </div>
        </>
      ) : (
        /* Preview State */
        <div className="relative h-full w-full bg-black flex flex-col items-center animate-in fade-in zoom-in-95 duration-500">
          <div className="w-full h-full p-4 pt-12 pb-48">
             <div className="relative w-full h-full rounded-[3rem] overflow-hidden bg-zinc-900 shadow-[0_0_50px_rgba(0,0,0,0.8)] border border-white/10">
               {photo ? (
                 <img src={photo} className={`h-full w-full object-cover ${facingMode === 'user' ? '-scale-x-100' : ''}`} alt="" />
               ) : (
                 <video src={videoBlob} autoPlay loop playsInline className={`h-full w-full object-cover ${facingMode === 'user' ? '-scale-x-100' : ''}`} />
               )}
               
               {/* Label Overlay */}
               <div className="absolute top-6 left-6 px-4 py-1.5 bg-black/40 backdrop-blur-md rounded-full border border-white/10">
                  <p className="text-[10px] font-black text-white uppercase tracking-widest">
                    {photo ? 'Static Preview' : 'Motion Preview'}
                  </p>
               </div>
             </div>
          </div>
          
          {/* Action Drawer */}
          <div className="absolute bottom-0 w-full bg-gradient-to-t from-black via-black/90 to-transparent p-10 flex flex-col items-center">
            <button 
              onClick={async (e) => { 
                if (e) { e.stopPropagation(); e.preventDefault(); }
                if (isSendingRef.current || isLocked) return;
                isSendingRef.current = true;
                setIsSending(true); 
                try {
                  await onSend(photo || videoBlob); 
                } catch (err) {
                  isSendingRef.current = false;
                  setIsSending(false);
                }
              }}
              disabled={isSending || isLocked}
              className={`w-full max-w-sm py-6 rounded-3xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-4 transition-all shadow-2xl overflow-hidden group relative ${
                isSending || isLocked 
                ? 'bg-zinc-800 text-zinc-500 pointer-events-none' 
                : 'bg-white text-black active:scale-[0.95]'
              }`}
            >
              {isSending ? (
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                  Sending...
                </div>
              ) : isLocked ? 'SESSION LOCKED' : (
                <>
                  Blast to Gallery
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform">
                    <line x1="22" y1="2" x2="11" y2="13"></line>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                  </svg>
                </>
              )}
            </button>

            <button 
              onClick={handleDiscard} 
              disabled={isSending}
              className={`mt-6 text-zinc-500 font-black text-[9px] uppercase tracking-[0.4em] py-2 transition-all hover:text-red-500 ${isSending ? 'opacity-0' : 'opacity-100'}`}
            >
              Discard and Retake
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes pulse-ring {
          0% { transform: scale(0.95); opacity: 0.5; }
          50% { transform: scale(1.05); opacity: 0.8; }
          100% { transform: scale(0.95); opacity: 0.5; }
        }
      `}</style>
    </div>
  );
};

export default CameraView;