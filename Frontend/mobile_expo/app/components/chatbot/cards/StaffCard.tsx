import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StaffData } from '@/app/utils/interfaces/datacard.interface';

const StaffCard: React.FC<{ staff: StaffData }> = ({ staff }) => {
  const fullName = `${staff.firstname} ${staff.lastname}`.trim();

  return (
    <View className="bg-white rounded-lg p-4 mb-2 shadow-sm border border-gray-200">
      <View className="flex-row justify-between items-start">
        <View className="flex-1">
          <Text className="text-lg font-bold">{fullName}</Text>
          {staff.staff_id && (
            <Text className="text-gray-500 text-sm">ID: {staff.staff_id}</Text>
          )}
        </View>
        <View className="bg-blue-100 rounded-full p-2">
          <Ionicons name="person" size={24} color="#3b82f6" />
        </View>
      </View>

      <View className="mt-3 pt-3 border-t border-gray-100">
        {staff.email && (
          <View className="flex-row items-center mb-1">
            <Ionicons name="mail-outline" size={16} color="#6b7280" />
            <Text className="text-gray-700 ml-2 text-sm">{staff.email}</Text>
          </View>
        )}

        {staff.phone && (
          <View className="flex-row items-center mb-1">
            <Ionicons name="call-outline" size={16} color="#6b7280" />
            <Text className="text-gray-700 ml-2 text-sm">{staff.phone}</Text>
          </View>
        )}

        {staff.mobile && (
          <View className="flex-row items-center">
            <Ionicons name="phone-portrait-outline" size={16} color="#6b7280" />
            <Text className="text-gray-700 ml-2 text-sm">{staff.mobile}</Text>
          </View>
        )}
      </View>
    </View>
  );
};

export default StaffCard;
