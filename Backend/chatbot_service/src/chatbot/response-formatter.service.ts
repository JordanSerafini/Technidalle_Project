import { Injectable } from '@nestjs/common';

export interface FormattedResponse {
  text: string;
  data?: any;
  charts?: ChartData[];
  tables?: TableData[];
  suggestions?: string[];
  actionButtons?: ActionButton[];
}

export interface ChartData {
  type: 'bar' | 'pie' | 'line' | 'doughnut';
  title: string;
  data: {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      backgroundColor?: string | string[];
      borderColor?: string | string[];
    }[];
  };
}

export interface TableData {
  title: string;
  headers: string[];
  rows: any[][];
  highlight?: {
    column: number;
    condition: 'positive' | 'negative' | 'warning';
  }[];
}

export interface ActionButton {
  label: string;
  action: string;
  query?: string;
  icon?: string;
}

@Injectable()
export class ResponseFormatterService {

  formatResponse(queryType: string, sqlResults: any[], question: string): FormattedResponse {
    console.log('🔍 Debug formatResponse:', {
      queryType,
      hasResults: !!sqlResults,
      resultsLength: sqlResults?.length,
      firstResult: sqlResults?.[0],
      question: question.substring(0, 100)
    });
    
    switch (queryType) {
      case 'planning':
        return this.formatPlanningResponse(sqlResults, question);
      case 'projects':
        return this.formatProjectsResponse(sqlResults, question);
      case 'rentability':
        return this.formatRentabilityResponse(sqlResults, question);
      case 'analytics':
        return this.formatAnalyticsResponse(sqlResults, question);
      case 'staff':
        return this.formatStaffResponse(sqlResults, question);
      default:
        return this.formatGenericResponse(sqlResults, question);
    }
  }

  private formatPlanningResponse(results: any[], question: string): FormattedResponse {
    if (!results || results.length === 0) {
      return {
        text: "🗓️ Aucun événement trouvé pour cette période.",
        suggestions: [
          "Voir le planning de la semaine",
          "Créer un nouvel événement",
          "Voir les disponibilités de l'équipe"
        ]
      };
    }

    // Vérifier si c'est une réponse de disponibilité (qui contient 'employe' et 'statut')
    const isAvailabilityQuery = results.some(row => 
      row.employe && (row.statut_semaine_prochaine || row.statut_demain || row.statut)
    );
    
    if (isAvailabilityQuery) {
      return this.formatStaffResponse(results, question);
    }

    let text = `📅 **Planning demandé** :\n\n`;
    
    const events = results.map((event, index) => {
      // Vérifier si les dates sont valides avant de les traiter
      let startDate, endDate, isValidDate = false;
      
      try {
        if (event.start_date) {
          startDate = new Date(event.start_date);
          isValidDate = !isNaN(startDate.getTime());
        }
        if (event.end_date) {
          endDate = new Date(event.end_date);
        }
      } catch (error) {
        console.warn('Date invalide détectée:', event.start_date, event.end_date);
        isValidDate = false;
      }
      
      text += `**${index + 1}. ${event.title || event.evenement || 'Événement'}**\n`;
      
      if (isValidDate && startDate) {
        const timeFormat = new Intl.DateTimeFormat('fr-FR', {
          hour: '2-digit',
          minute: '2-digit'
        });
        text += `⏰ ${timeFormat.format(startDate)}`;
        if (endDate && !isNaN(endDate.getTime())) {
          text += ` - ${timeFormat.format(endDate)}`;
        }
        text += `\n`;
      }
      
      if (event.location) text += `📍 ${event.location}\n`;
      if (event.project_name || event.projet) text += `🏗️ Projet : ${event.project_name || event.projet}\n`;
      if (event.client_name) text += `👤 Client : ${event.client_name}\n`;
      if (event.description) text += `📝 ${event.description}\n`;
      text += `\n`;
      
      return event;
    });

    return {
      text,
      tables: [{
        title: "Planning détaillé",
        headers: ["Heure", "Événement", "Lieu", "Projet", "Client"],
        rows: results.map(event => {
          let startTime = '-';
          try {
            if (event.start_date) {
              const date = new Date(event.start_date);
              if (!isNaN(date.getTime())) {
                startTime = date.toLocaleTimeString('fr-FR', {
                  hour: '2-digit',
                  minute: '2-digit'
                });
              }
            }
          } catch (error) {
            console.warn('Erreur de formatage de date:', event.start_date);
          }
          
          return [
            startTime,
            event.title || event.evenement || '-',
            event.location || '-',
            event.project_name || event.projet || '-',
            event.client_name || '-'
          ];
        })
      }],
      suggestions: [
        "Voir le planning de la semaine prochaine",
        "Qui d'autre travaille sur ces projets ?",
        "Temps de trajet entre les chantiers"
      ],
      actionButtons: [
        {
          label: "Ajouter un événement",
          action: "create_event",
          icon: "plus"
        },
        {
          label: "Modifier planning",
          action: "edit_planning",
          icon: "edit"
        }
      ]
    };
  }

