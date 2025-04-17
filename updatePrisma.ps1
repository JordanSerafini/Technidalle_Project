# Script PowerShell pour mettre à jour Prisma dans tous les sous-dossiers
# Pour l'exécuter: .\updatePrisma.ps1

# Dossier principal
$BACKEND_DIR = ".\Backend"

# Parcourir tous les sous-dossiers
$SERVICES = Get-ChildItem -Path $BACKEND_DIR -Directory | Where-Object { $_.Name -like "*_service" -or $_.Name -eq "api_gateway" }

foreach ($SERVICE in $SERVICES) {
    $SERVICE_PATH = $SERVICE.FullName
    
    # Vérifier si prisma existe dans ce dossier (soit dossier prisma ou mention dans package.json)
    $HAS_PRISMA_DIR = Test-Path -Path "$SERVICE_PATH\prisma" -PathType Container
    $HAS_PRISMA_IN_PACKAGE = $false
    
    if (Test-Path -Path "$SERVICE_PATH\package.json") {
        $PACKAGE_CONTENT = Get-Content -Path "$SERVICE_PATH\package.json" -Raw
        if ($PACKAGE_CONTENT -match "prisma") {
            $HAS_PRISMA_IN_PACKAGE = $true
        }
    }
    
    if ($HAS_PRISMA_DIR -or $HAS_PRISMA_IN_PACKAGE) {
        Write-Host "Mise à jour de Prisma dans $SERVICE_PATH..." -ForegroundColor Cyan
        
        # Sauvegarder l'emplacement actuel
        Push-Location
        
        # Aller dans le dossier du service
        Set-Location -Path $SERVICE_PATH
        
        # Exécuter les commandes Prisma
        Write-Host "Exécution de 'npx prisma db pull'..." -ForegroundColor Yellow
        npx prisma db pull
        
        Write-Host "Exécution de 'npx prisma generate'..." -ForegroundColor Yellow
        npx prisma generate
        
        # Retourner au dossier précédent
        Pop-Location
        
        Write-Host "Mise à jour terminée pour $($SERVICE.Name)" -ForegroundColor Green
        Write-Host "-----------------------------------"
    } else {
        Write-Host "Prisma non trouvé dans $($SERVICE.Name), passage au suivant..." -ForegroundColor Gray
    }
}

Write-Host "Toutes les mises à jour Prisma sont terminées!" -ForegroundColor Magenta 