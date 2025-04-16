import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Modal, FlatList } from 'react-native';
import useFetch from '../hooks/useFetch';
import { url } from '../utils/url';
import { Material } from '../utils/interfaces/material.interface';
import { Ionicons } from '@expo/vector-icons';

function Tableau() {
    const { data: materials, loading, error } = useFetch<Material[]>('resources/materials');
    
    const [rows, setRows] = useState<{
        id: number;
        material: Material | null;
        quantity: number;
        price: number;
    }[]>([{ id: 1, material: null, quantity: 1, price: 0 }]);

    const [modalVisible, setModalVisible] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRowId, setSelectedRowId] = useState<number | null>(null);

    // Vérifier si la dernière ligne est remplie pour ajouter automatiquement une nouvelle ligne
    useEffect(() => {
        const lastRow = rows[rows.length - 1];
        if (lastRow && lastRow.material !== null) {
            addRow();
        }
    }, [rows]);

    const addRow = () => {
        setRows([...rows, { 
            id: rows.length + 1, 
            material: null, 
            quantity: 1, 
            price: 0 
        }]);
    };

    const updateRow = (id: number, field: string, value: any) => {
        setRows(rows.map(row => {
            if (row.id === id) {
                if (field === 'material' && value) {
                    // Si on sélectionne un matériau, on met à jour le prix aussi
                    return { 
                        ...row, 
                        [field]: value,
                        price: value.price || 0
                    };
                }
                return { ...row, [field]: value };
            }
            return row;
        }));
    };

    const openMaterialSelector = (rowId: number) => {
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

    const calculateTotal = () => {
        return rows.reduce((total, row) => total + (row.quantity * row.price), 0);
    };

    // Filtrer les matériaux en fonction du terme de recherche
    const filteredMaterials = materials?.filter(material => 
        material.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (material.description && material.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (material.reference && material.reference.toLowerCase().includes(searchTerm.toLowerCase()))
    ) || [];

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
        <View className="w-full h-full">
            <View className="flex-1 border border-gray-300 rounded overflow-hidden">
                {/* En-tête du tableau */}
                <View className="flex-row bg-gray-100 border-b border-gray-300">
                    <View className="w-[45%]">
                        <Text className="font-bold p-3 text-center">Article</Text>
                    </View>
                    <View className="w-[18%]">
                        <Text className="font-bold p-3 text-center">Quantité</Text>
                    </View>
                    <View className="w-[18%]">
                        <Text className="font-bold p-3 text-center">Prix (€)</Text>
                    </View>
                    <View className="w-[19%]">
                        <Text className="font-bold p-3 text-center">Total</Text>
                    </View>
                </View>
                
                <ScrollView>
                    {/* Lignes du tableau */}
                    {rows.map((row) => (
                        <View key={row.id} className="flex-row border-b border-gray-300 h-14">
                            {/* Colonne Article */}
                            <View className="w-[45%]  px-2 justify-center">
                                <TouchableOpacity 
                                    className="flex-1  justify-center px-2"
                                    onPress={() => openMaterialSelector(row.id)}
                                >
                                    <Text 
                                        numberOfLines={2} 
                                        ellipsizeMode="tail"
                                        className="text-center"
                                    >
                                        {row.material ? row.material.name : 'Sélectionner un article'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                            
                            {/* Colonne Quantité */}
                            <View className="w-[18%] px-2 justify-center">
                                <TextInput
                                    className="h-10 rounded text-center"
                                    value={row.quantity.toString()}
                                    keyboardType="numeric"
                                    onChangeText={(text) => updateRow(row.id, 'quantity', parseInt(text) || 0)}
                                />
                            </View>
                            
                            {/* Colonne Prix */}
                            <View className="w-[18%] px-2 justify-center">
                                <TextInput
                                    className="h-10  rounded text-center"
                                    value={row.price.toString()}
                                    keyboardType="numeric"
                                    onChangeText={(text) => updateRow(row.id, 'price', parseFloat(text) || 0)}
                                />
                            </View>
                            
                            {/* Colonne Total */}
                            <View className="w-[19%] px-2 justify-center">
                                <Text className="text-center">{(row.quantity * row.price).toFixed(2)} €</Text>
                            </View>
                        </View>
                    ))}
                </ScrollView>
            </View>
            
            {/* Total global */}
            <View className="flex-row justify-end mt-5 pt-2.5 border-t border-gray-300">
                <Text className="font-bold text-base mr-2.5">Total du devis:</Text>
                <Text className="font-bold text-base text-blue-600">{calculateTotal().toFixed(2)} €</Text>
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
                            renderItem={({ item }: { item: Material }) => (
                                <TouchableOpacity 
                                    className="p-4 border-b border-gray-200"
                                    onPress={() => selectMaterial(item)}
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
                                    </View>
                                </TouchableOpacity>
                            )}
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
