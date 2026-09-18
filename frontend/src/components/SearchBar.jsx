import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Search, MapPin, SlidersHorizontal, Bell } from 'lucide-react';

const SearchBar = ({ onSearch, onAlerte }) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [radius, setRadius] = useState(35);
  const [types, setTypes] = useState(['liquidation', 'redressement', 'sauvegarde']);
  const [months, setMonths] = useState(0);
  const [companyName, setCompanyName] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  
  const [selectedCity, setSelectedCity] = useState(null);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (query.length < 3) {
        setSuggestions([]);
        return;
      }
      try {
        const res = await axios.get(`https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(query)}&type=municipality&limit=5&autocomplete=1`);
        setSuggestions(res.data.features || []);
      } catch (e) {
        console.error(e);
      }
    };
    
    const timeoutId = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timeoutId);
  }, [query]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [wrapperRef]);

  const handleSelectCity = (city) => {
    setQuery(city.properties.label);
    setSelectedCity({
      label: city.properties.label,
      lon: city.geometry.coordinates[0],
      lat: city.geometry.coordinates[1]
    });
    setShowSuggestions(false);
  };

  const handleSearch = (e) => {
    if (e) e.preventDefault();
    if (selectedCity || companyName) {
      setHasSearched(true);
      onSearch(
        selectedCity ? selectedCity.lat : null,
        selectedCity ? selectedCity.lon : null,
        radius,
        types.length === 3 ? 'tous' : types.join(','),
        months,
        companyName,
        selectedCity ? selectedCity.label : null
      );
    }
  };

  const handleTypeToggle = (t) => {
    if (t === 'tous') {
      setTypes(['liquidation', 'redressement', 'sauvegarde']);
    } else {
      setTypes(prev => {
        if (prev.length === 3) {
          return [t];
        } else if (prev.includes(t)) {
          const next = prev.filter(x => x !== t);
          return next.length === 0 ? ['liquidation', 'redressement', 'sauvegarde'] : next;
        } else {
          return [...prev, t];
        }
      });
    }
  };

  useEffect(() => {
    if ((selectedCity || companyName) && hasSearched) {
      handleSearch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [types, radius, months]);

  return (
    <form onSubmit={handleSearch} className="flex flex-col gap-3 w-full">
      {/* Ligne 1 : Recherches principales & Actions */}
      <div className="flex flex-col lg:flex-row gap-2 w-full">
        {/* Input Ville */}
        <div className="relative flex-1 min-w-[200px]" ref={wrapperRef}>
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MapPin className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-[#FF7900] dark:focus:border-[#FF7900] rounded-lg text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 outline-none transition-all shadow-sm focus:shadow-[0_0_0_3px_rgba(255,121,0,0.1)] dark:focus:shadow-[0_0_0_3px_rgba(255,121,0,0.2)]"
            placeholder="Rechercher une ville..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowSuggestions(true);
              if (selectedCity && e.target.value !== selectedCity.label) {
                setSelectedCity(null);
                setHasSearched(false);
              }
            }}
            onFocus={() => setShowSuggestions(true)}
          />
          {showSuggestions && suggestions.length > 0 && (
            <ul className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl max-h-60 overflow-auto text-slate-800 dark:text-slate-200">
              {suggestions.map((feature) => (
                <li 
                  key={feature.properties.id}
                  className="px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer flex flex-col transition-colors"
                  onClick={() => handleSelectCity(feature)}
                >
                  <span className="font-medium text-sm">{feature.properties.city}</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">{feature.properties.context}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Input Nom/SIREN */}
        <div className="relative flex-1 min-w-[200px]">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-[#FF7900] dark:focus:border-[#FF7900] rounded-lg text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 outline-none transition-all shadow-sm focus:shadow-[0_0_0_3px_rgba(255,121,0,0.1)] dark:focus:shadow-[0_0_0_3px_rgba(255,121,0,0.2)]"
            placeholder="Nom ou SIREN..."
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
          />
        </div>

        {/* Boutons */}
        <div className="flex gap-2 w-full lg:w-auto">
          <button
            type="submit"
            disabled={!selectedCity && !companyName}
            className="flex-1 lg:flex-none flex items-center justify-center gap-1.5 bg-[#FF7900] hover:bg-[#E66D00] text-white px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-[0_0_15px_rgba(255,121,0,0.4)] hover:scale-105"
          >
            <Search className="h-4 w-4" />
            <span className="inline lg:hidden xl:inline">Rechercher</span>
          </button>
          
          <button
            type="button"
            className="flex-1 lg:flex-none flex items-center justify-center gap-1.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm cursor-pointer"
            onClick={() => onAlerte && onAlerte(selectedCity)}
          >
            <Bell className="h-4 w-4" />
            <span className="inline lg:hidden xl:inline">Alerte</span>
          </button>
        </div>
      </div>

      {/* Ligne 2 : Filtres (Segmented Controls) */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-x-4 gap-y-3 w-full">
        {/* Rayon */}
        <div className="flex items-center text-slate-600 dark:text-slate-400">
          <input
            type="number"
            min="1"
            max="150"
            value={radius}
            onChange={(e) => setRadius(parseInt(e.target.value) || 0)}
            className="w-8 bg-transparent border-b border-slate-300 dark:border-slate-600 focus:border-[#FF7900] outline-none text-center text-sm font-semibold text-slate-700 dark:text-slate-300 transition-colors"
          />
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 ml-1 mr-3">km</span>
          <input
            type="range" min="5" max="150" step="5"
            value={radius}
            onChange={(e) => setRadius(parseInt(e.target.value))}
            className="w-full md:w-32 accent-[#FF7900]"
          />
        </div>

        <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 hidden md:block"></div>

        {/* Types - Segmented Control */}
        <div className="flex w-full lg:flex-1 bg-slate-100 dark:bg-slate-800/50 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
          <button type="button" onClick={() => handleTypeToggle('tous')} 
            className={`flex-1 whitespace-nowrap px-1 sm:px-3 py-1 text-[11px] sm:text-xs font-medium rounded-md transition-all ${types.length === 3 ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}>
            Toutes
          </button>
          <button type="button" onClick={() => handleTypeToggle('liquidation')} 
            className={`flex-1 whitespace-nowrap px-1 sm:px-3 py-1 text-[11px] sm:text-xs font-medium rounded-md transition-all ${types.includes('liquidation') && types.length < 3 ? 'bg-white dark:bg-slate-700 text-red-600 dark:text-red-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}>
            Liquidation
          </button>
          <button type="button" onClick={() => handleTypeToggle('redressement')} 
            className={`flex-1 whitespace-nowrap px-1 sm:px-3 py-1 text-[11px] sm:text-xs font-medium rounded-md transition-all ${types.includes('redressement') && types.length < 3 ? 'bg-white dark:bg-slate-700 text-orange-600 dark:text-orange-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}>
            Redressement
          </button>
          <button type="button" onClick={() => handleTypeToggle('sauvegarde')} 
            className={`flex-1 whitespace-nowrap px-1 sm:px-3 py-1 text-[11px] sm:text-xs font-medium rounded-md transition-all ${types.includes('sauvegarde') && types.length < 3 ? 'bg-white dark:bg-slate-700 text-yellow-600 dark:text-yellow-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}>
            Sauvegarde
          </button>
        </div>

        <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 hidden lg:block"></div>

        {/* Dates - Segmented Control */}
        <div className="flex w-full lg:flex-1 bg-slate-100 dark:bg-slate-800/50 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
          {[
            { v: 0, l: 'Toujours' },
            { v: 1, l: '1 Mois' },
            { v: 3, l: '3 Mois' },
            { v: 6, l: '6 Mois' },
            { v: 12, l: '1 An' }
          ].map(opt => (
            <button
              key={opt.v} type="button"
              onClick={() => setMonths(opt.v)}
              className={`flex-1 whitespace-nowrap px-1 sm:px-3 py-1 text-[11px] sm:text-xs font-medium rounded-md transition-all ${months === opt.v ? 'bg-white dark:bg-slate-700 text-[#FF7900] shadow-sm font-semibold' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
            >
              {opt.l}
            </button>
          ))}
        </div>
      </div>
    </form>
  );
};

export default SearchBar;
