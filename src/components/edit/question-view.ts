import {
  updateIndex,
  removeHtml,
  unCamelCase,
  parseIndex,
  defaultIndex,
  removeParagraphs
} from './../../utils/utils';
import m, { Component, Vnode } from 'mithril';
import {
  Question,
  IOption,
  ISelection,
  IBaseQuestion,
  InputType,
  IQuestionGroup
} from '../../models/specification/question';
import {
  InputCheckbox,
  InputRadios,
  inputText,
  IInputOptions,
  inputNumber,
  inputTextArea,
  inputColor,
  inputDate,
  mandatory,
  inputUrl,
  inputTime,
  inputEmail,
  Select
} from '../../utils/html';
import {
  replacePlaceholders,
  range,
  isVisible,
  setAnswer,
  getAnswer,
  getRepeat,
  newId,
  getDirectAnswer
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
    const description = q.description
      ? m.trust(replacePlaceholders(q.description, index))
      : undefined;
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
      const data = question.data || {};
      const index = attrs.index || defaultIndex;
      const options = question.options || [];
      const title =
        removeHtml(replacePlaceholders(question.title, index)) +
        (question.mandatory ? mandatory : '');
      const description = replacePlaceholders(question.description, index);
      const id = (option: Question) => newId(question.id, option.id);
      const questionIndex = parseIndex(index)[2];
      const clear = questionIndex === 0 && data.break ? '.clear' : '';
      return m(
        `.row${clear}`,
        m('.col.s12', [
          m('h3', { class: data.titleClass }, m.trust(title)),
          description ? m('p.description', m.trust(description)) : '',
          ...options.filter(o => isVisible(o, index)).map(o =>
            m(
              InputCheckbox({
                contentClass: data.contentClass,
                onchange: v => setAnswer(id(o), v, index, { question: o }),
                label: replacePlaceholders(o.title, index),
              }),
              { checked: getAnswer(id(o), index) as boolean | undefined }
            )
          ),
        ])
      );
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
      const title =
        removeHtml(replacePlaceholders(question.title, index)) +
        (question.mandatory ? mandatory : '');
      const description = replacePlaceholders(question.description, index);
      const id = (optionId: string | number) => newId(question.id, optionId);
      const checkedChoice = choices
        .filter(c => getAnswer(id(c.id), index))
        .shift();
      const onchange = (selectedId: string | number) => {
        choices.forEach(c => setAnswer(id(c.id), false, index));
        const selected = choices.filter(c => c.id === selectedId).shift();
        setAnswer(id(selectedId), true, index, { question: selected });
      };
      const questionIndex = parseIndex(index)[2];
      const isBreak = questionIndex === 0 && data.break;
      return data.type === 'select' ||
        (data.type !== 'radio' && choices.length > 4)
        ? m(
            Select({
              break: isBreak,
              label: title,
              contentClass: data.contentClass,
              onchange,
              options: choices.map(c => ({
                id: c.id,
                label: replacePlaceholders(c.title, index),
              })),
            }),
            { checkedId: checkedChoice ? checkedChoice.id : undefined }
          )
        : m(
            InputRadios({
              label: title,
              break: isBreak,
              contentClass: data.contentClass,
              onchange,
              radios: choices.map(c => ({
                id: c.id,
                label: replacePlaceholders(c.title, index),
              })),
            }),
            { checkedId: checkedChoice ? checkedChoice.id : undefined }
          );
    },
  } as Component<{ question: Question; index?: string }>);

/** Helper function that adds a mandatory symbol if required. */
const requireInput = (label: string, isMandatory = false) =>
  isMandatory ? label + mandatory : label;

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
      const inputType = (type: InputType, options: IInputOptions) => {
        switch (type) {
          case 'number':
            return inputNumber(options);
          case 'email':
            return inputEmail(options);
          case 'url':
            return inputUrl(options);
          case 'textarea':
            return inputTextArea(options);
          case 'color':
            return inputColor(options);
          case 'date':
            return inputDate(options);
          case 'time':
            return inputTime(options);
          default:
            return inputText(options);
        }
      };
      return matches.reduce(
        (p, v, i) => {
          const { id, label } = v;
          if (id) {
            const placeholder = unCamelCase(id);
            const key = newId(q.id, id);
            const givenValue =
              q.data && q.data.hasOwnProperty(id) ? q.data[id] : undefined;
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
              style:
                type === 'textarea' || type === 'url'
                  ? ''
                  : 'display: inline-block',
              onchange: value => setAnswer(key, value, index, { question: q }),
            };
            p.push(m(inputType(type, options)));
          }
          return p;
        },
        [] as Vnode[]
      );
    },
  } as Component<{ question: Question; index?: string }>;
};
