import m, { Component } from 'mithril';
import { ISection } from '../../models/specification/specification';
import { QuestionView } from './question-view';
import {
  replacePlaceholders,
  isVisible,
  defaultIndex,
  getRepeat,
  range,
  updateIndex
} from '../../utils/utils';

export const SectionView = (): Component<{
  section: ISection;
  index: string;
  canRepeat: boolean;
}> => {
  return {
    // onupdate: () => console.log(JSON.stringify(specSvc.answers, null, 2)),
    view: ({ attrs }) => {
      const section = attrs.section;
      const i = attrs.index || defaultIndex;
      const key = (index: string) => `${section.id}_${index}`;
      const repeat = attrs.canRepeat ? getRepeat(section, i) : 1;
      if (repeat && repeat > 1) {
        return range(0, repeat - 1)
          .map(x => updateIndex(i, x, 'section'))
          .filter(index => isVisible(section, index))
          .map(index =>
            m(SectionView, {
              section,
              index,
              canRepeat: false,
              key: key(index),
            })
          );
      }
      const questions = section.questions || [];
      const title = replacePlaceholders(section.title, i, false);
      const description = section.description
        ? m.trust(replacePlaceholders(section.description, i))
        : undefined;
      return repeat === 0
        ? undefined
        : m('.row.spectool-section.clear', [
            m(`h2[id=${section.id}]`, title),
            description ? m('#', description) : '',
            ...questions
              .filter(q => isVisible(q, i))
              // .map(q => {
              //   console.log(`${i}: ${q.title}`);
              //   return q;
              // })
              .map(question =>
                m(QuestionView, { question, index: i, key: key(i) })
              ),
          ]);
    },
  };
};
