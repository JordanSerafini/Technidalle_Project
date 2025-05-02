import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Modal, TextInput, ScrollView, Alert } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useFetch } from '../../../hooks/useFetch';
import { ProjectStaff as ProjectStaffInterface, Staff } from '@/app/utils/interfaces/staff.interface';
import AccordionItem from '../../../components/AccordionItem';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import url from '@/app/utils/url';

interface ProjectStaffProps {
  projectId: string | number;
  isOpen: boolean;
  onToggle: () => void;
}

export const ProjectStaff: React.FC<ProjectStaffProps> = ({
  projectId,
  isOpen,
  onToggle
}) => {
  const [isAddStaffModalVisible, setIsAddStaffModalVisible] = useState(false);
  const [availableStaff, setAvailableStaff] = useState<Staff[]>([]);
  const [isLoadingStaff, setIsLoadingStaff] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<number | null>(null);
  const [roleDescription, setRoleDescription] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [hoursPlanned, setHoursPlanned] = useState('');
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Hook useFetch avec clé de rafraîchissement pour recharger les données
  const { data: staff, loading, error } = useFetch<ProjectStaffInterface[]>(
    `resources/projects/${projectId}/staff?refresh=${refreshKey}`,
    {
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'no-cache',
      }
    }
  );

  // Récupérer la liste du personnel disponible
  useEffect(() => {
    const fetchStaff = async () => {
      if (!isAddStaffModalVisible) return;
      
      try {
        setIsLoadingStaff(true);
        const response = await fetch(`${url.local}resources/staff`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          }
        });
        
        if (!response.ok) {
          throw new Error(`Erreur HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        setAvailableStaff(data);
      } catch (error) {
        console.error('Erreur lors de la récupération du personnel:', error);
        // Fallback avec des données fictives pour le développement
        setAvailableStaff([
          { id: 1, firstname: 'Jean', lastname: 'Dupont', email: 'jean@example.com', role_id: 1, hire_date: new Date('2020-01-01') },
          { id: 2, firstname: 'Marie', lastname: 'Martin', email: 'marie@example.com', role_id: 2, hire_date: new Date('2021-03-15') },
          { id: 3, firstname: 'Pierre', lastname: 'Durand', email: 'pierre@example.com', role_id: 3, hire_date: new Date('2022-06-30') }
        ]);
      } finally {
        setIsLoadingStaff(false);
      }
    };

    fetchStaff();
  }, [isAddStaffModalVisible]);

  const handleAddStaff = () => {
    setIsAddStaffModalVisible(true);
  };

  const handleCloseModal = () => {
    setIsAddStaffModalVisible(false);
    resetForm();
  };

  const resetForm = () => {
    setSelectedStaff(null);
    setRoleDescription('');
    setStartDate(new Date());
    setEndDate(null);
    setHoursPlanned('');
  };

  const handleSubmit = async () => {
    if (!selectedStaff) {
      Alert.alert('Erreur', 'Veuillez sélectionner un membre du personnel');
      return;
    }

    try {
      const response = await fetch(`${url.local}events/assign-staff`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          projectId: Number(projectId),
          staffId: selectedStaff,
          roleDescription: roleDescription || undefined,
          startDate: startDate.toISOString(),
          endDate: endDate ? endDate.toISOString() : undefined,
          hoursPlanned: hoursPlanned ? Number(hoursPlanned) : undefined,
        }),
      });

      if (!response.ok) {
        throw new Error(`Erreur lors de l'assignation: ${response.status}`);
      }

      // Fermer le modal et rafraîchir les données
      handleCloseModal();
      setRefreshKey(prevKey => prevKey + 1);
      Alert.alert('Succès', 'Personnel assigné avec succès au projet');
    } catch (error) {
      console.error('Erreur lors de l\'assignation du personnel:', error);
      Alert.alert('Erreur', 'Une erreur est survenue lors de l\'assignation du personnel');
    }
  };

  const handleRemoveStaff = async (assignmentId: number) => {
    Alert.alert(
      'Confirmation',
      'Voulez-vous vraiment retirer ce membre du personnel du projet ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(`${url.local}events/remove-staff-assignment/${assignmentId}`, {
                method: 'DELETE',
                headers: {
                  'Accept': 'application/json',
                },
              });

              if (!response.ok) {
                throw new Error(`Erreur lors de la suppression: ${response.status}`);
              }

              // Rafraîchir les données
              setRefreshKey(prevKey => prevKey + 1);
              Alert.alert('Succès', 'Personnel retiré avec succès du projet');
            } catch (error) {
              console.error('Erreur lors du retrait du personnel:', error);
              Alert.alert('Erreur', 'Une erreur est survenue lors du retrait du personnel');
            }
          },
        },
      ]
    );
  };

  return (
    <View className="bg-white m-4 p-4 rounded-lg shadow-sm">
      <TouchableOpacity 
        className="flex-row justify-between items-center p-2"
        onPress={onToggle}
        activeOpacity={0.7}
        hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
      >
        <View className="flex-row items-center">
          <MaterialIcons name="people" size={22} color="#1e40af" className="mr-2" />
          <Text className="text-lg font-bold ml-2">Personnel</Text>
        </View>
        <Ionicons 
          name={isOpen ? "chevron-up" : "chevron-down"} 
          size={24} 
          color="#2563eb" 
        />
      </TouchableOpacity>
      
      <AccordionItem isExpanded={isOpen}>
        <View className="mt-4">
          {loading ? (
            <ActivityIndicator size="small" color="#2563eb" />
          ) : error ? (
            <Text className="text-red-500">Erreur lors du chargement du personnel</Text>
          ) : staff && staff.length > 0 ? (
            <>
              {staff.map((member) => (
                <View key={member.id} className="border-b border-gray-100 py-2">
                  {member.staff ? (
                    <>
                      <View className="flex-row justify-between items-center">
                        <Text className="font-semibold">{member.staff.firstname} {member.staff.lastname}</Text>
                        <View className="flex-row">
                          {member.role_description && (
                            <View className="bg-blue-100 px-2 py-1 rounded-full mr-2">
                              <Text className="text-blue-800 text-xs">{member.role_description}</Text>
                            </View>
                          )}
                          <TouchableOpacity 
                            onPress={() => handleRemoveStaff(member.id)}
                            className="bg-red-100 p-1 rounded-full"
                          >
                            <Ionicons name="close-circle" size={18} color="#991b1b" />
                          </TouchableOpacity>
                        </View>
                      </View>
                      
                      {(member.start_date || member.end_date) && (
                        <Text className="text-gray-500 text-sm mt-1">
                          {member.start_date ? new Date(member.start_date).toLocaleDateString('fr-FR') : ''}
                          {member.end_date ? ` → ${new Date(member.end_date).toLocaleDateString('fr-FR')}` : ''}
                        </Text>
                      )}
                      
                      {member.hours_planned && (
                        <Text className="text-blue-700 text-sm mt-1">
                          Heures prévues: {member.hours_planned}h
                        </Text>
                      )}
                    </>
                  ) : (
                    <Text className="text-gray-500">Personnel non disponible</Text>
                  )}
                </View>
              ))}
              
              <TouchableOpacity 
                className="mt-4 bg-blue-50 p-2 rounded-lg flex-row justify-center items-center border border-blue-200"
                onPress={handleAddStaff}
              >
                <Ionicons name="add-circle-outline" size={18} color="#2563eb" />
                <Text className="ml-2 text-blue-700 font-medium">Ajouter du personnel</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text className="text-gray-500 mb-4">Aucun personnel associé à ce projet</Text>
              <TouchableOpacity 
                className="bg-blue-50 p-2 rounded-lg flex-row justify-center items-center border border-blue-200"
                onPress={handleAddStaff}
              >
                <Ionicons name="add-circle-outline" size={18} color="#2563eb" />
                <Text className="ml-2 text-blue-700 font-medium">Ajouter du personnel</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </AccordionItem>

      {/* Modal d'ajout de personnel */}
      <Modal
        visible={isAddStaffModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCloseModal}
      >
        <View className="flex-1 justify-center items-center bg-black bg-opacity-50">
          <View className="bg-white w-5/6 rounded-xl p-6 max-h-5/6">
            <Text className="text-xl font-bold mb-4 text-center">Ajouter du personnel</Text>
            
            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
              {isLoadingStaff ? (
                <ActivityIndicator size="small" color="#2563eb" />
              ) : (
                <>
                  <Text className="font-medium mb-2">Membre du personnel :</Text>
                  <View className="border border-gray-300 rounded-md mb-4">
                    <Picker
                      selectedValue={selectedStaff}
                      onValueChange={(value) => setSelectedStaff(value)}
                    >
                      <Picker.Item label="Sélectionner un membre..." value={null} />
                      {availableStaff.map((member) => (
                        <Picker.Item 
                          key={member.id}
                          label={`${member.firstname} ${member.lastname}`}
                          value={member.id}
                        />
                      ))}
                    </Picker>
                  </View>
                  
                  <Text className="font-medium mb-2">Rôle / Description :</Text>
                  <TextInput
                    className="border border-gray-300 rounded-md p-2 mb-4"
                    value={roleDescription}
                    onChangeText={setRoleDescription}
                    placeholder="Ex: Chef de chantier, Technicien..."
                  />
                  
                  <Text className="font-medium mb-2">Date de début :</Text>
                  <TouchableOpacity 
                    className="border border-gray-300 rounded-md p-3 mb-4 flex-row justify-between items-center"
                    onPress={() => setShowStartDatePicker(true)}
                  >
                    <Text>{startDate.toLocaleDateString('fr-FR')}</Text>
                    <Ionicons name="calendar-outline" size={20} color="#666" />
                  </TouchableOpacity>
                  
                  {showStartDatePicker && (
                    <DateTimePicker
                      value={startDate}
                      mode="date"
                      display="default"
                      onChange={(event, selectedDate) => {
                        setShowStartDatePicker(false);
                        if (selectedDate) {
                          setStartDate(selectedDate);
                        }
                      }}
                    />
                  )}
                  
                  <Text className="font-medium mb-2">Date de fin (optionnelle) :</Text>
                  <TouchableOpacity 
                    className="border border-gray-300 rounded-md p-3 mb-4 flex-row justify-between items-center"
                    onPress={() => setShowEndDatePicker(true)}
                  >
                    <Text>{endDate ? endDate.toLocaleDateString('fr-FR') : 'Non définie'}</Text>
                    <Ionicons name="calendar-outline" size={20} color="#666" />
                  </TouchableOpacity>
                  
                  {showEndDatePicker && (
                    <DateTimePicker
                      value={endDate || new Date()}
                      mode="date"
                      display="default"
                      onChange={(event, selectedDate) => {
                        setShowEndDatePicker(false);
                        if (selectedDate) {
                          setEndDate(selectedDate);
                        }
                      }}
                    />
                  )}
                  
                  <Text className="font-medium mb-2">Heures prévues (optionnel) :</Text>
                  <TextInput
                    className="border border-gray-300 rounded-md p-2 mb-4"
                    value={hoursPlanned}
                    onChangeText={setHoursPlanned}
                    placeholder="Ex: 40"
                    keyboardType="numeric"
                  />
                </>
              )}
            </ScrollView>
            
            <View className="flex-row justify-end mt-4 pt-2 border-t border-gray-200">
              <TouchableOpacity 
                className="bg-gray-200 px-4 py-2 rounded-md mr-2"
                onPress={handleCloseModal}
              >
                <Text>Annuler</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                className="bg-blue-600 px-4 py-2 rounded-md"
                onPress={handleSubmit}
                disabled={!selectedStaff}
              >
                <Text className="text-white">Ajouter</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}; 

export default ProjectStaff;