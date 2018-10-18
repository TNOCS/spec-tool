import m, { Component } from 'mithril';
import { ISection } from '../../models/specification/specification';
import { QuestionView } from './question-view';
import {
  replacePlaceholders,
  isVisible,
  defaultIndex,
  getRepeat,
  range,
  levelUp,
  createSubIndex,
} from '../../utils/utils';
import { specSvc } from '../../services/spec-service';

export const SectionView = (): Component<{ section: ISection; index: string; canRepeat: boolean }> => {
  return {
    onupdate: () => console.log(JSON.stringify(specSvc.answers, null, 2)),
    view: ({ attrs }) => {
      const section = attrs.section;
      const i = attrs.index || defaultIndex;
      const questions = section.questions || [];
      const repeat = attrs.canRepeat ? getRepeat(section, i) : 0;
      const up = levelUp(i);
      const createIndex = (j: number) => (up === '' ? j.toString() : `${up}.${j}`);
      const title = m.trust(replacePlaceholders(section.title, i));
      const description = section.description ? m.trust(replacePlaceholders(section.description, i)) : '';
      return !repeat || repeat <= 1
        ? m('.row', [
            m(`h2[id=${section.id}]`, title),
            description ? m('p.section', description) : '',
            ...questions.filter(q => isVisible(q, i)).map(question => m(QuestionView, { question, index: i })),
          ])
        : range(0, repeat - 1)
            .map(createIndex)
            .filter(index => isVisible(section, index))
            .map(index => m(SectionView, { section, index: createSubIndex(index, i), canRepeat: false }));
    },
  } as Component<{ section: ISection; index: string; canRepeat: boolean }>;
};
