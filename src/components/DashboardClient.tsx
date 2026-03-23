'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { signOut } from 'next-auth/react';

export default function DashboardClient({ session }: { session: any }) {
  const [events, setEvents] = useState<any[]>([]); // Použijeme any pro přístup k role z EventUser
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<'ALL' | 'OWNER' | 'EDITOR' | 'VIEWER' | 'ARCHIVED'>('ALL');
  const [isCreating, setIsCreating] = useState(false);
  const [newEvent, setNewEvent] = useState({
    name: '',
    startTime: new Date().toISOString().split('T')[0] + 'T08:00',
    endTime: new Date().toISOString().split('T')[0] + 'T18:00'
  });

  const fetchEvents = async () => {
    try {
      const res = await fetch('/api/events');
      const data = await res.json();
      setEvents(data);
    } catch (error) {
      console.error('Chyba při načítání akcí:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const filteredEvents = events.filter(e => {
    const matchesSearch = e.name.toLowerCase().includes(searchQuery.toLowerCase());
    const myMembership = e.users?.find((u: any) => u.userId === session?.user?.id);
    
    // Pokud je filterRole ARCHIVED, zobrazujeme jen archivované
    if (filterRole === 'ARCHIVED') return e.isArchived && matchesSearch;
    
    // Jinak zobrazujeme jen NEarchivované
    if (e.isArchived) return false;

    const matchesFilter = filterRole === 'ALL' || myMembership?.role === filterRole;
    return matchesSearch && matchesFilter;
  });

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEvent)
      });
      if (res.ok) {
        setIsCreating(false);
        setNewEvent({
          name: '',
          startTime: new Date().toISOString().split('T')[0] + 'T08:00',
          endTime: new Date().toISOString().split('T')[0] + 'T18:00'
        });
        fetchEvents();
      }
    } catch (error) {
      console.error('Chyba při vytváření akce:', error);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    if (!confirm('Opravdu chcete tuto akci smazat? Všechna data budou nevratně pryč.')) return;
    try {
      const res = await fetch(`/api/events/${id}`, { method: 'DELETE' });
      if (res.ok) fetchEvents();
    } catch (error) {
      console.error('Chyba při mazání:', error);
    }
  };

  const handleDuplicateEvent = async (id: string) => {
    try {
      const res = await fetch(`/api/events/${id}/duplicate`, { method: 'POST' });
      if (res.ok) fetchEvents();
    } catch (error) { console.error('Chyba při duplikaci:', error); }
  };

  const handleArchiveEvent = async (id: string, isArchived: boolean) => {
    try {
      const res = await fetch(`/api/events/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isArchived })
      });
      if (res.ok) fetchEvents();
    } catch (error) { console.error('Chyba při archivaci:', error); }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-slate-50 font-sans">
      <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        <header className="mb-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
            <div>
              <h1 className="text-4xl font-black text-gray-900 tracking-tight">Moje Akce</h1>
              <p className="text-gray-500 mt-1 font-medium italic">Přehled všech vašich výprav a kurzů</p>
            </div>
            
            <div className="flex items-center gap-4 w-full md:w-auto">
              {session?.user && (
                <div className="hidden lg:flex items-center gap-3 bg-white px-4 py-2.5 rounded-2xl shadow-sm border border-gray-100">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-400 flex items-center justify-center text-white font-bold text-sm shadow-md overflow-hidden">
                    {session.user.image ? (
                      <img 
                        src={session.user.image} 
                        alt={session.user.name || 'Avatar'} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      (session.user.name || session.user.email || '?')
                        .split(' ')
                        .filter(Boolean)
                        .map((n: string) => n[0])
                        .join('')
                        .slice(0, 2)
                        .toUpperCase()
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-gray-800 leading-tight">{session.user.name || 'Uživatel'}</div>
                    <button onClick={() => signOut({ callbackUrl: '/login' })} className="text-[10px] uppercase tracking-wider text-red-500 hover:text-red-700 font-black transition-colors">Odhlásit</button>
                  </div>
                </div>
              )}
              
              <button 
                onClick={() => setIsCreating(true)}
                className="flex-1 md:flex-none px-8 py-3.5 bg-blue-600 text-white rounded-2xl font-black shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all hover:-translate-y-1 active:scale-95"
              >
                + Nová akce
              </button>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4 items-center bg-white p-2 rounded-2xl shadow-sm border border-gray-100">
            <div className="relative flex-1 w-full">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
              </span>
              <input 
                type="text" 
                placeholder="Hledat akci podle názvu..." 
                className="w-full pl-12 pr-4 py-3 bg-transparent outline-none text-sm font-medium"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="h-8 w-px bg-gray-100 hidden md:block"></div>
            <div className="flex p-1 bg-gray-50 rounded-xl w-full md:w-auto overflow-x-auto">
              {(['ALL', 'OWNER', 'EDITOR', 'VIEWER', 'ARCHIVED'] as const).map(role => (
                <button
                  key={role}
                  onClick={() => setFilterRole(role)}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                    filterRole === role 
                      ? 'bg-white text-blue-600 shadow-sm ring-1 ring-black/5' 
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  {role === 'ALL' ? 'Všechny' : role === 'OWNER' ? 'Moje' : role === 'EDITOR' ? 'Spolupráce' : role === 'ARCHIVED' ? 'Archiv' : 'Jen čtení'}
                </button>
              ))}
            </div>
          </div>
        </header>

        {isCreating && (
          <div className="mb-10 bg-white p-8 rounded-3xl border border-blue-100 shadow-2xl shadow-blue-100/50">
            <h2 className="text-xl font-black mb-6 text-gray-900 flex items-center gap-2">
              <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-sm">✨</span>
              Vytvořit novou akci
            </h2>
            <form onSubmit={handleCreateEvent} className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
              <div className="md:col-span-2">
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Název akce</label>
                <input 
                  type="text" 
                  className="w-full bg-slate-50 border-none p-4 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold placeholder:text-gray-300" 
                  value={newEvent.name}
                  onChange={e => setNewEvent({...newEvent, name: e.target.value})}
                  placeholder="Např. Podzimní výprava k Sázavě"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Začátek</label>
                <input 
                  type="datetime-local" 
                  className="w-full bg-slate-50 border-none p-4 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-xs" 
                  value={newEvent.startTime}
                  onChange={e => {
                    const start = e.target.value;
                    const startDate = new Date(start);
                    const endDate = new Date(startDate.getTime() + 10 * 60 * 60 * 1000);
                    const endStr = endDate.toISOString().slice(0, 16);
                    setNewEvent({...newEvent, startTime: start, endTime: endStr});
                  }}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Konec</label>
                <input 
                  type="datetime-local" 
                  className="w-full bg-slate-50 border-none p-4 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-xs" 
                  value={newEvent.endTime}
                  onChange={e => setNewEvent({...newEvent, endTime: e.target.value})}
                  required
                />
              </div>
              <div className="flex gap-3 md:col-span-4 justify-end mt-4">
                <button type="button" onClick={() => setIsCreating(false)} className="px-8 py-3.5 text-gray-400 hover:text-gray-600 transition-colors font-bold text-sm">Zrušit</button>
                <button type="submit" className="px-10 py-3.5 bg-slate-900 text-white rounded-2xl font-black shadow-xl shadow-slate-200 hover:bg-black transition-all text-sm active:scale-95">Vytvořit akci</button>
              </div>
            </form>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredEvents.length > 0 ? filteredEvents.map(event => {
            const myMembership = event.users?.find((u: any) => u.userId === session?.user?.id);
            const isOwner = myMembership?.role === 'OWNER';
            
            return (
              <div key={event.id} className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-8 hover:shadow-2xl hover:shadow-blue-900/5 transition-all group relative overflow-hidden flex flex-col">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                       {isOwner ? (
                         <span className="text-[10px] font-black uppercase tracking-widest bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">Vlastník</span>
                       ) : (
                         <span className="text-[10px] font-black uppercase tracking-widest bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">{myMembership?.role || 'Člen'}</span>
                       )}
                    </div>
                    <h3 className="text-2xl font-black text-gray-900 group-hover:text-blue-600 transition-colors leading-[1.15]">
                      {event.name}
                    </h3>
                  </div>
                  <div className="flex gap-1 -mr-2">
                    <button 
                      onClick={() => handleDuplicateEvent(event.id)} 
                      className="text-gray-200 hover:text-blue-500 transition-colors p-2"
                      title="Duplikovat akci"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2"></path></svg>
                    </button>
                    {isOwner && (
                      <button 
                        onClick={() => handleArchiveEvent(event.id, !event.isArchived)} 
                        className="text-gray-200 hover:text-amber-500 transition-colors p-2"
                        title={event.isArchived ? "Obnovit z archivu" : "Archivovat akci"}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"></path></svg>
                      </button>
                    )}
                    {isOwner && (
                      <button 
                        onClick={() => handleDeleteEvent(event.id)} 
                        className="text-gray-200 hover:text-red-500 transition-colors p-2"
                        title="Smazat navždy"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3 text-sm text-gray-400 font-bold">
                    <div className="flex flex-col">
                        <span className="text-[10px] uppercase tracking-tighter text-gray-300">Od</span>
                        <span className="text-gray-900">{new Date(event.startTime).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'short' })}</span>
                    </div>
                    <div className="h-4 w-px bg-gray-100"></div>
                    <div className="flex flex-col">
                        <span className="text-[10px] uppercase tracking-tighter text-gray-300">Do</span>
                        <span className="text-gray-900">{new Date(event.endTime).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'short' })}</span>
                    </div>
                  </div>

                  {/* Skupina spolupracovníků */}
                  <div className="flex -space-x-2 overflow-hidden">
                    {event.users?.map((eu: any) => {
                      const name = eu.user.name || eu.user.email || '?';
                      const initials = name.split(' ').filter(Boolean).map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
                      
                      return (
                        <div 
                          key={eu.id} 
                          title={name}
                          className={`h-8 w-8 rounded-full ring-2 ring-white bg-gray-100 flex items-center justify-center text-[16px] font-black overflow-hidden shadow-sm shrink-0 ${!eu.user.image ? 'text-gray-500' : ''}`}
                        >
                          {eu.user.image ? (
                            <img src={eu.user.image} alt={name} className="h-full w-full object-cover" />
                          ) : (
                            initials
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-auto pt-4 flex gap-2">
                  <Link 
                    href={`/events/${event.id}`}
                    className="flex-1 text-center py-4 bg-blue-600 text-white rounded-2xl font-black hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 active:scale-95"
                  >
                    Otevřít
                  </Link>
                </div>
              </div>
            );
          }) : (
            <div className="col-span-full py-32 text-center bg-white rounded-[3rem] border-2 border-dashed border-gray-100">
               <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">🔍</div>
               <p className="text-gray-400 font-bold">Nenašli jsme žádné akce odpovídající vašemu hledání.</p>
               <button onClick={() => {setSearchQuery(''); setFilterRole('ALL');}} className="mt-2 text-blue-600 font-bold hover:underline">Zrušit filtry</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
