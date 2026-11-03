import { useEffect } from 'react';

import { Backdrop } from '@/components/Backdrop/Starfield';
import { ConsoleDeck } from '@/components/ConsoleDeck/ConsoleDeck';
import { Drawer, DrawerScrim } from '@/components/Drawer/Drawer';
import { LegendPanel } from '@/components/Legend/Legend';
import { LightboxWall } from '@/components/LightboxWall/LightboxWall';
import { Marquee } from '@/components/Marquee/Marquee';
import { PlaquePanel } from '@/components/Plaque/Plaque';
import { PulseLayer } from '@/components/PulseLayer/PulseLayer';
import { TelemetryHud } from '@/components/TelemetryHud/TelemetryHud';
import { useDocumentSync } from '@/hooks/useDocumentSync';
import { useFullscreenSync } from '@/hooks/useFullscreenSync';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useIsCompact } from '@/hooks/useMediaQuery';
import { useViewportUnits } from '@/hooks/useViewportUnits';
import { installPublicApi } from '@/publicApi';
import { useExhibitStore } from '@/state/hooks';

import '@/components/Panel/Panel.css';
import '@/styles/responsive.css';
import '@/styles/mobile.css';

export function App() {
  const store = useExhibitStore();
  const compact = useIsCompact();

  useDocumentSync();
  useKeyboardShortcuts();
  useFullscreenSync();
  useViewportUnits();

  useEffect(() => {
    const uninstall = installPublicApi(store);
    store.boot();
    return () => {
      uninstall();
      store.dispose();
    };
  }, [store]);

  // a drawer left open on a tablet should not survive a rotation back to the wide layout
  useEffect(() => {
    if (!compact) store.closeDrawer();
  }, [compact, store]);

  return (
    <>
      <Backdrop />
      <div id="app" data-layout={compact ? 'compact' : 'wide'}>
        <Marquee />
        <main className="stage">
          {compact ? null : <LegendPanel />}
          <LightboxWall />
          {compact ? null : <PlaquePanel />}
        </main>
        <ConsoleDeck />
      </div>
      {compact ? (
        <>
          <DrawerScrim />
          <Drawer id="legend" side="left" label="核合成过程图例 · Nucleosynthesis legend">
            <LegendPanel />
          </Drawer>
          <Drawer id="plaque" side="right" label="当前纪元铭牌 · Epoch plaque">
            <PlaquePanel />
          </Drawer>
        </>
      ) : null}
      <TelemetryHud />
      <PulseLayer />
    </>
  );
}
