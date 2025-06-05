import React from 'react';
import { View, Text, FlatList, Alert } from 'react-native';
import { router } from 'expo-router';
import { DataCardsProps, StaffData, ClientData, ProjectData, DocumentData, ScheduleItemData } from '@/app/utils/interfaces/datacard.interface';

import { ClientCard, ProjectCard, DocumentCard, ScheduleCard, StaffCard } from "./cards";
const DataCards: React.FC<DataCardsProps> = ({ data, format, title, onItemPress }) => {

  if (!data || data.length === 0) {
    return null;
  }

  // Cette fonction n'est plus utilisée pour la navigation si onItemPress est fourni
  const navigateToDetailPage = (item: any) => {
    console.log("navigateToDetailPage called with:", item);
    if (onItemPress) {
        onItemPress(item); // Utiliser la prop si elle existe
        return; // Sortir après avoir utilisé la prop
    }
    
    // Logique de navigation par défaut si onItemPress n'est PAS fourni (ce cas ne devrait pas arriver ici mais par sécurité)
    if ('firstname' in item && 'lastname' in item) {
      // Client
      router.push({
        pathname: "/(tabs)/clients/[id]",
        params: { id: item.id.toString() }
      });
    } else if ('reference' in item && 'start_date' in item) {
      // Projet
      router.push({
        pathname: "/(tabs)/projects/[id]",
        params: { id: item.id.toString() }
      });
    } else if ('reference' in item && 'issue_date' in item) {
      // Document
      router.push({
        pathname: "/(tabs)/documents/[id]",
        params: { id: item.id.toString() }
      });
    } else if (item.id && item.title && 'type' in item && (item.type === 'event' || item.type === 'assignment')) {
       // Planning item
       if (item.project?.id) {
          router.push({
            pathname: "/(tabs)/projects/[id]",
            params: { id: item.project.id.toString() }
          });
        } else {
          router.push({
            pathname: "/(tabs)/planning"
          });
        }
    } else {
      Alert.alert(
        "Type d'élément non pris en charge pour la navigation."
      );
    }
  };

  const renderCard = ({ item }: { item: any }) => {
    // Déterminer le type de carte à rendre
    if ('firstname' in item && 'lastname' in item) {
      return <ClientCard client={item} onPress={onItemPress} />; // Passer onItemPress
    } else if ('reference' in item && 'start_date' in item) {
      return <ProjectCard project={item} onPress={onItemPress} />; // Passer onItemPress
    } else if ('reference' in item && 'issue_date' in item) {
      return <DocumentCard document={item} onPress={onItemPress} />; // Passer onItemPress
    } else if (item.id && item.title && 'type' in item && (item.type === 'event' || item.type === 'assignment')) {
       return <ScheduleCard scheduleItem={item} onPress={onItemPress} />; // Passer onItemPress
    } else if ('staff_id' in item && 'firstname' in item) {
       // Staff Card - Assuming StaffCard also accepts an onPress prop
       // If StaffCard does not need navigation, no onPress is needed here
       return <StaffCard staff={item} />; 
    }
    // Retourner null ou une carte générique si le type est inconnu
    return null;
  };

  // Déterminer le type de données à afficher

  const isClientData = format === "table" && data[0] && "firstname" in data[0] && "lastname" in data[0];
  const isProjectData = format === "table" && data[0] && "reference" in data[0] && "start_date" in data[0];
  const isDocumentData = format === "table" && data[0] && "reference" in data[0] && "issue_date" in data[0] && !("start_date" in data[0]);
  const isScheduleData = format === "table" && data[0] && "title" in data[0] && ("type" in data[0]) && (data[0].type === "event" || data[0].type === "assignment");
  const renderContent = () => {
    if (!data || data.length === 0) {
      return (
        <View className="p-4 bg-gray-50 rounded-lg">
          <Text className="text-gray-500 text-center">Aucune donnée disponible</Text>
        </View>
      );
    }

    // Vérifier si c'est une liste de personnel
    if (data[0] && 'firstname' in data[0] && 'lastname' in data[0]) {
      return (
        <View>
          {data.map((staff, index) => (
            <StaffCard key={index} staff={staff as StaffData} />
          ))}
        </View>
      );
    }

    if (isClientData) {
      return (
        <View className="mt-2">
          {title && (
            <Text className="text-lg font-semibold mb-2">{title}</Text>
          )}
          <FlatList
            data={data}
            keyExtractor={(item: ClientData) => item.id.toString()}
            renderItem={renderCard}
            scrollEnabled={true}
            nestedScrollEnabled={true}
            style={{ maxHeight: 400 }}
          />
        </View>
      );
    }
    
    if (isProjectData) {
      return (
        <View className="mt-2">
          {title && (
            <Text className="text-lg font-semibold mb-2">{title}</Text>
          )}
          <FlatList
            data={data}
            keyExtractor={(item: ProjectData) => item.id.toString()}
            renderItem={renderCard}
            scrollEnabled={true}
            nestedScrollEnabled={true}
            style={{ maxHeight: 400 }}
          />
        </View>
      );
    }

    if (isDocumentData) {
      return (
        <View className="mt-2">
          {title && (
            <Text className="text-lg font-semibold mb-2">{title}</Text>
          )}
          <FlatList
            data={data}
            keyExtractor={(item: DocumentData) => item.id.toString()}
            renderItem={renderCard}
            scrollEnabled={true}
            nestedScrollEnabled={true}
            style={{ maxHeight: 400 }}
          />
        </View>
      );
    }

    if (isScheduleData) {
      return (
        <View className="mt-2">
          {title && (
            <Text className="text-lg font-semibold mb-2">{title}</Text>
          )}
          <FlatList
            data={data}
            keyExtractor={(item: ScheduleItemData) => item.id.toString()}
            renderItem={renderCard}
            scrollEnabled={true}
            nestedScrollEnabled={true}
            style={{ maxHeight: 400 }}
          />
        </View>
      );
    }

    // Format générique pour d'autres types de données
    return (
      <View className="mt-2">
        {title && (
          <Text className="text-lg font-semibold mb-2">{title}</Text>
        )}
        <FlatList
          data={data}
          keyExtractor={(_: any, index: number) => index.toString()}
          renderItem={renderCard}
          scrollEnabled={true}
          nestedScrollEnabled={true}
          style={{ maxHeight: 400 }}
        />
      </View>
    );
  };

  return (
    <View className="mt-2">
      {title && (
        <Text className="text-lg font-semibold mb-2">{title}</Text>
      )}
      {renderContent()}
    </View>
  );
};

export default DataCards; 