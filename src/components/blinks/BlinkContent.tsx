import React, { memo, useEffect, useState } from "../../lib/teact/teact";
import type { FC } from "../../lib/teact/teact";

import { isSolanaBlink } from "../../util/detectBlinks";
import useLang from "../../hooks/useLang";
import useLastCallback from "../../hooks/useLastCallback";
import type { SolanaActionBlink } from "../../types/blinks";

import Button from "../ui/Button";
import Icon from "../common/icons/Icon";
import Spinner from "../ui/Spinner";
import Modal from "../ui/Modal";

import "./BlinkContent.scss";

interface Props {
  blinkAction: SolanaActionBlink;
  isExpanded?: boolean;
  onExpand?: () => void;
  isLoading?: boolean;
  walletConnected?: boolean;
  walletAddress?: string;
  tokenAmount?: string;
  tokenSymbol?: string;
  actionType?:
    | "transaction"
    | "post"
    | "swap"
    | "send"
    | "mint"
    | "transfer"
    | string;
}

const BlinkContent: FC<Props> = ({
  blinkAction,
  isExpanded,
  onExpand,
  isLoading,
  walletConnected,
  walletAddress,
  tokenAmount,
  tokenSymbol,
  actionType = "transfer",
}) => {
  const lang = useLang();

  // Extract hostname for display
  let hostname = "";
  try {
    hostname = new URL(blinkAction.url).hostname;
  } catch (e) {
    // Handle non-URL blinks like direct JSON
    hostname = "Solana Action";
  }

  // Handle click to expand the blink
  const handleClick = useLastCallback(() => {
    if (onExpand) {
      onExpand();
    }
  });

  if (!blinkAction.url) {
    return null;
  }

  // Full expanded view
  if (isExpanded) {
    if (isLoading) {
      return (
        <div className="BlinkContent expanded loading">
          <Spinner color="gray" />
          <div className="loading-text">{lang("Loading")}</div>
        </div>
      );
    }
  }

  // Preview/collapsed view
  return (
    <div className="BlinkContent preview" onClick={handleClick}>
      <div className="blink-preview-content">
        <div className="blink-icon">
          <div className="blink-icon-placeholder">
            <img src={blinkAction.icon} alt={blinkAction.title} />
          </div>
        </div>

        <div className="blink-info">
          <div className="blink-title">{hostname}</div>
          {tokenAmount && tokenSymbol && (
            <div className="blink-token-info">
              <span className="token-amount">{tokenAmount}</span>
              <span className="token-symbol">{tokenSymbol}</span>
            </div>
          )}
        </div>
      </div>

      <div className="blink-buttons">
        <Button
          color="primary"
          onClick={handleClick}
          className="blink-open-button"
        >
          {lang("Open")}
        </Button>
      </div>
    </div>
  );
};

export default memo(BlinkContent);
