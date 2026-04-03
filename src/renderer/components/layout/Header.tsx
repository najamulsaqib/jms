import { Link } from 'react-router-dom';
import { ChevronRightIcon } from '@heroicons/react/20/solid';

interface HeaderProps {
  title?: string;
  breadcrumbs?: Array<{ label: string; href?: string }>;
}

export default function Header({ title, breadcrumbs }: HeaderProps) {
  return (
    <header className="bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 h-16 flex items-center">
      <div className="w-full">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="flex py-3" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-2">
              {breadcrumbs.map((crumb, index) => (
                <li key={index} className="flex items-center">
                  {index > 0 && (
                    <ChevronRightIcon className="h-5 w-5 text-slate-400 mx-2" />
                  )}
                  {crumb.href ? (
                    <Link
                      to={crumb.href}
                      className="text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors"
                    >
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="text-sm font-medium text-slate-900">
                      {crumb.label}
                    </span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        )}

        {title && !breadcrumbs && (
          <div className="py-4">
            <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
          </div>
        )}
      </div>
    </header>
  );
}
