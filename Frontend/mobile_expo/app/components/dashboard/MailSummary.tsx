import React, { useEffect, useState, useRef } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity } from "react-native";
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

import { useMailSummary } from '../../hooks/useMailSummary';
import { EmailData } from '../../utils/types/mailTypes';

// Components
import EmailCard from './components/EmailCard';
import LoadingState from './components/LoadingState';
import ErrorState from './components/ErrorState';
import OverviewCard from './components/OverviewCard';
import EmptyState from './components/EmptyState';

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
    
    // États pour le pliage des sections
    const [overviewExpanded, setOverviewExpanded] = useState(true);
    const [dailySummaryExpanded, setDailySummaryExpanded] = useState(true);
    const [emailListExpanded, setEmailListExpanded] = useState(false);
    
    // Utiliser une référence pour suivre si la requête initiale a déjà été effectuée
    const initialFetchDone = useRef(false);

    useEffect(() => {
        if (!initialFetchDone.current) {
            fetchMailSummary();
            initialFetchDone.current = true;
        }
    }, []);  // Suppression de fetchMailSummary des dépendances

    const toggleExpand = (id: string) => {
        setExpandedItems(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
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
                    <Text className="text-xl font-bold text-blue-800">{stats.totalEmails}</Text>
                    <Text className="text-xs text-gray-500 mt-1">Emails</Text>
                </View>
                <View className="h-8 w-0.5 bg-blue-200" />
                <View className="items-center">
                    <Text className="text-xl font-bold text-blue-800">{stats.highPriorityCount}</Text>
                    <Text className="text-xs text-gray-500 mt-1">Prioritaires</Text>
                </View>
                <View className="h-8 w-0.5 bg-blue-200" />
                <View className="items-center">
                    <Text className="text-xl font-bold text-blue-800">{stats.actionRequiredCount}</Text>
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
                    <Text className={`text-xs font-medium ml-1 ${filterType === 'high' ? 'text-white' : 'text-gray-500'}`}>
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
                    <Text className={`text-xs font-medium ml-1 ${filterType === 'action' ? 'text-white' : 'text-gray-500'}`}>
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
                    <Text className={`text-xs font-medium ml-1 ${filterType === 'all' ? 'text-white' : 'text-gray-500'}`}>
                        Tous
                    </Text>
                </TouchableOpacity>
            </View>
        );
    };

    const renderDailySummary = () => {
        if (!overview) return null;
        
        return (
            <View className="p-4 bg-blue-50 rounded-lg my-2 border border-blue-100">
                <Text className="text-sm text-gray-700">
                    {overview}
                </Text>
            </View>
        );
    };

    const emailGroups = groupedEmails();
    const emailsToShow = filteredEmails();

    return (
        <View className="flex-1 w-full bg-white">
                       
            <ScrollView 
                className="flex-1 w-full"
                contentContainerStyle={{ padding: 16, width: '100%' }}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={["#3b82f6"]}
                        tintColor="#3b82f6"
                    />
                }
            >
                {loading && !refreshing && <LoadingState />}
                
                {error && (
                    <ErrorState error={error} onRetry={fetchMailSummary} />
                )}

                {!loading && !error && overview && (
                    <>
                        <TouchableOpacity 
                            className="flex-row justify-between items-center py-2 mb-2 border-b border-gray-200"
                            onPress={() => setOverviewExpanded(!overviewExpanded)}
                        >
                            <Text className="text-lg font-bold text-blue-800">Aperçu général</Text>
                            <Ionicons 
                                name={overviewExpanded ? "chevron-down" : "chevron-forward"} 
                                size={20} 
                                color="#3b82f6"
                            />
                        </TouchableOpacity>
                        
                        {overviewExpanded && (
                            <>
                                <TouchableOpacity 
                                    className="flex-row justify-between items-center py-2 px-2 mb-2 bg-gray-50 rounded-lg"
                                    onPress={() => setDailySummaryExpanded(!dailySummaryExpanded)}
                                >
                                    <View className="flex-row items-center">
                                        <Ionicons name="document-text-outline" size={18} color="#3b82f6" />
                                        <Text className="ml-2 font-semibold text-blue-700">Résumé journalier</Text>
                                    </View>
                                    <Ionicons 
                                        name={dailySummaryExpanded ? "chevron-down" : "chevron-forward"} 
                                        size={18} 
                                        color="#3b82f6"
                                    />
                                </TouchableOpacity>
                                
                                {dailySummaryExpanded && renderDailySummary()}
                                
                                <TouchableOpacity 
                                    className="flex-row justify-between items-center py-2 px-2 mt-4 mb-2 bg-gray-50 rounded-lg"
                                    onPress={() => setEmailListExpanded(!emailListExpanded)}
                                >
                                    <View className="flex-row items-center">
                                        <Ionicons name="mail-outline" size={18} color="#3b82f6" />
                                        <Text className="ml-2 font-semibold text-blue-700">Liste des emails</Text>
                                    </View>
                                    <Ionicons 
                                        name={emailListExpanded ? "chevron-down" : "chevron-forward"} 
                                        size={18} 
                                        color="#3b82f6"
                                    />
                                </TouchableOpacity>
                                
                                {emailListExpanded && (
                                    <>
                                        {renderSummaryStats()}
                                        {renderFilterButtons()}
                                        
                                        {!loading && !error && emailsToShow.length === 0 && (
                                            <EmptyState />
                                        )}
                                        
                                        {!loading && !error && emailsToShow.length > 0 && (
                                            <View className="mt-2 w-full">
                                                {Object.entries(emailGroups).map(([category, categoryEmails]) => (
                                                    <View key={category} className="mb-5">
                                                        <View className="flex-row items-center mb-3">
                                                            <Ionicons 
                                                                name={
                                                                    category === 'professionnel' ? 'briefcase-outline' :
                                                                    category === 'sécurité' ? 'shield-checkmark-outline' :
                                                                    category === 'administratif' ? 'document-text-outline' :
                                                                    category === 'facture' ? 'cash-outline' :
                                                                    category === 'marketing' ? 'megaphone-outline' :
                                                                    category === 'personnel' ? 'person-outline' :
                                                                    'mail-outline'
                                                                } 
                                                                size={20} 
                                                                color="#1e40af" 
                                                            />
                                                            <Text className="text-base font-semibold text-blue-800 ml-2">
                                                                {category.charAt(0).toUpperCase() + category.slice(1)} ({categoryEmails.length})
                                                            </Text>
                                                        </View>
                                                        
                                                        {categoryEmails.map((email, index) => (
                                                            <EmailCard
                                                                key={email.id || `email-${category}-${index}`}
                                                                email={email}
                                                                expanded={!!expandedItems[email.id || `email-${category}-${index}`]}
                                                                onToggleExpand={() => toggleExpand(email.id || `email-${category}-${index}`)}
                                                            />
                                                        ))}
                                                    </View>
                                                ))}
                                            </View>
                                        )}
                                    </>
                                )}
                            </>
                        )}
                    </>
                )}
                
            </ScrollView>
        </View>
    );
}