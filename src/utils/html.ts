import m, { Lifecycle, Component } from 'mithril';
import { uuid4 } from './utils';

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
 * @param classNames
 */
export const toDottedClassList = (classNames?: string | string[]) =>
  classNames instanceof Array && classNames.length > 0
    ? '.' + classNames.join('.')
    : '';

const baseButton = (defaultClassNames: string[]) => <State, Attrs>(opt: {
  label?: string;
  iconName?: string;
  attr?: IHtmlAttributes;
  tooltip?: string;
  ui?: IHtmlInputEvents<State, Attrs>;
  classNames?: string;
}) =>
  m(
    `${defaultClassNames.join('.')}${
      opt.classNames ? '.' + opt.classNames : ''
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

export interface IInputOptions {
  id: string;
  initialValue?: string;
  onchange: (value: string | number | boolean) => void;
  label: string;
  iconName?: string;
  disabled?: boolean;
  style?: string;
  classNames?: string | string[];
}
const isLabelActive = (value: string | number | boolean | undefined) =>
  typeof value === 'undefined' ? '' : 'active';

const inputField = (type: string) => (opt: IInputOptions) => ({
  view: () => {
    const id = uuid4();
    return m(
      `.input-field${toDottedClassList(opt.classNames)}`,
      { style: opt.style || '' },
      [
        opt.iconName ? m('i.material-icons.prefix', opt.iconName) : '',
        m(`${type}[tabindex=0][id=${id}]${opt.disabled ? '[disabled]' : ''}`, {
          onchange: m.withAttr('value', opt.onchange),
          value: opt.initialValue,
        }),
        m(
          `label[for=${id}]`,
          { class: `${isLabelActive(opt.initialValue)}` },
          opt.label
        ),
      ]
    );
  },
});

export const inputTextArea = (opt: IInputOptions) => ({
  oncreate: () => {
    const elem = document.querySelector('.materialize-textarea');
    if (elem) {
      M.textareaAutoResize(elem);
    }
  },
  view: () => {
    const id = uuid4();
    return m(
      `.input-field${toDottedClassList(opt.classNames)}`,
      { style: opt.style || '' },
      [
        opt.iconName ? m('i.material-icons.prefix', opt.iconName) : '',
        m(
          `textarea.materialize-textarea[tabindex=0][id=${id}]${
            opt.disabled ? '[disabled]' : ''
          }`,
          {
            onchange: m.withAttr('value', opt.onchange),
            value: opt.initialValue,
          }
        ),
        m(
          `label[for=${id}]`,
          { class: `${isLabelActive(opt.initialValue)}` },
          opt.label
        ),
      ]
    );
  },
});

export const inputText = inputField('input[type=text]');
export const inputNumber = inputField('input[type=number]');
export const inputEmail = inputField('input[type=email]');
export const inputBox = (opt: IInputOptions) =>
  opt.hasOwnProperty('initialValue') && typeof opt.initialValue === 'number'
    ? inputNumber(opt)
    : inputText(opt);

/** Remove paragraphs <p> and </p> and the beginning and end of a string. */
const removeParagraphs = (s: string) =>
  s.replace(/^<p>/, '').replace(/<\/p>$/, '');

export const InputCheckbox = (opt: {
  checked?: boolean;
  onchange: (value: boolean) => void;
  label: string;
  disabled?: boolean;
}) =>
  ({
    view: ({ attrs }) =>
      m(
        'p',
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
  } as Component<{ checked?: boolean }>);

export const InputRadios = (opt: {
  radios: Array<{ id: string | number; label: string }>;
  onchange: (id: string | number) => void;
}) =>
  ({
    view: ({ attrs }) => {
      const groupId = uuid4();
      const checkedId = attrs.checkedId;
      return opt.radios.map(r =>
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
      );
    },
  } as Component<{ checkedId: string | number | undefined }>);

const InputRadio = (opt: {
  id: string | number;
  checked?: boolean;
  onchange: (id: string | number) => void;
  label: string;
  groupId: string;
  disabled?: boolean;
}) =>
  ({
    view: ({ attrs }) =>
      m(
        'p',
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
