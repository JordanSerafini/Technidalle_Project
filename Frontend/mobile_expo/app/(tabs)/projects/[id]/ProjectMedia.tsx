import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Modal, Image, Dimensions, FlatList } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useFetch } from '../../../hooks/useFetch';

interface ProjectMedia {
  id: number;
  project_id: number | null;
  stage_id: number | null;
  staff_id: number | null;
  media_type: string | null;
  file_path: string;
  description: string | null;
  created_at: Date | null;
  updated_at: Date | null;
  staff?: any;
  project_stages?: any;
}

interface ProjectMediaProps {
  projectId: string | number;
  isOpen: boolean;
  onToggle: () => void;
}

export const ProjectMedia: React.FC<ProjectMediaProps> = ({
  projectId,
  isOpen,
  onToggle
}) => {
  // État pour le modal d'image
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<ProjectMedia | null>(null);
  
  // Assurez-vous que le projectId est bien converti en nombre
  const endpoint = `documents/project/${Number(projectId)}/media`;
  const { data: mediaList, loading, error } = useFetch<ProjectMedia[]>(endpoint);

  // Dimensions de l'écran pour afficher l'image correctement
  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;

  // Fonction pour gérer le clic sur un média
  const handleMediaPress = (media: ProjectMedia) => {
    setSelectedMedia(media);
    setImageModalVisible(true);
  };

  // Fonction pour obtenir l'icône selon le type de média
  const getMediaIcon = (type: string | null) => {
    if (!type) return <MaterialIcons name="image" size={20} color="#2563eb" />;
    
    switch(type.toLowerCase()) {
      case 'photo': 
        return <MaterialIcons name="photo" size={20} color="#2563eb" />;
      case 'video': 
        return <MaterialIcons name="videocam" size={20} color="#2563eb" />;
      case 'audio': 
        return <MaterialIcons name="mic" size={20} color="#2563eb" />;
      default: 
        return <MaterialIcons name="insert-drive-file" size={20} color="#2563eb" />;
    }
  };

  // Rendu d'un élément média
  const renderMediaItem = ({ item }: { item: ProjectMedia }) => (
    <TouchableOpacity 
      className="w-1/3 p-1"
      onPress={() => handleMediaPress(item)}
    >
      <View className="rounded-lg overflow-hidden bg-gray-100 aspect-square">
        {item.media_type === 'photo' ? (
          <Image 
            source={{ uri: item.file_path }} 
            style={{ width: '100%', height: '100%' }}
            resizeMode="cover"
          />
        ) : (
          <View className="flex-1 justify-center items-center">
            {getMediaIcon(item.media_type)}
          </View>
        )}
      </View>
      {item.description && (
        <Text className="text-xs text-gray-600 mt-1 truncate">{item.description}</Text>
      )}
    </TouchableOpacity>
  );

  return (
    <View className="bg-white m-4 p-4 rounded-lg shadow-sm">
      <TouchableOpacity 
        className="flex-row justify-between items-center"
        onPress={onToggle}
      >
        <View className="flex-row items-center">
          <MaterialIcons name="perm-media" size={22} color="#1e40af" className="mr-2" />
          <Text className="text-lg font-bold ml-2">Médias</Text>
        </View>
        <Ionicons 
          name={isOpen ? "chevron-up" : "chevron-down"} 
          size={24} 
          color="#2563eb" 
        />
      </TouchableOpacity>
      
      {/* Modal pour afficher l'image en plein écran */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={imageModalVisible}
        onRequestClose={() => setImageModalVisible(false)}
      >
        <View className="flex-1 bg-black/80 justify-center items-center">
          <TouchableOpacity 
            className="absolute top-10 right-5 z-10"
            onPress={() => setImageModalVisible(false)}
          >
            <Ionicons name="close-circle" size={40} color="white" />
          </TouchableOpacity>
          
          {selectedMedia && selectedMedia.file_path && (
            <View className="p-2 bg-white rounded-lg">
              <Image 
                source={{ uri: selectedMedia.file_path }} 
                style={{ 
                  width: screenWidth * 0.9, 
                  height: screenHeight * 0.7,
                  borderRadius: 8 
                }}
                resizeMode="contain"
              />
              <Text className="text-center mt-2 text-gray-700 font-medium">
                {selectedMedia.description || `Image ${selectedMedia.id}`}
              </Text>
            </View>
          )}
        </View>
      </Modal>
      
      {isOpen && (
        <View className="mt-4">
          {loading ? (
            <ActivityIndicator size="small" color="#2563eb" />
          ) : error ? (
            <Text className="text-red-500">Erreur lors du chargement des médias</Text>
          ) : mediaList && mediaList.length > 0 ? (
            <FlatList
              data={mediaList}
              renderItem={renderMediaItem}
              keyExtractor={(item: ProjectMedia) => item.id.toString()}
              numColumns={3}
              columnWrapperStyle={{ justifyContent: 'flex-start' }}
            />
          ) : (
            <Text className="text-gray-500">Aucun média associé à ce projet</Text>
          )}
        </View>
      )}
    </View>
  );
};

export default ProjectMedia; 