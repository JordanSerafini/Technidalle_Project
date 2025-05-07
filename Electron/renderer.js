const fs = require('fs');
const { ipcRenderer } = require('electron'); // Pour communiquer avec le processus principal si nécessaire

document.addEventListener('DOMContentLoaded', () => {
    const envContentTextArea = document.getElementById('env-content');
    const saveEnvButton = document.getElementById('save-env');
    const launchProjectButton = document.getElementById('launch-project');

    // Charger le contenu actuel du .env (si le fichier existe)
    // Pour l'instant, nous allons supposer que .env est à la racine du projet Electron
    // Vous devrez adapter le chemin si ce n'est pas le cas.
    const envPath = './.env'; // Adaptez ce chemin si nécessaire

    fs.readFile(envPath, 'utf8', (err, data) => {
        if (err) {
            if (err.code === 'ENOENT') {
                console.log('Le fichier .env n\'existe pas encore.');
                envContentTextArea.value = '';
            } else {
                console.error('Erreur lors de la lecture du fichier .env:', err);
                envContentTextArea.value = 'Erreur lors du chargement du fichier .env';
            }
            return;
        }
        envContentTextArea.value = data;
    });

    saveEnvButton.addEventListener('click', () => {
        const newEnvContent = envContentTextArea.value;
        fs.writeFile(envPath, newEnvContent, 'utf8', (err) => {
            if (err) {
                console.error('Erreur lors de la sauvegarde du fichier .env:', err);
                alert('Erreur lors de la sauvegarde du fichier .env');
                return;
            }
            console.log('Fichier .env sauvegardé !');
            alert('Fichier .env sauvegardé !');
        });
    });

    launchProjectButton.addEventListener('click', () => {
        // Logique pour lancer le projet
        // Cela pourrait impliquer d'exécuter une commande shell
        // Par exemple: ipcRenderer.send('launch-project-command', 'npm start');
        alert('Fonctionnalité de lancement de projet à implémenter.');
        console.log('Bouton Lancer le projet cliqué');
    });
}); 