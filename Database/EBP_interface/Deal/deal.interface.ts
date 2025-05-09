export interface DealInterface {
    xx_NC: boolean;
    PredictedCosts: number;
    PredictedSales: number;
    PredictedGrossMargin: number;
    AccomplishedCosts: number;
    AccomplishedSales: number;
    AccomplishedGrossMargin: number;
    ProfitsOnCosts: number;
    ProfitsOnSales: number;
    ProfitsOnGrossMargin: number;
    Id: string;
    Caption: string;
    DealDate: Date;
    InvoiceScheduleEvent: boolean;
    InvoiceScheduleTimeEvent: boolean;
    PredictedDuration: number;
    AccomplishedDuration: number;
    ProfitsOnDuration: number;
    xx_DateDebut?: Date;
    xx_DateFin?: Date;
    xx_Gestion_Projet_Posit?: string;
    xx_DureePrevue?: number;
    DealState?: number;
    AnalyticAccounting_GridId?: string;
    sysEditCounter?: number;
    sysCreatedDate?: Date;
    sysCreatedUser?: string;
    sysModifiedDate?: Date;
    sysModifiedUser?: string;
    NotesClear?: string;
    Notes?: string;
    xx_Client?: string;
    xx_Total_Temps_Realise?: number;
    xx_Total_Temps_Realise_Client?: number;
    xx_Total_Temps_Realise_Interne?: number;
    xx_Service?: string;
    xx_Total_Temps_Realise_Relationnel?: number;
    xx_Date_Fin_Reelle?: Date;
    xx_Total_Temps_Realise_Projet?: number;
    xx_Duree_Trajet?: number;
    xx_Total_Temps_Realise_Trajet?: number;
    xx_Commercial?: string;
    xx_Total_Temps_Realise_Formation?: number;
    xx_Total_Temps_Realise_Maquettage?: number;
    xx_Date_Fiche_Travail?: Date;
    xx_Origine_Vente?: string;
    xx_Date_Rapport?: Date;
    ActualTreasury: number;
    CustomerCommitmentBalanceDues: number;
    SupplierCommitmentBalanceDues: number;
    SubContractorCommitmentBalanceDues: number;
    OtherCosts: number;
    TreasuryBalanceDue: number;
  }


  export interface DealassociatedfilesInterface {
    Id: string;
    ParentId: string;
    Name: string;
    DocumentType: number;
    sysEditCounter?: number;
    Content?: Buffer;
    sysCreatedDate?: Date;
    sysCreatedUser?: string;
    sysModifiedDate?: Date;
    sysModifiedUser?: string;
    OneDriveShareUrl?: string;
    OneDriveItemId?: string;
    OneDriveCode?: string;
    TypeMime?: string;
    StorageType: number;
  }

  export interface DealcolleagueInterface {
    InvoiceDefault: boolean;
    IsAutoLoaded: boolean;
    Id: string;
    ColleagueId: string;
    DealId?: string;
    LastName?: string;
    FirstName?: string;
    sysCreatedDate?: Date;
    sysCreatedUser?: string;
    sysModifiedDate?: Date;
    sysModifiedUser?: string;
    ConstructionSiteId?: string;
  }

  export interface DealcontactInterface {
    Id: string;
    Selected: boolean;
    ContactId: string;
    DealId?: string;
    sysCreatedDate?: Date;
    sysCreatedUser?: string;
    sysModifiedDate?: Date;
    sysModifiedUser?: string;
    NotesClear?: string;
    Notes?: string;
    ConstructionSiteId?: string;
    PrintSendOptions_Quote: number;
    PrintSendOptions_ExecutionQuote: number;
    PrintSendOptions_Order: number;
    PrintSendOptions_DeliveryOrder: number;
    PrintSendOptions_Invoice: number;
    PrintSendOptions_CreditMemo: number;
    PrintSendOptions_DepositInvoice: number;
    PrintSendOptions_DepositCreditMemo: number;
    PrintSendOptions_ProgressStateDocument: number;
    PrintSendOptions_PurchaseQuote: number;
    PrintSendOptions_PurchaseOrder: number;
    PrintSendOptions_ReceiptOrder: number;
    PrintSendOptions_ReturnOrder: number;
    PrintSendOptions_PurchaseInvoice: number;
    PrintSendOptions_PurchaseCreditMemo: number;
    PrintSendOptions_PurchaseDepositInvoice: number;
    PrintSendOptions_PurchaseDepositCreditMemo: number;
    PrintSendOptions_PurchaseProgressStateDocument: number;
  }


  export interface DealcustomerInterface {
    InvoiceDefault: boolean;
    Id: string;
    ThirdId: string;
    Name: string;
    Turnover: number;
    Type: number;
    IsAutoLoaded: boolean;
    sysCreatedDate?: Date;
    sysCreatedUser?: string;
    sysModifiedDate?: Date;
    sysModifiedUser?: string;
    DealId?: string;
    ConstructionSiteId?: string;
  }


  export interface DealextracostInterface {
    NetAmountVatIncluded: number;
    LineOrder: number;
    Id: string;
    Caption: string;
    ExtraCostDate: Date;
    Quantity: number;
    UnitPrice: number;
    NetAmountVatExcluded: number;
    VatId?: string;
    UnitId?: string;
    sysCreatedDate?: Date;
    sysCreatedUser?: string;
    sysModifiedDate?: Date;
    sysModifiedUser?: string;
    DealId?: string;
    ConstructionSiteId?: string;
    IncludeQuantitiesInAchievement: boolean;
    ExecutionQuoteLineId?: string;
  }

  export interface DealitemInterface {
    ItemType: number;
    Quantity: number;
    Id: string;
    ItemId?: string;
    ItemCaption?: string;
    sysCreatedDate?: Date;
    sysCreatedUser?: string;
    sysModifiedDate?: Date;
    sysModifiedUser?: string;
    AmountVatExcluded?: number;
    NetAmountVatExcludedWithDiscount?: number;
    InterestAmount?: number;
    NetInterestAmount?: number;
    GrossInterestAmount?: number;
    DealId?: string;
    ConstructionSiteId?: string;
    TotalConsumedQuantity: number;
    TotalConsumedAmount: number;
  }

  export interface DealpurchasedocumentInterface {
    Id: string;
    DocumentId: string;
    DocumentNumber: string;
    DocumentDate: Date;
    InvoiceCorrectionType: number;
    DocumentType: number;
    SupplierId: string;
    SupplierName: string;
    IncludeAmountInCost: boolean;
    IncludedAmount: number;
    sysCreatedDate?: Date;
    sysCreatedUser?: string;
    sysModifiedDate?: Date;
    sysModifiedUser?: string;
    DocumentState?: number;
    TransferedDocumentId?: string;
    AmountVatExcluded?: number;
    NetAmountVatExcludedWithDiscount?: number;
    DocumentTotalAmountVatExcludedWithDiscount?: number;
    NetAmountVatIncludedWithDiscount?: number;
    DealId?: string;
    ConstructionSiteId?: string;
    GlobalDocumentState?: string;
    DocumentEditCounter?: number;
  }

  export interface DealpurchasedocumentlineInterface {
    QuantityDecimalNumber: number;
    PricesDecimalNumber: number;
    IncludeAmountInCost: boolean;
    PurchasePrice: number;
    Quantity: number;
    GrossInterestBase: number;
    Id: string;
    LineType: number;
    LineOrder: number;
    DocumentId: string;
    IncludedAmount: number;
    DescriptionClear?: string;
    ItemId?: string;
    sysCreatedDate?: Date;
    sysCreatedUser?: string;
    sysModifiedDate?: Date;
    sysModifiedUser?: string;
    ParentLineId?: string;
    AmountVatExcluded?: number;
    NetAmountVatExcludedWithDiscount?: number;
    NetAmountVatIncludedWithDiscount?: number;
    DealId?: string;
    DocumentLineId?: string;
    TechnicalDescriptionClear?: string;
    ConstructionSiteId?: string;
    HasCostDispatch: boolean;
    QuantityToInclude: number;
    CostAmount: number;
  }

  export interface DealpurchasesettlementInterface {
    IsDeposit: boolean;
    Id: string;
    SettlementId: string;
    ThirdId: string;
    ThirdName: string;
    SettlementDate: Date;
    PaymentTypeId: string;
    Amount: number;
    DealId?: string;
    DepositLastAttachedDocumentId?: string;
    DepositLastAttachedDocumentType?: number;
    sysCreatedDate?: Date;
    sysCreatedUser?: string;
    sysModifiedDate?: Date;
    sysModifiedUser?: string;
    ConstructionSiteId?: string;
  }

  export interface DealresourcescostInterface {
    PredictedDuration: number;
    AccomplishedDuration: number;
    ProfitsOnDuration: number;
    NetAmountVatExcluded: number;
    CostAmount: number;
    PredictedCostamount: number;
    Id: string;
    DealId?: string;
    ColleagueId?: string;
    EquipmentId?: string;
    sysCreatedDate?: Date;
    sysCreatedUser?: string;
    sysModifiedDate?: Date;
    sysModifiedUser?: string;
    ConstructionSiteId?: string;
  }

  export interface DealsaledocumentInterface {
    Id: string;
    DocumentId: string;
    DocumentNumber: string;
    DocumentDate: Date;
    InvoiceCorrectionType: number;
    DocumentType: number;
    CustomerId: string;
    CustomerName: string;
    ColleagueId?: string;
    NetInterestAmount?: number;
    GrossInterestAmount?: number;
    InterestAmount?: number;
    DocumentState?: number;
    TransferedDocumentId?: string;
    AmountVatExcluded?: number;
    NetAmountVatExcludedWithDiscount?: number;
    DocumentTotalAmountVatExcludedWithDiscount?: number;
    NetAmountVatIncludedWithDiscount?: number;
    DealId?: string;
    sysCreatedDate?: Date;
    sysCreatedUser?: string;
    sysModifiedDate?: Date;
    sysModifiedUser?: string;
    AchievedDuration?: number;
    ExpectedDuration?: number;
    ToScheduleDuration?: number;
    InvoicableAchievedDuration?: number;
    InvoicableExpectedDuration?: number;
    InvoicableToScheduleDuration?: number;
    ConstructionSiteId?: string;
    GlobalDocumentState?: string;
    IsReferenceDocument?: boolean;
    DocumentEditCounter?: number;
  }


  export interface DealsaledocumentlineInterface {
    QuantityDecimalNumber: number;
    PricesDecimalNumber: number;
    PurchasePrice: number;
    Quantity: number;
    GrossInterestBase: number;
    Id: string;
    LineType: number;
    LineOrder: number;
    DocumentId: string;
    RealQuantity: number;
    SumRealQuantityServiceComponents: number;
    DescriptionClear?: string;
    ItemId?: string;
    ParentLineId?: string;
    sysCreatedDate?: Date;
    sysCreatedUser?: string;
    sysModifiedDate?: Date;
    sysModifiedUser?: string;
    NetInterestAmount?: number;
    GrossInterestAmount?: number;
    InterestAmount?: number;
    AmountVatExcluded?: number;
    NetAmountVatExcludedWithDiscount?: number;
    NetAmountVatIncludedWithDiscount?: number;
    DealId?: string;
    DocumentLineId?: string;
    TechnicalDescriptionClear?: string;
    ConstructionSiteId?: string;
  }
  export interface DealstockdocumentInterface {
    IncludeAmountInCost: boolean;
    Amount: number;
    IncludedAmount: number;
    Id: string;
    DocumentId: string;
    DocumentNumber: string;
    DocumentDate: Date;
    DocumentType: number;
    StorehouseId: string;
    TargetStorehouseId?: string;
    TransferedDocumentId?: string;
    DealId?: string;
    sysCreatedDate?: Date;
    sysCreatedUser?: string;
    sysModifiedDate?: Date;
    sysModifiedUser?: string;
    ConstructionSiteId?: string;
    CreatedFromConstructionSiteConsumptions: boolean;
    PickStockOperationType?: number;
    DocumentEditCounter?: number;
  }

  export interface DealstockdocumentlineInterface {
    LineType: number;
    LineOrder: number;
    DocumentId: string;
    Id: string;
    Quantity: number;
    QuantityDecimalNumber: number;
    PricesDecimalNumber: number;
    Amount: number;
    IncludedAmount: number;
    IncludeAmountInCost: boolean;
    StorehouseId?: string;
    TargetStorehouseId?: string;
    DealId?: string;
    ParentLineId?: string;
    DescriptionClear?: string;
    ItemId?: string;
    sysCreatedDate?: Date;
    sysCreatedUser?: string;
    sysModifiedDate?: Date;
    sysModifiedUser?: string;
    DocumentLineId?: string;
    TechnicalDescriptionClear?: string;
    ConstructionSiteId?: string;
    PickStockOperationType?: number;
  }


export interface DealsupplierInterface {
  IsAutoLoaded: boolean;
  Id: string;
  ThirdId: string;
  Name: string;
  Turnover: number;
  sysCreatedDate?: Date;
  sysCreatedUser?: string;
  sysModifiedDate?: Date;
  sysModifiedUser?: string;
  DealId?: string;
  ConstructionSiteId?: string;
}