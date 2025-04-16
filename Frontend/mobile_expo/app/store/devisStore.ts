import { create } from 'zustand';
import { Material } from '../utils/interfaces/material.interface';

interface DevisRow {
    id: string;
    material: Material | null;
    quantity: number;
    price: number;
}

interface DevisStore {
    rows: DevisRow[];
    addRow: () => void;
    updateRow: (id: string, field: string, value: any) => void;
    deleteRow: (id: string) => void;
    clearRows: () => void;
    calculateTotal: () => number;
    isMaterialAlreadyUsed: (materialId: number) => boolean;
}

const generateUniqueId = () => {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

export const useDevisStore = create<DevisStore>((set, get) => ({
    rows: [{ id: generateUniqueId(), material: null, quantity: 1, price: 0 }],

    addRow: () => {
        set((state) => ({
            rows: [...state.rows, {
                id: generateUniqueId(),
                material: null,
                quantity: 1,
                price: 0
            }]
        }));
    },

    updateRow: (id: string, field: string, value: any) => {
        set((state) => ({
            rows: state.rows.map(row => {
                if (row.id === id) {
                    if (field === 'material' && value) {
                        // Vérifier si le matériau est déjà utilisé dans une autre ligne
                        const isAlreadyUsed = state.rows.some(r => 
                            r.id !== id && r.material?.id === value.id
                        );
                        if (isAlreadyUsed) {
                            return row; // Ne pas mettre à jour si déjà utilisé
                        }
                        return {
                            ...row,
                            [field]: value,
                            price: value.price || 0
                        };
                    }
                    return { ...row, [field]: value };
                }
                return row;
            })
        }));
    },

    deleteRow: (id: string) => {
        set((state) => ({
            rows: state.rows.filter(row => row.id !== id)
        }));
    },

    clearRows: () => {
        set({
            rows: [{ id: generateUniqueId(), material: null, quantity: 1, price: 0 }]
        });
    },

    calculateTotal: () => {
        const state = get();
        return state.rows.reduce((total, row) => total + (row.quantity * row.price), 0);
    },

    isMaterialAlreadyUsed: (materialId: number) => {
        const state = get();
        return state.rows.some(row => row.material?.id === materialId);
    }
})); 