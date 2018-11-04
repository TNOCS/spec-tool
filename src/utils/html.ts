import { InputType } from './../models/specification/question';
import { CharacterCounter } from 'materialize-css';
import m, { Lifecycle, Component } from 'mithril';
import { uniqueId, removeParagraphs } from './utils';

export const compose = <F extends (d: any) => any, T>(...functions: F[]) => (
  data: T
) => functions.reduceRight((value, func) => func(value), data);

export const map = <T>(f: (...args: any[]) => any) => (x: T[]) =>
  Array.prototype.map.call(x, f);

export const join = <T>(seperator: string) => (list: T[]): string =>
  Array.prototype.join.call(list, seperator);

/**
 * Convert camel case to snake case.
 *
 * @param {string} cc: Camel case string
 */
export const camelToSnake = (cc: string) =>
  cc.replace(/([A-Z])/g, $1 => '-' + $1.toLowerCase());

const encodeAttribute = (x = '') => x.toString().replace(/"/g, '&quot;');

const toAttributeString = <T extends { [key: string]: any }>(x?: T) =>
  x
    ? compose(
        join(''),
        map(
          (attribute: string) =>
            `[${camelToSnake(attribute)}="${encodeAttribute(x[attribute])}"]`
        ),
        Object.keys
      )(x)
    : '';

export interface IHtmlAttributes {
  id?: string;
  for?: string;
  placeholder?: string;
  autofocus?: boolean;
  disabled?: boolean;
  type?: 'submit' | 'button' | 'text' | 'textarea' | 'number';
}

export interface IHtmlInputEvents<State, Attrs>
  extends Lifecycle<Attrs, State> {
  value?: string | number | boolean;
  href?: string;
  class?: string;
  style?: string;
  type?: string;
  onclick?: (e: UIEvent) => void;
}

export const icon = (iconName: string, attrs = {}) =>
  m('i.material-icons', attrs, iconName);
export const smallIcon = (iconName: string, attrs = {}) =>
  m('i.small.material-icons', attrs, iconName);

export const iconPrefix = (iconName: string, attrs = {}) =>
  m('i.material-icons.prefix', attrs, iconName);

/**
 * Convert a list of class names to mithril syntax, e.g. .class1.class2.class3
 * @param contentClass
 */
export const toDottedClassList = (contentClass?: string | string[]) =>
  contentClass instanceof Array && contentClass.length > 0
    ? '.' + contentClass.join('.')
    : contentClass && typeof contentClass === 'string'
      ? '.' + contentClass.replace(' ', '.')
      : '';

const baseButton = (defaultClassNames: string[]) => <State, Attrs>(opt: {
  label?: string;
  iconName?: string;
  attr?: IHtmlAttributes;
  tooltip?: string;
  ui?: IHtmlInputEvents<State, Attrs>;
  contentClass?: string;
}) =>
  m(
    `${defaultClassNames.join('.')}${
      opt.contentClass ? '.' + opt.contentClass : ''
    }${
      opt.tooltip
        ? '.tooltipped[data-position=top][data-tooltip=' + opt.tooltip + ']'
        : ''
    }${toAttributeString(opt.attr)}`,
    opt.ui || {},
    opt.iconName ? icon(opt.iconName, { class: 'left' }) : '',
    opt.label ? opt.label : ''
  );

export const button = baseButton(['a', 'waves-effect', 'waves-light', 'btn']);
export const flatButton = baseButton([
  'button',
  'waves-effect',
  'waves-teal',
  'btn-flat',
]);
export const roundIconButton = baseButton([
  'button',
  'btn-floating',
  'btn-large',
  'waves-effect',
  'waves-light',
]);

export const mandatory = '<span style="color: red;">*</span>';

export interface IInputOptions {
  id: string;
  initialValue?: string;
  onchange: (value: string | number | boolean) => void;
  label: string;
  placeholder?: string;
  helperText?: string;
  iconName?: string;
  disabled?: boolean;
  style?: string;
  /** When input type is a number, optionally specify the minimum value. */
  min?: number;
  /** When input type is a number, optionally specify the maximum value. */
  max?: number;
  /** When input type is a text or text area, optionally specify the minimum length. */
  minLength?: number;
  /** When input type is a text or text area, optionally specify the maximum length. */
  maxLength?: number;
  /** Number of rows of a textarea */
  rows?: number;
  /** Number of cols of a textarea */
  cols?: number;
  /** If true, break to a new line */
  break?: boolean;
  /** Classes that you wish to attach to a question, e.g. "col s12 m6 l4 xl3" to specify the size. */
  contentClass?: string | string[];
}
const isLabelActive = (value: string | number | boolean | undefined) =>
  typeof value === 'undefined' ? '' : 'active';

/** Options that we want to convert to attributes  */
const inputAttributes = [
  'min',
  'max',
  'minLength',
  'maxLength',
  'rows',
  'cols',
  'placeholder',
];

const isInputAttribute = (key: string) => inputAttributes.indexOf(key) >= 0;
const isDefinedAttribute = (opt: IInputOptions) => (key: string) =>
  typeof (opt as any)[key] !== 'undefined';

const toProps = (o: IInputOptions) => {
  const isAttributeDefined = isDefinedAttribute(o);
  return Object.keys(o)
    .filter(isInputAttribute)
    .filter(isAttributeDefined)
    .reduce(
      (p, c) => {
        const value = (o as any)[c];
        p.push(`[${c.toLowerCase()}=${value}]`);
        return p;
      },
      [] as string[]
    )
    .join('');
};

/** Add a character counter when there is an input restriction. */
const charCounter = (o: IInputOptions) =>
  o.maxLength ? `[data-length=${o.maxLength}]` : '';

/** Add the disabled attribute when required */
const disabled = (o: IInputOptions) => (o.disabled ? '[disabled]' : '');

/** Convert input options to a set of input attributes */
const toAttrs = (o: IInputOptions) => toProps(o) + charCounter(o) + disabled(o);

const oncreateFactory = (
  type: InputType,
  state: { id: string },
  opt: IInputOptions
) => {
  switch (type) {
    case 'text':
      return opt.maxLength
        ? () => {
            const elem = document.querySelector(`#${state.id}`);
            if (elem) {
              CharacterCounter.init(elem);
            }
          }
        : undefined;
    case 'date':
      return () => {
        const elem = document.querySelector(`#${state.id}`);
        if (elem) {
          M.Datepicker.init(elem, {
            format: 'yyyy/mm/dd',
            showClearBtn: true,
            // defaultDate: opt.initialValue,
            // setDefaultDate: true,
            // defaultDate: opt.initialValue
            //   ? new Date(opt.initialValue)
            //   : undefined,
          });
        }
      };
    case 'time':
      return () => {
        const elem = document.querySelector(`#${state.id}`);
        if (elem) {
          M.Timepicker.init(elem, { twelveHour: false, showClearBtn: true });
        }
      };
    default:
      return undefined;
  }
};

const inputField = (type: InputType, defaultClass = '') => (
  opt: IInputOptions
): Component<{}> => {
  const state = { id: uniqueId() };
  const oncreate = oncreateFactory(type, state, opt);
  const onchange = m.withAttr('value', (v: string) => opt.onchange(v));
  return {
    oncreate,
    view: () => {
      const id = state.id;
      const attrs = toAttrs(opt);
      const finalType = type === 'date' || type === 'time' ? 'text' : type;
      return m(
        `.input-field${
          opt.break ? '.clear' : ''
        }${defaultClass}${toDottedClassList(opt.contentClass)}`,
        // { style: opt.style },
        [
          opt.iconName ? m('i.material-icons.prefix', opt.iconName) : '',
          m(`input[type=${finalType}][tabindex=0][id=${id}]${attrs}`, {
            onchange,
            value: opt.initialValue,
          }),
          m(`label.active[for=${id}]`, m.trust(opt.label)),
          opt.helperText ? m('span', m.trust(opt.helperText)) : undefined,
        ]
      );
    },
  };
};

export const inputTextArea = (opt: IInputOptions) => {
  const state = { id: uniqueId() };
  return {
    oncreate: () => {
      const elem = document.querySelector(`#${state.id}`);
      if (elem) {
        M.textareaAutoResize(elem);
        if (opt.maxLength) {
          CharacterCounter.init(elem);
        }
      }
    },
    view: () => {
      const id = state.id;
      const attrs = toAttrs(opt);
      return m(
        `.input-field${toDottedClassList(opt.contentClass || 'col s12')}`,
        { style: opt.style || '' },
        [
          opt.iconName ? m('i.material-icons.prefix', opt.iconName) : '',
          m(`textarea.materialize-textarea[tabindex=0][id=${id}]${attrs}`, {
            onchange: m.withAttr('value', opt.onchange),
            value: opt.initialValue,
          }),
          m(`label.active[for=${id}]`, opt.label),
        ]
      );
    },
  };
};

export const inputUrl = inputField('url');
export const inputColor = inputField('color');
export const inputDate = inputField('date', '.datepicker');
export const inputTime = inputField('time', '.timepicker');
export const inputText = inputField('text');
export const inputNumber = inputField('number');
export const inputEmail = inputField('email');
export const inputBox = (opt: IInputOptions) =>
  opt.hasOwnProperty('initialValue') && typeof opt.initialValue === 'number'
    ? inputNumber(opt)
    : inputText(opt);

export const InputCheckbox = (opt: {
  checked?: boolean;
  onchange: (value: boolean) => void;
  label: string;
  disabled?: boolean;
  contentClass?: string;
}) => {
  return {
    view: ({ attrs }) =>
      m(
        `div${toDottedClassList(opt.contentClass)}`,
        m('label', [
          m(
            `input[type=checkbox][tabindex=0]${
              attrs.checked ? '[checked=checked]' : ''
            }`,
            {
              onclick: m.withAttr('checked', opt.onchange),
            }
          ),
          m('span', m.trust(removeParagraphs(opt.label))),
        ])
      ),
  } as Component<{ checked?: boolean }>;
};

export const Select = (opt: {
  label: string;
  options: Array<{ id: string | number; label: string }>;
  onchange: (id: string | number) => void;
  break?: boolean;
  contentClass?: string;
}) => {
  const state = { id: uniqueId() };
  const clear = opt.break ? '.clear' : '';
  return {
    oncreate: () => {
      const elem = document.querySelector(`#${state.id}`);
      if (elem) {
        M.FormSelect.init(elem);
      }
    },
    view: ({ attrs }) => {
      const id = state.id;
      const { checkedId } = attrs;
      return m(`.input-field${clear}${toDottedClassList(opt.contentClass)}`, [
        m(
          `select[id=${id}]`,
          {
            onchange: (e: Event) => {
              if (e && e.currentTarget) {
                const b = e.currentTarget as HTMLButtonElement;
                opt.onchange(b.value);
              }
            },
          },
          opt.options.map(o =>
            m(
              `option[value=${o.id}]${checkedId === o.id ? '[selected]' : ''}`,
              removeParagraphs(o.label).replace('&amp;', '&')
            )
          )
        ),
        m('label', m.trust(removeParagraphs(opt.label))),
      ]);
    },
  } as Component<{ checkedId: string | number | undefined }>;
};

export const InputRadios = (opt: {
  radios: Array<{ id: string | number; label: string }>;
  onchange: (id: string | number) => void;
  label: string;
  description?: string;
  break?: boolean;
  contentClass?: string;
}) => {
  const state = { id: uniqueId() };
  const clear = opt.break ? '.clear' : '';
  return {
    view: ({ attrs }) => {
      const groupId = state.id;
      const checkedId = attrs.checkedId;
      return m(
        `.input-field${clear}${toDottedClassList(opt.contentClass)}`, [
        m('h3', m.trust(opt.label)),
        opt.description ? m('p.description', m.trust(opt.description)) : '',
        ...opt.radios.map(r =>
          m(
            InputRadio({
              ...r,
              onchange: opt.onchange,
              groupId,
            }),
            {
              checked: r.id === checkedId,
            }
          )
        )]
      );
    },
  } as Component<{ checkedId: string | number | undefined }>;
};

const InputRadio = (opt: {
  id: string | number;
  checked?: boolean;
  onchange: (id: string | number) => void;
  label: string;
  groupId: string;
  disabled?: boolean;
  contentClass?: string;
}) =>
  ({
    view: ({ attrs }) =>
      m(
        `div${toDottedClassList(opt.contentClass)}`,
        m('label', [
          m(
            `input[type=radio][tabindex=0][name=${opt.groupId}]${
              attrs.checked ? '[checked=checked]' : ''
            }`,
            {
              onclick: m.withAttr('checked', v => opt.onchange(opt.id)),
            }
          ),
          m('span', m.trust(removeParagraphs(opt.label))),
        ])
      ),
  } as Component<{ checked?: boolean }>);
