import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { EmailData } from '../../../utils/types/mailTypes';
import { truncateText, extractSenderName } from '../../../utils/functions/mailUtils';
import { formatDateTime } from '../../../utils/dateFormatter';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

type EmailCardProps = {
  email: EmailData;
  expanded: boolean;
  onToggleExpand: () => void;
  onReply: (emailId: string) => void;
};

export const EmailCard = ({ email, expanded, onToggleExpand, onReply }: EmailCardProps) => {
  const isHighPriority = email.analysis.priority === 'high';
  const hasActions = email.analysis.actionRequired && email.analysis.actionItems && email.analysis.actionItems.length > 0;
  
  return (
    <TouchableOpacity 
      className={`mb-4 rounded-xl overflow-hidden shadow-sm ${isHighPriority ? 'bg-red-50 border-l-4 border-l-red-500' : 'bg-white'}`}
      onPress={onToggleExpand}
      activeOpacity={0.7}
    >
      {/* En-tête avec icône de priorité */}
      <View className="p-4 border-b border-gray-100">
        <View className="flex-row justify-between items-center mb-2">
          <View className="flex-row items-center flex-1">
            {isHighPriority && (
              <MaterialIcons name="priority-high" size={18} color="#ef4444" className="mr-1.5" />
            )}
            <Text className="font-bold text-base text-gray-900 flex-1" numberOfLines={1}>
              {email.subject || 'Sans objet'}
            </Text>
          </View>
          <View className="flex-row items-center ml-2">
            <Ionicons name="time-outline" size={14} color="#6b7280" className="mr-1" />
            <Text className="text-xs text-gray-500">{formatDateTime(email.date)}</Text>
          </View>
        </View>
        
        <View className="flex-row items-center">
          <Ionicons name="person-outline" size={14} color="#6b7280" className="mr-1.5" />
          <Text className="text-sm text-gray-600 flex-1">
            {extractSenderName(email.from)}
          </Text>
          
          {isHighPriority && (
            <View className="bg-red-100 px-2 py-0.5 rounded-full ml-2">
              <Text className="text-red-700 text-xs font-medium">Prioritaire</Text>
            </View>
          )}
        </View>
      </View>
      
      {/* Contenu du mail */}
      <View className="p-4">
        <Text className="text-sm leading-5 text-gray-700">
          {truncateText(email.analysis.summary, expanded, 150)}
        </Text>
        
        {email.analysis.summary && email.analysis.summary.length > 150 && !expanded && (
          <TouchableOpacity 
            onPress={onToggleExpand} 
            className="flex-row items-center mt-2"
          >
            <Text className="text-blue-500 text-sm mr-1">
              Voir plus
            </Text>
            <Ionicons 
              name={"chevron-down"} 
              size={16} 
              color="#3b82f6" 
            />
          </TouchableOpacity>
        )}
        
        {expanded && (
            <View className="mt-3">
                {email.analysis.summary && email.analysis.summary.length > 150 &&
                    <TouchableOpacity 
                        onPress={onToggleExpand} 
                        className="flex-row items-center mb-3"
                    >
                        <Text className="text-blue-500 text-sm mr-1">
                            Voir moins
                        </Text>
                        <Ionicons 
                        name={"chevron-up"} 
                        size={16} 
                        color="#3b82f6" 
                        />
                    </TouchableOpacity>
                }

                {/* Actions requises */}
                {hasActions && (
                    <View className="pt-3 border-t border-gray-200 mb-3">
                        <View className="flex-row items-center mb-2">
                        <MaterialIcons name="assignment" size={16} color="#4b5563" />
                        <Text className="text-sm font-semibold text-gray-600 ml-1.5">Actions requises:</Text>
                        </View>
                        
                        {email.analysis.actionItems?.map((action, actionIndex) => (
                        <View key={actionIndex} className="flex-row mb-1.5 pl-2">
                            <Text className="text-sm text-gray-500 mr-2">•</Text>
                            <Text className="text-sm text-gray-600 flex-1">{action}</Text>
                        </View>
                        ))}
                    </View>
                )}

                {/* Bouton Répondre visible seulement si étendu */}
                <TouchableOpacity
                    className="bg-blue-500 py-2 px-4 rounded-lg items-center flex-row justify-center mt-2"
                    onPress={() => onReply(email.id)}
                >
                    <Ionicons name="arrow-undo-outline" size={16} color="#ffffff" className="mr-2" />
                    <Text className="text-white font-medium">Répondre</Text>
                </TouchableOpacity>
            </View>
        )}
      </View>
      
      {/* Indicateur visuel en bas si actions requises mais non affichées */}
      {hasActions && !expanded && (
        <View className="flex-row items-center bg-amber-50 p-2 border-t border-amber-100">
          <Ionicons name="alert-circle-outline" size={16} color="#f59e0b" />
          <Text className="text-xs text-amber-800 font-medium ml-1.5">
            Actions requises
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

export default EmailCard;