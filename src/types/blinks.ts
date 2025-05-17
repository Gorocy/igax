export interface BlinkInfoMinimal {
  url: string;
  type: 'solana' | 'telegram' | string;
  title: string;
  description: string;
  thumbnailUrl: string;
}

// Token types for wallet functionality
export interface TokenInfo {
  symbol: string;
  name: string;
  logoUrl?: string;
  balance: number;
  usdValue: number;
  address: string;
  decimals?: number;
  isNative?: boolean;
}

export interface TokenPrice {
  symbol: string;
  price: number;
  change24h?: number;
}

// New unified TypeScript types for Solana Action Blinks
export interface SolanaActionBlink {
  url: string;
  type?: 'action';
  icon: string;
  title: string;
  description: string;
  label?: string;
  disabled?: boolean;
  links?: {
    actions: BlinkAction[];
  };
}

export interface BlinkAction {
  type?: 'transaction' | 'post';
  label: string;
  href: string;
  parameters?: ActionParameter[];
  icon?: string;
  disabled?: boolean;
  color?: string;
  description?: string;
}

export interface ActionParameter {
  type: 'select' | 'radio' | 'text' | 'number';
  name: string;
  label?: string;
  required?: boolean;
  options?: ParameterOption[];
  value?: string | number;
  placeholder?: string;
}

export interface ParameterOption {
  label: string;
  value: string;
  selected?: boolean;
}
