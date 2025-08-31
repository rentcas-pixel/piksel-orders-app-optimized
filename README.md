# Piksel Orders App - Optimized

Optimized Piksel Orders management application with performance improvements and code cleanup.

## 🚀 Features

- **Order Management**: Create, edit, and manage orders
- **Advanced Filtering**: Filter by status, month, year, client, agency
- **Search Functionality**: Search across clients, agencies, and invoice IDs
- **Week Numbers Modal**: View and navigate through weeks
- **Dark Mode**: Toggle between light and dark themes
- **Reminder Notifications**: Get notified about pending tasks
- **Responsive Design**: Works on desktop and mobile devices

## 🛠️ Technologies

- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first CSS framework
- **PocketBase**: Backend database
- **Supabase**: Additional backend services
- **date-fns**: Date manipulation library
- **Heroicons**: Icon library

## 🚀 Performance Optimizations

- **API Caching**: Implemented caching to reduce server load
- **Debouncing**: Search and filter inputs are debounced
- **Code Cleanup**: Removed unnecessary console logs and mock data
- **Optimized Components**: Reduced re-renders and improved performance

## 📦 Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd piksel-orders-app-optimized
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🔧 Configuration

Update the configuration in `src/config/index.ts`:

```typescript
export const config = {
  pocketbase: {
    url: process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://your-pocketbase-url.com',
    collection: 'orders'
  },
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-supabase-url.com',
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key'
  }
};
```

## 📁 Project Structure

```
src/
├── app/                 # Next.js App Router pages
├── components/          # React components
├── config/             # Configuration files
├── hooks/              # Custom React hooks
├── lib/                # Library files (PocketBase, Supabase)
└── types/              # TypeScript type definitions
```

## 🎯 Key Features

### Order Management
- Create new orders with client, agency, and invoice details
- Edit existing orders with real-time updates
- View order details in a modal
- Toggle invoice sent status

### Advanced Filtering
- Filter by approval status (approved/pending)
- Filter by month and year
- Filter by client and agency
- Filter by media received status

### Search
- Search across client names, agencies, and invoice IDs
- Real-time search with debouncing
- Special handling for "viad" searches (includes viaduct orders)

### Week Numbers
- View weeks for any year
- Navigate between years
- Auto-scroll to current week
- Lithuanian locale support

## 🚀 Deployment

The application can be deployed to Vercel, Netlify, or any other hosting platform that supports Next.js.

## 📝 License

This project is proprietary software for Piksel company.

## 🤝 Contributing

This is a private project for Piksel company use only.
