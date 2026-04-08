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

  // 끝에 슬래시(/)를 제거해서 경로 중복 방지
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
    } catch (e) { console.error("데이터 로드 실패:", e); }
  };

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (passInput === MASTER_PW) {
      localStorage.setItem('jins_authenticated', 'true');
      setIsLocked(false);
      fetchData();
    } else { alert("비밀번호가 틀렸습니다."); setPassInput(""); }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('path', currentPath);
    try {
      const res = await fetch(WORKER_URL, { method: 'POST', body: formData });
      if (res.ok) { alert("업로드 완료!"); fetchData(); }
    } catch (err) { alert("업로드 중 오류 발생"); }
  };

  const createFolder = async () => {
    const folderName = prompt("폴더명을 입력하세요:");
    if (!folderName) return;
    try {
      const res = await fetch(WORKER_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: currentPath, folderName })
      });
      if (res.ok) { alert("폴더가 생성되었습니다."); fetchData(); }
    } catch (err) { alert("폴더 생성 실패"); }
  };

  const deleteFile = async (fileName: string) => {
    if (!confirm(`${fileName}을 휴지통으로 보낼까요?`)) return;
    try {
      const res = await fetch(WORKER_URL, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: currentPath, fileName })
      });
      if (res.ok) { alert("휴지통으로 이동했습니다."); fetchData(); setSelectedImg(null); }
    } catch (err) { alert("삭제 오류 발생"); }
  };

  const goBack = () => {
    const paths = currentPath.split('/').filter(Boolean);
    paths.pop();
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
      <div style={{ background: '#18181b', padding: '15px', borderRadius: '25px', marginBottom: '20px', border: '1px solid #27272a' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', alignItems: 'center' }}>
          <h1 onClick={() => setCurrentPath("")} style={{ cursor: 'pointer', margin: 0, fontSize: '18px' }}>JINS <span style={{color:'#3b82f6'}}>PHOTO</span></h1>
          <div style={{ display: 'flex', gap: '8px' }}>
             <button onClick={() => setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest')} style={{ background: '#27272a', border: 'none', color: 'white', padding: '6px 10px', borderRadius: '10px', fontSize: '11px' }}>{sortOrder === 'newest' ? '↓최신' : '↑과거'}</button>
             <button onClick={() => { localStorage.removeItem('jins_authenticated'); setIsLocked(true); }} style={{ background: '#3f3f46', border: 'none', color: 'white', padding: '6px 10px', borderRadius: '10px', fontSize: '11px' }}>🔒 LOCK</button>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          {currentPath && <button onClick={goBack} style={{ flex: '0.4', background: '#3f3f46', border: 'none', color: 'white', padding: '12px', borderRadius: '15px', fontWeight: 'bold' }}>⬅️ 이전</button>}
          <label style={{ flex: 1, background: '#2563eb', color: 'white', padding: '12px', borderRadius: '15px', fontWeight: 'bold', textAlign: 'center', cursor: 'pointer' }}>
            📤 업로드
            <input type="file" onChange={handleUpload} style={{ display: 'none' }} />
          </label>
          <button onClick={createFolder} style={{ flex: 1, background: '#27272a', border: '1px solid #3f3f46', color: 'white', padding: '12px', borderRadius: '15px', fontWeight: 'bold' }}>➕ 새 폴더</button>
        </div>
      </div>

      <div style={{ color: '#71717a', fontSize: '11px', marginBottom: '15px', paddingLeft: '5px' }}>📍 {currentPath || "ROOT"}</div>

      {/* 폴더 목록 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '15px' }}>
        {items.folders.map(f => (
          <div key={f} style={{ position: 'relative' }}>
            <div onClick={() => setCurrentPath(currentPath + f + "/")} style={{ background: '#18181b', padding: '20px', borderRadius: '25px', textAlign: 'center', cursor: 'pointer', border: '1px solid #27272a' }}>
              <span style={{ fontSize: '40px' }}>📂</span>
              <div style={{ fontSize: '11px', marginTop: '10px', fontWeight: 'bold', color: '#a1a1aa' }}>{f.toUpperCase()}</div>
            </div>
            <button onClick={() => setActiveMenu(activeMenu === f ? null : f)} style={{ position: 'absolute', top: '10px', right: '15px', background: 'none', border: 'none', color: '#52525b', fontSize: '24px' }}>⋮</button>
            {activeMenu === f && (
              <div style={{ position: 'absolute', top: '40px', right: '5px', background: '#27272a', border: '1px solid #3f3f46', borderRadius: '12px', zIndex: 100, padding: '5px', width: '130px' }}>
                <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}?path=${currentPath}${f}/`); alert("폴더 링크 복사됨"); setActiveMenu(null); }} style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', color: 'white', padding: '10px', fontSize: '12px' }}>🔗 폴더 공유</button>
                <button onClick={() => deleteFile(f + "/")} style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', color: '#ef4444', padding: '10px', fontSize: '12px', borderTop: '1px solid #3f3f46' }}>🗑️ 삭제</button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 사진 목록 - 주소 결합 방식 보강 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '10px', marginTop: '20px' }}>
        {items.files.map(file => (
          <img 
            key={file} 
            src={`${R2_URL}/${currentPath}${file}`} 
            style={{ width: '100%', height: '160px', objectFit: 'cover', borderRadius: '15px', cursor: 'pointer', border: '1px solid #27272a' }} 
            onClick={() => setSelectedImg(file)} 
          />
        ))}
      </div>

      {/* 사진 확대 모달 */}
      {selectedImg && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.95)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <img src={`${R2_URL}/${currentPath}${selectedImg}`} style={{ maxWidth: '95%', maxHeight: '80%', borderRadius: '10px' }} onClick={() => setSelectedImg(null)} />
          <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
            <button onClick={() => { navigator.clipboard.writeText(`${R2_URL}/${currentPath}${selectedImg}`); alert("사진 링크 복사됨"); }} style={{ background: '#2563eb', border: 'none', color: 'white', padding: '10px 20px', borderRadius: '10px', fontWeight: 'bold' }}>🔗 링크 복사</button>
            <button onClick={() => deleteFile(selectedImg)} style={{ background: '#ef4444', border: 'none', color: 'white', padding: '10px 20px', borderRadius: '10px', fontWeight: 'bold' }}>🗑️ 삭제</button>
            <button onClick={() => setSelectedImg(null)} style={{ background: '#3f3f46', border: 'none', color: 'white', padding: '10px 20px', borderRadius: '10px', fontWeight: 'bold' }}>닫기</button>
          </div>
        </div>
      )}

      {/* 휴지통 버튼 */}
      <div onClick={() => setCurrentPath("trash/")} style={{ position: 'fixed', bottom: '30px', right: '30px', width: '60px', height: '60px', background: '#18181b', borderRadius: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #27272a', cursor: 'pointer', fontSize: '24px' }}>🗑️</div>
    </div>
  );
}