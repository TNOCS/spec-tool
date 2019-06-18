import { deepCopy } from '../utils';
import { specificationCatalogue } from './specification-catalogue';
import {
  ISpecification,
  IChapter,
  ISection
} from '../models/specification/specification';
import {
  checkPlaceholders,
  isVisible,
  defaultIndex,
  getDirectAnswer,
  newId,
  getRepeat,
  range,
  replacePlaceholders,
  markdown,
  updateIndex,
  UiFormElement,
  IOption,
  ISelection,
  ICompletedUiForm,
  IUiElementGroup,
  IFormResult,
} from 'mithril-ui-form';

import { IDocumentInfo } from '../models/specification/document-info';
import { ITemplateDefinition } from '../models/specification/language-definition';
import { storageSvc } from './local-storage-service';

class SpecificationService {
  public answers!: { [id: string]: { [repeat: string]: IFormResult } };
  public introduction!: string;
  public chapters!: IChapter[];
  public specificationInfo!: IDocumentInfo;
  public templateInfo!: IDocumentInfo & ITemplateDefinition;
  public specTitle!: string;
  private specification!: ISpecification;

  /** Load a specification, either by name or from the supplied data. */
  public load(title: string, specification?: ISpecification) {
    if (title === this.specTitle) {
      return;
    }
    if (!specification) {
      const s = specificationCatalogue.find(title);
      specification = s ? s.data : undefined;
    }
    this.specTitle = specification
      ? title.toLowerCase().replace('.spec.json', '')
      : specificationCatalogue.default.title;
    this.specification = specification
      ? specification
      : specificationCatalogue.default.data;
    this.init();
  }

  public loadSpecification(specFile: File, cb: (err?: Error) => void) {
    if (!specFile) {
      return;
    }
    const reader = new FileReader();
    reader.onload = async (ev: ProgressEvent) => {
      if (ev.target) {
        const title = specFile.name.replace(/\.spec\.json/gi, '');
        specificationCatalogue.add(
          title,
          JSON.parse((ev.target as any).result)
        );
        this.load(title);
        cb();
      }
    };
    reader.onerror = () => cb(new Error('Error loading file!'));
    reader.readAsText(specFile);
  }

  public get json() {
    return deepCopy({
      ...this.specification,
      ...this.answers,
    });
  }

  public get specs() {
    const chapters = this.chapters.reduce(
      (p, chapter) => {
        const prunedChapters = this.pruneChapter(chapter, defaultIndex);
        return prunedChapters.length > 0 ? [...p, ...prunedChapters] : p;
      },
      [] as IChapter[]
    );
    const printQuestion = (q: ICompletedUiForm) => {
      const getQuestions = (cf: ICompletedUiForm) => {
        const group = [] as ICompletedUiForm[];
        group.push(cf);
        if (cf.choices) {
          cf.choices.forEach(c => group.push(c));
        }
        if (cf.options) {
          cf.options.forEach(o => group.push(o));
        }
        if (cf.elements) {
          cf.elements.forEach(o => group.push(...getQuestions(o)));
        }
        return group;
      };
      const allQuestions = getQuestions(q);
      return allQuestions
        .map(i => replacePlaceholders(i.output, this.answers, i.index, false))
        .filter(s => s)
        .join('\n');
    };
    const printSection = (s: ISection) => {
      const d = [] as string[];
      d.push(replacePlaceholders(s.output, this.answers, s.index, false));
      if (s.questions) {
        const docs = s.questions.reduce(
          (p, q) => [...p, printQuestion(q)],
          [] as string[]
        );
        d.push(...docs);
      }
      return d;
    };
    const printChapter = (c: IChapter) => {
      const d = [] as string[];
      d.push(replacePlaceholders(c.output, this.answers, c.index, false));
      if (c.questions) {
        const docs = c.questions.reduce(
          (p, q) => [...p, printQuestion(q)],
          [] as string[]
        );
        d.push(...docs);
      }
      if (c.sections) {
        const docs = c.sections.reduce(
          (p, s) => [...p, ...printSection(s)],
          [] as string[]
        );
        d.push(...docs);
      }
      return d;
    };
    const doc = chapters
      .reduce((p, chapter) => [...p, ...printChapter(chapter)], [] as string[])
      .filter(s => s);
    return doc.length > 0 ? doc : this.templateInfo.emptySpecMessage;
  }

