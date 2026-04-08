"use client";
import { useState, useEffect } from 'react';

export default function Page() {
  const [isLocked, setIsLocked] = useState(true);
  const [passInput, setPassInput] = useState("");
  const [currentPath, setCurrentPath] = useState("");
  const [items, setItems] = useState({ folders: [], files: [] });
  const [selectedImg, setSelectedImg] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState('newest');
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const R2_URL = "https://pub-9dc533983760465eb97ca8621cec1e08.r2.dev";
  const WORKER_URL = "https://jins-photo-list.aa841020.workers.dev";
  const MASTER_PW = "1234";

  useEffect(() => {
    const saved = localStorage.getItem('jins_authenticated');
    if (saved === 'true') {
      setIsLocked(false);
      fetchData();
    }
  }, [currentPath, sortOrder]);

  const fetchData = async () => {
    try {
      const res = await fetch(`${WORKER_URL}?path=${currentPath}`);
      const data = await res.json();
      let files = [...(data.files || [])];
      files.sort((a, b) => sortOrder === 'newest' ? b.localeCompare(a) : a.localeCompare(b));
      setItems({ folders: data.folders || [], files });
    } catch (e) { console.error(e); }
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

  if (isLocked) {
    return (
      <div style={{ backgroundColor: 'black', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
        <form onSubmit={handleUnlock} style={{ textAlign: 'center', background: '#18181b', padding: '40px', borderRadius: '30px', border: '1px solid #27272a' }}>
          <h2 style={{ marginBottom: '20px' }}>🔐 JINS PHOTO</h2>
          <input type="password" value={passInput} onChange={(e)=>setPassInput(e.target.value)} placeholder="Password" style={{ background: 'black', border: '1px solid #3f3f46', color: 'white', padding: '12px', borderRadius: '10px', width: '200px', textAlign: 'center' }} autoFocus />
        </form>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: 'black', minHeight: '100vh', color: 'white', padding: '20px', fontFamily: 'sans-serif' }}>
      <div style={{ background: '#18181b', padding: '15px', borderRadius: '25px', marginBottom: '20px', border: '1px solid #27272a' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
          <h1 onClick={() => setCurrentPath("")} style={{ cursor: 'pointer', margin: 0, fontSize: '20px' }}>JINS <span style={{color:'#3b82f6'}}>PHOTO</span></h1>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest')} style={{ background: '#27272a', border: 'none', color: 'white', padding: '5px 10px', borderRadius: '8px', fontSize: '11px' }}>
              {sortOrder === 'newest' ? '↓ 최신순' : '↑ 과거순'}
            </button>
            <button onClick={() => { localStorage.removeItem('jins_authenticated'); setIsLocked(true); }} style={{ background: '#ef4444', border: 'none', color: 'white', padding: '5px 10px', borderRadius: '8px', fontSize: '11px' }}>LOCK</button>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => alert("준비중")} style={{ flex: 1, background: '#2563eb', border: 'none', color: 'white', padding: '12px', borderRadius: '15px', fontWeight: 'bold' }}>📤 업로드</button>
          <button onClick={() => alert("준비중")} style={{ flex: 1, background: '#27272a', border: '1px solid #3f3f46', color: 'white', padding: '12px', borderRadius: '15px', fontWeight: 'bold' }}>➕ 새 폴더</button>
        </div>
      </div>

      <div style={{ color: '#71717a', fontSize: '12px', marginBottom: '15px' }}>📍 {currentPath || "ROOT"}</div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '15px' }}>
        {items.folders.map(f => (
          <div key={f} style={{ position: 'relative' }}>
            <div onClick={() => setCurrentPath(currentPath + f + "/")} style={{ background: '#18181b', padding: '20px', borderRadius: '25px', textAlign: 'center', cursor: 'pointer', border: '1px solid #27272a' }}>
              <span style={{ fontSize: '40px' }}>📂</span>
              <div style={{ fontSize: '11px', marginTop: '10px', fontWeight: 'bold', color: '#a1a1aa' }}>{f.toUpperCase()}</div>
            </div>
            <button onClick={() => setActiveMenu(activeMenu === f ? null : f)} style={{ position: 'absolute', top: '10px', right: '10px', background: 'none', border: 'none', color: '#52525b', fontSize: '20px' }}>⋮</button>
            {activeMenu === f && (
              <div style={{ position: 'absolute', top: '35px', right: '5px', background: '#27272a', border: '1px solid #3f3f46', borderRadius: '12px', z_index: 100, padding: '5px', width: '120px' }}>
                <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}?path=${currentPath}${f}/`); alert("복사됨"); setActiveMenu(null); }} style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', color: 'white', padding: '10px', fontSize: '12px' }}>🔗 공유</button>
                <button style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', color: '#ef4444', padding: '10px', fontSize: '12px', borderTop: '1px solid #3f3f46' }}>🗑️ 삭제</button>
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '10px', marginTop: '20px' }}>
        {items.files.map(file => (
          <img key={file} src={`${R2_URL}/${currentPath}${file}`} style={{ width: '100%', height: '160px', objectFit: 'cover', borderRadius: '15px', cursor: 'pointer' }} onClick={() => setSelectedImg(`${R2_URL}/${currentPath}${file}`)} />
        ))}
      </div>

      {selectedImg && (
        <div onClick={() => setSelectedImg(null)} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <img src={selectedImg} style={{ maxWidth: '98%', maxHeight: '98%', borderRadius: '10px' }} />
        </div>
      )}

      <div onClick={() => setCurrentPath("trash/")} style={{ position: 'fixed', bottom: '20px', right: '20px', width: '50px', height: '50px', background: '#18181b', borderRadius: '25px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #27272a', cursor: 'pointer' }}>🗑️</div>
    </div>
  );
}