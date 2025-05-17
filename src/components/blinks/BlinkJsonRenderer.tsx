import React, { memo, useState, useEffect, useMemo } from '../../lib/teact/teact';
import type { FC } from '../../lib/teact/teact';

import useLang from '../../hooks/useLang';
import useLastCallback from '../../hooks/useLastCallback';
import buildClassName from '../../util/buildClassName';
import { useWalletTeact } from '../wallet/WalletProvider';
import type { SolanaActionBlink, BlinkAction } from '../../types/blinks';
import { getTransactionExplorerUrl } from '../wallet/config';

import Button from '../ui/Button';
import Icon from '../common/icons/Icon';

import './BlinkJsonRenderer.scss';
import { createProxyUrl } from '../../util/solanaActionParser';

interface Props {
  data: SolanaActionBlink;
  className?: string;
  style?: React.CSSProperties;
  onTransaction?: (href: string, params?: Record<string, string>) => void;
}


const BlinkJsonRenderer: FC<Props> = ({
  data,
  className,
  style,
  onTransaction,
}) => {
  const lang = useLang();
  const [paramValues, setParamValues] = useState<Record<number, Record<string, string>>>({});
  const [expandedAction, setExpandedAction] = useState<number | null>(null);


  const wallet = useWalletTeact();
  
  // Clear state when data changes
  useEffect(() => {
    setParamValues({});
  }, [data]);
  
  
  // Handle simple button click (no parameters)
  const handleSimpleButtonClick = useLastCallback(async (action: BlinkAction, index?: number) => {
    if (!wallet.connected || !wallet.address) return;
    console.log('handleSimpleButtonClick', action, index);
    console.log('url', data.url, action.href);
    // Reset all state at the beginning
    console.log('Starting transaction process');
    try {
      // Get parameters from the paramValues state if index is provided, otherwise from action parameters
      const params = index !== undefined && action.parameters
        ? action.parameters.reduce((acc, param) => ({
            ...acc,
            [param.name]: paramValues[index]?.[param.name] || param.value?.toString() || ''
          }), {})
        : action.parameters?.reduce((acc, param) => ({
            ...acc,
            [param.name]: param.value?.toString() || ''
          }), {});

      // Check if we have a parent transaction handler
      if (onTransaction) {

        let url = action.href && action.href !== data.url ? new URL(data.url).host + action.href : data.url;
        if (!url.includes('https://')) {
          url = 'https://' + url;
        }
        if (params) {
          const urlObj = new URL(url);
          Object.entries(params).forEach(([key, value]) => {
            console.log('key', key, 'value', value);
            url = url.replace(`{${key}}`, (String(value)));
          });
        }
        
        console.log('url', url);
        const proxyUrl = createProxyUrl(url);

        // We'll let the parent handle the transaction directly
        onTransaction(proxyUrl);
        return;
      }
    } catch (err: any) {
      console.error('Transaction error:', err);
    }
  });
  
  // Handle input change
  const handleInputChange = useLastCallback((actionIndex: number, paramName: string, value: string) => {
    console.log('handleInputChange', JSON.stringify(paramValues));
    console.log('paramName', JSON.stringify(paramName));
    console.log('value', JSON.stringify(value));
    setParamValues(prev => ({
      ...prev,
      [actionIndex]: {
        ...prev[actionIndex],
        [paramName]: value
      }
    }));
  });
  
  // Get appropriate input type based on parameter name
  const getInputType = useLastCallback((paramName: string): string => {
    paramName = paramName.toLowerCase();
    
    if (paramName.includes('amount') || 
        paramName.includes('quantity') || 
        paramName.includes('value') ||
        paramName.includes('price')) {
      return 'number';
    }
    
    if (paramName.includes('address') || 
        paramName.includes('recipient') || 
        paramName.includes('wallet') || 
        paramName.includes('key')) {
      return 'text'; // Address input
    }
    
    if (paramName.includes('message') || 
        paramName.includes('memo') || 
        paramName.includes('note')) {
      return 'textarea';
    }
    
    return 'text';
  });
  
  // Handle form submission
  const handleSubmit = useLastCallback(async (action: BlinkAction, actionIndex: number) => {
    if (!wallet.connected) return;
    const currentParams = paramValues[actionIndex] || {};

    // Process URL with parameters
    let processedHref = action.href;
    if (action.parameters && action.parameters.length > 0) {
      action.parameters.forEach(param => {
        const paramName = param.name || '';
        const value = currentParams[paramName] || '';
        processedHref = processedHref.replace(`{${paramName}}`, encodeURIComponent(value));
      });
    }

    // Always delegate to parent container if available
    if (onTransaction) {
      console.log('onTransaction', data.url, action.href);
      let url = action.href && action.href !== data.url ? new URL(data.url).host + action.href : data.url;
      console.log('url', url);
      if (!url.includes('https://')) {
        url = 'https://' + url;
      }
      // Handle parameters in the URL
      if (currentParams) {
        Object.entries(currentParams).forEach(([key, value]) => {
          url = url.replace(`{${key}}`, (String(value)));
        });
      }
      
      console.log('url', url);
      const proxyUrl = createProxyUrl(url);
      // Pass the href and params to let the parent handle it
      onTransaction(proxyUrl);
      return;
    }
  });

  
  // Define actions list - if no actions in the data, create a default one
  const actionsList = useMemo(() => {
    if (!data.links?.actions?.length) {
      return [{
        label: data.label || 'Perform Action',
        href: data.url,
        type: 'transaction',
        parameters: [],
        disabled: data.disabled,
        color: 'primary',
        description: data.description
      } as BlinkAction];
    }
    return data.links.actions;
  }, [data]);
  
  // Add this useEffect after other useEffects
  useEffect(() => {
    // Set default values for select inputs
    actionsList.forEach((action, actionIndex) => {
      action.parameters?.forEach((param) => {
        if (param.type === 'select' && param.options && param.label) {
          const selectedOption = param.options.find(opt => opt.selected === true);
          if (selectedOption) {
            console.log('Setting default value for select:', param.label, selectedOption.value);
            handleInputChange(actionIndex, param.name, selectedOption.value);
          }
        }
      });
    });
  }, []); // Add handleInputChange to dependencies if needed

  // Normal rendering of the JSON data
  return (
    <div>
      <div
        className={buildClassName("blink-json-renderer", className)}
        style={style}
      >
        {/* Icon */}
        {data.icon && (
          <div className="blink-json-icon">
            <img 
              src={data.icon} 
              // alt={data.title || 'Blink'} 
            />
          </div>
        )}
        
        {/* Title */}
        {data.title && <h3 className="blink-json-title">{data.title}</h3>}
        
        {/* Description */}
        {data.description && <p className="blink-json-description">{data.description}</p>}
        
        {/* Wallet warning if needed */}
        {!wallet.connected && (
          <div className="wallet-warning">
            <p>{lang('ConnectWallet')}</p>
            <Button
              className="connect-wallet-button"
              onClick={() => wallet.createKeypair()}
            >
              {lang('CreateOwnKeypair')}
            </Button>
          </div>
        )}
        
        {/* Actions */}
        <div className="blink-json-actions">
          {actionsList.map((action, index) => {
            const hasParams = action.parameters && action.parameters.length > 0;
            const isExpanded = expandedAction === index;

            return (
              <div key={index} className={buildClassName("blink-json-action", hasParams && isExpanded && "expanded")}>
                {/* Actions without parameters - just a button */}
                {!hasParams && (
                  <>
                    <Button
                      className="action-button"
                      onClick={() => handleSimpleButtonClick(action)}
                      disabled={action.disabled || !wallet.connected}
                      isRectangular
                      color={(action.color as "primary" | "secondary" | "gray" | "danger" | "translucent" | "translucent-white" | "translucent-black" | "translucent-bordered" | "dark" | "green" | "adaptive" | "stars") || "primary"}
                      size="smaller"
                    >
                      {action.label}
                    </Button>
                    {action.description && (
                      <div className="action-description">{action.description}</div>
                    )}
                  </>
                )}
                
                {/* Actions with parameters - toggleable form */}
                {hasParams && (
                  <>
                    {/* Action label/header with toggle */}
                    <div
                      className="action-header"
                      onClick={() => setExpandedAction(isExpanded ? null : index)}
                    >
                      <span className="action-label">{action.label}</span>
                      <Icon name={isExpanded ? "up" : "down"} className="action-toggle" />
                    </div>
                    
                    {/* Expandable form */}
                    {isExpanded && (
                      <div className="action-form">
                        {action.parameters?.map((param, paramIndex) => (
                          <div key={paramIndex} className="form-field">
                            <label htmlFor={`param-${index}-${param.label}`}>{param.label}</label>
                            {param.type === 'select' && param.options ? (
                              <div className="select-wrapper">
                                <select
                                  id={`param-${index}-${param.label}`}
                                  value={param.value}
                                  onChange={(e) => {
                                    console.log('Select changed to:', e.target.value);
                                    if (param.label) {
                                      handleInputChange(index, param.name, e.target.value);
                                    }
                                  }}
                                  className="custom-select"
                                >
                                  {(!param.label || !paramValues[index]?.[param.label]) && (
                                    <option value="" disabled>Select an option</option>
                                  )}
                                  {param.options.map((option, optIndex) => (
                                    <option
                                      key={optIndex}
                                      value={option.value}
                                      selected={option.selected}
                                    >
                                      {option.label || option.value}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            ) : param.type === 'radio' && param.options ? (
                              <div className="radio-group">
                                {param.options.map((option, optIndex) => {
                                  const isSelected = paramValues[index]?.[String(param.label)] === option.value || 
                                    (!paramValues[index]?.[String(param.label)] && option.selected);
                                  return (
                                    <label key={optIndex} className="radio-label">
                                      <input
                                        type="radio"
                                        name={`param-${index}-${String(param.label)}`}
                                        value={option.value}
                                        checked={isSelected}
                                        onChange={(e) => {
                                          handleInputChange(index, param.name, e.target.value);
                                        }}
                                      />
                                      <span>{option.label || option.value}</span>
                                    </label>
                                  );
                                })}
                              </div>
                            ) : (
                              <input
                                id={`param-${index}-${String(param.label)}`}
                                type={(param.type || getInputType(String(param.label))) as string}
                                placeholder={param.placeholder || `${lang('Submit')} ${param.label}`}
                                value={paramValues[index]?.[String(param.label)] || ''}
                                onChange={(e) => {
                                  handleInputChange(index, param.name, e.target.value);
                                }}
                              />
                            )}
                          </div>
                        ))}
                        <Button
                          className="submit-button"
                          onClick={() => {
                            handleSimpleButtonClick(action, index);
                            // handleSubmit(action, index);
                          }}
                          disabled={!wallet.connected}
                          isRectangular
                          color="primary"
                          size="smaller"
                        >
                          {lang('Submit')}
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default memo(BlinkJsonRenderer);