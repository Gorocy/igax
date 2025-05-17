import type { FC } from '../../../../lib/teact/teact';
import React, { memo, useState } from '../../../../lib/teact/teact';

import useLang from '../../../../hooks/useLang';
import useLastCallback from '../../../../hooks/useLastCallback';
import { useWalletTeact } from '../../../wallet/WalletProvider';

import Button from '../../../ui/Button';

import './WalletSend.scss';

export type OwnProps = {
  isActive?: boolean;
  onReset: () => void;
};

const WalletSend: FC<OwnProps> = ({
  isActive,
  onReset,
}) => {
  const lang = useLang();
  const [isLoading, setIsLoading] = useState(false);
  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const scannedAddress = sessionStorage.getItem('scannedSolanaAddress');
  if (scannedAddress) {
    setRecipient(scannedAddress);
    sessionStorage.removeItem('scannedSolanaAddress');
  }
  // Use the Solana wallet integration
  const { 
    connected, 
    address, 
    balance,
    network,
    getBalance,
    sendTransaction
  } = useWalletTeact();

  // Handle sending SOL
  const handleSendTransaction = useLastCallback(async () => {
    if (!recipient || !amount) return;
    
    setIsLoading(true);
    setError(null);
    setTxHash(null);
    
    try {
      const amountValue = parseFloat(amount);
      if (isNaN(amountValue) || amountValue <= 0) {
        setError('Invalid amount');
        setIsLoading(false);
        return;
      }
      
      const result = await sendTransaction(recipient, amountValue);
      
      if ('error' in result) {
        setError(result.error);
      } else {
        setTxHash(result.signature);
        setAmount('');
        setRecipient('');
        
        // Refresh balance
        await getBalance();
      }
    } catch (err) {
      setError('Transaction failed');
    } finally {
      setIsLoading(false);
    }
  });

  // Handle input changes
  const handleAmountChange = useLastCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setAmount(e.target.value);
  });

  const handleRecipientChange = useLastCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setRecipient(e.target.value);
  });

  // Set max amount (balance - 0.01 for fees)
  const handleSetMaxAmount = useLastCallback(() => {
    if (balance !== null && balance > 0) {
      const maxAmount = balance > 0.01 ? (balance - 0.01).toFixed(5) : 0;
      setAmount(String(maxAmount));
    }
  });

  return (
    <div className="WalletSend">
      <div className="wallet-send-content">
        <h4>{lang('SendSOL')}</h4>
        
        <div className="form-group">
          <label htmlFor="wallet-recipient">{lang('RecipientAddress')}</label>
          <input
            type="text"
            id="wallet-recipient"
            value={recipient}
            onChange={handleRecipientChange}
            placeholder="Solana address"
            disabled={isLoading}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="wallet-amount">{lang('AmountSOL')}</label>
          <input
            type="text"
            id="wallet-amount"
            value={amount}
            onChange={handleAmountChange}
            placeholder="0.0"
            disabled={isLoading}
          />
          {balance !== null && balance > 0 && (
            <div className="amount-info">
              <Button
                size="tiny"
                color="translucent"
                onClick={handleSetMaxAmount}
                disabled={isLoading}
              >
                Max
              </Button>
            </div>
          )}
        </div>
        
        {error && <div className="wallet-error">{error}</div>}
        
        {txHash && (
          <div className="wallet-success">
            {lang('TransactionSent')}
            <a 
              href={`https://explorer.solana.com/tx/${txHash}?cluster=${network}`} 
              target="_blank" 
              rel="noopener noreferrer"
            >
              {lang('ViewOnExplorer')}
            </a>
          </div>
        )}
        
        <Button
          isLoading={isLoading}
          onClick={handleSendTransaction}
          disabled={!recipient || !amount || isLoading || (balance !== null && parseFloat(amount) > balance)}
          className="wallet-send-button"
        >
          {lang('Send')}
        </Button>
      </div>
    </div>
  );
};

export default memo(WalletSend);