  private formatProjectsResponse(results: any[], question: string): FormattedResponse {
    if (!results || results.length === 0) {
      return {
        text: "🏗️ Aucun projet trouvé correspondant à vos critères.",
        suggestions: [
          "Voir tous les projets en cours",
          "Créer un nouveau projet",
          "Analyser les projets terminés"
        ]
      };
    }

    let text = `🏗️ **Projets trouvés** (${results.length}) :\n\n`;
    
    const hasFinancialData = results.some(p => p.budget || p.actual_cost || p.margin);
    
    results.forEach((project, index) => {
      text += `**${index + 1}. ${project.name}** (${project.reference})\n`;
      text += `📊 Statut : ${project.statut_detail || project.status}\n`;
      
      if (project.client_name) text += `👤 Client : ${project.client_name}\n`;
      
      if (hasFinancialData) {
        if (project.budget) text += `💰 Budget : ${Number(project.budget).toLocaleString('fr-FR')} €\n`;
        if (project.actual_cost) text += `💸 Coût réel : ${Number(project.actual_cost).toLocaleString('fr-FR')} €\n`;
        if (project.margin) text += `📈 Marge : ${Number(project.margin).toLocaleString('fr-FR')} €\n`;
        if (project.marge_pct) text += `📊 Marge % : ${project.marge_pct}%\n`;
      }
      
      if (project.start_date) {
        const startDate = new Date(project.start_date).toLocaleDateString('fr-FR');
        text += `📅 Début : ${startDate}\n`;
      }
      if (project.end_date) {
        const endDate = new Date(project.end_date).toLocaleDateString('fr-FR');
        text += `📅 Fin : ${endDate}\n`;
      }
      
      text += `\n`;
    });

    // Créer des graphiques si des données financières sont disponibles
    const charts: ChartData[] = [];
    
    if (hasFinancialData) {
      // Graphique en barres pour budget vs coût réel
      const projectsWithBudget = results.filter(p => p.budget && p.actual_cost);
      if (projectsWithBudget.length > 0) {
        charts.push({
          type: 'bar',
          title: 'Budget vs Coût Réel',
          data: {
            labels: projectsWithBudget.map(p => p.reference),
            datasets: [
              {
                label: 'Budget',
                data: projectsWithBudget.map(p => Number(p.budget)),
                backgroundColor: '#36A2EB'
              },
              {
                label: 'Coût Réel',
                data: projectsWithBudget.map(p => Number(p.actual_cost)),
                backgroundColor: '#FF6384'
              }
            ]
          }
        });
      }

      // Graphique en camembert pour la répartition des marges
      const projectsWithMargin = results.filter(p => p.margin);
      if (projectsWithMargin.length > 0) {
        charts.push({
          type: 'doughnut',
          title: 'Répartition des Marges',
          data: {
            labels: projectsWithMargin.map(p => p.reference),
            datasets: [{
              label: 'Marge (€)',
              data: projectsWithMargin.map(p => Number(p.margin)),
              backgroundColor: [
                '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', 
                '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF'
              ]
            }]
          }
        });
      }
    }

    return {
      text,
      charts,
      tables: [{
        title: "Synthèse des projets",
        headers: ["Référence", "Nom", "Statut", "Budget", "Coût", "Marge", "Client"],
        rows: results.map(project => [
          project.reference,
          project.name,
          project.statut_detail || project.status,
          project.budget ? `${Number(project.budget).toLocaleString('fr-FR')} €` : '-',
          project.actual_cost ? `${Number(project.actual_cost).toLocaleString('fr-FR')} €` : '-',
          project.margin ? `${Number(project.margin).toLocaleString('fr-FR')} €` : '-',
          project.client_name || '-'
        ]),
        highlight: [
          {
            column: 2, // Statut
            condition: 'warning' // Mettre en surbrillance les retards
          }
        ]
      }],
      suggestions: [
        "Analyser les projets en retard",
        "Voir la rentabilité par client",
        "Planning des prochaines échéances"
      ]
    };
  }

