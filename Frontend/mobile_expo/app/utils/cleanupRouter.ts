import { Platform } from 'react-native';
import { router } from 'expo-router';

/**
 * Utilitaire pour nettoyer le paramètre __EXPO_ROUTER_key des URLs
 * Solution temporaire pour un bug d'Expo Router
 */
export const cleanupExpoRouterKey = () => {
  if (Platform.OS === 'web') {
    // Utiliser setTimeout pour s'assurer que cela s'exécute après tous les autres JS dans la boucle d'événements
    setTimeout(() => {
      if (window.location.href.includes('__EXPO_ROUTER_key=')) {
        const url = new URL(window.location.href);
        url.searchParams.delete('__EXPO_ROUTER_key');
        
        // Remplacer l'URL actuelle sans provoquer un rechargement de page
        window.history.replaceState({}, document.title, url.toString());
        
        console.log('URL nettoyée:', url.toString());
      }
    }, 0);
  }
};

/**
 * Configure tous les mécanismes de nettoyage d'URL pour l'application
 * Appelez cette fonction une fois au niveau racine de l'application
 */
export const setupUrlCleaner = () => {
  if (Platform.OS !== 'web' || typeof window === 'undefined') {
    return { cleanup: () => {} };
  }
  
  // Patch des méthodes router pour nettoyer l'URL après chaque navigation
  const originalPush = router.push;
  const originalReplace = router.replace;
  const originalNavigate = router.navigate;
  const originalBack = router.back;
  
  router.push = (...args) => {
    const result = originalPush(...args);
    cleanupExpoRouterKey();
    return result;
  };
  
  router.replace = (...args) => {
    const result = originalReplace(...args);
    cleanupExpoRouterKey();
    return result;
  };
  
  router.navigate = (...args) => {
    const result = originalNavigate(...args);
    cleanupExpoRouterKey();
    return result;
  };
  
  router.back = () => {
    const result = originalBack();
    cleanupExpoRouterKey();
    return result;
  };
  
  // Ajouter des écouteurs d'événements pour les changements d'URL
  window.addEventListener('popstate', cleanupExpoRouterKey);
  window.addEventListener('hashchange', cleanupExpoRouterKey);
  
  // Force cleanup immédiatement au cas où l'URL courante contient déjà le paramètre
  cleanupExpoRouterKey();
  
  // Configurer un MutationObserver pour détecter les changements DOM qui pourraient indiquer une navigation
  let observer: MutationObserver | null = null;
  
  if (typeof MutationObserver !== 'undefined') {
    observer = new MutationObserver(() => {
      if (window.location.href.includes('__EXPO_ROUTER_key=')) {
        cleanupExpoRouterKey();
      }
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }
  
  // Ajouter un intervalle de nettoyage pour les cas où les autres méthodes échouent
  const intervalId = setInterval(cleanupExpoRouterKey, 500);
  
  // Retourner une fonction de nettoyage pour supprimer les écouteurs d'événements et déconnecter l'observateur
  return {
    cleanup: () => {
      clearInterval(intervalId);
      window.removeEventListener('popstate', cleanupExpoRouterKey);
      window.removeEventListener('hashchange', cleanupExpoRouterKey);
      if (observer) {
        observer.disconnect();
      }
      
      // Restaurer les méthodes router originales
      router.push = originalPush;
      router.replace = originalReplace;
      router.navigate = originalNavigate;
      router.back = originalBack;
    },
  };
}; 