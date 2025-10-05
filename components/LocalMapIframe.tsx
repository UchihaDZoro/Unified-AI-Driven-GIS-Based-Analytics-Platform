
import React, { useState, useEffect } from 'react';
import Spinner from './ui/Spinner';

interface LocalMapIframeProps {
  url: string;
  title: string;
}

const LocalMapIframe: React.FC<LocalMapIframeProps> = ({ url, title }) => {
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHtml = async () => {
      setIsLoading(true);
      setError(null);
      setHtmlContent('');
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to load map: ${response.statusText}`);
        }
        const text = await response.text();
        setHtmlContent(text);
      } catch (err) {
        console.error(`Error fetching ${url}:`, err);
        setError('Could not load the map data. Please ensure the file exists and the server is running.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchHtml();
  }, [url]); // Re-run effect when URL changes

  return (
    <div className="w-full h-[500px] bg-gray-200 rounded-md ring-1 ring-gray-300 shadow-inner flex items-center justify-center">
        {isLoading && <Spinner text="Loading map..." />}
        {error && <div className="text-center text-red-500 p-4">
            <p>Error loading map</p>
            <p className="text-sm text-gray-600">{error}</p>
        </div>}
        {!isLoading && !error && (
            <iframe
                srcDoc={htmlContent}
                width="100%"
                height="100%"
                className="border-none rounded-md"
                title={title}
            ></iframe>
        )}
    </div>
  );
};

export default LocalMapIframe;