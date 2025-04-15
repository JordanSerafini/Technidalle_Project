import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
  Switch,
  KeyboardAvoidingView,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { EventType, AppEvent, createEvent, updateEvent } from '../../services/eventsService';

interface CreateEventModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (success: boolean) => void;
  editEvent?: AppEvent | null;
}

const EVENT_TYPES: { value: EventType; label: string }[] = [
  { value: 'appel_telephonique', label: 'Appel téléphonique' },
  { value: 'reunion_chantier', label: 'Réunion de chantier' },
  { value: 'visite_technique', label: 'Visite technique' },
  { value: 'rendez_vous_client', label: 'Rendez-vous client' },
  { value: 'reunion_interne', label: 'Réunion interne' },
  { value: 'formation', label: 'Formation' },
  { value: 'livraison_materiaux', label: 'Livraison matériaux' },
  { value: 'intervention_urgente', label: 'Intervention urgente' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'autre', label: 'Autre' }
];

const CreateEventModal: React.FC<CreateEventModalProps> = ({
  visible,
  onClose,
  onSave,
  editEvent
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventType, setEventType] = useState<EventType>('autre');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date(Date.now() + 60 * 60 * 1000)); // +1h par défaut
  const [allDay, setAllDay] = useState(false);
  const [location, setLocation] = useState('');
  const [projectId, setProjectId] = useState('');
  const [staffId, setStaffId] = useState('');
  const [clientId, setClientId] = useState('');
  
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [datePickerMode, setDatePickerMode] = useState<'date' | 'time'>('date');
  const [activeDateField, setActiveDateField] = useState<'start' | 'end'>('start');
  
  useEffect(() => {
    if (visible) {
      if (editEvent) {
        setIsEditing(true);
        setTitle(editEvent.title || '');
        setDescription(editEvent.description || '');
        setEventType(editEvent.event_type || 'autre');
        setStartDate(new Date(editEvent.start));
        setEndDate(new Date(editEvent.end));
        setAllDay(!!editEvent.all_day);
        setLocation(editEvent.location || '');
        setProjectId(editEvent.project_id?.toString() || '');
        setStaffId(editEvent.staff_id?.toString() || '');
        setClientId(editEvent.client_id?.toString() || '');
      } else {
        resetForm();
      }
    }
  }, [visible, editEvent]);
  
  const resetForm = () => {
    setIsEditing(false);
    setTitle('');
    setDescription('');
    setEventType('autre');
    
    const now = new Date();
    const nextHour = new Date(now);
    nextHour.setHours(now.getHours() + 1);
    nextHour.setMinutes(0);
    nextHour.setSeconds(0);
    nextHour.setMilliseconds(0);
    
    setStartDate(nextHour);
    
    const endTime = new Date(nextHour);
    endTime.setHours(endTime.getHours() + 1);
    setEndDate(endTime);
    
    setAllDay(false);
    setLocation('');
    setProjectId('');
    setStaffId('');
    setClientId('');
  };
  
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };
  
  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowStartDatePicker(false);
      setShowEndDatePicker(false);
    }
    
    if (selectedDate) {
      if (activeDateField === 'start') {
        if (datePickerMode === 'date') {
          const newDate = new Date(selectedDate);
          newDate.setHours(startDate.getHours(), startDate.getMinutes());
          setStartDate(newDate);
          
          if (newDate > endDate) {
            const newEndDate = new Date(newDate);
            newEndDate.setHours(newEndDate.getHours() + 1);
            setEndDate(newEndDate);
          }
        } else {
          const newDate = new Date(startDate);
          newDate.setHours(selectedDate.getHours(), selectedDate.getMinutes());
          setStartDate(newDate);
          
          if (newDate > endDate) {
            const newEndDate = new Date(newDate);
            newEndDate.setHours(newEndDate.getHours() + 1);
            setEndDate(newEndDate);
          }
        }
      } else {
        if (datePickerMode === 'date') {
          const newDate = new Date(selectedDate);
          newDate.setHours(endDate.getHours(), endDate.getMinutes());
          
          if (newDate < startDate) {
            Alert.alert("Erreur", "La date de fin ne peut pas être antérieure à la date de début");
            return;
          }
          
          setEndDate(newDate);
        } else {
          const newDate = new Date(endDate);
          newDate.setHours(selectedDate.getHours(), selectedDate.getMinutes());
          
          if (newDate < startDate) {
            Alert.alert("Erreur", "L'heure de fin ne peut pas être antérieure à l'heure de début");
            return;
          }
          
          setEndDate(newDate);
        }
      }
    }
  };
  
  const showDatePicker = (mode: 'date' | 'time', field: 'start' | 'end') => {
    setDatePickerMode(mode);
    setActiveDateField(field);
    
    if (field === 'start') {
      setShowStartDatePicker(true);
      setShowEndDatePicker(false);
    } else {
      setShowStartDatePicker(false);
      setShowEndDatePicker(true);
    }
  };
  
  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert("Erreur", "Le titre est obligatoire");
      return;
    }
    
    if (endDate <= startDate) {
      Alert.alert("Erreur", "La date/heure de fin doit être postérieure à la date/heure de début");
      return;
    }
    
    setLoading(true);
    
    try {
      const eventData: Partial<AppEvent> = {
        title,
        description,
        start: startDate,
        end: endDate,
        event_type: eventType,
        all_day: allDay,
        location,
      };
      
      if (projectId.trim()) {
        eventData.project_id = parseInt(projectId);
      }
      
      if (staffId.trim()) {
        eventData.staff_id = parseInt(staffId);
      }
      
      if (clientId.trim()) {
        eventData.client_id = parseInt(clientId);
      }
      
      let success = false;
      
      if (isEditing && editEvent) {
        success = await updateEvent(editEvent.id, eventData);
      } else {
        success = await createEvent(eventData);
      }
      
      if (success) {
        onSave(true);
      } else {
        Alert.alert(
          "Erreur", 
          `Impossible de ${isEditing ? 'modifier' : 'créer'} l'événement`
        );
        onSave(false);
      }
    } catch (error) {
      console.error("Erreur lors de la création/modification de l'événement:", error);
      Alert.alert(
        "Erreur", 
        `Une erreur est survenue lors de la ${isEditing ? 'modification' : 'création'} de l'événement`
      );
      onSave(false);
    } finally {
      setLoading(false);
    }
  };
  
  const handleClose = () => {
    onClose();
  };
  
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.centeredView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.modalView}>
          <View style={styles.header}>
            <Text style={styles.modalTitle}>
              {isEditing ? 'Modifier un événement' : 'Nouvel événement'}
            </Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.formContainer}>
            <Text style={styles.label}>Titre *</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Titre de l'événement"
              placeholderTextColor="#999"
            />
            
            <Text style={styles.label}>Type d'événement</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={eventType}
                onValueChange={(itemValue) => setEventType(itemValue as EventType)}
                style={styles.picker}
              >
                {EVENT_TYPES.map((type) => (
                  <Picker.Item key={type.value} label={type.label} value={type.value} />
                ))}
              </Picker>
            </View>
            
            <Text style={styles.label}>Date et heure de début *</Text>
            <View style={styles.dateRow}>
              <TouchableOpacity 
                style={styles.dateButton}
                onPress={() => showDatePicker('date', 'start')}
              >
                <Text style={styles.dateButtonText}>{formatDate(startDate)}</Text>
                <Ionicons name="calendar" size={20} color="#4291EF" />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.dateButton}
                onPress={() => showDatePicker('time', 'start')}
                disabled={allDay}
              >
                <Text 
                  style={[
                    styles.dateButtonText, 
                    allDay && styles.disabledText
                  ]}
                >
                  {allDay ? '00:00' : formatTime(startDate)}
                </Text>
                <Ionicons name="time" size={20} color={allDay ? '#999' : '#4291EF'} />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.label}>Date et heure de fin *</Text>
            <View style={styles.dateRow}>
              <TouchableOpacity 
                style={styles.dateButton}
                onPress={() => showDatePicker('date', 'end')}
              >
                <Text style={styles.dateButtonText}>{formatDate(endDate)}</Text>
                <Ionicons name="calendar" size={20} color="#4291EF" />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.dateButton}
                onPress={() => showDatePicker('time', 'end')}
                disabled={allDay}
              >
                <Text 
                  style={[
                    styles.dateButtonText, 
                    allDay && styles.disabledText
                  ]}
                >
                  {allDay ? '23:59' : formatTime(endDate)}
                </Text>
                <Ionicons name="time" size={20} color={allDay ? '#999' : '#4291EF'} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.switchRow}>
              <Text style={styles.label}>Journée entière</Text>
              <Switch
                value={allDay}
                onValueChange={(value) => {
                  setAllDay(value);
                  if (value) {
                    const newStart = new Date(startDate);
                    newStart.setHours(0, 0, 0, 0);
                    setStartDate(newStart);
                    
                    const newEnd = new Date(endDate);
                    newEnd.setHours(23, 59, 0, 0);
                    setEndDate(newEnd);
                  }
                }}
                trackColor={{ false: '#ccc', true: '#81b0ff' }}
                thumbColor={allDay ? '#4291EF' : '#f4f3f4'}
              />
            </View>
            
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Description de l'événement"
              placeholderTextColor="#999"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            
            <Text style={styles.label}>Lieu</Text>
            <TextInput
              style={styles.input}
              value={location}
              onChangeText={setLocation}
              placeholder="Lieu de l'événement"
              placeholderTextColor="#999"
            />
            
            <Text style={styles.label}>ID du projet (optionnel)</Text>
            <TextInput
              style={styles.input}
              value={projectId}
              onChangeText={setProjectId}
              placeholder="ID du projet associé"
              placeholderTextColor="#999"
              keyboardType="numeric"
            />
            
            <Text style={styles.label}>ID du personnel (optionnel)</Text>
            <TextInput
              style={styles.input}
              value={staffId}
              onChangeText={setStaffId}
              placeholder="ID du membre du personnel associé"
              placeholderTextColor="#999"
              keyboardType="numeric"
            />
            
            <Text style={styles.label}>ID du client (optionnel)</Text>
            <TextInput
              style={styles.input}
              value={clientId}
              onChangeText={setClientId}
              placeholder="ID du client associé"
              placeholderTextColor="#999"
              keyboardType="numeric"
            />
            
            <View style={styles.buttonsContainer}>
              <TouchableOpacity 
                style={[styles.button, styles.cancelButton]} 
                onPress={handleClose}
                disabled={loading}
              >
                <Text style={styles.buttonText}>Annuler</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.button, styles.saveButton]} 
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>
                    {isEditing ? 'Modifier' : 'Créer'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
          
          {(showStartDatePicker || showEndDatePicker) && (
            <DateTimePicker
              value={activeDateField === 'start' ? startDate : endDate}
              mode={datePickerMode}
              is24Hour={true}
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleDateChange}
              minimumDate={activeDateField === 'end' ? startDate : undefined}
            />
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)'
  },
  modalView: {
    width: '90%',
    maxHeight: '90%',
    backgroundColor: 'white',
    borderRadius: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold'
  },
  closeButton: {
    padding: 5
  },
  formContainer: {
    padding: 15
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 10,
    marginBottom: 5
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    fontSize: 16,
    backgroundColor: '#f9f9f9'
  },
  textArea: {
    height: 100
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    backgroundColor: '#f9f9f9'
  },
  picker: {
    height: 50
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  dateButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    flex: 0.48,
    backgroundColor: '#f9f9f9'
  },
  dateButtonText: {
    fontSize: 16
  },
  disabledText: {
    color: '#999'
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 10
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 30
  },
  button: {
    padding: 15,
    borderRadius: 5,
    flex: 0.48,
    alignItems: 'center'
  },
  cancelButton: {
    backgroundColor: '#f2f2f2'
  },
  saveButton: {
    backgroundColor: '#4291EF'
  },
  buttonText: {
    fontWeight: 'bold',
    color: '#333'
  }
});

export default CreateEventModal; 