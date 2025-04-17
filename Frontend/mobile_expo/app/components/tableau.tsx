import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Modal, FlatList } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import useFetch from '../hooks/useFetch';
import { url } from '../utils/url';
import { Material } from '../utils/interfaces/material.interface';
import { Ionicons } from '@expo/vector-icons';
import { useDevisStore } from '../store/devisStore';

function Tableau() {
    const { data: materials, loading, error } = useFetch<Material[]>('resources/materials');
    const { rows, addRow, updateRow, deleteRow, calculateTotal } = useDevisStore();
    
    const [modalVisible, setModalVisible] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
    const [tvaRate, setTvaRate] = useState(20); // Taux de TVA par défaut à 20%

    // Vérifier si la dernière ligne est remplie pour ajouter automatiquement une nouvelle ligne
    useEffect(() => {
        const lastRow = rows[rows.length - 1];
        if (lastRow && lastRow.material !== null) {
            addRow();
        }
    }, [rows]);

    const openMaterialSelector = (rowId: string) => {
        setSelectedRowId(rowId);
        setModalVisible(true);
    };

    const selectMaterial = (material: Material) => {
        if (selectedRowId !== null) {
            updateRow(selectedRowId, 'material', material);
            setModalVisible(false);
            setSelectedRowId(null);
            setSearchTerm('');
        }
    };

    // Filtrer les matériaux en fonction du terme de recherche
    const filteredMaterials = materials?.filter(material => 
        material.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (material.description && material.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (material.reference && material.reference.toLowerCase().includes(searchTerm.toLowerCase()))
    ) || [];

    // Calculer la TVA
    const calculateTVA = () => {
        return calculateTotal() * (tvaRate / 100);
    };

    // Calculer le total TTC
    const calculateTTC = () => {
        return calculateTotal() + calculateTVA();
    };

    if (loading) {
        return (
            <View className="flex-1 p-4">
                <Text>Chargement...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View className="flex-1 p-4">
                <Text>Erreur: {error}</Text>
            </View>
        );
    }

    return (
        <View className="w-full h-fit">
            {/* Table Container */}
            <View className="flex-1 border border-gray-300 rounded overflow-hidden">
                {/* Table Header (thead) */}
                <View className="bg-gray-100">
                    <View className="flex-row h-12 border-b border-gray-300">
                        <View className="w-[40%] justify-center">
                            <Text className="text-center font-bold">Article</Text>
                        </View>
                        <View className="w-[20%] justify-center">
                            <Text className="text-center font-bold">Quantité</Text>
                        </View>
                        <View className="w-[20%] justify-center">
                            <Text className="text-center font-bold">Prix (€)</Text>
                        </View>
                        <View className="w-[20%] justify-center">
                            <Text className="text-center font-bold">Total</Text>
                        </View>
                    </View>
                </View>

                {/* Table Body (tbody) */}
                <ScrollView>
                    {rows.map((row) => (
                        <Swipeable
                            key={row.id}
                            enabled={rows.length > 1}
                            renderRightActions={() => (
                                <TouchableOpacity 
                                    onPress={() => deleteRow(row.id)}
                                    className={`w-20 h-14 justify-center items-center ${rows.length > 1 ? 'bg-red-500' : 'bg-gray-300'}`}
                                >
                                    <Ionicons name="trash-outline" size={24} color="white" />
                                </TouchableOpacity>
                            )}
                        >
                            <View className="flex-row h-14 border-b border-gray-300 bg-white">
                                {/* Article Cell */}
                                <View className="w-[40%] justify-center items-center">
                                    <TouchableOpacity 
                                        className="w-[95%] h-10 justify-center bg-gray-50 rounded"
                                        onPress={() => openMaterialSelector(row.id)}
                                    >
                                        <Text 
                                            numberOfLines={2} 
                                            ellipsizeMode="tail"
                                            className="text-center px-2"
                                        >
                                            {row.material ? row.material.name : 'Sélectionner un article'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                                
                                {/* Quantity Cell */}
                                <View className="w-[20%] justify-center items-center">
                                    <TextInput
                                        className="w-[90%] h-10 bg-gray-50 rounded text-center"
                                        value={row.quantity.toString()}
                                        keyboardType="numeric"
                                        onChangeText={(text) => updateRow(row.id, 'quantity', parseInt(text) || 0)}
                                    />
                                </View>
                                
                                {/* Price Cell */}
                                <View className="w-[20%] justify-center items-center">
                                    <TextInput
                                        className="w-[90%] h-10 bg-gray-50 rounded text-center"
                                        value={row.price.toString()}
                                        keyboardType="numeric"
                                        onChangeText={(text) => updateRow(row.id, 'price', parseFloat(text) || 0)}
                                    />
                                </View>
                                
                                {/* Total Cell */}
                                <View className="w-[20%] justify-center">
                                    <Text className="text-center">{(row.quantity * row.price).toFixed(2)} €</Text>
                                </View>
                            </View>
                        </Swipeable>
                    ))}
                </ScrollView>
            </View>
            
            {/* Table Footer */}
            <View className="flex-row justify-end py-4 px-2">
                <Text className="font-bold text-base mr-2.5">Total du devis:</Text>
                <Text className="font-bold text-base text-blue-600">{calculateTotal().toFixed(2)} €</Text>
            </View>

            {/* Totaux */}
            <View className="flex-row justify-end py-4 px-2">
                <Text className="font-bold text-base mr-2.5">TVA ({tvaRate}%):</Text>
                <Text className="font-bold text-base text-blue-600">{calculateTVA().toFixed(2)} €</Text>
            </View>

            {/* Totaux */}
            <View className="flex-row justify-end py-4 px-2 border-t ">
                <Text className="font-bold text-base mr-2.5">Total TTC:</Text>
                <Text className="font-bold text-base text-blue-600">{calculateTTC().toFixed(2)} €</Text>
            </View>

            {/* Modal de sélection de matériaux */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => {
                    setModalVisible(false);
                    setSelectedRowId(null);
                }}
            >
                <View className="flex-1 justify-center bg-black/50">
                    <View className="bg-white mx-5 rounded-xl p-5 max-h-[80%]">
                        <View className="flex-row justify-between items-center mb-4">
                            <Text className="text-lg font-bold">Sélectionner un article</Text>
                            <TouchableOpacity 
                                onPress={() => {
                                    setModalVisible(false);
                                    setSelectedRowId(null);
                                }}
                            >
                                <Ionicons name="close" size={24} color="#555" />
                            </TouchableOpacity>
                        </View>
                        
                        <TextInput
                            className="border border-gray-300 rounded p-2.5 mb-4"
                            placeholder="Rechercher un article..."
                            value={searchTerm}
                            onChangeText={setSearchTerm}
                        />
                        
                        <FlatList<Material>
                            data={filteredMaterials}
                            keyExtractor={(item: Material) => item.id.toString()}
                            renderItem={({ item }: { item: Material }) => {
                                const isAlreadyUsed = useDevisStore.getState().isMaterialAlreadyUsed(item.id);
                                return (
                                    <TouchableOpacity 
                                        className={`p-4 border-b border-gray-200 ${isAlreadyUsed ? 'opacity-50' : ''}`}
                                        onPress={() => !isAlreadyUsed && selectMaterial(item)}
                                        disabled={isAlreadyUsed}
                                    >
                                        <View>
                                            <Text className="text-base font-bold">{item.name}</Text>
                                            {item.description && (
                                                <Text className="text-sm text-gray-500 mt-1">{item.description}</Text>
                                            )}
                                            <View className="flex-row justify-between mt-2">
                                                <Text className="text-sm text-blue-600">Prix: {item.price || 0} €</Text>
                                                <Text className="text-sm text-gray-500">Unité: {item.unit}</Text>
                                            </View>
                                            {isAlreadyUsed && (
                                                <Text className="text-sm text-red-500 mt-1">Déjà utilisé dans le devis</Text>
                                            )}
                                        </View>
                                    </TouchableOpacity>
                                );
                            }}
                            ListEmptyComponent={
                                <View className="p-5 items-center">
                                    <Text>Aucun article trouvé</Text>
                                </View>
                            }
                        />
                    </View>
                </View>
            </Modal>
        </View>
    );
}

export default Tableau;
