import { useState, useMemo, useEffect } from 'react';
import BrowsePortsPanel from './BrowsePortsPanel';
import ListsPanel from './ListsPanel';
import type { Port, QuizResult, PortList } from '../types/quiz.types';
import portsData from '../data/ports.json';
import { deleteCustomList } from '../utils/portLists';

interface AnswerPanelProps {
  letters: string[];
  portNames: string[];
  answers: Map<string, string>;
  onAnswerChange: (letter: string, portName: string) => void;
  onSubmit: () => void;
  isSubmitted: boolean;
  quizStarted: boolean;
  onBeginQuiz: () => void;
  portCount: number;
  onPortCountChange: (count: number) => void;
  difficulty: 'easy' | 'normal' | 'hard';
  onDifficultyChange: (difficulty: 'easy' | 'normal' | 'hard') => void;
  selectedRegions: string[];
  onRegionToggle: (region: string) => void;
  onPortClick: (port: Port) => void;
  browsedPortMarkers: Map<string, Port>;
  results: QuizResult[];
  score: number;
  quizDuration: number;
  onTryAgain: () => void;
  onDone: () => void;
  onCenterOnPort: (port: Port) => void;
  markers: Map<string, Port>;
  selectedList: string | null;
  onListChange: (listId: string | null) => void;
  availableLists: PortList[];
  filteredPortsCount: number;
  selectedCountries: string[];
  onCountryToggle: (country: string) => void;
  availableCountries: string[];
}