  private formatRentabilityResponse(results: any[], question: string): FormattedResponse {
    if (!results || results.length === 0) {
      return {
        text: "💰 Aucune donnée de rentabilité trouvée pour cette période.",
        suggestions: [
          "Voir la rentabilité sur 6 mois",
          "Analyser par type de projet",
          "Comparer avec l'année dernière"
        ]
      };
    }

    let text = `💰 **Analyse de Rentabilité** :\n\n`;
    
    const totalBudget = results.reduce((sum, row) => sum + (Number(row.budget_total) || 0), 0);
    const totalCost = results.reduce((sum, row) => sum + (Number(row.cout_total) || 0), 0);
    const totalMargin = results.reduce((sum, row) => sum + (Number(row.marge_total) || 0), 0);
    const globalMarginPct = totalBudget > 0 ? (totalMargin / totalBudget * 100) : 0;

    text += `📊 **Résumé Global** :\n`;
    text += `• Budget total : ${totalBudget.toLocaleString('fr-FR')} €\n`;
    text += `• Coût total : ${totalCost.toLocaleString('fr-FR')} €\n`;
    text += `• Marge totale : ${totalMargin.toLocaleString('fr-FR')} €\n`;
    text += `• Taux de marge : ${globalMarginPct.toFixed(2)}%\n\n`;

    results.forEach((period, index) => {
      const monthYear = new Date(period.mois).toLocaleDateString('fr-FR', {
        month: 'long',
        year: 'numeric'
      });
      
      text += `**${monthYear}** :\n`;
      text += `• ${period.nb_projets} projets\n`;
      text += `• Budget : ${Number(period.budget_total).toLocaleString('fr-FR')} €\n`;
      text += `• Coût : ${Number(period.cout_total).toLocaleString('fr-FR')} €\n`;
      text += `• Marge : ${Number(period.marge_total).toLocaleString('fr-FR')} € (${period.marge_globale_pct}%)\n\n`;
    });

    // Graphique d'évolution de la marge
    const charts: ChartData[] = [{
      type: 'line',
      title: 'Évolution de la Rentabilité',
      data: {
        labels: results.map(r => {
          const date = new Date(r.mois);
          return date.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
        }),
        datasets: [
          {
            label: 'Marge (%)',
            data: results.map(r => Number(r.marge_globale_pct) || 0),
            borderColor: '#36A2EB',
            backgroundColor: '#36A2EB'
          },
          {
            label: 'Budget (k€)',
            data: results.map(r => (Number(r.budget_total) || 0) / 1000),
            borderColor: '#4BC0C0',
            backgroundColor: '#4BC0C0'
          }
        ]
      }
    }];

    return {
      text,
      charts,
      tables: [{
        title: "Détail par période",
        headers: ["Période", "Nb Projets", "Budget", "Coût", "Marge", "Taux Marge"],
        rows: results.map(r => {
          const monthYear = new Date(r.mois).toLocaleDateString('fr-FR', {
            month: 'long',
            year: 'numeric'
          });
          return [
            monthYear,
            r.nb_projets,
            `${Number(r.budget_total).toLocaleString('fr-FR')} €`,
            `${Number(r.cout_total).toLocaleString('fr-FR')} €`,
            `${Number(r.marge_total).toLocaleString('fr-FR')} €`,
            `${r.marge_globale_pct}%`
          ];
        })
      }],
      suggestions: [
        "Identifier les projets les plus rentables",
        "Analyser les causes de perte de marge",
        "Comparer avec les objectifs"
      ]
    };
  }

