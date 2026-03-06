
import React, { useState, useRef, useEffect, useCallback } from 'react';
import jsQR from 'jsqr';
import { QrCodeIcon, FileUploadIcon } from './Icons';

interface ScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (payload: string) => void;
  role: 'warehouse' | 'customer';
}

const ScannerModal: React.FC<ScannerModalProps> = ({ isOpen, onClose, onScan, role }) => {
  const [imageSrc, setImageSrc] = useState<string | null>(null); // For file uploads
  const [capturedImageSrc, setCapturedImageSrc] = useState<string | null>(null); // For captured camera photos
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [statusMessage, setStatusMessage] = useState(''); // New state for camera status messages
  const [isVideoElementMounted, setIsVideoElementMounted] = useState(false); // New state to track video element mount status

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null); // Still use useRef for the element itself
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Callback ref for the video element to track its mounted state
  const setVideoRef = useCallback((node: HTMLVideoElement | null) => {
    videoRef.current = node;
    setIsVideoElementMounted(!!node);
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    setCapturedImageSrc(null); // Clear captured image
    setStatusMessage(''); // Clear status message on stop
  }, []);

  useEffect(() => {
    // This effect cleans up camera resources when the modal closes or unmounts.
    if (!isOpen) {
      stopCamera();
      setImageSrc(null);
      setCapturedImageSrc(null); // Clear captured image
      setError(null);
      setIsLoading(false);
      setStatusMessage('');
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, stopCamera]);

  const startCamera = async () => {
    setError(null);
    setImageSrc(null);
    // setCapturedImageSrc(null); // This is now handled by the useEffect for `isOpen`
    setIsLoading(true);
    setStatusMessage('Requesting camera...');

    const videoElement = videoRef.current;
    if (!videoElement) {
      // This check is now more reliably hit if the video element truly isn't mounted.
      setError("Camera setup failed: Video element not found. Please try again or refresh the page.");
      setIsLoading(false);
      return; 
    }

    try {
      // Request camera permission
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;

      // Ensure event listener is removed if previously attached to prevent duplicates
      videoElement.onloadedmetadata = null; 

      videoElement.srcObject = stream;
      videoElement.onloadedmetadata = async () => {
        try {
          await videoElement.play();
          setIsCameraActive(true);
          setIsLoading(false);
          setStatusMessage('Align QR code in view or capture photo...');
          startContinuousScanning(); // Start continuous scanning by default
        } catch (playError: any) {
          console.error("Error playing video stream:", playError);
          setError("Failed to start camera feed. Please check browser settings. " + playError.message);
          setIsLoading(false);
          stopCamera();
        }
      };
    } catch (err: any) {
      console.error("Error accessing camera:", err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError("Camera access denied. Please grant camera permissions in your browser settings.");
      } else if (err.name === 'NotFoundError') {
        setError("No camera found. Please ensure a camera is connected and enabled.");
      } else {
        setError("Failed to access camera: " + err.message);
      }
      setIsLoading(false);
      stopCamera();
    }
  };

  // New useEffect to initiate camera only when modal is open and video element is mounted
  useEffect(() => {
    // Now also checks `isVideoElementMounted`
    if (isOpen && isVideoElementMounted && !isCameraActive && !isLoading) {
      const timeoutId = setTimeout(() => {
        startCamera();
      }, 50);
      return () => clearTimeout(timeoutId);
    }
  }, [isOpen, isVideoElementMounted, isCameraActive, isLoading]);


  const startContinuousScanning = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    setCapturedImageSrc(null); // Clear any previously captured image

    const scanWidth = 640; // Standardized width for scanning
    const scanHeight = 480; // Standardized height for scanning

    intervalRef.current = setInterval(() => {
      // Only proceed if camera is active and no image has been captured (meaning video is still playing live)
      if (!videoRef.current || !canvasRef.current || !isCameraActive || capturedImageSrc) return; 

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });

      if (video.readyState >= video.HAVE_CURRENT_DATA && ctx) { // Changed to HAVE_CURRENT_DATA for earlier frames
        canvas.width = scanWidth;
        canvas.height = scanHeight;
        
        // Apply filters for better QR code detection
        ctx.filter = 'grayscale(100%) contrast(150%)'; // Experiment with contrast value
        ctx.drawImage(video, 0, 0, scanWidth, scanHeight); // Draw with filter applied
        ctx.filter = 'none'; // Reset filter for next draw

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "attemptBoth", // Try both normal and inverted QR codes
        });

        if (code) {
          onScan(code.data);
          stopCamera();
        }
      }
    }, 100); // Scan every 100ms
  };

  const captureImage = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current); // Stop continuous scanning
      intervalRef.current = null;
    }
    setError(null);
    setStatusMessage('Scanning captured image...');

    if (!videoRef.current || !canvasRef.current) {
      setError("Camera feed not ready to capture.");
      setStatusMessage('');
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const scanWidth = 640; // Standardized width for scanning
    const scanHeight = 480; // Standardized height for scanning

    if (video.readyState >= video.HAVE_CURRENT_DATA && ctx) {
      canvas.width = scanWidth;
      canvas.height = scanHeight;
      
      // Apply filters for better QR code detection
      ctx.filter = 'grayscale(100%) contrast(150%)';
      ctx.drawImage(video, 0, 0, scanWidth, scanHeight);
      ctx.filter = 'none'; // Reset filter

      // Save captured image to state for display (after filtering for consistency)
      setCapturedImageSrc(canvas.toDataURL('image/png'));

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "attemptBoth",
      });

      if (code) {
        onScan(code.data);
        stopCamera();
      } else {
        setError("No QR code found in the captured image. Try again or adjust your position.");
        setStatusMessage("No QR found. Retake photo or try file upload.");
      }
    } else {
      setError("Failed to capture image from video stream. Please try again.");
      setStatusMessage('');
    }
  };

  const handleRetakePhoto = () => {
    setError(null);
    setCapturedImageSrc(null);
    setStatusMessage('Align QR code in view or capture photo...');
    startContinuousScanning(); // Resume continuous scanning
  };


  const handleFileChange = (file: File | null) => {
    if (!file) return;

    setError(null);
    setIsLoading(true);
    stopCamera(); // Stop camera if file upload is initiated
    setStatusMessage('Scanning image...');
    setCapturedImageSrc(null); // Clear any captured image

    const reader = new FileReader();
    reader.onload = (e) => {
      setImageSrc(e.target?.result as string);
      
      const image = new Image();
      image.onload = () => {
        const canvas = canvasRef.current;
        if (canvas) {
          canvas.width = image.width;
          canvas.height = image.height;
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          if(ctx) {
            // No filters for file upload as image is already static and usually higher quality
            ctx.drawImage(image, 0, 0, image.width, image.height);
            const imageData = ctx.getImageData(0, 0, image.width, image.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height);

            if (code) {
              onScan(code.data);
            } else {
              setError("No QR code found in the image. Please try another one.");
            }
          }
        }
        setIsLoading(false);
        setStatusMessage('');
      };
      image.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files[0]);
      e.dataTransfer.clearData();
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleZoneClick = () => {
      fileInputRef.current?.click();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md m-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3">
            <div className="bg-slate-100 p-2 rounded-lg border border-slate-200">
                <QrCodeIcon className="w-6 h-6 text-slate-600"/>
            </div>
            <h2 className="text-xl font-bold text-slate-800 tracking-tight">Scan QR Code</h2>
        </div>
        <p className="mt-2 text-slate-500 text-sm">
            Upload or drop an image, or use your camera to process the {role === 'warehouse' ? 'inbound shipment' : 'delivery'}.
        </p>
        
        <canvas ref={canvasRef} className="hidden"></canvas> {/* Hidden canvas for QR processing */}

        <div className="mt-4 flex flex-col items-center gap-3">
            {isCameraActive ? (
                <>
                    <div className="relative w-full h-64 bg-slate-200 rounded-lg overflow-hidden flex items-center justify-center">
                        {capturedImageSrc ? (
                            <img src={capturedImageSrc} alt="Captured for QR scan" className="absolute inset-0 w-full h-full object-cover" />
                        ) : (
                            <video ref={setVideoRef} className="absolute inset-0 w-full h-full object-cover"></video>
                        )}
                        {statusMessage && <p className="absolute text-white bg-black/50 p-2 rounded-md z-10">{statusMessage}</p>}
                        {!statusMessage && !capturedImageSrc && <div className="absolute inset-0 flex items-center justify-center border-4 border-sky-400 border-dashed rounded-lg bg-black/20 text-white font-semibold text-lg">Align QR code here</div>}
                    </div>
                    <div className="flex gap-2 w-full">
                        {capturedImageSrc ? (
                            <button
                                onClick={handleRetakePhoto}
                                className="flex-1 bg-sky-600 text-white font-semibold py-2.5 px-4 rounded-lg hover:bg-sky-700 flex items-center justify-center gap-2 text-base"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-4 3 3 5-5V3l-2 2-3-3-4 4-3-3v10z"/></svg>
                                Retake Photo
                            </button>
                        ) : (
                            <button
                                onClick={captureImage}
                                className="flex-1 bg-sky-600 text-white font-semibold py-2.5 px-4 rounded-lg hover:bg-sky-700 flex items-center justify-center gap-2 text-base disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={isLoading}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 6.293A1 1 0 015.586 6H4zm7 3a3 3 0 10-6 0 3 3 0 006 0z" clipRule="evenodd" /></svg>
                                Capture Photo
                            </button>
                        )}
                        <button
                            onClick={stopCamera}
                            className="flex-1 bg-rose-500 text-white font-semibold py-2.5 px-4 rounded-lg hover:bg-rose-600 flex items-center justify-center gap-2 text-base"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                            Stop Camera
                        </button>
                    </div>
                </>
            ) : (
                <>
                    <button
                        onClick={startCamera}
                        disabled={isLoading}
                        className="w-full bg-sky-600 text-white font-semibold py-2.5 px-4 rounded-lg hover:bg-sky-700 flex items-center justify-center gap-2 text-base disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-4 3 3 5-5V3l-2 2-3-3-4 4-3-3v10z"/></svg>
                        Start Camera Scan
                    </button>
                    <div className="text-sm text-slate-500">OR</div>
                    <input 
                        type="file"
                        ref={fileInputRef}
                        onChange={(e) => handleFileChange(e.target.files ? e.target.files[0] : null)}
                        accept="image/*"
                        className="hidden"
                    />
                    <div 
                        onClick={handleZoneClick}
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        className="w-full border-2 border-dashed border-slate-300 rounded-lg p-6 text-center cursor-pointer hover:border-orange-500 hover:bg-orange-50 transition-colors"
                    >
                        {imageSrc ? (
                            <img src={imageSrc} alt="QR Code Preview" className="max-h-48 mx-auto rounded-md" />
                        ) : (
                            <div className="flex flex-col items-center text-slate-500">
                                <FileUploadIcon className="w-12 h-12 mb-2"/>
                                <p className="font-semibold">Click to upload or drag & drop</p>
                                <p className="text-xs">PNG, JPG, etc.</p>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
        
        {(isLoading && !isCameraActive) && <p className="text-center mt-2 text-slate-600 font-semibold">{statusMessage || 'Scanning...'}</p>}
        {error && <p className="text-center mt-2 text-red-600 font-semibold">{error}</p>}

        <div className="mt-6 flex justify-end">
          <button type="button" onClick={onClose} className="py-2 px-4 bg-slate-600 text-white font-semibold rounded-lg hover:bg-slate-700">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScannerModal;