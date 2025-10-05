
import React, { useState, useCallback, useEffect } from 'react';
import { ANALYSIS_TABS, CRIME_MAPS, ENVIRONMENTAL_RISK_MAPS, INFRASTRUCTURE_RISK_MAPS } from '../constants';
import { LandUsePercentages, BiodiversityAnalysisResult } from '../types';
import { analyzeImageForBiodiversity } from '../services/geminiService';
import Card from './ui/Card';
import Tabs from './ui/Tabs';
import Button from './ui/Button';
import Spinner from './ui/Spinner';
import LocalMapIframe from './LocalMapIframe';

interface AnalysisSectionProps {
    imageFromMap: File | null;
    startAnalysis: boolean;
    onAnalysisComplete: () => void;
}

const AnalysisSection: React.FC<AnalysisSectionProps> = ({ imageFromMap, startAnalysis, onAnalysisComplete }) => {
    const [activeTab, setActiveTab] = useState(ANALYSIS_TABS[0].id);
    const [activeCrimeMap, setActiveCrimeMap] = useState(CRIME_MAPS[0].url);
    const [activeRiskMap, setActiveRiskMap] = useState(ENVIRONMENTAL_RISK_MAPS[0].url);
    const [activeTrafficMap, setActiveTrafficMap] = useState(INFRASTRUCTURE_RISK_MAPS[0].url);
    
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [analysisResult, setAnalysisResult] = useState<BiodiversityAnalysisResult | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
      if (imageFromMap) {
        setImageFile(imageFromMap);
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreviewImage(reader.result as string);
        };
        reader.readAsDataURL(imageFromMap);
        
        setAnalysisResult(null);
        setError(null);
      }
    }, [imageFromMap]);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewImage(reader.result as string);
            };
            reader.readAsDataURL(file);
            setAnalysisResult(null);
            setError(null);
        }
    };

    const handleAnalysis = useCallback(async () => {
        if (!imageFile) {
            setError("Please select an image first.");
            if(startAnalysis) onAnalysisComplete();
            return;
        }
        setIsLoading(true);
        setError(null);
        setAnalysisResult(null);

        try {
            const base64Image = previewImage?.split(',')[1];
            if (!base64Image) {
                throw new Error("Could not read image data.");
            }
            const result = await analyzeImageForBiodiversity(base64Image, imageFile.type);
            setAnalysisResult(result);
        } catch (err) {
            console.error(err);
            setError("Failed to analyze the image. Please try again.");
        } finally {
            setIsLoading(false);
            if(startAnalysis) {
                onAnalysisComplete();
            }
        }
    }, [imageFile, previewImage, onAnalysisComplete, startAnalysis]);

    useEffect(() => {
        if (startAnalysis && imageFile && previewImage) {
            setActiveTab('mapAnalysis');
            handleAnalysis();
        }
    }, [startAnalysis, imageFile, previewImage, handleAnalysis]);

     const landUseColors: Record<string, string> = {
        Building: 'bg-gray-500',
        Road: 'bg-gray-700',
        Land: 'bg-yellow-800',
        Vegetation: 'bg-green-600',
        Water: 'bg-blue-600',
        Unlabeled: 'bg-black',
    };

  return (
    <section id="analysis-section">
      <h2 className="text-3xl font-bold text-blue-700 mb-6">Analysis and Predictions</h2>
      <Card>
        <Tabs tabs={ANALYSIS_TABS} activeTab={activeTab} onTabChange={setActiveTab}>
          {(activeTab) => (
            <div>
              {activeTab === 'crimeManagement' && (
                <div>
                  <h3 className="text-xl font-semibold mb-4 text-gray-800">Crime Analysis</h3>
                    <div className="flex flex-wrap gap-2 mb-4">
                        {CRIME_MAPS.map(map => (
                            <Button key={map.id} variant={activeCrimeMap === map.url ? 'primary' : 'secondary'} onClick={() => setActiveCrimeMap(map.url)}>
                                {map.title}
                            </Button>
                        ))}
                    </div>
                  <iframe src={activeCrimeMap} width="100%" height="500px" className="border-none rounded-md ring-1 ring-gray-200 shadow-lg" title="Crime Map"></iframe>
                </div>
              )}
              {activeTab === 'environmentalRisk' && (
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-gray-800">Environmental Risk Analysis</h3>
                  <p className="text-gray-600 mb-4">
                    Analyze potential environmental risks using specialized map overlays. These maps highlight areas vulnerable to issues like deforestation, water body degradation, and loss of biodiversity.
                  </p>
                   <div className="flex flex-wrap items-center gap-2 mb-4 bg-gray-100 p-2 rounded-lg">
                        <span className="font-semibold text-gray-700 mr-2">Risk Layers:</span>
                        {ENVIRONMENTAL_RISK_MAPS.map(map => (
                            <Button key={map.id} variant={activeRiskMap === map.url ? 'primary' : 'secondary'} onClick={() => setActiveRiskMap(map.url)}>
                                {map.title}
                            </Button>
                        ))}
                    </div>
                  <LocalMapIframe url={activeRiskMap} title="Environmental Risk Map" />
                </div>
              )}
              {activeTab === 'infrastructureAnalysis' && (
                 <div>
                  <h3 className="text-xl font-semibold mb-2 text-gray-800">Infrastructure Risk Analysis</h3>
                   <p className="text-gray-600 mb-4">
                    Evaluate risks associated with urban infrastructure. These layers visualize potential stress on transportation networks and vulnerabilities within urbanized zones.
                  </p>
                   <div className="flex flex-wrap items-center gap-2 mb-4 bg-gray-100 p-2 rounded-lg">
                        <span className="font-semibold text-gray-700 mr-2">Risk Layers:</span>
                        {INFRASTRUCTURE_RISK_MAPS.map(map => (
                            <Button key={map.id} variant={activeTrafficMap === map.url ? 'primary' : 'secondary'} onClick={() => setActiveTrafficMap(map.url)}>
                                {map.title}
                            </Button>
                        ))}
                    </div>
                  <LocalMapIframe url={activeTrafficMap} title="Infrastructure Risk Map" />
                </div>
              )}
              {activeTab === 'mapAnalysis' && (
                <div>
                  <h3 className="text-xl font-semibold mb-4 text-gray-800">Map Analysis</h3>
                   <div className="space-y-6">
                        <div className="p-6 border-2 border-dashed border-gray-300 rounded-lg text-center bg-gray-50">
                            <p className="text-gray-600 mb-4">Upload a satellite/aerial image or capture a view from the map to analyze its land cover. The AI will segment the image and calculate land use percentages.</p>
                            <input type="file" id="image-file" accept="image/*" onChange={handleFileChange} className="block w-full max-w-sm mx-auto text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200 cursor-pointer"/>
                            <Button onClick={handleAnalysis} disabled={isLoading || !imageFile} className="mt-4">
                                {isLoading ? 'Analyzing...' : 'Analyze Image with AI'}
                            </Button>
                        </div>
                        
                        {error && <p className="text-red-500 bg-red-100 p-3 rounded-md text-center">{error}</p>}
                        
                        {isLoading && (
                            <div className="flex flex-col items-center justify-center h-64">
                                <Spinner text="AI is analyzing and segmenting the image..." />
                                <p className="text-sm text-gray-500 mt-2">This may take a moment.</p>
                            </div>
                        )}
                        
                        {analysisResult && previewImage && (
                            <Card className="animate-fade-in">
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                                    <div className="space-y-2">
                                        <h4 className="font-semibold text-center text-gray-700">Original Image</h4>
                                        <img src={previewImage} alt="Uploaded" className="rounded-lg shadow-md w-full object-cover"/>
                                    </div>
                                    <div className="space-y-2">
                                        <h4 className="font-semibold text-center text-gray-700">AI Segmented Image</h4>
                                        <img src={analysisResult.segmentedImage} alt="Segmented" className="rounded-lg shadow-md w-full object-cover"/>
                                    </div>
                                    <div className="space-y-2">
                                        <h4 className="font-semibold text-center text-gray-700">Land Cover Analysis</h4>
                                        <div className="bg-gray-50 p-4 rounded-lg h-full">
                                            <ul className="space-y-2">
                                                {Object.entries(analysisResult.percentages).map(([key, value]) => (
                                                    <li key={key} className="flex justify-between items-center py-1 text-sm">
                                                        <div className="flex items-center">
                                                            <span className={`w-3 h-3 rounded-full mr-2 ${landUseColors[key] || 'bg-gray-400'}`}></span>
                                                            <span>{key}:</span>
                                                        </div>
                                                        <span className="font-bold text-blue-700">{value?.toFixed(1)}%</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        )}
                    </div>
                </div>
              )}
            </div>
          )}
        </Tabs>
      </Card>
    </section>
  );
};

export default AnalysisSection;