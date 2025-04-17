import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity,
  Alert,
  Platform,
  BackHandler,
  Dimensions,
  StatusBar,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { DocumentType, DocumentStatus } from '@/app/utils/interfaces/document';
import { url as urlConfig } from '@/app/utils/url';
import Tableau from '../../tableau';
import { useDevisStore } from '@/app/store/devisStore';
import { useFetch } from '@/app/hooks/useFetch';
import { Client } from '@/app/utils/interfaces/client.interface';
import { useClientsStore } from '@/app/store/clientsStore';
import { AddClientModal } from '../clients/addClient.modal';

// Récupérer les dimensions de l'écran
const { width, height } = Dimensions.get('window');

interface DocumentsModalProps {
  visible: boolean;
  onClose: () => void;
  projectId?: number;
  clientId?: number;
  onSuccess?: () => void;
}

// Composant pour les sections dépliables
interface CollapsibleSectionProps {
  title: string;
  children: React.ReactNode;
  initiallyExpanded?: boolean;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({ 
  title, 
  children, 
  initiallyExpanded = true 
}) => {
  const [expanded, setExpanded] = useState(initiallyExpanded);
  
  return (
    <View className="mb-6 bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
      <TouchableOpacity 
        className="flex-row justify-between items-center p-4 bg-gray-100"
        onPress={() => setExpanded(!expanded)}
      >
        <Text className="text-lg font-bold text-gray-800">{title}</Text>
        <Ionicons 
          name={expanded ? "chevron-up" : "chevron-down"} 
          size={24} 
          color="#333" 
        />
      </TouchableOpacity>
      
      {expanded && (
        <View className="p-4">
          {children}
        </View>
      )}
    </View>
  );
};

// Composant pour la modale de sélection/création de client
interface ClientSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectClient: (client: Client) => void;
}

