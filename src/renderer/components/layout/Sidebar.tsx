import { useAuth } from '@contexts/AuthContext';
import {
  BanknotesIcon,
  Cog6ToothIcon,
  DocumentTextIcon,
  HomeIcon,
  GlobeAltIcon,
  ArrowLeftStartOnRectangleIcon as LogoutIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';
import { useTabNavigate } from '@hooks/useTabNavigate';
import { usePortalPages } from '@hooks/usePortalPages';
import { useLocation } from 'react-router-dom';

import logo from '../../../../assets/header-logo.png';

const staticNavigation = [
  { name: 'Dashboard', href: '/', icon: HomeIcon },
  { name: 'Tax Records', href: '/tax-records', icon: DocumentTextIcon },
  { name: 'Sales Tax', href: '/sales-tax', icon: BanknotesIcon },
];

export default function Sidebar() {
  const location = useLocation();
  const { signOut, userInfo } = useAuth();
  const tabNavigate = useTabNavigate();
  const { portalPages } = usePortalPages();
  const isSettingsActive = location.pathname.startsWith('/settings');

  const activePortals = portalPages.filter((p) => p.isActive);

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
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {/* Static nav items */}
        {staticNavigation.map((item) => {
          const isActive =
            item.href === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.href);
          return (
            <button
              key={item.name}
              onClick={() =>
                tabNavigate(
                  item.href,
                  item.name,
                  item.icon && <item.icon className="h-5 w-5" />,
                )
              }
              className={`
                w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer
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
            </button>
          );
        })}

        {/* Portal nav items */}
        {activePortals.length > 0 && (
          <>
            <div className="pt-3 pb-1 px-3">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                Portals
              </p>
            </div>
            {activePortals.map((portal) => {
              const href = `/portal/${portal.id}`;
              const isActive = location.pathname === href;
              return (
                <button
                  key={portal.id}
                  onClick={() =>
                    tabNavigate(
                      href,
                      portal.name,
                      <GlobeAltIcon className="h-5 w-5" />,
                    )
                  }
                  className={`
                    w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer
                    ${
                      isActive
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                    }
                  `}
                >
                  <GlobeAltIcon
                    className={`mr-3 h-5 w-5 shrink-0 ${
                      isActive ? 'text-blue-600' : 'text-slate-400'
                    }`}
                  />
                  <span className="truncate">{portal.name}</span>
                </button>
              );
            })}
          </>
        )}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-slate-200 space-y-1">
        {userInfo && (
          <div className="flex items-center gap-2 px-3 py-2 mb-1">
            {userInfo.avatarUrl ? (
              <img
                src={userInfo.avatarUrl}
                alt="Avatar"
                className="h-7 w-7 rounded-full shrink-0 object-cover border-slate-200 border bg-blue-50"
              />
            ) : (
              <div className="h-7 w-7 shrink-0 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center">
                <UserCircleIcon className="h-5 w-5 text-blue-500" />
              </div>
            )}
            <p className="text-xs text-slate-400 truncate">
              {userInfo.fullName || userInfo.email || 'Account'}
            </p>
          </div>
        )}
        <button
          onClick={() =>
            tabNavigate(
              '/settings',
              'Settings',
              <Cog6ToothIcon className="h-5 w-5" />,
            )
          }
          className={`flex items-center w-full px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
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
        </button>
        <button
          type="button"
          className="flex items-center w-full px-3 py-2 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
          onClick={() => signOut()}
        >
          <LogoutIcon className="mr-3 h-5 w-5" />
          Sign Out
        </button>
      </div>
    </div>
  );
}
