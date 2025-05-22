import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { router } from 'expo-router';

interface ClientData {
  id: number;
  firstname: string;
  lastname: string;
  email: string;
  phone: string | null;
  addresses: {
    city: string;
  };
  created_at: string;
}

interface ProjectData {
  id: number;
  reference: string;
  name: string;
  description: string;
  client_id: number;
  status: string;
  start_date: string;
  end_date: string;
  estimated_duration: number;
  budget: number;
  actual_cost: number | null;
  notes?: string;
  clients?: any;
}

interface DocumentData {
  id: number;
  reference: string;
  type: string;
  status?: string;
  issue_date: string;
  due_date?: string;
  amount?: number;
  project_id?: number;
  client_id?: number;
  file_path?: string;
}

interface ScheduleItemData {
  id: string;
  title: string;
  type: 'event' | 'assignment';
  startTime: string;
  endTime?: string;
  allDay?: boolean;
  project?: { id: number; name: string } | null;
  stage?: { id: number; name: string } | null;
  eventType?: string;
}

interface StaffData {
  id: number;
  staff_id?: string;
  firstname: string;
  lastname: string;
  email: string;
  role_id: number;
  phone?: string;
  mobile?: string;
  address_id?: number;
  hire_date: string;
  is_available?: boolean;
}

interface ClientCardProps {
  client: ClientData;
  onPress?: (client: ClientData) => void;
}

interface ProjectCardProps {
  project: ProjectData;
  onPress?: (project: ProjectData) => void;
}

interface DocumentCardProps {
  document: DocumentData;
  onPress?: (document: DocumentData) => void;
}

interface ScheduleCardProps {
  scheduleItem: ScheduleItemData;
  onPress?: (scheduleItem: ScheduleItemData) => void;
}

interface DataCardsProps {
  data: any[];
  format: string;
  title?: string;
  onItemPress?: (item: any) => void;
}

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
      onPress={handlePress}
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
      onPress={handlePress}
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
      onPress={handlePress}
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
      onPress={handlePress}
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

  // Fonction pour naviguer vers la page de détail générique
  const navigateToDetailPage = (item: any) => {
    if (onItemPress) {
      onItemPress(item);
    } else {
      // Navigation par défaut basée sur le type de données
      if ('firstname' in item && 'lastname' in item) {
        // C'est un client
        router.push({
          pathname: "/(tabs)/clients/[id]",
          params: { id: item.id.toString() }
        });
      } else if ('reference' in item && 'start_date' in item) {
        // C'est un projet
        router.push({
          pathname: "/(tabs)/projects/[id]",
          params: { id: item.id.toString() }
        });
      } else if ('reference' in item && 'issue_date' in item) {
        // C'est un document
        router.push({
          pathname: "/(tabs)/documents/[id]",
          params: { id: item.id.toString() }
        });
      } else if (item.id && item.title && 'type' in item && (item.type === 'event' || item.type === 'assignment')) {
        // C'est un élément de planning
        if (item.project?.id) {
          // Si c'est lié à un projet, on redirige vers le projet
          router.push({
            pathname: "/(tabs)/projects/[id]",
            params: { id: item.project.id.toString() }
          });
        } else {
          // Sinon, on redirige vers la page de planning
          router.push({
            pathname: "/(tabs)/planning"
          });
        }
      }
    }
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
            renderItem={({ item }: { item: ClientData }) => (
              <ClientCard client={item} onPress={onItemPress} />
            )}
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
            renderItem={({ item }: { item: ProjectData }) => (
              <ProjectCard project={item} onPress={onItemPress} />
            )}
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
            renderItem={({ item }: { item: DocumentData }) => (
              <DocumentCard document={item} onPress={onItemPress} />
            )}
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
            renderItem={({ item }: { item: ScheduleItemData }) => (
              <ScheduleCard scheduleItem={item} onPress={onItemPress} />
            )}
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
          renderItem={({ item }: { item: any }) => (
            <TouchableOpacity 
              className="bg-white rounded-lg p-4 mb-2 shadow-sm border border-gray-200"
              onPress={() => navigateToDetailPage(item)}
            >
              {Object.entries(item).map(([key, value]) => {
                // Ne pas afficher les objets complexes ou les tableaux directement
                if (typeof value === 'object' && value !== null) {
                  if (Array.isArray(value)) {
                    return (
                      <View key={key} className="flex-row mb-1">
                        <Text className="font-medium text-gray-700 mr-2">{key}:</Text>
                        <Text className="text-gray-600">{value.length} éléments</Text>
                      </View>
                    );
                  }
                  return (
                    <View key={key} className="flex-row mb-1">
                      <Text className="font-medium text-gray-700 mr-2">{key}:</Text>
                      <Text className="text-gray-600">Objet</Text>
                    </View>
                  );
                }
                
                // Pour les dates, afficher simplement la valeur telle quelle
                if (key.includes('date') && value) {
                  return (
                    <View key={key} className="flex-row mb-1">
                      <Text className="font-medium text-gray-700 mr-2">{key}:</Text>
                      <Text className="text-gray-600">{String(value)}</Text>
                    </View>
                  );
                }
                
                return (
                  <View key={key} className="flex-row mb-1">
                    <Text className="font-medium text-gray-700 mr-2">{key}:</Text>
                    <Text className="text-gray-600">{String(value)}</Text>
                  </View>
                );
              })}
            </TouchableOpacity>
          )}
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