const fs = require('fs');
const path = require('path'); // Ajout du module path
// const { ipcRenderer } = require('electron'); // Décommenter si communication avec main.js est nécessaire

document.addEventListener('DOMContentLoaded', () => {
    const envContentTextArea = document.getElementById('env-content');
    const saveEnvButton = document.getElementById('save-env');
    const launchProjectButton = document.getElementById('launch-project');

    // Chemin vers le fichier .env DANS LE DOSSIER PARENT (racine du projet global)
    // __dirname dans Electron renderer process pointe vers le répertoire du fichier HTML (Electron/)
    const projectRoot = path.resolve(__dirname, '../Email_Module/email_service_openai'); 
    const envPath = path.join(projectRoot, '.env');

    console.log("Tentative de lecture du fichier .env à partir de :", envPath);

    // Charger le contenu actuel du .env
    fs.readFile(envPath, 'utf8', (err, data) => {
        if (err) {
            if (err.code === 'ENOENT') {
                console.warn(`Le fichier .env n\'a pas été trouvé à ${envPath}. Vous pouvez en créer un.`);
                envContentTextArea.value = `# Le fichier .env est vide ou n\'existe pas à ${envPath}`;
            } else {
                console.error('Erreur lors de la lecture du fichier .env:', err);
                envContentTextArea.value = `Erreur lors du chargement du fichier .env depuis ${envPath}`;
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
                alert(`Erreur lors de la sauvegarde du fichier .env à ${envPath}`);
                return;
            }
            console.log(`Fichier .env sauvegardé à ${envPath} !`);
            alert('Fichier .env sauvegardé !');
        });
    });

    launchProjectButton.addEventListener('click', () => {
        // Logique pour lancer le projet
        // Exemple: ipcRenderer.send('launch-project-command', 'npm start');
        alert('Fonctionnalité de lancement de projet à implémenter.');
        console.log('Bouton Lancer le projet cliqué');
        // Vous devrez probablement utiliser ipcRenderer pour demander au processus principal
        // d'exécuter une commande dans le répertoire de votre projet principal.
        // Par exemple, si votre projet principal a un package.json avec un script "start":
        // const { shell } = require('electron');
        // shell.openPath(projectRoot); // Ouvre le dossier du projet
        // Puis, vous pourriez vouloir envoyer une commande au processus principal pour l'exécuter
        // dans un terminal externe ou via child_process.
    });
}); 