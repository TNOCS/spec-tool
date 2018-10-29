import { updateIndex, removeHtml } from './../../utils/utils';
import m, { Component, Vnode } from 'mithril';
import {
  Question,
  IOption,
  ISelection,
  IBaseQuestion,
  InputType
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
  defaultIndex,
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
  return TemplateView;
};

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
          ? isVisible(question)
            ? m(v, { question, index: i, key: key(i) })
            : undefined
          : range(0, repeat - 1)
              .map(x => updateIndex(i, x, 'question'))
              .map(index => m(v, { question, index, key: key(index) }));
    },
  } as Component<{ question: Question; index?: string }>;
};

/**
 * Displays a question with several options
 */
const OptionsView = () =>
  ({
    view: ({ attrs }) => {
      const question = attrs.question as IOption;
      const data = question.data || {};
      const index = attrs.index;
      const options = question.options || [];
      const title =
        removeHtml(replacePlaceholders(question.title, index)) +
        (question.mandatory ? mandatory : '');
      const description = replacePlaceholders(question.description, index);
      const id = (option: Question) => newId(question.id, option.id);
      return m('.row', [
        m('h3', m.trust(title)),
        description ? m('p.description', m.trust(description)) : '',
        ...options.filter(o => isVisible(o, index)).map(o =>
          m(
            InputCheckbox({
              classNames: data.classNames,
              onchange: v => setAnswer(id(o), v, index, { question: o }),
              label: replacePlaceholders(o.title, index),
            }),
            { checked: getAnswer(id(o), index) as boolean | undefined }
          )
        ),
      ]);
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
      const index = attrs.index;
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
      return data.type === 'select' ||
        (data.type !== 'radio' && choices.length > 4)
        ? m(
            Select({
              label: title,
              classNames: data.classNames,
              onchange,
              options: choices.map(c => ({
                id: c.id,
                label: replacePlaceholders(c.title, index),
              })),
            }),
            { checkedId: checkedChoice ? checkedChoice.id : undefined }
          )
        : m('div', [
            m('h3', m.trust(title)),
            description ? m('p.description', m.trust(description)) : '',
            m(
              InputRadios({
                classNames: data.classNames,
                onchange,
                radios: choices.map(c => ({
                  id: c.id,
                  label: replacePlaceholders(c.title, index),
                })),
              }),
              { checkedId: checkedChoice ? checkedChoice.id : undefined }
            ),
          ]);
    },
  } as Component<{ question: Question; index?: string }>);

/**
 * Displays a question with a text box
 */
const TemplateView = () => {
  const replaceInputs = (title: string) => {
    const inputsRegex = /_([a-zA-Z0-9]+)_/g;
    let r: RegExpExecArray | null;
    let i = 0;
    const matches: Array<{ fragment: string; key?: string }> = [];
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
            matches.push({ fragment: title.substr(0, k) });
            matches.push({
              fragment: title.substr(k + 1, j - k - 1),
              key: match,
            });
          } else {
            matches.push({ fragment: title.substr(i, j - i), key: match });
          }
          i = j + fullMatch.length;
        });
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
      return m('div', [
        matches.reduce(
          (p, v, i) => {
            p.push(
              m(
                i === 0 ? 'h3' : 'span',
                m.trust(v.fragment + (i === 0 && q.mandatory ? mandatory : ''))
              )
            );
            if (i === 0 && description) {
              p.push(m('p.description', m.trust(description)));
            }
            const label = v.key;
            if (label) {
              const key = newId(q.id, label);
              const givenValue =
                q.data && q.data.hasOwnProperty(label)
                  ? q.data[label]
                  : undefined;
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
                id: label,
                label,
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
        ),
      ]);
    },
  } as Component<{ question: Question; index?: string }>;
};
