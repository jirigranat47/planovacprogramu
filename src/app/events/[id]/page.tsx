'use client';

import React, { useEffect, useState, use, useRef } from 'react';
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
import { Event, Activity, Track, EventUser } from '@/types';
import Link from 'next/link';


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

// --- Helpery pro pozicování ---
const getPosition = (startTimeStr: string | null, timelineStart?: Date) => {
  if (!startTimeStr || !timelineStart) return 0;
  const date = new Date(startTimeStr);
  const diffInMinutes = (date.getTime() - timelineStart.getTime()) / 60000;
  return Math.max(0, diffInMinutes * 2); // 2px = 1min
};

const getWidth = (duration: number) => duration * 2;

// --- Komponenta pro aktivitu na časové ose (Draggable) ---
function TimelineActivity({ 
  activity, 
  trackColor, 
  timelineStart, 
  onResizeEnd, 
  onMoveToPool, 
  onDelete,
  onEdit
}: { 
  activity: Activity, 
  trackColor: string, 
  timelineStart: Date, 
  onResizeEnd: (id: string, newDuration: number) => void, 
  onMoveToPool: (id: string) => void, 
  onDelete: (id: string) => void,
  onEdit: (activity: Activity) => void
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: activity.id,
    data: { activity }
  });

  const [resizingWidth, setResizingWidth] = useState<number | null>(null);
  const isResizingRef = useRef(false);

  const handlePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation(); // Zabránit dnd-kitu v převzetí události
    e.preventDefault();
    isResizingRef.current = true;
    const startX = e.clientX;
    const startWidth = getWidth(activity.duration);

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const deltaX = moveEvent.clientX - startX;
      setResizingWidth(Math.max(10, startWidth + deltaX)); // min 5 minutes (10px)
    };

    const handlePointerUp = (upEvent: PointerEvent) => {
      const finalDeltaX = upEvent.clientX - startX;
      const finalWidth = Math.max(10, startWidth + finalDeltaX);
      const newDuration = Math.round(finalWidth / 2);
      setResizingWidth(null);
      
      // Krátké zpoždění pro ignorování click události, která ihned následuje pointerup
      setTimeout(() => {
        isResizingRef.current = false;
      }, 100);

      if (newDuration !== activity.duration) { 
        onResizeEnd(activity.id, newDuration);
      }
      
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  const currentWidth = resizingWidth !== null ? resizingWidth : getWidth(activity.duration);
  const currentDuration = resizingWidth !== null ? Math.round(resizingWidth / 2) : activity.duration;

  return (
    <div 
      ref={setNodeRef} 
      {...listeners} 
      {...attributes}
      onClick={(e) => {
        if (isResizingRef.current) {
          e.stopPropagation();
          return;
        }
        onEdit(activity);
      }}
      className={`absolute bg-white border-l-4 rounded-r-lg p-3 shadow-sm border border-gray-200 overflow-hidden group/item transition-opacity ${isDragging ? 'opacity-20 z-0' : 'cursor-grab hover:shadow-md z-10 hover:z-30'}`}
      style={{ 
        left: `${getPosition(activity.startTime, timelineStart)}px`, 
        width: `${currentWidth}px`,
        borderLeftColor: trackColor,
        top: '12px',
        bottom: '12px',
        zIndex: resizingWidth !== null ? 50 : undefined
      }}
    >
      <div className="flex justify-between items-start pointer-events-none">
        <h4 className="text-xs font-bold truncate leading-none mb-1">{activity.name}</h4>
      </div>
      <div className="hidden group-hover/item:flex gap-1 absolute top-2 right-4 z-40">
         <button 
           title="Vrátit do zásobníku"
           className="text-[10px] bg-slate-50 text-slate-400 hover:text-blue-500 p-0.5 rounded cursor-pointer pointer-events-auto" 
           onPointerDown={(e) => { e.stopPropagation(); onMoveToPool(activity.id); }}
         >↩</button>
         <button 
           title="Smazat"
           className="text-[10px] bg-red-50 text-red-400 hover:text-red-600 p-0.5 rounded cursor-pointer pointer-events-auto" 
           onPointerDown={(e) => { e.stopPropagation(); onDelete(activity.id); }}
         >✕</button>
      </div>

      <div className="text-[9px] text-gray-400 font-bold pointer-events-none">{currentDuration}m</div>
      
      {/* Resizing Handle */}
      <div 
        className="absolute right-0 top-0 bottom-0 w-3 cursor-ew-resize hover:bg-blue-500/20 active:bg-blue-500/40 opacity-0 group-hover/item:opacity-100 transition-colors z-20 pointer-events-auto"
        onPointerDown={handlePointerDown}
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}

// --- Komponenta pro aktivitu v zásobníku (Draggable) ---
function DraggableActivity({ activity, onDelete, onEdit }: { activity: Activity, onDelete: (id: string) => void, onEdit: (a: Activity) => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: activity.id,
    data: { activity }
  });

  return (
    <div 
      ref={setNodeRef} 
      {...listeners} 
      {...attributes} 
      onClick={() => onEdit(activity)}
      className="relative group/poolitem"
    >
      <ActivityCard activity={activity} isDragging={isDragging} />
      <button 
        onPointerDown={(e) => { e.stopPropagation(); onDelete(activity.id); }}
        className="hidden group-hover/poolitem:flex absolute top-2 right-2 text-[10px] bg-red-50 text-red-500 hover:text-red-700 hover:bg-red-100 w-5 h-5 items-center justify-center rounded z-10 cursor-pointer pointer-events-auto"
      >✕</button>
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
      <div className="flex-1 relative py-2">
        {children}
      </div>
    </div>
  );
}

