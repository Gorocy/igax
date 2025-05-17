import type { FC } from '../../../../lib/teact/teact';
import React, { memo } from '../../../../lib/teact/teact';

import useLang from '../../../../hooks/useLang';
import useLastCallback from '../../../../hooks/useLastCallback';
import { useWalletTeact } from '../../../wallet/WalletProvider';

import Icon from '../../../common/icons/Icon';
import Button from '../../../ui/Button';

import './WalletReceive.scss';

export type OwnProps = {
  isActive?: boolean;
  onReset: () => void;
};

const WalletReceive: FC<OwnProps> = ({
  isActive,
  onReset,
}) => {
  const lang = useLang();
  const { 
    address,
    network
  } = useWalletTeact();

  // Handle copy address to clipboard
  const handleCopyAddress = useLastCallback(() => {
    if (!address) return;
    navigator.clipboard.writeText(address);
  });

  return (
    <div className="WalletReceive">
      <div className="wallet-receive-content">
        <h4>{lang('ReceiveSOL')}</h4>
        
        <div className="wallet-address-container">
          <p className="address-label">{lang('YourWalletAddress')}</p>
          <div className="address-box">
            <span className="address-text">{address}</span>
            <Button
              size="smaller"
              color="translucent"
              onClick={handleCopyAddress}
              className="copy-button"
            >
              <Icon name="copy" />
            </Button>
          </div>
        </div>

        <div className="wallet-qr-container">
          <p>{lang('ScanQRCode')}</p>
          <div className="wallet-qr">
            <img 
              src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${address}`} 
              alt="Wallet QR Code"
            />
          </div>
        </div>
        
        <div className="wallet-network-notice">
          <Icon name="info" className="info-icon" />
          <p>
            {network === 'mainnet-beta' 
              ? lang('CurrentlyOnMainnet') 
              : lang('CurrentlyOnTestnet', network.charAt(0).toUpperCase() + network.slice(1))}
          </p>
        </div>
      </div>
    </div>
  );
};

export default memo(WalletReceive);