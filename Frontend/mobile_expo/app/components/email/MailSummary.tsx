import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, Switch, Alert } from "react-native";
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

import { useMailSummary } from '../../hooks/useMailSummary';
import { EmailData, ResponseLength } from '../../utils/types/mailTypes';
import { getDataMode, setDataMode } from '../../utils/functions/mails.function';
import { useMailsStore } from '../../store/mailsStore';

// Components importés au besoin
import EmailCard from './EmailCard';
import LoadingState from './LoadingState';
import ErrorState from './ErrorState';
import EmptyState from './EmptyState';
import EmailReplyModal from './EmailReplyModal';

export default function MailSummary() {
    const {
        overview,
        emails,
        stats,
        loading,
        error,
        refreshing,
        fetchMailSummary,
        onRefresh
    } = useMailSummary();

    const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
    const [filterType, setFilterType] = useState<'all' | 'high' | 'action'>('high');
    const [hasSearched, setHasSearched] = useState(false);
    const [fastMode, setFastMode] = useState(false);
    const [responseLength, setResponseLength] = useState<ResponseLength>('normal');
    const [useMockData, setUseMockData] = useState(getDataMode());
    const [forceRefresh, setForceRefresh] = useState(false);
    const [searchStarted, setSearchStarted] = useState(false);
    
    // États pour le pliage des sections - toujours à true par défaut
    const [overviewExpanded, setOverviewExpanded] = useState(true);
    const [dailySummaryExpanded, setDailySummaryExpanded] = useState(true);
    const [emailListExpanded, setEmailListExpanded] = useState(false);
    const [searchOptionsExpanded, setSearchOptionsExpanded] = useState(true);
    const [mailSenderExpanded, setMailSenderExpanded] = useState(false);
    // État pour contrôler la visibilité complète des options de recherche
    const [showSearchOptions, setShowSearchOptions] = useState(true);

    // États pour la modale de réponse
    const [isReplyModalVisible, setIsReplyModalVisible] = useState(false);
    const [selectedEmailForReply, setSelectedEmailForReply] = useState<string | null>(null);
    // Ajout d'un cache d'email pour éviter de refetch si on a déjà les données
    const [emailCache, setEmailCache] = useState<Record<string, EmailData>>({});

    // Mise à jour du cache d'emails quand de nouveaux emails sont chargés
    useEffect(() => {
        if (emails && emails.length > 0) {
            const newCache: Record<string, EmailData> = {};
            emails.forEach(email => {
                newCache[email.id] = email;
            });
            setEmailCache(prev => ({...prev, ...newCache}));
        }
    }, [emails]);

    // Récupère l'email sélectionné depuis le cache
    const selectedEmail = useMemo(() => {
        if (!selectedEmailForReply) return null;
        return emailCache[selectedEmailForReply] || null;
    }, [selectedEmailForReply, emailCache]);

    const toggleExpand = (id: string) => {
        setExpandedItems(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };
    
    // Fonction pour basculer entre les modes de données (mock/API)
    const toggleDataMode = () => {
        const newMode = !useMockData;
        setUseMockData(newMode);
        setDataMode(newMode);
    };

    // Fonction pour lancer la recherche avec les paramètres configurés
    const handleSearch = () => {
        console.log("Démarrage d'une recherche manuelle");
        // Indiquer qu'une recherche a été démarrée avant d'appeler l'API
        setSearchStarted(true);
        // hasSearched restera à false jusqu'à la fin du chargement (via l'effet)
        
        // Toujours forcer la recherche quand on clique sur le bouton
        fetchMailSummary(fastMode, forceRefresh);
        
        // Garder les options de recherche visibles
        setShowSearchOptions(true);
        // Replier les options après la recherche
        setSearchOptionsExpanded(false);
    };

    // Filtrer les emails selon le critère sélectionné
    const filteredEmails = () => {
        if (!emails || emails.length === 0) return [];
        
        switch (filterType) {
            case 'high':
                return emails.filter(email => email.analysis.priority === 'high');
            case 'action':
                return emails.filter(email => email.analysis.actionRequired);
            case 'all':
                return emails;
            default:
                return emails;
        }
    };

    // Grouper les emails par catégorie
    const groupedEmails = () => {
        const filtered = filteredEmails();
        const groups: Record<string, EmailData[]> = {};
        
        filtered.forEach(email => {
            const category = email.analysis.category;
            if (!groups[category]) {
                groups[category] = [];
            }
            groups[category].push(email);
        });
        
        return groups;
    };

    const renderSummaryStats = () => {
        if (!stats) return null;
        
        return (
            <View className="flex-row justify-around bg-blue-50 rounded-xl p-4 my-4 border border-blue-100">
                <View className="items-center">
                    <Text className="text-lg font-bold text-blue-800">{stats.totalEmails}</Text>
                    <Text className="text-xs text-gray-500 mt-1">Emails</Text>
                </View>
                <View className="h-8 w-px bg-blue-200" />
                <View className="items-center">
                    <Text className="text-lg font-bold text-blue-800">{stats.highPriorityCount}</Text>
                    <Text className="text-xs text-gray-500 mt-1">Prioritaires</Text>
                </View>
                <View className="h-8 w-px bg-blue-200" />
                <View className="items-center">
                    <Text className="text-lg font-bold text-blue-800">{stats.actionRequiredCount}</Text>
                    <Text className="text-xs text-gray-500 mt-1">Actions</Text>
                </View>
            </View>
        );
    };

    const renderFilterButtons = () => {
        return (
            <View className="flex-row justify-between mb-4">
                <TouchableOpacity 
                    className={`flex-row items-center justify-center py-2 px-3 rounded-lg flex-1 mx-1 ${filterType === 'high' ? 'bg-blue-500' : 'bg-gray-100'}`}
                    onPress={() => setFilterType('high')}
                >
                    <MaterialIcons 
                        name="priority-high" 
                        size={16} 
                        color={filterType === 'high' ? '#ffffff' : '#6b7280'} 
                    />
                    <Text className={`text-sm font-medium ml-1 ${filterType === 'high' ? 'text-white' : 'text-gray-500'}`}>
                        Prioritaires
                    </Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                    className={`flex-row items-center justify-center py-2 px-3 rounded-lg flex-1 mx-1 ${filterType === 'action' ? 'bg-blue-500' : 'bg-gray-100'}`}
                    onPress={() => setFilterType('action')}
                >
                    <Ionicons 
                        name="alert-circle-outline" 
                        size={16} 
                        color={filterType === 'action' ? '#ffffff' : '#6b7280'} 
                    />
                    <Text className={`text-sm font-medium ml-1 ${filterType === 'action' ? 'text-white' : 'text-gray-500'}`}>
                        Actions
                    </Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                    className={`flex-row items-center justify-center py-2 px-3 rounded-lg flex-1 mx-1 ${filterType === 'all' ? 'bg-blue-500' : 'bg-gray-100'}`}
                    onPress={() => setFilterType('all')}
                >
                    <Ionicons 
                        name="mail-outline" 
                        size={16} 
                        color={filterType === 'all' ? '#ffffff' : '#6b7280'} 
                    />
                    <Text className={`text-sm font-medium ml-1 ${filterType === 'all' ? 'text-white' : 'text-gray-500'}`}>
                        Tous
                    </Text>
                </TouchableOpacity>
            </View>
        );
    };

    const renderDailySummary = () => {
        // N'affiche rien si overview est vide, null, ou semble être le placeholder initial.
        // Le placeholder est identifié s'il commence par "Vous avez" et contient le nombre total d'emails des stats.
        // Cela évite d'afficher un résumé incomplet pendant que les données se chargent.
        if (!overview || overview.trim() === "" || (stats && overview.startsWith("Vous avez") && overview.includes(String(stats.totalEmails)))) {
            return null;
        }
        
        return (
            <View className="p-4 bg-blue-50 rounded-lg mb-4 border border-blue-100">
                <Text className="text-sm text-gray-600">{overview}</Text>
            </View>
        );
    };
    
    // Composant modifié pour les options de recherche avec bouton de recherche
    const renderSearchOptions = () => {
        return (
            <View className="mb-5 bg-gray-50 rounded-lg p-3 border border-gray-200">
                <TouchableOpacity 
                    className="flex-row justify-between items-center py-2 mb-2 border-b border-gray-200"
                    onPress={() => setSearchOptionsExpanded(!searchOptionsExpanded)}
                >
                    <Text className="text-lg font-bold text-blue-500">Options de recherche</Text>
                    <Ionicons 
                        name={searchOptionsExpanded ? "chevron-down" : "chevron-forward"} 
                        size={20} 
                        color="#3b82f6"
                    />
                </TouchableOpacity>
                
                {searchOptionsExpanded && (
                    <>
                        <View className="flex-row justify-between items-center py-3 border-b border-gray-200">
                            <View className="flex-row items-center">
                                <Text className="text-base font-medium text-gray-600">Utiliser les données mockées</Text>
                                <TouchableOpacity 
                                    className="ml-2 p-0.5 rounded-full bg-gray-100"
                                    onPress={() => Alert.alert(
                                        "Mode de données",
                                        "Choisissez entre les données mockées (mode hors ligne) ou l'API réelle (mode en ligne)."
                                    )}
                                >
                                    <Ionicons name="information-circle-outline" size={16} color="#4b5563" />
                                </TouchableOpacity>
                            </View>
                            <Switch
                                value={useMockData}
                                onValueChange={toggleDataMode}
                                trackColor={{ false: "#d1d5db", true: "#93c5fd" }}
                                thumbColor={useMockData ? "#3b82f6" : "#f4f4f5"}
                            />
                        </View>

                        <View className="flex-row justify-between items-center py-3 border-b border-gray-200">
                            <Text className="text-base font-medium text-gray-600">Mode rapide</Text>
                            <Switch
                                value={fastMode}
                                onValueChange={setFastMode}
                                trackColor={{ false: "#d1d5db", true: "#93c5fd" }}
                                thumbColor={fastMode ? "#3b82f6" : "#f4f4f5"}
                            />
                        </View>
                        
                        <View className="flex-row justify-between items-center py-3 border-b border-gray-200">
                            <View className="flex-row items-center">
                                <Text className="text-base font-medium text-gray-600">Forcer le rafraîchissement</Text>
                                <TouchableOpacity 
                                    className="ml-2 p-0.5 rounded-full bg-gray-100"
                                    onPress={() => Alert.alert(
                                        "Forcer le rafraîchissement",
                                        "Ignore le cache et recharge toutes les données depuis l'API."
                                    )}
                                >
                                    <Ionicons name="information-circle-outline" size={16} color="#4b5563" />
                                </TouchableOpacity>
                            </View>
                            <Switch
                                value={forceRefresh}
                                onValueChange={setForceRefresh}
                                trackColor={{ false: "#d1d5db", true: "#93c5fd" }}
                                thumbColor={forceRefresh ? "#3b82f6" : "#f4f4f5"}
                            />
                        </View>
                        
                        <View className="py-3 border-b border-gray-200">
                            <Text className="text-base font-medium text-gray-600 mb-2">Longueur des réponses</Text>
                            <View className="flex-row justify-between items-center">
                                <TouchableOpacity 
                                    className={`flex-1 items-center py-2 mx-1 rounded-lg ${responseLength === 'court' ? 'bg-blue-500' : 'bg-gray-100'}`}
                                    onPress={() => setResponseLength('court')}
                                >
                                    <Text className={`text-sm font-medium ${responseLength === 'court' ? 'text-white' : 'text-gray-500'}`}>
                                        Court
                                    </Text>
                                </TouchableOpacity>
                                
                                <TouchableOpacity 
                                    className={`flex-1 items-center py-2 mx-1 rounded-lg ${responseLength === 'normal' ? 'bg-blue-500' : 'bg-gray-100'}`}
                                    onPress={() => setResponseLength('normal')}
                                >
                                    <Text className={`text-sm font-medium ${responseLength === 'normal' ? 'text-white' : 'text-gray-500'}`}>
                                        Normal
                                    </Text>
                                </TouchableOpacity>
                                
                                <TouchableOpacity 
                                    className={`flex-1 items-center py-2 mx-1 rounded-lg ${responseLength === 'détaillé' ? 'bg-blue-500' : 'bg-gray-100'}`}
                                    onPress={() => setResponseLength('détaillé')}
                                >
                                    <Text className={`text-sm font-medium ${responseLength === 'détaillé' ? 'text-white' : 'text-gray-500'}`}>
                                        Détaillé
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                        
                        {/* Bouton de recherche */}
                        <TouchableOpacity 
                            className="flex-row bg-blue-500 py-3 px-4 rounded-lg justify-center items-center mt-4 mx-4 mb-2"
                            onPress={handleSearch}
                            disabled={loading}
                        >
                            <Ionicons name="search" size={18} color="#ffffff" />
                            <Text className="text-white font-semibold text-base ml-2">
                                {loading ? "Chargement..." : "Rechercher les emails"}
                            </Text>
                        </TouchableOpacity>
                    </>
                )}
            </View>
        );
    };

    const emailGroups = groupedEmails();
    const emailsToShow = filteredEmails();

    // Fonction pour ouvrir la modal de réponse sans recharger les emails
    const handleReplyToEmail = useCallback((emailId: string) => {
        console.log("Réponse à l'email:", emailId);
        // Vérifier si nous avons déjà cet email dans le cache
        if (emailCache[emailId]) {
            setSelectedEmailForReply(emailId);
            setIsReplyModalVisible(true);
            return;
        }
        
        // Si l'email n'est pas dans le cache (cas rare), on pourrait le récupérer ici
        // Pour l'instant, on utilise quand même l'ID que nous avons
        setSelectedEmailForReply(emailId);
        setIsReplyModalVisible(true);
    }, [emailCache]);

    // Fonction pour afficher tout le contenu
    const renderContent = () => {
        console.log("Rendu avec loading:", loading, "searchStarted:", searchStarted, "hasSearched:", hasSearched);
        
        // Toujours afficher le chargement en priorité
        if (loading) {
            return <LoadingState />;
        }

        // Afficher l'erreur seulement quand le chargement est terminé
        if (!loading && error) {
            return <ErrorState error={error} onRetry={handleSearch} />;
        }

        // Afficher l'état vide seulement après le chargement terminé et si aucun email
        if (!loading && hasSearched && (!emails || emails.length === 0)) {
            return <EmptyState onRetry={handleSearch} />;
        }

        return (
            <>
                {showSearchOptions && renderSearchOptions()}
                
                {hasSearched && (
                    <>
                        <View className="mb-5">
                            <TouchableOpacity
                                className="flex-row justify-between items-center py-2 mb-2 border-b border-gray-200"
                                onPress={() => setOverviewExpanded(!overviewExpanded)}
                            >
                                <Text className="text-lg font-bold text-blue-500">Aperçu général</Text>
                                <Ionicons
                                    name={overviewExpanded ? "chevron-down" : "chevron-forward"}
                                    size={20}
                                    color="#3b82f6"
                                />
                            </TouchableOpacity>
                            
                            {overviewExpanded && (
                                <>
                                    {renderSummaryStats()}
                                    
                                    <View className="mb-5">
                                        <TouchableOpacity
                                            className="flex-row justify-between items-center py-2 mb-2 border-b border-gray-200"
                                            onPress={() => setDailySummaryExpanded(!dailySummaryExpanded)}
                                        >
                                            <Text className="text-base font-semibold text-blue-500 mb-2">Résumé de la journée</Text>
                                            <Ionicons
                                                name={dailySummaryExpanded ? "chevron-down" : "chevron-forward"}
                                                size={18}
                                                color="#3b82f6"
                                            />
                                        </TouchableOpacity>
                                        
                                        {dailySummaryExpanded && renderDailySummary()}
                                    </View>
                                </>
                            )}
                        </View>
                        
                        <View className="mb-5">
                            <TouchableOpacity
                                className="flex-row justify-between items-center py-2 mb-2 border-b border-gray-200"
                                onPress={() => setEmailListExpanded(!emailListExpanded)}
                            >
                                <Text className="text-lg font-bold text-blue-500">Actions Emails</Text>
                                <View className="flex-row items-center">
                                    <View className="bg-blue-500 rounded-full px-2 py-0.5 mr-2">
                                        <Text className="text-white text-xs font-bold">{emailsToShow.length}</Text>
                                    </View>
                                    <Ionicons
                                        name={emailListExpanded ? "chevron-down" : "chevron-forward"}
                                        size={20}
                                        color="#3b82f6"
                                    />
                                </View>
                            </TouchableOpacity>
                            
                            {emailListExpanded && (
                                <>
                                    {renderFilterButtons()}
                                    
                                    {Object.keys(emailGroups).length > 0 ? (
                                        Object.keys(emailGroups).map(category => (
                                            <View key={category} className="mb-5">
                                                <View className="flex-row items-center justify-between mb-2">
                                                    <Text className="text-base font-semibold text-blue-800 ml-2">{category}</Text>
                                                    <View className="bg-blue-400 rounded-full px-1.5 py-0.5">
                                                        <Text className="text-white text-xs font-medium">{emailGroups[category].length}</Text>
                                                    </View>
                                                </View>
                                                {emailGroups[category].map(email => (
                                                    <EmailCard
                                                        key={email.id}
                                                        email={email}
                                                        expanded={!!expandedItems[email.id]}
                                                        onToggleExpand={() => toggleExpand(email.id)}
                                                        onReply={handleReplyToEmail}
                                                    />
                                                ))}
                                            </View>
                                        ))
                                    ) : (
                                        <Text className="text-base text-gray-500 text-center">
                                            Aucun email ne correspond au filtre sélectionné
                                        </Text>
                                    )}
                                </>
                            )}
                        </View>
                       
                    </>
                )}
                
                {!hasSearched && (
                    <View className="p-8 justify-center items-center bg-gray-100 rounded-lg my-5">
                        <Text className="text-base text-gray-600 text-center">
                            Configurez vos options de recherche et cliquez sur "Rechercher les emails" pour commencer.
                        </Text>
                    </View>
                )}
            </>
        );
    };

    const handleCloseReplyModal = useCallback(() => {
        setIsReplyModalVisible(false);
        // Ne pas réinitialiser selectedEmailForReply immédiatement pour permettre une animation de fermeture plus fluide
        setTimeout(() => {
            setSelectedEmailForReply(null);
        }, 300);
        // Optionnel: rafraîchir la liste après envoi si un email doit disparaître
        // Ceci est un point à affiner: si l'email est juste marqué comme "répondu"
        // ou s'il doit vraiment disparaître de la liste `actionRequiredEmails`
        // après l'envoi via la modale.
        // Si un rafraîchissement est nécessaire:
        // fetchMailSummary(fastMode, true); 
    }, []);

    // Effet pour marquer hasSearched une fois le chargement terminé
    useEffect(() => {
        // Si une recherche a été lancée et le chargement est terminé
        if (searchStarted && !loading) {
            setHasSearched(true);
        }
    }, [loading, searchStarted]);

    // Effet pour déclencher le chargement initial
    useEffect(() => {
        // Chargement automatique à l'ouverture de la page
        if (!hasSearched && !searchStarted && !loading) {
            console.log("Démarrage du chargement automatique initial");
            setSearchStarted(true);
            fetchMailSummary(fastMode, false);
        }
    }, []);

    return (
        <View className="flex-1 bg-white">
            {/* En-tête avec bouton pour réafficher les options de recherche si nécessaire */}
            {hasSearched && !showSearchOptions && (
                <TouchableOpacity
                    className="absolute top-4 right-4 bg-blue-500 rounded-lg p-2 flex-row items-center"
                    onPress={() => setShowSearchOptions(true)}
                >
                    <Ionicons name="search-outline" size={18} color="#ffffff" />
                    <Text className="text-white font-semibold text-base ml-2">Rechercher à nouveau</Text>
                </TouchableOpacity>
            )}
            
            {/* On utilise une FlatList comme conteneur principal pour tout le contenu */}
            <FlatList
                className="flex-1"
                contentContainerStyle={{padding: 16, paddingBottom: 60}}
                data={[1]}
                renderItem={() => renderContent()}
                keyExtractor={() => 'content'}
                onRefresh={hasSearched ? onRefresh : undefined}
                refreshing={refreshing}
            />

            {/* Affichage de la modale de réponse */}
            <EmailReplyModal
                isVisible={isReplyModalVisible}
                onClose={handleCloseReplyModal}
                emailId={selectedEmailForReply}
                responseLength={responseLength}
            />
        </View>
    );
}