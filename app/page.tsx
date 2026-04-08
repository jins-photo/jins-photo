"use client";
import { useState, useEffect } from 'react';

// [이미지 최적화 엔진] 2000px WebP 변환
const processImage = (file: File): Promise<Blob> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width; let height = img.height;
        if (width > height) { if (width > 2000) { height *= 2000/width; width = 2000; } }
        else { if (height > 2000) { width *= 2000/height; height = 2000; } }
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => resolve(blob as Blob), 'image/webp', 0.8);
      };
    };
  });
};

export default function Page() {
  const [isLocked, setIsLocked] = useState(true);
  const [passInput, setPassInput] = useState("");
  const [currentPath, setCurrentPath] = useState("");
  const [folderPw, setFolderPw] = useState(""); 
  const [items, setItems] = useState({ folders: [], files: [], locked: false, lockedItems: [] as string[] });
  const [selectedImg, setSelectedImg] = useState<string | null>(null);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [activeAdminMenu, setActiveAdminMenu] = useState(false);
  const [sortOrder, setSortOrder] = useState('newest');

  const R2_URL = "https://pub-9dc533983760465eb97ca8621cec1e08.r2.dev";
  const WORKER_URL = "https://jins-photo-list.aa841020.workers.dev";

  // 데이터 불러오기 함수 (독립 선언)
  const fetchData = async () => {
    try {
      const res = await fetch(`${WORKER_URL}?path=${currentPath}&pw=${folderPw}`);
      const data = await res.json();
      if (data.locked) {
        const input = prompt("🔐 비번 입력:");
        if (input) setFolderPw(input); else goBack();
      } else {
        let sortedFiles = [...(data.files || [])];
        sortedFiles.sort((a, b) => sortOrder === 'newest' ? b.localeCompare(a) : a.localeCompare(b));
        setItems({ ...data, files: sortedFiles });
      }
    } catch (e) { console.error("로드 에러", e); }
  };

  // 인증 상태 확인 및 데이터 자동 로드
  useEffect(() => {
    const auth = localStorage.getItem('jins_authenticated');
    if (auth === 'true') {
      setIsLocked(false);
      fetchData(); // 인증된 상태면 즉시 데이터 로드
    }
  }, [currentPath, folderPw, sortOrder]);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    const mpw = localStorage.getItem('jins_master_pw') || "1234";
    if (passInput === mpw) {
      localStorage.setItem('jins_authenticated', 'true');
      setIsLocked(false);
      // 로그인 성공 직후 fetchData를 수동으로 한 번 더 호출해서 바로 폴더가 보이게 함
      setTimeout(() => fetchData(), 100); 
    } else {
      alert("비밀번호 오류");
      setPassInput("");
    }
  };

  const setItemPassword = async (name: string, isFolder: boolean) => {
    const pw = prompt(`${name} 비번 설정 (해제는 공백):`);
    const target = currentPath + name + (isFolder ? "/" : "");
    await fetch(`${WORKER_URL}/set-password`, {
      method: 'POST',
      body: JSON.stringify({ target, password: pw })
    });
    fetchData();
    setActiveMenu(null);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const processedBlob = await processImage(file);
    const formData = new FormData();
    formData.append('file', processedBlob, file.name.split('.')[0] + ".webp");
    formData.append('path', currentPath);
    await fetch(WORKER_URL, { method: 'POST', body: formData });
    fetchData();
    setActiveAdminMenu(false);
  };

  const goBack = () => {
    const paths = currentPath.split('/').filter(Boolean);
    paths.pop();
    setFolderPw(""); 
    setCurrentPath(paths.length > 0 ? paths.join('/') + '/' : "");
  };

  if (isLocked) {
    return (
      <div style={{ backgroundColor: 'black', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
        <form onSubmit={handleUnlock} style={{ textAlign: 'center', background: '#18181b', padding: '40px', borderRadius: '30px', border: '1px solid #27272a' }}>
          <h2 style={{ marginBottom: '20px' }}>🔐 JINS PHOTO</h2>
          <input type="password" value={passInput} onChange={(e)=>setPassInput(e.target.value)} placeholder="Password" style={{ background: 'black', border: '1px solid #333', color: 'white', padding: '12px', borderRadius: '10px', width: '200px', textAlign: 'center' }} autoFocus />
        </form>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: 'black', minHeight: '100vh', color: 'white', padding: '20px', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
        <h1 onClick={() => {setCurrentPath(""); setFolderPw("");}} style={{ cursor: 'pointer', margin: 0, fontSize: '22px' }}>JINS <span style={{color:'#3b82f6'}}>PHOTO</span></h1>
        <button onClick={() => setActiveAdminMenu(!activeAdminMenu)} style={{ background: 'none', border: 'none', color: 'white', fontSize: '24px', letterSpacing: '2px' }}>•••</button>
        {activeAdminMenu && (
          <div style={{ position: 'absolute', top: '60px', right: '20px', background: '#18181b', border: '1px solid #333', borderRadius: '15px', zIndex: 200, padding: '10px', width: '160px' }}>
            <label style={{ display: 'block', padding: '10px', cursor: 'pointer', borderBottom: '1px solid #222' }}>📤 업로드 <input type="file" onChange={handleUpload} style={{ display: 'none' }} /></label>
            <button onClick={() => {
              const name = prompt("폴더명:");
              if(name) fetch(WORKER_URL, { method: 'PUT', body: JSON.stringify({ path: currentPath, folderName: name }) }).then(()=>fetchData());
              setActiveAdminMenu(false);
            }} style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', color: 'white', padding: '10px', borderBottom: '1px solid #222' }}>➕ 새 폴더</button>
            <button onClick={() => { localStorage.removeItem('jins_authenticated'); window.location.reload(); }} style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', color: '#666', padding: '10px' }}>🔒 로그아웃</button>
          </div>
        )}
      </div>

      {currentPath && <button onClick={goBack} style={{ background: '#18181b', border: '1px solid #27272a', color: 'white', padding: '8px 15px', borderRadius: '10px', marginBottom: '20px', fontSize: '13px' }}>⬅️ 뒤로가기</button>}

      {/* 폴더 목록 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '15px' }}>
        {items.folders.map(f => {
          // 자물쇠 확인 로직 강화
          const isFolderLocked = items.lockedItems?.some(item => item === f || item === f + "/");
          return (
            <div key={f} style={{ position: 'relative' }}>
              <div onClick={() => setCurrentPath(currentPath + f + "/")} style={{ background: '#18181b', padding: '25px 15px', borderRadius: '25px', textAlign: 'center', border: '1px solid #27272a', position: 'relative' }}>
                {isFolderLocked && <span style={{ position: 'absolute', top: '12px', left: '15px', fontSize: '14px' }}>🔒</span>}
                <span style={{ fontSize: '45px' }}>📂</span>
                <div style={{ fontSize: '12px', marginTop: '10px', fontWeight: 'bold' }}>{f}</div>
              </div>
              <button onClick={() => setActiveMenu(activeMenu === f ? null : f)} style={{ position: 'absolute', top: '10px', right: '15px', background: 'none', border: 'none', color: '#555', fontSize: '20px' }}>⋮</button>
              {activeMenu === f && (
                <div style={{ position: 'absolute', top: '40px', right: '5px', background: '#27272a', borderRadius: '12px', zAddIndex: 100, padding: '5px', width: '140px', border: '1px solid #333' }}>
                  <button onClick={() => setItemPassword(f, true)} style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', color: '#fbbf24', padding: '10px', fontSize: '12px' }}>🔐 비번설정</button>
                  <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}?path=${currentPath}${f}/`); alert("복사!"); setActiveMenu(null); }} style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', color: 'white', padding: '10px', fontSize: '12px' }}>🔗 링크복사</button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 사진 목록 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '10px', marginTop: '20px' }}>
        {items.files.map(file => (
          <div key={file} style={{ position: 'relative' }}>
            <img src={`${R2_URL}/${currentPath}${file}`} style={{ width: '100%', height: '170px', objectFit: 'cover', borderRadius: '18px', border: '1px solid #27272a' }} onClick={() => setSelectedImg(file)} />
            {items.lockedItems?.includes(file) && <span style={{ position: 'absolute', top: '12px', left: '12px', textShadow: '0 0 5px black' }}>🔒</span>}
            <button onClick={() => setActiveMenu(activeMenu === file ? null : file)} style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,0.4)', borderRadius: '50%', border: 'none', color: 'white', width: '24px', height: '24px' }}>⋮</button>
            {activeMenu === file && (
              <div style={{ position: 'absolute', top: '35px', right: '0', background: '#27272a', borderRadius: '12px', zIndex: 100, padding: '5px', width: '130px', border: '1px solid #333' }}>
                <button onClick={() => setItemPassword(file, false)} style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', color: '#fbbf24', padding: '10px', fontSize: '12px' }}>🔐 비번설정</button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 이미지 확대 모달 */}
      {selectedImg && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.98)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setSelectedImg(null)}>
          <img src={`${R2_URL}/${currentPath}${selectedImg}`} style={{ maxWidth: '95%', maxHeight: '85%', borderRadius: '10px' }} />
          <div style={{ marginTop: '20px', display: 'flex', gap: '15px' }} onClick={(e)=>e.stopPropagation()}>
             <button onClick={() => { if(confirm("삭제?")) fetch(WORKER_URL, { method: 'DELETE', body: JSON.stringify({ path: currentPath, fileName: selectedImg }) }).then(()=>fetchData()); setSelectedImg(null); }} style={{ background: '#ef4444', color: 'white', padding: '10px 20px', borderRadius: '10px', border: 'none', fontWeight: 'bold' }}>🗑️ 삭제</button>
             <button onClick={() => setSelectedImg(null)} style={{ background: '#333', color: 'white', padding: '10px 20px', borderRadius: '10px', border: 'none' }}>닫기</button>
          </div>
        </div>
      )}
      
      <div onClick={() => setCurrentPath("trash/")} style={{ position: 'fixed', bottom: '30px', right: '30px', width: '60px', height: '60px', background: '#18181b', borderRadius: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #27272a', cursor: 'pointer', fontSize: '24px' }}>🗑️</div>
    </div>
  );
}