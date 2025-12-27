import { useState, useMemo } from 'react';
import type { Port, PortList } from '../types/quiz.types';

interface BrowsePortsPanelProps {
  ports: Port[];
  onPortClick?: (port: Port) => void;
  browsedPortMarkers?: Map<string, Port>;
  availableLists?: PortList[];
  onAddPortToList?: (port: Port, listId: string) => void;
}

export default function BrowsePortsPanel({ ports, onPortClick, browsedPortMarkers, availableLists = [], onAddPortToList }: BrowsePortsPanelProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [openDropdownKey, setOpenDropdownKey] = useState<string | null>(null);

  // Filter to only show custom (non-built-in) lists
  const customLists = availableLists.filter(list => !list.isBuiltIn);

  // Helper to determine geographical region from country
  const getGeographicalRegion = (country: string): string => {
    const countryLower = country.toLowerCase();
    if (['china', 'japan', 'south korea', 'india', 'indonesia', 'malaysia', 'singapore', 'thailand', 'vietnam', 'philippines', 'bangladesh', 'pakistan', 'taiwan', 'hong kong', 'sri lanka', 'myanmar', 'cambodia'].some(c => countryLower.includes(c))) {
      return 'Asia';
    }
    if (['united kingdom', 'france', 'germany', 'spain', 'italy', 'netherlands', 'belgium', 'poland', 'greece', 'portugal', 'sweden', 'norway', 'denmark', 'finland', 'ireland', 'romania', 'ukraine', 'turkey', 'russia'].some(c => countryLower.includes(c))) {
      return 'Europe';
    }
    if (['usa', 'united states', 'u.s.a.', 'canada', 'mexico', 'brazil', 'argentina', 'chile', 'colombia', 'peru', 'venezuela', 'ecuador', 'uruguay', 'panama', 'costa rica', 'dominican republic', 'puerto rico', 'jamaica', 'cuba'].some(c => countryLower.includes(c))) {
      return 'Americas';
    }
    if (['south africa', 'egypt', 'nigeria', 'kenya', 'morocco', 'tanzania', 'ghana', 'algeria', 'tunisia', 'ethiopia', 'libya', 'senegal', 'angola', 'mozambique', 'cameroon', 'ivory coast', 'madagascar'].some(c => countryLower.includes(c))) {
      return 'Africa';
    }
    if (['australia', 'new zealand', 'papua new guinea', 'fiji'].some(c => countryLower.includes(c))) {
      return 'Oceania';
    }
    return 'Other';
  };

  // Fuzzy search - matches if search term appears anywhere in city, country, state/region, or geographical region
  const filteredPorts = useMemo(() => {
    if (!searchTerm.trim()) return ports.slice(0, 50); // Show first 50 by default

    const search = searchTerm.toLowerCase();
    return ports
      .filter(port => {
        const geoRegion = getGeographicalRegion(port.country).toLowerCase();
        return (
          port.name.toLowerCase().includes(search) ||
          port.country.toLowerCase().includes(search) ||
          (port.region && port.region.toLowerCase().includes(search)) ||
          geoRegion.includes(search)
        );
      })
      .slice(0, 50); // Limit to 50 results
  }, [ports, searchTerm]);

  return (
    <div className="flex flex-col h-full">
      {/* Search Input */}
      <div className="mb-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Search ports by name, country, or region..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-700/60 border border-slate-600/50 rounded-lg px-4 py-3 pl-10 text-sm
                     text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-400 focus:ring-2
                     focus:ring-blue-400/50 transition-all duration-200 shadow-inner"
          />
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            🔍
          </div>
        </div>
        <div className="mt-2 text-xs text-slate-500">
          Showing {filteredPorts.length} ports {searchTerm && `matching "${searchTerm}"`}
        </div>
      </div>

      {/* Port Cards Grid */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-2 pb-4">
        {filteredPorts.map((port) => {
          const key = `${port.name}-${port.country}`;
          const isMarked = browsedPortMarkers?.has(key);
          return (
            <div
              key={`${port.name}-${port.country}-${port.lat}-${port.lng}`}
              onClick={() => onPortClick?.(port)}
              className={`rounded-xl p-4 transition-all duration-200 cursor-pointer ${
                isMarked
                  ? 'bg-blue-500/20 border-2 border-blue-400 shadow-lg shadow-blue-500/20'
                  : 'bg-slate-800/50 border border-slate-700/50 hover:border-blue-500/50 hover:bg-slate-800/70 hover:shadow-lg hover:shadow-blue-500/10'
              }`}
            >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-100 text-base truncate">
                    {port.name}
                  </h3>
                  {isMarked && (
                    <span className="text-blue-400 text-sm">📍</span>
                  )}
                </div>
                <div className="mt-1 space-y-1">
                  <div className="text-sm text-slate-300">
                    📍 {port.country}
                  </div>
                  {port.region && port.region !== port.country && (
                    <div className="text-xs text-slate-400">
                      {port.region}
                    </div>
                  )}
                  <div className="text-xs text-slate-500 font-mono">
                    {port.lat.toFixed(2)}°, {port.lng.toFixed(2)}°
                  </div>
                </div>
              </div>
              <div className="flex-shrink-0 flex flex-col gap-2">
                <div className={`w-16 h-16 rounded-lg flex items-center justify-center text-2xl ${
                  isMarked ? 'bg-blue-500/30' : 'bg-slate-700/50'
                }`}>
                  {isMarked ? '📍' : '🌊'}
                </div>
                {customLists.length > 0 && onAddPortToList && (
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenDropdownKey(openDropdownKey === key ? null : key);
                      }}
                      className="w-16 h-8 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg flex items-center justify-center text-xl font-bold transition-all duration-200"
                    >
                      +
                    </button>
                    {openDropdownKey === key && (
                      <div className="absolute right-0 top-full mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-10 min-w-[160px]">
                        {customLists.map((list) => (
                          <button
                            key={list.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              onAddPortToList(port, list.id);
                              setOpenDropdownKey(null);
                            }}
                            className="w-full text-left px-3 py-2 text-sm text-slate-200 hover:bg-slate-700 first:rounded-t-lg last:rounded-b-lg transition-colors"
                          >
                            {list.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
          );
        })}

        {filteredPorts.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <div className="text-slate-400 text-lg">No ports found</div>
            <div className="text-slate-500 text-sm mt-2">
              Try a different search term
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
