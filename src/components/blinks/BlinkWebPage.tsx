import type { FC } from '../../lib/teact/teact';
import React, { memo } from '../../lib/teact/teact';

import type { ApiWebPage } from '../../api/types';
import buildClassName from '../../util/buildClassName';
import { isBlinkUrl, normalizeBlinkUrl } from '../../util/blinkUtils';

import BlinkMessage from './BlinkMessage';

import './BlinkWebPage.scss';
import { isSolanaBlink } from '../../util/detectBlinks';

interface OwnProps {
  webPage: ApiWebPage;
  className?: string;
}

const BlinkWebPage: FC<OwnProps> = ({
  webPage,
  className,
}) => {
  const { url } = webPage;

  if (!url || !isBlinkUrl(url)) {
    return null;
  }

  // Extract metadata from the webpage
  const validBlink = isSolanaBlink(url);
  if (!validBlink) {
    return null;
  }
  const normalizedUrl = normalizeBlinkUrl(url);
  // Combine metadata from multiple sources with priority:
  // 1. URL params (highest priority)
  // 2. TDLib data
  // 3. Registry info  
  // Determine action type from URL

  // TODO: Add more "blink types"
  
  return (
    <div className={buildClassName('BlinkWebPage', className)}>
      <BlinkMessage
        url={normalizedUrl}
      />
    </div>
  );
};

export default memo(BlinkWebPage);