import React, { useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { EmailData } from '../../../utils/types/mailTypes';
import MailDetails from './MailDetails';

interface MailsListProps {
    emails: EmailData[];
    loading: boolean;
}

export default function MailsList({ emails, loading }: MailsListProps) {
    const [selectedEmail, setSelectedEmail] = useState<EmailData | null>(null);
    const [detailsModalVisible, setDetailsModalVisible] = useState(false);

    // Fonction pour déterminer la couleur de priorité
    const getPriorityColor = (priority: string) => {
        switch(priority?.toLowerCase()) {
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

    // Ouvrir le modal des détails d'un email
    const handleOpenEmailDetails = (email: EmailData) => {
        setSelectedEmail(email);
        setDetailsModalVisible(true);
    };

    // Fermer le modal des détails
    const handleCloseEmailDetails = () => {
        setDetailsModalVisible(false);
    };

    if (loading) {
        return (
            <View className="flex-1 justify-center items-center">
                <ActivityIndicator size="large" color="#6366f1" />
                <Text className="mt-2 text-indigo-800">Chargement des emails...</Text>
            </View>
        );
    }

    if (emails.length === 0) {
        return (
            <View className="flex-1 justify-center items-center">
                <Text className="text-gray-500 text-center">Aucun email trouvé. Utilisez les filtres pour rechercher.</Text>
            </View>
        );
    }

    return (
        <>
            <ScrollView className="mt-2">
                {emails.map(email => (
                    <TouchableOpacity 
                        key={email.id} 
                        className="p-4 mb-3 bg-white rounded-xl shadow"
                        onPress={() => handleOpenEmailDetails(email)}
                        activeOpacity={0.7}
                    >
                        <View className="flex-row justify-between items-start mb-2">
                            <Text className="text-base font-bold text-gray-900 flex-1 mr-2">{email.subject}</Text>
                            {email.analysis?.priority && (
                                <View className={`px-2 py-1 rounded-full ${getPriorityColor(email.analysis.priority)}`}>
                                    <Text className="text-xs font-medium">{email.analysis.priority}</Text>
                                </View>
                            )}
                        </View>
                        
                        <View className="flex-row items-center mb-2">
                            <Text className="text-sm text-gray-600 mr-4">De: {email.from}</Text>
                            <Text className="text-xs text-gray-500">{new Date(email.date).toLocaleDateString()}</Text>
                        </View>
                        
                        {email.analysis?.category && (
                            <View className="mb-2">
                                <Text className="text-xs text-gray-600">
                                    Catégorie: <Text className="font-medium">{email.analysis.category}</Text>
                                </Text>
                            </View>
                        )}
                        
                        {email.analysis?.summary && (
                            <View className="mt-2 pt-2 border-t border-gray-100">
                                <Text className="text-sm text-gray-700">{email.analysis.summary}</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                ))}
            </ScrollView>
            
            <MailDetails 
                visible={detailsModalVisible}
                email={selectedEmail}
                onClose={handleCloseEmailDetails}
                onResponseSent={handleCloseEmailDetails}
            />
        </>
    );
}
