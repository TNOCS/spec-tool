import { IAnswer } from './answer';

export type Question = IBaseQuestion | IYesNo | IOption | ISelection;

/** Question with a template, e.g. for a textbox */
export interface ITemplateQuestion extends IBaseQuestion {
  template: string | string[];
}

/** Yes/no question */
export interface IYesNo extends IBaseQuestion {
  yes: IBaseQuestion;
  no: IBaseQuestion;
}

/** Question with multiple options (more can be checked) */
export interface IOption extends IBaseQuestion {
  options: IBaseQuestion[];
}

/** Question with only one allowed option (only one can be selected) */
export interface ISelection extends IBaseQuestion {
  choices: IBaseQuestion[];
}

/** Generic question */
export interface IBaseQuestion {
  /**
   * Unique identifier: in case the question has a parent, e.g. in a yes/no question,
   * its ID is combined with the parent ID to create a unique ID. E.g. if the parent
   * ID = 1, and the sub-question is ID = 'a', you can refer to it as '1a'.
   */
  id: string | number;
  /**
   * Text that is shown in simple cases.
   * In more complicated cases, it may contain data annotations, e.g.
   * - "Give me your name: _name_?"" is converted to a string with input textbox.
   *   The entered name is stored in the answer.
   * - In "&id.name, how old are your?: _age_", the name is replaced with the entered name, and the age is captured.
   *
   * In case the attached data object already contains a name or age property, its value is copied,
   * and its type is used to determine the input type (e.g. if it is a string, use text input).
   */
  title: string;
  /**
   * Optional descriptive text, shown under the question. In case of an array, each string is
   * treated as a paragraph.
   */
  description?: string | string[];
  /**
   * When the question is answered, the corresponding output is added to the report.
   */
  output?: string | string[];
  /** When the quesion is selected, the data contains the text that is added to the specification document. */
  data?: IData;
  /**
   * By default, repeat is 0. In case it is 1 or more, it means that we can repeat
   * (and delete) the question or group.
   * In case of a string, the resolved value should be a number too.
   */
  repeat?: number | string;
  /**
   * By default, show every question, except when this property is defined. In that case, show when:
   * - show is a string with a questionID, and questionID is selected (as an answer)
   * - show is a string array, and one of the questionIDs is selected [OR condition]
   * When the string contains commas, separating questionIDs, only
   * show it when all of these questions have been selected.
   */
  show?: string | string[];
  /** Internal property. When duplicating questions, index refers to the duplication index, e.g. 0 is the first, etc. */
  index?: string;
}

export interface IAnsweredQuestion extends IBaseQuestion {
  answer?: IAnswer;
  choices?: IAnsweredQuestion[];
  options?: IAnsweredQuestion[];
  yes?: IAnsweredQuestion;
  no?: IAnsweredQuestion;
}

/** Attached data, e.g. for generating output or creating a table, etc. */
export interface IData {
  /**
   * Optional list of answers that must be set when the question is selected.
   * If value is not supplied, the default (true) is used.
   */
  presets?: Array<{ id: string; value?: boolean | number | string }>;
  /**
   * Markdown text that is added to the specification document.
   * Headers are automatically adjusted, e.g. if the text is added.
   *
   * When the owning question is a parent, it can reference its children
   * using $1, $2, etc. or $$ to reference all.
   */
  text?: string;
  value?: boolean | number | string;
  type?: 'text' | 'textarea' | 'number';
  [key: string]: any;
}
