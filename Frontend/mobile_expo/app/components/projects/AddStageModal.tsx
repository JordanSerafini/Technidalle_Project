import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Platform, Button, FlatList } from 'react-native';
import Modal from 'react-native-modal';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { Staff } from '@/app/utils/interfaces/staff.interface';
import { CreateStageDto, StageStatus } from '@/app/utils/interfaces/stage.interface';

interface StaffAssignment {
  staffId: number;
  staffName: string; // Pour affichage
  roleDescription?: string;
  hoursPlanned?: number; // Ajout des heures planifiées
}

interface AddStageModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSubmit: (stageData: CreateStageDto, staffAssignments: StaffAssignment[]) => Promise<void>;
  projectId: number;
  existingStagesCount: number;
  availableStaff: Staff[]; // Liste du personnel disponible à assigner
}

const AddStageModal: React.FC<AddStageModalProps> = ({
  isVisible,
  onClose,
  onSubmit,
  projectId,
  existingStagesCount,
  availableStaff = [], // Fournir une valeur par défaut
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [startTime, setStartTime] = useState<Date | undefined>(undefined); // État pour l'heure de début
  const [endTime, setEndTime] = useState<Date | undefined>(undefined);     // État pour l'heure de fin
  const [estimatedDuration, setEstimatedDuration] = useState('');
  const [notes, setNotes] = useState('');
  const [assignedStaff, setAssignedStaff] = useState<StaffAssignment[]>([]);

  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false); // Pour afficher le sélecteur d'heure début
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);   // Pour afficher le sélecteur d'heure fin

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // State pour le modal de sélection de personnel
  const [isStaffSelectorVisible, setIsStaffSelectorVisible] = useState(false);
  // State temporaire pour la sélection dans le modal de personnel
  const [tempSelectedStaffIds, setTempSelectedStaffIds] = useState<Set<number>>(new Set());

  // Réinitialiser le formulaire quand le modal s'ouvre
  useEffect(() => {
    if (isVisible) {
      setName('');
      setDescription('');
      setStartDate(undefined);
      setEndDate(undefined);
      setEstimatedDuration('');
      setNotes('');
      setAssignedStaff([]);
      setError(null);
      setIsSubmitting(false);
      setIsStaffSelectorVisible(false); // Fermer aussi le sélecteur de staff
      setTempSelectedStaffIds(new Set());
      setStartTime(undefined); // Réinitialiser l'heure de début
      setEndTime(undefined);   // Réinitialiser l'heure de fin
    }
  }, [isVisible]);

  const handleDateChange = (event: DateTimePickerEvent, selectedDate: Date | undefined, type: 'start' | 'end') => {
    const currentDate = selectedDate || (type === 'start' ? startDate : endDate);
    if (type === 'start') {
      setShowStartDatePicker(false);
      if (event.type === 'set' && currentDate) {
          setStartDate(currentDate);
          // Si l'heure de début n'est pas définie, on la met par défaut (ex: 00:00)
          if (!startTime) {
              const defaultStartTime = new Date(currentDate);
              defaultStartTime.setHours(0, 0, 0, 0);
              setStartTime(defaultStartTime);
          }
      }
    } else { // type === 'end'
      setShowEndDatePicker(false);
      if (event.type === 'set' && currentDate) {
          setEndDate(currentDate);
           // Si l'heure de fin n'est pas définie, on la met par défaut (ex: 00:00)
          if (!endTime) {
              const defaultEndTime = new Date(currentDate);
              defaultEndTime.setHours(0, 0, 0, 0);
              setEndTime(defaultEndTime);
          }
      }
    }
  };

  // Nouvelle fonction pour gérer le changement d'heure
  const handleTimeChange = (event: DateTimePickerEvent, selectedTime: Date | undefined, type: 'start' | 'end') => {
    const currentTime = selectedTime || (type === 'start' ? startTime : endTime);
    if (type === 'start') {
        setShowStartTimePicker(false);
        if (event.type === 'set' && currentTime) {
            setStartTime(currentTime);
        }
    } else { // type === 'end'
        setShowEndTimePicker(false);
        if (event.type === 'set' && currentTime) {
            setEndTime(currentTime);
        }
    }
  };

  const handleAddStaff = (staff: Staff) => {
    // OBSOLETE - La logique est déplacée vers le modal de sélection
    console.log("Utiliser le bouton 'Sélectionner Personnel'");
  };

  const handleRemoveStaff = (staffId: number) => {
    setAssignedStaff(assignedStaff.filter(s => s.staffId !== staffId));
  };

  // --- Logique pour le modal de sélection de personnel ---
  const openStaffSelector = () => {
    // Initialiser la sélection temporaire avec le personnel déjà assigné
    setTempSelectedStaffIds(new Set(assignedStaff.map(s => s.staffId)));
    setIsStaffSelectorVisible(true);
  };

  const toggleStaffSelection = (staffId: number) => {
    setTempSelectedStaffIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(staffId)) {
        newSet.delete(staffId);
      } else {
        newSet.add(staffId);
      }
      return newSet;
    });
  };

  const confirmStaffSelection = () => {
    const newAssignedStaff: StaffAssignment[] = [];
    tempSelectedStaffIds.forEach(id => {
      const staffMember = availableStaff.find(s => s.id === id);
      if (staffMember) {
        const existingAssignment = assignedStaff.find(as => as.staffId === id);
        newAssignedStaff.push({
          staffId: id,
          staffName: `${staffMember.firstname} ${staffMember.lastname}`,
          roleDescription: existingAssignment?.roleDescription, // Conserver le role
          hoursPlanned: existingAssignment?.hoursPlanned, 
        });
      } else {
         console.warn(`Staff ID ${id} sélectionné mais non trouvé dans availableStaff.`);
      }
    });
    setAssignedStaff(newAssignedStaff);
    setIsStaffSelectorVisible(false);
  };

  const cancelStaffSelection = () => {
    setTempSelectedStaffIds(new Set()); // Réinitialiser la sélection temporaire
    setIsStaffSelectorVisible(false);
  };
  // --- Fin logique modal sélection --- 

  // Fonction pour mettre à jour les heures planifiées pour un membre spécifique
  const handleHoursChange = (staffId: number, text: string) => {
    const hours = parseInt(text, 10);
    setAssignedStaff(prevStaff =>
      prevStaff.map(staff =>
        staff.staffId === staffId
          ? { ...staff, hoursPlanned: !isNaN(hours) ? hours : undefined } // Mettre undefined si non numérique
          : staff
      )
    );
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('Le nom de l\'étape est requis.');
      return;
    }
    if (startDate && endDate && endDate < startDate) {
        setError('La date de fin ne peut pas être antérieure à la date de début.');
        return;
    }
    // Validation heure début/fin si les deux sont définies sur la même date
    if (startDate && endDate && startTime && endTime && startDate.toDateString() === endDate.toDateString() && endTime < startTime) {
        setError('L\'heure de fin ne peut pas être antérieure à l\'heure de début pour le même jour.');
        return;
    }

    setError(null);
    setIsSubmitting(true);

    // Combinaison Date et Heure avant l'envoi
    const combineDateTime = (date?: Date, time?: Date): string | undefined => {
        if (!date) return undefined;
        const combined = new Date(date);
        if (time) {
            combined.setHours(time.getHours());
            combined.setMinutes(time.getMinutes());
            combined.setSeconds(time.getSeconds());
            combined.setMilliseconds(time.getMilliseconds());
        }
        return combined.toISOString();
    };

    const stageData: CreateStageDto = {
      name: name.trim(),
      projectId,
      orderIndex: existingStagesCount,
      description: description.trim() || undefined,
      startDate: combineDateTime(startDate, startTime), // Combiner date et heure
      endDate: combineDateTime(endDate, endTime),     // Combiner date et heure
      status: StageStatus.NON_COMMENCEE,
      estimatedDuration: estimatedDuration ? parseInt(estimatedDuration, 10) : undefined,
      notes: notes.trim() || undefined,
    };

    try {
      await onSubmit(stageData, assignedStaff);
      onClose(); // Fermer le modal en cas de succès
    } catch (err) {
      console.error("Erreur lors de la soumission de l'étape:", err);
      setError('Une erreur est survenue lors de l\'ajout de l\'étape.');
      // Ne pas fermer le modal en cas d'erreur pour que l'utilisateur puisse voir le message
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Rendu du Modal de Sélection de Personnel ---
  const renderStaffSelectorModal = () => (
      <Modal
        isVisible={isStaffSelectorVisible}
        onBackdropPress={cancelStaffSelection}
        onBackButtonPress={cancelStaffSelection}
        style={{ margin: 20, justifyContent: 'center' }}
      >
        <View className="bg-white p-5 rounded-lg max-h-[70vh]">
          <Text className="text-xl font-bold mb-4">Sélectionner le personnel</Text>
          <FlatList
            data={availableStaff}
            keyExtractor={(item: any) => item.id.toString()}
            renderItem={({ item }: { item: Staff }) => (
              <TouchableOpacity
                onPress={() => toggleStaffSelection(item.id)}
                className="flex-row items-center justify-between p-3 border-b border-gray-200"
              >
                <Text>{`${item.firstname} ${item.lastname}`}</Text>
                <Ionicons
                  name={tempSelectedStaffIds.has(item.id) ? 'checkbox' : 'square-outline'}
                  size={24}
                  color={tempSelectedStaffIds.has(item.id) ? '#2563eb' : 'gray'}
                />
              </TouchableOpacity>
            )}
            ListEmptyComponent={<Text className="text-center text-gray-500 my-4">Aucun personnel disponible.</Text>}
            className="mb-4"
          />
          <View className="flex-row justify-end space-x-4">
            <TouchableOpacity
               onPress={cancelStaffSelection}
               className="py-2 px-4 rounded bg-gray-300"
             >
               <Text>Annuler</Text>
             </TouchableOpacity>
            <TouchableOpacity
              onPress={confirmStaffSelection}
              className="py-2 px-4 rounded bg-blue-600"
            >
              <Text className="text-white font-semibold">Valider</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );

  return (
    <Modal
      isVisible={isVisible}
      onBackdropPress={onClose}
      onBackButtonPress={onClose}
      avoidKeyboard={Platform.OS === 'ios'}
      style={{ justifyContent: 'flex-end', margin: 0 }}
    >
      <View className="bg-white p-5 rounded-t-lg max-h-[85vh]">
        <ScrollView showsVerticalScrollIndicator={false}>
          <View className="flex-row justify-between items-center mb-4">
             <Text className="text-xl font-bold">Ajouter une étape</Text>
             <TouchableOpacity onPress={onClose}>
               <Ionicons name="close-circle" size={28} color="gray" />
             </TouchableOpacity>
           </View>

          {error && <Text className="text-red-500 mb-3">{error}</Text>}

          <Text className="font-semibold mb-1">Nom de l'étape *</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Ex: Préparation du terrain"
            className="border border-gray-300 rounded p-2 mb-3 bg-gray-50"
          />

          <Text className="font-semibold mb-1">Description</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Détails sur l'étape..."
            multiline
            numberOfLines={3}
            className="border border-gray-300 rounded p-2 mb-3 h-20 bg-gray-50"
            textAlignVertical="top"
          />

          {/* Sélecteurs Date/Heure Début */}
          <View className="flex-row justify-between mb-3">
            <View className="flex-1 mr-1">
              <Text className="font-semibold mb-1">Date de début</Text>
              <TouchableOpacity
                onPress={() => setShowStartDatePicker(true)}
                className="border border-gray-300 rounded p-2 bg-gray-50 flex-row justify-between items-center h-10"
              >
                <Text className="text-sm">{startDate ? startDate.toLocaleDateString('fr-FR') : 'Sélec. Date'}</Text>
                <Ionicons name="calendar-outline" size={18} color="gray" />
              </TouchableOpacity>
            </View>
            <View className="flex-1 ml-1">
                <Text className="font-semibold mb-1">Heure début</Text>
                <TouchableOpacity
                    onPress={() => setShowStartTimePicker(true)}
                    className="border border-gray-300 rounded p-2 bg-gray-50 flex-row justify-between items-center h-10"
                    disabled={!startDate} // Désactiver si pas de date de début
                >
                    <Text className="text-sm">{startTime ? startTime.toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'}) : 'Sélec. Heure'}</Text>
                    <Ionicons name="time-outline" size={18} color={startDate ? "gray" : "#d1d5db"} />
                </TouchableOpacity>
            </View>
          </View>

           {/* Sélecteurs Date/Heure Fin */}
           <View className="flex-row justify-between mb-3">
            <View className="flex-1 mr-1">
              <Text className="font-semibold mb-1">Date de fin</Text>
              <TouchableOpacity
                onPress={() => setShowEndDatePicker(true)}
                className="border border-gray-300 rounded p-2 bg-gray-50 flex-row justify-between items-center h-10"
               >
                 <Text className="text-sm">{endDate ? endDate.toLocaleDateString('fr-FR') : 'Sélec. Date'}</Text>
                 <Ionicons name="calendar-outline" size={18} color="gray" />
               </TouchableOpacity>
            </View>
             <View className="flex-1 ml-1">
                <Text className="font-semibold mb-1">Heure fin</Text>
                <TouchableOpacity
                    onPress={() => setShowEndTimePicker(true)}
                    className="border border-gray-300 rounded p-2 bg-gray-50 flex-row justify-between items-center h-10"
                    disabled={!endDate} // Désactiver si pas de date de fin
                >
                    <Text className="text-sm">{endTime ? endTime.toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'}) : 'Sélec. Heure'}</Text>
                    <Ionicons name="time-outline" size={18} color={endDate ? "gray" : "#d1d5db"} />
                </TouchableOpacity>
            </View>
          </View>

           {/* Afficheurs DateTimePicker pour Date Début/Fin */}
           {showStartDatePicker && (
             <DateTimePicker
               value={startDate || new Date()} // Fournir une valeur par défaut
               mode="date"
               display="default"
               onChange={(event, date) => handleDateChange(event, date, 'start')}
             />
           )}
           {showEndDatePicker && (
             <DateTimePicker
               value={endDate || startDate || new Date()} // Fournir une valeur par défaut
               mode="date"
               display="default"
               minimumDate={startDate} // Empêche de sélectionner une date de fin avant le début
               onChange={(event, date) => handleDateChange(event, date, 'end')}
             />
           )}
           {/* Nouveaux Afficheurs DateTimePicker pour Heure Début/Fin */}
            {showStartTimePicker && (
             <DateTimePicker
               value={startTime || new Date(0, 0, 0, 0, 0, 0)} // Fournir une valeur par défaut (00:00)
               mode="time"
               display="default"
               is24Hour={true}
               onChange={(event, time) => handleTimeChange(event, time, 'start')}
             />
           )}
           {showEndTimePicker && (
             <DateTimePicker
               value={endTime || new Date(0, 0, 0, 0, 0, 0)} // Fournir une valeur par défaut (00:00)
               mode="time"
               display="default"
               // Ajout d'une logique simple pour minimumTime si même jour
               minimumDate={startDate && endDate && startTime && startDate.toDateString() === endDate.toDateString() ? startTime : undefined}
               onChange={(event, time) => handleTimeChange(event, time, 'end')}
             />
           )}

          <Text className="font-semibold mb-1">Durée estimée (jours)</Text>
          <TextInput
            value={estimatedDuration}
            onChangeText={setEstimatedDuration}
            placeholder="Ex: 5"
            keyboardType="numeric"
            className="border border-gray-300 rounded p-2 mb-3 bg-gray-50"
          />

          <Text className="font-semibold mb-1">Notes</Text>
           <TextInput
             value={notes}
             onChangeText={setNotes}
             placeholder="Informations supplémentaires..."
             multiline
             className="border border-gray-300 rounded p-2 mb-3 h-20 bg-gray-50"
             textAlignVertical="top"
           />

          {/* Section Personnel Assigné */}
          <Text className="font-semibold mb-2 mt-3">Personnel assigné</Text>
          <TouchableOpacity
            onPress={openStaffSelector}
            className="bg-blue-100 p-3 rounded-lg mb-3 flex-row items-center justify-center"
          >
            <Ionicons name="people-outline" size={20} color="#2563eb" />
            <Text className="text-blue-600 font-semibold ml-2">Sélectionner Personnel</Text>
          </TouchableOpacity>

          {/* Liste du personnel assigné avec champ pour les heures */}
          {assignedStaff.length > 0 && (
            <View className="mb-3">
              {assignedStaff.map(staff => (
                <View key={staff.staffId} className="flex-row items-center justify-between bg-gray-100 p-2 rounded mb-1">
                  <Text className="flex-1 mr-2">{staff.staffName}</Text>
                  <TextInput
                    placeholder="H Plan."
                    keyboardType="numeric"
                    value={staff.hoursPlanned !== undefined ? String(staff.hoursPlanned) : ''} // Afficher vide si undefined
                    onChangeText={(text) => handleHoursChange(staff.staffId, text)}
                    className="border border-gray-300 rounded p-1 w-20 text-center bg-white"
                  />
                  <TouchableOpacity onPress={() => handleRemoveStaff(staff.staffId)} className="ml-2">
                    <Ionicons name="remove-circle" size={22} color="red" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={isSubmitting}
            className={`mt-6 py-3 rounded-lg ${isSubmitting ? 'bg-blue-300' : 'bg-blue-600'}`}
          >
            <Text className="text-white text-center font-bold text-lg">
              {isSubmitting ? 'Ajout en cours...' : 'Ajouter l\'étape'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
      {/* Inclusion du modal de sélection de personnel */}
      {renderStaffSelectorModal()}
    </Modal>
  );
};

export default AddStageModal; 