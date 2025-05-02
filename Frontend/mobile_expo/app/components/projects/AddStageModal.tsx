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
  // Ajoutez d'autres champs si nécessaire (dates spécifiques, heures...)
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
  const [estimatedDuration, setEstimatedDuration] = useState('');
  const [notes, setNotes] = useState('');
  const [assignedStaff, setAssignedStaff] = useState<StaffAssignment[]>([]);

  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

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
    }
  }, [isVisible]);

  const handleDateChange = (event: DateTimePickerEvent, selectedDate: Date | undefined, type: 'start' | 'end') => {
    if (type === 'start') {
      setShowStartDatePicker(false);
      if (selectedDate) {
        setStartDate(selectedDate);
      }
    } else {
      setShowEndDatePicker(false);
      if (selectedDate) {
        setEndDate(selectedDate);
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
        // Garder les infos existantes si possible (ex: roleDescription), sinon ajouter nouveau
        const existingAssignment = assignedStaff.find(as => as.staffId === id);
        newAssignedStaff.push({
          staffId: id,
          staffName: `${staffMember.firstname} ${staffMember.lastname}`,
          roleDescription: existingAssignment?.roleDescription, // Conserver le role si déjà défini
        });
      } else {
         // Staff plus disponible ? Ou erreur ? Log pour investigation
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

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('Le nom de l\'étape est requis.');
      return;
    }
    if (startDate && endDate && endDate < startDate) {
        setError('La date de fin ne peut pas être antérieure à la date de début.');
        return;
      }

    setError(null);
    setIsSubmitting(true);

    const stageData: CreateStageDto = {
      name: name.trim(),
      projectId,
      orderIndex: existingStagesCount, // Calcul simple de l'ordre
      description: description.trim() || undefined,
      startDate: startDate?.toISOString(),
      endDate: endDate?.toISOString(),
      status: StageStatus.NON_COMMENCEE, // Statut par défaut
      estimatedDuration: estimatedDuration ? parseInt(estimatedDuration, 10) : undefined,
      notes: notes.trim() || undefined,
      // completionPercentage est géré par le backend ou mis à jour plus tard
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

          <View className="flex-row justify-between mb-3">
            <View className="flex-1 mr-2">
              <Text className="font-semibold mb-1">Date de début</Text>
              <TouchableOpacity
                onPress={() => setShowStartDatePicker(true)}
                className="border border-gray-300 rounded p-2 bg-gray-50 flex-row justify-between items-center"
              >
                <Text>{startDate ? startDate.toLocaleDateString('fr-FR') : 'Sélectionner...'}</Text>
                <Ionicons name="calendar-outline" size={20} color="gray" />
              </TouchableOpacity>
            </View>
            <View className="flex-1 ml-2">
              <Text className="font-semibold mb-1">Date de fin</Text>
              <TouchableOpacity
                onPress={() => setShowEndDatePicker(true)}
                className="border border-gray-300 rounded p-2 bg-gray-50 flex-row justify-between items-center"
               >
                 <Text>{endDate ? endDate.toLocaleDateString('fr-FR') : 'Sélectionner...'}</Text>
                 <Ionicons name="calendar-outline" size={20} color="gray" />
               </TouchableOpacity>
            </View>
          </View>

           {showStartDatePicker && (
             <DateTimePicker
               value={startDate || new Date()}
               mode="date"
               display="default"
               onChange={(event, date) => handleDateChange(event, date, 'start')}
             />
           )}
           {showEndDatePicker && (
             <DateTimePicker
               value={endDate || startDate || new Date()}
               mode="date"
               display="default"
               minimumDate={startDate} // Empêche de sélectionner une date de fin avant le début
               onChange={(event, date) => handleDateChange(event, date, 'end')}
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

          {/* Section Assignation Personnel */}
          <View className="mt-4 border-t border-gray-200 pt-4">
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-lg font-semibold">Personnel assigné</Text>
              {/* Bouton pour ouvrir le sélecteur de personnel */}
              <TouchableOpacity
                onPress={openStaffSelector} // Ouvre le modal de sélection
                disabled={availableStaff.length === 0}
                className={`py-1 px-3 rounded ${availableStaff.length === 0 ? 'bg-gray-300' : 'bg-blue-500'}`}
              >
                <Text className="text-white font-semibold">Sélectionner...</Text>
              </TouchableOpacity>
            </View>

            {assignedStaff.length === 0 ? (
              <Text className="text-gray-500 italic">Aucun personnel assigné.</Text>
            ) : (
              assignedStaff.map((staff) => (
                <View key={staff.staffId} className="flex-row justify-between items-center bg-gray-100 p-2 rounded mb-1">
                  <Text>{staff.staffName}</Text>
                  {/* Ici on pourrait ajouter des inputs pour roleDescription, etc. */}
                  <TouchableOpacity onPress={() => handleRemoveStaff(staff.staffId)}>
                    <Ionicons name="remove-circle-outline" size={22} color="red" />
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>

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