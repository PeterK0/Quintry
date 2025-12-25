import { useState } from 'react';
import type { PortList } from '../types/quiz.types';

interface ListsPanelProps {
  availableLists: PortList[];
  onListCreated: () => void;
  onListDeleted: (listId: string) => void;
  onPortRemoved?: (listId: string, portKey: string) => void;
}

export default function ListsPanel({ availableLists, onListCreated, onListDeleted, onPortRemoved }: ListsPanelProps) {
  const [selectedList, setSelectedList] = useState<PortList | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [deleteClickCount, setDeleteClickCount] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [listToDelete, setListToDelete] = useState<string | null>(null);
  const [portToRemove, setPortToRemove] = useState<{listId: string, portKey: string, portName: string} | null>(null);

  const handleCreateList = () => {
    if (newListName.trim()) {
      const newList: PortList = {
        id: `custom-${Date.now()}`,
        name: newListName.trim(),
        portKeys: [],
        isBuiltIn: false,
      };

      const savedLists = localStorage.getItem('customPortLists');
      let lists: PortList[] = [];
      if (savedLists) {
        lists = JSON.parse(savedLists);
      }
      lists.push(newList);
      localStorage.setItem('customPortLists', JSON.stringify(lists));

      setNewListName('');
      setIsCreating(false);
      onListCreated();
    }
  };

  const handleDeleteList = (listId: string) => {
    setDeleteClickCount(prev => prev + 1);
    console.log('handleDeleteList called with:', listId);
    setListToDelete(listId);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    if (listToDelete) {
      console.log('Calling onListDeleted...');
      onListDeleted(listToDelete);
      if (selectedList?.id === listToDelete) {
        setSelectedList(null);
      }
    }
    setShowDeleteConfirm(false);
    setListToDelete(null);
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setListToDelete(null);
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Top: List Selection & Actions */}
      <div className="flex flex-col space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <select
              value={selectedList?.id || ''}
              onChange={(e) => {
                const list = availableLists.find(l => l.id === e.target.value);
                setSelectedList(list || null);
              }}
              className="w-full bg-slate-700/60 border border-slate-600/50 rounded-lg px-4 py-3 text-sm font-medium focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/50 hover:border-slate-500 transition-all duration-200 shadow-md"
            >
              <option value="">Select a list...</option>
              {availableLists.map((list) => (
                <option key={list.id} value={list.id} className="bg-slate-800">
                  {list.name} ({list.portKeys.length} ports)
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={() => setIsCreating(true)}
            className="px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white text-sm font-bold rounded-lg transition-all duration-200 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 whitespace-nowrap"
          >
            + New List
          </button>
          {selectedList && !selectedList.isBuiltIn && (
            <>
              <button
                onClick={() => handleDeleteList(selectedList.id)}
                className="px-4 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300 text-sm font-bold rounded-lg transition-all duration-200 shadow-md"
              >
                Delete {deleteClickCount > 0 && `(${deleteClickCount})`}
              </button>
              {deleteClickCount > 0 && (
                <div className="px-3 py-2 bg-yellow-500/20 text-yellow-400 text-xs rounded-lg">
                  Button clicked {deleteClickCount} time{deleteClickCount !== 1 ? 's' : ''}!
                </div>
              )}
            </>
          )}
        </div>

        {/* Create New List Form */}
        {isCreating && (
          <div className="bg-slate-800/70 border border-slate-700/50 rounded-xl p-4 space-y-3 shadow-lg">
            <input
              type="text"
              placeholder="Enter list name..."
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateList()}
              className="w-full bg-slate-700/60 border border-slate-600/50 rounded-lg px-3 py-2.5 text-sm text-slate-100 font-medium focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/50 shadow-inner transition-all duration-200"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={handleCreateList}
                disabled={!newListName.trim()}
                className="flex-1 px-3 py-2.5 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-700 disabled:text-slate-500 text-white text-sm font-bold rounded-lg transition-all duration-200 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 disabled:shadow-none"
              >
                Create
              </button>
              <button
                onClick={() => {
                  setIsCreating(false);
                  setNewListName('');
                }}
                className="flex-1 px-3 py-2.5 bg-slate-700 hover:bg-slate-600 text-white text-sm font-bold rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom: List Details */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {selectedList ? (
          <>
            <div className="mb-4">
              <h3 className="text-lg font-bold text-slate-100">{selectedList.name}</h3>
              <p className="text-sm text-slate-400">{selectedList.portKeys.length} ports in this list</p>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pb-4">
              {selectedList.portKeys.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-12">
                  <div className="text-6xl mb-4">📋</div>
                  <div className="text-slate-400 text-lg">This list is empty</div>
                  <div className="text-slate-500 text-sm mt-2">
                    Add ports from the Browse Ports tab
                  </div>
                </div>
              ) : (
                selectedList.portKeys.map((portKey, index) => {
                  const [portName, country] = portKey.split('-');
                  return (
                    <div
                      key={portKey}
                      className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 hover:border-blue-500/50 hover:bg-slate-800/70 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-200 shadow-md"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 flex items-center justify-center bg-slate-700/60 rounded-lg text-sm font-bold text-slate-300 shadow-md">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <div className="font-bold text-slate-100">{portName}</div>
                          <div className="text-xs text-slate-400 mt-0.5">{country}</div>
                        </div>
                        {!selectedList.isBuiltIn && onPortRemoved && (
                          <button
                            onClick={() => {
                              setPortToRemove({
                                listId: selectedList.id,
                                portKey: portKey,
                                portName: portName
                              });
                            }}
                            className="w-8 h-8 flex items-center justify-center bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-lg font-bold transition-all duration-200"
                          >
                            −
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="text-6xl mb-4">📚</div>
            <div className="text-slate-400 text-lg">Select a list to view details</div>
            <div className="text-slate-500 text-sm mt-2 max-w-sm">
              Lists help you organize ports for focused study sessions
            </div>
          </div>
        )}
      </div>

      {/* Delete List Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 border-2 border-slate-700 rounded-xl p-6 max-w-md mx-4 shadow-2xl">
            <h3 className="text-xl font-bold text-slate-100 mb-3">Delete List?</h3>
            <p className="text-slate-300 mb-6">
              Are you sure you want to delete this list? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={confirmDelete}
                className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-lg transition-all duration-200"
              >
                Delete
              </button>
              <button
                onClick={cancelDelete}
                className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-lg transition-all duration-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remove Port Confirmation Dialog */}
      {portToRemove && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 border-2 border-slate-700 rounded-xl p-6 max-w-md mx-4 shadow-2xl">
            <h3 className="text-xl font-bold text-slate-100 mb-3">Remove Port?</h3>
            <p className="text-slate-300 mb-6">
              Remove <span className="font-bold text-blue-400">{portToRemove.portName}</span> from this list?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  if (onPortRemoved) {
                    onPortRemoved(portToRemove.listId, portToRemove.portKey);
                  }
                  setPortToRemove(null);
                }}
                className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-lg transition-all duration-200"
              >
                Remove
              </button>
              <button
                onClick={() => setPortToRemove(null)}
                className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-lg transition-all duration-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
