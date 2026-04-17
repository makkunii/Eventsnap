import React, { useState, useEffect, useMemo, useRef } from 'react';
import { usePeer } from '../hooks/usePeer';

const HostDashboard = ({ onBack }) => {
  const hostId = useMemo(() => {
    const savedId = localStorage.getItem('activeEventCode');
    if (savedId) return savedId;
    const newId = `event-${Math.floor(Math.random() * 9000) + 1000}`;
    localStorage.setItem('activeEventCode', newId);
    return newId;
  }, []);

  const [gallery, setGallery] = useState(() => {
    const savedGallery = localStorage.getItem(`gallery_${hostId}`);
    return savedGallery ? JSON.parse(savedGallery) : [];
  });

  const [selectedItem, setSelectedItem] = useState(null);
  const [isLocked, setIsLocked] = useState(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIndices, setSelectedIndices] = useState([]);
  
  const lastProcessedRef = useRef(null);
  const { peerId, incomingData, connections, sendData } = usePeer(true, hostId, isLocked);

  useEffect(() => {
    if (connections.length > 0) {
      connections.forEach(conn => {
        if (conn.open) conn.send({ type: 'LOCK_UPDATE', isLocked });
      });
    }
  }, [isLocked, connections]);

  const handleTerminate = () => {
    connections.forEach(conn => {
      if (conn.open) conn.send({ type: 'SESSION_TERMINATED' });
    });
    setTimeout(() => {
      localStorage.removeItem('activeEventCode');
      localStorage.removeItem(`gallery_${hostId}`);
      window.location.reload();
    }, 800);
  };

  const handleBatchDownload = () => {
    selectedIndices.forEach((index, i) => {
      const item = gallery[index];
      const link = document.createElement('a');
      link.href = item;
      link.download = `event-snap-${index}.png`;
      document.body.appendChild(link);
      setTimeout(() => {
        link.click();
        document.body.removeChild(link);
      }, i * 200);
    });
    setIsSelectionMode(false);
    setSelectedIndices([]);
  };

  const toggleSelectItem = (index) => {
    setSelectedIndices(prev => 
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  useEffect(() => {
    if (!incomingData || incomingData === lastProcessedRef.current) return;
    const isObject = typeof incomingData === 'object' && incomingData.type;
    if (!isObject || incomingData.type === 'GUEST_JOIN') return;

    if (isLocked) {
      if (incomingData.peerId) sendData(incomingData.peerId, { type: 'EVENT_LOCKED' });
      return;
    }

    lastProcessedRef.current = incomingData;
    setGallery(prev => {
      const updated = [incomingData.data, ...prev];
      try { localStorage.setItem(`gallery_${hostId}`, JSON.stringify(updated)); } catch (e) {}
      return updated;
    });

    if (incomingData.peerId) sendData(incomingData.peerId, { type: 'MEDIA_RECEIVED' });
  }, [incomingData, hostId, sendData, isLocked]);

  return (
    <div className="fixed inset-0 bg-[#050505] text-zinc-100 overflow-y-auto selection:bg-blue-500/30 font-sans tracking-tight">
      {/* Dynamic Background Glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[500px] bg-blue-600/10 blur-[120px] pointer-events-none" />

      <div className="min-h-full p-4 md:p-12 w-full max-w-7xl mx-auto pb-48">
        
        {/* Header Section */}
        <header className="flex items-center justify-between mb-16 relative z-10">
          <button 
            onClick={() => onBack ? onBack() : window.location.href = '/'} 
            className="group flex items-center gap-3 bg-white/5 border border-white/10 px-5 py-2.5 rounded-2xl backdrop-blur-md hover:bg-white/10 transition-all active:scale-95"
          >
            <span className="text-zinc-500 group-hover:text-white transition-colors">←</span>
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Lobby</span>
          </button>
          
          <div className="flex items-center gap-2 bg-black/40 border border-white/5 p-1.5 rounded-3xl backdrop-blur-2xl">
            <button 
              onClick={() => { setIsSelectionMode(!isSelectionMode); setSelectedIndices([]); }}
              className={`px-5 py-2 rounded-2xl font-black text-[9px] uppercase tracking-widest transition-all ${isSelectionMode ? 'bg-blue-600 text-white shadow-lg' : 'text-zinc-500 hover:text-white'}`}
            >
              {isSelectionMode ? 'Cancel' : 'Select'}
            </button>
            <button 
              onClick={() => setIsLocked(!isLocked)}
              className={`px-5 py-2 rounded-2xl font-black text-[9px] uppercase tracking-widest transition-all ${isLocked ? 'bg-zinc-800 text-orange-500' : 'text-zinc-500 hover:text-white'}`}
            >
              {isLocked ? 'Locked' : 'Lock'}
            </button>
            <button 
              onClick={() => setShowEndConfirm(true)}
              className="px-5 py-2 rounded-2xl font-black text-[9px] uppercase tracking-widest text-red-500/50 hover:text-red-500 hover:bg-red-500/10 transition-all"
            >
              End
            </button>
          </div>
        </header>

        {/* Hero Display */}
        <section className="relative mb-24 text-center">
          <div className="inline-block relative">
            <h2 className="text-zinc-600 text-[10px] font-black uppercase tracking-[0.6em] mb-4">Event Signal</h2>
            <p className={`text-7xl md:text-[10rem] font-black tracking-[ -0.05em] leading-none transition-all duration-700 ${isLocked ? 'text-zinc-800 blur-sm scale-90' : 'text-white drop-shadow-[0_0_40px_rgba(255,255,255,0.1)]'}`}>
              {peerId || "LOADING"}
            </p>
            {!isLocked && <div className="absolute -inset-2 bg-gradient-to-r from-blue-500/0 via-white/10 to-blue-500/0 h-px bottom-0 animate-shimmer" />}
          </div>

          <div className="flex items-center justify-center gap-6 mt-12">
            <div className="flex flex-col items-center">
              <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest mb-1">Status</span>
              <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/5">
                <div className={`w-1.5 h-1.5 rounded-full ${isLocked ? 'bg-orange-500' : 'bg-green-500 animate-pulse'}`} />
                <span className="text-[10px] font-mono text-zinc-300 uppercase">{isLocked ? 'Frozen' : 'Live'}</span>
              </div>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="flex flex-col items-center">
              <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest mb-1">Captured</span>
              <span className="text-xl font-black text-white">{gallery.length}</span>
            </div>
          </div>
        </section>

        {/* Grid Display */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
          {gallery.map((item, i) => {
            const isVideo = item && item.startsWith('data:video');
            const isSelected = selectedIndices.includes(i);
            return (
              <div 
                key={`${hostId}-${i}`} 
                onClick={() => isSelectionMode ? toggleSelectItem(i) : setSelectedItem(item)} 
                className={`group relative aspect-[10/14] rounded-[2rem] md:rounded-[3rem] overflow-hidden bg-zinc-900 border transition-all duration-500 ${
                  isSelected ? 'ring-4 ring-blue-600 scale-[0.96] z-20' : 'border-white/5'
                } ${isSelectionMode ? 'cursor-default' : 'cursor-pointer hover:border-white/20 hover:-translate-y-2'}`}
              >
                {isVideo ? (
                  <video src={item} className="h-full w-full object-cover" muted loop playsInline onMouseOver={e => e.target.play()} onMouseOut={e => e.target.pause()} />
                ) : (
                  <img src={item} className="h-full w-full object-cover transition-transform duration-1000 group-hover:scale-110" alt="" />
                )}
                
                {/* Visual Identity Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className="absolute top-4 left-4 flex gap-2">
                  <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest backdrop-blur-md border border-white/10 ${isVideo ? 'bg-red-500 text-white' : 'bg-white/10 text-white'}`}>
                    {isVideo ? 'Motion' : 'Static'}
                  </div>
                </div>

                {isSelectionMode && (
                  <div className={`absolute inset-0 flex items-center justify-center transition-all ${isSelected ? 'bg-blue-600/20' : 'bg-black/40'}`}>
                    <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-white border-white' : 'border-white/40'}`}>
                      {isSelected && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Floating Batch Action Bar */}
      {isSelectionMode && selectedIndices.length > 0 && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[200] w-[calc(100%-2rem)] max-w-md bg-white text-black p-2 rounded-[2rem] flex items-center justify-between shadow-[0_30px_60px_rgba(0,0,0,0.5)] animate-in slide-in-from-bottom-10">
            <div className="pl-6">
                <p className="text-[10px] font-black uppercase tracking-tighter">Ready to Export</p>
                <p className="text-[9px] font-bold text-zinc-500 uppercase">{selectedIndices.length} items</p>
            </div>
            <button 
                onClick={handleBatchDownload}
                className="bg-blue-600 text-white px-8 py-4 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all"
            >
                Download Bundle
            </button>
        </div>
      )}

      {/* Fullscreen Preview */}
      {selectedItem && !isSelectionMode && (
        <div className="fixed inset-0 z-[250] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-4 md:p-12 animate-in fade-in" onClick={() => setSelectedItem(null)}>
          <div className="relative max-w-4xl w-full h-full flex flex-col items-center justify-center" onClick={e => e.stopPropagation()}>
             <div className="w-full h-[70vh] rounded-[3rem] overflow-hidden border border-white/10 bg-zinc-900 shadow-3xl">
                {selectedItem.startsWith('data:video') ? (
                  <video src={selectedItem} className="w-full h-full object-contain" controls autoPlay loop playsInline />
                ) : (
                  <img src={selectedItem} className="w-full h-full object-contain" alt="" />
                )}
             </div>
             <div className="mt-10 flex gap-4 w-full max-w-sm">
               <a href={selectedItem} download className="flex-1 bg-white text-black py-5 rounded-[2rem] font-black text-[10px] uppercase tracking-widest text-center hover:scale-105 transition-transform">Save to Device</a>
               <button onClick={() => setSelectedItem(null)} className="flex-1 bg-white/5 border border-white/10 text-white py-5 rounded-[2rem] font-black text-[10px] uppercase tracking-widest hover:bg-white/10">Dismiss</button>
             </div>
          </div>
        </div>
      )}

      {/* End Session Confirmation */}
      {showEndConfirm && (
        <div className="fixed inset-0 z-[300] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6 animate-in zoom-in-95">
          <div className="bg-[#111] border border-white/5 p-10 rounded-[3.5rem] max-w-sm w-full text-center shadow-3xl">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
               <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </div>
            <h3 className="text-2xl font-black text-white uppercase tracking-tighter italic mb-2">Wipe Session?</h3>
            <p className="text-zinc-500 text-xs font-medium leading-relaxed mb-8 px-4">All captured media will be permanently deleted from the cloud and storage.</p>
            <div className="flex flex-col gap-3">
              <button onClick={handleTerminate} className="bg-red-500 text-white py-5 rounded-[1.5rem] font-black uppercase tracking-widest text-[10px]">Destroy Everything</button>
              <button onClick={() => setShowEndConfirm(false)} className="text-zinc-500 font-bold py-2 uppercase text-[9px] tracking-widest">Keep Session</button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 3s infinite linear;
        }
      `}</style>
    </div>
  );
};

export default HostDashboard;