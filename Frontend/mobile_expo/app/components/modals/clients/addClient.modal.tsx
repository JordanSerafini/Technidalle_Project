import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Client } from '@/app/utils/interfaces/client.interface';
import { url as urlConfig } from '@/app/utils/url';
import { useClientsStore } from '@/app/store/clientsStore';

interface AddClientModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: (client: Client) => void;
}

export const AddClientModal: React.FC<AddClientModalProps> = ({
  visible,
  onClose,
  onSuccess
}) => {
  const [newClient, setNewClient] = useState<Partial<Client>>({
    firstname: '',
    lastname: '',
    email: '',
    phone: '',
    company_name: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Récupération des clients du store
  const { clients, setClients } = useClientsStore();
  
  // Valider le formulaire client
  const validateClientForm = () => {
    if (!newClient.firstname?.trim()) {
      setError("Le prénom est obligatoire");
      return false;
    }
    if (!newClient.lastname?.trim()) {
      setError("Le nom est obligatoire");
      return false;
    }
    if (!newClient.email?.trim()) {
      setError("L'email est obligatoire");
      return false;
    }
    return true;
  };
  
  // Créer un nouveau client
  const handleCreateClient = async () => {
    if (!validateClientForm()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${urlConfig.local}clients`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newClient)
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors de la création du client');
      }
      
      const createdClient = await response.json();
      
      // Mettre à jour la liste des clients
      if (clients) {
        setClients([...clients, createdClient]);
      }
      
      if (onSuccess) {
        onSuccess(createdClient);
      }
      
      onClose();
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };
  
  // Réinitialiser le formulaire
  const resetForm = () => {
    setNewClient({
      firstname: '',
      lastname: '',
      email: '',
      phone: '',
      company_name: ''
    });
    setError(null);
  };
  
  // Fermer la modale et réinitialiser le formulaire
  const handleClose = () => {
    resetForm();
    onClose();
  };
  
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.modalOuterContainer}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nouveau client</Text>
              <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.scrollView} contentContainerStyle={styles.formContainer}>
              <View style={styles.clientFormContainer}>
                {error && (
                  <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                )}
                
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Société (optionnel)</Text>
                  <TextInput
                    style={styles.input}
                    value={newClient.company_name}
                    onChangeText={(text) => setNewClient({...newClient, company_name: text})}
                    placeholder="Nom de la société"
                  />
                </View>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Prénom *</Text>
                  <TextInput
                    style={styles.input}
                    value={newClient.firstname}
                    onChangeText={(text) => setNewClient({...newClient, firstname: text})}
                    placeholder="Prénom"
                  />
                </View>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Nom *</Text>
                  <TextInput
                    style={styles.input}
                    value={newClient.lastname}
                    onChangeText={(text) => setNewClient({...newClient, lastname: text})}
                    placeholder="Nom"
                  />
                </View>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Email *</Text>
                  <TextInput
                    style={styles.input}
                    value={newClient.email}
                    onChangeText={(text) => setNewClient({...newClient, email: text})}
                    placeholder="Email"
                    keyboardType="email-address"
                  />
                </View>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Téléphone</Text>
                  <TextInput
                    style={styles.input}
                    value={newClient.phone}
                    onChangeText={(text) => setNewClient({...newClient, phone: text})}
                    placeholder="Téléphone"
                    keyboardType="phone-pad"
                  />
                </View>
                
                <View style={styles.clientFormButtons}>
                  <TouchableOpacity
                    style={[styles.button, styles.cancelButton]}
                    onPress={handleClose}
                  >
                    <Text style={styles.cancelButtonText}>Annuler</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.button, styles.submitButton]}
                    onPress={handleCreateClient}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.buttonText}>Créer</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOuterContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: 'rgba(0,0,0,0.7)',
    zIndex: 1000,
  },
  modalContainer: {
    width: '90%',
    height: '90%',
    maxWidth: 500,
    maxHeight: 700,
    borderRadius: 12,
    backgroundColor: '#fff',
    overflow: 'hidden',
    elevation: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  modalContent: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },
  formContainer: {
    padding: 16,
  },
  errorContainer: {
    padding: 10,
    backgroundColor: '#ffebee',
    borderRadius: 4,
    marginBottom: 16,
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 14,
  },
  clientFormContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
    color: '#555',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    padding: 10,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  clientFormButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  button: {
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    minWidth: '48%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButton: {
    backgroundColor: '#2196F3',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default AddClientModal;
