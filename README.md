# Snap Pulse

**Real-time P2P Collective Gallery.** _Capture the moment from every angle, instantly._

**Snap Pulse** is a peer-to-peer (P2P) live event gallery that turns every guest into a contributor. Using WebRTC technology, photos and videos are broadcasted directly between devices in real-time. No central server uploads, no cloud waiting times—just raw, instant sharing.

---

### 🛠️ The Tech Stack

- **Frontend:** React 19 + Tailwind CSS 4
- **P2P Engine:** PeerJS (WebRTC)
- **Media Handling:** HTML5 Canvas & MediaStreams
- **State Management:** React Hooks (useRef/useMemo for persistent socket-like behavior)

---

### 📡 System Architecture

Snap Pulse operates on a **Hub-and-Spoke P2P Model**:

1. **The Host:** Acts as the "Pulse Point," maintaining the event code and relaying media to all connected peers.
    
2. **The Guests:** Connect to the Host via a unique 4-digit Event Code.
    
3. **The Relay:** When Guest A snaps a photo, it is sent to the Host, who then broadcasts it to Guest B, C, and D instantly.
    

---

### 🚀 Features

- **Instant Broadcast:** Photos and videos appear on host's screen the second they are taken by the guests.
    
- **No-Account Joining:** Guests join via a simple code; no login or signup friction.
    
- **Live Event Control:** Hosts can "Lock" the session to pause incoming snaps during specific moments.
    
- **NAT Traversal:** Integrated STUN/TURN server support to ensure connections work across different networks (e.g., Cebu to Bataan).
    
- **Zero-Server Storage:** Media is held in the P2P session and local storage, ensuring privacy and speed.
    

---

### 💻 Getting Started

#### 1. Clone & Install

Bash

```
git clone https://github.com/makkunii/snap-pulse.git
cd snap-pulse
npm install
```

#### 2. Configure PeerJS

Ensure your `usePeer` hook is configured with ICE servers for global connectivity:

JavaScript

```
const peer = new Peer(id, {
  config: {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'turn:your-turn-server.com', username: '...', credential: '...' }
    ]
  }
});
```

#### 3. Run Locally

Bash

```
npm run dev
```

---

### ⚙️ How it Works

|**Role**|**Responsibility**|
|---|---|
|**Host**|Generates ID, manages peer list, relays media, and locks/unlocks session.|
|**Guest**|Requests join, streams media to host, and listens for broadcast items.|
|**Relay**|(STUN/TURN) Facilitates connection when peers are behind strict NATs.|

---

### 🤝 Contributing

1. **Fork** the project.
    
2. **Branch** out (`git checkout -b feature/NewPulse`).
    
3. **Commit** (`git commit -m 'Add new pulse feature'`).
    
4. **Push** and open a **Pull Request**.
    

---

### 📞 Contact

For questions or support, contact **makkunii** at `mmanuel.eugene@gmail.com`.
