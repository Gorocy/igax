import type { FC } from '../../../../lib/teact/teact';
import React, { memo } from '../../../../lib/teact/teact';

import useLang from '../../../../hooks/useLang';
import useLastCallback from '../../../../hooks/useLastCallback';
import { useWalletTeact } from '../../../wallet/WalletProvider';

import Icon from '../../../common/icons/Icon';
import Button from '../../../ui/Button';
import ListItem from '../../../ui/ListItem';

import './WalletManage.scss';

export type OwnProps = {
  isActive?: boolean;
  onReset: () => void;
};

const WalletManage: FC<OwnProps> = ({
  isActive,
  onReset,
}) => {
  const lang = useLang();
  const { 
    walletName,
    network,
    isOwnKeypair,
    disconnect
  } = useWalletTeact();

  // Handle wallet disconnect
  const handleDisconnect = useLastCallback(async () => {
    await disconnect();
    onReset();
  });

  // Handle export private key (for local keypairs only)
  const handleExportPrivateKey = useLastCallback(() => {
    // In a real app, handle this securely
    alert('This would securely export your private key in a real app.');
  });

  return (
    <div className="WalletManage">
      <div className="wallet-manage-content">
        <div className="wallet-info-section">
          <h4>{lang('WalletInformation')}</h4>
          <div className="wallet-info-item">
            <span className="info-label">{lang('WalletName')}:</span>
            <span className="info-value">{walletName || lang('Wallet')}</span>
          </div>
          <div className="wallet-info-item">
            <span className="info-label">{lang('WalletType')}:</span>
            <span className="info-value">{isOwnKeypair ? lang('LocalKeypair') : lang('ExternalWallet')}</span>
          </div>
          <div className="wallet-info-item">
            <span className="info-label">{lang('Network')}:</span>
            <span className="info-value">{network.charAt(0).toUpperCase() + network.slice(1)}</span>
          </div>
        </div>

        <div className="wallet-actions-section">
          <h4>{lang('Actions')}</h4>
          
          <ListItem
            icon="globe"
            onClick={() => {}}
            multiline
          >
            <span className="action-title">{lang('ChangeNetwork')}</span>
            <span className="action-description">{lang('SwitchBetweenSolanaNetworks')}</span>
          </ListItem>
          
          {isOwnKeypair && (
            <ListItem
              icon="download"
              onClick={handleExportPrivateKey}
              multiline
            >
              <span className="action-title">{lang('ExportPrivateKey')}</span>
              <span className="action-description">{lang('BackupYourWalletSecurely')}</span>
            </ListItem>
          )}
          
          <ListItem
            icon="logout"
            onClick={handleDisconnect}
            multiline
            destructive
          >
            <span className="action-title">{lang('DisconnectWallet')}</span>
            <span className="action-description">{lang('RemoveWalletConnection')}</span>
          </ListItem>
        </div>

        <div className="wallet-security-section">
          <h4>{lang('SecurityNotice')}</h4>
          <div className="security-notice">
            <Icon name="lock" className="security-icon" />
            <p>{lang('WalletSecurityNotice')}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default memo(WalletManage);