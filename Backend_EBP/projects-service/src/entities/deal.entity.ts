import { Entity, PrimaryColumn, Column, OneToMany } from 'typeorm';
import { DealColleague } from './deal-colleague.entity';
import { DealCustomer } from './deal-customer.entity';
import { DealSupplier } from './deal-supplier.entity';
import { DealItem } from './deal-item.entity';
import { ConstructionSite } from './construction-site.entity';

@Entity('Deal')
export class Deal {
  @PrimaryColumn('text')
  Id: string;

  @Column('text', { nullable: true })
  Caption: string;

  @Column('timestamp', { nullable: true })
  DealDate: Date;

  @Column('integer', { nullable: true })
  DealState: number; // 1: En cours, 2: Terminé, 3: Suspendu, etc.

  @Column('text', { nullable: true })
  AnalyticAccounting_GridId: string;

  // Prévisions financières
  @Column('numeric', { nullable: true })
  PredictedCosts: number;

  @Column('numeric', { nullable: true })
  PredictedSales: number;

  @Column('numeric', { nullable: true })
  PredictedGrossMargin: number;

  @Column('numeric', { nullable: true })
  PredictedDuration: number;

  // Réalisé
  @Column('numeric', { nullable: true })
  AccomplishedCosts: number;

  @Column('numeric', { nullable: true })
  AccomplishedSales: number;

  @Column('numeric', { nullable: true })
  AccomplishedGrossMargin: number;

  @Column('numeric', { nullable: true })
  AccomplishedDuration: number;

  // Écarts
  @Column('numeric', { nullable: true })
  ProfitsOnCosts: number;

  @Column('numeric', { nullable: true })
  ProfitsOnSales: number;

  @Column('numeric', { nullable: true })
  ProfitsOnGrossMargin: number;

  @Column('numeric', { nullable: true })
  ProfitsOnDuration: number;

  // Dates personnalisées BTP
  @Column('timestamp', { nullable: true })
  xx_DateDebut: Date;

  @Column('timestamp', { nullable: true })
  xx_DateFin: Date;

  @Column('timestamp', { nullable: true })
  xx_Date_Fin_Reelle: Date;

  @Column('text', { nullable: true })
  xx_Gestion_Projet_Posit: string;

  @Column('numeric', { nullable: true })
  xx_DureePrevue: number;

  @Column('text', { nullable: true })
  xx_Client: string; // Client principal du projet

  @Column('text', { nullable: true })
  xx_Service: string; // Type de service BTP

  @Column('text', { nullable: true })
  xx_Commercial: string; // Commercial responsable

  @Column('text', { nullable: true })
  xx_Origine_Vente: string; // Origine de la vente

  // Temps réalisés détaillés
  @Column('numeric', { nullable: true })
  xx_Total_Temps_Realise: number;

  @Column('numeric', { nullable: true })
  xx_Total_Temps_Realise_Client: number;

  @Column('numeric', { nullable: true })
  xx_Total_Temps_Realise_Interne: number;

  @Column('numeric', { nullable: true })
  xx_Total_Temps_Realise_Relationnel: number;

  @Column('numeric', { nullable: true })
  xx_Total_Temps_Realise_Projet: number;

  @Column('numeric', { nullable: true })
  xx_Total_Temps_Realise_Trajet: number;

  @Column('numeric', { nullable: true })
  xx_Total_Temps_Realise_Formation: number;

  @Column('numeric', { nullable: true })
  xx_Total_Temps_Realise_Maquettage: number;

  @Column('numeric', { nullable: true })
  xx_Duree_Trajet: number;

  // Trésorerie et engagements
  @Column('numeric', { nullable: true })
  ActualTreasury: number;

  @Column('numeric', { nullable: true })
  CustomerCommitmentBalanceDues: number;

  @Column('numeric', { nullable: true })
  SupplierCommitmentBalanceDues: number;

  @Column('numeric', { nullable: true })
  SubContractorCommitmentBalanceDues: number;

  @Column('numeric', { nullable: true })
  OtherCosts: number;

  @Column('numeric', { nullable: true })
  TreasuryBalanceDue: number;

  // Événements et facturation
  @Column('boolean', { nullable: true })
  InvoiceScheduleEvent: boolean;

  @Column('boolean', { nullable: true })
  InvoiceScheduleTimeEvent: boolean;

  // Dates rapport et fiche
  @Column('timestamp', { nullable: true })
  xx_Date_Fiche_Travail: Date;

  @Column('timestamp', { nullable: true })
  xx_Date_Rapport: Date;

  // Champs système
  @Column('text', { nullable: true })
  Notes: string;

  @Column('text', { nullable: true })
  NotesClear: string;

  @Column('integer', { nullable: true })
  sysEditCounter: number;

  @Column('timestamp', { nullable: true })
  sysCreatedDate: Date;

  @Column('text', { nullable: true })
  sysCreatedUser: string;

  @Column('timestamp', { nullable: true })
  sysModifiedDate: Date;

  @Column('text', { nullable: true })
  sysModifiedUser: string;

  // Relations
  @OneToMany(() => DealColleague, colleague => colleague.deal)
  colleagues: DealColleague[];

  @OneToMany(() => DealCustomer, customer => customer.deal)
  customers: DealCustomer[];

  @OneToMany(() => DealSupplier, supplier => supplier.deal)
  suppliers: DealSupplier[];

  @OneToMany(() => DealItem, item => item.deal)
  items: DealItem[];

  @OneToMany(() => ConstructionSite, site => site.deal)
  constructionSites: ConstructionSite[];

  // Propriétés calculées pour le frontend mobile
  get isActive(): boolean {
    return this.DealState === 1;
  }

  get isCompleted(): boolean {
    return this.DealState === 2;
  }

  get isSuspended(): boolean {
    return this.DealState === 3;
  }

  get displayName(): string {
    return this.Caption || this.Id;
  }

  get statusText(): string {
    switch (this.DealState) {
      case 1: return 'En cours';
      case 2: return 'Terminé';
      case 3: return 'Suspendu';
      case 4: return 'Annulé';
      default: return 'Statut inconnu';
    }
  }

  get progressPercentage(): number {
    if (!this.PredictedDuration || this.PredictedDuration === 0) return 0;
    if (!this.AccomplishedDuration) return 0;
    return Math.min(100, Math.round((this.AccomplishedDuration / this.PredictedDuration) * 100));
  }

  get marginPercentage(): number {
    if (!this.PredictedSales || this.PredictedSales === 0) return 0;
    const margin = (this.AccomplishedGrossMargin || 0);
    return Math.round((margin / this.PredictedSales) * 100);
  }

  get isOverBudget(): boolean {
    return (this.AccomplishedCosts || 0) > (this.PredictedCosts || 0);
  }

  get remainingDuration(): number {
    const predicted = this.PredictedDuration || 0;
    const accomplished = this.AccomplishedDuration || 0;
    return Math.max(0, predicted - accomplished);
  }

  get clientName(): string {
    return this.xx_Client || 'Client non défini';
  }

  get commercialName(): string {
    return this.xx_Commercial || 'Commercial non affecté';
  }

  get serviceBTP(): string {
    return this.xx_Service || 'Service non défini';
  }

  get daysRemaining(): number {
    if (!this.xx_DateFin) return 0;
    const today = new Date();
    const endDate = new Date(this.xx_DateFin);
    const diffTime = endDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  get isLate(): boolean {
    return this.daysRemaining < 0 && !this.isCompleted;
  }

  get totalTimeRealised(): number {
    return this.xx_Total_Temps_Realise || 0;
  }
}