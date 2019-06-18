import { IFormResult, IFormResults } from './form-result';

export interface IUiFormComponent {
  element: UiFormElement;
  /** Optional unique key for dealing with repeat constructs */
  key?: string;
  /** Form results, created by filling out other form elements. */
  formResults?: IFormResults;
  index?: string;
  /** Callback function to set the result. */
  setResult: (
    id: string,
    value: boolean | string | number | Date,
    index: string,
    options?: {
      presetName?: string;
      element?: UiFormElement;
    }
  ) => void;
}

export type UiFormElement = IBaseUiElement | IOption | ISelection | IUiElementGroup;

/** Element with a template, e.g. for a textbox */
export interface ITemplateElement extends IBaseUiElement {
  template: string | string[];
}

/** Element with multiple options (more can be checked) */
export interface IOption extends IBaseUiElement {
  options: IBaseUiElement[];
}

/** Element with only one allowed option (only one can be selected) */
export interface ISelection extends IBaseUiElement {
  choices: IBaseUiElement[];
}

/** Element with a group of elements */
export interface IUiElementGroup extends IBaseUiElement {
  elements: UiFormElement[];
}

/** Generic element */
export interface IBaseUiElement {
  /**
   * Unique identifier: in case the element has a parent, e.g. in a yes/no element,
   * its ID is combined with the parent ID to create a unique ID. E.g. if the parent
   * ID = 1, and the sub-element is ID = 'a', you can refer to it as '1a'.
   */
  id: string;
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
   * Optional descriptive text, shown under the element. In case of an array, each string is
   * treated as a paragraph.
   */
  description?: string | string[];
  /**
   * When the element is answered, the corresponding output is added to the report.
   */
  output?: string | string[];
  /** The data element contains optional properties, e.g. to specify a placeholder or apply some classes.  */
  data?: IData;
  /**
   * By default, repeat is 0. In case it is 1 or more, it means that we can repeat
   * (and delete) the element or group.
   * In case of a string, the resolved value should be a number too.
   */
  repeat?: number | string;
  /**
   * By default, show every element, except when this property is defined. In that case, show when:
   * - show is a string with a elementID, and elementID is selected (as an answer)
   * - show is a string array, and one of the elementIDs is selected [OR condition]
   * When the string contains commas, separating elementIDs, only
   * show it when all of these elements have been selected.
   */
  show?: string | string[];
  /** When true, mark the element as mandatory. */
  mandatory?: boolean;
  /** Internal property. When duplicating elements, index refers to the duplication index, e.g. 0 is the first, etc. */
  index?: string;
}

export interface ICompletedUiForm extends IBaseUiElement {
  answer?: IFormResult;
  choices?: ICompletedUiForm[];
  options?: ICompletedUiForm[];
  elements?: ICompletedUiForm[];
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
  | 'switch'
  | 'select'
  | 'radio';

/** Attached data, e.g. for generating output or creating a table, etc. */
export interface IData {
  /** If true, break to a new line */
  newLine?: boolean;
  /** Can be used as a placeholder for text inputs */
  placeholder?: string;
  /**
   * Optional list of answers that must be set when the element is selected.
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
  /** Classes that you wish to attach to a element, e.g. "col s12 m6 l4 xl3" to specify the size. */
  contentClass?: string;
  /** Classes that you wish to attach to the title of a element, e.g. "col s12 m6 l4 xl3" to specify the size. */
  titleClass?: string;
  /** When you use a property `x` in your element, you can use x to provide an initial value. */
  [key: string]: any;
}