// --- Modální okno pro detail aktivity ---
function ActivityDetailModal({ 
  activity, 
  eventUsers,
  onClose, 
  onSave 
}: { 
  activity: Activity, 
  eventUsers: EventUser[],
  onClose: () => void, 
  onSave: (updates: any) => Promise<void> 
}) {
  const [formData, setFormData] = useState({
    name: activity.name,
    description: activity.description || '',
    category: activity.category || 'Program',
    url: activity.url || '',
    responsibleUserIds: activity.responsibleUserIds || [],
    startTime: activity.startTime ? new Date(activity.startTime).toISOString().slice(0, 16) : '',
    duration: activity.duration,
    subtasks: activity.subtasks.map(st => ({ ...st }))
  });

  const [saving, setSaving] = useState(false);

  // Výpočet času "Do" pro UI
  const getEndTime = () => {
    if (!formData.startTime) return '';
    const start = new Date(formData.startTime);
    const end = new Date(start.getTime() + formData.duration * 60000);
    return end.toISOString().slice(0, 16);
  };

  const handleEndTimeChange = (newEndStr: string) => {
    if (!formData.startTime || !newEndStr) return;
    const start = new Date(formData.startTime);
    const end = new Date(newEndStr);
    const diffMin = Math.round((end.getTime() - start.getTime()) / 60000);
    setFormData({ ...formData, duration: Math.max(1, diffMin) });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({
        ...formData,
        responsibleUserIds: formData.responsibleUserIds,
        startTime: formData.startTime || null
      });
      onClose();
    } catch (error) {
      console.error('Error saving activity:', error);
    } finally {
      setSaving(false);
    }
  };

  const addSubtask = () => {
    setFormData({
      ...formData,
      subtasks: [...formData.subtasks, { id: 'temp-' + Date.now(), text: '', isDone: false }]
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
        <header className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Detail aktivity</h2>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-0.5">Editace parametrů a checklistu</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-200 transition-colors text-gray-400 hover:text-gray-600">✕</button>
        </header>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Základní info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1">Název aktivity</label>
              <input 
                type="text" 
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm font-semibold"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1">Zodpovědné osoby</label>
              <div className="space-y-2 max-h-32 overflow-y-auto w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus-within:ring-2 focus-within:ring-blue-500 focus-within:bg-white transition-all text-sm font-semibold">
                {eventUsers.length === 0 ? (
                  <p className="text-gray-400 italic font-normal text-xs">Žádní spolupracovníci na akci.</p>
                ) : eventUsers.map(eu => {
                  const isChecked = formData.responsibleUserIds.includes(eu.user.id);
                  return (
                    <label key={eu.user.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 p-1 rounded transition-colors">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        checked={isChecked}
                        onChange={(e) => {
                          const newIds = e.target.checked 
                            ? [...formData.responsibleUserIds, eu.user.id]
                            : formData.responsibleUserIds.filter(id => id !== eu.user.id);
                          setFormData({ ...formData, responsibleUserIds: newIds });
                        }}
                      />
                      <span className="text-gray-700">{eu.user.name || eu.user.email}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1">Kategorie</label>
              <select 
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm font-semibold"
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value })}
              >
                <option>Program</option>
                <option>Strava</option>
                <option>Přesun</option>
                <option>Ostatní</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1">URL Metodiky</label>
              <input 
                type="text" 
                placeholder="https://..."
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm font-semibold"
                value={formData.url}
                onChange={e => setFormData({ ...formData, url: e.target.value })}
              />
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* Časování */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1 text-blue-600">Čas od (Začátek)</label>
              <input 
                type="datetime-local" 
                disabled={!activity.startTime}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm font-semibold disabled:opacity-50"
                value={formData.startTime}
                onChange={e => setFormData({ ...formData, startTime: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1 text-red-600">Čas do (Konec)</label>
              <input 
                type="datetime-local" 
                disabled={!activity.startTime}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm font-semibold disabled:opacity-50"
                value={getEndTime()}
                onChange={e => handleEndTimeChange(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1">Trvání (minut)</label>
              <input 
                type="number" 
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm font-semibold"
                value={formData.duration}
                onChange={e => setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* Popis */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1">Popis aktivity</label>
            <textarea 
              rows={3}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm"
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="Podrobnosti o hře, potřebné vybavení..."
            />
          </div>

          {/* Subtasks */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <label className="block text-xs font-bold text-gray-500 uppercase ml-1">Checklist (Sub-úkoly)</label>
              <button 
                type="button" 
                onClick={addSubtask}
                className="text-[10px] bg-blue-50 text-blue-600 px-2 py-1 rounded-md font-bold hover:bg-blue-100 transition-colors"
              >+ Přidat úkol</button>
            </div>
            <div className="space-y-2">
              {formData.subtasks.map((st, idx) => (
                <div key={st.id} className="flex gap-2 items-center animate-in slide-in-from-left-2 duration-200">
                  <input 
                    type="checkbox" 
                    checked={st.isDone} 
                    className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    onChange={e => {
                      const newST = [...formData.subtasks];
                      newST[idx].isDone = e.target.checked;
                      setFormData({ ...formData, subtasks: newST });
                    }}
                  />
                  <input 
                    type="text" 
                    className="flex-1 p-2 bg-gray-50 border border-transparent border-b-gray-200 hover:border-b-blue-300 focus:border-b-blue-500 transition-all text-sm outline-none"
                    value={st.text}
                    placeholder="Např. Připravit lana..."
                    onChange={e => {
                      const newST = [...formData.subtasks];
                      newST[idx].text = e.target.value;
                      setFormData({ ...formData, subtasks: newST });
                    }}
                  />
                  <button 
                    onClick={() => {
                      setFormData({ ...formData, subtasks: formData.subtasks.filter((_, i) => i !== idx) });
                    }}
                    className="text-gray-300 hover:text-red-500 p-1"
                  >✕</button>
                </div>
              ))}
              {formData.subtasks.length === 0 && <p className="text-[11px] text-gray-400 italic text-center py-4 bg-gray-50 rounded-xl border border-dashed border-gray-200">Žádné úkoly k této aktivitě.</p>}
            </div>
          </div>
        </div>

        <footer className="p-6 border-t border-gray-100 bg-gray-50/50 flex gap-3">
          <button 
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 disabled:opacity-50 transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : 'Uložit změny'}
          </button>
          <button 
            disabled={saving}
            onClick={onClose} 
            className="px-6 py-3 bg-white border border-gray-200 text-gray-600 rounded-xl font-bold hover:bg-gray-50 transition-colors"
          >Zrušit</button>
        </footer>
      </div>
    </div>
  );
}

// --- Modální okno pro nastavení akce (spolupracovníci) ---
function EventSettingsModal({
  event,
  eventUsers,
  onClose,
  onAddUser,
  onAddTrack,
  onUpdateTrack,
  onDeleteTrack,
  onUpdateEvent,
}: {
  event: Event;
  eventUsers: EventUser[];
  onClose: () => void;
  onAddUser: (email: string) => Promise<void>;
  onAddTrack: () => Promise<void>;
  onUpdateTrack: (trackId: string, updates: any) => Promise<void>;
  onDeleteTrack: (trackId: string) => Promise<void>;
  onUpdateEvent: (updates: any) => Promise<void>;
}) {
  const [email, setEmail] = useState('');
  const [adding, setAdding] = useState(false);
  const [eventName, setEventName] = useState(event.name);
  const [startTime, setStartTime] = useState(new Date(event.startTime).toISOString().slice(0, 16));
  const [endTime, setEndTime] = useState(new Date(event.endTime).toISOString().slice(0, 16));


  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setAdding(true);
    await onAddUser(email);
    setEmail('');
    setAdding(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl flex flex-col p-6 animate-in zoom-in-95 duration-200">
        <header className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">Nastavení akce</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </header>

        <div className="space-y-6 overflow-y-auto pr-1">
          {/* --- Sekce pro Základní info --- */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Základní nastavení</h3>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Název akce</label>
              <input 
                type="text" 
                value={eventName}
                onBlur={() => onUpdateEvent({ name: eventName })}
                onChange={e => setEventName(e.target.value)}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Začátek</label>
                <input 
                  type="datetime-local" 
                  value={startTime}
                  onChange={e => {
                    setStartTime(e.target.value);
                    onUpdateEvent({ startTime: e.target.value });
                  }}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Konec</label>
                <input 
                  type="datetime-local" 
                  value={endTime}
                  onChange={e => {
                    setEndTime(e.target.value);
                    onUpdateEvent({ endTime: e.target.value });
                  }}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* --- Sekce pro Spolupracovníky --- */}
          <div>
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Spolupracovníci</h3>
            <div className="space-y-2 mb-4">
              {eventUsers.length === 0 ? (
                <p className="text-sm text-gray-500 italic">Zatím nejsou přiřazeni žádní spolupracovníci.</p>
              ) : (
                eventUsers.map(eu => (
                  <div key={eu.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <div>
                      <div className="text-sm font-semibold">{eu.user.name || 'Neznámý'}</div>
                      <div className="text-xs text-gray-500">{eu.user.email}</div>
                    </div>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded font-bold">{eu.role}</span>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleAdd} className="flex gap-2">
              <input 
                type="email" 
                placeholder="Email uživatele..." 
                className="flex-1 p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
              <button 
                type="submit" 
                disabled={adding}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold disabled:opacity-50"
              >
                {adding ? '...' : 'Přidat'}
              </button>
            </form>
          </div>

          <hr className="border-gray-100" />

          {/* --- Sekce pro Správu linek (Tracks) --- */}
          <div>
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Programové linky (Tracks)</h3>
            <div className="space-y-3 mb-4">
              {event.tracks.map(track => (
                <div key={track.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <input 
                    type="color" 
                    value={track.color || '#3b82f6'} 
                    onChange={e => onUpdateTrack(track.id, { color: e.target.value })}
                    className="w-8 h-8 rounded cursor-pointer border-none bg-transparent"
                  />
                  <input 
                    type="text" 
                    value={track.name} 
                    onChange={e => onUpdateTrack(track.id, { name: e.target.value })}
                    className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-bold p-0"
                  />
                  <button 
                    onClick={() => onDeleteTrack(track.id)}
                    className="text-gray-300 hover:text-red-500 transition-colors"
                    title="Smazat linku"
                  >✕</button>
                </div>
              ))}
              {event.tracks.length === 0 && <p className="text-xs text-gray-400 italic text-center py-2">Žádné linky nebyly vytvořeny.</p>}
            </div>
            <button 
              onClick={onAddTrack}
              className="w-full py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-bold hover:bg-slate-200 transition-colors"
            >
              + Přidat novou linku
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function EventPlanner({ params }: { params: Promise<{ id: string }> }) {
  const { id: eventId } = use(params);
  const [event, setEvent] = useState<Event | null>(null);
  const [eventUsers, setEventUsers] = useState<EventUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [dragTime, setDragTime] = useState<string | null>(null);
  const [isAddingActivity, setIsAddingActivity] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [newActivity, setNewActivity] = useState({ name: '', duration: 30, description: '', category: 'Program' });

  // Konfigurace senzorů pro DND
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  const fetchData = async () => {
    try {
      const res = await fetch(`/api/events/${eventId}`);
      if (!res.ok) throw new Error('Failed to fetch event');
      const data = await res.json();
      setEvent(data);
      
      const usersRes = await fetch(`/api/events/${eventId}/users`);
      if (usersRes.ok) {
        const usersOnlyData = await usersRes.json();
        setEventUsers(usersOnlyData);
      }
    } catch (error) {
      console.error('Chyba při načítání dat:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (email: string) => {
    try {
      const res = await fetch(`/api/events/${eventId}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role: 'EDITOR' })
      });
      if (res.ok) {
          fetchData();
      } else {
          const err = await res.json();
          alert(err.error || 'Nastala chyba při přidávání uživatele.');
      }
    } catch (e) { console.error(e); }
  };

  const handleAddTrack = async () => {
    try {
      const res = await fetch(`/api/events/${eventId}/tracks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Nová linka', color: '#3b82f6' })
      });
      if (res.ok) fetchData();
    } catch (e) { console.error(e); }
  };

  const handleUpdateTrack = async (trackId: string, updates: any) => {
    try {
      const res = await fetch(`/api/tracks/${trackId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        // Optimistická aktualizace pro lepší UX u color pickerů a inputů
        if (event) {
          const newTracks = event.tracks.map(t => t.id === trackId ? { ...t, ...updates } : t);
          setEvent({ ...event, tracks: newTracks });
        }
      }
    } catch (e) { console.error(e); }
  };

  const handleDeleteTrack = async (trackId: string) => {
    if (!confirm('Opravdu chcete smazat tuto linku? Všechny aktivity z ní budou přesunuty do zásobníku.')) return;
    try {
      const res = await fetch(`/api/tracks/${trackId}`, { method: 'DELETE' });
      if (res.ok) fetchData();
    } catch (e) { console.error(e); }
  };

  const handleUpdateEvent = async (updates: any) => {
    try {
      const res = await fetch(`/api/events/${eventId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        // Optimisticky aktualizujeme lokální stav
        const updated = await res.json();
        setEvent(prev => prev ? { ...prev, ...updates } : null);
        // Pokud se měnily časy, musíme fetchData pro korektní mřížku
        if (updates.startTime || updates.endTime) fetchData();
      }
    } catch (e) { console.error('Chyba při aktualizaci akce:', e); }
  };

  useEffect(() => { 
    if (eventId) fetchData(); 
  }, [eventId]);

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

  const handleMoveToPool = async (activityId: string) => {
    try {
      await fetch(`/api/activities/${activityId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startTime: null, trackId: null })
      });
      fetchData();
    } catch (error) { console.error('Chyba při přesunu:', error); }
  };

  const handleDeleteActivity = async (activityId: string) => {
    if (!confirm('Smazat tuto aktivitu?')) return;
    try {
      const res = await fetch(`/api/activities/${activityId}`, { method: 'DELETE' });
      if (res.ok) fetchData();
    } catch (error) { console.error('Chyba při mazání:', error); }
  };

  const handleUpdateActivity = async (updates: any) => {
    if (!editingActivity) return;
    try {
      const res = await fetch(`/api/activities/${editingActivity.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        fetchData();
      }
    } catch (error) { console.error('Chyba při aktualizaci:', error); }
  };


  // Pomocné proměnné pro mřížku
  const timelineStart = event ? (() => { const d = new Date(event.startTime); d.setMinutes(0, 0, 0); return d; })() : new Date();
  const timelineEnd = event ? (() => { const d = new Date(event.endTime); d.setMinutes(59, 59, 999); return d; })() : new Date();
  const timelineHours = event ? Math.max(1, Math.ceil((timelineEnd.getTime() - timelineStart.getTime()) / (1000 * 60 * 60))) : 14;

  const calculateTimeFromCoordinates = (translatedLeft: number, overRect: any) => {
    if (!event) return null;
    const timelineStartX = overRect.left + 160;
    const pixelsFromStart = translatedLeft - timelineStartX;
    const minutesOffset = pixelsFromStart / 2;
    return new Date(timelineStart.getTime() + minutesOffset * 60000);
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

  const applyRippleEffect = (
    activities: Activity[],
    movedActivityId: string,
    newStartTime: Date,
    newTrackId: string,
    newDuration: number
  ) => {
    const targetTrackActivities = activities.filter(a => a.trackId === newTrackId && a.id !== movedActivityId);
    const safeOriginalTime = (timeStr: string | null) => new Date(timeStr || 0).getTime();
    
    const allInTrack = [
      { id: movedActivityId, _startTime: newStartTime.getTime(), _duration: newDuration, _trackId: newTrackId, _sortTime: newStartTime.getTime() },
      ...targetTrackActivities.map(a => {
        const t = safeOriginalTime(a.startTime);
        return {
          id: a.id,
          _startTime: t,
          _duration: a.duration,
          _trackId: a.trackId,
          _sortTime: t === newStartTime.getTime() ? t + 1 : t
        }
      })
    ];

    allInTrack.sort((a, b) => a._sortTime - b._sortTime);

    let currentEndTime = 0;
    const updatesToSave: any[] = [];

    for (const act of allInTrack) {
      let finalStartTime = act._startTime;

      if (finalStartTime < currentEndTime) {
        finalStartTime = currentEndTime;
      }

      const finalEndTime = finalStartTime + (act._duration * 60000);
      currentEndTime = finalEndTime;

      const originalAct = activities.find(a => a.id === act.id);
      if (!originalAct) continue;
      
      const changedTime = finalStartTime !== safeOriginalTime(originalAct.startTime);
      const isMoved = act.id === movedActivityId;

      if (changedTime || isMoved) {
        updatesToSave.push({
          id: act.id,
          startTime: new Date(finalStartTime).toISOString(),
          trackId: act._trackId,
          duration: act._duration
        });
      }
    }
    return updatesToSave;
  };

  const handleBulkUpdate = async (updates: any[]) => {
    try {
      await fetch('/api/activities/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activities: updates })
      });
      fetchData();
    } catch (error) { console.error('Chyba bulk update:', error); }
  };

  const handleResizeEnd = async (activityId: string, newDuration: number) => {
    if (!event) return;
    const allActivities = [...(event.activities || []), ...event.tracks.flatMap(t => t.activities)];
    const activity = allActivities.find(a => a.id === activityId);
    if (!activity || !activity.startTime || !activity.trackId) return;

    const updates = applyRippleEffect(allActivities, activity.id, new Date(activity.startTime), activity.trackId, newDuration);
    handleBulkUpdate(updates);
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

    const allActivities = [...(event.activities || []), ...event.tracks.flatMap(t => t.activities)];
    const updates = applyRippleEffect(allActivities, activity.id, newStartTime, targetTrack.id, activity.duration);
    handleBulkUpdate(updates);
  };

  

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-slate-50 font-sans">
      <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  if (!event) return (
    <div className="flex flex-col items-center justify-center h-screen bg-slate-50 font-sans gap-4">
      <p className="text-red-500 font-bold text-xl">Akce nebyla nalezena.</p>
      <Link href="/" className="px-4 py-2 bg-blue-600 text-white rounded-md">Zpět na Dashboard</Link>
    </div>
  );

  return (
    <>
    <DndContext sensors={sensors} onDragStart={({active}) => setActiveId(active.id as string)} onDragMove={handleDragMove} onDragEnd={onDragEnd} onDragCancel={() => { setActiveId(null); setDragTime(null); }}>
      <div className="flex h-screen bg-gray-100 overflow-hidden font-sans">
        {/* --- Zásobník --- */}
        <aside className="w-80 bg-white border-r border-gray-200 flex flex-col shadow-sm">
          <header className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
            <h2 className="text-lg font-bold text-gray-800">Zásobník</h2>
            <button onClick={() => setIsAddingActivity(true)} className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-sm">+</button>
          </header>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {event?.activities?.map((activity) => (
              <DraggableActivity 
                key={activity.id} 
                activity={activity} 
                onDelete={handleDeleteActivity} 
                onEdit={(a) => setEditingActivity(a)}
              />
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
            <div className="flex items-center gap-4">
               <Link href="/" className="text-blue-600 hover:text-blue-800 transition-colors">← Dashboard</Link>
               <h1 className="text-xl font-bold text-gray-900">{event?.name}</h1>
            </div>
            <div className="flex gap-2">
               <button onClick={() => setIsSettingsOpen(true)} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-sm border font-bold text-gray-700 shadow-sm transition-colors cursor-pointer">Nastavení akce</button>
               <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-bold shadow-sm transition-colors cursor-pointer">Export PDF</button>
            </div>
          </header>

          <div className="flex-1 overflow-auto relative bg-slate-50">
            <div className="min-w-[1500px] h-full flex flex-col">
              <div className="h-12 border-b border-gray-200 bg-white sticky top-0 z-20 flex">
                <div className="w-40 border-r border-gray-200 shrink-0 bg-white"></div>
                <div className="flex-1 flex relative">
                  {[...Array(timelineHours)].map((_, i) => {
                    const d = new Date(timelineStart.getTime() + i * 60 * 60 * 1000);
                    const isNewDay = d.getHours() === 0 || i === 0;
                    return (
                      <div key={i} className="w-[120px] border-r border-gray-100 p-2 shrink-0 flex flex-col justify-end">
                        {isNewDay && <div className="text-[10px] text-blue-600 font-bold leading-none mb-1">{d.toLocaleDateString('cs-CZ', { weekday: 'short', day: 'numeric', month: 'numeric' })}</div>}
                        <div className="text-[11px] text-gray-400 font-mono leading-none">{d.getHours()}:00</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex-1 relative">
                <div className="absolute inset-0 flex pointer-events-none">
                  <div className="w-40 border-r border-gray-200 shrink-0"></div>
                  {[...Array(timelineHours)].map((_, i) => (<div key={i} className="w-[120px] border-r border-gray-100 shrink-0"></div>))}
                </div>

                {event?.tracks.map((track) => (
                  <TrackDroppable key={track.id} track={track}>
                    {track.activities.map((activity) => (
                      <TimelineActivity 
                        key={activity.id} 
                        activity={activity} 
                        trackColor={track.color || '#3B82F6'} 
                        timelineStart={timelineStart}
                        onResizeEnd={handleResizeEnd}
                        onMoveToPool={handleMoveToPool}
                        onDelete={handleDeleteActivity}
                        onEdit={(a) => setEditingActivity(a)}
                      />
                    ))}
                  </TrackDroppable>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>

      <DragOverlay dropAnimation={null}>
        {activeId ? (() => {
          const activeActivity = event?.activities?.find(a => a.id === activeId) || 
                                 event?.tracks.flatMap(t => t.activities).find(a => a.id === activeId);
          if (!activeActivity) return null;
          return (
            <div 
              className="relative" 
              style={{ width: `${getWidth(activeActivity.duration)}px` }}
            >
              {dragTime && (
                <div className="absolute -top-10 left-0 bg-blue-600 text-white text-[10px] px-2 py-1 rounded-md font-bold shadow-lg whitespace-nowrap z-50 flex items-center gap-1.5">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  {dragTime}
                </div>
              )}
              <ActivityCard activity={activeActivity} isOverlay />
              <div className="absolute top-0 bottom-0 left-0 w-1 bg-blue-500/30 -ml-0.5 pointer-events-none rounded-full"></div>
            </div>
          );
        })() : null}
      </DragOverlay>
    </DndContext>
      
      {isSettingsOpen && event && (
        <EventSettingsModal 
          event={event} 
          eventUsers={eventUsers} 
          onClose={() => setIsSettingsOpen(false)} 
          onAddUser={handleAddUser} 
          onAddTrack={handleAddTrack}
          onUpdateTrack={handleUpdateTrack}
          onDeleteTrack={handleDeleteTrack}
          onUpdateEvent={handleUpdateEvent}
        />
      )}

      {editingActivity && (
        <ActivityDetailModal 
          activity={editingActivity as Activity}  
          eventUsers={eventUsers}
          onClose={() => setEditingActivity(null)} 
          onSave={handleUpdateActivity}
        />
      )}
    </>
  );
}
