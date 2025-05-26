import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { router } from 'expo-router';
import { ClientCardProps, ProjectCardProps, DocumentCardProps, ScheduleCardProps, DataCardsProps, StaffData, ClientData, ProjectData, DocumentData, ScheduleItemData } from '@/app/utils/interfaces/datacard.interface';


const ClientCard: React.FC<ClientCardProps> = ({ client, onPress }) => {
  const handlePress = () => {
    // Navigation vers la page de détail du client
    if (onPress) {
      onPress(client);
    } else {
      // Navigation par défaut si onPress n'est pas fourni
      router.push({
        pathname: "/(tabs)/clients/[id]",
        params: { id: client.id.toString() }
      });
    }
  };

  return (
    <TouchableOpacity 
      className="bg-white rounded-lg p-4 mb-2 shadow-sm border border-gray-200"
      onPress={onPress ? () => onPress(client) : handlePress}
    >
      <View className="flex-row justify-between items-start">
        <View className="flex-1">
          <Text className="text-lg font-bold">
            {client.firstname ? `${client.firstname} ${client.lastname}` : client.lastname}
          </Text>
          <Text className="text-gray-500 mt-1">{client.addresses?.city || 'Ville non spécifiée'}</Text>
        </View>
        <View className="bg-blue-100 rounded-full p-2">
          <Ionicons name="person" size={24} color="#3b82f6" />
        </View>
      </View>

      <View className="mt-3 pt-3 border-t border-gray-100">
        {client.email && client.email.indexOf('no-email') === -1 && (
          <View className="flex-row items-center mb-1">
            <Ionicons name="mail-outline" size={16} color="#6b7280" />
            <Text className="text-gray-700 ml-2 text-sm">{client.email}</Text>
          </View>
        )}
        
        {client.phone && (
          <View className="flex-row items-center">
            <Ionicons name="call-outline" size={16} color="#6b7280" />
            <Text className="text-gray-700 ml-2 text-sm">{client.phone}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

// Composant pour afficher un projet
const ProjectCard: React.FC<ProjectCardProps> = ({ project, onPress }) => {
  const handlePress = () => {
    // Navigation vers la page de détail du projet
    if (onPress) {
      onPress(project);
    } else {
      // Navigation par défaut si onPress n'est pas fourni
      router.push({
        pathname: "/(tabs)/projects/[id]",
        params: { id: project.id.toString() }
      });
    }
  };

  // Formatage des dates
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy', { locale: fr });
    } catch (e) {
      return 'Date invalide';
    }
  };

  // Déterminer l'icône et la couleur en fonction du statut
  let statusIcon: any = "time";
  let statusColor = "#6b7280"; // gris par défaut
  
  switch (project.status) {
    case 'en_cours':
      statusIcon = "play-circle";
      statusColor = "#3b82f6"; // bleu
      break;
    case 'terminé':
      statusIcon = "checkmark-circle";
      statusColor = "#10b981"; // vert
      break;
    case 'en_attente':
      statusIcon = "pause-circle";
      statusColor = "#f59e0b"; // orange
      break;
    case 'annulé':
      statusIcon = "close-circle";
      statusColor = "#ef4444"; // rouge
      break;
  }

  return (
    <TouchableOpacity 
      className="bg-white rounded-lg p-4 mb-2 shadow-sm border border-gray-200"
      onPress={onPress ? () => onPress(project) : handlePress}
    >
      <View className="flex-row justify-between items-start">
        <View className="flex-1">
          <Text className="text-lg font-bold">{project.name}</Text>
          <Text className="text-gray-600 text-sm">{project.reference}</Text>
          <Text className="text-gray-500 mt-1 text-sm">{project.description}</Text>
        </View>
        <View style={{ backgroundColor: `${statusColor}20` }} className="rounded-full p-2">
          <Ionicons name={statusIcon} size={24} color={statusColor} />
        </View>
      </View>

      <View className="mt-3 pt-3 border-t border-gray-100">
        <View className="flex-row flex-wrap justify-between">
          <View className="flex-row items-center mb-1 mr-2">
            <Ionicons name="calendar" size={16} color="#6b7280" />
            <Text className="text-gray-700 ml-1 text-sm">
              {formatDate(project.start_date)} - {formatDate(project.end_date)}
            </Text>
          </View>
          
          <View className="flex-row items-center mb-1">
            <Ionicons name="cash" size={16} color="#6b7280" />
            <Text className="text-gray-700 ml-1 text-sm">
              {project.budget ? project.budget.toLocaleString('fr-FR') : '0'} €
            </Text>
          </View>
        </View>
        
        {project.notes && (
          <View className="mt-1">
            <Text className="text-gray-600 text-sm italic">{project.notes}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

// Composant pour afficher un document
const DocumentCard: React.FC<DocumentCardProps> = ({ document, onPress }) => {
  const handlePress = () => {
    // Navigation vers la page de détail du document
    if (onPress) {
      onPress(document);
    } else {
      // Navigation par défaut si onPress n'est pas fourni
      router.push({
        pathname: "/(tabs)/documents/[id]",
        params: { id: document.id.toString() }
      });
    }
  };

  // Formatage des dates
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy', { locale: fr });
    } catch (e) {
      return 'Date invalide';
    }
  };

  // Obtenir l'icône selon le type
  const getIconForType = (type: string) => {
    switch (type.toLowerCase()) {
      case 'devis': return 'document-text';
      case 'facture': return 'receipt';
      case 'bon_de_commande': return 'cart';
      case 'bon_de_livraison': return 'cube';
      case 'fiche_technique': return 'document-attach';
      case 'photo_chantier': return 'camera';
      case 'plan': return 'map';
      default: return 'document';
    }
  };

  // Obtenir la couleur selon le statut
  const getStatusColor = (status?: string) => {
    if (!status) return "#6b7280"; // gris par défaut

    switch (status.toLowerCase()) {
      case 'brouillon': return "#6b7280"; // gris
      case 'en_attente': return "#f59e0b"; // orange
      case 'valide': return "#10b981"; // vert
      case 'refuse': return "#ef4444"; // rouge
      case 'annule': return "#9ca3af"; // gris clair
      default: return "#6b7280"; // gris par défaut
    }
  };

  // Formater le type et le statut pour l'affichage
  const formatDocumentType = (type: string) => {
    return type.replace(/_/g, ' ');
  };

  return (
    <TouchableOpacity 
      className="bg-white rounded-lg p-4 mb-2 shadow-sm border border-gray-200"
      onPress={onPress ? () => onPress(document) : handlePress}
    >
      <View className="flex-row justify-between items-start">
        <View className="flex-1">
          <Text className="text-lg font-bold">{document.reference}</Text>
          <Text className="text-gray-600 text-sm">{formatDocumentType(document.type)}</Text>
          {document.status && (
            <Text 
              style={{ color: getStatusColor(document.status) }}
              className="text-sm font-medium mt-1"
            >
              {document.status.replace(/_/g, ' ')}
            </Text>
          )}
        </View>
        <View className="rounded-full p-2" style={{ backgroundColor: "#e0f2fe" }}>
          <Ionicons name={getIconForType(document.type)} size={24} color="#0284c7" />
        </View>
      </View>

      <View className="mt-3 pt-3 border-t border-gray-100">
        <View className="flex-row flex-wrap justify-between">
          <View className="flex-row items-center mb-1 mr-2">
            <Ionicons name="calendar" size={16} color="#6b7280" />
            <Text className="text-gray-700 ml-1 text-sm">
              {formatDate(document.issue_date)}
              {document.due_date ? ` - ${formatDate(document.due_date)}` : ''}
            </Text>
          </View>
          
          {document.amount !== undefined && (
            <View className="flex-row items-center mb-1">
              <Ionicons name="cash" size={16} color="#6b7280" />
              <Text className="text-gray-700 ml-1 text-sm">
                {document.amount ? document.amount.toLocaleString('fr-FR') : '0'} €
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

// Composant pour afficher un élément de planning
const ScheduleCard: React.FC<ScheduleCardProps> = ({ scheduleItem, onPress }) => {
  const handlePress = () => {
    // Navigation vers le planning ou le projet associé
    if (onPress) {
      onPress(scheduleItem);
    } else {
      // Si c'est lié à un projet, naviguer vers ce projet
      if (scheduleItem.project?.id) {
        router.push({
          pathname: "/(tabs)/projects/[id]",
          params: { id: scheduleItem.project.id.toString() }
        });
      } else {
        // Sinon, naviguer vers le planning
        router.push({
          pathname: "/(tabs)/planning"
        });
      }
    }
  };

  // Formatage des dates et heures
  const formatTime = (timeString?: string) => {
    if (!timeString) return '';
    try {
      return format(new Date(timeString), 'HH:mm', { locale: fr });
    } catch (e) {
      return '';
    }
  };

  return (
    <TouchableOpacity 
      className="bg-white rounded-lg p-4 mb-2 shadow-sm border border-gray-200"
      onPress={onPress ? () => onPress(scheduleItem) : handlePress}
    >
      <View className="flex-row justify-between items-start">
        <View className="flex-1">
          <Text className="text-lg font-bold">{scheduleItem.title}</Text>
          <Text className="text-gray-600 text-sm">
            {scheduleItem.type === 'event' ? 'Événement' : 'Mission'}
            {scheduleItem.eventType ? ` • ${scheduleItem.eventType}` : ''}
          </Text>
          {scheduleItem.project?.name && (
            <Text className="text-blue-600 text-sm mt-1">
              Projet: {scheduleItem.project.name}
            </Text>
          )}
          {scheduleItem.stage?.name && (
            <Text className="text-gray-700 text-sm">
              Étape: {scheduleItem.stage.name}
            </Text>
          )}
        </View>
        <View className="rounded-full p-2" style={{ backgroundColor: scheduleItem.type === 'event' ? "#dbeafe" : "#dcfce7" }}>
          <Ionicons 
            name={scheduleItem.type === 'event' ? "calendar" : "construct"} 
            size={24} 
            color={scheduleItem.type === 'event' ? "#2563eb" : "#16a34a"} 
          />
        </View>
      </View>

      <View className="mt-3 pt-3 border-t border-gray-100">
        <View className="flex-row items-center">
          <Ionicons name="time" size={16} color="#6b7280" />
          <Text className="text-gray-700 ml-1 text-sm">
            {scheduleItem.allDay 
              ? 'Toute la journée' 
              : `${formatTime(scheduleItem.startTime)}${scheduleItem.endTime ? ` - ${formatTime(scheduleItem.endTime)}` : ''}`}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const StaffCard: React.FC<{ staff: StaffData }> = ({ staff }) => {
  const fullName = `${staff.firstname} ${staff.lastname}`.trim();
  
  return (
    <View className="bg-white rounded-lg p-4 mb-2 shadow-sm border border-gray-200">
      <View className="flex-row justify-between items-start">
        <View className="flex-1">
          <Text className="text-lg font-bold">
            {fullName}
          </Text>
          {staff.staff_id && (
            <Text className="text-gray-500 text-sm">ID: {staff.staff_id}</Text>
          )}
        </View>
        <View className="bg-blue-100 rounded-full p-2">
          <Ionicons name="person" size={24} color="#3b82f6" />
        </View>
      </View>

      <View className="mt-3 pt-3 border-t border-gray-100">
        {staff.email && (
          <View className="flex-row items-center mb-1">
            <Ionicons name="mail-outline" size={16} color="#6b7280" />
            <Text className="text-gray-700 ml-2 text-sm">{staff.email}</Text>
          </View>
        )}
        
        {staff.phone && (
          <View className="flex-row items-center mb-1">
            <Ionicons name="call-outline" size={16} color="#6b7280" />
            <Text className="text-gray-700 ml-2 text-sm">{staff.phone}</Text>
          </View>
        )}

        {staff.mobile && (
          <View className="flex-row items-center">
            <Ionicons name="phone-portrait-outline" size={16} color="#6b7280" />
            <Text className="text-gray-700 ml-2 text-sm">{staff.mobile}</Text>
          </View>
        )}
      </View>
    </View>
  );
};

// Composant générique qui sélectionne le bon type d'affichage en fonction du format
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
        "Information",
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
  const isClientData = format === 'table' && data[0] && 'firstname' in data[0] && 'lastname' in data[0];
  const isProjectData = format === 'table' && data[0] && 'reference' in data[0] && 'start_date' in data[0];
  const isDocumentData = format === 'table' && data[0] && 'reference' in data[0] && 'issue_date' in data[0] && !('start_date' in data[0]);
  const isScheduleData = format === 'table' && data[0] && 'title' in data[0] && ('type' in data[0]) && (data[0].type === 'event' || data[0].type === 'assignment');

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

    // Rendu pour le format client
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
    
    // Rendu pour le format projet
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

    // Rendu pour le format document
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

    // Rendu pour le format planning/événements
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