import type { FC } from '../../../../lib/teact/teact';
import React, { memo, useEffect, useState } from '../../../../lib/teact/teact';

import useLang from '../../../../hooks/useLang';
import useLastCallback from '../../../../hooks/useLastCallback';
import { truncateAddress } from '../../../wallet/config';
import { formatSolAmount, formatTokenBalance, formatUsdValue } from '../../../wallet/walletUtils';
import { useWalletTeact } from '../../../wallet/WalletProvider';
import type { TokenInfo } from '../../../../types/blinks';

import Icon from '../../../common/icons/Icon';
import Button from '../../../ui/Button';
import Spinner from '../../../ui/Spinner';
import Menu from '../../../ui/Menu';
import MenuItem from '../../../ui/MenuItem';
import { WalletScreens } from '../WalletScreens';

import './WalletMain.scss';

export type OwnProps = {
  isActive?: boolean;
  onScreenSelect: (screen: WalletScreens) => void;
  onOpenMainMenu: (position: { x: number; y: number }) => void;
};

const WalletMain: FC<OwnProps> = ({
  isActive,
  onScreenSelect,
  onOpenMainMenu,
}) => {
  const lang = useLang();
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [selectedToken, setSelectedToken] = useState<TokenInfo | null>(null);
  const [selectedTokenMenuPosition, setSelectedTokenMenuPosition] = useState<{ x: number; y: number } | null>(null);

  // Use the Solana wallet integration
  const { 
    ready, 
    connected, 
    address, 
    balance,
    walletName,
    network,
    isOwnKeypair,
    tokens,
    isLoadingTokens,
    createKeypair,
    getTokens,
    exportPrivateKey,
    exportKeypairJson,
  } = useWalletTeact();

  // Fetch tokens on component mount
  useEffect(() => {
    if (connected && address) {
      getTokens().catch(console.error);
    }
  }, [connected, address, getTokens]);

  // Handle creating own keypair
  const handleCreateKeypair = useLastCallback(async () => {
    setError(null);
    try {
      const result = await createKeypair();
      if (result && result.publicKey) {
        // Show success message
        setError(null);
      }
    } catch (err) {
      setError('Failed to create keypair');
    }
  });

  const handleOpenImport = useLastCallback(() => {
    onScreenSelect(WalletScreens.ImportWallet);
  });

  // Handle copy address to clipboard
  const handleCopyAddress = useLastCallback(() => {
    if (!address) return;
    navigator.clipboard.writeText(address);
  });

  // Handle token selection - opens context menu
  const handleTokenClick = useLastCallback((token: TokenInfo, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedToken(token);
    setSelectedTokenMenuPosition({ x: e.clientX, y: e.clientY });
  });

  // Handle token menu actions
  const handleTokenSend = useLastCallback(() => {
    if (selectedToken) {
      onScreenSelect(WalletScreens.Send);
    }
    setSelectedTokenMenuPosition(null);
  });

  const handleTokenReceive = useLastCallback(() => {
    if (selectedToken) {
      onScreenSelect(WalletScreens.Receive);
    }
    setSelectedTokenMenuPosition(null);
  });

  const handleCloseTokenMenu = useLastCallback(() => {
    setSelectedTokenMenuPosition(null);
  });

  // Handler for exporting private key
  const handleExportPrivateKey = useLastCallback(() => {
    if (!isOwnKeypair) {
      setError(lang('PrivateKeyOnlyAvailableForOwnWallet'));
      return;
    }
    
    const privateKey = exportPrivateKey();
    if (privateKey) {
      navigator.clipboard.writeText(privateKey);
      setError(null);
      // Show success message instead of error
      setTxHash('private-key-copied');
      // Clear success message after 3 seconds
      setTimeout(() => {
        if (txHash === 'private-key-copied') {
          setTxHash(null);
        }
      }, 3000);
    } else {
      setError(lang('FailedToExportPrivateKey'));
    }
  });

  // Handler for exporting wallet as JSON
  const handleExportWalletJson = useLastCallback(() => {
    if (!isOwnKeypair) {
      setError(lang('WalletExportOnlyAvailableForOwnWallet'));
      return;
    }
    
    const walletJson = exportKeypairJson();
    if (walletJson) {
      // Create a download for the JSON file
      const blob = new Blob([walletJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `solana-wallet-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setError(null);
    } else {
      setError(lang('FailedToExportWalletJSON'));
    }
  });

  // Calculate total USD value of all tokens
  const calculateTotalValue = () => {
    return tokens.reduce((total, token) => total + token.usdValue, 0);
  };

  // Render wallet content based on connection state
  if (!ready) {
    return (
      <div className="wallet-loading">
        <Spinner color="blue" />
        <p>{lang('Loading')}</p>
      </div>
    );
  }
  
  if (!connected) {
    return (
      <div className="wallet-connect">
        <div className="wallet-icon">
          <Icon name="card" />
        </div>
        <h3>{lang('ConnectYourWallet')}</h3>
        <p>{lang('ConnectYourSolanaWallet')}</p>
        
        <div className="wallet-connect-options">
          <Button
            onClick={handleCreateKeypair}
            className="wallet-create-button"
            color="secondary"
          >
            <Icon name="key" className="button-icon" />
            {lang('CreateOwnKeypair')}
          </Button>
          
          <Button
            onClick={handleOpenImport}
            className="wallet-import-button"
            color="translucent"
          >
            <Icon name="download" className="button-icon" />
            {lang('ImportWallet')}
          </Button>
        </div>
        
        <div className="wallet-network-info">
          <span className="network-label">Network:</span>
          <span className="network-value">
            {network.charAt(0).toUpperCase() + network.slice(1)}
          </span>
        </div>
      </div>
    );
  }

  const totalUsdValue = calculateTotalValue();
  
  return (
    <div className="wallet-details">
      {/* Wallet info at top */}
      <div className="wallet-balance-overview">
        <div className="wallet-info">
          <div className="wallet-address" onClick={handleCopyAddress} title={address || ''}>
            {address ? truncateAddress(address, 6, 4) : '...'}
            <Icon name="copy" className="copy-icon" />
          </div>
          {isOwnKeypair && (
            <Button
              round
              size="smaller"
              color="translucent"
              className="wallet-menu-button"
              onClick={handleExportPrivateKey}
              ariaLabel={lang('ExportPrivateKey')}
              title={lang('ExportPrivateKey')}
            >
              <Icon name="key" />
            </Button>
          )}
        </div>
        <div className="balance-header">
          <span className="balance-label">{lang('TotalBalance')}</span>
          <span className="balance-value">
            {formatUsdValue(totalUsdValue)}
          </span>
        </div>
      </div>
      
      {/* Send via QR button */}
      <div className="wallet-actions">
        <Button
          onClick={() => onScreenSelect(WalletScreens.SendQR)}
          className="wallet-action-button"
          color="primary"
        >
          <Icon name="scan" className="button-icon" />
          {lang('SendViaScanQR')}
        </Button>
      </div>

      {/* Token list - the main content */}
      <div className="wallet-tokens">
        <div className="tokens-list">
          {isLoadingTokens ? (
            <div className="tokens-loading">
              <Spinner size="medium" />
              <span>{lang('LoadingTokens')}</span>
            </div>
          ) : tokens.length ===
           0 ? (
            <div className="no-tokens">
              <p>{lang('NoTokensFound')}</p>
            </div>
          ) : (
            tokens.map((token) => (
              <div
                key={token.address}
                className="token-item"
              >
                <div className="token-icon">
                  {token.logoUrl ? (
                    <img src={token.logoUrl} alt={token.symbol} />
                  ) : (
                    <div className="token-placeholder">
                      {token.symbol.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="token-info">
                  <div className="token-name-row">
                    <span className="token-symbol">{token.symbol}</span>
                    <span className="token-name">{token.name}</span>
                  </div>
                  <div className="token-balance-row">
                    <span className="token-balance">
                      {formatTokenBalance(token.balance, token.decimals)} {token.symbol}
                    </span>
                    <span className="token-value">
                      {formatUsdValue(token.usdValue)}
                    </span>
                  </div>
                </div>
                <Button
                  round
                  size="smaller"
                  color="translucent"
                  className="token-menu-button"
                  onClick={(e) => handleTokenClick(token, e)}
                  ariaLabel={lang('TokenOptions')}
                >
                  <Icon name="more" />
                </Button>
              </div>
            ))
          )}
        </div>
      </div>
      
      {error && <div className="wallet-error">{error}</div>}
      
      {txHash && (
        <div className="wallet-success">
          {txHash === 'private-key-copied' 
            ? lang('PrivateKeyCopiedToClipboard')
            : (
              <>
                {lang('TransactionSent')}
                <a 
                  href={`https://explorer.solana.com/tx/${txHash}?cluster=${network}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  {lang('ViewOnExplorer')}
                </a>
              </>
            )
          }
        </div>
      )}

      {/* Token context menu */}
      {selectedTokenMenuPosition && selectedToken && (
        <Menu
          isOpen
          positionX="right"
          positionY="top"
          style={{
            position: 'fixed',
            top: selectedTokenMenuPosition.y,
            left: selectedTokenMenuPosition.x,
          }}
          onClose={handleCloseTokenMenu}
          className="token-context-menu"
        >
          <MenuItem icon="send" onClick={handleTokenSend}>
            {lang('SendToken', { token: selectedToken.symbol })}
          </MenuItem>
          <MenuItem icon="download" onClick={handleTokenReceive}>
            {lang('ReceiveToken', { token: selectedToken.symbol })}
          </MenuItem>
          <MenuItem icon="eye" onClick={handleCloseTokenMenu}>
            {lang('ViewOnExplorer')}
          </MenuItem>
          {isOwnKeypair && (
            <>
              <MenuItem icon="key" onClick={handleExportPrivateKey}>
                {lang('ExportPrivateKey')}
              </MenuItem>
              <MenuItem icon="document" onClick={handleExportWalletJson}>
                {lang('ExportWalletJSON')}
              </MenuItem>
            </>
          )}
        </Menu>
      )}
    </div>
  );
};

export default memo(WalletMain);