import { useFetch } from "@/app/hooks/useFetch";
import { ActivityIndicator, Text, View, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView } from "react-native";
import { useState } from "react";
import { DailyPlanningResponse, WeeklyPlanningResponse, PlanningResponse } from "@/app/utils/interfaces/planning.interface";

export function PlanningScreen() {
  const staffId = 1;
  const [ time, setTime ] = useState<string>('today');
  const { data: planning, loading: planningLoading, error: planningError } = useFetch<PlanningResponse | null>(`events/staff/${staffId}/schedule/${time}`);

  console.log("Planning Data:", JSON.stringify(planning, null, 2));
  console.log("Time:", time);

  if (planningLoading) {
    return (
      <SafeAreaView style={styles.centeredContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </SafeAreaView>
    );
  }

  if (planningError) {
    return (
      <SafeAreaView style={styles.centeredContainer}>
        <Text style={styles.errorText}>Erreur lors du chargement du planning: {planningError}</Text>
      </SafeAreaView>
    );
  }

  const renderPlanning = () => {
    if (!planning) {
      return (
        <View style={styles.centeredContainer}>
          <Text>Aucune donnée de planning.</Text>
        </View>
      );
    }

    if ('schedule' in planning && time === 'today') {
      const dailyPlanning = planning as DailyPlanningResponse;
      return (
        <ScrollView style={styles.scrollView}>
          <Text style={styles.dateHeader}>Planning pour le {dailyPlanning.date}:</Text>
          {dailyPlanning.schedule.length === 0 ? (
            <Text style={styles.noItemsText}>Rien de prévu.</Text>
          ) : (
            dailyPlanning.schedule.map(item => (
              <View key={item.id} style={[styles.itemContainer, { borderColor: item.type === 'event' ? 'blue' : 'green' }]}>
                <Text style={styles.itemType}>Type: {item.type}</Text>
                <Text style={styles.itemTitle}>Titre: {item.title}</Text>
                <Text>Projet: {item.project?.name ?? 'N/A'}</Text>
                <Text>Étape: {item.stage?.name ?? 'N/A'}</Text>
                {item.role && <Text>Rôle: {item.role}</Text>}
                {item.type === 'assignment' && item.stage && item.startTime && item.endTime && (
                  <Text>Horaires: {new Date(item.startTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} - {new Date(item.endTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</Text>
                )}
              </View>
            ))
          )}
        </ScrollView>
      );
    } else if ('planning' in planning && time === 'week') {
      const weeklyPlanning = planning as WeeklyPlanningResponse;
      return (
        <ScrollView style={styles.scrollView}>
          <Text style={styles.dateHeader}>Planning pour la semaine du {weeklyPlanning.weekOf}:</Text>
          {Object.entries(weeklyPlanning.planning).map(([date, items]) => (
            <View key={date} style={styles.dayContainer}>
              <Text style={styles.dayHeader}>
                {new Date(date + 'T00:00:00Z').toLocaleDateString('fr-FR', {
                  weekday: 'long', day:'numeric', month:'long'
                })}:
              </Text>
              {items.length === 0 ? (
                <Text style={styles.noItemsText}> - Rien</Text>
              ) : (
                items.map(item => (
                  <Text key={item.id} style={styles.weekItemText}> - {item.title} ({item.type})</Text>
                ))
              )}
            </View>
          ))}
        </ScrollView>
      );
    }

    return (
      <View style={styles.centeredContainer}>
         <Text>Format de planning non reconnu.</Text>
      </View>
     );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.buttonRow}>
          <TouchableOpacity
            onPress={() => setTime('today')}
            style={[styles.button, time === 'today' ? styles.buttonActive : styles.buttonInactive]}
          >
            <Text style={styles.buttonText}>Aujourd'hui</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setTime('week')}
            style={[styles.button, time === 'week' ? styles.buttonActive : styles.buttonInactive]}
          >
            <Text style={styles.buttonText}>Semaine</Text>
          </TouchableOpacity>
        </View>
        {renderPlanning()}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f0f0f0',
  },
  container: {
    flex: 1,
    padding: 15,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: 'red',
    fontSize: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    marginBottom: 15,
    justifyContent: 'center',
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  buttonActive: {
    backgroundColor: '#007bff',
  },
  buttonInactive: {
    backgroundColor: '#cccccc',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  dateHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  itemContainer: {
    marginVertical: 8,
    padding: 10,
    borderWidth: 1,
    borderRadius: 5,
    backgroundColor: 'white',
  },
  itemType: {
    fontWeight: 'bold',
    color: '#555',
    marginBottom: 3,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  noItemsText: {
    fontStyle: 'italic',
    color: '#666',
    marginTop: 5,
  },
  dayContainer: {
    marginTop: 10,
    marginBottom: 5,
  },
  dayHeader: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 5,
    color: '#333',
  },
  weekItemText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#444',
  },
});

export default PlanningScreen;
