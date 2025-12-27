import { useState, useEffect } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
} from "react-simple-maps";
import { feature } from "topojson-client";
import type { Port, QuizResult, PortList } from "../types/quiz.types";
import PortMarker from "./PortMarker";
import AnswerPanel from "./AnswerPanel";
import QuizHeader from "./QuizHeader";
import portsData from "../data/ports.json";
import { getAllLists, filterPortsByList } from "../utils/portLists";
import { saveQuizHistory } from "../utils/quizHistory";

// World Atlas TopoJSON URLs by resolution
const mapResolutions = {
  low: "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json",
  medium: "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json",
  high: "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-10m.json",
} as const;

// Generate labels dynamically based on count (1, 2, 3, ...)
const getLabels = (count: number) => {
  return Array.from({ length: count }, (_, i) => (i + 1).toString());
};

// Helper to create unique display name
const getDisplayName = (port: Port) => `${port.name}, ${port.country}`;

export default function MapQuiz() {
  const [ports, setPorts] = useState<Port[]>([]);
  const [markers, setMarkers] = useState<Map<string, Port>>(new Map());
  const [answers, setAnswers] = useState<Map<string, string>>(new Map());
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [results, setResults] = useState<QuizResult[]>([]);
  const [score, setScore] = useState(0);
  const [geoData, setGeoData] = useState<any>(null);
  const [selectedRegions, setSelectedRegions] = useState<string[]>(["world"]);
  const [portCount, setPortCount] = useState(10);
  const [zoom, setZoom] = useState(1);
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizStartTime, setQuizStartTime] = useState<number>(0);
  const [quizEndTime, setQuizEndTime] = useState<number>(0);
  const [browsedPortMarkers, setBrowsedPortMarkers] = useState<Map<string, Port>>(new Map());
  const [mapCenter, setMapCenter] = useState<[number, number]>([0, 20]);
  const [selectedList, setSelectedList] = useState<string | null>(null);
  const [availableLists, setAvailableLists] = useState<PortList[]>([]);
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [availableCountries, setAvailableCountries] = useState<string[]>([]);
  const [rightPanelWidth, setRightPanelWidth] = useState(384); // 384px = 96 * 4 (w-96)
  const [isResizing, setIsResizing] = useState(false);
  const [filteredPortsCount, setFilteredPortsCount] = useState(0);
  const [difficulty, setDifficulty] = useState<'easy' | 'normal' | 'hard'>('easy');
  const [decoyPorts, setDecoyPorts] = useState<Port[]>([]);
  const [mapResolution] = useState<'medium'>('medium');
  const [mapLoading, setMapLoading] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null);

  // Load world map data
  useEffect(() => {
    const geoUrl = mapResolutions[mapResolution];
    setMapLoading(true);

    fetch(geoUrl)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to load map: ${response.status} ${response.statusText}`);
        }
        return response.json();
      })
      .then((topology) => {
        const countries = feature(topology, topology.objects.countries);
        setGeoData(countries);
        setMapLoading(false);
      })
      .catch((error) => {
        console.error('Error loading map:', error);
        setMapLoading(false);
        alert('Failed to load map data. Please refresh the page.');
      });
  }, [mapResolution]);

  // Load available port lists
  useEffect(() => {
    setAvailableLists(getAllLists());
  }, []);

  // Initialize quiz
  useEffect(() => {
    initializeQuiz();
  }, []);

  // Re-initialize quiz when regions, port count, list, countries, or difficulty change
  useEffect(() => {
    if (selectedRegions.length > 0) {
      initializeQuiz();
    }
  }, [selectedRegions, portCount, selectedList, selectedCountries, difficulty]);

  // Handle resize
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const newWidth = window.innerWidth - e.clientX;
      setRightPanelWidth(Math.max(280, Math.min(newWidth, window.innerWidth * 0.5)));
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    } else {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing]);

  const initializeQuiz = () => {
    // Normalize country names to fix inconsistencies
    const normalizeCountryName = (country: string): string => {
      const normalized = country.trim();
      // Consolidate USA variations to match Top 150 Ports list
      if (normalized === 'United States' || normalized === 'U.S.A.') {
        return 'USA';
      }
      return normalized;
    };

    // Transform ports and ensure uniqueness by name+country+coordinates
    const portMap = new Map<string, Port>();
    (portsData as any[]).forEach((port: any, index: number) => {
      const normalizedCountry = normalizeCountryName(port.COUNTRY);
      // Use coordinates in the key to avoid removing different ports with the same name
      const uniqueKey = `${port.CITY.toLowerCase()}-${normalizedCountry.toLowerCase()}-${port.LATITUDE}-${port.LONGITUDE}`;
      if (!portMap.has(uniqueKey)) {
        portMap.set(uniqueKey, {
          id: index + 1,
          name: port.CITY,
          country: normalizedCountry,
          region: port.STATE || normalizedCountry,
          lat: port.LATITUDE,
          lng: port.LONGITUDE,
        });
      }
    });
    const transformedPorts: Port[] = Array.from(portMap.values());

    // Filter by port list first
    let filteredPorts = transformedPorts;
    if (selectedList) {
      const list = availableLists.find(l => l.id === selectedList);
      if (list) {
        filteredPorts = filterPortsByList(transformedPorts, list);
      }
    }

    // Then filter by regions
    if (!selectedRegions.includes('world')) {
      filteredPorts = filteredPorts.filter(port => {
        const country = port.country.toLowerCase();
        return selectedRegions.some(region => {
          switch (region) {
            case 'asia':
              return ['china', 'japan', 'south korea', 'india', 'indonesia', 'malaysia', 'singapore', 'thailand', 'vietnam', 'philippines', 'bangladesh', 'pakistan', 'taiwan', 'hong kong', 'sri lanka', 'myanmar', 'cambodia'].some(c => country.includes(c));
            case 'europe':
              return ['united kingdom', 'france', 'germany', 'spain', 'italy', 'netherlands', 'belgium', 'poland', 'greece', 'portugal', 'sweden', 'norway', 'denmark', 'finland', 'ireland', 'romania', 'ukraine', 'turkey', 'russia'].some(c => country.includes(c));
            case 'americas':
              return ['usa', 'united states', 'u.s.a.', 'canada', 'mexico', 'brazil', 'argentina', 'chile', 'colombia', 'peru', 'venezuela', 'ecuador', 'uruguay', 'panama', 'costa rica', 'dominican republic', 'puerto rico', 'jamaica', 'cuba'].some(c => country.includes(c));
            case 'africa':
              return ['south africa', 'egypt', 'nigeria', 'kenya', 'morocco', 'tanzania', 'ghana', 'algeria', 'tunisia', 'ethiopia', 'libya', 'senegal', 'angola', 'mozambique', 'cameroon', 'ivory coast', 'madagascar'].some(c => country.includes(c));
            case 'oceania':
              return ['australia', 'new zealand', 'papua new guinea', 'fiji'].some(c => country.includes(c));
            default:
              return false;
          }
        });
      });
    }

    // Extract available countries from current filtered ports (before country filter)
    const availableCountriesSet = Array.from(
      new Set(filteredPorts.map(port => port.country))
    ).sort();
    setAvailableCountries(availableCountriesSet);

    // Clear selected countries that are no longer available in the current region
    // Only update if the filtered list is actually different to avoid infinite loops
    const filteredSelectedCountries = selectedCountries.filter(country => availableCountriesSet.includes(country));
    if (filteredSelectedCountries.length !== selectedCountries.length) {
      setSelectedCountries(filteredSelectedCountries);
    }

    // Then filter by selected countries (if any)
    if (selectedCountries.length > 0) {
      filteredPorts = filteredPorts.filter(port =>
        selectedCountries.includes(port.country)
      );
    }

    // Store the count of available ports BEFORE limiting to portCount
    setFilteredPortsCount(filteredPorts.length);

    const shuffled = filteredPorts.sort(() => Math.random() - 0.5);
    // Limit to portCount, or use all available if less
    const maxPorts = Math.min(portCount, filteredPorts.length);
    const selectedPorts = shuffled.slice(0, maxPorts);
    setPorts(selectedPorts);

    // Generate decoy ports for normal and hard difficulties
    if (difficulty === 'normal' || difficulty === 'hard') {
      const selectedCountriesSet = new Set(selectedPorts.map(p => p.country));
      const allPortsList = Array.from(portMap.values());

      // Find ports from the same countries that aren't already selected
      const potentialDecoys = allPortsList.filter(port =>
        selectedCountriesSet.has(port.country) &&
        !selectedPorts.some(sp => sp.name === port.name && sp.country === port.country)
      );

      // Add 2-5 decoy ports per selected port (more decoys for hard mode)
      const decoysPerPort = difficulty === 'hard' ? 5 : 2;
      const numDecoys = Math.min(selectedPorts.length * decoysPerPort, potentialDecoys.length);
      const shuffledDecoys = potentialDecoys.sort(() => Math.random() - 0.5);
      const selectedDecoys = shuffledDecoys.slice(0, numDecoys);

      setDecoyPorts(selectedDecoys);
    } else {
      setDecoyPorts([]);
    }

    // Create markers map with numeric labels
    const labels = getLabels(selectedPorts.length);
    const newMarkers = new Map<string, Port>();
    selectedPorts.forEach((port, index) => {
      newMarkers.set(labels[index], port);
    });
    setMarkers(newMarkers);

    // Reset state
    setAnswers(new Map());
    setIsSubmitted(false);
    setQuizStarted(false);
    setResults([]);
    setScore(0);
    setQuizStartTime(0);
    setQuizEndTime(0);
  };

  const handleBeginQuiz = () => {
    // Reshuffle ports to get a fresh set each time
    initializeQuiz();
    setQuizStarted(true);
    setQuizStartTime(Date.now());
    setBrowsedPortMarkers(new Map()); // Clear browsed markers when quiz starts
  };

  const handlePortClick = (port: Port) => {
    const key = `${port.name}-${port.country}`;
    const newMarkers = new Map(browsedPortMarkers);
    if (newMarkers.has(key)) {
      newMarkers.delete(key);
    } else {
      newMarkers.set(key, port);
    }
    setBrowsedPortMarkers(newMarkers);
  };

  const handleCenterOnPort = (port: Port) => {
    setMapCenter([port.lng, port.lat]);
    // Keep current zoom level when centering on a port
  };

  const handleMarkerClick = (letter: string) => {
    setSelectedQuestion(letter);
  };

  const handleAnswerChange = (letter: string, portName: string) => {
    const newAnswers = new Map(answers);
    newAnswers.set(letter, portName);
    setAnswers(newAnswers);
  };

  const handleSubmit = () => {
    // Calculate results
    const quizResults: QuizResult[] = [];
    let correctCount = 0;
    const labels = Array.from(markers.keys());

    labels.forEach((label) => {
      const correctPort = markers.get(label);
      const selectedPortDisplay = answers.get(label) || "";

      if (correctPort) {
        // Check answer based on difficulty
        let isCorrect = false;
        if (difficulty === 'easy') {
          // Easy mode: match full "Port Name, Country"
          const correctPortDisplay = getDisplayName(correctPort);
          isCorrect = selectedPortDisplay === correctPortDisplay;
        } else {
          // Normal/Hard mode: match just port name
          isCorrect = selectedPortDisplay === correctPort.name;
        }

        if (isCorrect) correctCount++;

        // Always show full name in results for clarity
        const correctPortDisplay = getDisplayName(correctPort);

        quizResults.push({
          letter: label,
          selectedPort: selectedPortDisplay,
          correctPort: correctPortDisplay,
          isCorrect,
        });
      }
    });

    setResults(quizResults);
    setScore(correctCount);
    setIsSubmitted(true);
    setQuizStarted(false);
    const endTime = Date.now();
    setQuizEndTime(endTime);

    // Save quiz history (fire-and-forget, don't block UI)
    saveQuizHistory({
      id: `quiz-${endTime}`,
      date: endTime,
      score: correctCount,
      total: labels.length,
      accuracy: (correctCount / labels.length) * 100,
      duration: Math.floor((endTime - quizStartTime) / 1000),
      difficulty,
      regions: selectedRegions,
      countries: selectedCountries.length > 0 ? selectedCountries : [],
      results: quizResults.map(r => ({
        port: r.correctPort,
        isCorrect: r.isCorrect,
      })),
    }).catch(error => {
      console.error('Failed to save quiz history:', error);
    });
  };

  const handleTryAgain = () => {
    // Keep the same ports but shuffle the marker labels to make it harder
    const currentPorts = Array.from(markers.values());
    const shuffledPorts = currentPorts.sort(() => Math.random() - 0.5);
    const labels = getLabels(shuffledPorts.length);
    const newMarkers = new Map<string, Port>();
    shuffledPorts.forEach((port, index) => {
      newMarkers.set(labels[index], port);
    });
    setMarkers(newMarkers);

    // Reset quiz state
    setAnswers(new Map());
    setIsSubmitted(false);
    setQuizStarted(true);
    setResults([]);
    setScore(0);
    setQuizStartTime(Date.now());
    setQuizEndTime(0);
  };

  const handleDone = () => {
    // Go back to settings
    setIsSubmitted(false);
    setQuizStarted(false);
  };

  // Use display names for dropdowns based on difficulty
  const allAnswerPorts = [...ports, ...decoyPorts];
  const portNames = difficulty === 'easy'
    ? allAnswerPorts.map((p) => getDisplayName(p)).sort()
    : allAnswerPorts.map((p) => p.name).sort();
  const labels = Array.from(markers.keys());

  return (
    <div className="h-screen flex flex-col bg-slate-900 text-slate-100">
      {/* Header */}
      <QuizHeader
        markerCount={markers.size}
        onNewQuiz={initializeQuiz}
        quizStarted={quizStarted}
        quizStartTime={quizStartTime}
      />

      {/* Main Content - Two Panes */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Left Pane - Map */}
        <div className="flex-1 bg-slate-800/40 relative min-w-0 flex flex-col">
          {/* Map Title Bar */}
          <div className="h-12 bg-slate-800/60 border-b border-slate-700/50 px-6 flex items-center justify-between shadow-sm">
            <h2 className="text-sm font-bold text-slate-100">World Map</h2>
            <div className="text-xs text-slate-400">
              {quizStarted
                ? `${markers.size} ${markers.size === 1 ? 'marker' : 'markers'}`
                : `${browsedPortMarkers.size} ${browsedPortMarkers.size === 1 ? 'port' : 'ports'} selected`
              }
            </div>
          </div>

          {/* Map Content */}
          <div className="flex-1 relative">
            {/* Loading Indicator */}
            {mapLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 z-50">
                <div className="text-center">
                  <div className="text-4xl mb-4 animate-pulse">🗺️</div>
                  <div className="text-slate-300 font-bold">Loading map...</div>
                </div>
              </div>
            )}

            <div className="w-full h-full flex items-center justify-center">
              <ComposableMap
                projection="geoMercator"
                width={1000}
                height={600}
                className="w-full h-full"
                style={{ maxWidth: "100%", height: "auto" }}
              >
                <ZoomableGroup
                  center={mapCenter}
                  zoom={zoom}
                  minZoom={1}
                  maxZoom={8}
                  onMoveEnd={(position) => {
                    setZoom(position.zoom);
                    setMapCenter(position.coordinates);
                  }}
                >
                  {geoData && (
                    <Geographies geography={geoData}>
                      {({ geographies }: { geographies: any[] }) =>
                        geographies.map((geo: any) => (
                          <Geography
                            key={geo.rsmKey}
                            geography={geo}
                            fill="#334155"
                            stroke="#475569"
                            strokeWidth={0.5}
                          />
                        ))
                      }
                    </Geographies>
                  )}

                  {/* Quiz markers - color-coded when submitted */}
                  {/* Render non-selected markers first */}
                  {quizStarted && Array.from(markers.entries())
                    .filter(([letter]) => letter !== selectedQuestion)
                    .map(([letter, port]) => {
                      // Find result for this marker to determine color
                      let markerColor: 'blue' | 'green' | 'red' = 'blue';
                      if (isSubmitted) {
                        const result = results.find(r => r.letter === letter);
                        markerColor = result?.isCorrect ? 'green' : 'red';
                      }
                      return (
                        <PortMarker
                          key={letter}
                          port={port}
                          letter={letter}
                          zoom={zoom}
                          color={markerColor}
                          onClick={() => handleMarkerClick(letter)}
                          isSelected={false}
                        />
                      );
                    })}
                  {/* Render selected marker last (appears on top) */}
                  {quizStarted && selectedQuestion && markers.has(selectedQuestion) && (() => {
                    const port = markers.get(selectedQuestion)!;
                    let markerColor: 'blue' | 'green' | 'red' = 'blue';
                    if (isSubmitted) {
                      const result = results.find(r => r.letter === selectedQuestion);
                      markerColor = result?.isCorrect ? 'green' : 'red';
                    }
                    return (
                      <PortMarker
                        key={`selected-${selectedQuestion}`}
                        port={port}
                        letter={selectedQuestion}
                        zoom={zoom}
                        color={markerColor}
                        onClick={() => handleMarkerClick(selectedQuestion)}
                        isSelected={true}
                      />
                    );
                  })()}

                  {/* Results markers (when submitted but not in quiz mode) */}
                  {/* Render non-selected markers first */}
                  {isSubmitted && !quizStarted && Array.from(markers.entries())
                    .filter(([letter]) => letter !== selectedQuestion)
                    .map(([letter, port]) => {
                      const result = results.find(r => r.letter === letter);
                      const markerColor: 'blue' | 'green' | 'red' = result?.isCorrect ? 'green' : 'red';
                      return (
                        <PortMarker
                          key={letter}
                          port={port}
                          letter={letter}
                          zoom={zoom}
                          color={markerColor}
                          onClick={() => handleMarkerClick(letter)}
                          isSelected={false}
                        />
                      );
                    })}
                  {/* Render selected marker last (appears on top) */}
                  {isSubmitted && !quizStarted && selectedQuestion && markers.has(selectedQuestion) && (() => {
                    const port = markers.get(selectedQuestion)!;
                    const result = results.find(r => r.letter === selectedQuestion);
                    const markerColor: 'blue' | 'green' | 'red' = result?.isCorrect ? 'green' : 'red';
                    return (
                      <PortMarker
                        key={`selected-${selectedQuestion}`}
                        port={port}
                        letter={selectedQuestion}
                        zoom={zoom}
                        color={markerColor}
                        onClick={() => handleMarkerClick(selectedQuestion)}
                        isSelected={true}
                      />
                    );
                  })()}

                  {/* Browsed port markers (when not in quiz and not submitted) */}
                  {!quizStarted && !isSubmitted && Array.from(browsedPortMarkers.entries()).map(([key, port]) => (
                    <PortMarker key={key} port={port} letter="📍" zoom={zoom} />
                  ))}
                </ZoomableGroup>
              </ComposableMap>
            </div>

            {/* Map Controls Hint */}
            <div className="absolute bottom-4 left-4 bg-slate-800/95 border border-slate-600/50 px-4 py-2.5 rounded-lg text-xs text-slate-400 shadow-lg backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <span>🖱️ Scroll to zoom</span>
                <span>•</span>
                <span>Drag to pan</span>
              </div>
            </div>
          </div>
        </div>

        {/* Resize Handle */}
        <div
          className="w-1 bg-slate-700/50 hover:bg-blue-500/50 transition-colors cursor-col-resize flex-shrink-0"
          onMouseDown={() => setIsResizing(true)}
        />

        {/* Right Pane - Answer Panel */}
        <div
          className="bg-slate-800/60 flex flex-col border-l border-slate-700/50 shadow-2xl"
          style={{ width: `${rightPanelWidth}px` }}
        >
          {/* Panel Header */}
          <div className="h-12 bg-slate-800/60 border-b border-slate-700/50 px-6 flex items-center justify-between shadow-sm">
            <h2 className="text-sm font-bold text-slate-100">
              {quizStarted ? 'Answer Selection' : 'Port Quiz'}
            </h2>
            {quizStarted && (
              <div className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                answers.size === labels.length ? 'bg-green-500/20 text-green-400' : 'bg-slate-700/50 text-slate-400'
              }`}>
                {answers.size}/{labels.length} Answered
              </div>
            )}
          </div>

          {/* Panel Content */}
          <div className="flex-1 overflow-hidden p-6">
            <AnswerPanel
              letters={labels}
              portNames={portNames}
              answers={answers}
              onAnswerChange={handleAnswerChange}
              onSubmit={handleSubmit}
              isSubmitted={isSubmitted}
              quizStarted={quizStarted}
              onBeginQuiz={handleBeginQuiz}
              portCount={portCount}
              onPortCountChange={setPortCount}
              difficulty={difficulty}
              onDifficultyChange={setDifficulty}
              selectedRegions={selectedRegions}
              onRegionToggle={(region) => {
                if (region === 'world') {
                  setSelectedRegions(['world']);
                } else {
                  const newRegions = selectedRegions.filter(r => r !== 'world');
                  if (newRegions.includes(region)) {
                    const filtered = newRegions.filter(r => r !== region);
                    setSelectedRegions(filtered.length === 0 ? ['world'] : filtered);
                  } else {
                    setSelectedRegions([...newRegions, region]);
                  }
                }
              }}
              onPortClick={handlePortClick}
              browsedPortMarkers={browsedPortMarkers}
              results={results}
              score={score}
              quizDuration={isSubmitted ? Math.floor((quizEndTime - quizStartTime) / 1000) : 0}
              onTryAgain={handleTryAgain}
              onDone={handleDone}
              onCenterOnPort={handleCenterOnPort}
              markers={markers}
              selectedList={selectedList}
              onListChange={setSelectedList}
              availableLists={availableLists}
              filteredPortsCount={filteredPortsCount}
              selectedCountries={selectedCountries}
              onCountryToggle={(country) => {
                const newCountries = selectedCountries.includes(country)
                  ? selectedCountries.filter(c => c !== country)
                  : [...selectedCountries, country];
                setSelectedCountries(newCountries);
              }}
              availableCountries={availableCountries}
              selectedQuestion={selectedQuestion}
              onQuestionSelect={handleMarkerClick}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
