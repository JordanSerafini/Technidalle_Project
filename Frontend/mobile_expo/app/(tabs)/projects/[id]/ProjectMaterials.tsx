import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useFetch } from '../../../hooks/useFetch';

interface Material {
  id: number;
  material_id: number;
  project_id: number;
  quantity?: number;
  unit_price?: number;
  total_price?: number;
  notes?: string;
  materials?: {
    id: number;
    name: string;
    description?: string;
    reference?: string;
    price?: number;
    unit?: string;
    category?: string;
  };
}

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
  const { data: materials, loading, error } = useFetch<Material[]>(`resources/projects/${projectId}/materials`);

  // Calculer le prix total de tous les matériaux
  const totalMaterialsCost = React.useMemo(() => {
    if (!materials || materials.length === 0) return 0;
    
    return materials.reduce((total, material) => {
      // Priorité au total_price s'il existe
      if (material.total_price) {
        return total + material.total_price;
      }
      // Sinon, calculer le prix basé sur quantity * unit_price
      else if (material.quantity && material.unit_price) {
        return total + (material.quantity * material.unit_price);
      }
      return total;
    }, 0);
  }, [materials]);

  return (
    <View className="bg-white m-4 p-4 rounded-lg shadow-sm">
      <TouchableOpacity 
        className="flex-row justify-between items-center"
        onPress={onToggle}
      >
        <View className="flex-row items-center">
          <MaterialIcons name="category" size={22} color="#1e40af" className="mr-2" />
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
                        {material.materials.category && (
                          <View className="bg-blue-100 px-2 py-1 rounded-full">
                            <Text className="text-blue-800 text-xs">{material.materials.category}</Text>
                          </View>
                        )}
                      </View>
                      
                      {material.materials.description && (
                        <Text className="text-gray-600 text-sm">{material.materials.description}</Text>
                      )}
                      
                      <View className="flex-row justify-between mt-1">
                        <Text className="text-gray-700">
                          {material.quantity || 0} {material.materials.unit || 'unité(s)'}
                        </Text>
                        <Text className="font-medium">
                          {material.total_price 
                            ? `${material.total_price.toLocaleString('fr-FR')}€` 
                            : material.unit_price 
                              ? `${(material.quantity || 0) * material.unit_price}€`
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