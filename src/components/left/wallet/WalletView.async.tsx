import type { FC } from '../../../lib/teact/teact';
import React from '../../../lib/teact/teact';

import type { OwnProps } from './WalletView';

import { Bundles } from '../../../util/moduleLoader';

import useModuleLoader from '../../../hooks/useModuleLoader';

const WalletViewAsync: FC<OwnProps> = (props) => {
  const { isActive } = props;
  const WalletView = useModuleLoader(Bundles.Extra, 'WalletView', !isActive);

  // eslint-disable-next-line react/jsx-props-no-spreading
  return WalletView ? <WalletView {...props} /> : undefined;
};

export default WalletViewAsync;