  public get report() {
    const breakHeaders = (d: string, i: number) =>
      i > 0 && /#/.test(d) ? `\n${d}` : d;
    const docs = this.specs;
    const doc = docs instanceof Array ? docs.map(breakHeaders).join('\n') : docs;
    // console.log(doc);
    return doc ? markdown(doc) : '';
  }

  /** Return zero (when no questions are answered) or more (when repeated) chapters. */
  private pruneChapter(chapter: IChapter, index: string) {
    const pruneIndexedChapter = (c: IChapter, i: string) => {
      if (!isVisible(c) || !checkPlaceholders(c.output)) {
        return undefined;
      }
      const questions = this.pruneQuestions(chapter.questions, index);
      const sections = c.sections
        ? c.sections.reduce(
            (p, section) => {
              const prunedSections = this.pruneSection(section, i);
              return prunedSections.length > 0 ? [...p, ...prunedSections] : p;
            },
            [] as ISection[]
          )
        : [];
      return questions.length || sections.length
        ? ({ ...c, index, sections, questions } as IChapter)
        : undefined;
    };
    const repeat = getRepeat(chapter, this.answers, index) || 0;
    const pruned =
      repeat === 0
        ? ([pruneIndexedChapter(chapter, index)] as IChapter[])
        : range(0, repeat - 1)
            .map(x => updateIndex(index, x, 'level1'))
            .reduce(
              (p, i) => {
                const prunedChapter = pruneIndexedChapter(chapter, i);
                return prunedChapter ? [...p, prunedChapter] : p;
              },
              [] as IChapter[]
            );
    return pruned.filter(p => p);
  }

  /** Keep all sections but only return the questions that have been answered */
  private pruneSection(section: ISection, index: string) {
    const pruneIndexedSection = (s: ISection, i: string) => {
      if (!isVisible(s, this.answers, i) || !checkPlaceholders(s.output, this.answers, i)) {
        return undefined;
      }
      const questions = this.pruneQuestions(section.questions, i);
      return questions.length
        ? ({ ...s, index: i, questions } as ISection)
        : undefined;
    };
    const repeat = getRepeat(section, this.answers, index) || 0;
    const pruned =
      repeat === 0
        ? ([pruneIndexedSection(section, index)] as ISection[])
        : range(0, repeat - 1)
            .map(x => updateIndex(index, x, 'level2'))
            .reduce(
              (p, i) => {
                const prunedSection = pruneIndexedSection(section, i);
                return prunedSection ? [...p, prunedSection] : p;
              },
              [] as ISection[]
            );
    return pruned.filter(p => p);
  }

  /** Only return a clone of the questions that have been answered, optionally repeating them. */
  private pruneQuestion(question: UiFormElement, index: string, ignoreShow = false) {
    const pruneIndexedQuestion = (q: UiFormElement, i: string) =>
      isVisible(q, this.answers, i, ignoreShow) && checkPlaceholders(q.output, this.answers, i)
        ? this.cloneAnsweredQuestions(q, i)
        : undefined;
    const repeat = getRepeat(question, this.answers, index) || 0;
    const pruned =
      repeat === 0 || typeof repeat === 'undefined'
        ? ([pruneIndexedQuestion(question, index)] as UiFormElement[])
        : range(0, repeat - 1)
            .map(x => updateIndex(index, x, 'level3'))
            .reduce(
              (p, i) => {
                const prunedQuestion = pruneIndexedQuestion(question, i);
                return prunedQuestion ? [...p, prunedQuestion] : p;
              },
              [] as UiFormElement[]
            );
    return pruned.filter(p => p);
  }

