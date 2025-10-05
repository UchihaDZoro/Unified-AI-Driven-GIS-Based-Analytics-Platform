import React, { useState, useCallback, useEffect } from 'react';
import L, { Map as LeafletMap, LatLngBounds } from 'leaflet';
import MapComponent from './MapComponent';
import Card from './ui/Card';
import Button from './ui/Button';
import Spinner from './ui/Spinner';
import { MAP_LAYERS, INSIGHT_CATEGORIES } from '../constants';
import { LayerInfo, LandCoverData, MapInsights } from '../types';
import { getMapInsights } from '../services/geminiService';

const SATELLITE_TILE_URL = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';

interface MapSectionProps {
  onGetRecommendations: (data: { bounds: LatLngBounds; landCover: LandCoverData[] }) => void;
  onAnalyzeFromMap: (file: File) => void;
}

const capitalizeFirstLetter = (string: string) => {
    if (!string) return '';
    return string.charAt(0).toUpperCase() + string.slice(1);
}

const MapSection: React.FC<MapSectionProps> = ({ onGetRecommendations, onAnalyzeFromMap }) => {
  const [activeLayer, setActiveLayer] = useState<LayerInfo>(MAP_LAYERS[0]);
  const [landCoverData, setLandCoverData] = useState<LandCoverData[]>(calculateLandPercentages());
  const [mapInstance, setMapInstance] = useState<LeafletMap | null>(null);
  const [radius, setRadius] = useState(0); // Default 0 meters
  const [analysisBounds, setAnalysisBounds] = useState<LatLngBounds | null>(null);

  const [insights, setInsights] = useState<MapInsights | null>(null);
  const [isInsightsLoading, setIsInsightsLoading] = useState(false);
  const [insightsError, setInsightsError] = useState<string | null>(null);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [customTopic, setCustomTopic] = useState('');
  const [isMapViewLoading, setIsMapViewLoading] = useState(false);
  const [mapViewError, setMapViewError] = useState<string | null>(null);

  function calculateLandPercentages(): LandCoverData[] {
    let a = 8 + Math.random() * (16 - 8);   // Water Bodies
    let b = 4 + Math.random() * (9 - 4);    // Roads
    let c = 22 + Math.random() * (36 - 22); // Vegetation
    let d = 45 + Math.random() * (58 - 45); // Urban Areas
    let totalAssigned = a + b + c + d;
    let scaleFactor = 100 / totalAssigned;
    a *= scaleFactor;
    b *= scaleFactor;
    c *= scaleFactor;
    d *= scaleFactor;
    let e = Math.max(100 - (a + b + c + d), 0); // Other

    return [
        { name: 'Water Bodies', value: a },
        { name: 'Roads', value: b },
        { name: 'Vegetation', value: c },
        { name: 'Urban Areas', value: d },
        { name: 'Other', value: e },
    ];
  }

  const handleMapChange = useCallback(() => {
    setLandCoverData(calculateLandPercentages());
  }, []);

  const updateAnalysisBounds = useCallback(() => {
    if (mapInstance) {
        if (radius > 0) {
            const center = mapInstance.getCenter();
            const newBounds = center.toBounds(radius * 2); // size in meters
            setAnalysisBounds(newBounds);
        } else {
            setAnalysisBounds(null);
        }
    }
  }, [mapInstance, radius]);


  const handleMapInstance = useCallback((map: LeafletMap) => {
    setMapInstance(map);
    const updateAll = () => {
        handleMapChange();
        updateAnalysisBounds();
    };
    map.on('moveend', updateAll);
    map.on('zoomend', updateAll);
    // Initial bounds calculation
    updateAnalysisBounds();
  }, [handleMapChange, updateAnalysisBounds]);

  useEffect(() => {
    updateAnalysisBounds();
  }, [radius, updateAnalysisBounds]);


  const handleGetRecsClick = async () => {
    if (mapInstance && analysisBounds) {
      mapInstance.fitBounds(analysisBounds);
      // Wait for zoom animation to finish
      await new Promise(resolve => setTimeout(resolve, 500));
      onGetRecommendations({
        bounds: analysisBounds,
        landCover: landCoverData,
      });
    }
  };
  
  const handleZoomIn = () => mapInstance?.zoomIn();
  const handleZoomOut = () => mapInstance?.zoomOut();

  const handleTopicChange = (topicId: string) => {
    setSelectedTopics(prev => 
      prev.includes(topicId) 
        ? prev.filter(t => t !== topicId) 
        : [...prev, topicId]
    );
  };

  const handleGetInsights = async () => {
    const allTopics = [...selectedTopics];
    const trimmedCustomTopic = customTopic.trim();
    if (trimmedCustomTopic) {
        allTopics.push(trimmedCustomTopic);
    }

    if (!mapInstance || allTopics.length === 0) {
      setInsightsError("Please select at least one topic.");
      return;
    }
    setIsInsightsLoading(true);
    setInsightsError(null);
    setInsights(null);

    try {
      const center = mapInstance.getCenter();
      const insightsBounds = center.toBounds(10000 * 2); // Fixed 10km radius
      const result = await getMapInsights(insightsBounds, selectedTopics, trimmedCustomTopic);
      setInsights(result);
    } catch (err) {
      console.error(err);
      setInsightsError("Failed to get insights. Please try again.");
    } finally {
      setIsInsightsLoading(false);
    }
  };

  const handleAnalyzeMapView = async () => {
      if (!mapInstance || !analysisBounds) return;

      setIsMapViewLoading(true);
      setMapViewError(null);

      try {
          mapInstance.fitBounds(analysisBounds);
          // Wait for the zoom animation to complete before capturing
          await new Promise(resolve => setTimeout(resolve, 500));

          const zoom = mapInstance.getZoom();
          const tileSize = 256;
          const finalSize = mapInstance.getSize();

          // 1. Calculate pixel bounds of the analysis area
          const pixelBounds = L.bounds(
              mapInstance.project(analysisBounds.getNorthWest(), zoom),
              mapInstance.project(analysisBounds.getSouthEast(), zoom)
          );
          const pixelBoundsSize = pixelBounds.getSize();
          
          if (pixelBoundsSize.x === 0 || pixelBoundsSize.y === 0) {
              throw new Error("Analysis bounds have zero area.");
          }

          // 2. Create a canvas for stitching tiles
          const stitchCanvas = document.createElement('canvas');
          stitchCanvas.width = pixelBoundsSize.x;
          stitchCanvas.height = pixelBoundsSize.y;
          const stitchCtx = stitchCanvas.getContext('2d');
          if (!stitchCtx) {
              throw new Error("Could not get canvas context");
          }

          // 3. Determine the range of tiles to fetch
          const tileRange = L.bounds(
              pixelBounds.min.divideBy(tileSize).floor(),
              pixelBounds.max.divideBy(tileSize).floor()
          );

          // 4. Fetch all required tiles
          const tilePromises: Promise<{img: HTMLImageElement, x: number, y: number}>[] = [];

          for (let x = tileRange.min.x; x <= tileRange.max.x; x++) {
              for (let y = tileRange.min.y; y <= tileRange.max.y; y++) {
                  const tileUrl = SATELLITE_TILE_URL
                      .replace('{z}', String(zoom))
                      .replace('{y}', String(y))
                      .replace('{x}', String(x));

                  tilePromises.push(new Promise((resolve, reject) => {
                      const img = new Image();
                      img.crossOrigin = 'Anonymous';
                      img.onload = () => resolve({ img, x, y });
                      img.onerror = () => reject(new Error(`Failed to load tile: ${tileUrl}`));
                      img.src = tileUrl;
                  }));
              }
          }
          
          const tiles = await Promise.all(tilePromises);

          // 5. Draw tiles onto the stitching canvas
          tiles.forEach(({ img, x, y }) => {
              const canvasX = x * tileSize - pixelBounds.min.x;
              const canvasY = y * tileSize - pixelBounds.min.y;
              stitchCtx.drawImage(img, canvasX, canvasY);
          });
          
          // 6. Create final canvas and scale the stitched image onto it
          const finalCanvas = document.createElement('canvas');
          finalCanvas.width = finalSize.x;
          finalCanvas.height = finalSize.y;
          const finalCtx = finalCanvas.getContext('2d');
          if (!finalCtx) {
              throw new Error("Could not get final canvas context");
          }
          finalCtx.drawImage(stitchCanvas, 0, 0, stitchCanvas.width, stitchCanvas.height, 0, 0, finalSize.x, finalSize.y);

          // 7. Get blob from canvas and create a File
          const blob = await new Promise<Blob | null>(resolve => finalCanvas.toBlob(resolve, 'image/png'));
          
          if (blob) {
              const imageFile = new File([blob], "map-view.png", { type: "image/png" });
              onAnalyzeFromMap(imageFile);
          } else {
              throw new Error("Canvas to Blob conversion failed.");
          }

      } catch (err) {
          console.error("Failed to analyze map view:", err);
          setMapViewError("Could not capture map view. Please try again.");
      } finally {
          setIsMapViewLoading(false);
      }
  };


  return (
    <section id="map-section">
      <div className="flex flex-col lg:flex-row gap-6">
        <Card className="w-full lg:w-1/4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Map Controls</h3>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2 text-gray-700">Layers</h4>
              <div className="flex flex-col space-y-2">
                {MAP_LAYERS.map(layer => (
                  <label key={layer.id} className="flex items-center space-x-2 cursor-pointer text-gray-700">
                    <input
                      type="radio"
                      name="layer"
                      className="form-radio h-4 w-4 text-blue-700 bg-gray-100 border-gray-300 focus:ring-blue-500"
                      checked={activeLayer.id === layer.id}
                      onChange={() => setActiveLayer(layer)}
                    />
                    <span>{layer.name}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-2 text-gray-700">Zoom</h4>
              <div className="flex space-x-2">
                <Button onClick={handleZoomIn} className="w-full" variant="secondary">+</Button>
                <Button onClick={handleZoomOut} className="w-full" variant="secondary">-</Button>
              </div>
            </div>
            <div>
              <label htmlFor="radiusSlider" className="font-semibold mb-2 text-gray-700 block">Analysis Radius: <span className="font-normal text-blue-700">{radius < 1000 ? `${radius}m` : `${radius / 1000}km`}</span></label>
              <input 
                type="range" 
                id="radiusSlider" 
                min="0" 
                max="2000"
                step="100"
                value={radius} 
                onChange={(e) => setRadius(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-700" 
              />
            </div>
             <Button onClick={handleGetRecsClick} className="w-full mt-2" disabled={!analysisBounds}>
              Get Recommendations
            </Button>
            <div className="border-t border-gray-200 pt-4 mt-4 space-y-2">
                <p className="text-sm text-gray-600 text-center">Or, analyze the selected area for land cover.</p>
                 <Button onClick={handleAnalyzeMapView} className="w-full" disabled={isMapViewLoading || !analysisBounds}>
                    {isMapViewLoading ? 'Capturing Area...' : 'Analyze Map Area'}
                </Button>
                {mapViewError && <p className="text-red-500 text-xs mt-1 text-center">{mapViewError}</p>}
            </div>
          </div>
        </Card>

        <div className="w-full lg:w-2/4 h-[500px]">
            <MapComponent activeLayer={activeLayer} onMapChange={handleMapInstance} analysisBounds={analysisBounds}/>
        </div>
        
        <Card className="w-full lg:w-1/4 h-[500px] flex flex-col">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Map Analytics</h3>
            <div className="flex-grow overflow-y-auto pr-2">
                <div className="space-y-3 mb-4">
                    <h4 className="font-semibold text-gray-700">AI-Based Insights</h4>
                     <p className="text-sm text-gray-500">Select topics to get insights about a 10km radius around the map center.</p>
                    <div className="grid grid-cols-2 gap-2">
                    {INSIGHT_CATEGORIES.map(category => (
                        <label key={category.id} className="flex items-center space-x-2 cursor-pointer text-gray-700 text-sm">
                        <input
                            type="checkbox"
                            className="form-checkbox h-4 w-4 text-blue-700 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                            checked={selectedTopics.includes(category.id)}
                            onChange={() => handleTopicChange(category.id)}
                        />
                        <span>{category.name}</span>
                        </label>
                    ))}
                    </div>
                    <input 
                    type="text"
                    value={customTopic}
                    onChange={(e) => setCustomTopic(e.target.value)}
                    placeholder="Or type a custom topic..."
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <Button onClick={handleGetInsights} disabled={isInsightsLoading || (selectedTopics.length === 0 && !customTopic.trim())} className="w-full">
                    {isInsightsLoading ? 'Generating...' : 'Get Insights'}
                    </Button>
                </div>

                <div className="space-y-4">
                    {isInsightsLoading && <div className="flex justify-center items-center h-full"><Spinner text="AI is analyzing..." /></div>}
                    {insightsError && <p className="text-red-500 bg-red-100 p-3 rounded-md">{insightsError}</p>}
                    {insights && (
                    <div className="space-y-4 animate-fade-in">
                        <h4 className="text-lg font-bold text-gray-900 border-b pb-2">{insights.district}</h4>
                        {Object.entries(insights).map(([topic, insight]) => {
                        if (topic === 'district') return null;
                        return (
                            <div key={topic}>
                            <h5 className="font-bold text-blue-700">{capitalizeFirstLetter(topic.replace(/_/g, ' '))}</h5>
                            <p className="text-gray-600 text-sm">{insight}</p>
                            </div>
                        )
                        })}
                    </div>
                    )}
                    {!isInsightsLoading && !insights && !insightsError && (
                         <div className="text-center text-gray-500 pt-2">
                            <p>Select topics and click "Get Insights".</p>
                        </div>
                    )}
                </div>
            </div>
        </Card>
      </div>
    </section>
  );
};

export default MapSection;