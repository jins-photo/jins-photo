"use client";
import { useState, useEffect } from 'react';

export default function Page() {
  const [isLocked, setIsLocked] = useState(true);
  const [passInput, setPassInput] = useState("");
  const [currentPath, setCurrentPath] = useState("");
  const [folderPw, setFolderPw] = useState(""); 
  const [items, setItems] = useState({ folders: [], files: [], locked: false, lockedFolders: [] as string[] });
  const [selectedImg, setSelectedImg] = useState<string | null>(null);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [activeAdminMenu, setActiveAdminMenu] = useState(false);
  const [sortOrder, setSortOrder] = useState('newest');

  const R2_URL = "https://pub-9dc533983760465eb97ca8621cec1e08.r2.dev";
  const WORKER_URL = "https://jins-photo-list.aa841020.workers.dev";

  useEffect(() => {
    const auth = localStorage.getItem('jins_authenticated');
    if (auth === 'true') {
      setIsLocked(false);
      fetchData();
    }
  }, [currentPath, folderPw, sortOrder]);

  const fetchData = async () => {
    try {
      const res = await fetch(`${WORKER_URL}?path=${currentPath}&pw=${folderPw}`);
      const data = await res.json();
      
      if (data.locked) {
        const input = prompt("🔐 이 폴더는 비밀번호가 걸려있습니다:");
        if (input) setFolderPw(input);
        else goBack();
      } else {
        let sortedFiles = [...(data.files || [])];
        sortedFiles.sort((a, b) => sortOrder === 'newest' ? b.localeCompare(a) : a.localeCompare(b));
        setItems({ ...data, files: sortedFiles });
      }
    } catch (e) { console.error(e); }
  };

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    const masterPw = localStorage.getItem('jins_master_pw') || "1234";
    if (passInput === masterPw) {
      localStorage.setItem('jins_authenticated', 'true');
      setIsLocked(false);
    } else { alert("비밀번호 오류"); setPassInput(""); }
  };

  const changeMasterPw = () => {
    const masterPw = localStorage.getItem('jins_master_pw') || "1234";
    const current = prompt("현재 관리자 비밀번호:");
    if (current !== masterPw) return alert("틀렸습니다.");
    const next = prompt("새 비밀번호:");
    if (next) {
      localStorage.setItem('jins_master_pw', next);
      alert("변경 완료");
    }
    setActiveAdminMenu(false);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('path', currentPath);
    await fetch(WORKER_URL, { method: 'POST', body: formData });
    fetchData();
    setActiveAdminMenu(false);
  };

  const createFolder = async () => {
    const name = prompt("새 폴더 이름:");
    if (!name) return;
    await fetch(WORKER_URL, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: currentPath, folderName: name })
    });
    fetchData();
    setActiveAdminMenu(false);
  };

  const setServerPassword = async (folder: string) => {
    const pw = prompt(`${folder} 지인용 비번 (해제는 공백):`);
    await fetch(`${WORKER_URL}/set-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: currentPath + folder + "/", password: pw })
    });
    fetchData();
    setActiveMenu(null);
  };

  const deleteFile = async (fileName: string) => {
    if (!confirm("삭제하시겠습니까?")) return;
    await fetch(WORKER_URL, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: currentPath, fileName })
    });
    fetchData();
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
          <input type="password" value={passInput} onChange={(e)=>setPassInput(e.target.value)} placeholder="Password" style={{ background: 'black', border: '1px solid #3f3f46', color: 'white', padding: '12px', borderRadius: '10px', width: '200px', textAlign: 'center' }} autoFocus />
        </form>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: 'black', minHeight: '100vh', color: 'white', padding: '20px', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
        <h1 onClick={() => {setCurrentPath(""); setFolderPw("");}} style={{ cursor: 'pointer', margin: 0, fontSize: '22px', fontWeight: 'bold' }}>JINS <span style={{color:'#3b82f6'}}>PHOTO</span></h1>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <button onClick={() => setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest')} style={{ background: '#18181b', border: '1px solid #27272a', color: '#a1a1aa', padding: '6px 12px', borderRadius: '10px', fontSize: '12px' }}>
            {sortOrder === 'newest' ? '↓ 최신' : '↑ 과거'}
          </button>
          
          <div style={{ position: 'relative' }}>
            <button onClick={() => setActiveAdminMenu(!activeAdminMenu)} style={{ background: 'none', border: 'none', color: 'white', fontSize: '24px', cursor: 'pointer', letterSpacing: '2px' }}>•••</button>
            {activeAdminMenu && (
              <div style={{ position: 'absolute', top: '35px', right: '0', background: '#18181b', border: '1px solid #27272a', borderRadius: '15px', padding: '8px', width: '160px', zIndex: 200, boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}>
                <label style={{ display: 'block', padding: '12px', cursor: 'pointer', fontSize: '14px', borderBottom: '1px solid #27272a' }}>
                  📤 사진 업로드
                  <input type="file" onChange={handleUpload} style={{ display: 'none' }} />
                </label>
                <button onClick={createFolder} style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', color: 'white', padding: '12px', fontSize: '14px', borderBottom: '1px solid #27272a' }}>➕ 새 폴더 생성</button>
                <button onClick={changeMasterPw} style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', color: '#a1a1aa', padding: '12px', fontSize: '14px' }}>⚙️ 관리자 비번변경</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {currentPath && <button onClick={goBack} style={{ background: '#18181b', border: '1px solid #27272a', color: 'white', padding: '10px 20px', borderRadius: '12px', marginBottom: '20px', fontWeight: 'bold', fontSize: '14px' }}>⬅️ 뒤로가기</button>}

      {/* 폴더 그리드 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '15px' }}>
        {items.folders.map(f => (
          <div key={f} style={{ position: 'relative' }}>
            <div onClick={() => setCurrentPath(currentPath + f + "/")} style={{ background: '#18181b', padding: '25px 15px', borderRadius: '25px', textAlign: 'center', cursor: 'pointer', border: '1px solid #27272a', position: 'relative' }}>
              {/* 열쇠 마크 (비번 걸린 폴더만 표시) - Worker에서 lockedFolders 정보를 준다고 가정 */}
              {(items as any).lockedFolders?.includes(f) && (
                <span style={{ position: 'absolute', top: '12px', left: '15px', fontSize: '14px' }}>🔒</span>
              )}
              <span style={{ fontSize: '45px' }}>📂</span>
              <div style={{ fontSize: '12px', marginTop: '12px', fontWeight: '600', color: '#e4e4e7', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f}</div>
            </div>
            <button onClick={() => setActiveMenu(activeMenu === f ? null : f)} style={{ position: 'absolute', top: '10px', right: '15px', background: 'none', border: 'none', color: '#52525b', fontSize: '20px' }}>⋮</button>
            {activeMenu === f && (
              <div style={{ position: 'absolute', top: '40px', right: '5px', background: '#27272a', border: '1px solid #3f3f46', borderRadius: '12px', zIndex: 100, padding: '5px', width: '140px' }}>
                <button onClick={() => setServerPassword(f)} style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', color: '#fbbf24', padding: '10px', fontSize: '12px' }}>🔐 지인 비번설정</button>
                <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}?path=${currentPath}${f}/`); alert("공유 링크 복사!"); setActiveMenu(null); }} style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', color: 'white', padding: '10px', fontSize: '12px', borderTop: '1px solid #3f3f46' }}>🔗 공유 링크 복사</button>
                <button onClick={() => deleteFile(f + "/")} style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', color: '#ef4444', padding: '10px', fontSize: '12px', borderTop: '1px solid #3f3f46' }}>🗑️ 폴더 삭제</button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 사진 그리드 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '10px', marginTop: '20px' }}>
        {items.files.map(file => (
          <img key={file} src={`${R2_URL}/${currentPath}${file}`} style={{ width: '100%', height: '170px', objectFit: 'cover', borderRadius: '18px', cursor: 'pointer', border: '1px solid #27272a' }} onClick={() => setSelectedImg(file)} />
        ))}
      </div>

      {/* 이미지 확대 */}
      {selectedImg && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.98)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setSelectedImg(null)}>
          <img src={`${R2_URL}/${currentPath}${selectedImg}`} style={{ maxWidth: '95%', maxHeight: '80%', borderRadius: '10px' }} />
          <div style={{ marginTop: '25px', display: 'flex', gap: '15px' }} onClick={(e) => e.stopPropagation()}>
            <button onClick={() => { navigator.clipboard.writeText(`${R2_URL}/${currentPath}${selectedImg}`); alert("복사!"); }} style={{ background: '#2563eb', border: 'none', color: 'white', padding: '12px 25px', borderRadius: '15px', fontWeight: 'bold' }}>🔗 링크 복사</button>
            <button onClick={() => deleteFile(selectedImg)} style={{ background: '#ef4444', border: 'none', color: 'white', padding: '12px 25px', borderRadius: '15px', fontWeight: 'bold' }}>🗑️ 삭제</button>
          </div>
        </div>
      )}
      
      <div onClick={() => setCurrentPath("trash/")} style={{ position: 'fixed', bottom: '30px', right: '30px', width: '60px', height: '60px', background: '#18181b', borderRadius: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #27272a', cursor: 'pointer', fontSize: '24px', boxShadow: '0 5px 15px rgba(0,0,0,0.5)' }}>🗑️</div>
    </div>
  );
}