export default function AnswerPanel({
  letters,
  portNames,
  answers,
  onAnswerChange,
  onSubmit,
  isSubmitted,
  quizStarted,
  onBeginQuiz,
  portCount,
  onPortCountChange,
  difficulty,
  onDifficultyChange,
  selectedRegions,
  onRegionToggle,
  onPortClick,
  browsedPortMarkers,
  results,
  score,
  quizDuration,
  onTryAgain,
  onDone,
  onCenterOnPort,
  markers,
  selectedList,
  onListChange,
  availableLists,
  filteredPortsCount,
  selectedCountries,
  onCountryToggle,
  availableCountries,
}: AnswerPanelProps) {
  const [activeTab, setActiveTab] = useState<'answers' | 'browse' | 'results' | 'settings' | 'lists'>('settings');
  const [listsRefreshKey, setListsRefreshKey] = useState(0);

  // Automatically switch to correct tab when quiz state changes
  useEffect(() => {
    if (isSubmitted) {
      setActiveTab('results');
    } else if (quizStarted) {
      setActiveTab('answers');
    } else {
      // When both are false (after Done is clicked), go back to settings
      setActiveTab('settings');
    }
  }, [quizStarted, isSubmitted]);

  // Transform all ports for encyclopedia
  const allPorts = useMemo(() => {
    const portMap = new Map<string, Port>();
    (portsData as any[]).forEach((port: any, index: number) => {
      const uniqueKey = `${port.CITY.toLowerCase()}-${port.COUNTRY.toLowerCase()}`;
      if (!portMap.has(uniqueKey)) {
        portMap.set(uniqueKey, {
          id: index + 1,
          name: port.CITY,
          country: port.COUNTRY,
          region: port.STATE || port.COUNTRY,
          lat: port.LATITUDE,
          lng: port.LONGITUDE,
        });
      }
    });
    return Array.from(portMap.values());
  }, []);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header Tabs */}
      <div className="flex border-b border-slate-700 mb-4">
        {/* Quiz Settings Tab - Always visible when not in quiz */}
        {!quizStarted && !isSubmitted && (
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2.5 text-sm font-bold transition-colors duration-200 ${
              activeTab === 'settings'
                ? 'text-white border-b-2 border-blue-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Quiz Settings
          </button>
        )}

        {/* Browse Ports Tab - Always visible when not in quiz */}
        {!quizStarted && !isSubmitted && (
          <button
            onClick={() => setActiveTab('browse')}
            className={`px-4 py-2.5 text-sm font-bold transition-colors duration-200 ${
              activeTab === 'browse'
                ? 'text-white border-b-2 border-blue-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Browse Ports
          </button>
        )}

        {/* Lists Tab - Always visible when not in quiz */}
        {!quizStarted && !isSubmitted && (
          <button
            onClick={() => setActiveTab('lists')}
            className={`px-4 py-2.5 text-sm font-bold transition-colors duration-200 ${
              activeTab === 'lists'
                ? 'text-white border-b-2 border-blue-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Lists
          </button>
        )}

        {/* Answers Tab - Only during quiz */}
        {quizStarted && !isSubmitted && (
          <button
            onClick={() => setActiveTab('answers')}
            className={`px-4 py-2.5 text-sm font-bold transition-colors duration-200 ${
              activeTab === 'answers'
                ? 'text-white border-b-2 border-blue-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Answers
          </button>
        )}

        {/* Results Tab - Only after submission */}
        {isSubmitted && (
          <button
            onClick={() => setActiveTab('results')}
            className={`px-4 py-2.5 text-sm font-bold transition-colors duration-200 ${
              activeTab === 'results'
                ? 'text-white border-b-2 border-blue-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Results
          </button>
        )}
      </div>

      {/* Tab Content */}
      {activeTab === 'answers' && (
        <>
          {/* Answer Grid */}
          <div className="flex-1 overflow-y-auto space-y-4 pr-2 pb-4">
            {letters.map((letter) => {
              const hasAnswer = answers.has(letter) && answers.get(letter) !== "";
              const port = markers.get(letter);
              return (
                <div
                  key={letter}
                  onClick={() => port && onCenterOnPort(port)}
                  className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 hover:border-blue-500/50 hover:bg-slate-800/70 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-200 cursor-pointer"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`
                      w-10 h-10 flex items-center justify-center rounded-lg border-2 font-bold text-sm shadow-md
                      ${hasAnswer
                        ? "bg-blue-500/30 border-blue-400 text-blue-300 shadow-blue-500/20"
                        : "bg-slate-700/60 border-slate-600/50 text-slate-400 shadow-slate-900/50"}
                    `}>
                      {letter}
                    </div>
                    <div className="flex-1">
                      <div className="text-xs text-slate-500 font-medium mb-1.5 uppercase tracking-wide">Port Location</div>
                      <select
                        value={answers.get(letter) || ""}
                        onChange={(e) => onAnswerChange(letter, e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        disabled={isSubmitted}
                        className="w-full bg-slate-700/60 border border-slate-600/50 rounded-lg px-3 py-2.5 text-sm
                                 text-slate-100 font-medium focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/50
                                 disabled:opacity-50 disabled:cursor-not-allowed
                                 hover:border-slate-500 transition-all duration-200 shadow-inner"
                      >
                        <option value="" className="bg-slate-800">
                          Select a port...
                        </option>
                        {portNames.map((name) => (
                          <option key={name} value={name} className="bg-slate-800">
                            {name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Submit Button */}
          <div className="mt-6 pt-6 border-t border-slate-700/50">
            <button
              onClick={onSubmit}
              disabled={isSubmitted || answers.size < letters.length}
              className={`
                w-full py-4 px-4 rounded-xl font-bold text-base
                transition-all duration-200
                ${
                  answers.size === letters.length && !isSubmitted
                    ? "bg-blue-500 hover:bg-blue-600 text-white shadow-xl shadow-blue-500/40 hover:shadow-2xl hover:shadow-blue-500/50 hover:scale-[1.02]"
                    : "bg-slate-700/50 text-slate-500 cursor-not-allowed opacity-60"
                }
              `}
            >
              {isSubmitted ? "Submitted" : answers.size === letters.length ? "Submit Answers" : `Complete ${answers.size}/${letters.length} to Submit`}
            </button>
          </div>
        </>
      )}

      {activeTab === 'browse' && (
        <BrowsePortsPanel
          ports={allPorts}
          onPortClick={onPortClick}
          browsedPortMarkers={browsedPortMarkers}
          availableLists={availableLists}
          onAddPortToList={(port, listId) => {
            const savedLists = localStorage.getItem('customPortLists');
            if (savedLists) {
              let lists = JSON.parse(savedLists) as PortList[];
              const listIndex = lists.findIndex(l => l.id === listId);
              if (listIndex >= 0) {
                const portKey = `${port.name}-${port.country}`;
                if (!lists[listIndex].portKeys.includes(portKey)) {
                  lists[listIndex].portKeys.push(portKey);
                  localStorage.setItem('customPortLists', JSON.stringify(lists));
                  window.location.reload();
                }
              }
            }
          }}
        />
      )}

      {activeTab === 'results' && (
        <>
          {/* Score Display */}
          <div className="bg-slate-800/70 border border-slate-700/50 rounded-xl p-6 mb-4 shadow-lg">
            <div className="text-center space-y-3">
              <div className="text-xs text-slate-400 uppercase tracking-wider">
                Final Score
              </div>
              <div className={`text-5xl font-black tracking-tight ${score / letters.length >= 0.7 ? "text-green-400" : "text-red-400"}`}>
                {score}/{letters.length}
              </div>
              <div className="text-sm text-slate-300">
                {((score / letters.length) * 100).toFixed(0)}% Accuracy • {formatDuration(quizDuration)}
              </div>
            </div>
          </div>

          {/* Results List */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-2 pb-4">
            {results.map((result) => {
              const port = markers.get(result.letter);
              return (
                <div
                  key={result.letter}
                  onClick={() => port && onCenterOnPort(port)}
                  className={`rounded-xl p-4 border-2 shadow-md transition-all duration-200 cursor-pointer hover:scale-[1.01] ${
                    result.isCorrect
                      ? "bg-green-500/20 border-green-500/40 hover:shadow-lg hover:shadow-green-500/20"
                      : "bg-red-500/20 border-red-500/40 hover:shadow-lg hover:shadow-red-500/20"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`
                      w-10 h-10 flex items-center justify-center rounded-lg border-2 font-black shadow-lg
                      ${result.isCorrect
                        ? "bg-green-500/20 border-green-500/50 text-green-400"
                        : "bg-red-500/20 border-red-500/50 text-red-400"}
                    `}>
                      {result.letter}
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className={`font-medium ${result.isCorrect ? "text-green-400" : "text-red-400"}`}>
                        {result.isCorrect ? "✓" : "✗"} {result.selectedPort || "No answer"}
                      </div>
                      {!result.isCorrect && (
                        <div className="text-sm text-slate-400">
                          Correct: {result.correctPort}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action Buttons */}
          <div className="mt-6 pt-6 border-t border-slate-700/50">
            <div className="flex gap-3">
              <button
                onClick={onDone}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-4 px-4 rounded-xl text-base transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Done
              </button>
              <button
                onClick={onTryAgain}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 px-4 rounded-xl text-base transition-all duration-200 shadow-xl shadow-blue-500/40 hover:shadow-2xl hover:shadow-blue-500/50 hover:scale-[1.02]"
              >
                Try Again
              </button>
            </div>
          </div>
        </>
      )}

      {activeTab === 'settings' && (
        <div className="flex flex-col h-full space-y-6">
          {/* Port List Selector */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-300 uppercase tracking-wide">Port List</label>
            <select
              value={selectedList || 'none'}
              onChange={(e) => onListChange(e.target.value === 'none' ? null : e.target.value)}
              className="w-full bg-slate-700/60 border border-slate-600/50 rounded-lg px-4 py-3 text-sm font-medium focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/50 hover:border-slate-500 transition-all duration-200 shadow-md"
            >
              <option value="none" className="bg-slate-800">All Ports</option>
              {availableLists.map((list) => (
                <option key={list.id} value={list.id} className="bg-slate-800">
                  {list.name}
                </option>
              ))}
            </select>
          </div>

          {/* Region Selection */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-300 uppercase tracking-wide">Regions</label>
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'world', label: 'World', icon: '🌍' },
                { id: 'asia', label: 'Asia', icon: '🌏' },
                { id: 'europe', label: 'Europe', icon: '🇪🇺' },
                { id: 'americas', label: 'Americas', icon: '🌎' },
                { id: 'africa', label: 'Africa', icon: '🌍' },
                { id: 'oceania', label: 'Oceania', icon: '🏝️' },
              ].map(region => {
                const isSelected = selectedRegions.includes(region.id);
                return (
                  <button
                    key={region.id}
                    onClick={() => onRegionToggle(region.id)}
                    className={`px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${
                      isSelected
                        ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30 scale-105'
                        : 'bg-slate-700/70 text-slate-300 hover:bg-slate-600/70 hover:shadow-md hover:text-white'
                    }`}
                  >
                    <span>{region.icon}</span>
                    <span>{region.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Country Selection */}
          {availableCountries.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-300 uppercase tracking-wide">
                Countries ({availableCountries.length} available)
              </label>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 bg-slate-900/30 rounded-lg">
                {availableCountries.map(country => {
                  const isSelected = selectedCountries.includes(country);
                  return (
                    <button
                      key={country}
                      onClick={() => onCountryToggle(country)}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
                        isSelected
                          ? 'bg-cyan-500 text-white shadow-md'
                          : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50 hover:text-white'
                      }`}
                    >
                      {country}
                    </button>
                  );
                })}
              </div>
              {selectedCountries.length > 0 && (
                <button
                  onClick={() => {
                    selectedCountries.forEach(c => onCountryToggle(c));
                  }}
                  className="text-xs text-slate-400 hover:text-slate-200 underline"
                >
                  Clear all countries
                </button>
              )}
            </div>
          )}

          {/* Difficulty Selection */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-300 uppercase tracking-wide">Difficulty</label>
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'easy', label: 'Easy', icon: '👶', desc: 'Shows port name + country' },
                { id: 'normal', label: 'Normal', icon: '👍', desc: 'Port name only + decoys' },
                { id: 'hard', label: 'Hard', icon: '🥵', desc: 'Port name only + many decoys' },
              ].map(diff => {
                const isSelected = difficulty === diff.id;
                return (
                  <button
                    key={diff.id}
                    onClick={() => onDifficultyChange(diff.id as 'easy' | 'normal' | 'hard')}
                    className={`flex-1 min-w-[100px] px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-200 flex flex-col items-center gap-1 ${
                      isSelected
                        ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30 scale-105'
                        : 'bg-slate-700/70 text-slate-300 hover:bg-slate-600/70 hover:shadow-md hover:text-white'
                    }`}
                    title={diff.desc}
                  >
                    <span className="text-xl">{diff.icon}</span>
                    <span>{diff.label}</span>
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-slate-400">
              {difficulty === 'easy' && '📝 Shows "Port Name, Country" in dropdowns'}
              {difficulty === 'normal' && '📝 Shows "Port Name" only + 2 decoy ports per question'}
              {difficulty === 'hard' && '📝 Shows "Port Name" only + 5 decoy ports per question'}
            </p>
          </div>

          {/* Port Count Input */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-300 uppercase tracking-wide">Number of Ports</label>
            <div className="flex gap-2">
              <input
                type="number"
                min="1"
                value={portCount}
                onChange={(e) => {
                  const value = Math.max(1, Number(e.target.value) || 1);
                  onPortCountChange(value);
                }}
                className="flex-1 bg-slate-700/60 border border-slate-600/50 rounded-lg px-4 py-3 text-sm text-center font-medium focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/50 hover:border-slate-500 transition-all duration-200 shadow-md"
              />
              <button
                onClick={() => onPortCountChange(filteredPortsCount)}
                disabled={filteredPortsCount === 0}
                className="px-4 py-3 bg-slate-700/70 hover:bg-slate-600/70 disabled:bg-slate-800/50 disabled:text-slate-600 text-white text-sm font-bold rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
              >
                Max
              </button>
            </div>
            {portCount > filteredPortsCount && filteredPortsCount > 0 && (
              <p className="text-xs text-yellow-400 flex items-center gap-1">
                <span>⚠️</span>
                <span>Only {filteredPortsCount} ports available with current filters</span>
              </p>
            )}
            {filteredPortsCount === 0 && (
              <p className="text-xs text-red-400 flex items-center gap-1">
                <span>⚠️</span>
                <span>No ports available with current filters</span>
              </p>
            )}
          </div>

          {/* Begin Quiz Button */}
          <div className="flex-1 flex items-end">
            <button
              onClick={onBeginQuiz}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 px-4 rounded-xl text-lg transition-all duration-200 shadow-xl shadow-blue-500/40 hover:shadow-2xl hover:shadow-blue-500/60 hover:scale-[1.02]"
            >
              Begin Quiz
            </button>
          </div>
        </div>
      )}

      {activeTab === 'lists' && (
        <ListsPanel
          key={listsRefreshKey}
          availableLists={availableLists}
          onListCreated={() => {
            setListsRefreshKey(prev => prev + 1);
            window.location.reload();
          }}
          onListDeleted={(listId) => {
            console.log('Delete button clicked for list:', listId);
            try {
              deleteCustomList(listId);
              console.log('List deleted successfully');
              window.location.reload();
            } catch (error) {
              console.error('Error deleting list:', error);
              alert('Error deleting list: ' + error);
            }
          }}
          onPortRemoved={(listId, portKey) => {
            console.log('Removing port:', portKey, 'from list:', listId);
            try {
              const savedLists = localStorage.getItem('customPortLists');
              if (savedLists) {
                let lists = JSON.parse(savedLists) as PortList[];
                const listIndex = lists.findIndex(l => l.id === listId);
                if (listIndex >= 0) {
                  lists[listIndex].portKeys = lists[listIndex].portKeys.filter(k => k !== portKey);
                  localStorage.setItem('customPortLists', JSON.stringify(lists));
                  window.location.reload();
                }
              }
            } catch (error) {
              console.error('Error removing port:', error);
              alert('Error removing port: ' + error);
            }
          }}
        />
      )}
    </div>
  );
}
