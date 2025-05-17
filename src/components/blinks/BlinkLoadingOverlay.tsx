import React, { memo } from '../../lib/teact/teact';
import type { FC } from '../../lib/teact/teact';

import useLang from '../../hooks/useLang';
import buildClassName from '../../util/buildClassName';

import Spinner from '../ui/Spinner';

import './BlinkLoadingOverlay.scss';

interface Props {
  isVisible: boolean;
  className?: string;
  text?: string;
}

const BlinkLoadingOverlay: FC<Props> = ({
  isVisible,
  className,
  text,
}) => {
  const lang = useLang();
  
  if (!isVisible) {
    return null;
  }
  
  return (
    <div className={buildClassName('BlinkLoadingOverlay', className)}>
      <div className="blink-loading-content">
        <Spinner color="primary" className="blink-spinner" />
        <div className="loading-text">{text || lang('Loading')}</div>
      </div>
    </div>
  );
};

export default memo(BlinkLoadingOverlay);