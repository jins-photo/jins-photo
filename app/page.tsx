"use client";
import { useState, useEffect } from 'react';

export default function Page() {
  const [isLocked, setIsLocked] = useState(true); // 처음엔 무조건 잠금
  const [passInput, setPassInput] = useState("");
  const [currentPath, setCurrentPath] = useState("");
  const [items, setItems] = useState({ folders: [], files: [] });
  const [selectedImg, setSelectedImg] = useState(null);

  const R2_URL = "https://pub-9dc533983760465eb97ca8621cec1e08.r2.dev";
  const WORKER_URL = "https://jins-photo-list.aa841020.workers.dev";
  const MASTER_PW = "1234"; // 형님이 사용할 마스터 비번

  // 1. 보안 체크: 비번이 맞아야만 데이터를 가져옴
  useEffect(() => {
    const savedAuth = localStorage.getItem('jins_authenticated');
    if (savedAuth === 'true') {
      setIsLocked(false);
      fetchData();
    }
  }, [currentPath]);

  const fetchData = () => {
    fetch(`${WORKER_URL}?path=${currentPath}`)
      .then(res => res.json())
      .then(data => setItems({ folders: data.folders || [], files: data.files || [] }))
      .catch(() => {});
  };

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (passInput === MASTER_PW) {
      localStorage.setItem('jins_authenticated', 'true');
      setIsLocked(false);
      fetchData();
    } else {
      alert("비밀번호가 틀렸습니다.");
      setPassInput("");
    }
  };

  // --- 잠금 화면 (로그인 전) ---
  if (isLocked) {
    return (
      <div style={{ backgroundColor: 'black', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
        <form onSubmit={handleUnlock} style={{ textAlign: 'center', background: '#18181b', padding: '40px', borderRadius: '30px', border: '1px solid #27272a' }}>
          <h2 style={{ marginBottom: '20px' }}>🔐 JINS PHOTO</h2>
          <input 
            type="password" 
            value={passInput} 
            onChange={(e) => setPassInput(e.target.value)}
            placeholder="Password"
            style={{ background: 'black', border: '1px solid #3f3f46', color: 'white', padding: '12px', borderRadius: '10px', width: '200px', textAlign: 'center', outline: 'none' }}
            autoFocus
          />
          <button type="submit" style={{ display: 'block', width: '100%', marginTop: '15px', padding: '12px', background: '#2563eb', border: 'none', color: 'white', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>
            UNLOCK
          </button>
        </form>
      </div>
    );
  }

  // --- 메인 화면 (로그인 후) ---
  return (
    <div style={{ backgroundColor: 'black', minHeight: '100vh', color: 'white', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '15px', background: '#18181b', borderRadius: '20px', marginBottom: '20px', alignItems: 'center' }}>
        <h1 onClick={() => setCurrentPath("")} style={{ cursor: 'pointer', margin: 0, fontSize: '20px' }}>JINS <span style={{color:'#3b82f6'}}>PHOTO</span></h1>
        <button onClick={() => { localStorage.removeItem('jins_authenticated'); setIsLocked(true); }} style={{ background: '#3f3f46', border: 'none', color: 'white', padding: '8px 15px', borderRadius: '10px', fontSize: '12px' }}>
          LOCK
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '15px' }}>
        {items.folders.map(f => (
          <div key={f} onClick={() => setCurrentPath(currentPath + f + "/")} style={{ background: '#18181b', padding: '20px', borderRadius: '25px', textAlign: 'center', cursor: 'pointer', border: '1px solid #27272a' }}>
            <span style={{ fontSize: '40px' }}>📂</span>
            <div style={{ fontSize: '11px', marginTop: '10px', fontWeight: 'bold', color: '#a1a1aa' }}>{f.toUpperCase()}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '10px', marginTop: '20px' }}>
        {items.files.map(file => (
          <img 
            key={file} 
            src={`${R2_URL}/${currentPath}${file}`} 
            style={{ width: '100%', height: '160px', objectFit: 'cover', borderRadius: '15px', cursor: 'pointer' }}
            onClick={() => setSelectedImg(`${R2_URL}/${currentPath}${file}`)} 
          />
        ))}
      </div>

      {selectedImg && (
        <div onClick={() => setSelectedImg(null)} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <img src={selectedImg} style={{ maxWidth: '98%', maxHeight: '98%', borderRadius: '10px' }} />
          <button style={{ position: 'absolute', top: '20px', right: '20px', fontSize: '30px', color: 'white', background: 'none', border: 'none' }}>✕</button>
        </div>
      )}
    </div>
  );
}