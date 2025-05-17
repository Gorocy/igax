import React, { memo } from '../../lib/teact/teact';
import type { FC } from '../../lib/teact/teact';

import useLang from '../../hooks/useLang';
import useLastCallback from '../../hooks/useLastCallback';
import Modal from '../ui/Modal';
import Button from '../ui/Button';

import './TransactionConfirmationModal.scss';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onCancel: () => void;
  transaction: string | null;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
}

const TransactionConfirmationModal: FC<Props> = ({
  isOpen,
  onClose,
  onConfirm,
  onCancel,
  transaction,
  title,
  message,
  confirmText,
  cancelText,
}) => {
  const lang = useLang();

  const handleCancel = useLastCallback(() => {
    onCancel();
  });

  const handleConfirm = useLastCallback(() => {
    onConfirm();
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="transaction-confirm-modal"
      title={title || lang('ConfirmTransaction') || 'Confirm Transaction'}
      // Add a unique key to force proper rendering
      key={`transaction-modal-${transaction?.substring(0, 10) || 'none'}`}
      style={{ zIndex: 9998 } as React.CSSProperties}
    >
      <div className="transaction-confirm-content">
        <p>
          {message || lang('SignTransactionMessage') || 'Do you want to sign this transaction?'}
        </p>
        {transaction && (
          <div className="transaction-details">
            <p>{transaction}</p>
          </div>
        )}
        <div className="transaction-confirm-buttons">
          <Button
            color="primary"
            onClick={handleCancel}
            className="cancel-button"
          >
            {cancelText || lang('Cancel') || 'Cancel'}
          </Button>
          <Button
            color="primary"
            onClick={handleConfirm}
            className="confirm-button"
          >
            {confirmText || lang('Sign') || 'Sign'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default memo(TransactionConfirmationModal);