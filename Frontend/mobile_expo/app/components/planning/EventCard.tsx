import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { eventTypeColors } from '../../utils/constants/eventTypeColors';
import type { Event } from '../../utils/interfaces/event.interface';

interface EventCardProps extends Omit<Event, 'id'> {}

export function EventCard({
  title,
  description,
  event_type,
  start_date,
  end_date,
  color,
}: EventCardProps) {
  const bandColor = eventTypeColors[event_type] ?? '#CCCCCC';

  return (
    <View style={styles.container} accessibilityRole="summary">
      <View style={[styles.band, { backgroundColor: bandColor }]} />
      <View style={styles.content}>
        <Text style={styles.eventType}>{event_type.replace(/_/g, ' ')}</Text>
        <Text style={styles.title}>{title}</Text>
        {description && <Text style={styles.description}>{description}</Text>}
        {/* Ajoute ici les dates, etc. */}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 8,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    minHeight: 80,
    alignItems: 'stretch',
  },
  band: {
    width: 8,
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
  },
  content: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
  },
  eventType: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#555',
    marginBottom: 2,
    textTransform: 'capitalize',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222',
  },
  description: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
}); 