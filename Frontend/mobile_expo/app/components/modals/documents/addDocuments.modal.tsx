import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  Alert,
  Platform,
  BackHandler,
  Dimensions,
  StatusBar,
  ScrollView,
  TextInput,
  ActivityIndicator,
  // Modal
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { DocumentType, DocumentStatus } from '@/app/utils/interfaces/document';
import { url as urlConfig } from '@/app/utils/url';
import Tableau from '../../tableau';
import { useDevisStore } from '@/app/store/devisStore';

// Interfaces pour le client (définies localement pour éviter les problèmes d'importation)
interface Client {
  id: number;
  company_name?: string;
  firstname: string;
  lastname: string;
  email: string;
  phone?: string;
  mobile?: string;
  address_id?: number;
  siret?: string;
  notes?: string;
  created_at?: Date;
  updated_at?: Date;
}

interface CreateClientDto {
  company_name?: string;
  firstname: string;
  lastname: string;
  email: string;
  phone?: string;
  mobile?: string;
  address_id?: number;
  siret?: string;
  notes?: string;
}

// Récupérer les dimensions de l'écran
const { width, height } = Dimensions.get('window');

interface DocumentsModalProps {
  visible: boolean;
  onClose: () => void;
  projectId?: number;
  clientId?: number;
  onSuccess?: () => void;
}

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
  // États pour les sections pliables
  const [isInfoOpen, setIsInfoOpen] = useState(true);
  const [isMaterialsOpen, setIsMaterialsOpen] = useState(true);
  const [isClientOpen, setIsClientOpen] = useState(true);

  // États pour la section Client
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isAddingClient, setIsAddingClient] = useState(false);
  const [newClientError, setNewClientError] = useState<string | null>(null);
  const [isClientLoading, setIsClientLoading] = useState(false);

  // États pour le formulaire d'ajout de client
  const [newClientFirstName, setNewClientFirstName] = useState('');
  const [newClientLastName, setNewClientLastName] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [newClientCompanyName, setNewClientCompanyName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newClientMobile, setNewClientMobile] = useState('');
  const [newClientSiret, setNewClientSiret] = useState('');
  const [newClientNotes, setNewClientNotes] = useState('');

  // Store pour les lignes du devis
  const { rows, calculateTotal, clearRows } = useDevisStore();
  
  // Fetch clients quand la modale s'ouvre ou projectId change
  useEffect(() => {
    if (visible) {
      fetchClients();
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

  // Fonction pour récupérer les clients
  const fetchClients = async () => {
    setIsClientLoading(true);
    setError(null);
    try {
      const response = await fetch(`${urlConfig.local}clients`);
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des clients');
      }
      const data: Client[] = await response.json();
      setClients(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue lors de la récupération des clients');
    } finally {
      setIsClientLoading(false);
    }
  };

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
    clearRows();

    // Réinitialisation section client
    setSelectedClient(null); 
    setIsAddingClient(false);
    setNewClientError(null);
    // Réinitialisation formulaire ajout client
    setNewClientFirstName('');
    setNewClientLastName('');
    setNewClientEmail('');
    setNewClientCompanyName('');
    setNewClientPhone('');
    setNewClientMobile('');
    setNewClientSiret('');
    setNewClientNotes('');
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

  // Valider le formulaire
  const validateForm = () => {
    if (!projectId) {
      setError("L'ID du projet est obligatoire");
      return false;
    }
    if (!selectedClient && !isAddingClient) {
      setError("Veuillez sélectionner ou ajouter un client");
      return false;
    }
    if (isAddingClient) {
       if (!newClientFirstName.trim() || !newClientLastName.trim() || !newClientEmail.trim()) {
         setNewClientError("Prénom, Nom et Email sont obligatoires pour ajouter un client.");
         return false;
       }
    }
    setError(null);
    return true;
  };

  // Gérer l'ajout d'un nouveau client
  const handleAddClient = async () => {
    if (!newClientFirstName.trim() || !newClientLastName.trim() || !newClientEmail.trim()) {
       setNewClientError("Prénom, Nom et Email sont obligatoires.");
       return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newClientEmail)) {
        setNewClientError("Veuillez entrer une adresse email valide.");
        return;
    }

    setIsClientLoading(true);
    setNewClientError(null);

    const newClientData: CreateClientDto = {
      firstname: newClientFirstName,
      lastname: newClientLastName,
      email: newClientEmail,
      company_name: newClientCompanyName || undefined,
      phone: newClientPhone || undefined,
      mobile: newClientMobile || undefined,
      siret: newClientSiret || undefined,
      notes: newClientNotes || undefined,
    };

    try {
      const response = await fetch(`${urlConfig.local}clients`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newClientData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la création du client');
      }

      const createdClient: Client = await response.json();
      
      setClients(prevClients => [...prevClients, createdClient]);
      setSelectedClient(createdClient);
      setIsAddingClient(false);

      setNewClientFirstName('');
      setNewClientLastName('');
      setNewClientEmail('');
      setNewClientCompanyName('');
      setNewClientPhone('');
      setNewClientMobile('');
      setNewClientSiret('');
      setNewClientNotes('');

    } catch (err) {
      setNewClientError(err instanceof Error ? err.message : 'Une erreur est survenue lors de l\'ajout du client');
    } finally {
      setIsClientLoading(false);
    }
  };

  // Soumettre le formulaire
  const handleSubmit = async () => {
    if (!validateForm()) {
        if (isAddingClient && newClientError) {
           Alert.alert("Erreur Client", newClientError); 
        } else if (!selectedClient) {
           Alert.alert("Erreur", error || "Veuillez sélectionner ou ajouter un client.");
        } else {
           Alert.alert("Erreur", error || "Veuillez vérifier les champs du document.");
        }
        return; 
    }

    if (isAddingClient) {
        await handleAddClient();
        if (newClientError) {
             Alert.alert("Erreur", `Impossible d'ajouter le client: ${newClientError}. Corrigez et réessayez.`);
             return;
        }
        if (!selectedClient || !selectedClient.id) {
            Alert.alert("Erreur", "Le client vient d'être ajouté, mais son ID n'est pas disponible. Veuillez réessayer d'enregistrer le document.");
            return;
        }
    }

    if (!selectedClient || !selectedClient.id) {
      setError("Client non sélectionné ou invalide.");
      Alert.alert("Erreur", "Client non sélectionné ou invalide.");
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const documentData = {
        project_id: projectId,
        client_id: selectedClient.id,
        type,
        status,
        amount: calculateTotal(),
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
      setError(err instanceof Error ? err.message : 'Une erreur est survenue lors de la création du document');
      Alert.alert("Erreur Document", err instanceof Error ? err.message : 'Une erreur est survenue lors de la création du document');
    } finally {
      setLoading(false);
    }
  };

  // Si la modale n'est pas visible, ne pas la rendre du tout
  if (!visible) return null;

  return (
    <View style={styles.modalOuterContainer}>
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Nouveau document</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>
          
            <ScrollView style={styles.scrollView} contentContainerStyle={styles.formContainer}>
              {error && !newClientError && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              <TouchableOpacity 
                style={styles.sectionHeader} 
                onPress={() => setIsClientOpen(!isClientOpen)}
                activeOpacity={0.7}
              >
                <Text style={styles.sectionTitle}>Client *</Text>
                <Ionicons 
                  name={isClientOpen ? "chevron-up-outline" : "chevron-down-outline"} 
                  size={20} 
                  color="#333" 
                />
              </TouchableOpacity>

              {isClientOpen && (
                <View style={styles.sectionContent}>
                   {newClientError && (
                     <View style={styles.errorContainer}>
                       <Text style={styles.errorText}>{newClientError}</Text>
                     </View>
                   )}
                   {isClientLoading && <ActivityIndicator size="small" color="#0000ff" style={{ marginBottom: 10}} />}

                   {!isAddingClient && !selectedClient && !isClientLoading && (
                     <>
                        <View style={styles.pickerContainer}>
                           <Picker
                            selectedValue={selectedClient ? (selectedClient as any).id : null}
                            onValueChange={(itemValue: any) => {
                                if (itemValue) {
                                    const client = clients.find(c => (c as any).id === itemValue);
                                    setSelectedClient(client || null);
                                } else {
                                    setSelectedClient(null);
                                }
                            }}
                            style={styles.picker}
                            prompt="Sélectionnez un client"
                           >
                            <Picker.Item label="-- Sélectionner un client existant --" value={null} />
                            {clients.map((client) => (
                                <Picker.Item 
                                key={(client as any).id} 
                                label={`${client.firstname} ${client.lastname}${client.company_name ? ' (' + client.company_name + ')' : ''}`} 
                                value={(client as any).id} 
                                />
                            ))}
                           </Picker>
                        </View>
                        <TouchableOpacity 
                          style={[styles.button, styles.addButton, { marginTop: 10 }]} 
                          onPress={() => { setIsAddingClient(true); setSelectedClient(null); setNewClientError(null); }}>
                           <Text style={styles.buttonText}>Ajouter un nouveau client</Text>
                        </TouchableOpacity>
                     </>
                   )}

                   {isAddingClient && !isClientLoading && (
                     <>
                        <Text style={styles.subHeader}>Nouveau Client</Text>
                        <View style={styles.inputGroup}>
                           <Text style={styles.label}>Prénom *</Text>
                           <TextInput style={styles.input} value={newClientFirstName} onChangeText={setNewClientFirstName} />
                        </View>
                        <View style={styles.inputGroup}>
                           <Text style={styles.label}>Nom *</Text>
                           <TextInput style={styles.input} value={newClientLastName} onChangeText={setNewClientLastName} />
                        </View>
                         <View style={styles.inputGroup}>
                           <Text style={styles.label}>Email *</Text>
                           <TextInput style={styles.input} value={newClientEmail} onChangeText={setNewClientEmail} keyboardType="email-address" autoCapitalize="none" />
                        </View>
                        <View style={styles.inputGroup}>
                           <Text style={styles.label}>Société</Text>
                           <TextInput style={styles.input} value={newClientCompanyName} onChangeText={setNewClientCompanyName} />
                        </View>
                        <View style={styles.inputGroup}>
                           <Text style={styles.label}>Téléphone</Text>
                           <TextInput style={styles.input} value={newClientPhone} onChangeText={setNewClientPhone} keyboardType="phone-pad" />
                        </View>
                         <View style={styles.inputGroup}>
                           <Text style={styles.label}>Mobile</Text>
                           <TextInput style={styles.input} value={newClientMobile} onChangeText={setNewClientMobile} keyboardType="phone-pad" />
                        </View>
                         <View style={styles.inputGroup}>
                           <Text style={styles.label}>SIRET</Text>
                           <TextInput style={styles.input} value={newClientSiret} onChangeText={setNewClientSiret} />
                        </View>
                         <View style={styles.inputGroup}>
                           <Text style={styles.label}>Notes</Text>
                           <TextInput style={[styles.input, styles.textArea]} value={newClientNotes} onChangeText={setNewClientNotes} multiline />
                        </View>

                        <View style={styles.buttonRow}>
                           <TouchableOpacity 
                             style={[styles.button, styles.cancelButton, { flex: 1, marginRight: 5 }]} 
                             onPress={() => { setIsAddingClient(false); setNewClientError(null); }}>
                               <Text style={styles.buttonText}>Annuler</Text>
                           </TouchableOpacity>
                            <TouchableOpacity 
                              style={[styles.button, styles.submitButton, { flex: 1, marginLeft: 5 }]} 
                              onPress={handleAddClient}
                              disabled={isClientLoading} >
                                <Text style={[styles.buttonText, styles.submitButtonText]}>Enregistrer Client</Text>
                            </TouchableOpacity>
                        </View>
                     </>
                   )}

                   {!isAddingClient && selectedClient && !isClientLoading && (
                     <View style={styles.clientInfoContainer}>
                       <Text style={styles.clientInfoTitle}>Informations client</Text>
                       
                       <Text style={styles.clientInfoText}>
                         <Text style={{fontWeight: 'bold'}}>Client : </Text>
                         {selectedClient.firstname} {selectedClient.lastname} 
                         {selectedClient.company_name ? ` (${selectedClient.company_name})` : ''}
                       </Text>
                       
                       <Text style={styles.clientInfoText}>
                          <Text style={{fontWeight: 'bold'}}>Email : </Text>
                          {selectedClient.email}
                       </Text>
                       
                       {selectedClient.phone && 
                        <Text style={styles.clientInfoText}>
                          <Text style={{fontWeight: 'bold'}}>Tél : </Text>
                          {selectedClient.phone}
                        </Text>
                       }
                       
                       {selectedClient.mobile && 
                        <Text style={styles.clientInfoText}>
                          <Text style={{fontWeight: 'bold'}}>Mobile : </Text>
                          {selectedClient.mobile}
                        </Text>
                       }
                       
                       {selectedClient.siret && 
                        <Text style={styles.clientInfoText}>
                          <Text style={{fontWeight: 'bold'}}>SIRET : </Text>
                          {selectedClient.siret}
                        </Text>
                       }
                       
                       {selectedClient.notes && 
                        <View style={styles.clientNotesContainer}>
                          <Text style={[styles.clientInfoText, {fontWeight: 'bold'}]}>Notes :</Text>
                          <Text style={styles.clientNotes}>{selectedClient.notes}</Text>
                        </View>
                       }
                       
                       <TouchableOpacity 
                          style={[styles.button, styles.changeButton, { marginTop: 15 }]} 
                          onPress={() => setSelectedClient(null)}>
                           <Text style={styles.buttonText}>Changer de client</Text>
                       </TouchableOpacity>
                     </View>
                   )}
                </View>
              )} 

              <TouchableOpacity 
                style={[styles.sectionHeader, { marginTop: isClientOpen ? 15 : 0 }]}
                onPress={() => setIsInfoOpen(!isInfoOpen)}
                activeOpacity={0.7}
              >
                <Text style={styles.sectionTitle}>Information</Text>
                <Ionicons 
                  name={isInfoOpen ? "chevron-up-outline" : "chevron-down-outline"} 
                  size={20} 
                  color="#333" 
                />
              </TouchableOpacity>
              {isInfoOpen && (
                 <View style={styles.sectionContent}>
                   <View style={styles.inputGroup}>
                     <Text style={styles.label}>Type de document *</Text>
                     <View style={styles.pickerContainer}>
                       <Picker
                         selectedValue={type}
                         onValueChange={(itemValue) => setType(itemValue as DocumentType)}
                         style={styles.picker}
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
                   
                   <View style={styles.inputGroup}>
                     <Text style={styles.label}>Statut</Text>
                     <View style={styles.pickerContainer}>
                       <Picker
                         selectedValue={status}
                         onValueChange={(itemValue) => setStatus(itemValue as DocumentStatus)}
                         style={styles.picker}
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
                   
                   <View style={styles.inputGroup}>
                     <Text style={styles.label}>Taux TVA (%)</Text>
                     <TextInput
                       style={styles.input}
                       value={tvaRate}
                       onChangeText={setTvaRate}
                       placeholder="20"
                       keyboardType="decimal-pad"
                     />
                   </View>
                   
                   <View style={styles.inputGroup}>
                     <Text style={styles.label}>Date d'émission *</Text>
                     <TouchableOpacity 
                       style={styles.dateButton}
                       onPress={() => setIssueDatePickerOpen(true)}
                     >
                       <Text style={styles.dateButtonText}>{formatDate(issueDate)}</Text>
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
                   
                   <View style={styles.inputGroup}>
                     <Text style={styles.label}>Date d'échéance</Text>
                     <TouchableOpacity 
                       style={styles.dateButton}
                       onPress={() => setDueDatePickerOpen(true)}
                     >
                       <Text style={styles.dateButtonText}>{dueDate ? formatDate(dueDate) : 'Non définie'}</Text>
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
                   
                   <View style={styles.inputGroup}>
                     <Text style={styles.label}>Notes</Text>
                     <TextInput
                       style={[styles.input, styles.textArea]}
                       value={notes}
                       onChangeText={setNotes}
                       placeholder="Notes ou commentaires supplémentaires"
                       multiline
                       numberOfLines={4}
                     />
                   </View>
                 </View>
              )} 
              
              {type === DocumentType.DEVIS && (
                 <View style={styles.sectionContainer}>
                    <TouchableOpacity 
                      style={styles.sectionHeader} 
                      onPress={() => setIsMaterialsOpen(!isMaterialsOpen)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.sectionTitle}>Matériaux</Text>
                       <Ionicons 
                        name={isMaterialsOpen ? "chevron-up-outline" : "chevron-down-outline"} 
                        size={20} 
                        color="#333" 
                      />
                    </TouchableOpacity>
                    
                    {isMaterialsOpen && (
                       <View style={styles.sectionContent}>
                          <Tableau />
                       </View>
                    )}
                 </View>
              )}
            </ScrollView>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={onClose}
              >
                <Text style={styles.buttonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.submitButton]}
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={[styles.buttonText, styles.submitButtonText]}>
                    Enregistrer
                  </Text>
                )}
              </TouchableOpacity>
            </View>
        </View>
      </View>
    </View>
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
    backgroundColor: '#f9f9f9',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    backgroundColor: '#f9f9f9',
  },
  picker: {
    height: 50,
  },
  dateButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    padding: 10,
    backgroundColor: '#f9f9f9',
  },
  dateButtonText: {
    fontSize: 16,
    color: '#333',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
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
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  sectionTitle: { 
    fontSize: 16, 
    fontWeight: '600', 
    color: '#333',
    marginBottom: 0, 
  },
  sectionContainer: {
    marginTop: 20,
    marginBottom: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#f9f9f9',
    borderRadius: 4,
    marginBottom: 10,
  },
  sectionContent: {
    paddingTop: 10,
    paddingHorizontal: 8,
  },
  subHeader: {
    fontSize: 16,
    fontWeight: '600',
    color: '#444',
    marginTop: 5,
    marginBottom: 15,
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
  },
   addButton: {
    backgroundColor: '#4CAF50',
  },
  changeButton: {
    backgroundColor: '#FF9800',
  },
  clientInfoContainer: {
    padding: 10,
    backgroundColor: '#e3f2fd',
    borderRadius: 4,
    marginTop: 10,
  },
  clientInfoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  clientInfoText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  clientNotesContainer: {
    marginTop: 5,
  },
  clientNotes: {
    fontSize: 14,
    color: '#333',
  },
});

export default DocumentsModal;
