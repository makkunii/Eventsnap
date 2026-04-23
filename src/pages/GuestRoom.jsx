import React, { useState, useEffect } from 'react';
import CameraView from '../components/CameraView';
import { usePeer } from '../hooks/usePeer';

const GuestRoom = ({ onBack }) => {
  const [joined, setJoined] = useState(false);
  const [targetCode, setTargetCode] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [showLockedNotice, setShowLockedNotice] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState('');

  const [isProcessing, setIsProcessing] = useState(false);
  const [cameraKey, setCameraKey] = useState(0);
  const [facingMode, setFacingMode] = useState("environment");

  const { peerId, sendData, incomingData } = usePeer(false, null, false);
  const [showEndModal, setShowEndModal] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

  const [localGallery, setLocalGallery] = useState([]);

  // Snap limit state — snapLimit null means unlimited
  const [snapLimit, setSnapLimit] = useState(null);
  const [snapCount, setSnapCount] = useState(0);

  // Restore snapCount from localStorage when targetCode is known
  useEffect(() => {
    if (!targetCode) return;
    const savedCount = localStorage.getItem(`snapCount_${targetCode.toLowerCase()}`);
    if (savedCount !== null) setSnapCount(Number(savedCount));
  }, [targetCode, joined]);

  useEffect(() => {
    if (!incomingData) return;

    if (incomingData.type === 'LOCK_UPDATE') {
      setIsLocked(incomingData.isLocked);
    }

    if (incomingData.type === 'SNAP_LIMIT_UPDATE') {
      setSnapLimit(incomingData.snapLimit ?? null);
    }

    if (incomingData.type === 'SESSION_TERMINATED') {
      setShowEndModal(true);
    }

    if (incomingData.type === 'MEDIA_RECEIVED') {
      setIsProcessing(false);
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setCameraKey(prev => prev + 1);
      }, 2500);
    }

    if (incomingData.type === 'EVENT_LOCKED') {
      setIsProcessing(false);
      setShowLockedNotice(true);
      setTimeout(() => {
        setShowLockedNotice(false);
        setCameraKey(prev => prev + 1);
      }, 3000);
    }

  }, [incomingData]);

  const handleJoin = async () => {
    if (!targetCode.trim()) return;
    setIsConnecting(true);
    setError('');

    try {
      await sendData(targetCode.toLowerCase(), { type: 'GUEST_JOIN' });
      setJoined(true);
    } catch (err) {
      setError('Event not found. Check the code.');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleSend = async (photoData) => {
    if (isLocked) {
      setIsProcessing(false);
      setShowLockedNotice(true);
      return;
    }

    // Check snap limit before sending
    if (snapLimit !== null && snapCount >= snapLimit) {
      setShowLockedNotice(true);
      setTimeout(() => setShowLockedNotice(false), 3000);
      return;
    }

    try {
      await sendData(targetCode.toLowerCase(), {
        type: photoData.startsWith('data:video') ? 'VIDEO' : 'PHOTO',
        data: photoData,
        peerId: peerId
      });

      // Increment and persist snap count
      const newCount = snapCount + 1;
      setSnapCount(newCount);
      localStorage.setItem(`snapCount_${targetCode.toLowerCase()}`, String(newCount));

      const newEntry = {
        id: Date.now(),
        data: photoData,
        type: photoData.startsWith('data:video') ? 'video' : 'photo'
      };

      const updatedGallery = [newEntry, ...localGallery].slice(0, 10);
      setLocalGallery(updatedGallery);
      localStorage.setItem(`gallery_${targetCode}`, JSON.stringify(updatedGallery));

    } catch (err) {
      alert("Host disconnected.");
      setIsProcessing(false);
    }
  };

  const toggleCamera = () => {
    setFacingMode(prev => prev === "environment" ? "user" : "environment");
  };

  if (joined) {
    return (
      <div className="relative h-screen w-screen bg-black overflow-hidden font-sans">
        <CameraView
          key={cameraKey}
          onSend={handleSend}
          isLocked={isLocked}
          isProcessing={isProcessing}
          setIsProcessing={setIsProcessing}
          facingMode={facingMode}
          onToggleCamera={toggleCamera}
          snapLimit={snapLimit}
          snapCount={snapCount}
        />

        {/* TOP STATUS BAR */}
        <div className="fixed top-0 left-0 right-0 p-6 z-[120] pointer-events-none flex flex-col items-center">
          {isLocked ? (
            <div className="bg-orange-500/90 backdrop-blur-xl px-5 py-2 rounded-2xl border border-white/10 shadow-2xl animate-in slide-in-from-top-4">
              <p className="text-white text-[9px] font-black lowercase tracking-[0.2em] flex items-center gap-2">
                <span className="text-sm">🔒</span> Host Paused Session
              </p>
            </div>
          ) : (
            <div className="bg-white/5 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/10">
              <p className="text-white/40 text-[8px] font-black lowercase tracking-[0.3em] flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"/> Connected to {targetCode.toLowerCase()}
              </p>
            </div>
          )}
        </div>

        {/* FEEDBACK OVERLAYS (Success/Locked) */}
        {(showSuccess || showLockedNotice) && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-8 animate-in fade-in duration-300">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-xl" />

            <div className={`relative w-full max-w-xs p-10 rounded-[3.5rem] text-center shadow-[0_40px_80px_rgba(0,0,0,0.5)] border-t border-white/20 flex flex-col items-center animate-in zoom-in-95 ${showSuccess ? 'bg-blue-600' : 'bg-zinc-900'}`}>
              {showSuccess ? (
                <>
                  <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mb-6">
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-3xl font-black text-white italic tracking-tighter lowercase mb-2">Sent!</h3>
                  <p className="text-blue-100/60 text-[10px] font-bold lowercase tracking-widest">Saved to Event Gallery</p>
                </>
              ) : (
                <>
                  <div className="w-20 h-20 bg-orange-500/10 rounded-full flex items-center justify-center mb-6">
                    <svg className="w-10 h-10 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-black text-white italic tracking-tighter lowercase mb-4">
                    {snapLimit !== null && snapCount >= snapLimit ? 'Snap Limit Reached' : 'Snap Queued'}
                  </h3>
                  <p className="text-zinc-400 text-[10px] font-bold lowercase tracking-widest leading-relaxed">
                    {snapLimit !== null && snapCount >= snapLimit
                      ? `You've used all ${snapLimit} snaps for this event.`
                      : 'Host is reviewing right now. It will post once they resume!'}
                  </p>
                </>
              )}
            </div>
          </div>
        )}

        {/* EVENT TERMINATED */}
        {showEndModal && (
          <div className="fixed inset-0 z-[400] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-8">
            <div className="bg-[#111] border border-white/5 p-12 rounded-[4rem] max-w-sm w-full text-center shadow-3xl animate-in zoom-in-95">
              <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-8">
                <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h3 className="text-3xl font-black text-white lowercase italic tracking-tighter mb-4">Event Ended</h3>
              <p className="text-zinc-500 text-xs font-medium leading-relaxed mb-10">
                The session has been closed by the host. Check the main gallery later!
              </p>
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-white text-black py-5 rounded-3xl font-black lowercase tracking-widest text-xs active:scale-95 transition-all shadow-xl"
              >
                Back to Lobby
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-6 bg-[#050505] font-sans">
      {/* Background Decor */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-xs h-[300px] bg-blue-600/20 blur-[100px] pointer-events-none" />

      <div className="w-full max-w-sm relative z-10">
        <div className="bg-zinc-900/40 backdrop-blur-3xl rounded-[3rem] p-10 border border-white/10 shadow-3xl overflow-hidden relative">

          <div className="text-center mb-10">
            <div className="inline-flex bg-white/5 p-6 rounded-[2rem] mb-6 border border-white/5">
              <svg className="w-10 h-10 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15a2.25 2.25 0 002.25-2.25V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
              </svg>
            </div>
            <h2 className="text-3xl font-black tracking-tighter text-white lowercase italic leading-none">Enter Room</h2>
            <p className="text-zinc-500 text-[10px] font-bold lowercase tracking-[0.3em] mt-3">Ready to snap & share?</p>
          </div>

          <div className="space-y-6">
            <div className="relative">
              <input
                type="text"
                placeholder="code"
                className={`w-full bg-black/40 border-2 py-6 rounded-3xl text-center text-4xl font-mono font-black outline-none transition-all lowercase placeholder:text-zinc-800 ${error ? 'border-red-500/50 text-red-500' : 'border-white/5 text-blue-500 focus:border-blue-500/50 focus:bg-black/60'}`}
                value={targetCode}
                onChange={(e) => setTargetCode(e.target.value)}
                disabled={isConnecting}
              />
              {error && <p className="absolute -bottom-6 left-0 right-0 text-center text-red-500 text-[9px] font-black lowercase tracking-widest">{error}</p>}
            </div>

            <button
              type="button"
              onClick={handleJoin}
              disabled={!targetCode.trim() || isConnecting}
              className="w-full bg-white text-black py-6 rounded-3xl font-black text-sm shadow-2xl lowercase tracking-widest transition-all active:scale-95 disabled:bg-zinc-800 disabled:text-zinc-600"
            >
              {isConnecting ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin"/>
                  Verifying
                </span>
              ) : 'Join Session'}
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onBack ? onBack() : window.location.href = '/'}
          className="w-full mt-8 py-4 text-zinc-600 font-black text-[10px] hover:text-white transition-colors lowercase tracking-[0.4em]"
        >
          ← Back to Lobby
        </button>
      </div>
    </div>
  );
};

export default GuestRoom;