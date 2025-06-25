import React, { useState, useEffect } from 'react';
import { AlertCircle, Image as ImageIcon, RefreshCw, ExternalLink } from 'lucide-react';
import { cn } from '@/utils';

interface ImageWithFallbackProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: string;
  fallbackSrc?: string;
  showError?: boolean;
  errorMessage?: string;
  onRetry?: () => void;
  showDebugInfo?: boolean;
}

export const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({
  src,
  fallbackSrc,
  showError = true,
  errorMessage = "Image failed to load",
  className,
  alt = "Image",
  onRetry,
  showDebugInfo = false,
  ...props
}) => {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentSrc, setCurrentSrc] = useState(src);
  const [errorDetails, setErrorDetails] = useState<string>('');

  // Reset states when src changes
  useEffect(() => {
    console.log('ImageWithFallback: src changed to:', src);
    setImageError(false);
    setIsLoading(true);
    setCurrentSrc(src);
    setErrorDetails('');
  }, [src]);

  // Test image accessibility when currentSrc changes
  useEffect(() => {
    if (currentSrc && currentSrc.startsWith('http')) {
      testImageAccess(currentSrc);
    }
  }, [currentSrc]);

  const testImageAccess = async (url: string) => {
    try {
      console.log('Testing image access for:', url);
      const response = await fetch(url, { 
        method: 'HEAD',
        mode: 'cors',
        cache: 'no-cache'
      });
      
      if (!response.ok) {
        console.error('Image access test failed:', response.status, response.statusText);
        setErrorDetails(`HTTP ${response.status}: ${response.statusText}`);
      } else {
        console.log('Image access test passed:', url);
      }
    } catch (error) {
      console.error('Image access test error:', error);
      if (error instanceof Error) {
        setErrorDetails(error.message);
      }
    }
  };

  const handleImageError = (event: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const imgElement = event.currentTarget;
    console.error('Image failed to load:', {
      src: currentSrc,
      naturalWidth: imgElement.naturalWidth,
      naturalHeight: imgElement.naturalHeight,
      complete: imgElement.complete
    });
    
    setIsLoading(false);
    
    // Try fallback if available and not already tried
    if (fallbackSrc && currentSrc !== fallbackSrc) {
      console.log('Trying fallback image:', fallbackSrc);
      setCurrentSrc(fallbackSrc);
      setIsLoading(true);
      return;
    }
    
    setImageError(true);
  };

  const handleImageLoad = (event: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const imgElement = event.currentTarget;
    console.log('Image loaded successfully:', {
      src: currentSrc,
      naturalWidth: imgElement.naturalWidth,
      naturalHeight: imgElement.naturalHeight
    });
    setIsLoading(false);
    setImageError(false);
    setErrorDetails('');
  };

  const handleRetry = () => {
    console.log('Retrying image load for:', src);
    setImageError(false);
    setIsLoading(true);
    setErrorDetails('');
    setCurrentSrc(src); // Reset to original src
    if (onRetry) {
      onRetry();
    }
  };

  const openImageInNewTab = () => {
    if (currentSrc) {
      window.open(currentSrc, '_blank');
    }
  };

  // If no src provided, show placeholder
  if (!currentSrc) {
    return (
      <div className={cn(
        "flex items-center justify-center bg-slate-800 text-slate-400 border-2 border-dashed border-slate-600 rounded-lg",
        className
      )}>
        <div className="text-center p-4">
          <ImageIcon className="size-8 mx-auto mb-2" />
          <span className="text-xs">No image</span>
        </div>
      </div>
    );
  }

  // If image failed, show error state
  if (imageError) {
    return (
      <div className={cn(
        "flex flex-col items-center justify-center bg-slate-800 text-slate-400 p-4 border-2 border-dashed border-red-500/30 rounded-lg",
        className
      )}>
        <AlertCircle className="size-6 mb-2 text-red-400" />
        {showError && (
          <div className="text-center space-y-2">
            <span className="text-xs text-red-300 block">{errorMessage}</span>
            {errorDetails && showDebugInfo && (
              <span className="text-xs text-red-400 block font-mono">{errorDetails}</span>
            )}
            {showDebugInfo && (
              <div className="text-xs text-slate-500 space-y-1">
                <div>URL: {currentSrc.substring(0, 50)}...</div>
                <div>Type: {currentSrc.startsWith('data:') ? 'Base64' : 'URL'}</div>
              </div>
            )}
          </div>
        )}
        <div className="flex gap-2 mt-2">
          {onRetry && (
            <button
              onClick={handleRetry}
              className="flex items-center gap-1 px-2 py-1 text-xs bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded transition-colors"
            >
              <RefreshCw className="size-3" />
              Retry
            </button>
          )}
          {currentSrc.startsWith('http') && (
            <button
              onClick={openImageInNewTab}
              className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded transition-colors"
            >
              <ExternalLink className="size-3" />
              Open
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("relative overflow-hidden rounded-lg", className)}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-800 z-10 rounded-lg">
          <div className="text-center">
            <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <span className="text-xs text-slate-400">Loading image...</span>
          </div>
        </div>
      )}
      <img
        src={currentSrc}
        alt={alt}
        className={cn(
          "w-full h-full object-cover transition-opacity duration-200",
          isLoading ? "opacity-0" : "opacity-100"
        )}
        onError={handleImageError}
        onLoad={handleImageLoad}
        crossOrigin="anonymous"
        referrerPolicy="no-referrer"
        {...props}
      />
      {showDebugInfo && !isLoading && !imageError && (
        <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1">
          {currentSrc.startsWith('data:') ? 'Base64 Image' : 'Remote Image'}
        </div>
      )}
    </div>
  );
};