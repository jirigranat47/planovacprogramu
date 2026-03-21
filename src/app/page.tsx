'use client';

import React, { useEffect, useState } from 'react';
import { 
  DndContext, 
  DragEndEvent, 
  useDraggable, 
  useDroppable,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay
} from '@dnd-kit/core';
import { Event, Activity, Track } from '@/types';

// --- Komponenta pro vizuální kartu aktivity ---
function ActivityCard({ activity, isDragging, isOverlay }: { activity: Activity, isDragging?: boolean, isOverlay?: boolean }) {
  return (
    <div 
      className={`p-3 bg-white border border-gray-200 rounded-lg shadow-sm transition-colors ${isDragging ? 'opacity-40' : ''} ${isOverlay ? 'shadow-xl scale-105 ring-2 ring-blue-500 cursor-grabbing' : 'hover:border-blue-400 cursor-grab'}`}
    >
      <div className="flex justify-between items-start mb-1">
        <h3 className="font-bold text-sm text-gray-800 leading-tight">{activity.name}</h3>
        <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-gray-500 font-bold">{activity.duration}m</span>
      </div>
      {activity.description && <p className="text-[11px] text-gray-400 line-clamp-1">{activity.description}</p>}
      <div className="mt-2 text-[9px] text-gray-300 uppercase font-bold tracking-widest">{activity.category || 'Program'}</div>
    </div>
  );
}

// --- Komponenta pro aktivitu v zásobníku (Draggable) ---
function DraggableActivity({ activity }: { activity: Activity }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: activity.id,
    data: { activity }
  });

  return (
    <div ref={setNodeRef} {...listeners} {...attributes}>
      <ActivityCard activity={activity} isDragging={isDragging} />
    </div>
  );
}

// --- Helpery pro pozicování ---
const getPosition = (startTimeStr: string | null, eventStartTime?: string) => {
  if (!startTimeStr || !eventStartTime) return 0;
  const date = new Date(startTimeStr);
  const base = new Date(eventStartTime);
  base.setHours(8, 0, 0, 0);
  const diffInMinutes = (date.getTime() - base.getTime()) / 60000;
  return Math.max(0, diffInMinutes * 2); // 2px = 1min
};

const getWidth = (duration: number) => duration * 2;

// --- Komponenta pro aktivitu na časové ose (Draggable) ---
function TimelineActivity({ activity, trackColor, eventStartTime }: { activity: Activity, trackColor: string, eventStartTime: string }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: activity.id,
    data: { activity }
  });

  return (
    <div 
      ref={setNodeRef} 
      {...listeners} 
      {...attributes}
      className={`absolute bg-white border-l-4 rounded-r-lg p-3 shadow-sm border border-gray-200 overflow-hidden cursor-grab active:cursor-grabbing transition-opacity ${isDragging ? 'opacity-20' : ''}`}
      style={{ 
        left: `${getPosition(activity.startTime, eventStartTime)}px`, 
        width: `${getWidth(activity.duration)}px`,
        borderLeftColor: trackColor,
        top: '12px',
        bottom: '12px'
      }}
    >
      <h4 className="text-xs font-bold truncate leading-none mb-1">{activity.name}</h4>
      <div className="text-[9px] text-gray-400 font-bold">{activity.duration}m</div>
    </div>
  );
}

// --- Komponenta pro linku programu (Droppable) ---
function TrackDroppable({ track, children }: { track: Track, children: React.ReactNode }) {
  const { isOver, setNodeRef } = useDroppable({
    id: track.id,
    data: { track }
  });

  return (
    <div 
      ref={setNodeRef} 
      className={`flex min-h-[120px] border-b border-gray-100 group relative transition-colors ${isOver ? 'bg-blue-50/50' : ''}`}
    >
      <div className="w-40 border-r border-gray-200 bg-white p-4 shrink-0 flex flex-col justify-center sticky left-0 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
        <span className="font-bold text-sm text-gray-700">{track.name}</span>
      </div>
      <div className="flex-1 relative py-2 overflow-hidden">
        {children}
      </div>
    </div>
  );
}

