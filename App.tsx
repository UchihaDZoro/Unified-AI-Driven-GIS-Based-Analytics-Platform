
import React, { useState, useCallback } from 'react';
import { LatLngBounds } from 'leaflet';
import Header from './components/Header';
import MapSection from './components/MapSection';
import AnalysisSection from './components/AnalysisSection';
import SustainabilitySection from './components/SustainabilitySection';
import Footer from './components/Footer';
import { LandCoverData, SustainabilityReport } from './types';
import { getSustainabilityReport } from './services/geminiService';

export interface MapAnalysisData {
  bounds: LatLngBounds;
  landCover: LandCoverData[];
}

function App(): React.JSX.Element {
  const [sustainabilityReport, setSustainabilityReport] = useState<SustainabilityReport | null>(null);
  const [isReportLoading, setIsReportLoading] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const [mapImageForAnalysis, setMapImageForAnalysis] = useState<File | null>(null);
  const [startAnalysis, setStartAnalysis] = useState(false);


  const handleSustainabilityAnalysis = useCallback(async (data: { bounds?: LatLngBounds; landCover?: LandCoverData[]; imageFile?: File }) => {
    setIsReportLoading(true);
    setReportError(null);
    setSustainabilityReport(null);

    try {
      const mapData = {
        bounds: data.bounds,
        urbanAreas: data.landCover?.find(d => d.name === 'Urban Areas')?.value ?? Math.round(10 + Math.random() * 40),
        vegetation: data.landCover?.find(d => d.name === 'Vegetation')?.value ?? Math.round(20 + Math.random() * 30),
        waterBodies: data.landCover?.find(d => d.name === 'Water Bodies')?.value ?? Math.round(5 + Math.random() * 15),
        populationDensity: Math.round(500 + Math.random() * 2000),
      };

      let image;
      if (data.imageFile) {
        const base64Image = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve((reader.result as string).split(',')[1]);
          reader.onerror = error => reject(error);
          reader.readAsDataURL(data.imageFile!);
        });
        image = { base64: base64Image, mimeType: data.imageFile.type };
      }

      const result = await getSustainabilityReport(mapData, image);
      setSustainabilityReport(result);
    } catch (err) {
      console.error(err);
      setReportError('Failed to get sustainability recommendations. Please try again.');
    } finally {
      setIsReportLoading(false);
    }
  }, []);

  const handleGetRecommendationsFromMap = (data: MapAnalysisData) => {
    handleSustainabilityAnalysis(data);
    document.getElementById('recommendation-section')?.scrollIntoView({ behavior: 'smooth' });
  };
  
  const handleAnalyzeFromMap = useCallback((file: File) => {
    setMapImageForAnalysis(file);
    setStartAnalysis(true);
    document.getElementById('analysis-section')?.scrollIntoView({ behavior: 'smooth' });
  }, []);
  
  const handleAnalysisComplete = useCallback(() => {
    setStartAnalysis(false);
  }, []);


  return (
    <div className="flex flex-col h-screen bg-gray-100 text-gray-800">
      <Header />
      <main className="flex-grow overflow-y-auto" style={{scrollPaddingTop: '4rem'}}>
        <div className="container mx-auto px-4 py-8 space-y-12">
            <MapSection onGetRecommendations={handleGetRecommendationsFromMap} onAnalyzeFromMap={handleAnalyzeFromMap} />
            <AnalysisSection 
                imageFromMap={mapImageForAnalysis}
                startAnalysis={startAnalysis}
                onAnalysisComplete={handleAnalysisComplete}
            />
            <SustainabilitySection 
              onAnalyzeFromImage={(file) => handleSustainabilityAnalysis({ imageFile: file })}
              report={sustainabilityReport}
              isLoading={isReportLoading}
              error={reportError}
            />
        </div>
        <Footer />
      </main>
    </div>
  );
}

export default App;