import url from '../../../utils/url';
import { Alert } from 'react-native';

export interface SortResult {
    success: boolean;
    message: string;
    stats?: { category: string, count: number }[];
    emailsProcessed?: number;
}

/**
 * Trie les emails selon l'endpoint spécifié
 * @param endpoint - L'endpoint de tri à utiliser ('sort', 'sort-all', 'sort-by-category', etc.)
 * @param params - Les paramètres additionnels pour la requête (ex: {category: 'Factures'})
 * @returns La réponse du serveur ou null en cas d'erreur
 */
export const sortEmails = async (endpoint: string, params = {}): Promise<SortResult | null> => {
    try {
        const response = await fetch(`${url.email}/sort-email/${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(params)
        });
        
        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Erreur lors du tri des emails:', error);
        Alert.alert(
            'Erreur',
            'Une erreur est survenue lors du tri des emails. Veuillez réessayer.'
        );
        return null;
    }
};

/**
 * Trie les emails non lus de la boîte de réception
 */
export const sortUnreadEmails = async (): Promise<SortResult | null> => {
    return sortEmails('sort');
};

/**
 * Trie tous les emails (lus et non lus) de la boîte de réception
 */
export const sortAllEmails = async (): Promise<SortResult | null> => {
    return sortEmails('sort-all');
};

/**
 * Trie les emails par catégorie spécifique
 * @param category - Le nom de la catégorie à utiliser pour le tri
 */
export const sortEmailsByCategory = async (category: string): Promise<SortResult | null> => {
    if (!category || category.trim().length === 0) {
        Alert.alert('Erreur', 'Veuillez spécifier une catégorie valide.');
        return null;
    }
    
    return sortEmails('sort-by-category', { category: category.trim() });
};
