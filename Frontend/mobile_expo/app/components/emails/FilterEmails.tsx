import React, { useState, useEffect } from 'react';
import { View, Text, Switch, TextInput, TouchableOpacity } from 'react-native';

interface FilterEmailsProps {
  onSearch: (
    startDate: string,
    endDate: string, 
    unseenOnly: boolean,
    summary: boolean,
    limit: number,
    fastMode: boolean
  ) => void;
  onToggleFilter: (isOpen: boolean) => void;
}

export default function FilterEmails({ onSearch, onToggleFilter }: FilterEmailsProps) {
  // Formater la date d'aujourd'hui (YYYY-MM-DD)
  const getTodayFormatted = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [startDate, setStartDate] = useState(getTodayFormatted());
  const [endDate, setEndDate] = useState(getTodayFormatted());
  const [unseenOnly, setUnseenOnly] = useState(false);
  const [summary, setSummary] = useState(false);
  const [limit, setLimit] = useState('10');
  const [fastMode, setFastMode] = useState(false);

  const handleSearch = () => {
    onSearch(
      startDate,
      endDate,
      unseenOnly,
      summary,
      parseInt(limit) || 10,
      fastMode
    );
  };

  const handleClose = () => {
    onToggleFilter(false);
  };

  return (
    <View className="p-5 bg-white rounded-xl shadow-md mb-4">
      <View className="flex-row justify-between items-center mb-4">
        <Text className="text-xl font-bold text-indigo-800">Filtrer les emails</Text>
        <TouchableOpacity 
          onPress={handleClose}
          className="bg-gray-200 rounded-full p-2"
        >
          <Text className="text-gray-700 font-medium px-2">Fermer</Text>
        </TouchableOpacity>
      </View>
      
      <View className="mb-4 space-y-3">
        <View>
          <Text className="text-gray-700 mb-1 font-medium">Date de début</Text>
          <TextInput
            value={startDate}
            onChangeText={setStartDate}
            className="border border-gray-300 rounded-lg p-3 bg-gray-50 text-gray-800"
            placeholder="AAAA-MM-JJ"
          />
        </View>
        
        <View>
          <Text className="text-gray-700 mb-1 font-medium">Date de fin</Text>
          <TextInput
            value={endDate}
            onChangeText={setEndDate}
            className="border border-gray-300 rounded-lg p-3 bg-gray-50 text-gray-800"
            placeholder="AAAA-MM-JJ"
          />
        </View>
      </View>

      <View className="mb-5 space-y-3">
        <View className="flex-row justify-between items-center border-b border-gray-200 pb-2">
          <Text className="text-gray-700 font-medium">Non lus uniquement</Text>
          <Switch 
            value={unseenOnly} 
            onValueChange={setUnseenOnly} 
            trackColor={{false: '#d1d5db', true: '#818cf8'}}
            thumbColor={unseenOnly ? '#4f46e5' : '#f3f4f6'}
          />
        </View>
        
        <View className="flex-row justify-between items-center border-b border-gray-200 pb-2">
          <Text className="text-gray-700 font-medium">Inclure résumé</Text>
          <Switch 
            value={summary} 
            onValueChange={setSummary} 
            trackColor={{false: '#d1d5db', true: '#818cf8'}}
            thumbColor={summary ? '#4f46e5' : '#f3f4f6'}
          />
        </View>
        
        <View className="flex-row justify-between items-center border-b border-gray-200 pb-2">
          <Text className="text-gray-700 font-medium">Mode rapide</Text>
          <Switch 
            value={fastMode} 
            onValueChange={setFastMode} 
            trackColor={{false: '#d1d5db', true: '#818cf8'}}
            thumbColor={fastMode ? '#4f46e5' : '#f3f4f6'}
          />
        </View>
        
        <View className="flex-row justify-between items-center pb-2">
          <Text className="text-gray-700 font-medium">Limite</Text>
          <TextInput
            value={limit}
            onChangeText={setLimit}
            keyboardType="numeric"
            className="w-20 border border-gray-300 rounded-lg p-2 bg-gray-50 text-center"
          />
        </View>
      </View>

      <TouchableOpacity 
        onPress={handleSearch} 
        className="bg-indigo-600 rounded-full py-3 px-4"
      >
        <Text className="text-white text-center font-bold">Rechercher</Text>
      </TouchableOpacity>
    </View>
  );
}
