export interface LayerInfo {
  id: string;
  name: string;
  url: string;
  attribution: string;
}

export interface Tab {
  id: string;
  title: string;
}

export interface LandCoverData {
  name: string;
  value: number;
}

export interface SustainabilityMetrics {
  roadDevelopmentPotential: string;
  infrastructureIncreasePotential: string;
  minimumWaterPreservation: string;
  maxBuildingDensityIncrease: string;
}

export interface SustainabilityReport {
  sustainabilityMetrics: SustainabilityMetrics;
  recommendations: string[];
  sustainabilityIndex: number;
  analysis: string;
  district: string | null;
  estimatedPopulation: number | null;
}

export interface ImageData {
  original: string;
  segmented: string;
}

export interface LandUsePercentages {
    Building?: number;
    Road?: number;
    Land?: number;
    Vegetation?: number;
    Water?: number;
    Unlabeled?: number;
}

export interface BiodiversityAnalysisResult {
  percentages: LandUsePercentages;
  segmentedImage: string;
}

export interface CrimeMap {
    id: string;
    title: string;
    url: string;
}

export interface RiskMap {
    id: string;
    title: string;
    url: string;
}

export interface MapInsights {
    district: string;
    [key: string]: string;
}