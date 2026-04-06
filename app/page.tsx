"use client";
import { useState, useEffect } from 'react';
import { Lock, MoreVertical, Share2, Trash2, X, Upload, Home, LogOut, Key } from 'lucide-react';

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
    navigator.clipboard.writeText(url).then(() => alert("주소가 복사되었습니다!"));
  };

  return (
    <div className="min-h-screen bg-black text-white p-4 font-sans selection:bg-blue-500/30">
      {/* 헤더 */}
      <div className="flex justify-between items-center mb-6 bg-zinc-900/90 p-4 rounded-3xl border border-white/10 sticky top-0 z-[100] backdrop-blur-md">
        <h1 className="text-xl font-black cursor-pointer flex items-center gap-2" onClick={() => setCurrentPath("")}>
          JINS <span className="text-blue-500">PHOTO</span>
        </h1>
        <div className="flex gap-2">
          {auth.role === 'admin' ? (
            <>
              <label className="bg-blue-600 px-4 py-2 rounded-2xl text-[11px] font-bold cursor-pointer flex items-center gap-1 shadow-lg">
                <Upload size={14} /> 업로드 <input type="file" className="hidden" onChange={async (e) => {
                  const file = e.target.files[0]; if (!file) return;
                  const fd = new FormData(); fd.append('file', file);
                  fd.append('path', currentPath + file.name);
                  await fetch(WORKER_URL, { method: 'POST', body: fd }); window.location.reload();
                }} />
              </label>
              <button onClick={() => { sessionStorage.clear(); window.location.reload(); }} className="bg-zinc-800 px-4 py-2 rounded-2xl text-[11px] font-bold flex items-center gap-1"><LogOut size={14}/> 로그아웃</button>
            </>
          ) : (
            <button onClick={() => { if(prompt("마스터 비번?") === config.masterPw) { setAuth({role:'admin'}); sessionStorage.setItem('photo_auth', JSON.stringify({role:'admin'})); window.location.reload(); }}} className="bg-zinc-800 px-4 py-2 rounded-2xl text-[11px] font-bold">관리자 로그인</button>
          )}
        </div>
      </div>

      {/* 경로 안내 */}
      <div className="mb-6 text-zinc-500 text-[11px] flex gap-2 px-2 items-center overflow-x-auto">
        <Home size={12} onClick={() => setCurrentPath("")} className="cursor-pointer hover:text-white" />
        {currentPath.split('/').filter(Boolean).map((p, i, a) => (
          <span key={i} className="flex gap-2 items-center uppercase tracking-tighter">
            <span>/</span>
            <span onClick={() => setCurrentPath(a.slice(0, i+1).join('/') + "/")} className="cursor-pointer hover:text-white">{p}</span>
          </span>
        ))}
      </div>

      {/* 폴더 그리드 */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-10">
        {items.folders.map(f => {
          const fp = currentPath + f;
          const isLocked = config.folderPws[fp] && config.folderPws[fp].trim() !== "";
          return (
            <div key={f} className="relative h-36 bg-zinc-900 rounded-[2.5rem] border border-zinc-800 overflow-hidden flex flex-col group transition-all hover:border-zinc-700">
              
              {/* [좌상단] 자물쇠 아이콘 */}
              <div className="absolute left-5 top-5 z-20 pointer-events-none">
                {isLocked && <Lock size={16} className="text-blue-500 drop-shadow-lg" />}
              </div>

              {/* [우상단] 통합 메뉴 버튼 (관리자 전용) */}
              {auth.role === 'admin' && (
                <button 
                  onClick={(e) => { e.stopPropagation(); setActiveFolderMenu(activeFolderMenu === f ? null : f); }}
                  className="absolute right-3 top-3 w-10 h-10 flex items-center justify-center text-zinc-500 hover:text-white z-30 transition-colors"
                >
                  <MoreVertical size={20} />
                </button>
              )}

              {/* 폴더 클릭 영역 */}
              <div onClick={() => {
                const pass = config.folderPws[fp];
                if (auth.role === 'admin' || !pass) { setCurrentPath(fp + "/"); return; }
                if (prompt("비밀번호:") === pass) setCurrentPath(fp + "/"); else alert("틀림!");
              }} className="flex-1 flex flex-col items-center justify-center pt-4 cursor-pointer hover:bg-zinc-800/50">
                <div className="text-5xl mb-2 opacity-80">📂</div>
                <div className="text-[10px] font-bold text-zinc-400 truncate w-full px-10 text-center uppercase tracking-widest">{f}</div>
              </div>

              {/* [통합 팝업] 공유 + 비번 + 삭제 */}
              {activeFolderMenu === f && (
                <div className="absolute right-3 top-12 w-44 bg-zinc-800 rounded-2xl z-[110] border border-zinc-700 shadow-2xl p-1 animate-in fade-in zoom-in duration-150">
                  <button onClick={() => { handleShare(f, true); setActiveFolderMenu(null); }} className="w-full p-3 text-[11px] text-left hover:bg-zinc-700 rounded-xl flex items-center gap-2 font-bold">
                    <Share2 size={14} className="text-blue-400" /> 🔗 폴더 주소 공유
                  </button>
                  <button onClick={() => {
                    const p = prompt("외부인용 비번 설정 (공백은 해제)");
                    const nc = { ...config, folderPws: { ...config.folderPws, [fp]: p || "" } };
                    if (!p) delete nc.folderPws[fp];
                    updateConfig(nc);
                  }} className="w-full p-3 text-[11px] text-left hover:bg-zinc-700 rounded-xl flex items-center gap-2 font-bold">
                    <Key size={14} className="text-yellow-400" /> 🔑 폴더 비번 설정
                  </button>
                  <div className="h-[1px] bg-zinc-700 my-1 mx-2"></div>
                  <button onClick={() => { if(confirm("폴더를 삭제할까요?")) fetch(`${WORKER_URL}?path=${fp}/`, { method: 'DELETE' }).then(() => window.location.reload()); }} className="w-full p-3 text-[11px] text-left text-red-400 hover:bg-red-950/50 rounded-xl flex items-center gap-2 font-bold">
                    <Trash2 size={14} /> 🗑️ 폴더 삭제
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 사진 그리드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {items.files.map(file => (
          <div key={file} className="relative aspect-square rounded-[2.5rem] overflow-hidden border border-zinc-800 bg-zinc-900 group shadow-lg">
            <img src={`${R2_URL}/${currentPath}${file}`} className="w-full h-full object-cover transition-transform group-hover:scale-105" loading="lazy" />
            
            {/* 사진 위 버튼: 공유는 항상 보이고, 삭제는 관리자만 */}
            <div className="absolute top-4 right-4 flex gap-2 z-20">
              <button onClick={() => handleShare(file)} className="w-10 h-10 bg-white text-black rounded-full flex items-center justify-center shadow-xl hover:scale-110 transition-transform" title="사진 공유">
                <Share2 size={18} />
              </button>
              {auth.role === 'admin' && (
                <button onClick={() => { if(confirm("사진을 삭제할까요?")) fetch(`${WORKER_URL}?path=${currentPath}${file}`, { method: 'DELETE' }).then(() => window.location.reload()); }} className="w-10 h-10 bg-red-600 text-white rounded-full flex items-center justify-center shadow-xl hover:bg-red-500">
                  <X size={20} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}