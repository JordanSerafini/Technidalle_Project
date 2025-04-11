import { useState } from '@lynx-js/react';
import { useNavigationStore } from '../../store/navigationStore.js';
import { useSearchStore } from '../../store/searchStore.js';

export function Searchbar() {
  const [searchtext, setSearchtext] = useState('');
  const [showingInputDialog, setShowingInputDialog] = useState(false);
  const [tempSearchText, setTempSearchText] = useState('');
  const { setCurrentPage } = useNavigationStore();
  const { setSearchQuery } = useSearchStore();

  const handleSearch = () => {
    if (searchtext.trim().length >= 2) {
      setSearchQuery(searchtext);
      setCurrentPage('search-results');
    }
  };

  const openTextInputModal = () => {
    setShowingInputDialog(true);
    setTempSearchText(searchtext);
  };

  const confirmSearch = () => {
    setSearchtext(tempSearchText);
    if (tempSearchText.trim().length >= 2) {
      setSearchQuery(tempSearchText);
    }
    setShowingInputDialog(false);
  };

  const cancelSearch = () => {
    setShowingInputDialog(false);
  };

  return (
    <view className="relative w-full z-50">
      {showingInputDialog ? (
        <view className="absolute top-0 left-0 w-full p-4 bg-gray-800 border border-gray-700 rounded-md z-50">
          <view className="mb-2">
            <text className="text-white">Entrez votre recherche:</text>
          </view>
          <view className="border border-gray-600 rounded-md p-2 mb-4">
            <text className="text-white" bindtap={() => setTempSearchText('')}>
              {tempSearchText || 'Tapez ici...'}
            </text>
          </view>
          <view className="flex flex-row justify-between">
            <view className="px-3 py-1 bg-gray-700 rounded-md" bindtap={cancelSearch}>
              <text className="text-white">Annuler</text>
            </view>
            <view className="px-3 py-1 bg-blue-700 rounded-md" bindtap={confirmSearch}>
              <text className="text-white">Confirmer</text>
            </view>
          </view>
        </view>
      ) : (
        <view className="flex flex-row justify-between items-center px-4 border h-10 rounded-md w-full border-gray-700">
          <view className="flex-1" bindtap={openTextInputModal}>
            <text className="text-white">
              {searchtext || 'Rechercher...'}
            </text>
          </view>

          <view
            className="ml-2 px-3 py-1 rounded-full bg-gray-700"
            bindtap={handleSearch}
          >
            <text className="text-white">🔍</text>
          </view>
        </view>
      )}
    </view>
  );
}
