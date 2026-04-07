export interface Task {
  id: string;
  text: string;
  completed: boolean;
  dueDate?: string;   // YYYY-MM-DD
  dueTime?: string;   // HH:MM
}

export interface JournalEntry {
  id: string;
  title: string;
  date: string;        // YYYY-MM-DD
  content: string;
  createdAt: number;   // timestamp
  persist?: boolean;   // if true, skip auto-delete
}

export type Cuisine = 'korean' | 'general' | 'japanese' | 'chinese' | 'other';

export interface Ingredient {
  id: string;
  name: string;
  expiry: string;      // YYYY-MM-DD
  category: 'produce' | 'dairy' | 'meat' | 'pantry' | 'frozen' | 'other';
  cuisine?: Cuisine;
  addedDate: string;   // YYYY-MM-DD
}

export interface ShoppingItem {
  id: string;
  name: string;
  quantity: string;
  checked: boolean;
  deferred: boolean;
  store: string;
}

export interface ShoppingList {
  id: string;
  name: string;
  createdAt: number;
  stores: string[];
  items: ShoppingItem[];
}
