import React, { useState, Suspense, lazy } from 'react';
import { SafeAreaView, StyleSheet, View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { Ionicons } from '@expo/vector-icons';
import MailSummary from '@/app/components/email/MailSummary';

// Import lazy du composant EmailResponder pour éviter tout effet de bord
const EmailResponder = lazy(() => 
  import('@/app/components/email/EmailResponder').then(module => ({
    default: module.default
  }))
);

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<'summary' | 'sender'>('summary');

  const renderTabs = () => {
    return (
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'summary' && styles.activeTab]}
          onPress={() => setActiveTab('summary')}
        >
          <Ionicons 
            name="mail-outline" 
            size={20} 
            color={activeTab === 'summary' ? '#3b82f6' : '#6b7280'} 
          />
          <Text style={[styles.tabText, activeTab === 'summary' && styles.activeTabText]}>
            Résumé
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'sender' && styles.activeTab]}
          onPress={() => setActiveTab('sender')}
        >
          <Ionicons 
            name="send-outline" 
            size={20} 
            color={activeTab === 'sender' ? '#3b82f6' : '#6b7280'} 
          />
          <Text style={[styles.tabText, activeTab === 'sender' && styles.activeTabText]}>
            Répondre
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Composant de fallback pour le chargement lazy
  const LazyFallback = () => (
    <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
      <ActivityIndicator size="large" color="#3b82f6" />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {renderTabs()}
      
      {/* Content based on active tab */}
      <View style={styles.content}>
        <View style={{ display: activeTab === 'summary' ? 'flex' : 'none', flex: 1 }}>
          <MailSummary />
        </View>
        <View style={{ display: activeTab === 'sender' ? 'flex' : 'none', flex: 1 }}>
          <Suspense fallback={<LazyFallback />}>
            <EmailResponder />
          </Suspense>
        </View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingHorizontal: 10,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginRight: 10,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#3b82f6',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
    color: '#6b7280',
  },
  activeTabText: {
    color: '#3b82f6',
  },
  content: {
    flex: 1,
  }
});