## Instructions to Claude:
Do not execute commmands outside these two directories: dbs-assignment-2 and daily-planner.

## Project Summary:
A multi-page productivity application. Here are my initial ideas for features. 
- Page for journaling (route /journal):
    - Allows me to create and save journals for each date. 
    - Includes automatic deletion.
    - Includes password authentication. 
- Page for keeping track ingredients in my fridge (/ingredients)
- Home page with simple todo list that integrates into calendar. (Read ../daily-planner directory for more information.)

## Project requirements (we will build this step-by-step):
- At least 4 distinct pages / routes
- A form that adds data (client-side state — data lives in memory for now)
- A dynamic route (e.g., /day/[date] or /recipe/[slug])
- A shared layout with navigation between pages
- Styled with Tailwind — it should look like something you'd show someone
- A CLAUDE.md that describes your project, pages, and data model
- Playwright MCP configured — ask Claude to verify at least one interaction
- Deployed to Vercel with a live URL
- Code pushed to a public GitHub repo
- Multiple git commits showing your iteration process

## Tech Stack:
- Next.JS
- Tailwind CSS
- Playwright MCP

## Suggested development steps (from assignment writeup):
1. Pick your tool. What would you actually use? Don't overthink it — pick something and commit.
2. Plan with Claude. Put Claude in Plan Mode. Describe the app, the pages, the data model, the style. Have Claude
interview you on what you want to build and steer it in the right direction.
3. Scaffold with Claude. Create the Next.js app, set up Tailwind, get the dev server running.
4. Configure Playwright MCP. Ask Claude to open your app and verify something works — a form submission, a
navigation link, a page layout.
5. Build page by page. Start with the homepage. Get it looking good. Then add the form page. Then the dynamic route.
Then the overview.
6. Iterate on the design and interactions. This is where the assignment gets interesting. Claude can scaffold fast — but
can you direct it to make something polished? Push on typography, spacing, color, layout. Explore animations.
7. Deploy to Vercel. Push to GitHub, connect to Vercel, ship it. Note: your data lives in memory — it won't survive a page
refresh. That's expected — and it's why Week 3 adds a database.

## Implementation Plan

### Pages & Routes

#### Home (`/`) — Todo + Calendar
Port and polish the daily-planner's TaskList and Calendar into this app's home page.
- Task form (text, optional date/time)
- Progress bar, inline editing, delete
- Calendar view with task indicators per day
- Clicking a day navigates to `/day/[date]`

#### Dynamic Route: `/day/[date]`
- Tasks filtered to that specific date
- Add/edit/complete tasks for that date
- Back link to home

#### Journal (`/journal`)
- List of journal entries sorted by date (newest first)
- "New Entry" form with date picker and text area
- Auto-delete: entries older than 30 days are purged on load
- Simple password gate: prompt on first visit, unlock stored in sessionStorage
- Click entry to expand/edit inline

#### Ingredients (`/ingredients`)
- Form to add ingredients (name, quantity, category)
- Display grouped by category in card/grid layout
- Edit quantity inline, delete items
- Visual indicator for items added > 7 days ago ("might be expiring")

### Data Models

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
  date: string;        // YYYY-MM-DD
  content: string;
  createdAt: number;   // timestamp
}

interface Ingredient {
  id: string;
  name: string;
  quantity: string;
  category: 'produce' | 'dairy' | 'meat' | 'pantry' | 'frozen' | 'other';
  addedDate: string;   // YYYY-MM-DD
}
```

### Shared Layout
- Root layout with top nav bar: Home, Journal, Ingredients
- Clean, modern Tailwind styling with accent colors per section
- Responsive (mobile-friendly)

### Build Order
1. Scaffold Next.js app, verify Tailwind
2. Build shared layout + nav
3. Build Home page — port TaskList + Calendar from daily-planner
4. Build `/day/[date]` dynamic route
5. Build `/journal` with form, auto-delete, password gate
6. Build `/ingredients` with form and category grouping
7. Polish design — typography, spacing, animations, color
8. Configure Playwright MCP and verify interactions
9. Deploy to Vercel