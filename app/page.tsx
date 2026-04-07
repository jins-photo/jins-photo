"use client";
import { useState, useEffect } from 'react';

export default function Page() {
  const [currentPath, setCurrentPath] = useState("");
  const [items, setItems] = useState({ folders: [], files: [] });
  const [auth, setAuth] = useState({ role: 'guest' });
  const [config, setConfig] = useState({ masterPw: "1234", folderPws: {} });
  const [activeMenu, setActiveMenu] = useState(null);
  const [lang, setLang] = useState('ko');
  const [selectedImg, setSelectedImg] = useState(null);
  const [sortOrder, setSortOrder] = useState('newest'); // 정렬 상태 추가

  const R2_URL = "https://pub-9dc533983760465eb97ca8621cec1e08.r2.dev";
  const WORKER_URL = "https://jins-photo-list.aa841020.workers.dev";

  const t = {
    ko: { login: "관리자", logout: "로그아웃", share: "공유", pw: "비번", del: "삭제", setPw: "비번 설정", copyOk: "복사됨!", delOk: "삭제?", newest: "최신순", oldest: "과거순" },
    ja: { login: "管理者", logout: "ログアウト", share: "共有", pw: "パス", del: "削除", setPw: "パス設定", copyOk: "完了!", delOk: "削除?", newest: "最新順", oldest: "古い順" },
    en: { login: "Admin", logout: "Logout", share: "Share", pw: "Pass", del: "Delete", setPw: "Set PW", copyOk: "Copied!", delOk: "Delete?", newest: "Newest", oldest: "Oldest" }
  }[lang];

  useEffect(() => {
    // 1. 데이터 호출 및 정렬 로직
    fetch(`${WORKER_URL}?path=${currentPath}`)
      .then(res => res.json())
      .then(data => {
        let sortedFiles = [...(data.files || [])];
        // 파일명(보통 날짜 기반)으로 정렬
        sortedFiles.sort((a, b) => sortOrder === 'newest' ? b.localeCompare(a) : a.localeCompare(b));
        setItems({ folders: data.folders || [], files: sortedFiles });
      })
      .catch(() => {});

    const sc = localStorage.getItem('p_cfg'); if (sc) setConfig(JSON.parse(sc));
    const sl = localStorage.getItem('p_lng'); if (sl) setLang(sl);
    const sa = sessionStorage.getItem('p_ath'); if (sa) setAuth(JSON.parse(sa));
  }, [currentPath, sortOrder]); // 정렬 바뀔 때마다 다시 실행

  const saveConfig = (nc) => {
    setConfig(nc);
    localStorage.setItem('p_cfg', JSON.stringify(nc));
    window.location.reload(); 
  };

  return (
    <div className="min-h-screen bg-black text-white p-4 font-sans selection:bg-blue-500/30">
      {/* 상단 헤더: 정렬 스위치 추가 */}
      <div className="flex justify-between items-center mb-6 bg-zinc-900/90 p-4 rounded-3xl border border-white/10 sticky top-0 z-[100] backdrop-blur-md">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-black cursor-pointer" onClick={() => setCurrentPath("")}>JINS <span className="text-blue-500">PHOTO</span></h1>
          <select value={lang} onChange={(e) => setLang(e.target.value)} className="bg-zinc-800 text-[10px] rounded px-1 border-none text-white outline-none">
            <option value="ko">KR</option><option value="ja">JP</option><option value="en">EN</option>
          </select>
          {/* 정렬 버튼 */}
          <button 
            onClick={() => setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest')}
            className="text-[10px] bg-zinc-800 px-2 py-1 rounded-lg border border-zinc-700 font-bold hover:bg-zinc-700"
          >
            {sortOrder === 'newest' ? `↓ ${t.newest}` : `↑ ${t.oldest}`}
          </button>
        </div>
        <button onClick={() => {
          if(auth.role === 'admin') { sessionStorage.removeItem('p_ath'); window.location.reload(); }
          else { if(prompt("PW:") === config.masterPw) { const a = {role:'admin'}; setAuth(a); sessionStorage.setItem('p_ath', JSON.stringify(a)); }}
        }} className="bg-blue-600 px-4 py-2 rounded-2xl text-[11px] font-bold shadow-lg">
          {auth.role === 'admin' ? t.logout : t.login}
        </button>
      </div>

      {/* 폴더 리스트 (관리자용 ... 버튼 포함) */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-10">
        {items.folders.map(f => {
          const pk = currentPath + f;
          const isL = !!config.folderPws[pk];
          return (
            <div key={f} className="relative h-40 bg-zinc-900 rounded-[2.5rem] border border-zinc-800 flex flex-col items-center justify-center cursor-pointer hover:border-zinc-700 transition-all group overflow-visible">
              {isL && <div className="absolute left-6 top-6 text-blue-500 text-xl z-10">🔐</div>}
              {auth.role === 'admin' && (
                <button onClick={(e) => { e.stopPropagation(); setActiveMenu(activeMenu === f ? null : f); }} className="absolute right-5 top-3 text-3xl text-zinc-600 hover:text-white z-50">⋮</button>
              )}
              <div onClick={() => {
                const pass = config.folderPws[pk];
                if (auth.role === 'admin' || !pass || prompt("Password:") === pass) setCurrentPath(pk + "/");
              }} className="text-center w-full h-full flex flex-col items-center justify-center">
                <div className="text-6xl mb-2 group-hover:scale-110 transition-transform">📂</div>
                <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{f}</div>
              </div>
              
              {/* 관리자 팝업 메뉴 (...) */}
              {activeMenu === f && (
                <div className="absolute top-12 right-0 w-40 bg-zinc-800 rounded-2xl z-[200] border border-zinc-700 shadow-2xl p-1 text-[12px] font-bold ring-4 ring-black/50">
                  <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}?path=${pk}/`); alert(t.copyOk); setActiveMenu(null); }} className="w-full p-4 text-left border-b border-zinc-700 hover:bg-zinc-700">🔗 {t.share}</button>
                  <button onClick={() => {
                    const p = prompt(t.setPw);
                    const n = {...config.folderPws}; if(p) n[pk]=p; else delete n[pk];
                    saveConfig({...config, folderPws: n});
                  }} className="w-full p-4 text-left border-b border-zinc-700 hover:bg-zinc-700">🔑 {t.pw}</button>
                  <button onClick={() => { if(confirm(t.delOk)) fetch(`${WORKER_URL}?path=${pk}/`, {method:'DELETE'}).then(()=>window.location.reload()); }} className="w-full p-4 text-left text-red-400 hover:bg-red-950">🗑️ {t.del}</button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 사진 리스트 (최신순 정렬 반영) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {items.files.map(file => (
          <div key={file} className="relative aspect-square rounded-[2.5rem] overflow-hidden bg-zinc-900 border border-zinc-800 shadow-lg group">
            <img src={`${R2_URL}/${currentPath}${file}`} className="w-full h-full object-cover cursor-zoom-in transition-transform group-hover:scale-105" onClick={() => setSelectedImg(`${R2_URL}/${currentPath}${file}`)} loading="lazy" />
            <div className="absolute top-4 right-4 flex gap-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => { navigator.clipboard.writeText(`${R2_URL}/${currentPath}${file}`); alert(t.copyOk); }} className="w-11 h-11 bg-white/90 text-black rounded-full text-xl flex items-center justify-center font-bold shadow-xl">🔗</button>
              {auth.role === 'admin' && <button onClick={() => { if(confirm(t.delOk)) fetch(`${WORKER_URL}?path=${currentPath}${file}`, {method:'DELETE'}).then(()=>window.location.reload()); }} className="w-11 h-11 bg-red-600 text-white rounded-full text-xl flex items-center justify-center font-bold shadow-xl">✕</button>}
            </div>
          </div>
        ))}
      </div>

      {/* 확대 모달 */}
      {selectedImg && (
        <div className="fixed inset-0 bg-black/95 z-[1000] flex items-center justify-center p-4 cursor-zoom-out" onClick={() => setSelectedImg(null)}>
          <img src={selectedImg} className="max-w-full max-h-full object-contain rounded-xl shadow-2xl animate-in zoom-in duration-200" />
          <button className="absolute top-8 right-8 text-white text-5xl font-thin">&times;</button>
        </div>
      )}
    </div>
  );
}