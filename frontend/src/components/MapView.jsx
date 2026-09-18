import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const createDivIcon = (typeColorClass, letter, isSelected) => {
  const scale = isSelected ? 'scale-125 z-50 ring-4 ring-white' : 'scale-100 opacity-90 hover:opacity-100 hover:scale-110';
  
  return new L.divIcon({
    html: `<div class="w-8 h-8 rounded-full border-2 border-white shadow-md ${typeColorClass} flex items-center justify-center text-white font-bold text-sm transition-all ${scale}">${letter}</div>`,
    className: '',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

const getIconForType = (type, isSelected) => {
  const t = (type || '').toLowerCase();
  if (t.includes('liquidation')) return createDivIcon('bg-red-500', 'L', isSelected);
  if (t.includes('redressement')) return createDivIcon('bg-orange-500', 'R', isSelected);
  if (t.includes('sauvegarde')) return createDivIcon('bg-[#facc15]', 'S', isSelected);
  return createDivIcon('bg-slate-400', '?', isSelected);
};

const MapController = ({ center, radius, results }) => {
  const map = useMap();
  
  useEffect(() => {
    if (center) {
      map.setView(center, 10);
      if (radius) {
        const bounds = new L.LatLng(center[0], center[1]).toBounds(radius * 1000);
        map.fitBounds(bounds, { padding: [20, 20], maxZoom: 14 });
      }
    }
  }, [center, radius, map]);

  return null;
};

const TileLayerUpdater = ({ url, attribution }) => {
  const map = useMap();
  useEffect(() => {
    map.eachLayer(layer => {
      if (layer instanceof L.TileLayer) map.removeLayer(layer);
    });
    L.tileLayer(url, { attribution }).addTo(map);
  }, [url, map, attribution]);
  return null;
};

const MapView = ({ results, searchParams, onMarkerClick, selectedResult, theme }) => {
  const defaultCenter = React.useMemo(() => [46.603354, 1.888334], []);
  const center = React.useMemo(() => searchParams ? [searchParams.lat, searchParams.lon] : defaultCenter, [searchParams, defaultCenter]);
  const zoom = searchParams ? 11 : 6;

  const [mapStyle, setMapStyle] = useState('classic'); // 'classic' | 'satellite'
  const [forceDarkMap, setForceDarkMap] = useState(() => localStorage.getItem('forceDarkMap') !== 'false');

  useEffect(() => {
    const handleStorage = () => {
      setForceDarkMap(localStorage.getItem('forceDarkMap') !== 'false');
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const getTileConfig = () => {
    if (mapStyle === 'satellite') {
      return {
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        attribution: '© <a href="https://www.esri.com">Esri</a> — Source: Esri, USGS, NOAA',
      };
    }
    return {
      url: (theme === 'dark' && forceDarkMap)
        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
        : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    };
  };

  const tile = getTileConfig();

  return (
    <div className="h-full w-full relative">
      <MapContainer center={center} zoom={zoom} className="h-full w-full z-10">
        <TileLayer attribution={tile.attribution} url={tile.url} />
        <TileLayerUpdater url={tile.url} attribution={tile.attribution} />
        
        <MapController center={searchParams ? center : null} radius={searchParams?.radius} results={results} />

        {searchParams && (
          <Circle 
            center={center} 
            radius={searchParams.radius * 1000} 
            pathOptions={{ color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.05, weight: 2, dashArray: '5, 5' }} 
          />
        )}

        {results.map((result) => {
          const isSelected = selectedResult && selectedResult.id === result.id;
          const icon = getIconForType(result.type_procedure, isSelected);

          return (
            <Marker 
              key={`marker-${result.id}`} 
              position={[result.lat, result.lon]} 
              icon={icon}
              zIndexOffset={isSelected ? 1000 : 0}
              eventHandlers={{
                click: () => onMarkerClick(result),
              }}
            />
          );
        })}
      </MapContainer>

      {/* Toggle bouton flottant (Carte/Satellite) */}
      <div
        style={{ position: 'absolute', top: '12px', right: '12px', zIndex: 1000 }}
      >
        <div style={{
          display: 'flex',
          width: '170px',
          background: 'rgba(255,255,255,0.95)',
          borderRadius: '10px',
          boxShadow: '0 4px 15px rgba(0,0,0,0.15)',
          overflow: 'hidden',
        }}>
          {/* Classique */}
          <button
            onClick={() => setMapStyle('classic')}
            title="Vue classique"
            style={{
              flex: 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
              padding: '6px 0',
              fontSize: '12px', fontWeight: '600',
              border: 'none', cursor: 'pointer',
              transition: 'all 0.15s',
              background: mapStyle === 'classic' ? '#FF7900' : 'transparent',
              color: mapStyle === 'classic' ? '#fff' : '#555',
            }}
          >
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/>
            </svg>
            Carte
          </button>

          {/* Satellite */}
          <button
            onClick={() => setMapStyle('satellite')}
            title="Vue satellite"
            style={{
              flex: 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
              padding: '6px 0',
              fontSize: '12px', fontWeight: '600',
              border: 'none', cursor: 'pointer',
              transition: 'all 0.15s',
              background: mapStyle === 'satellite' ? '#FF7900' : 'transparent',
              color: mapStyle === 'satellite' ? '#fff' : '#555',
            }}
          >
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
            </svg>
            Satellite
          </button>
        </div>
      </div>
    </div>
  );
};

export default MapView;