  private formatAnalyticsResponse(results: any[], question: string): FormattedResponse {
    if (!results || results.length === 0) {
      return {
        text: "📊 Aucune donnée d'analyse trouvée.",
        suggestions: [
          "Voir les statistiques de la semaine",
          "Analyser la productivité",
          "Comparer les équipes"
        ]
      };
    }

    let text = `📊 **Analyse des Données** :\n\n`;
    
    // Analyse spécifique pour les temps de travail
    if (results[0].heures_travaillees !== undefined) {
      const totalHours = results.reduce((sum, row) => {
        return sum + (Number(row.heures_travaillees) || 0);
      }, 0);
      
      const employeeHours = new Map();
      results.forEach(row => {
        const emp = row.employe;
        if (!employeeHours.has(emp)) {
          employeeHours.set(emp, 0);
        }
        employeeHours.set(emp, employeeHours.get(emp) + (Number(row.heures_travaillees) || 0));
      });

      text += `⏱️ **Total des heures travaillées** : ${totalHours.toFixed(1)}h\n`;
      text += `👥 **Répartition par employé** :\n`;
      
      for (const [emp, hours] of employeeHours.entries()) {
        text += `• ${emp} : ${hours.toFixed(1)}h\n`;
      }
      text += `\n`;

      // Graphique des heures par employé
      const charts: ChartData[] = [{
        type: 'bar',
        title: 'Heures travaillées par employé',
        data: {
          labels: Array.from(employeeHours.keys()),
          datasets: [{
            label: 'Heures',
            data: Array.from(employeeHours.values()),
            backgroundColor: '#36A2EB'
          }]
        }
      }];

      return {
        text,
        charts,
        tables: [{
          title: "Détail des pointages",
          headers: ["Employé", "Projet", "Date", "Début", "Fin", "Heures", "Commentaire"],
          rows: results.map(r => [
            r.employe,
            r.projet,
            r.date_travail,
            new Date(r.check_in).toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'}),
            r.check_out ? new Date(r.check_out).toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'}) : '-',
            r.heures_travaillees ? `${Number(r.heures_travaillees).toFixed(1)}h` : '-',
            r.comment || '-'
          ])
        }],
        suggestions: [
          "Analyser la productivité par projet",
          "Voir les heures supplémentaires",
          "Comparer avec les objectifs"
        ]
      };
    }

    return this.formatGenericResponse(results, question);
  }

  private formatStaffResponse(results: any[], question: string): FormattedResponse {
    if (!results || results.length === 0) {
      return {
        text: "👥 Aucun employé trouvé.",
        suggestions: [
          "Voir tous les employés",
          "Ajouter un nouvel employé",
          "Voir les disponibilités"
        ]
      };
    }

    let text = `👥 **Équipe** (${results.length} employés) :\n\n`;
    
    const availableCount = results.filter(emp => emp.is_available).length;
    text += `✅ **Disponibles** : ${availableCount}/${results.length}\n\n`;

    results.forEach((emp, index) => {
      text += `**${index + 1}. ${emp.employe}**\n`;
      text += `📧 ${emp.email}\n`;
      if (emp.phone) text += `📞 ${emp.phone}\n`;
      if (emp.role) text += `🎯 Rôle : ${emp.role}\n`;
      text += `📅 Embauché le : ${new Date(emp.hire_date).toLocaleDateString('fr-FR')}\n`;
      text += `${emp.is_available ? '✅' : '❌'} ${emp.is_available ? 'Disponible' : 'Non disponible'}\n`;
      if (emp.projets_actifs) text += `🏗️ Projets actifs : ${emp.projets_actifs}\n`;
      text += `\n`;
    });

    return {
      text,
      tables: [{
        title: "Vue d'ensemble de l'équipe",
        headers: ["Nom", "Email", "Rôle", "Disponible", "Projets Actifs"],
        rows: results.map(emp => [
          emp.employe,
          emp.email,
          emp.role || '-',
          emp.is_available ? '✅' : '❌',
          emp.projets_actifs || '0'
        ])
      }],
      suggestions: [
        "Planning de l'équipe",
        "Répartition des charges",
        "Compétences disponibles"
      ]
    };
  }

