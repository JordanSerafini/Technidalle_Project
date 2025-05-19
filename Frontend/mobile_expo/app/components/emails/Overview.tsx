import { OverviewProps } from '@/app/utils/interfaces/emails.interface';
import React from 'react';
import { View, Text, ScrollView } from 'react-native';

export default function Overview({ summary }: OverviewProps) {
    // Fonction pour obtenir la couleur en fonction de la catégorie
    const getCategoryColor = (category: string) => {
        switch(category.toLowerCase()) {
            case 'professionnel':
                return 'bg-blue-100 text-blue-800';
            case 'marketing':
                return 'bg-purple-100 text-purple-800';
            case 'facture':
                return 'bg-green-100 text-green-800';
            case 'technique':
                return 'bg-orange-100 text-orange-800';
            case 'sécurité':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };
    
    // Fonction pour obtenir la couleur en fonction de la priorité
    const getPriorityColor = (priority: string) => {
        switch(priority.toLowerCase()) {
            case 'high':
            case 'haute':
            case 'élevée':
                return 'bg-red-100 text-red-800';
            case 'medium':
            case 'moyenne':
                return 'bg-yellow-100 text-yellow-800';
            case 'low':
            case 'basse':
                return 'bg-green-100 text-green-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <ScrollView className="flex-1 bg-gray-50">
            <View className="p-4 mb-4 bg-white rounded-xl shadow">
                <Text className="text-xl font-bold text-indigo-900 mb-2">Aperçu</Text>
                <Text className="text-gray-700 mb-4">{summary.overview}</Text>
                
                {/* Statistiques */}
                <View className="flex-row flex-wrap justify-between mb-4">
                    <View className="bg-indigo-100 rounded-lg p-3 w-[48%] mb-2">
                        <Text className="text-xs text-indigo-700">Total d'emails</Text>
                        <Text className="text-xl font-bold text-indigo-900">{summary.totalEmails}</Text>
                    </View>
                    <View className="bg-red-100 rounded-lg p-3 w-[48%] mb-2">
                        <Text className="text-xs text-red-700">Haute priorité</Text>
                        <Text className="text-xl font-bold text-red-900">{summary.highPriorityCount}</Text>
                    </View>
                    <View className="bg-yellow-100 rounded-lg p-3 w-[48%]">
                        <Text className="text-xs text-yellow-700">Actions requises</Text>
                        <Text className="text-xl font-bold text-yellow-900">{summary.actionRequiredCount}</Text>
                    </View>
                    <View className="bg-green-100 rounded-lg p-3 w-[48%]">
                        <Text className="text-xs text-green-700">Traités</Text>
                        <Text className="text-xl font-bold text-green-900">{summary.tokensUsed.total}</Text>
                    </View>
                </View>
                
                {/* Catégories */}
                <Text className="text-lg font-bold text-indigo-900 mb-2">Catégories</Text>
                <View className="mb-4">
                    {Object.entries(summary.categoryCounts).map(([category, count]) => (
                        <View key={category} className="flex-row justify-between items-center mb-2 p-2 bg-gray-50 rounded-lg">
                            <View className={`px-2 py-1 rounded-full ${getCategoryColor(category)}`}>
                                <Text className="text-xs font-medium">{category}</Text>
                            </View>
                            <Text className="font-bold">{count}</Text>
                        </View>
                    ))}
                </View>
                
                {/* Emails prioritaires */}
                {summary.topPriorityEmails.length > 0 && (
                    <>
                        <Text className="text-lg font-bold text-indigo-900 mb-2">Emails prioritaires</Text>
                        <View className="mb-4">
                            {summary.topPriorityEmails.map((email) => (
                                <View key={email.id} className="mb-3 p-3 bg-gray-50 rounded-lg">
                                    <View className="flex-row justify-between items-start mb-1">
                                        <Text className="font-bold text-gray-900 flex-1 mr-2">{email.subject}</Text>
                                        <View className={`px-2 py-1 rounded-full ${getPriorityColor(email.analysis.priority)}`}>
                                            <Text className="text-xs font-medium">{email.analysis.priority}</Text>
                                        </View>
                                    </View>
                                    <View className="mb-1">
                                        <Text className="text-sm text-gray-700">De: {email.from.replace(/^"([^"]*)".*$/, '$1')}</Text>
                                    </View>
                                    <Text className="text-sm text-gray-600">{email.analysis.summary}</Text>
                                </View>
                            ))}
                        </View>
                    </>
                )}
                
                {/* Actions à effectuer */}
                {summary.actionItems.length > 0 && (
                    <>
                        <Text className="text-lg font-bold text-indigo-900 mb-2">Actions à effectuer</Text>
                        <View className="mb-2">
                            {summary.actionItems.map((action, index) => (
                                <View key={index} className="flex-row mb-2 items-start">
                                    <View className="h-5 w-5 rounded-full bg-yellow-500 mr-2 mt-0.5" />
                                    <Text className="text-gray-700 flex-1">{action}</Text>
                                </View>
                            ))}
                        </View>
                    </>
                )}
            </View>
        </ScrollView>
    );
}
