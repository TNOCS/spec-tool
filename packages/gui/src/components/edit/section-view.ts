import m, { Component } from 'mithril';
import { ISection, IQuestionGroup } from '../../models/specification';
import { UiForm, range, updateIndex, replacePlaceholders, defaultIndex, isVisible, getRepeat } from 'mithril-ui-form';
import { setResult, createKey } from '../../utils';
import { specSvc } from '../../services';

export const SectionView = (): Component<{
  section: ISection;
  index: string;
  canRepeat: boolean;
  key?: string;
}> => {
  return {
    // onupdate: () => console.log(JSON.stringify(specSvc.answers, null, 2)),
    view: ({ attrs }) => {
      const { section, key } = attrs;
      const answers = specSvc.answers;
      const i = attrs.index || defaultIndex;
      const repeat = attrs.canRepeat ? getRepeat(section, answers, i) : 1;
      const keyf = createKey(key || section.id);
      if (repeat && repeat > 1) {
        return range(0, repeat - 1)
          .map(x => updateIndex(i, x, 'level2'))
          .filter(index => isVisible(section, answers, index))
          .map(index =>
            m(SectionView, {
              section,
              index,
              canRepeat: false,
              key: keyf(index),
            })
          );
      }
      const questions = section.questions || [];
      const title = replacePlaceholders(section.title, answers, i, false);
      const description = section.description ? replacePlaceholders(section.description, answers, i) : undefined;
      return repeat === 0
        ? undefined
        : m('.row.spectool-section.clear', [
            m(`h2[id=${section.id}]`, title),
            description ? m.trust(description) : '',
            ...questions
              .filter(q => isVisible(q, answers, i))
              .map(question => ({ ...question, elements: (question as IQuestionGroup).questions }))
              .map(element => m(UiForm, { element, formResults: answers, setResult, index: i, key: keyf(i) })),
          ]);
    },
  };
};
