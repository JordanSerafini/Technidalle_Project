import { View, Text, TouchableOpacity, ActivityIndicator, ScrollView, Modal, TextInput, Platform } from 'react-native';
import { useState } from 'react';
import { sortUnreadEmails, sortAllEmails, sortEmailsByCategory, SortResult } from '../../../utils/functions/emails/sort-emails.function';

export default function SortPage() {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<SortResult | null>(null);
    const [selectedAction, setSelectedAction] = useState('');
    const [modalVisible, setModalVisible] = useState(false);
    const [categoryInput, setCategoryInput] = useState('');

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

    const handleCategorySubmit = () => {
        if (categoryInput && categoryInput.trim().length > 0) {
            handleSort('sort-by-category', categoryInput.trim());
            setCategoryInput('');
            setModalVisible(false);
        }
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
                        onPress={() => setModalVisible(true)}
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
                
                {/* Modal pour remplacer Alert.prompt */}
                <Modal
                    animationType="slide"
                    transparent={true}
                    visible={modalVisible}
                    onRequestClose={() => setModalVisible(false)}
                >
                    <View className="flex-1 justify-center items-center" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                        <View className="bg-white w-4/5 p-5 rounded-lg">
                            <Text className="text-lg font-medium text-indigo-800 mb-4">Trier par catégorie</Text>
                            <Text className="text-gray-700 mb-3">Entrez le nom de la catégorie:</Text>
                            
                            <TextInput
                                className="border border-gray-300 rounded-lg p-3 mb-4"
                                value={categoryInput}
                                onChangeText={setCategoryInput}
                                placeholder="Nom de la catégorie"
                                autoFocus={Platform.OS === 'ios'}
                            />
                            
                            <View className="flex-row justify-end">
                                <TouchableOpacity 
                                    className="bg-gray-300 p-2 rounded-lg mr-3"
                                    onPress={() => {
                                        setCategoryInput('');
                                        setModalVisible(false);
                                    }}
                                >
                                    <Text className="text-gray-700 font-medium">Annuler</Text>
                                </TouchableOpacity>
                                
                                <TouchableOpacity 
                                    className="bg-indigo-600 p-2 rounded-lg"
                                    onPress={handleCategorySubmit}
                                >
                                    <Text className="text-white font-medium">OK</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>
            </View>
        </ScrollView>
    );
} 