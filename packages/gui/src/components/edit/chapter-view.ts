import m, { Component } from 'mithril';
import { IChapter, IQuestionGroup } from '../../models/specification';
import {
  UiForm,
  range,
  updateIndex,
  replacePlaceholders,
  defaultIndex,
  isVisible,
  getRepeat,
  UiFormElement,
} from 'mithril-ui-form';
import { setResult, createKey } from '../../utils';
import { SectionView } from './section-view';
import { specSvc } from '../../services';

export const ChapterView = (): Component<{
  chapter: IChapter;
  index: string;
  canRepeat: boolean;
  key?: string;
}> => {
  return {
    onupdate: () => console.log(JSON.stringify(specSvc.answers, null, 2)),
    view: ({ attrs }) => {
      const { chapter, key } = attrs;
      const answers = specSvc.answers;
      const i = attrs.index || defaultIndex;
      const questions = chapter.questions || [];
      const sections = chapter.sections || [];
      const keyf = createKey(key || chapter.id);
      const repeat = attrs.canRepeat ? getRepeat(chapter, answers, i) : 1;
      if (repeat && repeat > 1) {
        return range(0, repeat - 1)
          .map(x => updateIndex(i, x, 'level1'))
          .filter(index => isVisible(chapter, answers, index))
          .map(index => m(ChapterView, { chapter, index, key: keyf(index), canRepeat: false }));
      }
      const title = replacePlaceholders(chapter.title, answers, i, false);
      const description = chapter.description ? replacePlaceholders(chapter.description, answers, i) : undefined;
      return repeat === 0
        ? undefined
        : m('.row.spectool-chapter',{ key: chapter.id }, [
            m(`h1[id=${chapter.id}]`, title),
            description ? m.trust(description) : '',
            ...questions
              .filter(q => isVisible(q, answers, i))
              .map(question => ({ ...question, elements: (question as IQuestionGroup).questions as UiFormElement[] }))
              .map(element =>
                m(UiForm, {
                  element,
                  formResults: answers,
                  setResult,
                  index: i,
                  key: keyf(element.id),
                })
              ),
            ...sections
              .filter(q => isVisible(q, answers, i))
              .map(section => m(SectionView, { section, index: i, canRepeat: true, key: keyf(section.id) })),
          ]);
    },
  };
};
