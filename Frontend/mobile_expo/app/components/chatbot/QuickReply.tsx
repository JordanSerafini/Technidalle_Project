import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';

interface QuickReplyProps {
  suggestions: string[];
  onPress: (suggestion: string) => void;
}

const QuickReply: React.FC<QuickReplyProps> = ({ suggestions, onPress }) => {
  if (!suggestions || suggestions.length === 0) {
    return null;
  }

  return (
    <View className="py-2">
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 8 }}
      >
        {suggestions.map((suggestion, index) => (
          <TouchableOpacity
            key={index}
            className="bg-blue-100 px-4 py-2 rounded-full mr-2"
            onPress={() => onPress(suggestion)}
          >
            <Text className="text-blue-700 text-sm">{suggestion}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

export default QuickReply; 