  private pruneQuestions(questions: UiFormElement[] | undefined, index: string) {
    return questions
      ? questions.reduce(
          (p, question) => {
            const prunedQuestions = this.pruneQuestion(question, index, true);
            return prunedQuestions.length > 0 ? [...p, ...prunedQuestions] : p;
          },
          [] as UiFormElement[]
        )
      : [];
  }

  private cloneAnsweredQuestions(
    q: UiFormElement,
    index: string
  ): ICompletedUiForm | undefined {
    if (q.hasOwnProperty('choices')) {
      const selection = q as ISelection;
      const choices = selection.choices.reduce(
        (p, question) => {
          const answer = getDirectAnswer(newId(q.id, question.id), this.answers, index);
          return answer ? [...p, { ...question, answer, index }] : p;
        },
        [] as ICompletedUiForm[]
      );
      return choices.length > 0 ? { ...q, index, choices } : undefined;
    }
    if (q.hasOwnProperty('options')) {
      const option = q as IOption;
      const options = option.options.reduce(
        (p, question) => {
          const answer = getDirectAnswer(newId(q.id, question.id), this.answers, index);
          return answer ? [...p, { ...question, index, answer }] : p;
        },
        [] as ICompletedUiForm[]
      );
      return options.length > 0 ? { ...q, index, options } : undefined;
    }
    if (q.hasOwnProperty('elements')) {
      const group = q as IUiElementGroup;
      const elements = group.elements
        .filter(
          question =>
            isVisible(question, this.answers, index) &&
            checkPlaceholders(question.output, this.answers, index)
        )
        .reduce(
          (p, question) => {
            const answer = this.cloneAnsweredQuestions(question, index);
            return answer ? [...p, answer] : p;
          },
          [] as ICompletedUiForm[]
        );
      return elements.length > 0 ? { ...q, index, elements } : undefined;
    }
    return { ...q, index, answer: undefined };
  }

  private init() {
    if (!this.specification) {
      return;
    }
    const specification = this.specification as ISpecification;
    this.answers = specification.results || storageSvc.load();
    this.chapters = specification.chapters;
    this.introduction = specification.introduction
      ? specification.introduction instanceof Array
        ? specification.introduction.join('\n')
        : specification.introduction
      : ['# Welcome to SPECTOOL'].join('\n');
    this.templateInfo = this.defaultTemplateInfo(specification.templateInfo);
    this.specificationInfo = specification.specificationInfo || {};
    specification.specificationInfo = this.specificationInfo;
  }

  private defaultTemplateInfo(
    ti?: IDocumentInfo & Partial<ITemplateDefinition>
  ) {
    return Object.assign(
      {
        and: 'and',
        tableOfContent: 'Table of Content',
        author: 'Unknown',
        home: {
          label: 'Home',
          icon: 'home',
        },
        edit: {
          label: 'Edit',
          icon: 'create',
        },
        spec: {
          label: 'Spec',
          icon: 'import_contacts',
        },

        about: {
          label: 'About',
          icon: 'info_outline',
        },
        downloadJsonFilename: 'spectool.spec.json',
        downloadJsonLabel: 'JSON',
        downloadMarkdownFilename: 'spectool.spec.md',
        downloadMarkdownLabel: 'DOC',
        deleteLocalStorageLabel: 'CLEAR',
        uploadTemplateLabel: 'Upload',
        uploadTooltipLabel: 'Drop or upload a specification file.',
        emptySpecMessage: '-- PLEASE ANSWER THE QUESTIONS FIRST --',
        docInfoTitle: 'Document info',
        authorLabel: 'Author',
        releaseLabel: 'Release info',
        versionLabel: 'Version',
        createdLabel: 'Created',
        updatedLabel: 'Updated',
        nextLabel: 'Next',
        prevLabel: 'Previous',
      } as IDocumentInfo & ITemplateDefinition,
      ti
    );
  }
}

export const specSvc = new SpecificationService();
specSvc.load(
  specificationCatalogue.default.title,
  specificationCatalogue.default.data
);
