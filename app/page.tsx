"use client";
import { useState, useEffect } from 'react';

export default function PhotoArchive() {
  const [currentPath, setCurrentPath] = useState("");
  const [items, setItems] = useState({ folders: [], files: [] });
  const [auth, setAuth] = useState({ role: 'guest' });
  const [config, setConfig] = useState({ masterPw: "1234", folderPws: {} });
  const [activeFolderMenu, setActiveFolderMenu] = useState(null);

  const R2_URL = "https://pub-9dc533983760465eb97ca8621cec1e08.r2.dev";
  const WORKER_URL = "https://jins-photo-list.aa841020.workers.dev";

  useEffect(() => {
    fetch(`${WORKER_URL}?path=${currentPath}`).then(res => res.json()).then(setItems);
    const sc = localStorage.getItem('photo_config'); if (sc) setConfig(JSON.parse(sc));
    const sa = sessionStorage.getItem('photo_auth'); if (sa) setAuth(JSON.parse(sa));
  }, [currentPath]);

  const updateConfig = (nc) => {
    setConfig(nc);
    localStorage.setItem('photo_config', JSON.stringify(nc));
    window.location.reload(); 
  };

  const handleShare = (name, isFolder = false) => {
    const url = isFolder ? `${window.location.origin}?path=${currentPath}${name}/` : `${R2_URL}/${currentPath}${name}`;
    const t = document.createElement("textarea"); document.body.appendChild(t);
    t.value = url; t.select(); document.execCommand("copy"); document.body.removeChild(t);
    alert("링크가 복사되었습니다!");
  };

  return (
    <div className="min-h-screen bg-black text-white p-4 font-sans selection:bg-blue-500/30">
      {/* 1. 상단바 */}
      <div className="flex justify-between items-center mb-6 bg-zinc-900/90 p-4 rounded-3xl border border-white/10 sticky top-0 z-[100] backdrop-blur-md">
        <h1 className="text-xl font-black cursor-pointer" onClick={() => setCurrentPath("")}>JINS <span className="text-blue-500">PHOTO</span></h1>
        <div className="flex gap-2 text-[11px] font-bold">
          {auth.role === 'admin' ? (
            <>
              <label className="bg-blue-600 px-4 py-2 rounded-2xl cursor-pointer shadow-lg">📸 업로드 <input type="file" className="hidden" onChange={async (e) => {
                const file = e.target.files[0]; if (!file) return;
                const fd = new FormData(); fd.append('file', file);
                fd.append('path', currentPath + file.name);
                await fetch(WORKER_URL, { method: 'POST', body: fd }); window.location.reload();
              }} /></label>
              <button onClick={() => { sessionStorage.clear(); window.location.reload(); }} className="bg-zinc-800 px-4 py-2 rounded-2xl text-zinc-400">로그아웃</button>
            </>
          ) : (
            <button onClick={() => { if(prompt("마스터 비번?") === config.masterPw) { setAuth({role:'admin'}); sessionStorage.setItem('photo_auth', JSON.stringify({role:'admin'})); window.location.reload(); }}} className="bg-zinc-800 px-4 py-2 rounded-2xl shadow-sm">관리자</button>
          )}
        </div>
      </div>

      {/* 2. 경로 안내 */}
      <div className="mb-6 text-zinc-500 text-[10px] flex gap-2 px-2 items-center overflow-x-auto whitespace-nowrap">
        <span onClick={() => setCurrentPath("")} className="cursor-pointer hover:text-white">🏠 HOME</span>
        {currentPath.split('/').filter(Boolean).map((p, i, a) => (
          <span key={i} className="flex gap-2"><span>/</span><span onClick={() => setCurrentPath(a.slice(0, i+1).join('/') + "/")} className="cursor-pointer hover:text-white uppercase font-bold">{p}</span></span>
        ))}
      </div>

      {/* 3. 폴더 목록 */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-10">
        {items.folders.map(f => {
          const fp = currentPath + f;
          const isL = config.folderPws[fp] && config.folderPws[fp].trim() !== "";
          return (
            <div key={f} className="relative h-36 bg-zinc-900 rounded-[2.5rem] border border-zinc-800 flex flex-col group overflow-hidden shadow-xl">
              {/* [좌상단] 자물쇠 표시 */}
              <div className="absolute left-5 top-5 z-20 pointer-events-none text-blue-500 drop-shadow-lg text-lg">
                {isL ? "🔐" : ""}
              </div>

              {/* [우상단] 통합 메뉴 버튼 (관리자만 보임) */}
              {auth.role === 'admin' && (
                <button 
                  onClick={(e) => { e.stopPropagation(); setActiveFolderMenu(activeFolderMenu === f ? null : f); }}
                  className="absolute right-2 top-1 w-10 h-10 flex items-center justify-center text-zinc-500 hover:text-white z-30 text-2xl font-black"
                >︙</button>
              )}

              {/* 폴더 클릭 영역 */}
              <div onClick={() => {
                const pass = config.folderPws[fp];
                if (auth.role === 'admin' || !pass) { setCurrentPath(fp + "/"); return; }
                if (prompt("비밀번호:") === pass) setCurrentPath(fp + "/"); else alert("틀림!");
              }} className="flex-1 flex flex-col items-center justify-center pt-4 cursor-pointer hover:bg-zinc-800/50">
                <div className="text-5xl mb-2 opacity-90 drop-shadow-md">📂</div>
                <div className="text-[10px] font-bold text-zinc-500 truncate w-full px-10 text-center uppercase tracking-widest">{f}</div>
              </div>

              {/* [통합 팝업] */}
              {activeFolderMenu === f && (
                <div className="absolute right-3 top-10 w-44 bg-zinc-800 rounded-2xl z-[110] border border-zinc-700 shadow-2xl p-1 overflow-hidden">
                  <button onClick={() => { handleShare(f, true); setActiveFolderMenu(null); }} className="w-full p-4 text-[11px] text-left hover:bg-zinc-700 border-b border-zinc-700 font-bold flex items-center gap-2 text-white">🔗 폴더 주소 공유</button>
                  <button onClick={() => {
                    const p = prompt("외부인용 비번 설정 (공백은 해제)");
                    const nc = { ...config, folderPws: { ...config.folderPws, [fp]: p || "" } };
                    if (!p) delete nc.folderPws[fp];
                    updateConfig(nc);
                  }} className="w-full p-4 text-[11px] text-left hover:bg-zinc-700 border-b border-zinc-700 font-bold flex items-center gap-2 text-white">🔑 폴더 비번 설정</button>
                  <button onClick={() => { if(confirm("삭제할까요?")) fetch(`${WORKER_URL}?path=${fp}/`, { method: 'DELETE' }).then(() => window.location.reload()); }} className="w-full p-4 text-[11px] text-left text-red-400 hover:bg-red-950/50 font-bold flex items-center gap-2">🗑️ 폴더 삭제</button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 4. 사진 목록 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {items.files.map(file => (
          <div key={file} className="relative aspect-square rounded-[2.5rem] overflow-hidden border border-zinc-800 bg-zinc-900 group shadow-