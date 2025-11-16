import { DashboardNavServer } from '@/components/dashboard-nav-server';

export default function SetupLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-full">
      <DashboardNavServer />
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  );
}

