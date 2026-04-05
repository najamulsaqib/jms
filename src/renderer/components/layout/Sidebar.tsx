import { Link, useLocation } from 'react-router-dom';
import {
  HomeIcon,
  DocumentTextIcon,
  BanknotesIcon,
  Cog6ToothIcon,
  ArrowLeftStartOnRectangleIcon as LogoutIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '@contexts/AuthContext';

import logo from '../../../../assets/header-logo.png';

const navigation = [
  { name: 'Dashboard', href: '/', icon: HomeIcon },
  { name: 'Tax Records', href: '/tax-records', icon: DocumentTextIcon },
  { name: 'Sales Tax', href: '/sales-tax', icon: BanknotesIcon },
];

export default function Sidebar() {
  const location = useLocation();
  const { signOut, userInfo } = useAuth();
  const isSettingsActive = location.pathname.startsWith('/settings');

  return (
    <div className="flex flex-col w-64 bg-white border-r border-slate-200">
      {/* Logo/Brand */}
      <div className="flex items-center h-16 px-6 border-b border-slate-200">
        <div className="flex items-center">
          <img
            src={logo}
            alt="JMS Tax Consultancy"
            className="w-16 h-16 object-contain"
          />
          <span className="ml-3 text-lg font-semibold text-slate-900">
            JMS Tax
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navigation.map((item) => {
          const isActive =
            item.href === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.href);
          return (
            <Link
              key={item.name}
              to={item.href}
              className={`
                flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors
                ${
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                }
              `}
            >
              <item.icon
                className={`mr-3 h-5 w-5 shrink-0 ${
                  isActive ? 'text-blue-600' : 'text-slate-400'
                }`}
              />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-slate-200 space-y-1">
        {userInfo && (
          <div className="px-3 py-2 mb-1">
            <p className="text-xs text-slate-400 truncate">
              {userInfo.fullName || userInfo.email || 'Account'}
            </p>
          </div>
        )}
        <Link
          to="/settings"
          className={`flex items-center w-full px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
            isSettingsActive
              ? 'bg-blue-50 text-blue-700'
              : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
          }`}
        >
          <Cog6ToothIcon
            className={`mr-3 h-5 w-5 shrink-0 ${
              isSettingsActive ? 'text-blue-600' : 'text-slate-400'
            }`}
          />
          Settings
        </Link>
        <button
          type="button"
          className="flex items-center w-full px-3 py-2 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors"
          onClick={() => signOut()}
        >
          <LogoutIcon className="mr-3 h-5 w-5" />
          Sign Out
        </button>
      </div>
    </div>
  );
}
