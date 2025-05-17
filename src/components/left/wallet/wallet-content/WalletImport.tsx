import type { FC } from '../../../../lib/teact/teact';
import React, { memo, useState } from '../../../../lib/teact/teact';

import useLang from '../../../../hooks/useLang';
import useLastCallback from '../../../../hooks/useLastCallback';
import { useWalletTeact } from '../../../wallet/WalletProvider';

import Button from '../../../ui/Button';
import Icon from '../../../common/icons/Icon';

import './WalletImport.scss';

export type OwnProps = {
  isActive?: boolean;
  onReset: () => void;
};

const WalletImport: FC<OwnProps> = ({
  isActive,
  onReset,
}) => {
  const lang = useLang();
  const [isLoading, setIsLoading] = useState(false);
  const [privateKey, setPrivateKey] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);

  const { 
    importWallet
  } = useWalletTeact();

  // Handle private key input change
  const handlePrivateKeyChange = useLastCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrivateKey(e.target.value);
    setError(null);
  });

  // Handle wallet import
  const handleImportWallet = useLastCallback(async () => {
    if (!privateKey.trim()) {
      setError(lang('PrivateKeyRequired'));
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const success = await importWallet(privateKey);
      if (success) {
        setImportSuccess(true);
        setPrivateKey('');
        // Redirect back to main after successful import
        setTimeout(() => {
          onReset();
        }, 1500);
      } else {
        setError(lang('ImportFailedInvalidKey'));
      }
    } catch (err) {
      setError(lang('ImportFailedTryAgain'));
    } finally {
      setIsLoading(false);
    }
  });

  return (
    <div className="WalletImport">
      <div className="wallet-import-content">
        <h4>{lang('ImportWallet')}</h4>
        
        <div className="import-instructions">
          <p>{lang('ImportWalletInstructions')}</p>
        </div>
        
        <div className="form-group">
          <label htmlFor="wallet-private-key">{lang('EnterPrivateKey')}</label>
          <textarea
            id="wallet-private-key"
            value={privateKey}
            onChange={handlePrivateKeyChange}
            placeholder={lang('PastePrivateKeyHere')}
            disabled={isLoading || importSuccess}
            rows={3}
            spellCheck={false}
            autoComplete="off"
            autoCorrect="off"
            className="private-key-input"
          />
        </div>
        
        {error && (
          <div className="wallet-error">
            <Icon name="error" className="error-icon" />
            <span>{error}</span>
          </div>
        )}
        
        {importSuccess && (
          <div className="wallet-success">
            <Icon name="check" className="success-icon" />
            <span>{lang('WalletImportedSuccessfully')}</span>
          </div>
        )}
        
        <div className="wallet-import-actions">
          <Button
            isLoading={isLoading}
            onClick={handleImportWallet}
            disabled={!privateKey.trim() || isLoading || importSuccess}
            className="wallet-import-button"
          >
            {lang('ImportWallet')}
          </Button>
        </div>
        
        <div className="wallet-security-warning">
          <Icon name="warn" className="warning-icon" />
          <p>{lang('WalletSecurityWarning')}</p>
        </div>
      </div>
    </div>
  );
};

export default memo(WalletImport);