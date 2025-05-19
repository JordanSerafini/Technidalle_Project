import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, Switch, Alert } from "react-native";
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

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
        fetchMailsByDateRange,
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
    const [advancedOptionsExpanded, setAdvancedOptionsExpanded] = useState(false);
    const [mailSenderExpanded, setMailSenderExpanded] = useState(false);
    // État pour contrôler la visibilité complète des options de recherche
    const [showSearchOptions, setShowSearchOptions] = useState(true);

    // États pour la modale de réponse
    const [isReplyModalVisible, setIsReplyModalVisible] = useState(false);
    const [selectedEmailForReply, setSelectedEmailForReply] = useState<string | null>(null);
    // Ajout d'un cache d'email pour éviter de refetch si on a déjà les données
    const [emailCache, setEmailCache] = useState<Record<string, EmailData>>({});

    // États pour la plage de dates
    const [useDateRange, setUseDateRange] = useState(false);
    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(new Date());
    const [showStartDatePicker, setShowStartDatePicker] = useState(false);
    const [showEndDatePicker, setShowEndDatePicker] = useState(false);
    const [unseenOnly, setUnseenOnly] = useState(false);
    const [emailLimit, setEmailLimit] = useState<number | undefined>(20);

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

    // Fonction pour gérer les changements de date
    const onChangeStartDate = (event: any, selectedDate?: Date) => {
        setShowStartDatePicker(false);
        if (selectedDate) {
            setStartDate(selectedDate);
        }
    };

    const onChangeEndDate = (event: any, selectedDate?: Date) => {
        setShowEndDatePicker(false);
        if (selectedDate) {
            setEndDate(selectedDate);
        }
    };

    // Fonction modifiée pour la recherche, utilisant fetchMailsByDateRange si nécessaire
    const handleSearch = () => {
        console.log("Démarrage d'une recherche manuelle");
        setSearchStarted(true);
        
        if (useDateRange) {
            // Utiliser la recherche par plage de dates
            const formattedStartDate = format(startDate, 'yyyy-MM-dd');
            const formattedEndDate = format(endDate, 'yyyy-MM-dd');
            
            fetchMailsByDateRange(formattedStartDate, formattedEndDate, {
                unseenOnly,
                limit: emailLimit,
                fastMode,
                forceRefresh
            });
        } else {
            // Utiliser la recherche standard
            fetchMailSummary(fastMode, forceRefresh);
        }
        
        setShowSearchOptions(true);
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
    
    // Composant modifié pour les options de recherche avec filtre de date
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
                            <Text className="text-base font-medium text-gray-600">Utiliser plage de dates</Text>
                            <Switch
                                value={useDateRange}
                                onValueChange={setUseDateRange}
                                trackColor={{ false: "#d1d5db", true: "#93c5fd" }}
                                thumbColor={useDateRange ? "#3b82f6" : "#f4f4f5"}
                            />
                        </View>

                        {useDateRange && (
                            <>
                                <View className="py-3 border-b border-gray-200">
                                    <Text className="text-base font-medium text-gray-600 mb-2">Plage de dates</Text>
                                    
                                    <View className="flex-row justify-between mb-4">
                                        <TouchableOpacity 
                                            onPress={() => setShowStartDatePicker(true)}
                                            className="bg-white p-2 rounded-lg border border-gray-300 flex-1 mr-2"
                                        >
                                            <Text className="text-gray-700">
                                                Du: {format(startDate, 'dd/MM/yyyy', { locale: fr })}
                                            </Text>
                                        </TouchableOpacity>
                                        
                                        <TouchableOpacity 
                                            onPress={() => setShowEndDatePicker(true)}
                                            className="bg-white p-2 rounded-lg border border-gray-300 flex-1"
                                        >
                                            <Text className="text-gray-700">
                                                Au: {format(endDate, 'dd/MM/yyyy', { locale: fr })}
                                            </Text>
                                        </TouchableOpacity>
                                    </View>

                                    {showStartDatePicker && (
                                        <DateTimePicker
                                            value={startDate}
                                            mode="date"
                                            display="default"
                                            onChange={onChangeStartDate}
                                        />
                                    )}

                                    {showEndDatePicker && (
                                        <DateTimePicker
                                            value={endDate}
                                            mode="date"
                                            display="default"
                                            onChange={onChangeEndDate}
                                        />
                                    )}
                                    
                                    <View className="flex-row justify-between items-center mt-2">
                                        <Text className="text-gray-600">Emails non lus uniquement</Text>
                                        <Switch
                                            value={unseenOnly}
                                            onValueChange={setUnseenOnly}
                                            trackColor={{ false: "#d1d5db", true: "#93c5fd" }}
                                            thumbColor={unseenOnly ? "#3b82f6" : "#f4f4f5"}
                                        />
                                    </View>
                                    
                                    <View className="flex-row items-center mt-4">
                                        <Text className="text-gray-600 mr-4">Limite d'emails:</Text>
                                        <View className="flex-row">
                                            {[10, 20, 50, 100].map(value => (
                                                <TouchableOpacity 
                                                    key={value}
                                                    className={`py-1 px-3 rounded-lg mx-1 ${emailLimit === value ? 'bg-blue-500' : 'bg-gray-200'}`}
                                                    onPress={() => setEmailLimit(value)}
                                                >
                                                    <Text className={emailLimit === value ? 'text-white' : 'text-gray-700'}>
                                                        {value}
                                                    </Text>
                                                </TouchableOpacity>
                                            ))}
                                            <TouchableOpacity
                                                className={`py-1 px-3 rounded-lg mx-1 ${emailLimit === undefined ? 'bg-blue-500' : 'bg-gray-200'}`}
                                                onPress={() => setEmailLimit(undefined)}
                                            >
                                                <Text className={emailLimit === undefined ? 'text-white' : 'text-gray-700'}>
                                                    Tous
                                                </Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </View>
                            </>
                        )}

                        <TouchableOpacity 
                            className="flex-row justify-between items-center py-3 border-b border-gray-200"
                            onPress={() => setAdvancedOptionsExpanded(!advancedOptionsExpanded)}
                        >
                            <Text className="text-base font-medium text-gray-600">Options avancées</Text>
                            <Ionicons 
                                name={advancedOptionsExpanded ? "chevron-down" : "chevron-forward"} 
                                size={18} 
                                color="#3b82f6"
                            />
                        </TouchableOpacity>

                        {advancedOptionsExpanded && (
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
                            </>
                        )}
                        
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
        
        // 1. Mettre l'email dans le cache du store si ce n'est pas déjà fait
        const store = useMailsStore.getState();
        const emailInStore = store.actionRequiredEmails.find(e => e.id === emailId);
        
        if (emailInStore) {
            // Préparer ou mettre à jour le cache de brouillon pour optimiser le chargement
            const existingDraft = store.getDraftResponse(emailId, responseLength);
            if (!existingDraft) {
                // Pré-générer un "mock" de brouillon pour éviter l'appel API
                const fromName = emailInStore.from.match(/"([^"]+)"/) 
                    ? emailInStore.from.match(/"([^"]+)"/)![1] 
                    : emailInStore.from.split('<')[0].trim();
                
                let draftResponse = '';
                switch (responseLength) {
                    case 'court':
                        draftResponse = `Bonjour ${fromName},\n\nMerci pour votre message. J'ai bien pris note de votre demande.\n\nCordialement,\nJordan`;
                        break;
                    case 'détaillé':
                        draftResponse = `Bonjour ${fromName},\n\nJe vous remercie pour votre message concernant "${emailInStore.subject}".\n\nJ'ai bien pris note de tous les éléments que vous avez partagés. Après analyse, je souhaite vous informer que nous allons traiter cette demande avec la plus grande attention.\n\nÀ propos des points que vous avez soulevés:\n1. Nous avons bien compris votre préoccupation principale\n2. Les actions suggérées seront mises en œuvre prochainement\n3. Un suivi sera effectué dans les meilleurs délais\n\nN'hésitez pas à me contacter si vous avez besoin d'informations supplémentaires.\n\nCordialement,\nJordan Serafini`;
                        break;
                    default: // 'normal'
                        draftResponse = `Bonjour ${fromName},\n\nMerci pour votre message concernant "${emailInStore.subject}".\n\nJ'ai bien pris note de votre demande et je m'en occupe dans les plus brefs délais. Soyez assuré(e) que nous apportons à ce sujet toute l'attention qu'il mérite.\n\nCordialement,\nJordan`;
                }
                
                // Ajouter au cache pour éviter une génération inutile
                store.setDraftResponse(emailId, {
                    originalEmail: emailInStore,
                    draftResponse
                }, responseLength);
                
                console.log("[OPTIMIZE] Pré-génération du brouillon pour éviter un appel API");
            }
        }
        
        // 2. Afficher la modal avec l'email sélectionné
        setSelectedEmailForReply(emailId);
        setIsReplyModalVisible(true);
    }, [responseLength]);

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
        // Ne plus charger automatiquement à l'ouverture de la page
        // Laisser l'utilisateur cliquer sur le bouton de recherche
        console.log("Page des emails chargée, en attente de l'action utilisateur");
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