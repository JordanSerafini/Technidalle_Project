import { View, Text, TouchableOpacity, ActivityIndicator, ScrollView, Alert } from 'react-native';
import { useState } from 'react';
import { sortUnreadEmails, sortAllEmails, sortEmailsByCategory, SortResult } from '../../../utils/functions/emails/sort-emails.function';

export default function SortPage() {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<SortResult | null>(null);
    const [selectedAction, setSelectedAction] = useState('');

    const handleSort = async (action: string, categoryName?: string) => {
        setLoading(true);
        setSelectedAction(action);
        setResult(null);
        
        let response = null;
        
        switch (action) {
            case 'sort':
                response = await sortUnreadEmails();
                break;
            case 'sort-all':
                response = await sortAllEmails();
                break;
            case 'sort-by-category':
                if (categoryName) {
                    response = await sortEmailsByCategory(categoryName);
                }
                break;
            default:
                break;
        }
        
        if (response) {
            setResult(response);
        }
        
        setLoading(false);
    };

    return (
        <ScrollView className="flex-1 bg-gray-50">
            <View className="p-4">
                <Text className="text-2xl font-bold text-indigo-800 mb-4">Tri des emails</Text>
                
                <Text className="text-lg text-gray-700 mb-6">
                    Sélectionnez une option pour trier votre boîte mail:
                </Text>
                
                <View className="space-y-3 mb-8">
                    <TouchableOpacity 
                        className="bg-indigo-600 p-4 rounded-lg shadow"
                        onPress={() => handleSort('sort')}
                        disabled={loading}
                    >
                        <Text className="text-white font-medium text-center">Trier les emails non lus</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                        className="bg-indigo-500 p-4 rounded-lg shadow"
                        onPress={() => handleSort('sort-all')}
                        disabled={loading}
                    >
                        <Text className="text-white font-medium text-center">Trier tous les emails</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                        className="bg-indigo-400 p-4 rounded-lg shadow"
                        onPress={() => {
                            Alert.prompt(
                                'Trier par catégorie',
                                'Entrez le nom de la catégorie:',
                                [
                                    { text: 'Annuler', style: 'cancel' },
                                    {
                                        text: 'OK',
                                        onPress: (category) => {
                                            if (category && category.trim().length > 0) {
                                                handleSort('sort-by-category', category.trim());
                                            }
                                        }
                                    }
                                ]
                            );
                        }}
                        disabled={loading}
                    >
                        <Text className="text-white font-medium text-center">Trier par catégorie spécifique</Text>
                    </TouchableOpacity>
                </View>
                
                {loading && (
                    <View className="items-center py-8">
                        <ActivityIndicator size="large" color="#4f46e5" />
                        <Text className="mt-4 text-gray-700">
                            Tri des emails en cours...
                        </Text>
                    </View>
                )}
                
                {result && (
                    <View className="bg-white p-4 rounded-lg shadow mb-4">
                        <Text className={`text-lg font-bold mb-2 ${result.success ? 'text-green-600' : 'text-red-600'}`}>
                            {result.success ? 'Succès!' : 'Erreur'}
                        </Text>
                        
                        <Text className="text-gray-700 mb-3">{result.message}</Text>
                        
                        {result.stats && (
                            <View className="mt-2">
                                <Text className="text-indigo-800 font-medium mb-1">Résultats par catégorie:</Text>
                                {result.stats.map((stat, index) => (
                                    <Text key={index} className="text-gray-700">
                                        • {stat.category}: {stat.count} email(s)
                                    </Text>
                                ))}
                            </View>
                        )}
                        
                        {result.emailsProcessed !== undefined && (
                            <Text className="text-gray-700 mt-2">
                                Nombre d'emails traités: {result.emailsProcessed}
                            </Text>
                        )}
                    </View>
                )}
            </View>
        </ScrollView>
    );
} 