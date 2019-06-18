import { updateIndex, removeHtml, unCamelCase, parseIndex, defaultIndex, removeParagraphs } from '../utils/helpers';
import m, { Component, Vnode } from 'mithril';
import {
  UiFormElement,
  IOption,
  ISelection,
  IBaseUiElement,
  InputType,
  IUiElementGroup,
  IUiFormComponent,
} from '../models/ui-form';
import {
  RadioButtons,
  TextInput,
  IInputOptions,
  NumberInput,
  TextArea,
  ColorInput,
  UrlInput,
  TimePicker,
  EmailInput,
  Select,
  Options,
  IInputOption,
  DatePicker,
  Switch,
} from 'mithril-materialized';
import { replacePlaceholders, range, isVisible, getAnswer, getRepeat, newId, getDirectAnswer } from '../utils/helpers';

const switchView = (el: UiFormElement) => {
  if ((el as IOption).options) {
    return OptionsView;
  }
  if ((el as ISelection).choices) {
    return ChoicesView;
  }
  if ((el as IUiElementGroup).elements) {
    return UiForms;
  }
  return TemplateView;
};

/** Component that displays a single UI element */
export const UiForm = () => {
  return {
    view: ({ attrs }) => {
      const { element, formResults, setResult } = attrs;
      if (!element.data) {
        element.data = {};
      }
      if (!element.data.contentClass) {
        element.data.contentClass = 'col s12';
      }
      const i = attrs.index || defaultIndex;
      const key = (index: string) => `${attrs.key || element.id}_${index}`;
      const v = switchView(element);
      const repeat = getRepeat(element, formResults, i);
      return repeat === 0
        ? undefined
        : repeat === 1
        ? isVisible(element, formResults, i)
          ? m(v, { element, formResults, setResult, index: i, key: key(i) })
          : undefined
        : range(0, repeat - 1)
            .map(x => updateIndex(i, x, 'level3'))
            .map(index => m(v, { element, formResults, setResult, index, key: key(index) }));
    },
  } as Component<IUiFormComponent>;
};

/** Component that displays multiple UI elements */
const UiForms = (): Component<IUiFormComponent> => ({
  view: ({ attrs: { element, index, formResults, setResult } }) => {
    const g = element as IUiElementGroup;
    const elements = g.elements;
    const title = replacePlaceholders(g.title, formResults, index, false);
    const description = g.description ? replacePlaceholders(g.description, formResults, index) : undefined;
    return m('.row', [
      m(`h3.clear`, title),
      description ? m.trust(description) : '',
      ...elements.map(el => m(UiForm, { element: el, formResults, index, setResult })),
    ]);
  },
});

/**
 * Displays a UI element with several options
 */
const OptionsView = () =>
  ({
    view: ({ attrs }) => {
      const element = attrs.element as IOption;
      const { formResults, setResult } = attrs;
      const createId = (option: UiFormElement) => newId(element.id, option.id);
      const data = element.data || {};
      const titleClass = data.titleClass;
      const contentClass = data.contentClass;
      const index = attrs.index || defaultIndex;
      const qOptions = element.options || [];
      const options = qOptions
        .filter(o => isVisible(o, formResults, index))
        .map(
          o =>
            ({
              id: createId(o),
              label: removeParagraphs(replacePlaceholders(o.title, formResults, index)),
              // isChecked: getAnswer(createId(o), formResults, index) ? true : false,
            } as IInputOption)
        );
      const isMandatory = element.mandatory;
      const label = removeHtml(replacePlaceholders(element.title, formResults, index));
      const description = replacePlaceholders(element.description, formResults, index);
      const questionIndex = parseIndex(index)[2];
      const newRow = questionIndex === 0 && data.newRow;
      const onchange = (checkedId: Array<string | number>) => {
        const cId = checkedId && checkedId.length ? checkedId[0] : '';
        setResult(newId(element.id, cId), cId, index, {
          element: qOptions.filter(o => o.id === cId).shift(),
        });
      };
      return m(Options, {
        label,
        isChecked: getAnswer(element.id, formResults, index),
        isMandatory,
        contentClass,
        titleClass,
        options,
        description,
        onchange,
        newRow,
      });
    },
  } as Component<IUiFormComponent>);

/**
 * Displays a UI element with several choices
 */
