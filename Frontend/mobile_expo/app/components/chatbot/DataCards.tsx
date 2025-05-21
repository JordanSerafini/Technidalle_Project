import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

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

interface ClientCardProps {
  client: ClientData;
  onPress?: (client: ClientData) => void;
}

interface ProjectCardProps {
  project: ProjectData;
  onPress?: (project: ProjectData) => void;
}

interface DataCardsProps {
  data: any[];
  format: string;
  title?: string;
  onItemPress?: (item: any) => void;
}

const ClientCard: React.FC<ClientCardProps> = ({ client, onPress }) => {
  const handlePress = () => {
    if (onPress) {
      onPress(client);
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
    if (onPress) {
      onPress(project);
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

// Composant générique qui sélectionne le bon type d'affichage en fonction du format
const DataCards: React.FC<DataCardsProps> = ({ data, format, title, onItemPress }) => {
  if (!data || data.length === 0) {
    return null;
  }

  // Déterminer le type de données à afficher
  const isClientData = format === 'table' && data[0] && 'firstname' in data[0] && 'lastname' in data[0];
  const isProjectData = format === 'table' && data[0] && 'reference' in data[0] && 'start_date' in data[0];

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
          scrollEnabled={false}
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
          scrollEnabled={false}
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
          <View className="bg-white rounded-lg p-4 mb-2 shadow-sm border border-gray-200">
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
              
              // Pour les dates, les formater correctement
              if (key.includes('date') && value) {
                try {
                  // S'assurer que value est une chaîne de caractères avant de l'utiliser
                  let dateString = '';
                  if (typeof value === 'string') {
                    dateString = value;
                  } else {
                    dateString = '' + value; // Conversion forcée en string
                  }
                  
                  const formattedDate = format(new Date(dateString), 'dd/MM/yyyy', { locale: fr });
                  return (
                    <View key={key} className="flex-row mb-1">
                      <Text className="font-medium text-gray-700 mr-2">{key}:</Text>
                      <Text className="text-gray-600">{formattedDate}</Text>
                    </View>
                  );
                } catch (e) {
                  // En cas d'erreur de formatage, afficher la valeur telle quelle
                }
              }
              
              return (
                <View key={key} className="flex-row mb-1">
                  <Text className="font-medium text-gray-700 mr-2">{key}:</Text>
                  <Text className="text-gray-600">{String(value)}</Text>
                </View>
              );
            })}
          </View>
        )}
        scrollEnabled={false}
      />
    </View>
  );
};

export default DataCards; 