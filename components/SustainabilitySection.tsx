import React, { useState } from 'react';
import { SustainabilityReport } from '../types';
import Card from './ui/Card';
import Button from './ui/Button';
import Spinner from './ui/Spinner';
import RadialProgress from './ui/RadialProgress';

interface SustainabilitySectionProps {
  report: SustainabilityReport | null;
  isLoading: boolean;
  error: string | null;
  onAnalyzeFromImage: (file: File) => void;
}

const MetricCard: React.FC<{ icon: React.ReactNode, label: string, value: string | number }> = ({ icon, label, value }) => (
    <div className="bg-gray-100 p-4 rounded-lg text-center flex flex-col items-center justify-center shadow-sm">
      <div className="w-8 h-8 text-blue-700 mb-2">{icon}</div>
      <div className="text-2xl font-bold text-gray-800">{value}</div>
      <div className="text-xs text-gray-600 capitalize mt-1">{label}</div>
    </div>
);

const SustainabilitySection: React.FC<SustainabilitySectionProps> = ({ report, isLoading, error, onAnalyzeFromImage }) => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
        setImageFile(file);
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreviewImage(reader.result as string);
        };
        reader.readAsDataURL(file);
    }
  };

  const handleImageAnalysis = () => {
    if (imageFile) {
      onAnalyzeFromImage(imageFile);
    }
  };

  return (
    <section id="recommendation-section">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-blue-700">AI Sustainability Recommendations</h2>
        <p className="text-gray-600 mt-2 max-w-2xl mx-auto">Generate a sustainability report by selecting an area on the map or by uploading a satellite image below.</p>
      </div>

      <div className="max-w-4xl mx-auto">
        <Card className="mb-8 bg-gray-50">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 text-center">Generate Report</h3>
            <div className="flex flex-col md:flex-row gap-6 items-stretch">
                {/* Analyze from Map */}
                <div className="w-full md:w-1/2 text-center border-r-0 md:border-r md:pr-6 border-gray-200 flex flex-col items-center">
                     <div className="flex-grow flex flex-col items-center justify-center space-y-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        <p className="text-gray-600">Use the interactive map to select a region for analysis.</p>
                    </div>
                    <a href="#map-section" className="w-full mt-auto pt-4">
                        <Button variant="secondary" className="w-full">
                           Analyze from Map
                        </Button>
                    </a>
                </div>

                {/* Upload Image */}
                <div className="w-full md:w-1/2 flex flex-col items-center text-center">
                    <div className="flex-grow w-full flex flex-col items-center justify-center space-y-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        <p className="text-gray-600">Or upload a satellite/aerial image to generate a report.</p>
                        {previewImage && (
                            <div className="w-full mt-2">
                                <img src={previewImage} alt="Uploaded for analysis" className="rounded-lg shadow-md max-h-32 w-full object-cover"/>
                            </div>
                        )}
                    </div>
                    <div className="w-full mt-auto pt-4 space-y-4">
                        <input type="file" id="image-file-sustainability" accept="image/*" onChange={handleFileChange} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/>
                        <Button onClick={handleImageAnalysis} disabled={isLoading || !imageFile} className="w-full">
                            {isLoading && !report ? 'Generating...' : 'Generate from Image'}
                        </Button>
                    </div>
                </div>
            </div>
        </Card>

        {isLoading && <div className="flex justify-center my-8"><Spinner text="Report is generating..." /></div>}
        {error && <p className="text-center text-red-500 bg-red-100 p-4 rounded-lg">{error}</p>}
        
        {report && (
          <Card className="animate-fade-in">
             <div className="space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
                    <div className="flex-grow">
                        <h3 className="text-2xl font-bold text-gray-800">{report.district || 'General Area'} Analysis</h3>
                        {report.estimatedPopulation != null && <p className="text-gray-600">Estimated Population: <span className="font-semibold">{report.estimatedPopulation.toLocaleString()}</span></p>}
                    </div>
                    <div className="flex flex-col items-center">
                        <RadialProgress progress={report.sustainabilityIndex} className="w-32 h-32" />
                        <h4 className="text-lg font-semibold text-gray-700 mt-2">Sustainability Index</h4>
                    </div>
                </div>

                {/* Metrics */}
                 <div>
                    <h3 className="text-xl font-semibold text-blue-700 mb-4">Key Metrics</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <MetricCard 
                            label="Road Dev. Potential" 
                            value={report.sustainabilityMetrics.roadDevelopmentPotential} 
                            icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 0 1-5.84 7.38v-4.82m5.84-2.56a16.5 16.5 0 0 0-1.23-1.07M16.5 19.5m-2.25 0a2.25 2.25 0 1 0 4.5 0 2.25 2.25 0 1 0-4.5 0ZM6.75 12.75a8.25 8.25 0 0 0 0 11.25m11.25 0a8.25 8.25 0 0 0 0-11.25M12 4.5A8.25 8.25 0 0 0 3.75 12.75m16.5 0A8.25 8.25 0 0 0 12 4.5m0 0V2.25m0 2.25a16.5 16.5 0 0 1 5.84 7.38m-5.84-7.38a16.5 16.5 0 0 0-5.84 7.38m5.84-7.38L15.59 14.37" /></svg>}
                        />
                        <MetricCard 
                            label="Infra. Incr. Potential" 
                            value={report.sustainabilityMetrics.infrastructureIncreasePotential} 
                            icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" /></svg>}
                        />
                         <MetricCard 
                            label="Min. Water Preservation" 
                            value={report.sustainabilityMetrics.minimumWaterPreservation} 
                            icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3.75c-3.237 3.237-3.237 8.483 0 11.72 3.237 3.237 8.483 3.237 11.72 0M6.375 7.5c-3.237 3.237-3.237 8.483 0 11.72s8.483 3.237 11.72 0" /></svg>}
                        />
                         <MetricCard 
                            label="Max Bldg. Density Incr." 
                            value={report.sustainabilityMetrics.maxBuildingDensityIncrease} 
                            icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h7.5" /></svg>}
                        />
                    </div>
                </div>

                {/* Analysis and Recommendations */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                     <div>
                        <h3 className="text-xl font-semibold text-blue-700 mb-2">Analysis</h3>
                        <p className="text-gray-600 whitespace-pre-wrap bg-gray-50 p-4 rounded-lg">{report.analysis}</p>
                    </div>

                    <div>
                        <h3 className="text-xl font-semibold text-blue-700 mb-2">Recommendations</h3>
                        <ul className="space-y-3 text-gray-600">
                        {report.recommendations.map((rec, index) => (
                            <li key={index} className="flex items-start">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                <span>{rec}</span>
                            </li>
                        ))}
                        </ul>
                    </div>
                </div>
            </div>
          </Card>
        )}
      </div>
    </section>
  );
};

export default SustainabilitySection;