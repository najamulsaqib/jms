import { ReactNode } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import TabBar from './TabBar';

interface AppLayoutProps {
  children: ReactNode;
  title?: string;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  fullscreen?: boolean;
}

export default function AppLayout({
  children,
  title,
  breadcrumbs,
  fullscreen = false,
}: AppLayoutProps) {
  return (
    <div className="flex h-screen bg-linear-to-br from-slate-50 via-blue-50/30 to-slate-100 border border-slate-200">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TabBar />
        <Header title={title} breadcrumbs={breadcrumbs} />
        <main
          className={
            fullscreen ? 'flex-1 overflow-hidden' : 'flex-1 overflow-auto'
          }
        >
          <div
            className={
              fullscreen
                ? 'w-full h-full'
                : 'w-full min-h-full mx-auto px-4 sm:px-6 lg:px-8 py-8'
            }
          >
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
