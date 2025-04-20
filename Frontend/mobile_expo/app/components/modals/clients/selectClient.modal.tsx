import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Client } from '@/app/utils/interfaces/client.interface';
import { useClientsStore } from '@/app/store/clientsStore';
import { useFetch } from '@/app/hooks/useFetch';
import AddClientModal from './addClient.modal';

interface SelectClientModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectClient: (client: Client) => void;
}

export const SelectClientModal: React.FC<SelectClientModalProps> = ({
  visible,
  onClose,
  onSelectClient
}) => {
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Récupération des clients
  const { data: clients, loading: clientsLoading } = useFetch<Client[]>('clients');
  const { setClients } = useClientsStore();
  
  // Mettre à jour les clients dans le store
  useEffect(() => {
    if (clients && !clientsLoading) {
      setClients(clients);
    }
  }, [clients, clientsLoading, setClients]);
  
  // Gérer la sélection d'un client
  const handleSelectClient = (client: Client) => {
    onSelectClient(client);
    onClose();
  };
  
  // Gérer la création d'un client
  const handleClientCreated = (client: Client) => {
    onSelectClient(client);
  };
  
  return (
    <>
      <Modal
        visible={visible}
        transparent={true}
        animationType="slide"
        onRequestClose={onClose}
      >
        <View style={styles.modalOuterContainer}>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Sélectionner un client</Text>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color="#000" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.clientSelectionView}>
                {error && (
                  <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                )}
                
                <View style={styles.clientOptionsContainer}>
                  <TouchableOpacity
                    style={styles.clientOptionButton}
                    onPress={() => setShowAddClientModal(true)}
                  >
                    <Ionicons name="add-circle-outline" size={24} color="#2196F3" />
                    <Text style={styles.clientOptionButtonText}>Créer un nouveau client</Text>
                  </TouchableOpacity>
                  
                  <View style={styles.clientOptionDivider}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>ou</Text>
                    <View style={styles.dividerLine} />
                  </View>
                  
                  <Text style={styles.clientListTitle}>Sélectionner un client existant</Text>
                  
                  {clientsLoading ? (
                    <ActivityIndicator size="small" color="#2196F3" style={styles.loadingIndicator} />
                  ) : (
                    <View style={styles.clientListWrapper}>
                      <ScrollView style={styles.clientListScrollView}>
                        <View style={styles.clientListContainer}>
                          {clients && clients.length > 0 ? (
                            clients.map(client => (
                              <TouchableOpacity
                                key={client.id}
                                style={styles.clientItem}
                                onPress={() => handleSelectClient(client)}
                              >
                                <Text style={styles.clientItemName}>
                                  {client.company_name || `${client.firstname} ${client.lastname}`}
                                </Text>
                                <Text style={styles.clientItemEmail}>{client.email}</Text>
                              </TouchableOpacity>
                            ))
                          ) : (
                            <Text style={styles.noClientsText}>Aucun client disponible</Text>
                          )}
                        </View>
                      </ScrollView>
                    </View>
                  )}
                </View>
              </View>
            </View>
          </View>
        </View>
      </Modal>
      
      <AddClientModal
        visible={showAddClientModal}
        onClose={() => setShowAddClientModal(false)}
        onSuccess={handleClientCreated}
      />
    </>
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
  clientSelectionView: {
    flex: 1,
  },
  errorContainer: {
    padding: 10,
    backgroundColor: '#ffebee',
    borderRadius: 4,
    margin: 16,
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 14,
  },
  clientOptionsContainer: {
    padding: 16,
    flex: 1,
  },
  clientOptionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
    marginBottom: 16,
  },
  clientOptionButtonText: {
    color: '#2196F3',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  clientOptionDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  dividerText: {
    marginHorizontal: 10,
    color: '#666',
    fontSize: 14,
  },
  clientListTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 12,
  },
  loadingIndicator: {
    marginVertical: 20,
  },
  clientListWrapper: {
    flex: 1,
    maxHeight: 300,
  },
  clientListScrollView: {
    flex: 1,
  },
  clientListContainer: {
    paddingBottom: 16,
  },
  clientItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  clientItemName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  clientItemEmail: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  noClientsText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginVertical: 16,
  },
});

export default SelectClientModal; 