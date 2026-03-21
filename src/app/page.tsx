'use client';

import React, { useEffect, useState } from 'react';
import { Event, Activity, Track } from '@/types';

export default function Home() {
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAddingActivity, setIsAddingActivity] = useState(false);
  const [newActivity, setNewActivity] = useState({
    name: '',
    duration: 30,
    description: '',
    category: 'Program'
  });

  const fetchData = async () => {
    try {
      const res = await fetch('/api/events');
      const data = await res.json();
      if (data && data.length > 0) {
        setEvent(data[0]);
      }
    } catch (error) {
      console.error('Chyba při načítání dat:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event) return;

    try {
      const res = await fetch('/api/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newActivity,
          eventId: event.id
        })
      });

      if (res.ok) {
        setIsAddingActivity(false);
        setNewActivity({ name: '', duration: 30, description: '', category: 'Program' });
        fetchData(); // Znovu načteme data
      }
    } catch (error) {
      console.error('Chyba při ukládání aktivity:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50 font-sans">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium">Načítám program...</p>
        </div>
      </div>
    );
  }

  const getPosition = (startTimeStr: string | null) => {
    if (!startTimeStr) return 0;
    const date = new Date(startTimeStr);
    const hour = date.getUTCHours() + 1;
    const minutes = date.getUTCMinutes();
    const totalMinutes = hour * 60 + minutes;
    const startOffset = 8 * 60; 
    const pixelsPerMinute = 2; 
    return Math.max(0, (totalMinutes - startOffset) * pixelsPerMinute);
  };

  const getWidth = (duration: number) => duration * 2;

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden font-sans">
      {/* Levý panel: Zásobník nepřiřazených aktivit */}
      <aside className="w-80 bg-white border-r border-gray-200 flex flex-col shadow-sm">
        <header className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-gray-800">Zásobník</h2>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">Nepřiřazené aktivity</p>
          </div>
          <button 
            onClick={() => setIsAddingActivity(true)}
            className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-sm hover:bg-blue-700 transition-colors"
          >
            +
          </button>
        </header>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {event?.activities && event.activities.length > 0 ? (
            event.activities.map((activity) => (
              <div key={activity.id} className="p-3 bg-white border border-gray-200 rounded-lg shadow-sm hover:border-blue-400 cursor-move transition-all group relative">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-bold text-sm text-gray-800 leading-tight">{activity.name}</h3>
                  <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-gray-500 font-bold">{activity.duration}m</span>
                </div>
                {activity.description && <p className="text-[11px] text-gray-400 line-clamp-1">{activity.description}</p>}
                <div className="mt-2 text-[9px] text-gray-300 uppercase font-bold tracking-widest">{activity.category}</div>
              </div>
            ))
          ) : (
            !isAddingActivity && (
              <p className="text-xs text-gray-400 italic text-center py-8">
                Zásobník je prázdný.
              </p>
            )
          )}

          {isAddingActivity && (
            <form onSubmit={handleAddActivity} className="p-4 bg-slate-50 border border-blue-200 rounded-lg space-y-3 shadow-inner">
              <input 
                autoFocus
                type="text" 
                placeholder="Název aktivity..." 
                className="w-full p-2 text-sm border border-gray-200 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                value={newActivity.name}
                onChange={e => setNewActivity({...newActivity, name: e.target.value})}
                required
              />
              <div className="flex gap-2">
                <input 
                  type="number" 
                  placeholder="Minuty" 
                  className="w-20 p-2 text-sm border border-gray-200 rounded"
                  value={newActivity.duration}
                  onChange={e => setNewActivity({...newActivity, duration: parseInt(e.target.value)})}
                />
                <select 
                  className="flex-1 p-2 text-sm border border-gray-200 rounded"
                  value={newActivity.category}
                  onChange={e => setNewActivity({...newActivity, category: e.target.value})}
                >
                  <option>Program</option>
                  <option>Společné</option>
                  <option>Strava</option>
                  <option>Technické</option>
                </select>
              </div>
              <textarea 
                placeholder="Popis..." 
                className="w-full p-2 text-[11px] border border-gray-200 rounded h-16"
                value={newActivity.description}
                onChange={e => setNewActivity({...newActivity, description: e.target.value})}
              />
              <div className="flex gap-2">
                <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded text-xs font-bold shadow-sm">Uložit</button>
                <button type="button" onClick={() => setIsAddingActivity(false)} className="px-3 bg-white border border-gray-200 py-2 rounded text-xs font-bold text-gray-500">Zrušit</button>
              </div>
            </form>
          )}
        </div>
      </aside>

      {/* Hlavní část: Timeline */}
      <main className="flex-1 flex flex-col bg-white overflow-hidden relative">
        <header className="h-16 border-b border-gray-200 flex items-center justify-between px-6 bg-white shrink-0">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-gray-900">{event?.name}</h1>
            <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wider">
              {event ? new Date(event.startTime).toLocaleDateString('cs-CZ') : ''}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-sm font-medium transition-colors border border-gray-200">Šablony</button>
            <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors shadow-sm font-bold">Export PDF</button>
          </div>
        </header>

        {/* Mřížka Timeline */}
        <div className="flex-1 overflow-auto relative bg-slate-50 scrollbar-thin scrollbar-thumb-slate-200">
          <div className="min-w-[1500px] h-full flex flex-col">
            <div className="h-12 border-b border-gray-200 bg-white sticky top-0 z-20 flex">
              <div className="w-40 border-r border-gray-200 shrink-0 bg-white"></div>
              <div className="flex-1 flex relative">
                {[...Array(14)].map((_, i) => (
                  <div key={i} className="w-[120px] border-r border-gray-100 text-[11px] text-gray-400 p-2 font-mono shrink-0">{8 + i}:00</div>
                ))}
              </div>
            </div>

            <div className="flex-1 relative">
              <div className="absolute inset-0 flex pointer-events-none">
                <div className="w-40 border-r border-gray-200 shrink-0"></div>
                <div className="flex-1 flex">
                  {[...Array(14)].map((_, i) => (
                    <div key={i} className="w-[120px] border-r border-gray-100 shrink-0"></div>
                  ))}
                </div>
              </div>

              {event?.tracks.map((track) => (
                <div key={track.id} className="flex min-h-[100px] border-b border-gray-100 group relative">
                  <div className="w-40 border-r border-gray-200 bg-white p-4 shrink-0 flex flex-col justify-center sticky left-0 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                    <span className="font-bold text-sm text-gray-700">{track.name}</span>
                  </div>
                  <div className="flex-1 relative py-2">
                    {track.activities.map((activity) => (
                      <div 
                        key={activity.id} 
                        className="absolute bg-white border-l-4 rounded-r-lg p-3 shadow-md hover:shadow-lg transition-all cursor-pointer border border-gray-200 overflow-hidden"
                        style={{ 
                          left: `${getPosition(activity.startTime)}px`, 
                          width: `${getWidth(activity.duration)}px`,
                          borderLeftColor: track.color || '#3B82F6',
                          top: '12px',
                          bottom: '12px'
                        }}
                      >
                        <h4 className="text-xs font-bold text-gray-800 truncate leading-none mb-1">{activity.name}</h4>
                        <div className="text-[9px] text-gray-400 font-bold">{activity.duration}m</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <footer className="h-8 bg-white border-t border-gray-200 flex items-center px-4 justify-between text-[10px] text-gray-400 uppercase tracking-widest font-semibold shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 shadow-sm animate-pulse"></span>
            Server Synchronizován
          </div>
          <div>PostgreSQL Active</div>
        </footer>
      </main>
    </div>
  );
}
