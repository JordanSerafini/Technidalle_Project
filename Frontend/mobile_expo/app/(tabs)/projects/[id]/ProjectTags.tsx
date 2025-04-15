import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

interface TagData {
  tag_id: number;
  tags?: {
    id: number;
    name: string;
    color?: string;
  };
}

interface ProjectTagsProps {
  tags: TagData[];
  isOpen: boolean;
  onToggle: () => void;
}

export const ProjectTags: React.FC<ProjectTagsProps> = ({
  tags,
  isOpen,
  onToggle
}) => {
  return (
    <View className="bg-white m-4 p-4 rounded-lg shadow-sm">
      <TouchableOpacity 
        className="flex-row justify-between items-center"
        onPress={onToggle}
      >
        <View className="flex-row items-center">
          <MaterialIcons name="local-offer" size={22} color="#1e40af" className="mr-2" />
          <Text className="text-lg font-bold ml-2">Tags</Text>
        </View>
        <Ionicons 
          name={isOpen ? "chevron-up" : "chevron-down"} 
          size={24} 
          color="#2563eb" 
        />
      </TouchableOpacity>
      
      {isOpen && (
        <View className="mt-4">
          <View className="flex-row flex-wrap">
            {tags.length > 0 ? (
              tags.map((tagRel) => (
                tagRel.tags && (
                  <View 
                    key={tagRel.tag_id} 
                    style={{backgroundColor: tagRel.tags.color || '#e0e0e0'}}
                    className="mr-2 mb-2 py-1 px-3 rounded-full"
                  >
                    <Text className="text-white">{tagRel.tags.name}</Text>
                  </View>
                )
              ))
            ) : (
              <Text className="text-gray-500">Aucun tag associé à ce projet</Text>
            )}
          </View>
        </View>
      )}
    </View>
  );
}; 

export default ProjectTags;