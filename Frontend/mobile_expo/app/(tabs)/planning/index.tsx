import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Calendar, EventRenderer, Mode } from 'react-native-big-calendar';
import { AppEvent, EventType, useEvents, moveEvent, deleteEvent } from '../../services/eventsService';
import CreateEventModal from './CreateEventModal';

// Type pour les modes de vue du calendrier
type ViewMode = 'day' | 'week' | 'month';

export function PlanningScreen() {
  const [isUpdating, setIsUpdating] = useState(false);
  const [mode, setMode] = useState<ViewMode>('week');
  const [date, setDate] = useState(() => {
    // Forcer l'année 2024 pour correspondre aux données de la base
    const now = new Date();
    now.setFullYear(2024);
    now.setMonth(3); // Avril (0-indexed, donc 3 = avril)
    now.setDate(15); // Milieu du mois
    now.setHours(0, 0, 0, 0);
    return now;
  });
  const [calendarMode, setCalendarMode] = useState<Mode>('week');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<AppEvent | null>(null);

  // Mettre à jour le mode de calendrier quand le mode de vue change
  useEffect(() => {
    switch (mode) {
      case 'day':
        setCalendarMode('day');
        break;
      case 'week':
        setCalendarMode('week');
        break;
      case 'month':
        setCalendarMode('month');
        break;
    }
  }, [mode]);

  // Calculer les dates de début et de fin selon le mode de vue
  const getDateRange = () => {
    const today = new Date(date);
    let startDate = new Date(today);
    let endDate = new Date(today);
    
    // Réinitialiser l'heure à minuit
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);
    
    switch (mode) {
      case 'day':
        // Juste ce jour
        break;
      case 'week':
        // Une semaine complète (Lundi-Dimanche)
        const day = startDate.getDay();
        const diff = day === 0 ? -6 : 1 - day; // Si dimanche, on va au lundi précédent
        startDate.setDate(startDate.getDate() + diff);
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'month':
        // Début du mois
        startDate.setDate(1);
        // Fin du mois
        endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
    }
    
    return { startDate, endDate };
  };
  
  const { startDate, endDate } = getDateRange();
  
  // Utiliser le hook useEvents pour récupérer les événements
  const { events, loading, error } = useEvents(startDate, endDate);

  // Convertir les AppEvents en format compatible avec react-native-big-calendar
  const calendarEvents = useMemo(() => {
    if (!events) return [];
    
    return events.map(event => {
      const startDate = new Date(event.start);
      const endDate = new Date(event.end);
      
      if (event.metadata?.all_day) {
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
      }

      return {
        id: event.id,
        title: event.title,
        start: startDate,
        end: endDate,
        color: event.color || getEventTypeColor(event.metadata?.event_type),
        metadata: event.metadata
      };
    });
  }, [events]);

  // Gestionnaire de changement de date sécurisé
  const handleDateChange = useCallback((newDate: Date | Date[]) => {
    console.log('Date changed from Calendar:', newDate);
    const dateToSet = Array.isArray(newDate) ? newDate[0] : newDate;
    setDate(new Date(dateToSet));
  }, []);

  // Gestion du déplacement d'un événement
  const handleEventMove = async (eventId: string, newStartDate: Date, newEndDate: Date) => {
    setIsUpdating(true);
    
    try {
      const success = await moveEvent(eventId, newStartDate, newEndDate);
      
      if (success) {
        Alert.alert("Succès", "Événement mis à jour avec succès");
      } else {
        Alert.alert("Erreur", "Impossible de mettre à jour l'événement");
      }
    } catch (error) {
      console.error("Erreur lors du déplacement de l'événement:", error);
      Alert.alert("Erreur", "Une erreur est survenue lors du déplacement de l'événement");
    } finally {
      setIsUpdating(false);
    }
  };

  // Gestion du clic sur un événement
  const handleEventPress = (event: any) => {
    const startDate = new Date(event.start);
    const endDate = new Date(event.end);
    
    const projectText = event.metadata?.project_id 
      ? `Projet: ${event.metadata.project_id}\n` 
      : '';
    const staffText = event.metadata?.staff_id 
      ? `Personnel: ${event.metadata.staff_id}\n` 
      : '';
    const clientText = event.metadata?.client_id 
      ? `Client: ${event.metadata.client_id}\n` 
      : '';
    const eventType = event.metadata?.event_type 
      ? `Type: ${event.metadata.event_type}\n` 
      : '';
    
    Alert.alert(
      event.title,
      `${eventType}Début: ${startDate.toLocaleTimeString()}\nFin: ${endDate.toLocaleTimeString()}\n${projectText}${staffText}${clientText}`,
      [
        { text: "Fermer" },
        { 
          text: "Supprimer", 
          style: 'destructive',
          onPress: () => confirmDeleteEvent(event.id)
        },
        {
          text: "Modifier",
          onPress: () => handleEditEvent(event),
        },
        {
          text: "Déplacer",
          onPress: () => handleMoveEventPress(event)
        }
      ]
    );
  };

  // Gestion de la modification d'un événement
  const handleEditEvent = (event: any) => {
    // Convertir en format adapté pour le formulaire de modification
    const editableEvent = {
      id: event.id,
      title: event.title,
      description: event.metadata?.description,
      start: new Date(event.start),
      end: new Date(event.end),
      event_type: event.metadata?.event_type as EventType,
      all_day: event.metadata?.all_day,
      location: event.metadata?.location,
      project_id: event.metadata?.project_id,
      staff_id: event.metadata?.staff_id,
      client_id: event.metadata?.client_id,
    };
    
    setSelectedEvent(editableEvent as any);
    setShowCreateModal(true);
  };

  // Gestion de la demande de déplacement d'un événement
  const handleMoveEventPress = (event: any) => {
    // Exemple simple: déplacer d'une heure
    const currentStart = new Date(event.start);
    const currentEnd = new Date(event.end);
    
    // On pourrait ici ouvrir une modale pour sélectionner une nouvelle date/heure
    // Pour cet exemple, on se contente d'une alerte avec des options prédéfinies
    Alert.alert(
      "Déplacer l'événement",
      "Choisissez une option:",
      [
        { text: "Annuler", style: "cancel" },
        { 
          text: "+1 heure", 
          onPress: () => {
            const newStart = new Date(currentStart);
            const newEnd = new Date(currentEnd);
            newStart.setHours(newStart.getHours() + 1);
            newEnd.setHours(newEnd.getHours() + 1);
            handleEventMove(event.id, newStart, newEnd);
          }
        },
        { 
          text: "+1 jour", 
          onPress: () => {
            const newStart = new Date(currentStart);
            const newEnd = new Date(currentEnd);
            newStart.setDate(newStart.getDate() + 1);
            newEnd.setDate(newEnd.getDate() + 1);
            handleEventMove(event.id, newStart, newEnd);
          }
        }
      ]
    );
  };

  // Confirmation de suppression d'un événement
  const confirmDeleteEvent = (eventId: string) => {
    Alert.alert(
      "Confirmer la suppression",
      "Êtes-vous sûr de vouloir supprimer cet événement ?",
      [
        { text: "Annuler", style: "cancel" },
        { 
          text: "Supprimer", 
          style: "destructive",
          onPress: () => handleDeleteEvent(eventId)
        }
      ]
    );
  };

  // Suppression d'un événement
  const handleDeleteEvent = async (eventId: string) => {
    setIsUpdating(true);
    
    try {
      const success = await deleteEvent(eventId);
      
      if (success) {
        Alert.alert("Succès", "Événement supprimé avec succès");
      } else {
        Alert.alert("Erreur", "Impossible de supprimer l'événement");
      }
    } catch (error) {
      console.error("Erreur lors de la suppression de l'événement:", error);
      Alert.alert("Erreur", "Une erreur est survenue lors de la suppression de l'événement");
    } finally {
      setIsUpdating(false);
    }
  };

  // Changer la période (précédente/suivante)
  const changePeriod = useCallback((direction: 'prev' | 'next') => {
    const newDate = new Date(date);
    console.log('Changing period:', { direction, currentDate: date, mode });
    
    switch (mode) {
      case 'day':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
        break;
      case 'week':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
        break;
      case 'month':
        // Pour la vue mensuelle, on s'assure d'être au 1er du mois
        if (direction === 'next') {
          newDate.setMonth(newDate.getMonth() + 1, 1);
        } else {
          newDate.setMonth(newDate.getMonth() - 1, 1);
        }
        break;
    }
    
    console.log('New date after change:', newDate);
    setDate(newDate);
  }, [date, mode]);

  // Gestion des changements de mode de vue
  const changeMode = (newMode: ViewMode) => {
    setMode(newMode);
  };

  // Récupérer la couleur d'un type d'événement
  const getEventTypeColor = (eventType?: EventType): string => {
    if (!eventType) return '#9E9E9E';
    
    switch (eventType) {
      case 'appel_telephonique': return '#4FC3F7';
      case 'reunion_chantier': return '#4DB6AC';
      case 'visite_technique': return '#4291EF';
      case 'rendez_vous_client': return '#7986CB';
      case 'reunion_interne': return '#4CAF50';
      case 'formation': return '#BA68C8';
      case 'livraison_materiaux': return '#FF9800';
      case 'intervention_urgente': return '#F44336';
      case 'maintenance': return '#FFB74D';
      case 'autre': return '#9E9E9E';
      default: return '#9E9E9E';
    }
  };

  // Rendu personnalisé de l'événement
  const eventRenderer: EventRenderer<any> = (event) => {
    const color = event.color || '#9E9E9E';
    
    return (
      <TouchableOpacity 
        style={{ 
          backgroundColor: color, 
          borderRadius: 5, 
          flex: 1, 
          padding: 5,
          paddingHorizontal: 10,
          justifyContent: 'center'
        }}
        onPress={() => handleEventPress(event)}
        onLongPress={() => handleMoveEventPress(event)}
      >
        <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 12 }}>
          {event.title}
        </Text>
        
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 2 }}>
          {event.metadata?.project_id && (
            <View style={{ 
              backgroundColor: 'rgba(255,255,255,0.3)', 
              paddingHorizontal: 4, 
              paddingVertical: 2, 
              borderRadius: 8, 
              marginRight: 4,
              marginTop: 2
            }}>
              <Text style={{ color: 'white', fontSize: 10 }}>
                P#{event.metadata.project_id}
              </Text>
            </View>
          )}
          
          {event.metadata?.staff_id && (
            <View style={{ 
              backgroundColor: 'rgba(255,255,255,0.3)', 
              paddingHorizontal: 4, 
              paddingVertical: 2, 
              borderRadius: 8, 
              marginRight: 4,
              marginTop: 2
            }}>
              <Text style={{ color: 'white', fontSize: 10 }}>
                S#{event.metadata.staff_id}
              </Text>
            </View>
          )}
          
          {event.metadata?.client_id && (
            <View style={{ 
              backgroundColor: 'rgba(255,255,255,0.3)', 
              paddingHorizontal: 4, 
              paddingVertical: 2, 
              borderRadius: 8,
              marginTop: 2
            }}>
              <Text style={{ color: 'white', fontSize: 10 }}>
                C#{event.metadata.client_id}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // Obtenir le texte de la période affichée
  const getDateRangeText = useCallback(() => {
    const formatDate = (d: Date) => {
      // Utiliser l'API Intl pour un formatage localisé
      return new Intl.DateTimeFormat('fr-FR', {
        day: 'numeric',
        month: 'numeric',
        year: 'numeric'
      }).format(d);
    };
    
    const currentDate = new Date(date);
    
    switch (mode) {
      case 'day':
        return formatDate(currentDate);
      case 'week': {
        const weekStart = new Date(currentDate);
        const day = weekStart.getDay();
        const diff = day === 0 ? -6 : 1 - day; // Si dimanche, on va au lundi précédent
        weekStart.setDate(weekStart.getDate() + diff);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        return `${formatDate(weekStart)} - ${formatDate(weekEnd)}`;
      }
      case 'month': {
        const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
        return `${formatDate(monthStart)} - ${formatDate(monthEnd)}`;
      }
      default:
        return formatDate(currentDate);
    }
  }, [date, mode]);

  // Affichage d'un message d'erreur si échec de chargement
  if (error) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: 'red' }}>Erreur de chargement: {error}</Text>
        <TouchableOpacity 
          style={{ marginTop: 20, padding: 10, backgroundColor: '#4291EF', borderRadius: 5 }}
          onPress={() => window.location.reload()}
        >
          <Text style={{ color: 'white' }}>Réessayer</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // Gestionnaire de fermeture de la modale
  const handleCloseModal = () => {
    setShowCreateModal(false);
    setSelectedEvent(null);
  };

  // Gestionnaire de sauvegarde d'un événement
  const handleSaveEvent = (success: boolean) => {
    setShowCreateModal(false);
    setSelectedEvent(null);
    
    if (success) {
      // Rafraîchir les données
      // La prochaine fois que le composant se rendra, useEvents sera appelé à nouveau
    }
  };

  // Afficher la modale de création d'événement
  const handleAddEvent = () => {
    setSelectedEvent(null);
    setShowCreateModal(true);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
      {(loading || isUpdating) && (
        <View style={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          justifyContent: 'center', 
          alignItems: 'center', 
          zIndex: 999, 
          backgroundColor: 'rgba(255,255,255,0.7)' 
        }}>
          <ActivityIndicator size="large" color="#4291EF" />
        </View>
      )}
      
      {/* Modale de création/édition d'événement */}
      <CreateEventModal
        visible={showCreateModal}
        onClose={handleCloseModal}
        onSave={handleSaveEvent}
        editEvent={selectedEvent as any}
      />
      
      {/* En-tête avec les boutons de mode de vue */}
      <View style={{ 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        padding: 10, 
        backgroundColor: 'white',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1.5,
      }}>
        <Text style={{ fontSize: 20, fontWeight: 'bold' }}>Planning</Text>
        <View style={{ flexDirection: 'row' }}>
          <TouchableOpacity 
            style={{ 
              padding: 8, 
              borderRadius: 5, 
              marginHorizontal: 5,
              backgroundColor: mode === 'day' ? '#4291EF' : 'transparent'
            }}
            onPress={() => changeMode('day')}
          >
            <Text style={{ color: mode === 'day' ? 'white' : 'black' }}>Jour</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={{ 
              padding: 8, 
              borderRadius: 5, 
              marginHorizontal: 5,
              backgroundColor: mode === 'week' ? '#4291EF' : 'transparent'
            }}
            onPress={() => changeMode('week')}
          >
            <Text style={{ color: mode === 'week' ? 'white' : 'black' }}>Semaine</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={{ 
              padding: 8, 
              borderRadius: 5, 
              marginHorizontal: 5,
              backgroundColor: mode === 'month' ? '#4291EF' : 'transparent'
            }}
            onPress={() => changeMode('month')}
          >
            <Text style={{ color: mode === 'month' ? 'white' : 'black' }}>Mois</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Navigation de date */}
      <View style={{ 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: 10, 
        backgroundColor: '#f0f0f0'
      }}>
        <TouchableOpacity 
          onPress={() => changePeriod('prev')} 
          style={{ 
            padding: 10,
            borderRadius: 5,
            backgroundColor: '#fff'
          }}
        >
          <Ionicons name="chevron-back" size={24} color="#4291EF" />
        </TouchableOpacity>
        
        <Text style={{ 
          fontSize: 16, 
          fontWeight: '500',
          flex: 1,
          textAlign: 'center',
          marginHorizontal: 10
        }}>
          {getDateRangeText()}
        </Text>
        
        <TouchableOpacity 
          onPress={() => changePeriod('next')} 
          style={{ 
            padding: 10,
            borderRadius: 5,
            backgroundColor: '#fff'
          }}
        >
          <Ionicons name="chevron-forward" size={24} color="#4291EF" />
        </TouchableOpacity>
      </View>
      
      {/* Calendrier */}
      <View style={{ flex: 1, backgroundColor: '#ffffff' }}>
        <Calendar
          events={calendarEvents}
          height={600}
          mode={calendarMode}
          date={date}
          swipeEnabled={true}
          showTime={true}
          eventCellStyle={(event) => ({
            backgroundColor: event.color,
            borderRadius: 5,
            padding: 4,
            minHeight: event.metadata?.all_day ? 25 : 'auto'
          })}
          renderEvent={eventRenderer}
          locale="fr"
          hideNowIndicator={false}
          scrollOffsetMinutes={420} // Commencer à 7h00
          onPressEvent={handleEventPress}
          onPressCell={handleAddEvent}
          weekStartsOn={1} // La semaine commence le lundi
          hourRowHeight={60} // Hauteur d'une heure
          overlapOffset={70} // Décalage pour les événements qui se chevauchent
          ampm={false} // Utiliser le format 24h
          onChangeDate={handleDateChange}
        />
      </View>
      
      {/* Bouton d'ajout */}
      <TouchableOpacity 
        style={{
          position: 'absolute',
          right: 20,
          bottom: 20,
          width: 60,
          height: 60,
          borderRadius: 30,
          backgroundColor: '#4291EF',
          justifyContent: 'center',
          alignItems: 'center',
          elevation: 5,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.3,
          shadowRadius: 3,
        }}
        onPress={handleAddEvent}
      >
        <Ionicons name="add" size={30} color="white" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

export default PlanningScreen;
