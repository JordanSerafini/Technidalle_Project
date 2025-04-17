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
  const [reference, setReference] = useState('');
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
    setReference('');
    setType(DocumentType.DEVIS);
    setStatus(DocumentStatus.BROUILLON);
    setTvaRate('20');
    setIssueDate(new Date());
    setDueDate(null);
    setNotes('');
    setFilePath('');
    setError(null);
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

  // Valider le formulaire
  const validateForm = () => {
    if (!reference.trim()) {
      setError("La référence est obligatoire");
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
      const documentData = {
        project_id: projectId,
        client_id: clientId,
        type,
        reference,
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
              {error && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Référence *</Text>
                <TextInput
                  style={styles.input}
                  value={reference}
                  onChangeText={setReference}
                  placeholder="Ex: DEVIS-2023-001"
                />
              </View>
              
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
              
              {type === DocumentType.DEVIS && (
                <View style={styles.tableauContainer}>
                  <Text style={styles.sectionTitle}>Matériaux</Text>
                  <Tableau />
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
  tableauContainer: {
    marginTop: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
});

export default DocumentsModal;