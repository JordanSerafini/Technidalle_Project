import React, { useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, Switch } from "react-native";
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

import { useMailSummary } from '../../hooks/useMailSummary';
import { EmailData, ResponseLength } from '../../utils/types/mailTypes';

// Components importés au besoin
import EmailCard from './components/EmailCard';
import LoadingState from './components/LoadingState';
import ErrorState from './components/ErrorState';
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
    const [hasSearched, setHasSearched] = useState(false);
    const [fastMode, setFastMode] = useState(false);
    const [responseLength, setResponseLength] = useState<ResponseLength>('normal');
    
    // États pour le pliage des sections - toujours à true par défaut
    const [overviewExpanded, setOverviewExpanded] = useState(true);
    const [dailySummaryExpanded, setDailySummaryExpanded] = useState(true);
    const [emailListExpanded, setEmailListExpanded] = useState(true);
    const [searchOptionsExpanded, setSearchOptionsExpanded] = useState(true);

    const toggleExpand = (id: string) => {
        setExpandedItems(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };
    
    // Fonction pour lancer la recherche avec les paramètres configurés
    const handleSearch = () => {
        fetchMailSummary(fastMode, responseLength);
        setHasSearched(true);
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
            <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{stats.totalEmails}</Text>
                    <Text style={styles.statLabel}>Emails</Text>
                </View>
                <View style={styles.dividerVertical} />
                <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{stats.highPriorityCount}</Text>
                    <Text style={styles.statLabel}>Prioritaires</Text>
                </View>
                <View style={styles.dividerVertical} />
                <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{stats.actionRequiredCount}</Text>
                    <Text style={styles.statLabel}>Actions</Text>
                </View>
            </View>
        );
    };

    const renderFilterButtons = () => {
        return (
            <View style={styles.filterContainer}>
                <TouchableOpacity 
                    style={[styles.filterButton, filterType === 'high' && styles.filterButtonActive]}
                    onPress={() => setFilterType('high')}
                >
                    <MaterialIcons 
                        name="priority-high" 
                        size={16} 
                        color={filterType === 'high' ? '#ffffff' : '#6b7280'} 
                    />
                    <Text style={[styles.filterText, filterType === 'high' && styles.filterTextActive]}>
                        Prioritaires
                    </Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                    style={[styles.filterButton, filterType === 'action' && styles.filterButtonActive]}
                    onPress={() => setFilterType('action')}
                >
                    <Ionicons 
                        name="alert-circle-outline" 
                        size={16} 
                        color={filterType === 'action' ? '#ffffff' : '#6b7280'} 
                    />
                    <Text style={[styles.filterText, filterType === 'action' && styles.filterTextActive]}>
                        Actions
                    </Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                    style={[styles.filterButton, filterType === 'all' && styles.filterButtonActive]}
                    onPress={() => setFilterType('all')}
                >
                    <Ionicons 
                        name="mail-outline" 
                        size={16} 
                        color={filterType === 'all' ? '#ffffff' : '#6b7280'} 
                    />
                    <Text style={[styles.filterText, filterType === 'all' && styles.filterTextActive]}>
                        Tous
                    </Text>
                </TouchableOpacity>
            </View>
        );
    };

    const renderDailySummary = () => {
        if (!overview) return null;
        
        return (
            <View style={styles.summaryContainer}>
                <Text style={styles.summaryText}>
                    {overview}
                </Text>
            </View>
        );
    };
    
    // Nouveau composant pour les options de recherche
    const renderSearchOptions = () => {
        return (
            <View style={styles.searchOptionsContainer}>
                <TouchableOpacity 
                    style={styles.sectionHeader}
                    onPress={() => setSearchOptionsExpanded(!searchOptionsExpanded)}
                >
                    <Text style={styles.sectionTitle}>Options de recherche</Text>
                    <Ionicons 
                        name={searchOptionsExpanded ? "chevron-down" : "chevron-forward"} 
                        size={20} 
                        color="#3b82f6"
                    />
                </TouchableOpacity>
                
                {searchOptionsExpanded && (
                    <>
                        <View style={styles.optionRow}>
                            <Text style={styles.optionLabel}>Mode rapide</Text>
                            <Switch
                                value={fastMode}
                                onValueChange={setFastMode}
                                trackColor={{ false: "#d1d5db", true: "#93c5fd" }}
                                thumbColor={fastMode ? "#3b82f6" : "#f4f4f5"}
                            />
                        </View>
                        
                        <View style={styles.lengthSelector}>
                            <Text style={styles.optionLabel}>Longueur des réponses</Text>
                            <View style={styles.lengthOptions}>
                                <TouchableOpacity
                                    style={[styles.lengthOption, responseLength === 'court' && styles.lengthOptionActive]}
                                    onPress={() => setResponseLength('court')}
                                >
                                    <Text style={[styles.lengthOptionText, responseLength === 'court' && styles.lengthOptionTextActive]}>
                                        Court
                                    </Text>
                                </TouchableOpacity>
                                
                                <TouchableOpacity
                                    style={[styles.lengthOption, responseLength === 'normal' && styles.lengthOptionActive]}
                                    onPress={() => setResponseLength('normal')}
                                >
                                    <Text style={[styles.lengthOptionText, responseLength === 'normal' && styles.lengthOptionTextActive]}>
                                        Normal
                                    </Text>
                                </TouchableOpacity>
                                
                                <TouchableOpacity
                                    style={[styles.lengthOption, responseLength === 'détaillé' && styles.lengthOptionActive]}
                                    onPress={() => setResponseLength('détaillé')}
                                >
                                    <Text style={[styles.lengthOptionText, responseLength === 'détaillé' && styles.lengthOptionTextActive]}>
                                        Détaillé
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                        
                        <TouchableOpacity
                            style={styles.searchButton}
                            onPress={handleSearch}
                            disabled={loading}
                        >
                            <Ionicons name="search-outline" size={20} color="#ffffff" />
                            <Text style={styles.searchButtonText}>
                                {loading ? 'Recherche en cours...' : 'Rechercher les emails'}
                            </Text>
                        </TouchableOpacity>
                    </>
                )}
            </View>
        );
    };

    const emailGroups = groupedEmails();
    const emailsToShow = filteredEmails();

    // Fonction pour afficher tout le contenu
    const renderContent = () => {
        if (loading && !refreshing) {
            return <LoadingState />;
        }
      
        if (error) {
            return <ErrorState error={error} onRetry={handleSearch} />;
        }
      
        return (
            <View style={styles.contentContainer}>
                {renderSearchOptions()}
                
                {!hasSearched ? (
                    <View style={styles.emptyStateContainer}>
                        <Text style={styles.emptyStateText}>Utilisez les options de recherche pour charger vos emails</Text>
                    </View>
                ) : (
                    <>
                        <TouchableOpacity 
                            style={styles.sectionHeader}
                            onPress={() => setOverviewExpanded(!overviewExpanded)}
                        >
                            <Text style={styles.sectionTitle}>Aperçu général</Text>
                            <Ionicons 
                                name={overviewExpanded ? "chevron-down" : "chevron-forward"} 
                                size={20} 
                                color="#3b82f6"
                            />
                        </TouchableOpacity>
                        
                        {overviewExpanded && (
                            <>
                                <TouchableOpacity 
                                    style={styles.subSectionHeader}
                                    onPress={() => setDailySummaryExpanded(!dailySummaryExpanded)}
                                >
                                    <View style={{flexDirection: 'row', alignItems: 'center'}}>
                                        <Ionicons name="document-text-outline" size={18} color="#3b82f6" />
                                        <Text style={styles.subSectionTitle}>Résumé journalier</Text>
                                    </View>
                                    <Ionicons 
                                        name={dailySummaryExpanded ? "chevron-down" : "chevron-forward"} 
                                        size={18} 
                                        color="#3b82f6"
                                    />
                                </TouchableOpacity>
                                
                                {dailySummaryExpanded && renderDailySummary()}
                                
                                <TouchableOpacity 
                                    style={[styles.subSectionHeader, {marginTop: 16}]}
                                    onPress={() => setEmailListExpanded(!emailListExpanded)}
                                >
                                    <View style={{flexDirection: 'row', alignItems: 'center'}}>
                                        <Ionicons name="mail-outline" size={18} color="#3b82f6" />
                                        <Text style={styles.subSectionTitle}>Liste des emails</Text>
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
                                        
                                        {emailsToShow.length === 0 ? (
                                            <EmptyState />
                                        ) : (
                                            <View style={{marginTop: 10}}>
                                                {Object.entries(emailGroups).map(([category, categoryEmails]) => (
                                                    <View key={category} style={styles.categoryContainer}>
                                                        <View style={styles.categoryHeader}>
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
                                                            <Text style={styles.categoryTitle}>
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
            </View>
        );
    };

    return (
        <View style={styles.container}>
            {/* On utilise une FlatList comme conteneur principal pour tout le contenu */}
            <FlatList
                style={styles.flatList}
                contentContainerStyle={styles.flatListContent}
                data={[1]} // On utilise un tableau avec un seul élément pour afficher tout le contenu
                renderItem={() => renderContent()}
                keyExtractor={() => 'content'}
                onRefresh={hasSearched ? onRefresh : undefined}
                refreshing={refreshing}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
    },
    flatList: {
        flex: 1,
    },
    flatListContent: {
        padding: 16,
        paddingBottom: 60,
    },
    contentContainer: {
        width: '100%',
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
        marginBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#3b82f6',
    },
    subSectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 8,
        marginBottom: 8,
        backgroundColor: '#f3f4f6',
        borderRadius: 8,
    },
    subSectionTitle: {
        marginLeft: 8,
        fontWeight: '600',
        color: '#1e40af',
    },
    summaryContainer: {
        padding: 16,
        backgroundColor: '#eff6ff',
        borderRadius: 8,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#dbeafe',
    },
    summaryText: {
        fontSize: 14,
        color: '#4b5563',
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        backgroundColor: '#eff6ff',
        borderRadius: 12,
        padding: 16,
        marginVertical: 16,
        borderWidth: 1,
        borderColor: '#dbeafe',
    },
    statItem: {
        alignItems: 'center',
    },
    statNumber: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1e40af',
    },
    statLabel: {
        fontSize: 12,
        color: '#6b7280',
        marginTop: 4,
    },
    dividerVertical: {
        height: 32,
        width: 1,
        backgroundColor: '#bfdbfe',
    },
    filterContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    filterButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        flex: 1,
        marginHorizontal: 4,
        backgroundColor: '#f3f4f6',
    },
    filterButtonActive: {
        backgroundColor: '#3b82f6',
    },
    filterText: {
        fontSize: 13,
        fontWeight: '500',
        marginLeft: 4,
        color: '#6b7280',
    },
    filterTextActive: {
        color: '#ffffff',
    },
    categoryContainer: {
        marginBottom: 20,
    },
    categoryHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    categoryTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1e40af',
        marginLeft: 8,
    },
    // Nouveaux styles pour les options de recherche
    searchOptionsContainer: {
        marginBottom: 20,
        backgroundColor: '#f9fafb',
        borderRadius: 8,
        padding: 12,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    optionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    optionLabel: {
        fontSize: 15,
        fontWeight: '500',
        color: '#4b5563',
    },
    lengthSelector: {
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    lengthOptions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 8,
    },
    lengthOption: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 8,
        marginHorizontal: 4,
        backgroundColor: '#f3f4f6',
        borderRadius: 6,
    },
    lengthOptionActive: {
        backgroundColor: '#3b82f6',
    },
    lengthOptionText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#6b7280',
    },
    lengthOptionTextActive: {
        color: '#ffffff',
    },
    searchButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#3b82f6',
        borderRadius: 8,
        paddingVertical: 12,
        marginTop: 16,
    },
    searchButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#ffffff',
        marginLeft: 8,
    },
    emptyStateContainer: {
        padding: 32,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f3f4f6',
        borderRadius: 8,
        marginVertical: 20,
    },
    emptyStateText: {
        fontSize: 16,
        color: '#4b5563',
        textAlign: 'center',
    },
});