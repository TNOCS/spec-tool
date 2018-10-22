import { updateIndex } from './../../utils/utils';
import m, { Component, Vnode } from 'mithril';
import {
  Question,
  IOption,
  ISelection,
  IBaseQuestion
} from '../../models/specification/question';
import {
  InputCheckbox,
  InputRadios,
  inputText,
  IInputOptions,
  inputNumber,
  inputTextArea
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
      const question = attrs.question;
      const i = attrs.index || defaultIndex;
      const v = switchView(question);
      const repeat = getRepeat(question, i) || 1;
      return repeat === 0
        ? undefined
        : repeat === 1
          ? isVisible(question)
            ? m(v, { question, index: i })
            : undefined
          : range(0, repeat - 1)
              .map(x => updateIndex(i, x, 'question'))
              .map(index => m(v, { question, index }));
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
      const index = attrs.index;
      const options = question.options || [];
      const title = replacePlaceholders(question.title, index);
      const description = replacePlaceholders(question.description, index);
      const id = (option: Question) => newId(question.id, option.id);
      return m('form.row', [
        m('h3', m.trust(title)),
        description ? m('p.description', m.trust(description)) : '',
        ...options.filter(o => isVisible(o, index)).map(o =>
          m(
            InputCheckbox({
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
      const index = attrs.index;
      const choices = question.choices || [];
      const title = replacePlaceholders(question.title, index);
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
      return m('form.row', [
        m('h3', m.trust(title)),
        description ? m('p.description', m.trust(description)) : '',
        m(
          InputRadios({
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

        // The result can be accessed through the `m`-variable.
        r.forEach((match, groupIndex) => {
          if (groupIndex === 0) {
            return;
          }
          const fullMatch = `_${match}_`;
          const j = title.indexOf(fullMatch);
          const k = matches.length > 0 ? j : title.indexOf('\n');
          if (k < j && k > 0) {
            // Title contains a newline character
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
      return m('div', [
        m(
          'p',
          matches.reduce(
            (p, v, i) => {
              p.push(m(i === 0 ? 'h3' : 'span', m.trust(v.fragment)));
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
                  setAnswer(key, initialValue, index);
                  setTimeout(() => m.redraw(), 0);
                }
                const options: IInputOptions = {
                  id: label,
                  label,
                  initialValue,
                  style: type === 'textarea' ? '' : 'display: inline-block',
                  onchange: value => setAnswer(key, value, index),
                };
                p.push(
                  m(
                    type === 'number'
                      ? inputNumber(options)
                      : type === 'textarea'
                        ? inputTextArea(options)
                        : inputText(options)
                  )
                );
              }
              return p;
            },
            [] as Vnode[]
          )
        ),
        description ? m('p.description', m.trust(description)) : '',
      ]);
    },
  } as Component<{ question: Question; index?: string }>;
};
