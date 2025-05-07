import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, Switch, Alert } from "react-native";
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

import { useMailSummary } from '../../hooks/useMailSummary';
import { EmailData, ResponseLength } from '../../utils/types/mailTypes';
import { getDataMode, setDataMode } from '../../utils/functions/mails.function';
import { useMailsStore } from '../../store/mailsStore';

// Components importés au besoin
import EmailCard from './components/EmailCard';
import LoadingState from './components/LoadingState';
import ErrorState from './components/ErrorState';
import EmptyState from './components/EmptyState';
import MailSender from './MailSender';
import OverviewCard from './components/OverviewCard';

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
    
    // États pour le pliage des sections - toujours à true par défaut
    const [overviewExpanded, setOverviewExpanded] = useState(true);
    const [dailySummaryExpanded, setDailySummaryExpanded] = useState(true);
    const [emailListExpanded, setEmailListExpanded] = useState(false);
    const [searchOptionsExpanded, setSearchOptionsExpanded] = useState(true);
    const [mailSenderExpanded, setMailSenderExpanded] = useState(false);
    // État pour contrôler la visibilité complète des options de recherche
    const [showSearchOptions, setShowSearchOptions] = useState(true);

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
        // Toujours forcer la recherche quand on clique sur le bouton
        fetchMailSummary(fastMode, responseLength, forceRefresh);
        setHasSearched(true);
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
                <OverviewCard overview={overview} />
            </View>
        );
    };
    
    // Composant modifié pour les options de recherche avec bouton de recherche
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
                            <View style={styles.optionLabelContainer}>
                                <Text style={styles.optionLabel}>Utiliser les données mockées</Text>
                                <TouchableOpacity 
                                    style={styles.infoButton}
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

                        <View style={styles.optionRow}>
                            <Text style={styles.optionLabel}>Mode rapide</Text>
                            <Switch
                                value={fastMode}
                                onValueChange={setFastMode}
                                trackColor={{ false: "#d1d5db", true: "#93c5fd" }}
                                thumbColor={fastMode ? "#3b82f6" : "#f4f4f5"}
                            />
                        </View>
                        
                        <View style={styles.optionRow}>
                            <View style={styles.optionLabelContainer}>
                                <Text style={styles.optionLabel}>Forcer le rafraîchissement</Text>
                                <TouchableOpacity 
                                    style={styles.infoButton}
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
                        
                        <View style={styles.optionRow}>
                            <Text style={styles.optionLabel}>Longueur des réponses</Text>
                            <View style={styles.radioGroup}>
                                <TouchableOpacity 
                                    style={[
                                        styles.radioOption,
                                        responseLength === 'court' && styles.radioOptionActive
                                    ]}
                                    onPress={() => setResponseLength('court')}
                                >
                                    <Text 
                                        style={[
                                            styles.radioText,
                                            responseLength === 'court' && styles.radioTextActive
                                        ]}
                                    >
                                        Court
                                    </Text>
                                </TouchableOpacity>
                                
                                <TouchableOpacity 
                                    style={[
                                        styles.radioOption,
                                        responseLength === 'normal' && styles.radioOptionActive
                                    ]}
                                    onPress={() => setResponseLength('normal')}
                                >
                                    <Text 
                                        style={[
                                            styles.radioText,
                                            responseLength === 'normal' && styles.radioTextActive
                                        ]}
                                    >
                                        Normal
                                    </Text>
                                </TouchableOpacity>
                                
                                <TouchableOpacity 
                                    style={[
                                        styles.radioOption,
                                        responseLength === 'détaillé' && styles.radioOptionActive
                                    ]}
                                    onPress={() => setResponseLength('détaillé')}
                                >
                                    <Text 
                                        style={[
                                            styles.radioText,
                                            responseLength === 'détaillé' && styles.radioTextActive
                                        ]}
                                    >
                                        Détaillé
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                        
                        {/* Nouveau bouton de recherche */}
                        <TouchableOpacity 
                            style={styles.searchButton}
                            onPress={handleSearch}
                            disabled={loading}
                        >
                            <Ionicons name="search" size={18} color="#ffffff" />
                            <Text style={styles.searchButtonText}>
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

    // Fonction pour afficher tout le contenu
    const renderContent = () => {
        if (loading && !refreshing) {
            return <LoadingState />;
        }

        if (error) {
            return <ErrorState error={error} onRetry={handleSearch} />;
        }

        // Si les données sont vides et qu'on a déjà fait une recherche
        if (hasSearched && (!emails || emails.length === 0)) {
            return <EmptyState onRetry={handleSearch} />;
        }

        return (
            <>
                {showSearchOptions && renderSearchOptions()}
                
                {hasSearched && (
                    <>
                        <View style={styles.sectionContainer}>
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
                                    {renderSummaryStats()}
                                    
                                    <View style={styles.sectionContainer}>
                                        <TouchableOpacity
                                            style={styles.sectionHeader}
                                            onPress={() => setDailySummaryExpanded(!dailySummaryExpanded)}
                                        >
                                            <Text style={styles.subsectionTitle}>Résumé de la journée</Text>
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
                        
                        <View style={styles.sectionContainer}>
                            <TouchableOpacity
                                style={styles.sectionHeader}
                                onPress={() => setEmailListExpanded(!emailListExpanded)}
                            >
                                <Text style={styles.sectionTitle}>Emails</Text>
                                <View style={styles.headerRightContainer}>
                                    <View style={styles.emailCountBadge}>
                                        <Text style={styles.emailCountText}>{emailsToShow.length}</Text>
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
                                            <View key={category} style={styles.categoryContainer}>
                                                <View style={styles.categoryHeader}>
                                                    <Text style={styles.categoryTitle}>{category}</Text>
                                                    <View style={styles.categoryCountBadge}>
                                                        <Text style={styles.categoryCountText}>{emailGroups[category].length}</Text>
                                                    </View>
                                                </View>
                                                {emailGroups[category].map(email => (
                                                    <EmailCard
                                                        key={email.id}
                                                        email={email}
                                                        expanded={!!expandedItems[email.id]}
                                                        onToggleExpand={() => toggleExpand(email.id)}
                                                    />
                                                ))}
                                            </View>
                                        ))
                                    ) : (
                                        <Text style={styles.noEmailsText}>
                                            Aucun email ne correspond au filtre sélectionné
                                        </Text>
                                    )}
                                </>
                            )}
                        </View>
                        
                        <View style={styles.sectionContainer}>
                            <TouchableOpacity
                                style={styles.sectionHeader}
                                onPress={() => {
                                    setMailSenderExpanded(!mailSenderExpanded);
                                    if (!mailSenderExpanded) {
                                        setEmailListExpanded(false); // Ferme la section des emails quand on ouvre le MailSender
                                    }
                                }}
                            >
                                <Text style={styles.sectionTitle}>Répondre aux emails</Text>
                                <Ionicons
                                    name={mailSenderExpanded ? "chevron-down" : "chevron-forward"}
                                    size={20}
                                    color="#3b82f6"
                                />
                            </TouchableOpacity>
                            {mailSenderExpanded && (
                                <MailSender
                                    responseLength={responseLength}
                                />
                            )}
                        </View>
                    </>
                )}
                
                {!hasSearched && (
                    <View style={styles.initialStateContainer}>
                        <Text style={styles.initialStateText}>
                            Configurez vos options de recherche et cliquez sur "Rechercher les emails" pour commencer.
                        </Text>
                    </View>
                )}
            </>
        );
    };

    return (
        <View style={styles.container}>
            {/* En-tête avec bouton pour réafficher les options de recherche si nécessaire */}
            {hasSearched && !showSearchOptions && (
                <TouchableOpacity
                    style={styles.showSearchButton}
                    onPress={() => setShowSearchOptions(true)}
                >
                    <Ionicons name="search-outline" size={18} color="#ffffff" />
                    <Text style={styles.showSearchButtonText}>Rechercher à nouveau</Text>
                </TouchableOpacity>
            )}
            
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
        justifyContent: 'space-between',
        marginBottom: 8,
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
        backgroundColor: '#3b82f6',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 6,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 16,
        marginHorizontal: 16,
        marginBottom: 8,
    },
    searchButtonText: {
        color: '#ffffff',
        fontWeight: '600',
        fontSize: 16,
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
    sectionContainer: {
        marginBottom: 20,
    },
    subsectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#3b82f6',
        marginBottom: 8,
    },
    noEmailsText: {
        fontSize: 16,
        color: '#4b5563',
        textAlign: 'center',
    },
    initialStateContainer: {
        padding: 32,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f3f4f6',
        borderRadius: 8,
        marginVertical: 20,
    },
    initialStateText: {
        fontSize: 16,
        color: '#4b5563',
        textAlign: 'center',
    },
    headerRightContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    emailCountBadge: {
        backgroundColor: '#3b82f6',
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingVertical: 2,
        marginRight: 8,
    },
    emailCountText: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
    },
    categoryCountBadge: {
        backgroundColor: '#60a5fa', // Bleu plus clair
        borderRadius: 12,
        paddingHorizontal: 6,
        paddingVertical: 2,
    },
    categoryCountText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '500',
    },
    showSearchButton: {
        position: 'absolute',
        top: 16,
        right: 16,
        backgroundColor: '#3b82f6',
        borderRadius: 8,
        padding: 8,
        flexDirection: 'row',
        alignItems: 'center',
    },
    showSearchButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#ffffff',
        marginLeft: 8,
    },
    optionLabelContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    infoButton: {
        marginLeft: 8,
        padding: 2,
        borderRadius: 12,
        backgroundColor: '#f3f4f6',
    },
    radioGroup: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    radioOption: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 8,
        marginHorizontal: 4,
        backgroundColor: '#f3f4f6',
        borderRadius: 6,
    },
    radioOptionActive: {
        backgroundColor: '#3b82f6',
    },
    radioText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#6b7280',
    },
    radioTextActive: {
        color: '#ffffff',
    },
});