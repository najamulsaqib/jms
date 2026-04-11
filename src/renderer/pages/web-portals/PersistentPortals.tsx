import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTab } from '@contexts/TabContext';
import { usePortalPages } from '@hooks/usePortalPages';
import WebPortal from './Portal';

// Portal webviews are mounted only while their tabs are open so closing
// a portal tab tears down the underlying webview and stops playback/audio.
export default function PersistentPortals() {
  const location = useLocation();
  const navigate = useNavigate();
  const { portalPages } = usePortalPages();
  const { portalTabs, openPortalTabIds, tabsByPath, closeTab } = useTab();
  const activePages = portalPages.filter((p) => p.isActive);
  const openPortalPages = activePages.filter((page) =>
    openPortalTabIds.has(page.id),
  );

  // If the current route points at a portal tab that is no longer open,
  // leave the portal route so the app does not sit on a blank page.
  useEffect(() => {
    const match = location.pathname.match(/^\/portal\/(.+)$/);
    if (!match) return;

    const portalId = match[1];
    const tab = tabsByPath[`/portal/${portalId}`];

    if (!openPortalTabIds.has(portalId)) {
      if (tab) closeTab(tab.id);
      navigate('/');
    }
  }, [location.pathname, openPortalTabIds, tabsByPath, closeTab, navigate]);

  // Remove tabs whose portal has been deleted from settings.
  useEffect(() => {
    const existingPortalIds = new Set(portalPages.map((p) => p.id));
    const orphanedPortalTabs = portalTabs.filter((tab) => {
      const portalId = tab.path.replace('/portal/', '');
      return !existingPortalIds.has(portalId);
    });

    orphanedPortalTabs.forEach((tab) => closeTab(tab.id));
  }, [portalPages, portalTabs, closeTab]);

  // If a portal is deleted while open, close the tab and leave the route.
  useEffect(() => {
    const match = location.pathname.match(/^\/portal\/(.+)$/);
    if (!match) return;

    const portalId = match[1];
    const stillExists = activePages.some((p) => p.id === portalId);
    if (!stillExists) {
      const tab = tabsByPath[`/portal/${portalId}`];
      if (tab) closeTab(tab.id);
      navigate('/');
    }
  }, [activePages, location.pathname, tabsByPath, closeTab, navigate]);

  return (
    <>
      {openPortalPages.map((page) => (
        <div
          key={page.id}
          style={{
            display:
              location.pathname === `/portal/${page.id}` ? 'contents' : 'none',
          }}
        >
          <WebPortal page={page} />
        </div>
      ))}
    </>
  );
}
