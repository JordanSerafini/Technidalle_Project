import {
  ConstructionsiteInterface,
  ConstructionsitereferencedocumentInterface,
} from './constructionSite';

export interface ProjectEBP {
  constructionSite: ConstructionsiteInterface;
  constructionSiteReferenceDocument?: ConstructionsitereferencedocumentInterface;
}
