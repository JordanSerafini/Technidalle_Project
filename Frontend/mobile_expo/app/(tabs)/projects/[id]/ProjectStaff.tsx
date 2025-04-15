import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useFetch } from '../../../hooks/useFetch';
import { ProjectStaff as ProjectStaffInterface } from '@/app/utils/interfaces/staff.interface';

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
  const { data: staff, loading, error } = useFetch<ProjectStaffInterface[]>(`resources/projects/${projectId}/staff`);
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
      
      {isOpen && (
        <View className="mt-4">
          {loading ? (
            <ActivityIndicator size="small" color="#2563eb" />
          ) : error ? (
            <Text className="text-red-500">Erreur lors du chargement du personnel</Text>
          ) : staff && staff.length > 0 ? (
            staff.map((member) => (
              <View key={member.id} className="border-b border-gray-100 py-2">
                {member.staff ? (
                  <>
                    <View className="flex-row justify-between items-center">
                      <Text className="font-semibold">{member.staff.firstname} {member.staff.lastname}</Text>
                      {member.role_description && (
                        <View className="bg-blue-100 px-2 py-1 rounded-full">
                          <Text className="text-blue-800 text-xs">{member.role_description}</Text>
                        </View>
                      )}
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
            ))
          ) : (
            <Text className="text-gray-500">Aucun personnel associé à ce projet</Text>
          )}
        </View>
      )}
    </View>
  );
}; 

export default ProjectStaff;