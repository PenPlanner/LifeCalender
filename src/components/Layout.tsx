import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Calendar, Settings } from 'lucide-react';
import { ThemeController } from './ThemeController';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  
  return (
    <div className="min-h-screen bg-base-200" data-theme="lifecalendar">
      <div className="navbar bg-base-100/80 backdrop-blur-md shadow-sm h-12 min-h-0 px-4">
        <div className="navbar-start">
          <Link to="/" className="btn btn-ghost btn-sm normal-case gap-1">
            <Calendar size={16} />
            <span className="font-bold text-sm bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              LifeCalendar
            </span>
          </Link>
        </div>
        
        <div className="navbar-center">
          <ul className="menu menu-horizontal p-0 gap-1">
            <li>
              <Link
                to="/"
                className={`btn btn-xs ${location.pathname === '/' ? 'btn-primary' : 'btn-ghost'} gap-1`}
              >
                <Calendar size={12} />
                Kalender
              </Link>
            </li>
            <li>
              <Link
                to="/admin"
                className={`btn btn-xs ${location.pathname === '/admin' ? 'btn-primary' : 'btn-ghost'} gap-1`}
              >
                <Settings size={12} />
                Admin
              </Link>
            </li>
          </ul>
        </div>
        
        <div className="navbar-end gap-1">
          <ThemeController />
        </div>
      </div>
      
      <main className="min-h-[calc(100vh-3rem)] overflow-y-auto">
        {children}
      </main>
    </div>
  );
}