'use client'
import { useState, useEffect } from 'react';

const R2_PUBLIC_URL = "https://pub-9dc533983760465eb97ca8621cec1e08.r2.dev";
const WORKER_URL = "https://jins-photo-list.aa841020.workers.dev";

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [auth, setAuth] = useState<{role:string, allowedPath?:string} | null>(null);
  const [currentPath, setCurrentPath] = useState("");
  const [items, setItems] = useState({ folders: [], photos: [] });
  const [pw, setPw] = useState('');
  const [config, setConfig] = useState({ adminPw: '', folderPws: {} as any });
  const [loading, setLoading] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [activeFolderMenu, setActiveFolderMenu] = useState<string | null>(null);

  useEffect(() => { setMounted(true); }, []);

  const handleLogin = async () => {
    const res = await fetch(`${WORKER_URL}?action=login`, { method: 'POST', body: JSON.stringify({ password: pw }) });
    if (res.ok) setAuth(await res.json()); else alert("비밀번호가 틀렸습니다.");
  };

  const loadData = async () => {
    if (!auth || !mounted) return;
    setLoading(true);
    const res = await fetch(`${WORKER_URL}?prefix=${currentPath}&role=${auth.role}&allowedPath=${auth.allowedPath || ''}`);
    setItems(await res.json());
    if (auth.role === 'admin') fetch(`${WORKER_URL}?action=get_config`).then(r => r.json()).then(setConfig);
    setLoading(false);
  };

  useEffect(() => { if (mounted) loadData(); }, [currentPath, auth, mounted]);

  const onUpload = async (e: any) => {
    setLoading(true);
    for (const file of Array.from(e.target.files as FileList)) {
      const blob: Blob = await new Promise((res) => {
        const img = new Image(); img.src = URL.createObjectURL(file);
        img.onload = () => {
          const cvs = document.createElement('canvas');
          let w = img.width, h = img.height; if (w > 2000) { h = (2000/w)*h; w = 2000; }
          cvs.width = w; cvs.height = h; cvs.getContext('2d')?.drawImage(img, 0, 0, w, h);
          cvs.toBlob((b) => res(b!), 'image/webp', 0.85);
        };
      });
      await fetch(`${WORKER_URL}?action=upload&prefix=${currentPath}&file=${encodeURIComponent(file.name.split('.')[0])}.webp`, { method: 'POST', body: blob });
    }
    loadData(); setShowMenu(false);
  };

  const updateConfig = async (newConfig: any) => {
    setConfig(newConfig);
    await fetch(`${WORKER_URL}?action=update_config`, { method: 'POST', body: JSON.stringify(newConfig) });
  };

  const handleDelete = async (name: string, isFolder: boolean = false) => {
    if (!confirm(isFolder ? "폴더 안의 모든 파일이 즉시 영구 삭제됩니다." : "이 사진을 영구 삭제할까요?")) return;
    if (!confirm("복구할 수 없습니다. 진짜 삭제하시겠습니까?")) return;
    setLoading(true);
    const targetKey = isFolder ? `${currentPath}${name}/` : `${currentPath}${name}`;
    const res = await fetch(`${WORKER_URL}?action=delete_item&key=${encodeURIComponent(targetKey)}&isFolder=${isFolder}`, { method: 'DELETE' });
    if (res.ok) loadData(); else alert("삭제 실패!");
    setLoading(false);
    setActiveFolderMenu(null);
  };

  if (!mounted) return null;

  if (!auth) return (
    <div className="flex flex-col items-center justify-center h-screen bg-black text-white p-6" suppressHydrationWarning>
      <h1 className="text-4xl font-black mb-10 text-blue-500 italic tracking-tighter">JINS ARCHIVE</h1>
      <input type="password" placeholder="PASSWORD" value={pw} onChange={(e)=>setPw(e.target.value)} onKeyDown={(e)=>e.key==='Enter'&&handleLogin()} className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 text-center mb-4 w-64 outline-none focus:ring-2 focus:ring-blue-600" />
      <button onClick={handleLogin} className="p-4 w-64 bg-blue-600 rounded-2xl font-bold active:scale-95 transition-transform shadow-lg shadow-blue-900/20">ENTER</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white p-6 font-sans" suppressHydrationWarning onClick={() => setActiveFolderMenu(null)}>
      <header className="flex justify-between items-center mb-8 border-b border-zinc-800 pb-6 relative">
        <h2 className="text-xl font-bold cursor-pointer hover:text-blue-500 transition-colors" onClick={() => setCurrentPath("")}>JINS ARCHIVE</h2>
        <div className="flex gap-2">
          {currentPath && <button onClick={() => {const p=currentPath.split('/').filter(Boolean); p.pop(); setCurrentPath(p.length?p.join('/')+'/':"")}} className="bg-zinc-800 px-3 py-2 rounded-xl text-xs font-bold active:scale-90">뒤로</button>}
          {auth.role === 'admin' && <button onClick={(e) => {e.stopPropagation(); setShowMenu(!showMenu);}} className="w-10 h-10 flex items-center justify-center bg-zinc-900 rounded-full border border-zinc-800 text-xl font-bold">⋮</button>}
          {showMenu && (
            <div className="absolute right-0 mt-12 w-64 bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl z-50 p-2 text-sm overflow-hidden animate-in fade-in zoom-in duration-150" onClick={e => e.stopPropagation()}>
              <button onClick={() => { const n = prompt("새 폴더명"); if(n) fetch(`${WORKER_URL}?action=create_folder&prefix=${currentPath}&name=${n}`,{method:'POST'}).then(()=>loadData()); setShowMenu(false); }} className="w-full text-left p-4 hover:bg-zinc-800 rounded-2xl font-bold">📁 새 폴더 만들기</button>
              <label className="w-full text-left p-4 hover:bg-zinc-800 rounded-2xl font-bold cursor-pointer block">📸 사진 업로드<input type="file" multiple accept="image/*" className="hidden" onChange={onUpload} /></label>
              <button onClick={() => { const p = prompt("마스터 비번 변경", config.adminPw); if(p) updateConfig({...config, adminPw:p}); setShowMenu(false); }} className="w-full text-left p-4 hover:bg-zinc-800 rounded-2xl font-bold border-t border-zinc-800 mt-2 text-blue-400">🔑 마스터 비번 변경</button>
            </div>
          )}
        </div>
      </header>

      {loading && <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] font-black text-blue-500 animate-pulse italic">PROCESSING...</div>}

      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        {items.folders.map(f => (
          <div key={f} className="relative group">
            <div onClick={() => setCurrentPath(currentPath + f + "/")} className="bg-zinc-900 p-6 rounded-3xl border border-zinc-800 hover:border-blue-500 cursor-pointer text-center transition-all shadow-lg">
              <span className="text-4xl block relative">📂 {config.folderPws[currentPath+f] && <span className="absolute top-0 right-1 text-[10px]">🔑</span>}</span>
              <div className="mt-2 text-xs font-bold truncate">{f}</div>
            </div>
            
            {/* 관리자라면 언제나 편집 가능 */}
            {auth.role === 'admin' && (
              <div className="absolute top-2 right-2">
                <button 
                  onClick={(e) => { e.stopPropagation(); setActiveFolderMenu(activeFolderMenu === f ? null : f); }}
                  className="w-8 h-8 flex items-center justify-center bg-black/50 backdrop-blur-md rounded-full border border-white/10 text-white font-bold hover:bg-blue-600 transition-colors"
                >
                  <span className="mb-2">...</span>
                </button>
                
                {activeFolderMenu === f && (
                  <div className="absolute right-0 mt-2 w-32 bg-zinc-800 border border-zinc-700 rounded-2xl shadow-2xl z-[60] overflow-hidden animate-in fade-in zoom-in duration-100" onClick={e => e.stopPropagation()}>
                    <button onClick={() => {
                      const p = prompt(`${f} 비밀번호 (비우면 해제)`, config.folderPws[currentPath+f]||"");
                      const nc = {...config, folderPws: {...config.folderPws, [currentPath+f]: p||""}};
                      if(!p) delete nc.folderPws[currentPath+f];
                      updateConfig(nc);
                      setActiveFolderMenu(null);
                    }} className="w-full text-left px-4 py-3 hover:bg-zinc-700 text-xs font-bold border-b border-zinc-700">🔑 비번 설정</button>
                    <button onClick={() => handleDelete(f, true)} className="w-full text-left px-4 py-3 hover:bg-red-900 text-red-400 text-xs font-bold">🗑️ 폴더 삭제</button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {items.photos.map(p => (
          <div key={p} className="relative aspect-square rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-900 group shadow-md">
            <img src={`${R2_PUBLIC_URL}/${currentPath}${p}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy" />
            {auth.role === 'admin' && (
              <button onClick={(e) => {e.stopPropagation(); handleDelete(p);}} className="absolute top-2 right-2 bg-red-600/90 backdrop-blur-sm w-9 h-9 rounded-xl text-xs font-bold shadow-xl flex items-center justify-center active:scale-75 transition-transform border border-red-500 opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}