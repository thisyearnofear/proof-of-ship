import React from 'react';
import { Modal } from '../common/Modal';
import Button from '../common/Button';

export const TransactionConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  transactionDetails,
}) => {
  const { amount, recipient, token, action } = transactionDetails || {};

  const handleConfirm = async () => {
    await onConfirm?.();
  };

  const footer = (
    <>
      <Button
        variant="ghost"
        onClick={onClose}
      >
        Cancel
      </Button>
      <Button
        variant="primary"
        onClick={handleConfirm}
      >
        Confirm Transaction
      </Button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Confirm ${action || 'Transaction'}`}
      footer={footer}
      size="sm"
    >
      <div className="text-secondary space-y-3">
        {transactionDetails ? (
          <>
            <p>You are about to {action || 'send'} <span className="font-semibold text-primary">{amount} {token}</span> to:</p>
            <p className="break-all font-mono bg-surface-hover p-2 rounded-md text-sm">{recipient}</p>
            <p>Please review the details carefully before confirming.</p>
          </>
        ) : (
          <p>No transaction details available.</p>
        )}
      </div>
    </Modal>
  );
};
