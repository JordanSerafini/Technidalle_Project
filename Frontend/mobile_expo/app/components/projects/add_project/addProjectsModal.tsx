import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFetch } from '../../../hooks/useFetch';
import { Project } from '../../../utils/interfaces/project.interface';
import { Client } from '../../../utils/interfaces/client.interface';
import { Address } from '../../../utils/interfaces/address.interface';

// Import des sous-composants
import InfoAddProject from './info_addProject';
import ClientAddProject from './client_addProject';
import AddresseAddProject from './addresse_addProject';

// Extension de l'interface Client pour inclure address_id
interface ClientWithAddress extends Client {
  address_id?: number;
}

interface AddProjectModalProps {
  visible: boolean;
  onClose: () => void;
  onCreateProject: (projectData: Partial<Project>) => void;
}

const AddProjectModal: React.FC<AddProjectModalProps> = ({ 
  visible, 
  onClose, 
  onCreateProject 
}) => {
  // Champs principaux
  const [projectName, setProjectName] = useState('');
  const [projectReference, setProjectReference] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [status, setStatus] = useState<string>('prospect');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [budget, setBudget] = useState('');
  const [priority, setPriority] = useState('3');
  const [notes, setNotes] = useState('');
  
  // Gestion de la sélection de client
  const [selectedClient, setSelectedClient] = useState<ClientWithAddress | null>(null);
  
  // Gestion de la sélection d'adresse
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  
  // Requête pour les clients
  const { data: clients, loading: clientsLoading, error: clientsError } = useFetch<ClientWithAddress[]>('clients');
  
  // Requête pour les adresses du client sélectionné
  const { 
    data: clientAddresses, 
    loading: addressesLoading, 
    error: addressesError,
  } = useFetch<Address[]>(
    selectedClient ? `clients/${selectedClient.id}/addresses` : null
  );
  
  // Réinitialiser les champs quand la modale se ferme
  useEffect(() => {
    if (!visible) {
      resetForm();
    }
  }, [visible]);

  const resetForm = () => {
    setProjectName('');
    setProjectReference('');
    setProjectDescription('');
    setStatus('prospect');
    setStartDate(null);
    setEndDate(null);
    setBudget('');
    setPriority('3');
    setNotes('');
    setSelectedClient(null);
    setSelectedAddress(null);
  };
  
  const handleCreate = () => {
    if (!projectName || !selectedClient) {
      alert('Veuillez remplir les champs obligatoires (nom et client)');
      return;
    }
    
    // Créer l'objet avec la nomenclature attendue par le backend
    const projectData: Record<string, any> = {
      name: projectName,
      // Toujours inclure une référence (temporaire si non fournie par l'utilisateur)
      reference: projectReference || "TMP",
      description: projectDescription || "",
      clientId: selectedClient ? Number(selectedClient.id) : undefined,
      ...(selectedAddress ? { addressId: Number(selectedAddress.id) } : {}),
      status: status,
      ...(startDate ? { startDate: startDate.toISOString().split('T')[0] } : {}),
      ...(endDate ? { endDate: endDate.toISOString().split('T')[0] } : {}),
      ...(budget ? { budget: parseFloat(budget) } : {}),
      ...(priority ? { priority: parseInt(priority) } : {}),
      ...(notes ? { notes: notes } : {})
    };
    
    console.log('Données du projet à créer:', projectData);
    onCreateProject(projectData);
  };
  
  if (!visible) return null;
  
  return (
    <View className="absolute inset-0 bg-black/50 justify-center items-center z-50">
      <View className="w-[90%] h-[80%] bg-white rounded-lg p-0 max-w-[500px] shadow-md overflow-hidden">
        <View className="flex-row justify-between items-center p-4 border-b border-gray-200">
          <Text className="text-lg font-bold">Nouveau Projet</Text>
          <TouchableOpacity onPress={onClose} className="p-1">
            <Ionicons name="close" size={24} color="#888" />
          </TouchableOpacity>
        </View>
        
        <ScrollView className="flex-1 p-4">
          {/* Informations de base */}
          <InfoAddProject 
            projectName={projectName}
            setProjectName={setProjectName}
            projectReference={projectReference}
            setProjectReference={setProjectReference}
            projectDescription={projectDescription}
            setProjectDescription={setProjectDescription}
            status={status}
            setStatus={setStatus}
            startDate={startDate}
            setStartDate={setStartDate}
            endDate={endDate}
            setEndDate={setEndDate}
            budget={budget}
            setBudget={setBudget}
            priority={priority}
            setPriority={setPriority}
            notes={notes}
            setNotes={setNotes}
          />
          
          {/* Sélection du client */}
          <ClientAddProject 
            selectedClient={selectedClient}
            setSelectedClient={setSelectedClient}
            clients={clients || []}
            clientsLoading={clientsLoading}
            clientsError={clientsError}
          />
          
          {/* Sélection d'adresse */}
          <AddresseAddProject 
            selectedClient={selectedClient}
            selectedAddress={selectedAddress}
            setSelectedAddress={setSelectedAddress}
            clientAddresses={clientAddresses || []}
            addressesLoading={addressesLoading}
            addressesError={addressesError}
          />
        </ScrollView>
        
        <View className="flex-row justify-between p-4 border-t border-gray-200">
          <TouchableOpacity 
            className="flex-1 py-3 mr-2 bg-red-500 rounded-md items-center"
            onPress={onClose}
          >
            <Text className="text-white font-bold">Annuler</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            className="flex-1 py-3 ml-2 bg-green-500 rounded-md items-center"
            onPress={handleCreate}
          >
            <Text className="text-white font-bold">Créer</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default AddProjectModal;
