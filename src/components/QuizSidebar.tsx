interface QuizSidebarProps {
  onNewQuiz: () => void;
  onRegionChange: (region: string) => void;
  selectedRegion: string;
  markerCount: number;
}

const QuizSidebar = ({ onNewQuiz, onRegionChange, selectedRegion, markerCount }: QuizSidebarProps) => {
  const regions = [
    { id: 'world', label: 'World', icon: '🌍' },
    { id: 'asia', label: 'Asia', icon: '🌏' },
    { id: 'europe', label: 'Europe', icon: '🇪🇺' },
    { id: 'americas', label: 'Americas', icon: '🌎' },
    { id: 'africa', label: 'Africa', icon: '🌍' },
    { id: 'oceania', label: 'Oceania', icon: '🏝️' },
  ];

  return (
    <div className="w-56 bg-slate-700/50 flex flex-col h-full border-r border-slate-600">
      {/* Logo */}
      <div className="p-4 border-b border-slate-600">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded flex items-center justify-center text-white font-bold text-lg">
            Q
          </div>
          <div>
            <div className="text-white font-bold text-sm">QUINTRY</div>
            <div className="text-slate-400 text-xs">Port Quiz</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="p-3 border-b border-slate-600">
        <button
          onClick={onNewQuiz}
          className="w-full bg-blue-500/80 hover:bg-blue-500 text-white px-4 py-2.5 rounded text-sm font-medium transition-colors flex items-center justify-center gap-2"
        >
          <span>➕</span>
          <span>New Quiz</span>
        </button>
      </div>

      {/* Regions */}
      <div className="flex-1 p-3 overflow-y-auto">
        <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2 px-2">
          Select Region
        </div>
        <div className="space-y-1">
          {regions.map(region => (
            <button
              key={region.id}
              onClick={() => onRegionChange(region.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded text-left text-sm transition-colors ${
                selectedRegion === region.id
                  ? 'bg-blue-500/80 text-white'
                  : 'text-slate-300 hover:bg-slate-600/50'
              }`}
            >
              <span className="text-lg">{region.icon}</span>
              <span>{region.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Info Panel */}
      <div className="p-3 border-t border-slate-600 bg-slate-800/30">
        <div className="text-slate-400 text-xs mb-2">Quiz Info</div>
        <div className="space-y-1.5 text-xs">
          <div className="flex justify-between text-slate-300">
            <span>Markers:</span>
            <span className="font-mono font-semibold">{markerCount}</span>
          </div>
          <div className="flex justify-between text-slate-300">
            <span>Region:</span>
            <span className="font-semibold capitalize">{selectedRegion}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizSidebar;
