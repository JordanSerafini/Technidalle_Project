import React, { useEffect, useState, useRef } from 'react';
import { View, Text, ScrollView, RefreshControl, StyleSheet, TouchableOpacity } from "react-native";
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
            <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{stats.totalEmails}</Text>
                    <Text style={styles.statLabel}>Emails</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{stats.highPriorityCount}</Text>
                    <Text style={styles.statLabel}>Prioritaires</Text>
                </View>
                <View style={styles.statDivider} />
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
                    style={[styles.filterButton, filterType === 'high' && styles.activeFilterButton]}
                    onPress={() => setFilterType('high')}
                >
                    <MaterialIcons 
                        name="priority-high" 
                        size={16} 
                        color={filterType === 'high' ? '#ffffff' : '#6b7280'} 
                    />
                    <Text style={[styles.filterText, filterType === 'high' && styles.activeFilterText]}>
                        Prioritaires
                    </Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                    style={[styles.filterButton, filterType === 'action' && styles.activeFilterButton]}
                    onPress={() => setFilterType('action')}
                >
                    <Ionicons 
                        name="alert-circle-outline" 
                        size={16} 
                        color={filterType === 'action' ? '#ffffff' : '#6b7280'} 
                    />
                    <Text style={[styles.filterText, filterType === 'action' && styles.activeFilterText]}>
                        Actions
                    </Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                    style={[styles.filterButton, filterType === 'all' && styles.activeFilterButton]}
                    onPress={() => setFilterType('all')}
                >
                    <Ionicons 
                        name="mail-outline" 
                        size={16} 
                        color={filterType === 'all' ? '#ffffff' : '#6b7280'} 
                    />
                    <Text style={[styles.filterText, filterType === 'all' && styles.activeFilterText]}>
                        Tous
                    </Text>
                </TouchableOpacity>
            </View>
        );
    };

    const emailGroups = groupedEmails();
    const emailsToShow = filteredEmails();

    return (
        <View style={styles.container}>
            <View style={styles.headerContainer}>
                <Ionicons name="mail-outline" size={24} color="#1e40af" style={styles.headerIcon} />
                <Text style={styles.headerTitle}>Résumé des Emails</Text>
            </View>
            
            <ScrollView 
                style={styles.scrollContainer}
                contentContainerStyle={styles.contentContainer}
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
                        <OverviewCard overview={overview} />
                        {renderSummaryStats()}
                        {renderFilterButtons()}
                    </>
                )}
                
                {!loading && !error && emailsToShow.length === 0 && (
                    <EmptyState />
                )}
                
                {!loading && !error && emailsToShow.length > 0 && (
                    <View style={styles.emailsSection}>
                        {Object.entries(emailGroups).map(([category, categoryEmails]) => (
                            <View key={category} style={styles.categorySection}>
                                <View style={styles.sectionHeader}>
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
                                    <Text style={styles.sectionTitle}>
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
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        width: '100%',
        borderRadius: 0,
        overflow: 'hidden',
        backgroundColor: 'white',
    },
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        width: '100%',
        backgroundColor: '#d1fae5',
        borderBottomWidth: 1,
        borderBottomColor: '#a7f3d0',
    },
    headerIcon: {
        marginRight: 10,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#064e3b',
    },
    scrollContainer: {
        flex: 1,
        width: '100%',
    },
    contentContainer: {
        padding: 16,
        width: '100%',
    },
    emailsSection: {
        marginTop: 8,
        width: '100%',
    },
    categorySection: {
        marginBottom: 20,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1e40af',
        marginLeft: 8,
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        backgroundColor: '#f0f9ff',
        borderRadius: 12,
        padding: 16,
        marginVertical: 16,
        borderWidth: 1,
        borderColor: '#e0f2fe',
    },
    statItem: {
        alignItems: 'center',
    },
    statNumber: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1e40af',
    },
    statLabel: {
        fontSize: 12,
        color: '#6b7280',
        marginTop: 4,
    },
    statDivider: {
        height: 30,
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
        backgroundColor: '#f3f4f6',
        flex: 1,
        marginHorizontal: 4,
    },
    activeFilterButton: {
        backgroundColor: '#3b82f6',
    },
    filterText: {
        fontSize: 12,
        fontWeight: '500',
        color: '#6b7280',
        marginLeft: 4,
    },
    activeFilterText: {
        color: '#ffffff',
    },
});