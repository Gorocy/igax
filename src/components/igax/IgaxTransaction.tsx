import React, { memo, useState } from '../../lib/teact/teact';
import type { FC } from '../../lib/teact/teact';

import useLang from '../../hooks/useLang';
import useLastCallback from '../../hooks/useLastCallback';
import { useWalletTeact } from '../wallet/WalletProvider';
import buildClassName from '../../util/buildClassName';
import type { IgaxSendTransaction } from '../../types/igaxBot';

import Button from '../ui/Button';
import Icon from '../common/icons/Icon';
import Spinner from '../ui/Spinner';
import TransactionConfirmationModal from './TransactionConfirmationModal';

import './IgaxTransaction.scss';

interface Props {
  transaction: IgaxSendTransaction;
  className?: string;
  showWallet?: boolean;
  toggleWallet?: () => void;
  onSendTransaction?: (amount: string) => void;
}

const IgaxTransaction: FC<Props> = ({
  transaction,
  className,
  showWallet = false,
  toggleWallet,
  onSendTransaction,
}) => {
  const lang = useLang();
  const wallet = useWalletTeact();
  const [error, setError] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [pendingTransaction, setPendingTransaction] = useState<string | null>(null);

  const handleAmountChange = useLastCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setAmount(e.target.value);
  });

  const handleSendClick = useLastCallback(() => {
    // Show modal with transaction details and wait for confirmation
    setPendingTransaction(`Transaction to ${transaction.walletAddress}\nAmount: ${amount} SOL`);
    setIsConfirmModalOpen(true);
  });

  const handleConfirmTransaction = useLastCallback(() => {
    // Only call the parent handler after user confirmation
    if (onSendTransaction) {
      onSendTransaction(amount);
    }
    // Close modal and clear pending transaction
    setIsConfirmModalOpen(false);
    setPendingTransaction(null);
  });

  const handleCancelTransaction = useLastCallback(() => {
    // Close modal and clear pending transaction
    setIsConfirmModalOpen(false);
    setPendingTransaction(null);
  });

  return (
    <>
      {/* Transaction Confirmation Modal */}
      <TransactionConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={handleCancelTransaction}
        onConfirm={handleConfirmTransaction}
        onCancel={handleCancelTransaction}
        transaction={pendingTransaction}
        title={lang('ConfirmTransaction') || 'Confirm Transaction'}
        message={lang('SignTransactionMessage') || `Do you want to send ${amount} SOL to this address?`}
      />

      {/* Main Transaction Component */}
      <div className={buildClassName('IgaxTransaction', className)}>
        <div className="transaction-header">
          <h3 className="transaction-title">{transaction.title}</h3>
          
          {toggleWallet && (
            <Button
              className="wallet-toggle"
              onClick={toggleWallet}
              ariaLabel={showWallet ? "Hide wallet address" : "Show wallet address"}
            >
              <Icon name={showWallet ? "eye-crossed" : "eye"} />
            </Button>
          )}

          {error && (
            <div className="transaction-error">
              <Icon name="bug" className="error-icon" />
              <span className="error-message">{error}</span>
              <Button
                color="primary"
                size="tiny"
                onClick={() => setError(null)}
                className="error-close-button"
              >
                <Icon name="close" />
              </Button>
            </div>
          )}
        </div>

        <div className="transaction-body">
          <div className="transaction-description-container">
            <p className="transaction-description">{transaction.description}</p>
          </div>

          {showWallet && (
            <div className="transaction-recipient">
              <div className="recipient-label">{lang('RecipientAddress') || 'Recipient Address'}</div>
              <div className="recipient-value">{transaction.walletAddress}</div>
            </div>
          )}
        </div>

        <div className="transaction-actions">
          <div className="action-input-wrapper">
            <input
              type="text"
              className="amount-input"
              placeholder="0.00"
              pattern="[0-9]*\.?[0-9]+"
              value={amount}
              onChange={handleAmountChange}
            />
            <Button
              className="send-button"
              color="primary"
              disabled={!wallet.connected}
              isRectangular
              ripple
              onClick={handleSendClick}
            >
              {lang('SendTransaction') || 'Send SOL'}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default memo(IgaxTransaction);