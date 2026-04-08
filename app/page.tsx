"use client";
import { useState, useEffect } from 'react';

// 이미지 처리 함수 (기존과 동일)
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

  useEffect(() => {
    if (localStorage.getItem('jins_authenticated') === 'true') {
      setIsLocked(false);
      fetchData();
    }
  }, [currentPath, folderPw, sortOrder]);

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
        setItems(data);
      }
    } catch (e) { console.error(e); }
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
        <form onSubmit={(e)=>{
          e.preventDefault();
          const mpw = localStorage.getItem('jins_master_pw') || "1234";
          if(passInput === mpw) { setIsLocked(false); localStorage.setItem('jins_authenticated', 'true'); }
          else alert("오류");
        }} style={{ textAlign: 'center' }}>
          <h2>🔐 JINS PHOTO</h2>
          <input type="password" value={passInput} onChange={(e)=>setPassInput(e.target.value)} style={{ background: 'black', border: '1px solid #333', color: 'white', padding: '10px', textAlign: 'center' }} autoFocus />
        </form>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: 'black', minHeight: '100vh', color: 'white', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 onClick={() => {setCurrentPath(""); setFolderPw("");}} style={{ cursor: 'pointer' }}>JINS <span style={{color:'#3b82f6'}}>PHOTO</span></h1>
        <button onClick={() => setActiveAdminMenu(!activeAdminMenu)} style={{ background: 'none', border: 'none', color: 'white', fontSize: '24px' }}>•••</button>
        {activeAdminMenu && (
          <div style={{ position: 'absolute', top: '60px', right: '20px', background: '#18181b', border: '1px solid #333', borderRadius: '15px', zIndex: 200, padding: '10px' }}>
            <label style={{ display: 'block', padding: '10px', cursor: 'pointer' }}>📤 업로드 <input type="file" onChange={handleUpload} style={{ display: 'none' }} /></label>
            <button onClick={() => {
              const name = prompt("폴더명:");
              if(name) fetch(WORKER_URL, { method: 'PUT', body: JSON.stringify({ path: currentPath, folderName: name }) }).then(()=>fetchData());
              setActiveAdminMenu(false);
            }} style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', color: 'white', padding: '10px' }}>➕ 새 폴더</button>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '15px' }}>
        {items.folders.map(f => (
          <div key={f} style={{ position: 'relative' }}>
            <div onClick={() => setCurrentPath(currentPath + f + "/")} style={{ background: '#18181b', padding: '25px 15px', borderRadius: '25px', textAlign: 'center', border: '1px solid #27272a' }}>
              {items.lockedItems?.includes(f + "/") && <span style={{ position: 'absolute', top: '10px', left: '15px' }}>🔒</span>}
              <span style={{ fontSize: '40px' }}>📂</span>
              <div style={{ fontSize: '12px', marginTop: '10px' }}>{f}</div>
            </div>
            <button onClick={() => setActiveMenu(activeMenu === f ? null : f)} style={{ position: 'absolute', top: '10px', right: '10px', background: 'none', border: 'none', color: '#555' }}>⋮</button>
            {activeMenu === f && (
              <div style={{ position: 'absolute', top: '40px', right: '0', background: '#222', borderRadius: '10px', zIndex: 10, padding: '5px' }}>
                <button onClick={() => setItemPassword(f, true)} style={{ color: '#fbbf24', padding: '10px', background: 'none', border: 'none', fontSize: '12px' }}>🔐 비번설정</button>
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '10px', marginTop: '20px' }}>
        {items.files.map(file => (
          <div key={file} style={{ position: 'relative' }}>
            <img src={`${R2_URL}/${currentPath}${file}`} style={{ width: '100%', height: '160px', objectFit: 'cover', borderRadius: '15px' }} onClick={() => setSelectedImg(file)} />
            {items.lockedItems?.includes(file) && <span style={{ position: 'absolute', top: '10px', left: '10px', textShadow: '0 0 5px black' }}>🔒</span>}
            <button onClick={() => setActiveMenu(activeMenu === file ? null : file)} style={{ position: 'absolute', top: '5px', right: '5px', background: 'rgba(0,0,0,0.5)', borderRadius: '50%', color: 'white', border: 'none' }}>⋮</button>
            {activeMenu === file && (
              <div style={{ position: 'absolute', top: '30px', right: '0', background: '#222', borderRadius: '10px', zIndex: 10, padding: '5px' }}>
                <button onClick={() => setItemPassword(file, false)} style={{ color: '#fbbf24', padding: '10px', background: 'none', border: 'none', fontSize: '12px' }}>🔐 비번설정</button>
              </div>
            )}
          </div>
        ))}
      </div>

      {selectedImg && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.95)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setSelectedImg(null)}>
          <img src={`${R2_URL}/${currentPath}${selectedImg}`} style={{ maxWidth: '95%', maxHeight: '80%' }} />
          <div style={{ marginTop: '20px' }}>
            <button onClick={() => {
               if(confirm("삭제?")) fetch(WORKER_URL, { method: 'DELETE', body: JSON.stringify({ path: currentPath, fileName: selectedImg }) }).then(()=>fetchData());
            }} style={{ background: 'red', color: 'white', padding: '10px 20px', borderRadius: '10px', border: 'none' }}>🗑️ 삭제</button>
          </div>
        </div>
      )}
    </div>
  );
}