const ChoicesView = () =>
  ({
    view: ({ attrs }) => {
      const element = attrs.element as ISelection;
      const { formResults, setResult, key } = attrs;
      const data = element.data || {};
      const index = attrs.index || defaultIndex;
      const choices = element.choices || [];
      const title = removeParagraphs(replacePlaceholders(element.title, formResults, index));
      const helperText = removeParagraphs(replacePlaceholders(element.description, formResults, index));
      const id = (optionId: string | number) => newId(element.id, optionId);
      const checkedChoice = choices.filter(c => getAnswer(id(c.id), formResults, index)).shift();
      const onchange = (checkedId: Array<string | number>) => {
        const cId = checkedId && checkedId.length ? checkedId[0] : '';
        choices.forEach(c => setResult(id(c.id), false, index));
        const selected = choices.filter(c => c.id === cId).shift();
        setResult(id(cId), true, index, { element: selected });
      };
      const onchangeRadio = (checkedId: string | number) => {
        choices.forEach(c => setResult(id(c.id), false, index));
        const selected = choices.filter(c => c.id === checkedId).shift();
        setResult(id(checkedId), true, index, { element: selected });
      };
      const questionIndex = parseIndex(index)[2];
      const newRow = questionIndex === 0 && data.newRow;
      const options = choices.map(c => ({
        id: c.id,
        label: removeParagraphs(replacePlaceholders(c.title, formResults, index)),
      }));
      return data.type === 'select' || (data.type !== 'radio' && options.length > 4)
        ? m(Select, {
          key,
          label: title,
          onchange,
          checkedId: checkedChoice ? checkedChoice.id : undefined,
          newRow,
          helperText,
          description: helperText,
          contentClass: data.contentClass,
          options,
        })
        : data.type === 'switch' || (data.type !== 'radio' && options.length === 2)
        ? m(Switch, {
            label: title,
            onchange: (v: boolean) => onchange(v ? [options[1].id] : [options[0].id]),
            left: options[0].label,
            right: options[1].label,
            checked: options[1].id === (checkedChoice ? checkedChoice.id : undefined),
          })
        : m(RadioButtons, {
          key,
          label: title,
          onchange: onchangeRadio,
          checkedId: checkedChoice ? checkedChoice.id : undefined,
          newRow,
          helperText,
          description: helperText,
          contentClass: data.contentClass,
          options,
        });
    },
  } as Component<IUiFormComponent>);

/**
 * Displays a UI element with a text box.
 * Depending on the type, it may be used to input plain text or numbers,
 * a text area, URI, emails, colors, date or time.
 * Input between underscores is replaced by supplied element attributes.
 */
const TemplateView = () => {
  const replaceInputs = (title: string) => {
    const inputsRegex = /_([a-zA-Z0-9]+)_/g;
    let r: RegExpExecArray | null;
    let i = 0;
    const matches: Array<{ label: string; id?: string }> = [];
    do {
      r = inputsRegex.exec(title);
      if (r !== null) {
        if (r.index === inputsRegex.lastIndex) {
          inputsRegex.lastIndex++;
        }

        r.forEach((match, groupIndex) => {
          if (groupIndex === 0) {
            return;
          }
          const fullMatch = `_${match}_`;
          const j = title.indexOf(fullMatch);
          const k = matches.length > 0 ? j : title.indexOf('\n');
          if (k < j && k > 0) {
            matches.push({ label: title.substr(0, k) });
            matches.push({
              label: title.substr(k + 1, j - k - 1),
              id: match,
            });
          } else {
            matches.push({ label: title.substr(i, j - i), id: match });
          }
          i = j + fullMatch.length;
        });
      } else {
        if (matches.length === 0) {
          matches.push({ label: title });
        }
      }
    } while (r !== null);
    return matches;
  };
  return {
    view: ({ attrs }) => {
      const q = attrs.element as IBaseUiElement;
      const { formResults, setResult, index } = attrs;
      const title = replacePlaceholders(q.title, formResults, index, false);
      const matches = replaceInputs(title);
      const helperText = removeParagraphs(replacePlaceholders(q.description, formResults, index));
      const inputType = (type: InputType) => {
        switch (type) {
          case 'number':
            return NumberInput;
          case 'email':
            return EmailInput;
          case 'url':
            return UrlInput;
          case 'textarea':
            return TextArea;
          case 'color':
            return ColorInput;
          case 'date':
            return DatePicker;
          case 'time':
            return TimePicker;
          default:
            return TextInput;
        }
      };
      return matches.reduce(
        (p, v) => {
          const { id } = v;
          if (id) {
            const label = v.label || unCamelCase(id);
            const placeholder = q.data && q.data.placeholder ? removeParagraphs(q.data.placeholder) : undefined;
            const key = newId(q.id, id);
            const givenValue = q.data && q.data.hasOwnProperty(id) ? q.data[id] : undefined;
            const type = q.data
              ? q.data.type
                ? q.data.type
                : typeof givenValue === 'number'
                ? 'number'
                : 'text'
              : 'text';
            const result = getDirectAnswer(key, formResults, index);
            const initialValue = result ? result.value : givenValue;
            if (givenValue && (!result || result.value !== initialValue)) {
              setResult(key, initialValue, index || defaultIndex, { element: q });
              setTimeout(() => m.redraw(), 0);
            }
            const options: IInputOptions = {
              ...q.data,
              id,
              isMandatory: q.mandatory,
              label,
              placeholder,
              helperText,
              initialValue,
              // style: type === 'textarea' || type === 'url' ? '' : 'display: inline-block',
              onchange: value => setResult(key, value, index || defaultIndex, { element: q }),
            };
            p.push(m(inputType(type) as any, options));
          }
          return p;
        },
        [] as Vnode[]
      );
    },
  } as Component<IUiFormComponent>;
};
