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
    alert("복사 완료!");
  };

  return (
    <div className="min-h-screen bg-black text-white p-4 font-sans">
      {/* 헤더 */}
      <div className="flex justify-between items-center mb-6 bg-zinc-900 p-4 rounded-3xl border border-white/10 sticky top-0 z-[100]">
        <h1 className="text-xl font-black cursor-pointer" onClick={() => setCurrentPath("")}>JINS PHOTO</h1>
        <div className="flex gap-2 text-[11px]">
          {auth.role === 'admin' ? (
            <button onClick={() => { sessionStorage.clear(); window.location.reload(); }} className="bg-zinc-800 px-4 py-2 rounded-2xl">로그아웃</button>
          ) : (
            <button onClick={() => { if(prompt("비번?") === config.masterPw) { setAuth({role:'admin'}); sessionStorage.setItem('photo_auth', JSON.stringify({role:'admin'})); window.location.reload(); }}} className="bg-zinc-800 px-4 py-2 rounded-2xl">관리자</button>
          )}
        </div>
      </div>

      {/* 폴더 그리드 */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-10">
        {items.folders.map(f => {
          const fp = currentPath + f;
          const isL = config.folderPws[fp] && config.folderPws[fp].trim() !== "";
          return (
            <div key={f} className="relative h-36 bg-zinc-900 rounded-[2.5rem] border border-zinc-800 overflow-hidden flex flex-col">
              {/* 좌상단 자물쇠 */}
              <div className="absolute left-5 top-5 text-blue-500 text-lg">{isL ? "🔐" : ""}</div>

              {/* 우상단 메뉴 (관리자 전용) */}
              {auth.role === 'admin' && (
                <button onClick={(e) => { e.stopPropagation(); setActiveFolderMenu(activeFolderMenu === f ? null : f); }} className="absolute right-4 top-2 text-2xl text-zinc-500 hover:text-white z-30">︙</button>
              )}

              {/* 폴더 본체 */}
              <div onClick={() => {
                const pass = config.folderPws[fp];
                if (auth.role === 'admin' || !pass) { setCurrentPath(fp + "/"); return; }
                if (prompt("비번:") === pass) setCurrentPath(fp + "/"); else alert("틀림!");
              }} className="flex-1 flex flex-col items-center justify-center cursor-pointer hover:bg-zinc-800">
                <div className="text-5xl mb-1">📂</div>
                <div className="text-[10px] font-bold text-zinc-500 uppercase">{f}</div>
              </div>

              {/* 통합 팝업 메뉴 */}
              {activeFolderMenu === f && (
                <div className="absolute right-3 top-10 w-40 bg-zinc-800 rounded-2xl z-[110] border border-zinc-700 shadow-2xl p-1 font-bold text-[11px]">
                  <button onClick={() => { handleShare(f, true); setActiveFolderMenu(null); }} className="w-full p-3 text-left hover:bg-zinc-700 border-b border-zinc-700">🔗 폴더 공유</button>
                  <button onClick={() => {
                    const p = prompt("외부인용 비번 설정 (공백은 해제)");
                    const nc = { ...config, folderPws: { ...config.folderPws, [fp]: p || "" } };
                    updateConfig(nc);
                  }} className="w-full p-3 text-left hover:bg-zinc-700 border-b border-zinc-700">🔑 비번 설정</button>
                  <button onClick={() => { if(confirm("삭제?")) fetch(`${WORKER_URL}?path=${fp}/`, { method: 'DELETE' }).then(() => window.location.reload()); }} className="w-full p-3 text-left text-red-400 hover:bg-red-950/50">🗑️ 삭제</button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 사진 그리드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {items.files.map(file => (
          <div key={file} className="relative aspect-square rounded-[2.5rem] overflow-hidden border border-zinc-800 bg-zinc-900 group">
            <img src={`${R2_URL}/${currentPath}${file}`} className="w-full h-full object-cover" loading="lazy" />
            <div className="absolute top-4 right-4 flex gap-2">
              <button onClick={() => handleShare(file)} className="w-10 h-10 bg-white text-black rounded-full flex items-center justify-center font-bold">🔗</button>
              {auth.role === 'admin' && (
                <button onClick={() => { if(confirm("삭제?")) fetch(`${WORKER_URL}?path=${currentPath}${file}`, { method: 'DELETE' }).then(() => window.location.reload()); }} className="w-10 h-10 bg-red-600 text-white rounded-full flex items-center justify-center font-bold">✕</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}