import type { FC } from '../../../../lib/teact/teact';
import React, { memo, useState } from '../../../../lib/teact/teact';

import useLang from '../../../../hooks/useLang';
import useLastCallback from '../../../../hooks/useLastCallback';
import { WalletScreens } from '../WalletScreens';

import Button from '../../../ui/Button';
import Icon from '../../../common/icons/Icon';
import Menu from '../../../ui/Menu';
import MenuItem from '../../../ui/MenuItem';

import './WalletHeader.scss';

export type OwnProps = {
  currentScreen: WalletScreens;
  onReset: () => void;
  onScreenSelect: (screen: WalletScreens) => void;
};

const WalletHeader: FC<OwnProps> = ({
  currentScreen,
  onReset,
  onScreenSelect,
}) => {
  const lang = useLang();
  const [isMainMenuOpen, setIsMainMenuOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<{ x: number; y: number } | null>(null);

  function getScreenTitle() {
    switch (currentScreen) {
      case WalletScreens.Main:
        return lang('Wallet');
      case WalletScreens.Send:
        return lang('SendSOL');
      case WalletScreens.Receive:
        return lang('ReceiveSOL');
      case WalletScreens.ManageWallet:
        return lang('ManageWallet');
      case WalletScreens.ImportWallet:
        return lang('ImportWallet');
      case WalletScreens.NetworkSelection:
        return lang('SelectNetwork');
      default:
        return lang('Wallet');
    }
  }

  const shouldShowBackButton = true; // Always show back button
  const shouldShowMenuButton = currentScreen === WalletScreens.Main;

  const handleOpenMenu = useLastCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    
    const rect = e.currentTarget.getBoundingClientRect();
    
    setMenuPosition({
      x: rect.right,
      y: rect.bottom,
    });
    
    setIsMainMenuOpen(true);
  });

  const handleCloseMenu = useLastCallback(() => {
    setIsMainMenuOpen(false);
  });

  const handleSend = useLastCallback(() => {
    onScreenSelect(WalletScreens.Send);
    handleCloseMenu();
  });

  const handleReceive = useLastCallback(() => {
    onScreenSelect(WalletScreens.Receive);
    handleCloseMenu();
  });

  const handleManage = useLastCallback(() => {
    onScreenSelect(WalletScreens.ManageWallet);
    handleCloseMenu();
  });

  const handleImport = useLastCallback(() => {
    onScreenSelect(WalletScreens.ImportWallet);
    handleCloseMenu();
  });

  const handleNetworkSelect = useLastCallback(() => {
    onScreenSelect(WalletScreens.NetworkSelection);
    handleCloseMenu();
  });

  return (
    <div className="WalletHeader">
      <div className="left-header">
        {shouldShowBackButton && (
          <Button
            round
            size="smaller"
            color="translucent"
            onClick={onReset}
            ariaLabel="Return to wallet main"
            className="wallet-back-button"
          >
            <Icon name="arrow-left" />
          </Button>
        )}
        <h3>{getScreenTitle()}</h3>
      </div>
      
      {shouldShowMenuButton && (
        <div className="right-header">
          <Button
            round
            size="smaller"
            color="translucent"
            onClick={handleOpenMenu}
            ariaLabel="Wallet Menu"
            className="wallet-menu-button"
          >
            <Icon name="more" />
          </Button>
          
          {isMainMenuOpen && menuPosition && (
            <Menu
              isOpen
              positionX="right"
              positionY="top"
              style={{
                position: 'absolute',
                top: menuPosition.y,
                left: menuPosition.x,
              }}
              onClose={handleCloseMenu}
              className="wallet-main-menu"
            >
              <MenuItem icon="send" onClick={handleSend}>
                {lang('Send')}
              </MenuItem>
              <MenuItem icon="download" onClick={handleReceive}>
                {lang('Receive')}
              </MenuItem>
              <MenuItem icon="settings" onClick={handleManage}>
                {lang('Manage')}
              </MenuItem>
              <MenuItem icon="document" onClick={handleImport}>
                {lang('ImportWallet')}
              </MenuItem>
              <MenuItem icon="web" onClick={handleNetworkSelect}>
                {lang('SelectNetwork')}
              </MenuItem>
            </Menu>
          )}
        </div>
      )}
    </div>
  );
};

export default memo(WalletHeader);