"use client";
import { useState, useEffect } from 'react';

export default function PhotoArchive() {
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
    ko: { login: "관리자", logout: "로그아웃", share: "공유", pw: "비번", del: "삭제", setPw: "비번 설정", copyOk: "복사 완료!", delOk: "삭제하시겠습니까?", inputPw: "비밀번호를 입력하세요:" },
    ja: { login: "管理者", logout: "ログアウト", share: "共有", pw: "パス", del: "削除", setPw: "パス設定", copyOk: "コピー完了!", delOk: "削除しますか?", inputPw: "パスワードを入力してください:" },
    en: { login: "Admin", logout: "Logout", share: "Share", pw: "Pass", del: "Delete", setPw: "Set PW", copyOk: "Copied!", delOk: "Confirm Delete?", inputPw: "Enter Password:" }
  }[lang];

  useEffect(() => {
    // 데이터 로딩
    fetch(`${WORKER_URL}?path=${currentPath}`)
      .then(res => res.json())
      .then(data => { if(data.folders || data.files) setItems(data); })
      .catch(err => console.error("Worker 연결 실패:", err));

    // 설정 및 언어 로딩 (LocalStorage)
    const sc = localStorage.getItem('photo_config'); if (sc) setConfig(JSON.parse(sc));
    const sl = localStorage.getItem('photo_lang'); if (sl) setLang(sl);
    
    // 로그인 유지 (SessionStorage - 브라우저 끄기 전까지)
    const sa = sessionStorage.getItem('photo_auth'); if (sa) setAuth(JSON.parse(sa));
  }, [currentPath]);

  const saveConfig = (nc) => {
    setConfig(nc);
    localStorage.setItem('photo_config', JSON.stringify(nc));
    window.location.reload(); 
  };

  const copyLink = (name, isFolder = false) => {
    const url = isFolder ? `${window.location.origin}?path=${currentPath}${name}/` : `${R2_URL}/${currentPath}${name}`;
    navigator.clipboard.writeText(url).then(() => alert(t.copyOk));
    setActiveMenu(null);
  };

  return (
    <div className="min-h-screen bg-black text-white p-4 font-sans selection:bg-blue-500/30">
      {/* 헤더 */}
      <div className="flex justify-between items-center mb-6 bg-zinc-900/90 p-4 rounded-3xl border border-white/10 sticky top-0 z-[100] backdrop-blur-md shadow-2xl">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-black cursor-pointer" onClick={() => setCurrentPath("")}>JINS <span className="text-blue-500">PHOTO</span></h1>
          <select value={lang} onChange={(e) => {setLang(e.target.value); localStorage.setItem('photo_lang', e.target.value);}} className="bg-zinc-800 text-[10px] font-bold border border-zinc-700 rounded-lg px-2 py-1 outline-none">
            <option value="ko">KR</option><option value="ja">JP</option><option value="en">EN</option>
          </select>
        </div>
        <button onClick={() => {
          if(auth.role === 'admin') { sessionStorage.removeItem('photo_auth'); window.location.reload(); }
          else { 
            const pw = prompt(t.inputPw);
            if(pw === config.masterPw) { 
              const a = {role:'admin'}; setAuth(a); 
              sessionStorage.setItem('photo_auth', JSON.stringify(a)); 
            } else if(pw !== null) { alert("Error!"); }
          }
        }} className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-2xl text-[11px] font-bold transition-colors">
          {auth.role === 'admin' ? t.logout : t.login}
        </button>
      </div>

      {/* 폴더 구역 */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-10">
        {items.folders.map(f => {
          const pathKey = currentPath + f;
          const isL = !!config.folderPws[pathKey];
          return (
            <div key={f} className="relative h-40 bg-zinc-900 rounded-[2.5rem] border border-zinc-800 flex flex-col items-center justify-center cursor-pointer hover:border-zinc-600 transition-all shadow-xl group">
              {isL && <div className="absolute left-6 top-6 text-blue-500 text-xl">🔐</div>}
              {auth.role === 'admin' && (
                <button onClick={(e) => { e.stopPropagation(); setActiveMenu(activeMenu === f ? null : f); }} className="absolute right-5 top-3 text-3xl text-zinc-600 hover:text-white z-50">⋮</button>
              )}
              <div onClick={() => {
                const pass = config.folderPws[pathKey];
                if (auth.role === 'admin' || !pass || prompt(t.inputPw) === pass) setCurrentPath(pathKey + "/");
              }} className="text-center w-full h-full flex flex-col items-center justify-center">
                <div className="text-6xl mb-2 group-hover:scale-110 transition-transform">📂</div>
                <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{f}</div>
              </div>
              {activeMenu === f && (
                <div className="absolute top-12 right-2 w-40 bg-zinc-800 rounded-2xl z-[150] border border-zinc-700 shadow-2xl p-1 text-[12px] font-bold">
                  <button onClick={() => copyLink(f, true)} className="w-full p-4 text-left border-b border-zinc-700 hover:bg-zinc-700 rounded-t-xl">🔗 {t.share}</button>
                  <button onClick={() => {
                    const p = prompt(t.setPw);
                    const n = {...config.folderPws}; if(p) n[pathKey]=p; else delete n[pathKey];
                    saveConfig({...config, folderPws: n});
                  }} className="w-full p-4 text-left border-b border-zinc-700 hover:bg-zinc-700">🔑 {t.pw}</button>
                  <button onClick={() => { if(confirm(t.delOk)) fetch(`${WORKER_URL}?path=${pathKey}/`, {method:'DELETE'}).then(()=>window.location.reload()); }} className="w-full p-4 text-left text-red-400 hover:bg-red-950 rounded-b-xl">🗑️ {t.del}</button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 사진 구역 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {items.files.map(file => (
          <div key={file} className="relative aspect-square rounded-[2.5rem] overflow-hidden bg-zinc-900 border border-zinc-800 shadow-lg group">
            <img 
              src={`${R2_URL}/${currentPath}${file}`} 
              className="w-full h-full object-cover cursor-zoom-in transition-transform group-hover:scale-105" 
              loading="lazy"
              onClick={() => setSelectedImg(`${R2_URL}/${currentPath}${file}`)} 
            />
            <div className="absolute top-4 right-4 flex gap-2 z-20">
              <button onClick={() => copyLink(file)} className="w-11 h-11 bg-white/90 text-black rounded-full text-xl flex items-center justify-center font-bold shadow-xl hover:scale-110 transition-transform">🔗</button>
              {auth.role === 'admin' && <button onClick={() => { if(confirm(t.delOk)) fetch(`${WORKER_URL}?path=${currentPath}${file}`, {method:'DELETE'}).then(()=>window.location.reload()); }} className="w-11 h-11 bg-red-600 text-white rounded-full text-xl flex items-center justify-center font-bold shadow-xl hover:scale-110 transition-transform">✕</button>}
            </div>
          </div>
        ))}
      </div>

      {/* 전체화면 모달 */}
      {selectedImg && (
        <div className="fixed inset-0 bg-black/95 z-[1000] flex items-center justify-center p-4" onClick={() => setSelectedImg(null)}>
          <img src={selectedImg} className="max-w-full max-h-full object-contain rounded-xl shadow-2xl animate-in zoom-in duration-200" />
          <button className="absolute top-8 right-8 text-white text-5xl font-thin hover:rotate-90 transition-transform">&times;</button>
        </div>
      )}
    </div>
  );
}