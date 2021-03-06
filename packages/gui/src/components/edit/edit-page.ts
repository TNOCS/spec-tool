import m, { Component } from 'mithril';
import { IChapter } from './../../models/specification/specification';
import { specSvc } from '../../services/spec-service';
import { ChapterView } from './chapter-view';
import { removeHtml, defaultIndex, isVisible, replacePlaceholders } from 'mithril-ui-form';
import { NextPrevPage } from '../ui/next-prev-page';

export const EditPage = () => {
  const createLink = (c: IChapter) =>
    `#!/${specSvc.specTitle}/${specSvc.templateInfo.edit.label.toLowerCase()}/${
      c.id
    }`;
  return {
    view: () => {
      const id = m.route.param('id');
      const chapters = specSvc.chapters;
      const selectedChapters = chapters
        .filter(chapter => isVisible(chapter))
        .filter(chapter => !id || chapter.id === id);
      const prevChapterIdx =
        id && selectedChapters.length > 0
          ? chapters.indexOf(selectedChapters[0]) - 1
          : -1;
      const prevChapter =
        prevChapterIdx >= 0 ? chapters[prevChapterIdx] : undefined;
      const nextChapterIdx =
        id && selectedChapters.length > 0
          ? chapters.indexOf(selectedChapters[0]) + 1
          : -1;
      const nextChapter =
        nextChapterIdx < chapters.length ? chapters[nextChapterIdx] : undefined;
      const next = nextChapter
        ? {
            isNext: true,
            title: removeHtml(replacePlaceholders(nextChapter.title)),
            link: createLink(nextChapter),
          }
        : undefined;
      const prev = prevChapter
        ? {
            isNext: false,
            title: removeHtml(replacePlaceholders(prevChapter.title)),
            link: createLink(prevChapter),
          }
        : undefined;

      return m('.edit-page', [
        ...selectedChapters.map(chapter =>
          m(ChapterView, { chapter, index: defaultIndex, canRepeat: true, key: chapter.id })
        ),
        next || prev ? m(NextPrevPage, { next, prev }) : undefined,
      ]);
    },
  } as Component;
};
