# Football Shirt Management System

A full-stack web application for managing a football shirt collection — tracking inventory, sales, purchases, wishlists, sellers, and analytics. Includes a public storefront for potential buyers.

Built with the MERN stack, styled with a handcrafted Vintage Paper theme, and designed for collectors who buy and sell football shirts.

---

## Screenshots

### Public Storefront
![Storefront](screenshots/storefront.png)

### For Sale — Inventory Management
![For Sale](screenshots/for-sale.png)

### Jersey Detail Dialog
![Jersey Detail](screenshots/jersey-dialog.png)

### Add / Edit Jersey Form
![Add Jersey](screenshots/add-jersey.png)

### Sold — Sales History
![Sold](screenshots/sold.png)

### Wishlist
![Wishlist](screenshots/buy-list.png)

### Purchased
![Purchased](screenshots/purchased.png)

### Sellers
![Sellers](screenshots/sellers.png)

### Reminders
![Reminders](screenshots/reminders.png)

### Statistics
![Statistics](screenshots/statistics.png)

### Reports
![Reports](screenshots/reports.png)

### Planner
![Planner](screenshots/planner.png)

### Settings
![Settings](screenshots/settings.png)

---

## Features

### Inventory Management
- Add jerseys with multiple images (drag-and-drop upload, auto-converted to WebP via Cloudinary)
- Rich metadata: team, league, season, type (Home/Away/3rd/etc.), quality (Supporter/Replica/Authentic/Player Issue/Match Worn), brand, technology, size variants with individual stock counts, condition, measurements (armpit/length in cm), sponsor, printing details (player name/number), patches
- Multi-platform listing links (Dolap, Sahibinden, Letgo, eBay, Vinted)
- Feature ("pin") jerseys to appear at the top of the storefront
- Duplicate a jersey entry with one click
- Mark as sold — automatically reduces stock; moves to Sold when stock hits zero
- Table view and grid card view (3:4 aspect ratio)
- Advanced filtering: team, league, country, season, type, quality, brand, size, condition, price range

### Sales Tracking
- Record buyer name, username, phone, platform, payment method, sale price, and date
- View full sales history with profit calculation per item

### Purchase Tracking
- Log every purchase (even personal/collection pieces)
- Link to a seller record
- Optionally push to the For Sale inventory

### Wishlist
- Track shirts you want to buy with target price and listing URL
- Priority levels (low / medium / high)
- One-click "Buy" flow: creates a Purchase record and marks the wishlist item as purchased

### Sellers
- Contact book for sellers across platforms (Dolap, Instagram, eBay, etc.)
- WhatsApp deep-link integration (E.164 phone format)
- See purchase count per seller

### Reminders
- Track buyer requests for shirts you don't have yet
- Status workflow: Open → Notified → Closed
- Direct contact via WhatsApp

### Statistics
- Dashboard cards: total sales, revenue, net profit, active listings, stock value
- Charts: monthly sales volume, monthly revenue/profit, team-based sales distribution, size distribution, platform performance, top-10 selling teams, buyer history

### Reports
- Organised by year and month
- Per-period summary: items sold, items purchased, buy/sell spread, profit margin, revenue, net profit, platform breakdown

### Planner / Content Calendar
- Calendar view for planning social media posts and listing activity
- Item types: Share, List, Photo, Task
- Per-day dot indicators colour-coded by type
- Toggle items as done

### Public Storefront (`/vitrin` — no login required)
- Clean card grid accessible to anyone
- Filters: team, type, quality, size, condition, brand, league, season, colour, price range
- Search and sorting (price, date, team)
- Detailed jersey dialog with drag-scroll image gallery
- Configurable contact links (WhatsApp, Dolap, eBay, etc.) managed from Settings

### Settings
- Set storefront title and contact links
- Language (Turkish / English), currency (TRY / EUR / USD / GBP), and theme preferences per user

### i18n
- Full Turkish and English support across all pages and forms
- Language can be toggled from the Settings page or the storefront

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite 7, React Router 7 |
| Styling | Tailwind CSS 4, Radix UI (Shadcn-compatible) |
| State | Zustand, React Hook Form, Zod |
| Charts | Recharts |
| Drag & Drop | @dnd-kit |
| Animations | Framer Motion |
| Toast / Alerts | Sonner, Radix AlertDialog |
| i18n | i18next, react-i18next |
| Backend | Node.js, Express 5 (ESM) |
| Database | MongoDB, Mongoose 9 |
| Auth | JWT (single admin user) |
| Media | Cloudinary (WebP, quality:auto:good, max 1200px) |
| Frontend Deploy | Vercel |
| Backend Deploy | Railway |

---

## Project Structure

