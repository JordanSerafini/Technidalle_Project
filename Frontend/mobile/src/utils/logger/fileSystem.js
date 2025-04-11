/**
 * Module pour interagir avec le système de fichiers
 * Ce module est une abstraction qui peut être implémentée différemment selon la plateforme
 */

// Simuler les fonctions du système de fichiers pour le web
const isBrowser = typeof window !== 'undefined';

let fsImplementation = {
  // Vérifier si un fichier existe
  async fileExists(path) {
    console.warn('Opération fileExists non supportée dans cet environnement');
    return false;
  },
  
  // Créer un répertoire
  async mkdir(path) {
    console.warn('Opération mkdir non supportée dans cet environnement');
    return false;
  },
  
  // Écrire dans un fichier
  async writeFile(path, content) {
    console.warn('Opération writeFile non supportée dans cet environnement');
    console.log(`Contenu qui serait écrit dans ${path}:`, content);
    return false;
  },
  
  // Ajouter du contenu à un fichier existant
  async appendFile(path, content) {
    console.warn('Opération appendFile non supportée dans cet environnement');
    console.log(`Contenu qui serait ajouté à ${path}:`, content);
    return false;
  },
  
  // Lire le contenu d'un fichier
  async readFile(path) {
    console.warn('Opération readFile non supportée dans cet environnement');
    return '';
  },
  
  // Lister les fichiers d'un répertoire
  async readDir(path) {
    console.warn('Opération readDir non supportée dans cet environnement');
    return [];
  }
};

// Fonction pour initialiser le système de fichiers avec une implémentation native
export function initializeFileSystem(nativeImplementation) {
  if (nativeImplementation) {
    fsImplementation = { ...fsImplementation, ...nativeImplementation };
    console.log('Système de fichiers natif initialisé');
  }
}

// Exporter les fonctions du système de fichiers
export const fileSystem = {
  fileExists: (path) => fsImplementation.fileExists(path),
  mkdir: (path) => fsImplementation.mkdir(path),
  writeFile: (path, content) => fsImplementation.writeFile(path, content),
  appendFile: (path, content) => fsImplementation.appendFile(path, content),
  readFile: (path) => fsImplementation.readFile(path),
  readDir: (path) => fsImplementation.readDir(path)
}; 