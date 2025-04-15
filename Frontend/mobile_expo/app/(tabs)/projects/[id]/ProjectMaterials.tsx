import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useFetch } from '../../../hooks/useFetch';
import { ProjectMaterial } from '../../../utils/interfaces/material.interface';

interface ProjectMaterialsProps {
  projectId: string | number;
  isOpen: boolean;
  onToggle: () => void;
}

export const ProjectMaterials: React.FC<ProjectMaterialsProps> = ({
  projectId,
  isOpen,
  onToggle
}) => {
  const { data: materials, loading, error } = useFetch<ProjectMaterial[]>(`resources/projects/${projectId}/materials`);

  // Calculer le prix total de tous les matériaux
  const totalMaterialsCost = React.useMemo(() => {
    if (!materials || materials.length === 0) return 0;
    
    return materials.reduce((total, material) => {
      // Utiliser le prix unitaire multiplié par la quantité planifiée
      if (material.unit_price) {
        return total + (material.quantity_planned * material.unit_price);
      }
      return total;
    }, 0);
  }, [materials]);

  return (
    <View className="bg-white m-4 p-4 rounded-lg shadow-sm">
      <TouchableOpacity 
        className="flex-row justify-between items-center p-2"
        onPress={onToggle}
        activeOpacity={0.7}
        hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
      >
        <View className="flex-row items-center">
          <MaterialIcons name="hardware" size={22} color="#1e40af" className="mr-2" />
          <Text className="text-lg font-bold ml-2">Matériaux</Text>
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
            <Text className="text-red-500">Erreur lors du chargement des matériaux</Text>
          ) : materials && materials.length > 0 ? (
            <>
              {materials.map((material) => (
                <View key={material.id} className="border-b border-gray-100 py-2">
                  {material.materials ? (
                    <>
                      <View className="flex-row justify-between items-center">
                        <Text className="font-semibold">{material.materials.name}</Text>
                      </View>
                      
                      {material.materials.description && (
                        <Text className="text-gray-600 text-sm">{material.materials.description}</Text>
                      )}
                      
                      <View className="flex-row justify-between mt-1">
                        <Text className="text-gray-700">
                          {material.quantity_planned} {material.materials.unit || 'unité(s)'}
                        </Text>
                        <Text className="font-medium">
                          {material.unit_price 
                            ? `${(material.quantity_planned * material.unit_price).toLocaleString('fr-FR')}€`
                            : ''}
                        </Text>
                      </View>
                      
                      {material.unit_price && (
                        <Text className="text-gray-500 text-sm">
                          Prix unitaire: {material.unit_price.toLocaleString('fr-FR')}€
                        </Text>
                      )}
                      
                      {material.notes && (
                        <Text className="text-gray-500 text-sm italic mt-1">
                          {material.notes}
                        </Text>
                      )}
                    </>
                  ) : (
                    <Text className="text-gray-500">Matériau non disponible</Text>
                  )}
                </View>
              ))}
              
              {/* Total des matériaux */}
              <View className="mt-4 pt-2 border-t border-gray-200">
                <View className="flex-row justify-between">
                  <Text className="font-bold">Total</Text>
                  <Text className="font-bold">{totalMaterialsCost.toLocaleString('fr-FR')}€</Text>
                </View>
              </View>
            </>
          ) : (
            <Text className="text-gray-500">Aucun matériau associé à ce projet</Text>
          )}
        </View>
      )}
    </View>
  );
}; 

export default ProjectMaterials;