  private formatGenericResponse(results: any[], question: string): FormattedResponse {
    console.log('🔍 Debug formatGenericResponse:', {
      hasResults: !!results,
      resultsLength: results?.length,
      firstResult: results?.[0],
      resultKeys: results?.[0] ? Object.keys(results[0]) : 'no keys'
    });
    
    if (!results || results.length === 0) {
      console.log('❌ Aucun résultat - returning "Aucun résultat trouvé"');
      return {
        text: "Aucun résultat trouvé pour votre recherche.",
        suggestions: [
          "Reformuler la question",
          "Vérifier la base de données",
          "Contacter l'administrateur"
        ]
      };
    }

    // Détecter les requêtes de comptage (COUNT, nombre_de_*)
    const isCountQuery = results.length === 1 && results[0] && 
      (Object.keys(results[0]).some(key => 
        key.toLowerCase().includes('count') || 
        key.toLowerCase().includes('nombre') ||
        key.toLowerCase().includes('total')
      ));

    console.log('🔍 Debug count detection:', {
      isCountQuery,
      resultsLength: results.length,
      firstResultKeys: results[0] ? Object.keys(results[0]) : 'no keys',
      firstResult: results[0]
    });

    if (isCountQuery) {
      const result = results[0];
      const countKey = Object.keys(result)[0];
      const countValue = Number(result[countKey]) || 0;
      
      console.log('✅ Count query détectée:', { countKey, countValue });
      
      // Extraire le type d'élément compté depuis la question
      let itemType = 'éléments';
      const lowerQuestion = question.toLowerCase();
      if (lowerQuestion.includes('devis')) itemType = 'devis';
      else if (lowerQuestion.includes('facture')) itemType = 'factures';
      else if (lowerQuestion.includes('projet')) itemType = 'projets';
      else if (lowerQuestion.includes('client')) itemType = 'clients';
      else if (lowerQuestion.includes('document')) itemType = 'documents';
      else if (lowerQuestion.includes('matériau')) itemType = 'matériaux';

      return {
        text: `📊 **Résultat** : ${countValue.toLocaleString('fr-FR')} ${itemType}${countValue > 1 ? '' : ''}\n\n${countValue === 0 ? '⚠️ Aucun élément trouvé pour cette période.' : '✅ Données trouvées avec succès.'}`,
        data: { count: countValue, type: itemType },
        suggestions: countValue > 0 ? [
          `Voir le détail des ${itemType}`,
          `Analyser les ${itemType} par période`,
          `Comparer avec les années précédentes`
        ] : [
          "Vérifier les critères de recherche",
          "Élargir la période",
          "Voir toutes les données disponibles"
        ]
      };
    }

    let text = `📋 **Résultats** (${results.length} entrées) :\n\n`;
    
    if (results.length <= 5) {
      results.forEach((row, index) => {
        text += `**${index + 1}.** `;
        const keys = Object.keys(row);
        keys.slice(0, 3).forEach(key => {
          text += `${key}: ${row[key]} | `;
        });
        text = text.slice(0, -3) + '\n';
      });
    } else {
      text += `Trop de résultats pour un affichage détaillé. Voir le tableau ci-dessous.\n`;
    }

    // Créer un tableau générique
    const headers = Object.keys(results[0]);
    const rows = results.map(row => headers.map(header => row[header]));

    return {
      text,
      tables: [{
        title: "Résultats de la requête",
        headers,
        rows: rows.slice(0, 50) // Limiter à 50 lignes
      }],
      suggestions: [
        "Affiner les critères",
        "Exporter les données",
        "Analyser plus en détail"
      ]
    };
  }

  formatError(error: string, suggestion?: string): FormattedResponse {
    return {
      text: `❌ **Erreur** : ${error}\n\n${suggestion ? `💡 **Suggestion** : ${suggestion}` : ''}`,
      suggestions: [
        "Reformuler la question",
        "Vérifier la syntaxe",
        "Contacter le support"
      ]
    };
  }
} 