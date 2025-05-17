import React, {
  memo,
  useEffect,
  useState,
} from "../../lib/teact/teact";
import type { FC } from "../../lib/teact/teact";

import useLang from "../../hooks/useLang";
import useLastCallback from "../../hooks/useLastCallback";
import { useWalletTeact } from "../wallet/WalletProvider";
import buildClassName from "../../util/buildClassName";
import type { SolanaActionBlink } from "../../types/blinks";

import Button from "../ui/Button";
import Icon from "../common/icons/Icon";
import Spinner from "../ui/Spinner";
import BlinkLoadingOverlay from "./BlinkLoadingOverlay";
import BlinkJsonRenderer from "./BlinkJsonRenderer";
import TransactionConfirmationModal from "../igax/TransactionConfirmationModal";
import Modal from "../ui/Modal";

import "./BlinkContainer.scss";

interface Props {
  onClose: () => void;
  className?: string;
  style?: React.CSSProperties;
  blinkAction: SolanaActionBlink;
}

const BlinkContainer: FC<Props> = ({
  onClose,
  className,
  style,
  blinkAction,
}) => {
  const lang = useLang();
  const wallet = useWalletTeact();
  const [isLoading, setIsLoading] = useState(!blinkAction);
  const [isWalletProcessing, setIsWalletProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isJsonResponse, setIsJsonResponse] = useState(!!blinkAction);
  const [modalOpen, setModalOpen] = useState(false);
  const [pendingTransaction, setPendingTransaction] = useState<string | null>(
    null
  );
  const [successPopupOpen, setSuccessPopupOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [successSignature, setSuccessSignature] = useState<string | null>(null);

  // Handle messages from the Blink iframe or other sources
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      // Process the message data
      const { action, data } = event.data;

      if (!action) return;
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [wallet.connected, wallet.address, wallet.keypair]);

  // Handle transaction request from JSON renderer
  const handleJsonTransaction = useLastCallback((href: string) => {
    console.log("Transaction requested from BlinkJsonRenderer:", href);

    // We'll process the transaction and then show confirmation UI
    setIsWalletProcessing(true);

    // Process transaction
    const processTransaction = async () => {
      try {
        if (!wallet.connected || !wallet.address) {
          throw new Error("Wallet not connected");
        }

        const response = await fetch(href, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            account: wallet.address,
          }),
        });

        if (response.ok) {
          setModalOpen(true);
          const data = await response.json();
          setPendingTransaction(data.transaction);
        } else {
          throw new Error(`Transaction request failed: ${response.status}`);
        }
      } catch (err) {
        console.error("Transaction error:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
        setIsWalletProcessing(false);
      }
    };

    processTransaction();
  });

  const handleCancelTransaction = useLastCallback(() => {
    setPendingTransaction(null);
    setIsWalletProcessing(false);
    setModalOpen(false);
  });

  const handleConfirmTransaction = useLastCallback(async () => {
    console.log("handleConfirmTransaction", pendingTransaction);
    if (!pendingTransaction) return;
    
    try {
      const result = await wallet.signAndSendRawTransaction(pendingTransaction);
      setPendingTransaction(null);
      setIsWalletProcessing(false);
      setModalOpen(false);
      
      // Show success popup with transaction signature
      const signature = result?.signature || result;
      setSuccessMessage("Transaction confirmed successfully!");
      setSuccessSignature(signature);
      setSuccessPopupOpen(true);
      
      // Auto-close success popup after 4 seconds
      setTimeout(() => {
        setSuccessPopupOpen(false);
        setSuccessSignature(null);
      }, 4000);
    } catch (error) {
      console.error("Transaction error:", error);
      setError(error instanceof Error ? error.message : "Transaction failed");
      setPendingTransaction(null);
      setIsWalletProcessing(false);
      setModalOpen(false);
    }
  });

  // Derives the display name for the blink
  const getBlinkDisplayName = () => {
    try {
      // Try to get the hostname if it's a valid URL
      return new URL(blinkAction?.url).hostname;
    } catch (e) {
      // If it's not a valid URL, it might be a direct JSON payload or another type
      return isJsonResponse ? "JSON Blink" : "Blink";
    }
  };

  return (
    <>
      {/* Transaction confirmation modal */}
      <TransactionConfirmationModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={handleConfirmTransaction}
        onCancel={handleCancelTransaction}
        transaction={pendingTransaction}
      />

      {/* Success Popup Modal */}
      <Modal
        isOpen={successPopupOpen}
        onClose={() => setSuccessPopupOpen(false)}
        className="blink-success-modal"
        contentClassName="blink-success-content"
      >
        <div className="success-popup">
          <Icon name="check" className="success-icon" />
          <h3 className="success-title">{lang("Success")}</h3>
          <p className="success-message">{successMessage}</p>
          {successSignature && (
            <div className="success-signature">
              <span>Transaction: </span>
              <a
                href={`https://solscan.io/tx/${successSignature}`}
                target="_blank"
                rel="noopener noreferrer"
                className="signature-link"
              >
                {successSignature.slice(0, 8)}...{successSignature.slice(-8)}
              </a>
            </div>
          )}
          <Button
            color="primary"
            onClick={() => setSuccessPopupOpen(false)}
            className="success-close-button"
          >
            {lang("Close")}
          </Button>
        </div>
      </Modal>

      {/* Main Blink Container */}
      <div
        className={buildClassName("BlinkContainer", className)}
        style={style}
      >
        {/* Header */}
        <div className="blink-header">
          <Button
            round
            color="translucent"
            size="smaller"
            onClick={onClose}
            ariaLabel={lang("Close")}
            className="close-button"
          >
            <Icon name="close" />
          </Button>

          <div className="blink-url">
            {getBlinkDisplayName()}
          </div>

          <div className="blink-wallet-status">
            {wallet.connected && wallet.address && (
              <div className="wallet-connected">
                <Icon name="check" className="wallet-icon" />
                <span className="wallet-address">
                  {wallet.address.slice(0, 4)}...{wallet.address.slice(-4)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="blink-content-wrapper">
          {blinkAction ? (
            <BlinkJsonRenderer
              data={blinkAction}
              onTransaction={(href) => {
                handleJsonTransaction(href);
                // Clear any previous errors when starting a new transaction
                setError(null);
              }}
              className="blink-json-renderer"
            />
          ) : (
            <>
              {/* Show loading while attempting to parse JSON */}
              <BlinkLoadingOverlay
                isVisible={isLoading}
                text={lang("ParsingBlinkData")}
              />
              {/* If we're still loading after a while, show error state */}
              {isLoading && (
                <div className="blink-json-parse-error">
                  <div>
                    <p>{lang("TryingToParseBlinkData")}</p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Error notification */}
        {error && (
          <div className="blink-error">
            <Icon name="close" className="error-icon" />
            <span className="error-text">{error}</span>
            <Button
              color="primary"
              size="tiny"
              onClick={() => setError(null)}
              className="error-close-button"
            >
              {lang("Close")}
            </Button>
          </div>
        )}

        {/* Processing overlay */}
        {isWalletProcessing && (
          <div className="wallet-processing-overlay">
            <div className="wallet-processing-content">
              <Spinner color="blue" className="wallet-processing-spinner" />
              <div className="processing-text">
                {lang("ProcessingTransaction")}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default memo(BlinkContainer);