export default function Home() {
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [dragTime, setDragTime] = useState<string | null>(null);
  const [isAddingActivity, setIsAddingActivity] = useState(false);
  const [newActivity, setNewActivity] = useState({ name: '', duration: 30, description: '', category: 'Program' });

  // Konfigurace senzorů pro DND (aby se nespouštěl při kliknutí na formulář)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  const calculateTimeFromCoordinates = (translatedLeft: number, overRect: any) => {
    if (!event) return null;
    const timelineStartX = overRect.left + 160;
    const pixelsFromStart = translatedLeft - timelineStartX;
    const minutesOffset = pixelsFromStart / 2;
    const baseDate = new Date(event.startTime);
    baseDate.setHours(8, 0, 0, 0);
    return new Date(baseDate.getTime() + minutesOffset * 60000);
  };

  const handleDragMove = (dndEvent: any) => {
    const { active, over } = dndEvent;
    if (over && active.rect.current.translated) {
      const time = calculateTimeFromCoordinates(active.rect.current.translated.left, over.rect);
      if (time) {
        setDragTime(time.toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' }));
      }
    } else {
      setDragTime(null);
    }
  };

  const fetchData = async () => {
    try {
      const res = await fetch('/api/events');
      const data = await res.json();
      if (data && data.length > 0) setEvent(data[0]);
    } catch (error) {
      console.error('Chyba při načítání dat:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleAddActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event) return;
    try {
      const res = await fetch('/api/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newActivity, eventId: event.id })
      });
      if (res.ok) {
        setIsAddingActivity(false);
        setNewActivity({ name: '', duration: 30, description: '', category: 'Program' });
        fetchData();
      }
    } catch (error) { console.error('Chyba:', error); }
  };

  const onDragEnd = async (result: DragEndEvent) => {
    const { active, over } = result;
    setActiveId(null);
    setDragTime(null);
    if (!over || !event || !active.rect.current.translated) return;

    const activity = active.data.current?.activity as Activity;
    const targetTrack = over.data.current?.track as Track;

    if (!activity || !targetTrack) return;

    const newStartTime = calculateTimeFromCoordinates(active.rect.current.translated.left, over.rect);
    if (!newStartTime) return;

    try {
      await fetch(`/api/activities/${activity.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startTime: newStartTime.toISOString(),
          trackId: targetTrack.id
        })
      });
      fetchData();
    } catch (error) { console.error('Chyba aktualizace:', error); }
  };

  // (Helpery getPosition a getWidth byly přesunuty mimo komponentu)

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-slate-50 font-sans">
      <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  const activeActivity = activeId 
    ? event?.activities?.find(a => a.id === activeId) || 
      event?.tracks.flatMap(t => t.activities).find(a => a.id === activeId)
    : null;

  return (
    <DndContext 
      sensors={sensors} 
      onDragStart={({active}) => setActiveId(active.id as string)} 
      onDragMove={handleDragMove}
      onDragEnd={onDragEnd}
      onDragCancel={() => { setActiveId(null); setDragTime(null); }}
    >
      <div className="flex h-screen bg-gray-100 overflow-hidden font-sans">
        {/* --- Zásobník --- */}
        <aside className="w-80 bg-white border-r border-gray-200 flex flex-col shadow-sm">
          <header className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
            <h2 className="text-lg font-bold text-gray-800">Zásobník</h2>
            <button onClick={() => setIsAddingActivity(true)} className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-sm">+</button>
          </header>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {event?.activities?.map((activity) => (
              <DraggableActivity key={activity.id} activity={activity} />
            ))}
            {isAddingActivity && (
              <form onSubmit={handleAddActivity} className="p-4 bg-slate-50 border border-blue-200 rounded-lg space-y-3 shadow-inner">
                <input autoFocus type="text" placeholder="Název..." className="w-full p-2 border rounded" value={newActivity.name} onChange={e => setNewActivity({...newActivity, name: e.target.value})} required />
                <div className="flex gap-2">
                  <input type="number" className="w-20 p-2 border rounded" value={newActivity.duration} onChange={e => setNewActivity({...newActivity, duration: parseInt(e.target.value)})} />
                  <select className="flex-1 p-2 border rounded" value={newActivity.category} onChange={e => setNewActivity({...newActivity, category: e.target.value})}>
                    <option>Program</option><option>Strava</option>
                  </select>
                </div>
                <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded">Uložit</button>
              </form>
            )}
          </div>
        </aside>

        {/* --- Timeline --- */}
        <main className="flex-1 flex flex-col bg-white overflow-hidden relative">
          <header className="h-16 border-b border-gray-200 flex items-center justify-between px-6 bg-white shrink-0">
            <h1 className="text-xl font-bold text-gray-900">{event?.name}</h1>
          </header>

          <div className="flex-1 overflow-auto relative bg-slate-50">
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
                  {[...Array(14)].map((_, i) => (<div key={i} className="w-[120px] border-r border-gray-100 shrink-0"></div>))}
                </div>

                {event?.tracks.map((track) => (
                  <TrackDroppable key={track.id} track={track}>
                    {event && track.activities.map((activity) => (
                      <TimelineActivity 
                        key={activity.id} 
                        activity={activity} 
                        trackColor={track.color || '#3B82F6'} 
                        eventStartTime={event.startTime}
                      />
                    ))}
                  </TrackDroppable>
                ))}
              </div>
            </div>
          </div>
          <footer className="h-8 bg-white border-t border-gray-200 flex items-center px-4 justify-between text-[10px] text-gray-400 font-semibold shrink-0 uppercase tracking-widest">
            <div><span className="w-2 h-2 rounded-full bg-green-500 inline-block mr-2 animate-pulse"></span>Synchronizováno</div>
            <div>DND Engine Active</div>
          </footer>
        </main>
      </div>
      <DragOverlay dropAnimation={null}>
        {activeActivity ? (
          <div 
            className="relative" 
            style={{ width: `${getWidth(activeActivity.duration)}px` }}
          >
            {dragTime && (
              <div className="absolute -top-10 left-0 bg-blue-600 text-white text-[10px] px-2 py-1 rounded-md font-bold shadow-lg whitespace-nowrap z-50 animate-in fade-in zoom-in duration-200 flex items-center gap-1.5">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                {dragTime}
              </div>
            )}
            <ActivityCard activity={activeActivity} isOverlay />
            <div className="absolute top-0 bottom-0 left-0 w-1 bg-blue-500/30 -ml-0.5 pointer-events-none rounded-full"></div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