```
footballshirt-management-system/
├── scripts/
│   └── migrate-country-keys.js   # One-time DB migration
├── client/                       # React + Vite
│   ├── public/data/
│   │   ├── teams.json            # 168 teams (static)
│   │   ├── competitions.json     # Country/league hierarchy
│   │   ├── brands.json
│   │   └── technologies.json
│   └── src/
│       ├── components/
│       │   ├── ui/               # Radix UI base components
│       │   ├── common/           # Shared custom components
│       │   └── layout/           # Sidebar, Header, MobileNav
│       ├── pages/                # One folder per page
│       ├── store/                # Zustand stores
│       ├── hooks/                # Custom hooks
│       ├── services/api.js       # Axios instance + all services
│       └── lib/                  # utils, constants
└── server/                       # Express (ESM)
    └── src/
        ├── controllers/
        ├── models/
        ├── routes/
        ├── middleware/            # auth, upload, error
        └── services/             # cloudinary.service.js
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- MongoDB (local or Atlas)
- Cloudinary account (free tier is sufficient)

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/footballshirt-management-system.git
cd footballshirt-management-system
```

### 2. Server setup

```bash
cd server
npm install
```

Create `server/.env`:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/footballshirts
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=7d
ADMIN_USERNAME=admin
ADMIN_PASSWORD_HASH=your_bcrypt_hash
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLIENT_URL=http://localhost:5173
```

To generate a password hash:

```bash
node server/src/utils/hash.js yourpassword
```

### 3. Client setup

```bash
cd client
npm install
```

Create `client/.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

### 4. Run in development

```bash
# Terminal 1 — backend
cd server && npm run dev

# Terminal 2 — frontend
cd client && npm run dev
```

The app will be available at `http://localhost:5173`.
The public storefront is at `http://localhost:5173/vitrin`.

---

## Deployment

### Backend — Railway

Set the following environment variables in your Railway service:

```
PORT=5000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=...
JWT_EXPIRES_IN=7d
ADMIN_USERNAME=admin
ADMIN_PASSWORD_HASH=...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
CLIENT_URL=https://your-app.vercel.app
```

Start command: `node server.js` (from `server/` directory, or set root directory to `server` in Railway settings).

### Frontend — Vercel

Set the following environment variables in your Vercel project:

```
VITE_API_URL=https://your-app.railway.app/api
```

Deploy from the `client/` directory (set as the root in Vercel settings, or use the `cd client && npm run build` build command).

---

## API Overview

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/login` | Admin login |
| GET | `/api/jerseys` | List jerseys (with filters) |
| POST | `/api/jerseys` | Create jersey |
| PUT | `/api/jerseys/:id` | Update jersey |
| DELETE | `/api/jerseys/:id` | Delete jersey |
| PATCH | `/api/jerseys/:id/featured` | Toggle featured |
| POST | `/api/jerseys/:id/mark-sold` | Mark as sold |
| GET | `/api/jerseys/filter-options` | Available filter values |
| GET | `/api/sales` | List sales |
| POST | `/api/sales` | Create sale record |
| GET | `/api/purchases` | List purchases |
| POST | `/api/purchases` | Create purchase |
| GET | `/api/sellers` | List sellers |
| GET | `/api/wishlist` | List wishlist items |
| GET | `/api/reminders` | List reminders |
| GET | `/api/planner` | List plan items (by month) |
| GET | `/api/stats/counts` | Dashboard counts |
| GET | `/api/reports/:year/:month` | Monthly report |
| GET | `/api/settings` | Get settings |
| PUT | `/api/settings` | Update settings |
| GET | `/api/public/jerseys` | Public storefront listings |
| GET | `/api/public/jerseys/:id` | Public jersey detail |
| GET | `/api/public/filter-options` | Public filter values |
| GET | `/api/public/settings` | Public storefront settings |

---

## Data Model Highlights

### Jersey

```js
{
  images: [{ url, publicId, isMain }],
  teamName, country, league, season,
  type, quality, brand, technology,
  sizeVariants: [{ size, stockCount }],
  measurements: { armpit, length },
  condition, sponsor,
  printing: { hasNumber, number, playerName },
  patches: [String],
  buyPrice, sellPrice,
  platforms: [{ name, listingUrl, isActive }],
  status,         // 'for_sale' | 'sold' | 'not_for_sale'
  featured,       // Boolean — pins to top of storefront
  notes, tags,
  purchaseDate, createdAt, updatedAt
}
```

### Sale

```js
{
  jerseyId,
  buyerName, buyerUsername, buyerPhone,
  platform, listingUrl,
  salePrice, paymentMethod,
  soldSize,       // which size variant was sold
  soldAt, notes
}
```

---

## Theme — Vintage Paper

The UI uses a custom CSS variable system inspired by aged paper. Both light and dark modes are supported.

```css
/* Light */
--bg-primary:   #F5F0E8;
--bg-card:      #FAF7F2;
--text-primary: #2C2416;
--accent:       #8B4513;  /* Saddle Brown */
--border:       #D4C9B8;

/* Dark */
--bg-primary:   #1A1510;
--bg-card:      #2A231A;
--text-primary: #F0EAD6;
--accent:       #C4854A;
```

Fonts: **Prata** (headings, serif) + **Geist** (body, sans-serif) + **Geist Mono** (code/numbers).

---

## License

MIT
