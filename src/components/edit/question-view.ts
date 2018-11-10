import { updateIndex, removeHtml, unCamelCase, parseIndex, defaultIndex, removeParagraphs } from './../../utils/utils';
import m, { Component, Vnode } from 'mithril';
import {
  Question,
  IOption,
  ISelection,
  IBaseQuestion,
  InputType,
  IQuestionGroup,
} from '../../models/specification/question';
import {
  InputRadios,
  TextInput,
  IInputOptions,
  NumberInput,
  TextArea,
  ColorInput,
  mandatory,
  UrlInput,
  TimePicker,
  EmailInput,
  Select,
  Options,
  IInputOption,
  DatePicker,
} from '../../utils/html';
import {
  replacePlaceholders,
  range,
  isVisible,
  setAnswer,
  getAnswer,
  getRepeat,
  newId,
  getDirectAnswer,
} from '../../utils/utils';

const switchView = (question: Question) => {
  if (question.hasOwnProperty('options')) {
    return OptionsView;
  }
  if (question.hasOwnProperty('choices')) {
    return ChoicesView;
  }
  if (question.hasOwnProperty('questions')) {
    return QuestionsView;
  }
  return TemplateView;
};

/** Display one question */
export const QuestionView = () => {
  return {
    view: ({ attrs }) => {
      const { question } = attrs;
      if (!question.data) {
        question.data = {};
      }
      if (!question.data.contentClass) {
        question.data.contentClass = 'col s12';
      }
      const i = attrs.index || defaultIndex;
      const key = (index: string) => `${question.id}_${index}`;
      const v = switchView(question);
      const repeat = getRepeat(question, i) || 1;
      return repeat === 0
        ? undefined
        : repeat === 1
        ? isVisible(question, i)
          ? m(v, { question, index: i, key: key(i) })
          : undefined
        : range(0, repeat - 1)
            .map(x => updateIndex(i, x, 'question'))
            .map(index => m(v, { question, index, key: key(index) }));
    },
  } as Component<{ question: Question; index?: string }>;
};

/** Display multiple question */
const QuestionsView = (): Component<{
  question: Question;
  index?: string;
}> => ({
  view: ({ attrs }) => {
    const q = attrs.question as IQuestionGroup;
    const index = attrs.index;
    const questions = q.questions;
    const title = replacePlaceholders(q.title, index, false);
    const description = q.description ? m.trust(replacePlaceholders(q.description, index)) : undefined;
    return m('.row', [
      m(`h3.clear`, title),
      description ? m('#', description) : '',
      ...questions.map(question => m(QuestionView, { question, index })),
    ]);
  },
});

/**
 * Displays a question with several options
 */
const OptionsView = () =>
  ({
    view: ({ attrs }) => {
      const question = attrs.question as IOption;
      const createId = (option: Question) => newId(question.id, option.id);
      const data = question.data || {};
      const titleClass = data.titleClass;
      const contentClass = data.contentClass;
      const index = attrs.index || defaultIndex;
      const qOptions = question.options || [];
      const options = qOptions
        .filter(o => isVisible(o, index))
        .map(
          o =>
            ({
              id: createId(o),
              label: replacePlaceholders(o.title, index),
              isChecked: getAnswer(createId(o), index) ? true : false,
            } as IInputOption)
        );
      const label = removeHtml(replacePlaceholders(question.title, index)) + (question.mandatory ? mandatory : '');
      const description = replacePlaceholders(question.description, index);
      const questionIndex = parseIndex(index)[2];
      const newLine = questionIndex === 0 && data.newLine;
      const onchange = (v: boolean, id: string) =>
        setAnswer(id, v, index, { question: qOptions.filter(o => o.id === id).shift() });
      return m(Options, {
        label,
        contentClass,
        titleClass,
        options,
        description,
        onchange,
        newLine,
      });
    },
  } as Component<{ question: Question; index?: string }>);

/**
 * Displays a question with several options
 */
const ChoicesView = () =>
  ({
    view: ({ attrs }) => {
      const question = attrs.question as ISelection;
      const data = question.data || {};
      const index = attrs.index || defaultIndex;
      const choices = question.choices || [];
      const title = removeHtml(replacePlaceholders(question.title, index)) + (question.mandatory ? mandatory : '');
      const description = removeParagraphs(replacePlaceholders(question.description, index));
      const id = (optionId: string | number) => newId(question.id, optionId);
      const checkedChoice = choices.filter(c => getAnswer(id(c.id), index)).shift();
      const onchange = (selectedId: string | number) => {
        choices.forEach(c => setAnswer(id(c.id), false, index));
        const selected = choices.filter(c => c.id === selectedId).shift();
        setAnswer(id(selectedId), true, index, { question: selected });
      };
      const questionIndex = parseIndex(index)[2];
      const newLine = questionIndex === 0 && data.newLine;
      return data.type === 'select' || (data.type !== 'radio' && choices.length > 4)
        ? m(Select, {
            label: title,
            onchange,
            checkedId: checkedChoice ? checkedChoice.id : undefined,
            newLine,
            description,
            contentClass: data.contentClass,
            options: choices.map(c => ({
              id: c.id,
              label: replacePlaceholders(c.title, index),
            })),
          })
        : m(InputRadios, {
            label: title,
            onchange,
            newLine,
            description,
            contentClass: data.contentClass,
            radios: choices.map(c => ({
              id: c.id,
              label: replacePlaceholders(c.title, index),
            })),
            checkedId: checkedChoice ? checkedChoice.id : undefined,
          });
    },
  } as Component<{ question: Question; index?: string }>);

/** Helper function that adds a mandatory symbol if required. */
const requireInput = (label: string, isMandatory = false) => (isMandatory ? label + mandatory : label);

/**
 * Displays a question with a text box
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
      const q = attrs.question as IBaseQuestion;
      const index = attrs.index;
      const title = replacePlaceholders(q.title, index, false);
      const matches = replaceInputs(title);
      const description = replacePlaceholders(q.description, index);
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
            const placeholder = q.data && q.data.placeholder ? q.data.placeholder : undefined;
            const key = newId(q.id, id);
            const givenValue = q.data && q.data.hasOwnProperty(id) ? q.data[id] : undefined;
            const type = q.data
              ? q.data.type
                ? q.data.type
                : typeof givenValue === 'number'
                ? 'number'
                : 'text'
              : 'text';
            const answer = getDirectAnswer(key, index);
            const initialValue = answer ? answer.value : givenValue;
            if (givenValue && (!answer || answer.value !== initialValue)) {
              setAnswer(key, initialValue, index, { question: q });
              setTimeout(() => m.redraw(), 0);
            }
            const options: IInputOptions = {
              ...q.data,
              id,
              label: requireInput(label, q.mandatory),
              placeholder,
              helperText: removeParagraphs(description),
              initialValue,
              // style: type === 'textarea' || type === 'url' ? '' : 'display: inline-block',
              onchange: value => setAnswer(key, value, index, { question: q }),
            };
            p.push(m(inputType(type), options));
          }
          return p;
        },
        [] as Array<Vnode<IInputOptions>>
      );
    },
  } as Component<{ question: Question; index?: string }>;
};
