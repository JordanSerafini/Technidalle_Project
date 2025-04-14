import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { useNavigationStore } from '../../store/navigationStore';
import { useSearchStore } from '../../store/searchStore';

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
    <View style={styles.container}>
      <Modal
        visible={showingInputDialog}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Entrez votre recherche:</Text>
            <TextInput
              style={styles.textInput}
              value={tempSearchText}
              onChangeText={setTempSearchText}
              placeholder="Rechercher..."
              placeholderTextColor="#aaa"
              autoFocus
            />
            <View style={styles.buttonRow}>
              <TouchableOpacity 
                style={styles.cancelButton} 
                onPress={cancelSearch}
              >
                <Text style={styles.buttonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.confirmButton} 
                onPress={confirmSearch}
              >
                <Text style={styles.buttonText}>Confirmer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <View style={styles.searchBar}>
        <TouchableOpacity 
          style={styles.searchInput} 
          onPress={openTextInputModal}
        >
          <Text style={styles.searchText}>
            {searchtext || 'Rechercher...'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.searchButton}
          onPress={handleSearch}
        >
          <Text style={styles.searchIcon}>🔍</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    width: '100%',
    zIndex: 50
  },
  searchBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderWidth: 1,
    height: 40,
    borderRadius: 6,
    width: '100%',
    borderColor: '#374151' // gray-700
  },
  searchInput: {
    flex: 1
  },
  searchText: {
    color: 'white'
  },
  searchButton: {
    marginLeft: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#374151' // gray-700
  },
  searchIcon: {
    color: 'white'
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#1F2937', // gray-800
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#374151' // gray-700
  },
  modalTitle: {
    color: 'white',
    marginBottom: 8
  },
  textInput: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#4B5563', // gray-600
    borderRadius: 6,
    padding: 8,
    marginBottom: 16,
    color: 'white',
    backgroundColor: 'transparent'
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  cancelButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: '#374151', // gray-700
    borderRadius: 6
  },
  confirmButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: '#1D4ED8', // blue-700
    borderRadius: 6
  },
  buttonText: {
    color: 'white'
  }
});

export default Searchbar;
