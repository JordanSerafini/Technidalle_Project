import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { EmailData } from '../../../utils/types/mailTypes';
import { truncateText, extractSenderName } from '../../../utils/functions/mailUtils';
import { formatDateTime } from '../../../utils/dateFormatter';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

type EmailCardProps = {
  email: EmailData;
  expanded: boolean;
  onToggleExpand: () => void;
};

export const EmailCard = ({ email, expanded, onToggleExpand }: EmailCardProps) => {
  const isHighPriority = email.analysis.priority === 'high';
  const hasActions = email.analysis.actionRequired && email.analysis.actionItems.length > 0;
  
  return (
    <TouchableOpacity 
      style={[
        styles.container, 
        isHighPriority ? styles.highPriorityContainer : styles.normalContainer
      ]}
      onPress={onToggleExpand}
      activeOpacity={0.7}
    >
      {/* En-tête avec icône de priorité */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.subjectContainer}>
            {isHighPriority && (
              <MaterialIcons name="priority-high" size={18} color="#ef4444" style={styles.priorityIcon} />
            )}
            <Text style={styles.subjectText} numberOfLines={1}>
              {email.subject || 'Sans objet'}
            </Text>
          </View>
          <View style={styles.dateContainer}>
            <Ionicons name="time-outline" size={14} color="#6b7280" style={styles.timeIcon} />
            <Text style={styles.dateText}>{formatDateTime(email.date)}</Text>
          </View>
        </View>
        
        <View style={styles.senderContainer}>
          <Ionicons name="person-outline" size={14} color="#6b7280" style={styles.senderIcon} />
          <Text style={styles.senderText}>
            {extractSenderName(email.from)}
          </Text>
          
          {isHighPriority && (
            <View style={styles.priorityBadge}>
              <Text style={styles.priorityText}>Prioritaire</Text>
            </View>
          )}
        </View>
      </View>
      
      {/* Contenu du mail */}
      <View style={styles.content}>
        <Text style={styles.summaryText}>
          {truncateText(email.analysis.summary, expanded, 150)}
        </Text>
        
        {email.analysis.summary && email.analysis.summary.length > 150 && (
          <TouchableOpacity 
            onPress={onToggleExpand} 
            style={styles.expandButton}
          >
            <Text style={styles.expandButtonText}>
              {expanded ? 'Voir moins' : 'Voir plus'}
            </Text>
            <Ionicons 
              name={expanded ? "chevron-up" : "chevron-down"} 
              size={16} 
              color="#3b82f6" 
            />
          </TouchableOpacity>
        )}
        
        {/* Actions requises */}
        {hasActions && expanded && (
          <View style={styles.actionsContainer}>
            <View style={styles.actionsHeader}>
              <MaterialIcons name="assignment" size={16} color="#4b5563" />
              <Text style={styles.actionsTitle}>Actions requises:</Text>
            </View>
            
            {email.analysis.actionItems.map((action, actionIndex) => (
              <View key={actionIndex} style={styles.actionItem}>
                <Text style={styles.actionBullet}>•</Text>
                <Text style={styles.actionText}>{action}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
      
      {/* Indicateur visuel en bas si actions requises mais non affichées */}
      {hasActions && !expanded && (
        <View style={styles.actionIndicator}>
          <Ionicons name="alert-circle-outline" size={16} color="#f59e0b" />
          <Text style={styles.actionIndicatorText}>
            Actions requises
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  normalContainer: {
    backgroundColor: 'white',
  },
  highPriorityContainer: {
    backgroundColor: '#fef2f2',
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  subjectContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  priorityIcon: {
    marginRight: 6,
  },
  subjectText: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#111827',
    flex: 1,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  timeIcon: {
    marginRight: 4,
  },
  dateText: {
    fontSize: 12,
    color: '#6b7280',
  },
  senderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  senderIcon: {
    marginRight: 6,
  },
  senderText: {
    fontSize: 14,
    color: '#4b5563',
    flex: 1,
  },
  priorityBadge: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 8,
  },
  priorityText: {
    color: '#b91c1c',
    fontSize: 12,
    fontWeight: '500',
  },
  content: {
    padding: 16,
  },
  summaryText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#374151',
  },
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  expandButtonText: {
    color: '#3b82f6',
    fontSize: 14,
    marginRight: 4,
  },
  actionsContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  actionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4b5563',
    marginLeft: 6,
  },
  actionItem: {
    flexDirection: 'row',
    marginBottom: 6,
    paddingLeft: 8,
  },
  actionBullet: {
    fontSize: 14,
    color: '#6b7280',
    marginRight: 8,
  },
  actionText: {
    fontSize: 14,
    color: '#4b5563',
    flex: 1,
  },
  actionIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fffbeb',
    padding: 8,
    borderTopWidth: 1,
    borderTopColor: '#fef3c7',
  },
  actionIndicatorText: {
    fontSize: 12,
    color: '#92400e',
    fontWeight: '500',
    marginLeft: 6,
  },
});

export default EmailCard; 