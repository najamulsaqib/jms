import { ReactNode } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

interface AppLayoutProps {
  children: ReactNode;
  title?: string;
  breadcrumbs?: Array<{ label: string; href?: string }>;
}

export default function AppLayout({
  children,
  title,
  breadcrumbs,
}: AppLayoutProps) {
  return (
    <div className="flex h-screen bg-linear-to-br from-slate-50 via-blue-50/30 to-slate-100 border border-slate-200">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title={title} breadcrumbs={breadcrumbs} />
        <main className="flex-1 overflow-auto">
          <div className="w-full min-h-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
