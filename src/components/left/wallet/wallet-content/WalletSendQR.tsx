import type { FC } from '../../../../lib/teact/teact';
import React, { memo, useCallback, useEffect, useRef, useState } from '../../../../lib/teact/teact';

import useLang from '../../../../hooks/useLang';
import useLastCallback from '../../../../hooks/useLastCallback';
import { useWalletTeact } from '../../../wallet/WalletProvider';
import { WalletScreens } from '../WalletScreens';

import Icon from '../../../common/icons/Icon';
import Button from '../../../ui/Button';

import './WalletSendQR.scss';

export type OwnProps = {
  isActive?: boolean;
  onReset: () => void;
  onScreenSelect?: (screen: WalletScreens) => void;
};

const WalletSendQR: FC<OwnProps> = ({
  isActive,
  onReset,
  onScreenSelect,
}) => {
  const lang = useLang();
  const [error, setError] = useState<string | null>(null);
  const [scannedAddress, setScannedAddress] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [fileUploading, setFileUploading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Use wallet context
  const { 
    network,
  } = useWalletTeact();

  // QR scanning functionality
  const startScanner = useLastCallback(async () => {
    try {
      setError(null);
      setIsScanning(true);
      
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError(lang('CameraAccessNotSupported'));
        setIsScanning(false);
        return;
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // Start scanning after stream is ready
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          scanQRCodeFromVideo();
        };
      }
    } catch (err) {
      console.error('Failed to start camera:', err);
      setError(lang('CameraAccessDenied'));
      setIsScanning(false);
    }
  });

  // Function to stop video streaming
  const stopScanner = useLastCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((track) => track.stop());
      videoRef.current.srcObject = null;
      setIsScanning(false);
    }
  });

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, [stopScanner]);

  // Scan QR code from video stream using canvas
  const scanQRCodeFromVideo = useLastCallback(() => {
    if (!videoRef.current || !isScanning) return;

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    const video = videoRef.current;

    // Scan QR code every 500ms
    const interval = setInterval(() => {
      if (!context || !video || !isScanning) {
        clearInterval(interval);
        return;
      }

      try {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Use an external service to scan QR code from image
        // Note: In a production app, you'd use a proper QR library like jsQR
        const imageData = canvas.toDataURL('image/png');
        
        // Send image to QR scanning service
        // This is a placeholder - in production use a local library
        scanQRCodeFromImage(imageData);
      } catch (err) {
        console.error('Error scanning QR code:', err);
      }
    }, 500);

    return () => clearInterval(interval);
  });

  // Function to handle QR code result
  const handleQRResult = useLastCallback((result: string) => {
    // Check if result is a valid Solana address (base58 encoded string)
    // Basic validation: Solana addresses are typically 32-44 characters
    if (result && result.length >= 32 && result.length <= 44) {
      setScannedAddress(result);
      stopScanner();
    } else {
      setError(lang('InvalidQRCodeContent'));
    }
  });

  // Use an external service to scan QR code from image
  // In a real implementation, you would use a proper QR library
  const scanQRCodeFromImage = useLastCallback(async (imageData: string) => {
    try {
      // Mock implementation - in a real app you'd use a QR code library
      // This is just a placeholder to show the flow
      
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Simulate successful scan
      // In a real implementation, you would extract the result from the QR code
      const mockResult = "testaddress123"; // This would be the actual decoded QR code
      
      handleQRResult(mockResult);
    } catch (err) {
      console.error('Error scanning QR code from image:', err);
      setError(lang('FailedToScanQRCode'));
    }
  });

  // Handle file upload for QR code scanning
  const handleFileUpload = useLastCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setFileUploading(true);
    setError(null);
    
    try {
      const file = files[0];
      const reader = new FileReader();
      
      reader.onload = async (event) => {
        if (event.target?.result) {
          const imageData = event.target.result as string;
          await scanQRCodeFromImage(imageData);
        }
        setFileUploading(false);
      };
      
      reader.onerror = () => {
        setError(lang('FailedToReadFile'));
        setFileUploading(false);
      };
      
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('File upload error:', err);
      setError(lang('FailedToProcessImage'));
      setFileUploading(false);
    }
  });

  // Handle clicking the upload button
  const handleUploadClick = useLastCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  });

  // Handle proceeding to send screen with scanned address
  const handleProceedToSend = useLastCallback(() => {
    if (onScreenSelect && scannedAddress) {
      // Store the scanned address in sessionStorage to use it in the Send screen
      sessionStorage.setItem('scannedSolanaAddress', scannedAddress);
      onScreenSelect(WalletScreens.Send);
    }
  });

  // Reset scanning
  const handleReset = useLastCallback(() => {
    stopScanner();
    setScannedAddress(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  });

  return (
    <div className="WalletSendQR">
      <div className="wallet-sendqr-content">
        <h4>{lang('ScanQRToSend')}</h4>
        
        {!scannedAddress ? (
          <div className="qr-scanner-container">
            {isScanning ? (
              <div className="scanner-view">
                <video 
                  ref={videoRef}
                  className="scanner-video"
                  playsInline
                />
                <div className="scanner-overlay">
                  <div className="scanner-frame" />
                </div>
                <Button
                  color="danger"
                  onClick={stopScanner}
                  className="scanner-cancel-button"
                >
                  {lang('Cancel')}
                </Button>
              </div>
            ) : (
              <div className="scanner-options">
                <Button
                  onClick={startScanner}
                  className="scanner-button"
                  color="primary"
                >
                  <Icon name="camera" className="button-icon" />
                  {lang('ScanQRCode')}
                </Button>
                
                <div className="upload-section">
                  <span className="or-separator">{lang('OR')}</span>
                  
                  <Button
                    onClick={handleUploadClick}
                    className="upload-button"
                    color="secondary"
                    isLoading={fileUploading}
                  >
                    <Icon name="upload" className="button-icon" />
                    {lang('UploadQRImage')}
                  </Button>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="file-input"
                  />
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="result-container">
            <div className="result-success">
              <Icon name="check" className="success-icon" />
              <span>{lang('QRCodeScannedSuccessfully')}</span>
            </div>
            
            <div className="scanned-address">
              <p className="address-label">{lang('ScannedAddress')}</p>
              <div className="address-box">
                <span className="address-text">{scannedAddress}</span>
              </div>
            </div>
            
            <div className="action-buttons">
              <Button
                onClick={handleProceedToSend}
                className="proceed-button"
                color="primary"
              >
                {lang('ProceedToSend')}
              </Button>
              
              <Button
                onClick={handleReset}
                className="reset-button"
                color="translucent"
              >
                {lang('ScanAgain')}
              </Button>
            </div>
          </div>
        )}
        
        {error && <div className="wallet-error">{error}</div>}
        
        <div className="wallet-network-notice">
          <Icon name="info" className="info-icon" />
          <p>
            {network === 'mainnet-beta' 
              ? lang('CurrentlyOnMainnet') 
              : lang('CurrentlyOnTestnet', network.charAt(0).toUpperCase() + network.slice(1))}
          </p>
        </div>
      </div>
    </div>
  );
};

export default memo(WalletSendQR);