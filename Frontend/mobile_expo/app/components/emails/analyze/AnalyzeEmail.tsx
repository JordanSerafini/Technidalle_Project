import { View, Text, TouchableOpacity } from 'react-native';
import { useState } from 'react';
import { EmailData } from '../../../utils/types/mailTypes';
import { analyzeEmailsInRange } from '../../../utils/functions/emails/analyze-emails.function';
import FilterEmails from '../analyze/FilterEmails';
import MailsList from '../analyze/MailsList';
import Overview from '../analyze/Overview';

export default function AnalyzeEmail() {
    const [emails, setEmails] = useState<EmailData[]>([]);
    const [loading, setLoading] = useState(false);
    const [isFilterOpen, setIsFilterOpen] = useState(true);
    const [showOverview, setShowOverview] = useState(true);
    const [emailSummary, setEmailSummary] = useState(null);

    const handleSearch = async (
        startDate: string,
        endDate: string,
        unseenOnly: boolean,
        summary: boolean,
        limit: number,
        fastMode: boolean
    ) => {
        setLoading(true);
        try {
            const response = await analyzeEmailsInRange(
                startDate,
                endDate,
                unseenOnly,
                summary,
                limit,
                fastMode
            );
            
            if (response && response.data) {
                setEmails(response.data);
                if (response.summary) {
                    setEmailSummary(response.summary);
                    setShowOverview(true);
                }
            }
        } catch (error) {
            console.error("Erreur lors de la recherche d'emails:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleFilter = (isOpen: boolean) => {
        setIsFilterOpen(isOpen);
    };

    return (
        <View className="flex-1 p-4 bg-gray-50">
            {/* Filtres */}
            {isFilterOpen ? (
                <FilterEmails 
                    onSearch={handleSearch} 
                    onToggleFilter={handleToggleFilter} 
                />
            ) : (
                <TouchableOpacity 
                    onPress={() => setIsFilterOpen(true)}
                    className="bg-indigo-600 mb-4 rounded-lg py-2 px-4"
                >
                    <Text className="text-white text-center font-bold">Ouvrir les filtres</Text>
                </TouchableOpacity>
            )}
            
            {/* Boutons de navigation */}
            {emails.length > 0 && emailSummary && (
                <View className="flex-row mb-4">
                    <TouchableOpacity 
                        onPress={() => setShowOverview(false)}
                        className={`flex-1 py-2 px-4 rounded-l-lg ${!showOverview ? 'bg-indigo-600' : 'bg-gray-300'}`}
                    >
                        <Text className={`text-center font-medium ${!showOverview ? 'text-white' : 'text-gray-700'}`}>Liste</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        onPress={() => setShowOverview(true)}
                        className={`flex-1 py-2 px-4 rounded-r-lg ${showOverview ? 'bg-indigo-600' : 'bg-gray-300'}`}
                    >
                        <Text className={`text-center font-medium ${showOverview ? 'text-white' : 'text-gray-700'}`}>Aperçu</Text>
                    </TouchableOpacity>
                </View>
            )}
            
            {/* Contenu principal */}
            {showOverview && emailSummary ? (
                <Overview summary={emailSummary} />
            ) : (
                <MailsList emails={emails} loading={loading} />
            )}
        </View>
    );
}
