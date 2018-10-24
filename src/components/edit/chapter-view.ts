import { removeHtml } from './../../utils/utils';
import m, { Component } from 'mithril';
import { IChapter } from '../../models/specification/specification';
import { QuestionView } from './question-view';
import {
  replacePlaceholders,
  defaultIndex,
  isVisible,
  getRepeat,
  range,
  updateIndex
} from '../../utils/utils';
import { SectionView } from './section-view';
import { specSvc } from '../../services/spec-service';

export const ChapterView = (): Component<{
  chapter: IChapter;
  index: string;
  canRepeat: boolean;
}> => {
  return {
    onupdate: () => console.log(JSON.stringify(specSvc.answers, null, 2)),
    view: ({ attrs }) => {
      const chapter = attrs.chapter;
      const i = attrs.index || defaultIndex;
      const questions = chapter.questions || [];
      const sections = chapter.sections || [];
      const repeat = attrs.canRepeat ? getRepeat(chapter, i) : 0;
      const title = removeHtml(replacePlaceholders(chapter.title, i));
      const description = chapter.description
        ? m.trust(replacePlaceholders(chapter.description, i))
        : '';
      return !repeat || repeat <= 1
        ? m('.row.spectool-chapter', [
            m(`h1[id=${chapter.id}]`, title),
            description ? m('#', description) : '',
            ...questions
              .filter(q => isVisible(q, i))
              .map(question => m(QuestionView, { question, index: i })),
            ...sections
              .filter(q => isVisible(q, i))
              .map(section =>
                m(SectionView, { section, index: i, canRepeat: true })
              ),
          ])
        : range(0, repeat - 1)
            .map(x => updateIndex(i, x, 'chapter'))
            .filter(index => isVisible(chapter, index))
            .map(index => m(ChapterView, { chapter, index, canRepeat: false }));
    },
  } as Component<{ chapter: IChapter; index: string; canRepeat: boolean }>;
};
