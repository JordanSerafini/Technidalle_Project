import { View, Text, TouchableOpacity } from 'react-native';
import { useState } from 'react';
import AnalyzeEmail from '../../components/emails/analyze/AnalyzeEmail';
import SortPage from '../../components/emails/sort/SortPage';

export default function Emails() {
    const [currentPage, setCurrentPage] = useState<'analyze' | 'simple'>('analyze');

    return (
        <View className="flex-1 bg-gray-50 pt-">
            {/* Navigation entre les pages */}
            <View className="flex-row p-2 bg-white border-b border-gray-200">
                <TouchableOpacity 
                    onPress={() => setCurrentPage('analyze')}
                    className={`flex-1 py-2 px-4 mx-1 rounded-lg ${currentPage === 'analyze' ? 'bg-indigo-600' : 'bg-gray-200'}`}
                >
                    <Text className={`text-center font-medium ${currentPage === 'analyze' ? 'text-white' : 'text-gray-700'}`}>
                        Analyse d'emails
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    onPress={() => setCurrentPage('simple')}
                    className={`flex-1 py-2 px-4 mx-1 rounded-lg ${currentPage === 'simple' ? 'bg-indigo-600' : 'bg-gray-200'}`}
                >
                    <Text className={`text-center font-medium ${currentPage === 'simple' ? 'text-white' : 'text-gray-700'}`}>
                        Tri des emails
                    </Text>
                </TouchableOpacity>
            </View>
            
            {/* Affichage du contenu en fonction de la page sélectionnée */}
            {(() => {
                switch(currentPage) {
                    case 'analyze':
                        return <AnalyzeEmail />;
                    case 'simple':
                        return <SortPage />;
                    default:
                        return <AnalyzeEmail />;
                }
            })()}
        </View>
    );
}
