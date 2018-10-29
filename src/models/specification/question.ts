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
  /** When true, mark the question as mandatory. */
  mandatory?: boolean;
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

export type InputType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'url'
  | 'email'
  | 'color'
  | 'date'
  | 'time'
  | 'select'
  | 'radio';

/** Attached data, e.g. for generating output or creating a table, etc. */
export interface IData {
  /**
   * Optional list of answers that must be set when the question is selected.
   * If value is not supplied, the default (true) is used.
   */
  presets?: Array<{ id: string; value?: boolean | number | string }>;
  /** When input type is a number, optionally specify the minimum value. */
  min?: number;
  /** When input type is a number, optionally specify the maximum value. */
  max?: number;
  /** When input type is a text or text area, optionally specify the minimum length. */
  minLength?: number;
  /** When input type is a text or text area, optionally specify the maximum length. */
  maxLength?: number;
  /** Type of input */
  type?: InputType;
  /** Classes that you wish to attach to a question, e.g. "col s12 m6 l4 xl3" to specify the size. */
  classNames?: string;
  /** When you use a property `x` in your question, you can use x to provide an initial value. */
  [key: string]: any;
}
