import { specificationCatalogue } from './specification-catalogue';
import spec from '../config/example.spec.json';
import {
  ISpecification,
  IChapter,
  ISection
} from '../models/specification/specification';
import { IAnswer } from '../models/specification/answer';
import {
  isVisible,
  defaultIndex,
  deepCopy,
  getDirectAnswer,
  newId,
  getRepeat,
  levelUp,
  range,
  createSubIndex,
  replacePlaceholders,
  markdown,
  checkPlaceholders
} from '../utils/utils';
import {
  Question,
  IOption,
  ISelection,
  IAnsweredQuestion
} from '../models/specification/question';
import { IDocumentInfo } from '../models/specification/document-info';
import { ITemplateDefinition } from '../models/specification/language-definition';

class SpecificationService {
  public answers!: { [id: string]: { [repeat: string]: IAnswer } };
  public introduction!: string;
  public chapters!: IChapter[];
  public specificationInfo!: IDocumentInfo;
  public templateInfo!: IDocumentInfo & ITemplateDefinition;
  public specTitle!: string;
  private specification!: ISpecification;

  public load(title: string, specification?: ISpecification) {
    if (title === this.specTitle) { return; }
    if (!specification) {
      const spec = specificationCatalogue.find(title);
      specification = spec ? spec.data : undefined;
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
        specificationCatalogue.add(title, JSON.parse((ev.target as any).result));
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
    const printQuestion = (q: IAnsweredQuestion) => {
      const group = [] as IAnsweredQuestion[];
      group.push(q);
      if (q.choices) {
        q.choices.forEach(c => group.push(c));
      }
      if (q.options) {
        q.options.forEach(o => group.push(o));
      }
      if (q.yes) {
        group.push(q.yes);
      }
      if (q.no) {
        group.push(q.no);
      }
      return group
        .map(i => replacePlaceholders(i.output, i.index, false))
        .join('\n');
    };
    const printSection = (s: ISection) => {
      const d = [] as string[];
      d.push(replacePlaceholders(s.output, s.index, false));
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
      d.push(replacePlaceholders(c.output, c.index, false));
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

  get report() {
    const docs = this.specs;
    const doc = docs instanceof Array ? docs.join('\n\n') : docs;
    console.log(doc);
    return markdown(doc);
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
    const repeat = getRepeat(chapter, index) || 0;
    const up = levelUp(index);
    const createIndex = (j: number) =>
      up === '' ? j.toString() : `${up}.${j}`;
    const pruned =
      repeat === 0
        ? ([pruneIndexedChapter(chapter, index)] as IChapter[])
        : range(0, repeat - 1)
            .map(createIndex)
            .reduce(
              (p, i) => {
                const prunedChapter = pruneIndexedChapter(
                  chapter,
                  createSubIndex(index, i)
                );
                return prunedChapter ? [...p, prunedChapter] : p;
              },
              [] as IChapter[]
            );
    return pruned.filter(p => p);
  }

  /** Keep all sections but only return the questions that have been answered */
  private pruneSection(section: ISection, index: string) {
    const pruneIndexedSection = (s: ISection, i: string) => {
      if (!isVisible(s) || !checkPlaceholders(s.output)) {
        return undefined;
      }
      const questions = this.pruneQuestions(section.questions, index);
      return questions.length
        ? ({ ...s, index, questions } as ISection)
        : undefined;
    };
    const repeat = getRepeat(section, index) || 0;
    const up = levelUp(index);
    const createIndex = (j: number) =>
      up === '' ? j.toString() : `${up}.${j}`;
    const pruned =
      repeat === 0
        ? ([pruneIndexedSection(section, index)] as ISection[])
        : range(0, repeat - 1)
            .map(createIndex)
            .reduce(
              (p, i) => {
                const prunedSection = pruneIndexedSection(
                  section,
                  createSubIndex(index, i)
                );
                return prunedSection ? [...p, prunedSection] : p;
              },
              [] as ISection[]
            );
    return pruned.filter(p => p);
  }

  /** Only return a clone of the questions that have been answered, optionally repeating them. */
  private pruneQuestion(question: Question, index: string) {
    const pruneIndexedQuestion = (q: Question, i: string) =>
      isVisible(q) && checkPlaceholders(q.output)
        ? this.cloneAnsweredQuestions(q, i)
        : undefined;
    const repeat = getRepeat(question, index) || 0;
    const up = levelUp(index);
    const createIndex = (j: number) =>
      up === '' ? j.toString() : `${up}.${j}`;
    const pruned =
      repeat === 0
        ? ([pruneIndexedQuestion(question, index)] as Question[])
        : range(0, repeat - 1)
            .map(createIndex)
            .reduce(
              (p, i) => {
                const prunedQuestion = pruneIndexedQuestion(
                  question,
                  createSubIndex(index, i)
                );
                return prunedQuestion ? [...p, prunedQuestion] : p;
              },
              [] as ISection[]
            );
    return pruned.filter(p => p);
  }

  private pruneQuestions(questions: Question[] | undefined, index: string) {
    return questions
      ? questions.reduce(
          (p, question) => {
            const prunedQuestions = this.pruneQuestion(question, index);
            return prunedQuestions.length > 0 ? [...p, ...prunedQuestions] : p;
          },
          [] as Question[]
        )
      : [];
  }

  private cloneAnsweredQuestions(
    q: Question,
    index: string
  ): IAnsweredQuestion | undefined {
    if (q.hasOwnProperty('choices')) {
      const selection = q as ISelection;
      const choices = selection.choices.reduce(
        (p, question) => {
          const answer = getDirectAnswer(newId(q.id, question.id), index);
          return answer ? [...p, { ...question, answer, index }] : p;
        },
        [] as IAnsweredQuestion[]
      );
      return choices.length > 0 ? { ...q, index, choices } : undefined;
    }
    if (q.hasOwnProperty('options')) {
      const option = q as IOption;
      const options = option.options.reduce(
        (p, question) => {
          const answer = getDirectAnswer(newId(q.id, question.id), index);
          return answer ? [...p, { ...question, index, answer }] : p;
        },
        [] as IAnsweredQuestion[]
      );
      return options.length > 0 ? { ...q, options } : undefined;
    }
    return { ...q, index, answer: undefined };
  }

  private init() {
    if (!this.specification) {
      return;
    }
    const spec = this.specification as ISpecification;
    this.answers = spec.answers || {};
    this.chapters = spec.chapters;
    this.introduction = spec.introduction
      ? spec.introduction instanceof Array
        ? spec.introduction.join('\n')
        : spec.introduction
      : ['# Welcome to SPECTOOL'].join('\n');
    this.templateInfo = this.defaultTemplateInfo(spec.templateInfo);
    this.specificationInfo = spec.specificationInfo || {};
    spec.specificationInfo = this.specificationInfo;
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
specSvc.load('Example', spec);
