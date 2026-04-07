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

  const R2_URL = "https://pub-9dc533983760465eb97ca8621cec1e08.r2.dev";
  const WORKER_URL = "https://jins-photo-list.aa841020.workers.dev";

  const t = {
    ko: { login: "관리자", logout: "로그아웃", share: "공유", pw: "비번", del: "삭제", setPw: "비번 설정", copyOk: "복사됨!", delOk: "삭제?", inputPw: "비밀번호:" },
    ja: { login: "管理者", logout: "ログアウト", share: "共有", pw: "パス", del: "削除", setPw: "パス設定", copyOk: "完了!", delOk: "削除?", inputPw: "パスワード:" },
    en: { login: "Admin", logout: "Logout", share: "Share", pw: "Pass", del: "Delete", setPw: "Set PW", copyOk: "Copied!", delOk: "Delete?", inputPw: "Password:" }
  }[lang];

  useEffect(() => {
    fetch(`${WORKER_URL}?path=${currentPath}`).then(res => res.json()).then(setItems).catch(() => {});
    const sc = localStorage.getItem('p_cfg'); if (sc) setConfig(JSON.parse(sc));
    const sl = localStorage.getItem('p_lng'); if (sl) setLang(sl);
    const sa = sessionStorage.getItem('p_ath'); if (sa) setAuth(JSON.parse(sa));
  }, [currentPath]);

  const saveConfig = (nc) => {
    setConfig(nc);
    localStorage.setItem('p_cfg', JSON.stringify(nc));
    window.location.reload(); 
  };

  return (
    <div className="min-h-screen bg-black text-white p-4 font-sans">
      {/* 상단 바 */}
      <div className="flex justify-between items-center mb-6 bg-zinc-900 p-4 rounded-3xl border border-white/10 sticky top-0 z-[100] backdrop-blur-md">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-black cursor-pointer" onClick={() => setCurrentPath("")}>JINS PHOTO</h1>
          <select value={lang} onChange={(e) => {setLang(e.target.value); localStorage.setItem('p_lng', e.target.value);}} className="bg-zinc-800 text-[10px] rounded px-1 border-none outline-none">
            <option value="ko">KR</option><option value="ja">JP</option><option value="en">EN</option>
          </select>
        </div>
        <button onClick={() => {
          if(auth.role === 'admin') { sessionStorage.removeItem('p_ath'); window.location.reload(); }
          else { if(prompt(t.inputPw) === config.masterPw) { const a = {role:'admin'}; setAuth(a); sessionStorage.setItem('p_ath', JSON.stringify(a)); }}
        }} className="bg-blue-600 px-4 py-2 rounded-2xl text-[11px] font-bold">
          {auth.role === 'admin' ? t.logout : t.login}
        </button>
      </div>

      {/* 폴더 그리드 */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-10">
        {items.folders.map(f => {
          const pk = currentPath + f;
          const isL = !!config.folderPws[pk];
          return (
            <div key={f} className="relative h-36 bg-zinc-900 rounded-[2rem] border border-zinc-800 flex flex-col items-center justify-center cursor-pointer overflow-visible">
              {isL && <div className="absolute left-5 top-5 text-blue-500">🔐</div>}
              {auth.role === 'admin' && (
                <button onClick={(e) => { e.stopPropagation(); setActiveMenu(activeMenu === f ? null : f); }} className="absolute right-4 top-2 text-2xl text-zinc-600 font-bold">⋮</button>
              )}
              <div onClick={() => {
                const pass = config.folderPws[pk];
                if (auth.role === 'admin' || !pass || prompt(t.inputPw) === pass) setCurrentPath(pk + "/");
              }} className="text-center">
                <div className="text-5xl mb-1">📂</div>
                <div className="text-[10px] font-bold text-zinc-500 uppercase">{f}</div>
              </div>
              {activeMenu === f && (
                <div className="absolute top-10 right-0 w-36 bg-zinc-800 rounded-xl z-[200] border border-zinc-700 p-1 text-[11px] shadow-2xl ring-2 ring-black">
                  <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}?path=${pk}/`); alert(t.copyOk); setActiveMenu(null); }} className="w-full p-3 text-left border-b border-zinc-700">🔗 {t.share}</button>
                  <button onClick={() => {
                    const p = prompt(t.setPw);
                    const n = {...config.folderPws}; if(p) n[pk]=p; else delete n[pk];
                    saveConfig({...config, folderPws: n});
                  }} className="w-full p-3 text-left border-b border-zinc-700">🔑 {t.pw}</button>
                  <button onClick={() => { if(confirm(t.delOk)) fetch(`${WORKER_URL}?path=${pk}/`, {method:'DELETE'}).then(()=>window.location.reload()); }} className="w-full p-3 text-left text-red-400">🗑️ {t.del}</button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 사진 그리드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {items.files.map(file => (
          <div key={file} className="relative aspect-square rounded-[2rem] overflow-hidden bg-zinc-900 border border-zinc-800 group shadow-lg">
            <img src={`${R2_URL}/${currentPath}${file}`} className="w-full h-full object-cover cursor-zoom-in" onClick={() => setSelectedImg(`${R2_URL}/${currentPath}${file}`)} loading="lazy" />
            <div className="absolute top-3 right-3 flex gap-2">
              <button onClick={() => { navigator.clipboard.writeText(`${R2_URL}/${currentPath}${file}`); alert(t.copyOk); }} className="w-9 h-9 bg-white text-black rounded-full flex items-center justify-center text-lg font-bold shadow-xl">🔗</button>
              {auth.role === 'admin' && <button onClick={() => { if(confirm(t.delOk)) fetch(`${WORKER_URL}?path=${currentPath}${file}`, {method:'DELETE'}).then(()=>window.location.reload()); }} className="w-9 h-9 bg-red-600 text-white rounded-full flex items-center justify-center text-lg font-bold shadow-xl">✕</button>}
            </div>
          </div>
        ))}
      </div>

      {/* 전체 화면 확대 */}
      {selectedImg && (
        <div className="fixed inset-0 bg-black/95 z-[1000] flex items-center justify-center p-4 cursor-zoom-out" onClick={() => setSelectedImg(null)}>
          <img src={selectedImg} className="max-w-full max-h-full object-contain rounded-xl shadow-2xl" />
        </div>
      )}
    </div>
  );
}