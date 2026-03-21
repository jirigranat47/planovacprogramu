export interface Subtask {
  id: string;
  text: string;
  isDone: boolean;
}

export interface Activity {
  id: string;
  name: string;
  startTime: string | null;
  duration: number;
  description: string | null;
  url: string | null;
  category: string | null;
  trackId: string | null;
  subtasks: Subtask[];
}

export interface Track {
  id: string;
  name: string;
  color: string | null;
  activities: Activity[];
}

export interface Event {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  description: string | null;
  tracks: Track[];
  activities: Activity[]; // Aktivity bez trackId (zásobník)
}
