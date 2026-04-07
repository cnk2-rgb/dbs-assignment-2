## Instructions to Claude:
Do not execute commmands outside these two directories: dbs-assignment-2 and daily-planner.

## Project Summary:
Clarice's Notebook — a multi-page productivity application built with Next.js and Tailwind CSS.

## Tech Stack:
- Next.JS (App Router)
- Tailwind CSS
- Playwright MCP (claude mcp add playwright -- npx @anthropic-ai/mcp-playwright@latest)

## Pages & Current Functionality

### Home (`/`) — Daily Planner
- Task form with text, optional date/time
- Progress bar, inline editing, delete
- Calendar view with task indicators per day; clicking a day navigates to `/day/[date]`
- ICS file export for tasks
- Spotify embed (lo-fi playlist) with "Open in Spotify" link

### Dynamic Route: `/day/[date]`
- Tasks filtered to that specific date
- Add/edit/complete tasks for that date
- Back link to home

### Journal (`/journal`)
- Password-protected (set on first visit, sessionStorage unlock)
- Change password option
- New entry form with date picker, title, and textarea
- Auto-delete entries older than 30 days (unless marked "Keep")
- Dark mode toggle (defaults to dark, persisted to localStorage)
- Collapsible "Past Entries" section
- Entry cards link to dynamic detail pages at `/journal/[date]/[title]`
- Keep/Unkeep and Delete actions on hover

### Ingredients (`/ingredients`)
- Form to add ingredients with name (autocomplete), expiry date, category, and cuisine
- Cuisine dropdown available for all categories (Korean, Japanese, Chinese, General, Other)
- Ingredients persisted to localStorage
- Display grouped by category in card/grid layout
- Full inline edit form for all items (name, expiry, category, cuisine)
- Visual indicators: "Expired" badge (past expiry) and "Expiring soon" badge (within 3 days)
- Select ingredients to search recipes: Korean cuisine items search maangchi.com, others search smittenkitchen.com
- Pixel art fridge visualization that fills up based on ingredient count (full at 25 items)

### Shopping (`/shopping`)
- Create and manage multiple shopping lists (persisted to localStorage)
- Add items with name, quantity, and store assignment
- Add/remove store sections per list
- Check off items with progress tracking
- Per-item and bulk defer: moves unchecked items to a deferred pool
- Deferred items shown as cards with "Add to list..." picker to reassign to any list
- Item preview on collapsed list cards (first 3 items + count)
- Fridge duplicate warning when adding an item already in ingredients
- Copy to clipboard and Email export for lists
- Slate/indigo color scheme with blue-toned background

### Shared Components
- **Navigation**: Sticky top nav with links to Home, Journal, Ingredients, Shopping
- **Spotify music button**: Floating circular button (bottom-right) that toggles a Spotify embed card on all pages
- **Layout**: Consistent max-width, warm beige base background, pixel font (Silkscreen) for headings

## Data Models

```ts
interface Task {
  id: string;
  text: string;
  completed: boolean;
  dueDate?: string;   // YYYY-MM-DD
  dueTime?: string;   // HH:MM
}

interface JournalEntry {
  id: string;
  title: string;
  date: string;        // YYYY-MM-DD
  content: string;
  createdAt: number;   // timestamp
  persist?: boolean;   // if true, skip auto-delete
}

interface Ingredient {
  id: string;
  name: string;
  expiry: string;      // YYYY-MM-DD
  category: 'produce' | 'dairy' | 'meat' | 'pantry' | 'frozen' | 'other';
  cuisine?: Cuisine;   // 'korean' | 'general' | 'japanese' | 'chinese' | 'other'
  addedDate: string;   // YYYY-MM-DD
}

interface ShoppingItem {
  id: string;
  name: string;
  quantity: string;
  checked: boolean;
  deferred: boolean;
  store: string;
}

interface ShoppingList {
  id: string;
  name: string;
  createdAt: number;
  stores: string[];
  items: ShoppingItem[];
}
```

## Persistence
- **Journal entries**: localStorage (`journal-entries`)
- **Journal password**: localStorage (`journal-password`), sessionStorage (`journal-unlocked`)
- **Journal dark mode**: localStorage (`journal-dark`)
- **Ingredients**: localStorage (`ingredients`)
- **Shopping lists**: localStorage (`shopping-lists`)
- **Deferred shopping items**: localStorage (`shopping-deferred`)
- **Tasks**: Client-side state only (resets on refresh)

## Testing
If functionality is created, test by making 1-4 sample items and testing the functionality just implemented on those sample items.
