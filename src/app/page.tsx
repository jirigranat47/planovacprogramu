'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Event } from '@/types';

export default function Dashboard() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
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

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-slate-50 font-sans">
      <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans">
      <div className="max-w-5xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Skautský Plánovač</h1>
            <p className="text-gray-500 mt-1 text-sm uppercase tracking-widest font-semibold">Dashboard akcí</p>
          </div>
          <button 
            onClick={() => setIsCreating(true)}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all hover:-translate-y-0.5"
          >
            + Nová akce
          </button>
        </header>

        {isCreating && (
          <div className="mb-8 bg-white p-6 rounded-xl border border-blue-100 shadow-xl shadow-blue-50/50">
            <h2 className="text-lg font-bold mb-4 text-gray-800">Vytvořit novou akci</h2>
            <form onSubmit={handleCreateEvent} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Název akce</label>
                <input 
                  type="text" 
                  className="w-full border border-gray-200 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500" 
                  value={newEvent.name}
                  onChange={e => setNewEvent({...newEvent, name: e.target.value})}
                  placeholder="Např. Výprava do skal"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Začátek</label>
                <input 
                  type="datetime-local" 
                  className="w-full border border-gray-200 p-2.5 rounded-lg" 
                  value={newEvent.startTime}
                  onChange={e => setNewEvent({...newEvent, startTime: e.target.value})}
                  required
                />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="flex-1 bg-blue-600 text-white p-2.5 rounded-lg font-bold">Vytvořit</button>
                <button type="button" onClick={() => setIsCreating(false)} className="px-4 bg-gray-100 text-gray-600 rounded-lg">Zrušit</button>
              </div>
            </form>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.length > 0 ? events.map(event => (
            <div key={event.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all group">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors leading-tight">
                  {event.name}
                </h3>
                <button onClick={() => handleDeleteEvent(event.id)} className="text-gray-300 hover:text-red-500 transition-colors p-1">✕</button>
              </div>
              <div className="flex items-center text-sm text-gray-500 mb-6 font-medium">
                <span className="bg-blue-50 text-blue-600 px-2.5 py-1 rounded-md">
                  {new Date(event.startTime).toLocaleDateString('cs-CZ')}
                </span>
                <span className="mx-2">→</span>
                <span className="bg-gray-50 text-gray-600 px-2.5 py-1 rounded-md">
                   {new Date(event.endTime).toLocaleDateString('cs-CZ')}
                </span>
              </div>
              <Link 
                href={`/events/${event.id}`}
                className="block w-full text-center py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200"
              >
                Otevřít plánovač
              </Link>
            </div>
          )) : (
            <div className="col-span-full py-20 text-center bg-white rounded-3xl border-2 border-dashed border-gray-200">
               <p className="text-gray-400 font-medium">Zatím jste nevytvořili žádnou akci.</p>
               <button onClick={() => setIsCreating(true)} className="mt-4 text-blue-600 font-bold hover:underline">Vytvořit první akci</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
