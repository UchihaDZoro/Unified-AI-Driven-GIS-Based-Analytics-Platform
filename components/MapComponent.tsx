
import React, { useRef, useEffect } from 'react';
import { MapContainer, TileLayer, Rectangle } from 'react-leaflet';
import L, { LatLngBounds, LatLngExpression } from 'leaflet';
import { LayerInfo } from '../types';

// Fix for default icon issue with webpack
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});


interface MapComponentProps {
  activeLayer: LayerInfo;
  onMapChange: (map: L.Map) => void;
  analysisBounds: LatLngBounds | null;
}

const MapComponent: React.FC<MapComponentProps> = ({ activeLayer, onMapChange, analysisBounds }) => {
  const mapRef = useRef<L.Map>(null);
  const INITIAL_CENTER: LatLngExpression = [23.7956, 86.4304];
  const INITIAL_ZOOM = 10;

  useEffect(() => {
    if (mapRef.current) {
      onMapChange(mapRef.current);
    }
  }, [onMapChange]);

  return (
    <MapContainer 
        center={INITIAL_CENTER} 
        zoom={INITIAL_ZOOM} 
        scrollWheelZoom={true} 
        className="leaflet-container"
        ref={mapRef}
    >
      <TileLayer
        key={activeLayer.id}
        attribution={activeLayer.attribution}
        url={activeLayer.url}
      />
      {analysisBounds && <Rectangle bounds={analysisBounds} pathOptions={{ color: '#3b82f6', fillOpacity: 0.1, weight: 2 }} />}
    </MapContainer>
  );
};

export default MapComponent;
