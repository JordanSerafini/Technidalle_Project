import { Injectable } from '@nestjs/common';

export interface QueryTemplate {
  keywords: string[];
  queryType: 'planning' | 'projects' | 'analytics' | 'rentability' | 'staff' | 'general';
  sqlTemplate: string;
  database: 'app' | 'sync';
  description: string;
}

@Injectable()
export class EnhancedPromptsService {
  private readonly businessQueryTemplates: QueryTemplate[] = [
    // Planning et événements
    {
      keywords: ['planning', 'demain', 'semaine', 'jour', 'rdv', 'agenda', 'événement', 'réunion'],
      queryType: 'planning',
      database: 'app',
      sqlTemplate: `
        -- Planning pour {staff_name} pour {date_range}
        SELECT 
          e.title,
          e.description,
          e.start_date,
          e.end_date,
          e.location,
          p.name as project_name,
          c.name as client_name,
          e.status
        FROM events e
        LEFT JOIN projects p ON e.project_id = p.id
        LEFT JOIN clients c ON e.client_id = c.id
        LEFT JOIN staff s ON e.staff_id = s.id
        WHERE e.start_date::date = '{date}'
        AND (s.firstname ILIKE '%{staff_name}%' OR s.lastname ILIKE '%{staff_name}%')
        ORDER BY e.start_date
      `,
      description: 'Récupère le planning d\'un employé pour une date donnée'
    },

    // Projets en cours et chantiers
    {
      keywords: ['projets', 'chantiers', 'en cours', 'terminé', 'retard', 'budget', 'marge'],
      queryType: 'projects',
      database: 'app',
      sqlTemplate: `
        -- Projets actifs avec leur statut et performance
        SELECT 
          p.reference,
          p.name,
          p.status,
          p.start_date,
          p.end_date,
          p.budget,
          p.actual_cost,
          p.margin,
          ROUND((p.actual_cost / NULLIF(p.budget, 0) * 100), 2) as budget_utilise_pct,
          c.name as client_name,
          CASE 
            WHEN p.end_date < CURRENT_DATE AND p.status = 'en_cours' THEN 'EN RETARD'
            WHEN p.status = 'en_cours' THEN 'EN COURS'
            ELSE UPPER(p.status)
          END as statut_detail
        FROM projects p
        JOIN clients c ON p.client_id = c.id
        WHERE p.status IN ('en_cours', 'devis_accepte', 'termine')
        ORDER BY 
          CASE WHEN p.end_date < CURRENT_DATE AND p.status = 'en_cours' THEN 1 ELSE 2 END,
          p.start_date DESC
      `,
      description: 'Analyse des projets avec statut détaillé et performance budgétaire'
    },

    // Plus gros chantiers
    {
      keywords: ['gros', 'important', 'grand', 'chantier', 'budget', 'montant', 'principal'],
      queryType: 'projects',
      database: 'app',
      sqlTemplate: `
        -- Les plus gros chantiers par budget
        SELECT 
          p.reference,
          p.name,
          p.budget,
          p.actual_cost,
          p.margin,
          p.status,
          c.name as client_name,
          p.start_date,
          p.end_date,
          ROUND((p.margin / NULLIF(p.budget, 0) * 100), 2) as marge_pct
        FROM projects p
        JOIN clients c ON p.client_id = c.id
        WHERE p.budget IS NOT NULL
        ORDER BY p.budget DESC
        LIMIT 10
      `,
      description: 'Les 10 plus gros chantiers par budget'
    },

    // Rentabilité et analytics
    {
      keywords: ['rentabilité', 'marge', 'profit', 'bénéfice', 'coût', 'performance', 'mois', 'trimestre'],
      queryType: 'rentability',
      database: 'app',
      sqlTemplate: `
        -- Analyse de rentabilité sur période
        SELECT 
          DATE_TRUNC('month', p.created_at) as mois,
          COUNT(*) as nb_projets,
          SUM(p.budget) as budget_total,
          SUM(p.actual_cost) as cout_total,
          SUM(p.margin) as marge_total,
          ROUND(AVG(p.margin / NULLIF(p.budget, 0) * 100), 2) as marge_moyenne_pct,
          ROUND(SUM(p.margin) / NULLIF(SUM(p.budget), 0) * 100, 2) as marge_globale_pct
        FROM projects p
        WHERE p.created_at >= CURRENT_DATE - INTERVAL '{months} months'
        AND p.budget IS NOT NULL
        GROUP BY DATE_TRUNC('month', p.created_at)
        ORDER BY mois DESC
      `,
      description: 'Analyse de rentabilité mensuelle'
    },

    // Temps de travail et présence
    {
      keywords: ['temps', 'heures', 'travaillé', 'présence', 'pointage', 'durée'],
      queryType: 'analytics',
      database: 'app',
      sqlTemplate: `
        -- Temps de travail par employé
        SELECT 
          s.firstname || ' ' || s.lastname as employe,
          p.name as projet,
          DATE(tl.check_in) as date_travail,
          tl.check_in,
          tl.check_out,
          CASE 
            WHEN tl.check_out IS NOT NULL THEN 
              EXTRACT(EPOCH FROM (tl.check_out - tl.check_in))/3600
            ELSE NULL
          END as heures_travaillees,
          tl.comment
        FROM time_logs tl
        JOIN staff s ON tl.staff_id = s.id
        JOIN projects p ON tl.project_id = p.id
        WHERE DATE(tl.check_in) >= CURRENT_DATE - INTERVAL '{days} days'
        ORDER BY tl.check_in DESC
      `,
      description: 'Temps de travail détaillé par employé et projet'
    },

    // Staff et équipes
    {
      keywords: ['employé', 'staff', 'équipe', 'disponible', 'absent', 'congé'],
      queryType: 'staff',
      database: 'app',
      sqlTemplate: `
        -- État des employés
        SELECT 
          s.firstname || ' ' || s.lastname as employe,
          s.email,
          s.phone,
          r.name as role,
          s.hire_date,
          s.is_available,
          COUNT(DISTINCT tl.project_id) as projets_actifs
        FROM staff s
        LEFT JOIN roles r ON s.role_id = r.id
        LEFT JOIN time_logs tl ON s.id = tl.staff_id 
          AND DATE(tl.check_in) >= CURRENT_DATE - INTERVAL '7 days'
        GROUP BY s.id, s.firstname, s.lastname, s.email, s.phone, r.name, s.hire_date, s.is_available
        ORDER BY s.lastname, s.firstname
      `,
      description: 'Vue d\'ensemble des employés et leur activité'
    }
  ];

