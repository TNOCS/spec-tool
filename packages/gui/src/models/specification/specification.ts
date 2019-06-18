import { IBaseUiElement, IFormResult, IOption, ISelection } from 'mithril-ui-form';
import { IDocumentInfo } from './document-info';
import { ITemplateDefinition } from './language-definition';

export interface ISpecification {
  /** Information about the template you are currently editing */
  templateInfo?: IDocumentInfo & Partial<ITemplateDefinition>;
  /** Information about the current version of the document */
  specificationInfo?: IDocumentInfo;
  /** Welcome text on the home page */
  introduction?: string | string[];
  /** Content questionnaires */
  chapters: IChapter[];
  /** Provided answers */
  results?: { [id: string]: { [repeat: string]: IFormResult } };
}

export interface IChapter extends ISection {
  sections?: ISection[];
}

export interface ISection extends IBaseUiElement {
  /** A list of questions to show */
  questions?: Question[];
  /** When used, some or all (unanswered) questions are prefilled */
  presets?: IPreset[];
}

export interface IQuestionGroup extends IBaseUiElement {
  questions: Question[];
}

export type Question = IBaseUiElement | IOption | ISelection | IQuestionGroup;

export interface IPreset {
  title: string;
  description?: string;
  selections: IPresetSelection[];
}

export interface IPresetSelection {
  /** ID of the selected question */
  id: string | number;
  /** In case the ID refers to an open question, you can add here open text. */
  text?: string;
}
