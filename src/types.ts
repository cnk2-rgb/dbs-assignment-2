export interface Task {
  id: string;
  text: string;
  completed: boolean;
  dueDate?: string;   // YYYY-MM-DD
  dueTime?: string;   // HH:MM
}

export interface JournalEntry {
  id: string;
  date: string;        // YYYY-MM-DD
  content: string;
  createdAt: number;   // timestamp
  persist?: boolean;   // if true, skip auto-delete
}

export interface Ingredient {
  id: string;
  name: string;
  expiry: string;      // YYYY-MM-DD
  category: 'produce' | 'dairy' | 'meat' | 'pantry' | 'frozen' | 'other';
  addedDate: string;   // YYYY-MM-DD
}
