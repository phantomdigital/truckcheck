import type { Metadata, Viewport } from 'next';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // Prevent zoom on mobile for better UX
};

export const metadata: Metadata = {
  title: 'TruckCheck Dashboard',
  description: 'Australian truck load compliance calculator',
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-screen w-screen overflow-hidden bg-gray-950">
      {children}
    </div>
  );
}

