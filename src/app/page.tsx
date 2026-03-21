import React from 'react';

export default function Home() {
  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden font-sans">
      {/* Levý panel: Zásobník nepřiřazených aktivit */}
      <aside className="w-80 bg-white border-r border-gray-200 flex flex-col shadow-sm">
        <header className="p-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-bold text-gray-800">Zásobník aktivit</h2>
          <p className="text-xs text-gray-500">Nepřiřazené do programu</p>
        </header>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {/* Placeholder pro aktivity v zásobníku */}
          <div className="p-3 bg-white border border-gray-300 rounded-lg shadow-sm hover:border-blue-500 cursor-move transition-all">
            <h3 className="font-semibold text-sm">Noční hra</h3>
            <span className="text-xs text-gray-500">60 min · Velká louka</span>
          </div>
          <div className="p-3 bg-white border border-gray-300 rounded-lg shadow-sm hover:border-blue-500 cursor-move transition-all">
            <h3 className="font-semibold text-sm">Příprava dřeva</h3>
            <span className="text-xs text-gray-500">30 min · U ohniště</span>
          </div>
          
          <button className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 text-sm hover:bg-gray-50 transition-colors">
            + Přidat aktivitu
          </button>
        </div>
      </aside>

      {/* Hlavní část: Timeline */}
      <main className="flex-1 flex flex-col bg-white overflow-hidden relative">
        <header className="h-16 border-b border-gray-200 flex items-center justify-between px-6 bg-white shrink-0">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-gray-900">Program: Výprava do skal</h1>
            <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wider">
              Pátek - Neděle
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-sm font-medium transition-colors">Šablony</button>
            <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors shadow-sm">Export PDF</button>
          </div>
        </header>

        {/* Mřížka Timeline */}
        <div className="flex-1 overflow-auto relative bg-slate-50">
          <div className="min-w-[1200px] h-full flex flex-col">
            {/* Hlavička časové osy */}
            <div className="h-12 border-b border-gray-200 bg-white sticky top-0 z-10 flex">
              <div className="w-32 border-r border-gray-200 shrink-0"></div>
              <div className="flex-1 flex">
                {[...Array(12)].map((_, i) => (
                  <div key={i} className="flex-1 border-r border-gray-100 text-[10px] text-gray-400 p-2 font-mono">
                    {8 + i}:00
                  </div>
                ))}
              </div>
            </div>

            {/* Programové linky */}
            <div className="flex-1">
              {['Vlčata', 'Skauti', 'Roveři'].map((track) => (
                <div key={track} className="flex h-24 border-b border-gray-200 group">
                  <div className="w-32 border-r border-gray-200 bg-white p-3 shrink-0 flex items-center">
                    <span className="font-semibold text-sm text-gray-700">{track}</span>
                  </div>
                  <div className="flex-1 relative bg-white/50 group-hover:bg-blue-50/30 transition-colors">
                    {/* Placeholder pro aktivitu v timeline */}
                    {track === 'Vlčata' && (
                      <div className="absolute left-[10%] w-[25%] top-2 bottom-2 bg-blue-500 text-white rounded-md p-2 shadow-md border border-blue-600 cursor-pointer overflow-hidden">
                        <p className="text-xs font-bold leading-tight truncate">Úvodní hra</p>
                        <p className="text-[10px] opacity-80">8:00 - 10:00</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Stavová lišta (pro offline indikaci) */}
        <footer className="h-8 bg-gray-50 border-t border-gray-200 flex items-center px-4 justify-between text-[10px] text-gray-500 uppercase tracking-widest">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
            Online
          </div>
          <div>Poslední synchronizace: Před 2 minutami</div>
        </footer>
      </main>
    </div>
  );
}
