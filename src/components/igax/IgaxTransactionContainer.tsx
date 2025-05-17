import React, { memo, useState, useEffect } from '../../lib/teact/teact';
import type { FC } from '../../lib/teact/teact';

import useLang from '../../hooks/useLang';
import useLastCallback from '../../hooks/useLastCallback';
import { useWalletTeact } from '../wallet/WalletProvider';
import buildClassName from '../../util/buildClassName';
import type { IgaxSendTransaction } from '../../types/igaxBot';

import Button from '../ui/Button';
import Icon from '../common/icons/Icon';
import Spinner from '../ui/Spinner';
import IgaxTransaction from './IgaxTransaction';

import './IgaxTransactionContainer.scss';
import { getAllLinks, isIgaxDomain } from '../../util/detectIgax';

interface Props {
  description: string;
}

interface LinkSource {
  url: string;
  domain: string;
  transaction: IgaxSendTransaction;
}

const IgaxTransactionContainer: FC<Props> = ({
  description,
}) => {
  const lang = useLang();
  const wallet = useWalletTeact();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [linkSources, setLinkSources] = useState<LinkSource[]>([]);
  const [selectedSourceIndex, setSelectedSourceIndex] = useState(0);
  const [showWallet, setShowWallet] = useState(false);

  const handleSourceSelect = useLastCallback((index: number) => {
    setSelectedSourceIndex(index);
  });

  const toggleWallet = useLastCallback(() => {
    setShowWallet(!showWallet);
  });

  const handleSendTransaction = useLastCallback((amount: string) => {
    console.log('Transaction send requested:', {
      amount,
      selectedSource: linkSources[selectedSourceIndex]?.url,
      transaction: linkSources[selectedSourceIndex]?.transaction
    });
  });

  // Process the description to extract links and fetch transaction data
  useEffect(() => {
    const processLinks = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        console.log('description', description);
        const allLinks = getAllLinks(description);
        console.log('allLinks', allLinks);
        if (allLinks.length === 0) {
          setError('No valid IGAX links found in the message');
          setIsLoading(false);
          return;
        }
        
        const igaxLinks: string[] = [];
        allLinks.forEach(link => {
            if (isIgaxDomain(link)) {
                igaxLinks.push(link);
            }
        });
        
        const fetchJsonTransaction = async (link: string) => {
            try {
              console.log('link', link);
              const url = link.startsWith('https://') ? link : `https://${link}`;
              console.log('url', url);
              const response = await fetch(url);
              const data = await response.json();

              // Extract domain from URL
              const urlObj = new URL(url);
              const domain = urlObj.hostname;
              
              return {
                url: link,
                domain,
                transaction: data as IgaxSendTransaction
              };
            } catch (error) {
              console.error(`Failed to fetch transaction from ${link}:`, error);
              return null;
            }
        };

        const fetchedSources = await Promise.all(
          igaxLinks.map(fetchJsonTransaction)
        );
        
        // Filter out failed fetches (nulls)
        const validSources = fetchedSources.filter(Boolean) as LinkSource[];
        
        if (validSources.length === 0) {
          setError('Failed to load transaction data from links');
        } else {
          setLinkSources(validSources);
          // Default to selecting the second item (index 1) if available
          setSelectedSourceIndex(validSources.length > 1 ? 1 : 0);
        }
      } catch (err) {
        console.error('Error processing links:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    };
    
    processLinks();
  }, [description]);

  return (
    <div className="IgaxTransactionContainer">
      <div className="igax-content-wrapper">
        {isLoading && (
          <div className="igax-loading">
            <Spinner color="blue" className="loading-spinner" />
            <div className="loading-text">{lang('LoadingTransactions')}</div>
          </div>
        )}
        
        {!isLoading && error && (
          <div className="igax-error">
            <Icon name="bug" className="error-icon" />
            <div className="error-message">{error}</div>
          </div>
        )}
        
        {!isLoading && !error && linkSources.length > 0 && (
          <>
            {linkSources.length > 1 && (
              <div className="igax-source-selector">
                <div className="source-buttons">
                  <div className="source-button-container">
                    {linkSources.map((source, index) => (
                      <Button
                        key={index}
                        className={`source-button ${selectedSourceIndex === index ? 'active' : ''}`}
                        onClick={() => handleSourceSelect(index)}
                        ariaLabel={`${source.domain} - ${source.transaction.title}`}
                      >
                        {index + 1}
                      </Button>
                    ))}
                  </div>
                  <div className="source-button-icon-container">
                    <Button
                      className="source-button-icon"
                      onClick={toggleWallet}
                      ariaLabel={showWallet ? "Hide wallet address" : "Show wallet address"}
                    >
                      <Icon name={showWallet ? "eye-crossed" : "eye"} />
                    </Button>
                  </div>
                </div>
              </div>
            )}
            
            <div className="igax-transactions">
              {linkSources[selectedSourceIndex] && (
                <IgaxTransaction
                  key={`transaction-${selectedSourceIndex}`}
                  transaction={linkSources[selectedSourceIndex].transaction}
                  showWallet={showWallet}
                  toggleWallet={linkSources.length === 1 ? toggleWallet : undefined}
                  onSendTransaction={handleSendTransaction}
                />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default memo(IgaxTransactionContainer);