import type { FC } from '../../../lib/teact/teact';
import React, { memo, useRef, useState } from '../../../lib/teact/teact';

import { WalletScreens } from './WalletScreens';
import useLastCallback from '../../../hooks/useLastCallback';
import { LAYERS_ANIMATION_NAME } from '../../../util/browser/windowEnvironment';
import useHistoryBack from '../../../hooks/useHistoryBack';
import useMarkScrolled from '../../../hooks/useMarkScrolled/useMarkScrolled';

import Transition from '../../ui/Transition';
import WalletHeader from './wallet-content/WalletHeader';
import WalletMain from './wallet-content/WalletMain';
import WalletSend from './wallet-content/WalletSend';
import WalletSendQR from './wallet-content/WalletSendQR';
import WalletReceive from './wallet-content/WalletReceive';
import WalletManage from './wallet-content/WalletManage';
import WalletImport from './wallet-content/WalletImport';

import './WalletView.scss';

const TRANSITION_RENDER_COUNT = Object.keys(WalletScreens).length / 2;
const TRANSITION_DURATION = 200;

export type OwnProps = {
  isActive?: boolean;
  onReset: () => void;
};

const WalletView: FC<OwnProps> = ({
  isActive,
  onReset,
}) => {
  // eslint-disable-next-line no-null/no-null
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentScreen, setCurrentScreen] = useState<WalletScreens>(WalletScreens.Main);
  const [shouldSkipTransition, setShouldSkipTransition] = useState(false);

  useHistoryBack({
    isActive,
    onBack: onReset,
  });

  useMarkScrolled({
    containerRef,
    selector: '.wallet-content',
  }, [currentScreen]);

  const handleScreenSelect = useLastCallback((screen: WalletScreens) => {
    setCurrentScreen(screen);
  });

  const handleReset = useLastCallback(() => {
    if (currentScreen !== WalletScreens.Main) {
      setCurrentScreen(WalletScreens.Main);
      return;
    }
    
    // If we're already on the main screen, go back to previous view
    onReset();
  });

  // Handle opening the main menu from WalletMain
  const handleOpenMainMenu = useLastCallback((position: { x: number; y: number }) => {
    // This would be implemented if needed, but now we use the menu in WalletHeader
  });

  function renderCurrentSectionContent(isScreenActive: boolean, activeScreen: WalletScreens) {
    switch (activeScreen) {
      case WalletScreens.Main:
        return (
          <WalletMain
            isActive={isActive && isScreenActive}
            onScreenSelect={handleScreenSelect}
            onOpenMainMenu={handleOpenMainMenu}
          />
        );
      case WalletScreens.Send:
        return (
          <WalletSend
            isActive={isScreenActive}
            onReset={handleReset}
          />
        );
      case WalletScreens.SendQR:
        return (
          <WalletSendQR
            isActive={isScreenActive}
            onReset={handleReset}
            onScreenSelect={handleScreenSelect}
          />
        );
      case WalletScreens.Receive:
        return (
          <WalletReceive
            isActive={isScreenActive}
            onReset={handleReset}
          />
        );
      case WalletScreens.ManageWallet:
        return (
          <WalletManage
            isActive={isScreenActive}
            onReset={handleReset}
          />
        );
      case WalletScreens.ImportWallet:
        return (
          <WalletImport
            isActive={isScreenActive}
            onReset={handleReset}
          />
        );
      default:
        return undefined;
    }
  }

  function renderCurrentSection(
    isScreenActive: boolean,
    _isFrom: boolean,
    _currentKey: WalletScreens,
    activeKey: WalletScreens,
  ) {
    return (
      <>
        <WalletHeader
          currentScreen={activeKey}
          onReset={handleReset}
          onScreenSelect={handleScreenSelect}
        />
        <div className="wallet-content custom-scroll">
          {renderCurrentSectionContent(isScreenActive, activeKey)}
        </div>
      </>
    );
  }

  return (
    <div className="WalletView">
      <Transition
        ref={containerRef}
        id="WalletView"
        name={shouldSkipTransition ? 'none' : LAYERS_ANIMATION_NAME}
        activeKey={currentScreen}
        renderCount={TRANSITION_RENDER_COUNT}
        shouldWrap
        withSwipeControl
      >
        {renderCurrentSection}
      </Transition>
    </div>
  );
};

export default memo(WalletView);