  getBusinessPrompt(): string {
    return `Tu es un assistant intelligent spécialisé dans la gestion d'entreprise de BTP/construction.
Tu as accès à deux bases de données PostgreSQL :

🏢 BASE "app" (Données opérationnelles) :
- staff : employés (planning, disponibilité)
- projects : chantiers et projets
- events : planning et événements
- time_logs : pointage et heures travaillées
- clients : clients
- materials : matériaux
- vehicles : véhicules
- tasks : tâches

💼 BASE "sync" (Données comptables EBP) :
- Deal : affaires/chantiers avec données financières détaillées
- Customer : clients
- ConstructionSite : chantiers
- Colleague : collaborateurs
- SaleDocument : documents de vente
- PurchaseDocument : documents d'achat

🎯 QUESTIONS TYPES MÉTIER :

📅 PLANNING :
- "Quel est mon planning de demain ?"
- "Qui travaille sur le chantier X cette semaine ?"
- "Quels sont mes RDV client ?"

🏗️ PROJETS & CHANTIERS :
- "Quels sont les projets en retard ?"
- "Quel est l'avancement du chantier Y ?"
- "Quels sont les plus gros chantiers en cours ?"

💰 RENTABILITÉ :
- "Analyse ma rentabilité sur les 2 derniers mois"
- "Quelle est la marge sur le projet Z ?"
- "Quels projets sont déficitaires ?"

👥 ÉQUIPE :
- "Combien d'heures a travaillé Jean cette semaine ?"
- "Qui est disponible demain ?"
- "Répartition du temps par projet"

RÈGLES IMPORTANTES :
1. Pour les questions personnelles ("mon planning", "ma rentabilité"), demande l'identité
2. Utilise les templates optimisés pour chaque type de question
3. Privilégie "app" pour planning/opérationnel, "sync" pour financier
4. Formate les résultats de manière claire et professionnelle
5. Propose des analyses complémentaires pertinentes
6. Pour les dates relatives (demain, cette semaine), calcule automatiquement

DÉTECTION INTELLIGENTE :
- "demain" → DATE = CURRENT_DATE + 1
- "cette semaine" → BETWEEN CURRENT_DATE AND CURRENT_DATE + 7
- "mois dernier" → WHERE EXTRACT(MONTH FROM date) = EXTRACT(MONTH FROM CURRENT_DATE - INTERVAL '1 month')

Réponds toujours en français, sois professionnel mais accessible.`;
  }

  getQueryTemplate(question: string): QueryTemplate | null {
    const questionLower = question.toLowerCase();
    
    for (const template of this.businessQueryTemplates) {
      if (template.keywords.some(keyword => questionLower.includes(keyword))) {
        return template;
      }
    }
    
    return null;
  }

  generateContextualPrompt(question: string, tableSchema: string): string {
    const template = this.getQueryTemplate(question);
    
    if (template) {
      return `${this.getBusinessPrompt()}

CONTEXTE SPÉCIALISÉ :
Question type : ${template.queryType.toUpperCase()}
Base recommandée : ${template.database}
Description : ${template.description}

SCHÉMA DES TABLES :
${tableSchema}

TEMPLATE SUGGÉRÉ :
${template.sqlTemplate}

QUESTION UTILISATEUR : "${question}"

Génère une requête SQL optimisée en utilisant le template comme guide, mais adapte-la précisément à la question posée.
Si la question contient des références temporelles (demain, cette semaine, etc.), calcule les dates appropriées.
Si la question mentionne un nom de personne, utilise ILIKE pour la recherche.`;
    }

    return `${this.getBusinessPrompt()}

SCHÉMA DES TABLES :
${tableSchema}

QUESTION UTILISATEUR : "${question}"

Génère une requête SQL appropriée pour répondre à cette question métier.`;
  }

  detectQuestionType(question: string): 'planning' | 'projects' | 'analytics' | 'rentability' | 'staff' | 'general' {
    const template = this.getQueryTemplate(question);
    return template?.queryType || 'general';
  }

  suggestDatabase(question: string): 'app' | 'sync' {
    const template = this.getQueryTemplate(question);
    if (template) {
      return template.database;
    }

    // Règles par défaut
    if (question.toLowerCase().includes('planning') || 
        question.toLowerCase().includes('événement') ||
        question.toLowerCase().includes('pointage')) {
      return 'app';
    }

    if (question.toLowerCase().includes('marge') ||
        question.toLowerCase().includes('rentabilité') ||
        question.toLowerCase().includes('chiffre') ||
        question.toLowerCase().includes('comptable')) {
      return 'sync';
    }

    return 'app'; // Par défaut
  }
} 