const ClientSelectionModal: React.FC<ClientSelectionModalProps> = ({ 
  visible, 
  onClose, 
  onSelectClient 
}) => {
  const [showClientForm, setShowClientForm] = useState(false);
  const [clientFormError, setClientFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Récupération des clients
  const { data: clients, loading: clientsLoading } = useFetch<Client[]>('clients');
  const { setClients } = useClientsStore();
  
  // Mettre à jour les clients dans le store
  useEffect(() => {
    if (clients && !clientsLoading) {
      setClients(clients);
    }
  }, [clients, clientsLoading, setClients]);
  
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="absolute inset-0 flex-1 justify-center items-center bg-black/70 z-50">
        <View className="w-[90%] h-[90%] max-w-[500px] max-h-[700px] rounded-xl bg-white overflow-hidden shadow-2xl">
          <View className="flex-1">
            <View className="flex-row justify-between items-center p-4 border-b border-gray-200">
              <Text className="text-xl font-bold text-gray-800">
                {showClientForm ? 'Nouveau client' : 'Sélectionner un client'}
              </Text>
              <TouchableOpacity onPress={onClose} className="p-1">
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>
            
            {showClientForm ? (
              <AddClientModal
                visible={true}
                onClose={() => setShowClientForm(false)}
                onSuccess={(client: Client) => {
                  onSelectClient(client);
                  onClose();
                }}
              />
            ) : (
              <View className="flex-1">
                {clientFormError && (
                  <View className="p-2.5 bg-red-50 rounded m-4">
                    <Text className="text-red-600 text-sm">{clientFormError}</Text>
                  </View>
                )}
                
                <View className="p-4 flex-1">
                  <TouchableOpacity
                    className="flex-row items-center justify-center bg-gray-50 p-4 rounded-lg border border-gray-200 border-dashed mb-4"
                    onPress={() => setShowClientForm(true)}
                  >
                    <Ionicons name="add-circle-outline" size={24} color="#2196F3" />
                    <Text className="text-blue-500 text-base font-medium ml-2">Créer un nouveau client</Text>
                  </TouchableOpacity>
                  
                  <View className="flex-row items-center my-4">
                    <View className="flex-1 h-[1px] bg-gray-200" />
                    <Text className="mx-2.5 text-gray-600 text-sm">ou</Text>
                    <View className="flex-1 h-[1px] bg-gray-200" />
                  </View>
                  
                  <Text className="text-base font-medium text-gray-800 mb-3">Sélectionner un client existant</Text>
                  
                  {clientsLoading ? (
                    <ActivityIndicator size="small" color="#2196F3" className="my-5" />
                  ) : (
                    <View className="flex-1 max-h-[300px]">
                      <ScrollView className="flex-1">
                        <View className="pb-4">
                          {clients && clients.length > 0 ? (
                            clients.map(client => (
                              <TouchableOpacity
                                key={client.id}
                                className="p-3 border-b border-gray-200 bg-white"
                                onPress={() => {
                                  onSelectClient(client);
                                  onClose();
                                }}
                              >
                                <Text className="text-base font-medium text-gray-800">
                                  {client.company_name || `${client.firstname} ${client.lastname}`}
                                </Text>
                                <Text className="text-sm text-gray-600 mt-1">{client.email}</Text>
                              </TouchableOpacity>
                            ))
                          ) : (
                            <Text className="text-base text-gray-600 text-center my-4">Aucun client disponible</Text>
                          )}
                        </View>
                      </ScrollView>
                    </View>
                  )}
                </View>
              </View>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

export const DocumentsModal: React.FC<DocumentsModalProps> = ({
  visible,
  onClose,
  projectId,
  clientId,
  onSuccess
}) => {
  // États pour les champs du formulaire
  const [type, setType] = useState<DocumentType>(DocumentType.DEVIS);
  const [status, setStatus] = useState<DocumentStatus>(DocumentStatus.BROUILLON);
  const [tvaRate, setTvaRate] = useState('20');
  const [issueDate, setIssueDate] = useState(new Date());
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [notes, setNotes] = useState('');
  const [filePath, setFilePath] = useState('');
  
  // États pour l'UI
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [issueDatePickerOpen, setIssueDatePickerOpen] = useState(false);
  const [dueDatePickerOpen, setDueDatePickerOpen] = useState(false);
  
  // États pour la section client
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showClientModal, setShowClientModal] = useState(false);
  
  // Store pour les lignes du devis
  const { rows, calculateTotal, clearRows } = useDevisStore();
  
  // Reset form quand la modale s'ouvre
  useEffect(() => {
    if (visible) {
      resetForm();
    }
  }, [visible]);
  
  // Gestion du bouton retour Android
  useEffect(() => {
    if (Platform.OS === 'android') {
      const backHandler = BackHandler.addEventListener(
        'hardwareBackPress',
        () => {
          if (visible) {
            onClose();
            return true;
          }
          return false;
        }
      );

      return () => backHandler.remove();
    }
  }, [visible, onClose]);

  // Réinitialiser le formulaire
  const resetForm = () => {
    setType(DocumentType.DEVIS);
    setStatus(DocumentStatus.BROUILLON);
    setTvaRate('20');
    setIssueDate(new Date());
    setDueDate(null);
    setNotes('');
    setFilePath('');
    setError(null);
    setSelectedClient(null);
    clearRows(); // Réinitialiser les lignes du devis
  };

  // Formater les dates pour l'affichage
  const formatDate = (date: Date | null) => {
    if (!date) return '';
    return date.toLocaleDateString('fr-FR');
  };

  // Gérer le changement de date d'émission
  const handleIssueDateChange = (event: any, selectedDate?: Date) => {
    setIssueDatePickerOpen(false);
    if (selectedDate) {
      setIssueDate(selectedDate);
    }
  };

  // Gérer le changement de date d'échéance
  const handleDueDateChange = (event: any, selectedDate?: Date) => {
    setDueDatePickerOpen(false);
    if (selectedDate) {
      setDueDate(selectedDate);
    }
  };

  // Valider le formulaire principal
  const validateForm = () => {
    if (!selectedClient) {
      setError("Veuillez sélectionner ou créer un client");
      return false;
    }
    if (!projectId) {
      setError("L'ID du projet est obligatoire");
      return false;
    }
    return true;
  };

  // Soumettre le formulaire
  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      if (!selectedClient) {
        setError("Veuillez sélectionner ou créer un client");
        return;
      }
      
      const documentData = {
        project_id: projectId,
        client_id: selectedClient.id,
        type,
        status,
        amount: calculateTotal(), // Utiliser le total calculé du tableau
        tva_rate: parseFloat(tvaRate),
        issue_date: issueDate.toISOString(),
        due_date: dueDate?.toISOString() || null,
        notes,
        file_path: filePath,
        materials: rows.map(row => ({
          material_id: row.material?.id,
          quantity: row.quantity,
          price: row.price
        }))
      };
      
      const response = await fetch(`${urlConfig.local}documents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(documentData)
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors de la création du document');
      }
      
      Alert.alert(
        'Succès',
        'Le document a été créé avec succès',
        [
          {
            text: 'OK',
            onPress: () => {
              if (onSuccess) onSuccess();
              onClose();
            }
          }
        ]
      );
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  // Si la modale n'est pas visible, ne pas la rendre du tout
  if (!visible) return null;

  return (
    <View className="absolute inset-0 flex-1 justify-center items-center bg-black/70 z-50">
      <View className="w-[90%] h-[90%] max-w-[500px] max-h-[700px] rounded-xl bg-white overflow-hidden shadow-2xl">
        <View className="flex-1">
          <View className="flex-row justify-between items-center p-4 border-b border-gray-200">
            <Text className="text-xl font-bold text-gray-800">Nouveau document</Text>
            <TouchableOpacity onPress={onClose} className="p-1">
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>
          
          <ScrollView className="flex-1" contentContainerClassName="p-4">
            {error && (
              <View className="p-2.5 bg-red-50 rounded mb-4">
                <Text className="text-red-600 text-sm">{error}</Text>
              </View>
            )}
            
            {/* Section Client */}
            <CollapsibleSection title="Client" initiallyExpanded={true}>
              {selectedClient ? (
                <View className="flex-row justify-between items-center p-4 bg-white rounded-lg border border-gray-200">
                  <View className="flex-1">
                    <Text className="text-lg font-bold text-gray-800">
                      {selectedClient.company_name || `${selectedClient.firstname} ${selectedClient.lastname}`}
                    </Text>
                    <Text className="text-sm text-gray-600 mt-1">{selectedClient.email}</Text>
                    {selectedClient.phone && (
                      <Text className="text-sm text-gray-600 mt-1">{selectedClient.phone}</Text>
                    )}
                    {selectedClient.addresses && (
                      <Text className="text-sm text-gray-600 mt-1">
                        {selectedClient.addresses.street_name}, {selectedClient.addresses.zip_code} {selectedClient.addresses.city}
                      </Text>
                    )}
                  </View>
                  <TouchableOpacity 
                    className="p-2"
                    onPress={() => setShowClientModal(true)}
                  >
                    <Text className="text-blue-500 text-sm font-medium">Changer</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  className="flex-row items-center justify-center bg-gray-50 p-4 rounded-lg border border-gray-200 border-dashed"
                  onPress={() => setShowClientModal(true)}
                >
                  <Ionicons name="person-outline" size={20} color="#2196F3" />
                  <Text className="text-blue-500 text-base font-medium ml-2">Sélectionner un client</Text>
                </TouchableOpacity>
              )}
            </CollapsibleSection>
            
            {/* Section Informations */}
            <CollapsibleSection title="Informations" initiallyExpanded={true}>
              <View className="mb-4">
                <Text className="text-sm font-medium mb-1.5 text-gray-600">Type de document *</Text>
                <View className="border border-gray-300 rounded bg-white">
                  <Picker
                    selectedValue={type}
                    onValueChange={(itemValue) => setType(itemValue as DocumentType)}
                    className="h-[50px]"
                  >
                    {Object.values(DocumentType).map((docType) => (
                      <Picker.Item 
                        key={docType} 
                        label={docType.replace(/_/g, ' ')} 
                        value={docType} 
                      />
                    ))}
                  </Picker>
                </View>
              </View>
              
              <View className="mb-4">
                <Text className="text-sm font-medium mb-1.5 text-gray-600">Statut</Text>
                <View className="border border-gray-300 rounded bg-white">
                  <Picker
                    selectedValue={status}
                    onValueChange={(itemValue) => setStatus(itemValue as DocumentStatus)}
                    className="h-[50px]"
                  >
                    {Object.values(DocumentStatus).map((docStatus) => (
                      <Picker.Item 
                        key={docStatus} 
                        label={docStatus.replace(/_/g, ' ')} 
                        value={docStatus} 
                      />
                    ))}
                  </Picker>
                </View>
              </View>
              
              <View className="mb-4">
                <Text className="text-sm font-medium mb-1.5 text-gray-600">Taux TVA (%)</Text>
                <TextInput
                  className="border border-gray-300 rounded p-2.5 text-base bg-white"
                  value={tvaRate}
                  onChangeText={setTvaRate}
                  placeholder="20"
                  keyboardType="decimal-pad"
                />
              </View>
              
              <View className="mb-4">
                <Text className="text-sm font-medium mb-1.5 text-gray-600">Date d'émission *</Text>
                <TouchableOpacity 
                  className="flex-row justify-between items-center border border-gray-300 rounded p-2.5 bg-white"
                  onPress={() => setIssueDatePickerOpen(true)}
                >
                  <Text className="text-base text-gray-800">{formatDate(issueDate)}</Text>
                  <Ionicons name="calendar-outline" size={20} color="#666" />
                </TouchableOpacity>
                
                {issueDatePickerOpen && (
                  <DateTimePicker
                    value={issueDate}
                    mode="date"
                    display="default"
                    onChange={handleIssueDateChange}
                  />
                )}
              </View>
              
              <View className="mb-4">
                <Text className="text-sm font-medium mb-1.5 text-gray-600">Date d'échéance</Text>
                <TouchableOpacity 
                  className="flex-row justify-between items-center border border-gray-300 rounded p-2.5 bg-white"
                  onPress={() => setDueDatePickerOpen(true)}
                >
                  <Text className="text-base text-gray-800">{dueDate ? formatDate(dueDate) : 'Non définie'}</Text>
                  <Ionicons name="calendar-outline" size={20} color="#666" />
                </TouchableOpacity>
                
                {dueDatePickerOpen && (
                  <DateTimePicker
                    value={dueDate || new Date()}
                    mode="date"
                    display="default"
                    onChange={handleDueDateChange}
                  />
                )}
              </View>
              
              <View className="mb-4">
                <Text className="text-sm font-medium mb-1.5 text-gray-600">Notes</Text>
                <TextInput
                  className="border border-gray-300 rounded p-2.5 text-base bg-white h-[100px] textAlignVertical-top"
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Notes ou commentaires supplémentaires"
                  multiline
                  numberOfLines={4}
                />
              </View>
            </CollapsibleSection>
            
            {/* Section Matériaux */}
            {type === DocumentType.DEVIS && (
              <CollapsibleSection title="Matériaux" initiallyExpanded={true}>
                <Tableau />
              </CollapsibleSection>
            )}
          </ScrollView>

          <View className="flex-row justify-between mt-5 px-4 pb-4">
            <TouchableOpacity
              className="flex-1 mr-2 rounded-lg py-3 px-4 bg-gray-100 border border-gray-300 items-center justify-center"
              onPress={onClose}
            >
              <Text className="text-gray-800 font-bold">Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 ml-2 rounded-lg py-3 px-4 bg-blue-500 items-center justify-center"
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white font-bold">
                  Enregistrer
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
      
      {/* Modale de sélection/création de client */}
      <ClientSelectionModal
        visible={showClientModal}
        onClose={() => setShowClientModal(false)}
        onSelectClient={setSelectedClient}
      />
    </View>
  );
};

export default DocumentsModal;