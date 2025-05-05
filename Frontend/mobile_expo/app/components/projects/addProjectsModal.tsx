import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';

interface AddProjectModalProps {
  visible: boolean;
  onClose: () => void;
  onCreateProject: (name: string, reference: string, description: string) => void;
}

const AddProjectModal: React.FC<AddProjectModalProps> = ({ 
  visible, 
  onClose, 
  onCreateProject 
}) => {
  const [projectName, setProjectName] = useState('');
  const [projectReference, setProjectReference] = useState('');
  const [projectDescription, setProjectDescription] = useState('');

  // Réinitialiser les champs quand la modale se ferme
  useEffect(() => {
    if (!visible) {
      setProjectName('');
      setProjectReference('');
      setProjectDescription('');
    }
  }, [visible]);

  const handleCreate = () => {
    onCreateProject(projectName, projectReference, projectDescription);
  };

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <View style={styles.modalContent}>
        <Text style={styles.modalTitle}>Nouveau Projet</Text>
        
        <TextInput
          style={styles.input}
          placeholder="Nom du projet *"
          value={projectName}
          onChangeText={setProjectName}
        />
        
        <TextInput
          style={styles.input}
          placeholder="Référence *"
          value={projectReference}
          onChangeText={setProjectReference}
        />
        
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Description"
          value={projectDescription}
          onChangeText={setProjectDescription}
          multiline={true}
          numberOfLines={3}
          textAlignVertical="top"
        />
        
        <View style={styles.buttonRow}>
          <TouchableOpacity 
            style={[styles.button, styles.cancelButton]} 
            onPress={onClose}
          >
            <Text style={styles.buttonText}>Annuler</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, styles.createButton]} 
            onPress={handleCreate}
          >
            <Text style={styles.buttonText}>Créer</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  modalContent: {
    width: '90%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    maxWidth: 400,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    height: 40,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    marginBottom: 15,
    paddingHorizontal: 10,
    backgroundColor: '#f9f9f9',
  },
  textArea: {
    height: 80,
    paddingTop: 10,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 5,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f44336',
    marginRight: 10,
  },
  createButton: {
    backgroundColor: '#4CAF50',
    marginLeft: 10,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default AddProjectModal;
