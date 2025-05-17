import React, { memo, useEffect, useState } from "../../lib/teact/teact";
import type { FC } from "../../lib/teact/teact";

import useLastCallback from "../../hooks/useLastCallback";
import buildClassName from "../../util/buildClassName";
import BlinkContainer from "./BlinkContainer";
import BlinkContent from "./BlinkContent";
import { isSolanaBlink } from "../../util/detectBlinks";
import { createProxyUrl, parseSolanaActionBlink } from "../../util/solanaActionParser";
import type { SolanaActionBlink } from "../../types/blinks";
import useLang from "../../hooks/useLang";
import { extractSolanaActionUrl } from "../../util/blinkUtils";

import "./BlinkMessage.scss";

interface Props {
  url: string;
}

const BlinkMessage: FC<Props> = ({ url }) => {
  const lang = useLang();
  const [blinkData, setBlinkData] = useState<SolanaActionBlink | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch blink data
  useEffect(() => {
    if (!url) return;
    
    const fetchBlinkData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Extract action URL if needed
        let fetchUrl = url;
        const actionUrl = extractSolanaActionUrl(url);
        if (actionUrl) {
          fetchUrl = actionUrl;
        }
        
        // Create proxy URL for CORS-free fetching
        const proxyUrl = createProxyUrl(fetchUrl);
        
        // Fetch the blink data
        const response = await fetch(proxyUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch blink data: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Parse the blink data
        const parsedData = parseSolanaActionBlink(data, url);
        setBlinkData(parsedData);
      } catch (err) {
        console.error('Error fetching Blink data:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchBlinkData();
  }, [url]);

  const [isExpanded, setIsExpanded] = useState(false);

  const handleExpand = useLastCallback(() => {
    setIsExpanded(true);
  });

  const handleClose = useLastCallback(() => {
    setIsExpanded(false);
  });

  if (isExpanded) {
    return (
      <div className={buildClassName("BlinkMessage", "expanded")}>
        {blinkData ? (
          <BlinkContainer
            // blinkInfo={{
            //   url: url,
            //   type: 'solana',
            //   title: blinkData.title,
            //   description: blinkData.description,
            //   thumbnailUrl: blinkData.icon,
            // }}
            // url={url}
            onClose={handleClose}
            className="blink-fullscreen"
            blinkAction={blinkData}
            // jsonData={convertSolanaActionToJsonData(blinkData)}
          />
        ) : (
          <div className="blink-loading">
            {isLoading ? lang('Loading') : error || lang('UnsupportedBlink')}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={buildClassName("BlinkMessage")}>
      {blinkData ? (
        <BlinkContent 
          onExpand={handleExpand} 
          blinkAction={blinkData}
        />
      ) : (
        <div className="blink-loading">
          {isLoading ? lang('Loading') : error || lang('UnsupportedBlink')}
        </div>
      )}
    </div>
  );
};

export default memo(BlinkMessage);