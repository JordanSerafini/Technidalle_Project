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
  ActivityIndicator
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { DocumentType, DocumentStatus } from '@/app/utils/interfaces/document';
import { url as urlConfig } from '@/app/utils/url';

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
  const [amount, setAmount] = useState('');
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
    setAmount('');
    setTvaRate('20');
    setIssueDate(new Date());
    setDueDate(null);
    setNotes('');
    setFilePath('');
    setError(null);
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
    
    console.log("Début de soumission du formulaire");
    
    setLoading(true);
    setError(null);
    
    try {
      // Formatter les dates au format ISO complet (avec heure)
      const formattedIssueDate = new Date(issueDate);
      // S'assurer que l'heure est définie pour éviter des problèmes de timezone
      formattedIssueDate.setHours(12, 0, 0, 0);
      
      let formattedDueDate = null;
      if (dueDate) {
        formattedDueDate = new Date(dueDate);
        formattedDueDate.setHours(12, 0, 0, 0);
      }
      
      const documentData = {
        project_id: projectId || 1,
        client_id: clientId || null,
        type,
        reference,
        status,
        amount: amount ? parseFloat(amount) : null,
        tva_rate: tvaRate ? parseFloat(tvaRate) : null,
        // Utiliser le format ISO complet pour les dates
        issue_date: formattedIssueDate.toISOString(),
        due_date: formattedDueDate ? formattedDueDate.toISOString() : null,
        notes: notes || null,
        file_path: filePath || null
      };
      
      console.log("Données à envoyer:", documentData);
      
      const response = await fetch(`${urlConfig.local}documents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(documentData)
      });
      
      console.log("Statut de la réponse:", response.status);
      
      const responseText = await response.text();
      console.log("Réponse brute:", responseText);
      
      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${responseText}`);
      }
      
      let result;
      try {
        result = JSON.parse(responseText);
        console.log("Document créé avec succès:", result);
      } catch (e) {
        console.warn("Impossible de parser la réponse JSON:", e);
      }
      
      // Afficher un message de succès
      Alert.alert(
        "Succès",
        `Le document "${reference}" a été ajouté avec succès.`,
        [{ 
          text: "OK", 
          onPress: () => {
            if (onSuccess) onSuccess();
            onClose();
          }
        }],
        { cancelable: false }
      );
      
    } catch (err) {
      console.error('Erreur lors de l\'ajout du document:', err);
      
      // Message d'erreur amélioré
      const errorMessage = err instanceof Error 
        ? err.message 
        : "Une erreur inconnue est survenue";
        
      setError(errorMessage);
      
      // Afficher une alerte d'erreur
      Alert.alert(
        "Erreur",
        `Impossible d'ajouter le document:\n${errorMessage}`,
        [{ text: "OK" }],
        { cancelable: false }
      );
    } finally {
      setLoading(false);
    }
  };

  // Si la modale n'est pas visible, ne pas la rendre du tout
  if (!visible) return null;

  return (
    <View style={styles.fullScreenOverlay}>
      <TouchableOpacity 
        style={styles.backdrop} 
        activeOpacity={1} 
        onPress={onClose}
      />
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Ajouter un document</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.formContainer}>
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
          
          {/* Référence */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Référence *</Text>
            <TextInput
              style={styles.input}
              value={reference}
              onChangeText={setReference}
              placeholder="Ex: DEVIS-2023-001"
            />
          </View>
          
          {/* Type de document */}
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
          
          {/* Statut */}
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
          
          {/* Montant */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Montant (€)</Text>
            <TextInput
              style={styles.input}
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              keyboardType="decimal-pad"
            />
          </View>
          
          {/* Taux TVA */}
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
          
          {/* Date d'émission */}
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
          
          {/* Date d'échéance */}
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
          
          {/* Notes */}
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
          
          {/* Boutons d'action */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Annuler</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.button, styles.submitButton, loading && styles.disabledButton]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>Enregistrer</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </View>
  );
};

const statusBarHeight = StatusBar.currentHeight || 0;

const styles = StyleSheet.create({
  fullScreenOverlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    top: 0,
    left: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5000,
    elevation: 20,
  },
  backdrop: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    top: 0,
    left: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
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
  disabledButton: {
    backgroundColor: '#90caf9',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default DocumentsModal;
