"use client";
import { useState, useEffect } from 'react';

export default function Page() {
  const [currentPath, setCurrentPath] = useState("");
  const [items, setItems] = useState({ folders: [], files: [] });
  const [auth, setAuth] = useState({ role: 'guest' });
  const [lang, setLang] = useState('ko');
  const [selectedImg, setSelectedImg] = useState(null); // 확대 기능용

  const R2_URL = "https://pub-9dc533983760465eb97ca8621cec1e08.r2.dev";
  const WORKER_URL = "https://jins-photo-list.aa841020.workers.dev";

  useEffect(() => {
    // 1. 데이터 로드
    fetch(`${WORKER_URL}?path=${currentPath}`)
      .then(res => res.json())
      .then(data => setItems({ folders: data.folders || [], files: data.files || [] }))
      .catch(() => {});

    // 2. 핵심: 새로고침 시 로그인 유지 (localStorage에서 가져옴)
    const savedAuth = localStorage.getItem('jins_auth');
    if (savedAuth) setAuth(JSON.parse(savedAuth));
  }, [currentPath]);

  const handleLogin = () => {
    const pw = prompt("관리자 암호를 입력하세요");
    if (pw === "1234") { // 설정하신 마스터 비번
      const adminData = { role: 'admin' };
      setAuth(adminData);
      localStorage.setItem('jins_auth', JSON.stringify(adminData));
    }
  };

  return (
    <div style={{ backgroundColor: 'black', minHeight: '100vh', color: 'white', padding: '20px' }}>
      {/* 헤더 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '15px', background: '#18181b', borderRadius: '20px', marginBottom: '20px' }}>
        <h1 onClick={() => setCurrentPath("")} style={{ cursor: 'pointer', margin: 0 }}>JINS PHOTO</h1>
        <button onClick={handleLogin} style={{ background: '#2563eb', border: 'none', color: 'white', padding: '8px 15px', borderRadius: '10px' }}>
          {auth.role === 'admin' ? '관리자 모드' : '로그인'}
        </button>
      </div>

      {/* 폴더 목록 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '15px' }}>
        {items.folders.map(f => (
          <div key={f} onClick={() => setCurrentPath(currentPath + f + "/")} style={{ background: '#27272a', padding: '20px', borderRadius: '20px', textAlign: 'center', cursor: 'pointer' }}>
            <span style={{ fontSize: '40px' }}>📂</span>
            <div style={{ fontSize: '12px', marginTop: '10px' }}>{f}</div>
          </div>
        ))}
      </div>

      {/* 사진 목록 (확대 기능 포함) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '10px', marginTop: '20px' }}>
        {items.files.map(file => (
          <img 
            key={file} 
            src={`${R2_URL}/${currentPath}${file}`} 
            style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '10px', cursor: 'pointer' }}
            onClick={() => setSelectedImg(`${R2_URL}/${currentPath}${file}`)} 
          />
        ))}
      </div>

      {/* 사진 확대 모달 */}
      {selectedImg && (
        <div onClick={() => setSelectedImg(null)} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <img src={selectedImg} style={{ maxWidth: '95%', maxHeight: '95%' }} />
          <button style={{ position: 'absolute', top: '20px', right: '20px', fontSize: '30px', color: 'white', background: 'none', border: 'none' }}>✕</button>
        </div>
      )}
    </div>
  );
}