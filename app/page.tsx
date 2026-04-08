"use client";
import { useState, useEffect } from 'react';

// [이미지 최적화] 긴 쪽 기준 2000px 리사이징 + WebP 변환
const processImage = (file: File): Promise<Blob> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const max_size = 2000;

        if (width > height) {
          if (width > max_size) { height *= max_size / width; width = max_size; }
        } else {
          if (height > max_size) { width *= max_size / height; height = max_size; }
        }

        canvas.width = width;
        canvas.height = height;
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

  // 데이터 로드 함수
  const fetchData = async () => {
    try {
      const res = await fetch(`${WORKER_URL}?path=${currentPath}&pw=${folderPw}`);
      const data = await res.json();
      if (data.locked) {
        const input = prompt("🔐 이 폴더는 비밀번호가 걸려있습니다:");
        if (input) setFolderPw(input); else goBack();
      } else {
        let sortedFiles = [...(data.files || [])];
        // 정렬: 파일명 기준 (보통 날짜가 포함되므로 최신순/과거순 작동)
        sortedFiles.sort((a, b) => sortOrder === 'newest' ? b.localeCompare(a) : a.localeCompare(b));
        setItems({ ...data, files: sortedFiles });
      }
    } catch (e) { console.error("데이터 로드 실패:", e); }
  };

  useEffect(() => {
    if (localStorage.getItem('jins_authenticated') === 'true') {
      setIsLocked(false);
      fetchData();
    }
  }, [currentPath, folderPw, sortOrder]);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    const mpw = localStorage.getItem('jins_master_pw') || "1234";
    if (passInput === mpw) {
      localStorage.setItem('jins_authenticated', 'true');
      setIsLocked(false);
      setTimeout(() => fetchData(), 100);
    } else {
      alert("비밀번호가 틀렸습니다.");
      setPassInput("");
    }
  };

  // 비번 설정/해제 (공백 입력 시 해제)
  const setItemPassword = async (name: string, isFolder: boolean) => {
    const pw = prompt(`${name} 비번 설정 (해제하려면 공백인 상태로 확인):`);
    const target = currentPath + name + (isFolder ? "/" : "");
    await fetch(`${WORKER_URL}/set-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target, password: pw || "" })
    });
    setTimeout(() => fetchData(), 300);
    setActiveMenu(null);
  };

  // 업로드 (2000px WebP 변환 적용)
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const processedBlob = await processImage(file);
    const newName = file.name.split('.')[0] + ".webp";

    const formData = new FormData();
    formData.append('file', processedBlob, newName);
    formData.append('path', currentPath);
    
    await fetch(WORKER_URL, { method: 'POST', body: formData });
    fetchData();
    setActiveAdminMenu(false);
  };

  // 삭제 (휴지통 이동 로직 포함)
  const deleteItem = async (name: string, isFolder: boolean) => {
    const isTrash = currentPath.startsWith("trash/");
    if (!confirm(`${name}을(를) ${isTrash ? "영구 삭제" : "휴지통으로 이동"} 하시겠습니까?`)) return;

    await fetch(WORKER_URL, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: currentPath, fileName: isFolder ? name + "/" : name })
    });
    
    fetchData();
    setActiveMenu(null);
    setSelectedImg(null);
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
      {/* 헤더 영역 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
        <h1 onClick={() => {setCurrentPath(""); setFolderPw("");}} style={{ cursor: 'pointer', margin: 0, fontSize: '22px', fontWeight: 'bold' }}>JINS <span style={{color:'#3b82f6'}}>PHOTO</span></h1>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          {/* 정렬 버튼 */}
          <button onClick={() => setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest')} style={{ background: '#18181b', border: '1px solid #27272a', color: '#a1a1aa', padding: '6px 12px', borderRadius: '10px', fontSize: '12px' }}>
            {sortOrder === 'newest' ? '↓ 최신순' : '↑ 과거순'}
          </button>
          
          <div style={{ position: 'relative' }}>
            <button onClick={() => setActiveAdminMenu(!activeAdminMenu)} style={{ background: 'none', border: 'none', color: 'white', fontSize: '24px', cursor: 'pointer' }}>•••</button>
            {activeAdminMenu && (
              <div style={{ position: 'absolute', top: '40px', right: '0', background: '#18181b', border: '1px solid #333', borderRadius: '15px', zIndex: 200, padding: '10px', width: '160px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}>
                <label style={{ display: 'block', padding: '12px', cursor: 'pointer', borderBottom: '1px solid #222', fontSize: '14px' }}>📤 사진 업로드 <input type="file" onChange={handleUpload} style={{ display: 'none' }} /></label>
                <button onClick={() => {
                  const name = prompt("새 폴더명:");
                  if(name) fetch(WORKER_URL, { method: 'PUT', body: JSON.stringify({ path: currentPath, folderName: name }) }).then(()=>fetchData());
                  setActiveAdminMenu(false);
                }} style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', color: 'white', padding: '12px', borderBottom: '1px solid #222', fontSize: '14px' }}>➕ 새 폴더</button>
                <button onClick={() => {
                  const mpw = localStorage.getItem('jins_master_pw') || "1234";
                  if(prompt("현재 비번:") === mpw) {
                    const next = prompt("새 비번:");
                    if(next) { localStorage.setItem('jins_master_pw', next); alert("관리자 비번이 변경되었습니다."); }
                  } else alert("비밀번호가 일치하지 않습니다.");
                  setActiveAdminMenu(false);
                }} style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', color: '#a1a1aa', padding: '12px', fontSize: '14px' }}>⚙️ 비번 변경</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {currentPath && <button onClick={goBack} style={{ background: '#18181b', border: '1px solid #27272a', color: 'white', padding: '8px 15px', borderRadius: '10px', marginBottom: '20px', fontSize: '13px' }}>⬅️ 뒤로가기</button>}

      {/* 폴더 리스트 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '15px' }}>
        {items.folders.map(f => {
          const isFolderLocked = items.lockedItems?.some(item => item === f || item === f + "/");
          return (
            <div key={f} style={{ position: 'relative' }}>
              <div onClick={() => setCurrentPath(currentPath + f + "/")} style={{ background: '#18181b', padding: '25px 15px', borderRadius: '25px', textAlign: 'center', border: '1px solid #27272a', cursor: 'pointer' }}>
                {isFolderLocked && <span style={{ position: 'absolute', top: '12px', left: '15px' }}>🔒</span>}
                <span style={{ fontSize: '45px' }}>📂</span>
                <div style={{ fontSize: '12px', marginTop: '10px', fontWeight: 'bold' }}>{f}</div>
              </div>
              <button onClick={() => setActiveMenu(activeMenu === f ? null : f)} style={{ position: 'absolute', top: '10px', right: '15px', background: 'none', border: 'none', color: '#555', fontSize: '20px' }}>⋮</button>
              {activeMenu === f && (
                <div style={{ position: 'absolute', top: '40px', right: '5px', background: '#27272a', borderRadius: '12px', zIndex: 100, padding: '5px', width: '150px', border: '1px solid #333' }}>
                  <button onClick={() => setItemPassword(f, true)} style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', color: '#fbbf24', padding: '10px', fontSize: '12px' }}>🔐 비번설정</button>
                  <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}?path=${currentPath}${f}/`); alert("공유 링크 복사완료!"); setActiveMenu(null); }} style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', color: 'white', padding: '10px', fontSize: '12px', borderTop: '1px solid #222' }}>🔗 링크복사</button>
                  <button onClick={() => deleteItem(f, true)} style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', color: '#ef4444', padding: '10px', fontSize: '12px', borderTop: '1px solid #222' }}>🗑️ 폴더 삭제</button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 사진 리스트 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '10px', marginTop: '20px' }}>
        {items.files.map(file => (
          <div key={file} style={{ position: 'relative' }}>
            <img src={`${R2_URL}/${currentPath}${file}`} style={{ width: '100%', height: '170px', objectFit: 'cover', borderRadius: '18px', border: '1px solid #27272a', cursor: 'pointer' }} onClick={() => setSelectedImg(file)} />
            {items.lockedItems?.includes(file) && <span style={{ position: 'absolute', top: '12px', left: '12px', textShadow: '0 0 5px black' }}>🔒</span>}
            <button onClick={() => setActiveMenu(activeMenu === file ? null : file)} style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,0.4)', borderRadius: '50%', border: 'none', color: 'white', width: '24px', height: '24px' }}>⋮</button>
            {activeMenu === file && (
              <div style={{ position: 'absolute', top: '35px', right: '0', background: '#27272a', borderRadius: '12px', zIndex: 100, padding: '5px', width: '130px', border: '1px solid #333' }}>
                <button onClick={() => setItemPassword(file, false)} style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', color: '#fbbf24', padding: '10px', fontSize: '12px' }}>🔐 비번설정</button>
                <button onClick={() => deleteItem(file, false)} style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', color: '#ef4444', padding: '10px', fontSize: '12px', borderTop: '1px solid #222' }}>🗑️ 사진 삭제</button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 확대 모달 */}
      {selectedImg && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.98)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setSelectedImg(null)}>
          <img src={`${R2_URL}/${currentPath}${selectedImg}`} style={{ maxWidth: '95%', maxHeight: '85%', borderRadius: '10px' }} />
          <div style={{ marginTop: '20px' }} onClick={(e)=>e.stopPropagation()}>
             <button onClick={() => deleteItem(selectedImg, false)} style={{ background: '#ef4444', color: 'white', padding: '12px 30px', borderRadius: '15px', border: 'none', fontWeight: 'bold', fontSize: '16px' }}>🗑️ 휴지통으로 이동</button>
          </div>
        </div>
      )}
      
      {/* 휴지통 가기 버튼 */}
      <div onClick={() => setCurrentPath("trash/")} style={{ position: 'fixed', bottom: '30px', right: '30px', width: '60px', height: '60px', background: '#18181b', borderRadius: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #27272a', cursor: 'pointer', fontSize: '24px', boxShadow: '0 5px 15px rgba(0,0,0,0.5)' }}>🗑️</div>
    </div>
  );
}