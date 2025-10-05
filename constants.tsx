
import { LayerInfo, Tab, CrimeMap, RiskMap } from './types';

export const HEADER_LINKS: { name: string; href: string }[] = [
  { name: 'Mapping', href: '#map-section' },
  { name: 'Analysis', href: '#analysis-section' },
  { name: 'Recommendations', href: '#recommendation-section' },
];

export const MAP_LAYERS: LayerInfo[] = [
    {
        id: 'default',
        name: 'Default',
        url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        attribution: '&copy; OpenStreetMap contributors',
    },
    {
        id: 'urbanAreas',
        name: 'Urban Areas',
        url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
        attribution: '© OpenTopoMap contributors',
    },
    {
        id: 'vegetation',
        name: 'Vegetation',
        url: 'https://tile.thunderforest.com/cycle/{z}/{x}/{y}.png?apikey=a0bc9077602844cdbaef9034b814beaf',
        attribution: '© Thunderforest',
    },
    {
        id: 'waterBodies',
        name: 'Water Bodies',
        url: 'https://tile.thunderforest.com/landscape/{z}/{x}/{y}.png?apikey=a0bc9077602844cdbaef9034b814beaf',
        attribution: '© Thunderforest',
    },
    {
        id: 'transport',
        name: 'Transport',
        url: 'https://tile.thunderforest.com/transport/{z}/{x}/{y}.png?apikey=a0bc9077602844cdbaef9034b814beaf',
        attribution: '© Thunderforest',
    },
    {
        id: 'railways',
        name: 'Railways',
        url: 'https://tile.thunderforest.com/atlas/{z}/{x}/{y}.png?apikey=a0bc9077602844cdbaef9034b814beaf',
        attribution: '© Thunderforest',
    },
];

export const ANALYSIS_TABS: Tab[] = [
    { id: 'crimeManagement', title: 'Crime Management' },
    { id: 'environmentalRisk', title: 'Environmental Risk' },
    { id: 'infrastructureAnalysis', title: 'Infrastructure Risk' },
    { id: 'mapAnalysis', title: 'Map Analysis' },
];

export const INSIGHT_CATEGORIES = [
    { id: 'safety', name: 'Safety' },
    { id: 'tourism', name: 'Tourism' },
    { id: 'pollution', name: 'Pollution' },
    { id: 'infrastructure', name: 'Infrastructure' },
    { id: 'biodiversity', name: 'Biodiversity' },
];

export const CRIME_MAPS: CrimeMap[] = [
    { id: 'overall', title: 'Overall Crime', url: 'https://www.arcgis.com/apps/Embed/index.html?webmap=ce194939de334c33bb9d1301964e2965&theme=dark' },
    { id: 'women', title: 'Crime Against Women', url: 'https://www.arcgis.com/apps/Embed/index.html?webmap=083ac4a41af84692bea9bbe64eaca479&theme=dark' },
    { id: 'children', title: 'Crime Against Children', url: 'https://www.arcgis.com/apps/Embed/index.html?webmap=158dfc898b8244cb8e69c2293930cc7a&theme=dark' },
];

export const ENVIRONMENTAL_RISK_MAPS: RiskMap[] = [
    { id: 'vegetationRisk', title: 'Vegetation Risk', url: '/vegetation_risk_map.html' },
    { id: 'waterBodiesRisk', title: 'Water Bodies Risk', url: '/water_bodies_risk_map-1.html' },
    { id: 'biodiversityRisk', title: 'Biodiversity Risk', url: '/biodiversity_risk_map-1.html' },
];

export const INFRASTRUCTURE_RISK_MAPS: RiskMap[] = [
    { id: 'transportationRisk', title: 'Roads Risk', url: '/transportation_risk_map.html' },
    { id: 'urbanAreaRisk', title: 'Urban Area Risk', url: '/urban_area_risk_map.html' },
];
