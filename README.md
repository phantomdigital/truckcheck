# NHVR Logbook Checker

A web tool for Australian truck drivers and fleet managers to check if they need to complete a work diary (logbook) based on NHVR regulations.

## Features

- **Distance Calculation**: Calculates straight-line distance (as the crow flies) between base location and destination
- **NHVR Compliance**: Determines if a logbook is required based on the 100km rule
- **Mapbox Integration**: Uses Mapbox Geocoding API to convert addresses to coordinates
- **Mobile-Friendly**: Responsive design optimized for mobile devices
- **Clean UI**: Built with shadcn/ui components and Tailwind CSS

## Requirements

- Node.js 18+ 
- npm or yarn
- Mapbox account and access token (free tier available)

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up Mapbox API token:**
   - Create a `.env.local` file in the root directory
   - Add your Mapbox access token:
     ```
     NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=your_mapbox_access_token_here
     ```
   - Get your token from [Mapbox Account](https://account.mapbox.com/access-tokens/)

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## How It Works

1. Enter your **Base Location** (where you start from)
2. Enter your **Destination** (where you're driving to)
3. Click **Calculate Distance**
4. The tool will:
   - Geocode both addresses using Mapbox
   - Calculate the straight-line distance using the Haversine formula
   - Display whether a logbook is required based on NHVR regulations

## NHVR Regulations

Under NHVR rules:
- **No logbook required**: If travelling within 100km (as the crow flies) of your base
- **Logbook required**: If travelling more than 100km from your base

## Tech Stack

- **Next.js 15+** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **shadcn/ui** components
- **Mapbox Geocoding API**

## Project Structure

```
├── app/
│   ├── logbook-checker.tsx  # Main logbook checker component
│   ├── page.tsx             # Home page
│   ├── layout.tsx           # Root layout
│   └── globals.css          # Global styles
├── components/
│   └── ui/                  # shadcn/ui components
│       ├── input.tsx
│       ├── button.tsx
│       ├── card.tsx
│       └── alert.tsx
├── lib/
│   └── utils.ts             # Utility functions
└── components.json           # shadcn/ui configuration
```

## License

MIT
