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
  responsibleUserIds: string[];
  subtasks: Subtask[];
}

export interface EventUser {
  id: string;
  role: string;
  user: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
  }
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
