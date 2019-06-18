import { IFormResult, IFormResults } from '../models/form-result';
import { Renderer, parse } from 'marked';
import { UiFormElement } from '../models/ui-form';

const createMarkdownParser = () => {
  const renderer = new Renderer({
    gfm: true,
    tables: true,
    breaks: false,
    pedantic: false,
    sanitize: false,
    smartLists: true,
    smartypants: true,
    headerIds: false,
  });
  // renderer.paragraph = (text: string) => text; // to avoid wrapping each paragraph in a <p>text</p>
  renderer.list = (body: string, ordered: boolean) =>
    ordered ? `<ol>${body}</ol>` : `<ul class="browser-default">${body}</ul>`;
  return (s: string) => parse(s, { renderer });
};
export const markdown = createMarkdownParser();

export const toLetters = (num: number): string => {
  const mod = num % 26;
  // tslint:disable-next-line:no-bitwise
  let pow = (num / 26) | 0;
  const out = mod ? String.fromCharCode(64 + mod) : (--pow, 'Z');
  return pow ? toLetters(pow) + out : out;
};

/**
 * Generate a sequence of numbers between from and to with step size: [from, to].
 *
 * @static
 * @param {number} from
 * @param {number} to : inclusive
 * @param {number} [count=to-from+1]
 * @param {number} [step=1]
 * @returns
 */
export const range = (from: number, to: number, count: number = to - from + 1, step: number = 1) => {
  // See here: http://stackoverflow.com/questions/3746725/create-a-javascript-array-containing-1-n
  // let a = Array.apply(null, {length: n}).map(Function.call, Math.random);
  const a: number[] = new Array(count);
  const min = from;
  const max = to - (count - 1) * step;
  const theRange = max - min;
  const x0 = Math.round(from + theRange * Math.random());
  for (let i = 0; i < count; i++) {
    a[i] = x0 + i * step;
  }
  return a;
};

/**
 * Convert strings like XmlHTTPRequest to Xml HTTP Request
 * @see https://stackoverflow.com/a/6229124/319711
 */
export const unCamelCase = (str?: string) =>
  str
    ? str
        .replace(/([a-z])([A-Z])/g, '$1 $2') // insert a space between lower & upper
        .replace(/\b([A-Z]+)([A-Z])([a-z])/, '$1 $2$3') // space before last upper in a sequence followed by lower
        .replace(/^./, char => char.toUpperCase()) // uppercase the first character
    : '';

/** Remove paragraphs <p> and </p> and the beginning and end of a string. */
export const removeParagraphs = (s: string) => s.replace(/<\/?p>/g, '');

export const removeHtml = (s: string) => s.replace(/<\/?[0-9a-zA-Z=\[\]_ \-"]+>/gm, '').replace(/&quot;/gi, '"');

/**
 * Every chapter, section and question can be repeated. The index keeps track of the
 * number of repeats, such that each answer is given a unique index.
 * INDEX = CHAPTER_REPEAT.SECTION_REPEAT.QUESTION_REPEAT
 */
export const defaultIndex = '0.0.0';

/** Parse the index and extract the chapter, section and question repeat count. */
export const parseIndex = (index: string): number[] => index.split('.').map(i => +i);
/** Create a new index based on the number of repeats */
export const createIndex = (c: number, s: number, q: number) => `${c}.${s}.${q}`;
/** Update an existing index */
export const updateIndex = (index: string, x: number, type: 'level1' | 'level2' | 'level3') => {
  const [c, s, q] = parseIndex(index);
  switch (type) {
    case 'level1':
      return createIndex(x, s, q);
    case 'level2':
      return createIndex(c, x, q);
    case 'level3':
      return createIndex(c, s, x);
  }
};

/** Get a new index, one level up for looking up answers (question -> section -> chapter) */
export const levelUpIndex = (index: string) => {
  const [c, s, q] = parseIndex(index);
  return q > 0 && s > 0 ? createIndex(c, s - 1, 0) : c > 0 ? createIndex(c - 1, 0, 0) : undefined;
};

// /** Move the index a level up */
// export const levelUp = (i: string) =>
//   i
//     .split('.')
//     .filter((v, j, arr) => j < arr.length - 1)
//     .join('.');

/** Create the answer id by combining two id. */
export const newId = (id: string | number, subId?: string | number) => (subId ? `${id}.${subId}` : `${id}`);

/** Check if a single answer has been answered */
const checkSingleAnswer = (answer: IFormResult) => {
  const v = answer.value;
  return typeof v === 'boolean' ? v : typeof v === 'string' ? v !== '' : true;
};

/** Check whether this question, with the specific index, has been answered, and if so, return the answer. */
export const getDirectAnswer = (id: string, answers?: IFormResults, index = defaultIndex): IFormResult | undefined => {
  return answers &&
    answers.hasOwnProperty(id) &&
    answers[id].hasOwnProperty(index) &&
    checkSingleAnswer(answers[id][index])
    ? answers[id][index]
    : undefined;
};

/** Get an answer */
export const getAnswer = (
  id: string,
  answers?: IFormResults,
  index = defaultIndex
): boolean | string | number | undefined => {
  if (!answers || !answers.hasOwnProperty(id)) {
    return undefined;
  }
  const find = (i = index): IFormResult | undefined => {
    if (answers[id].hasOwnProperty(i)) {
      return answers[id][i];
    }
    const up = levelUpIndex(i);
    return up ? find(up) : undefined;
  };
  const answer = find();
  return answer ? answer.value : undefined;
};

/** Resolve the repeat value in case it is using a reference. */
export const getRepeat = (question: UiFormElement, answers?: IFormResults, index = defaultIndex) => {
  const r = question.repeat;
  if (!r) {
    return 1;
  }
  const answer = typeof r === 'number' ? r : getAnswer(r, answers, index);
  return answer ? (typeof answer === 'string' ? parseInt(answer, 10) : typeof answer === 'number' ? answer : 0) : 0;
};

/**
 * Is the chapter, section or question visible, i.e. are all injected variables (&) provided,
 * and are all referenced (show) questions given.
 */
export const isVisible = (
  question: UiFormElement,
  results?: IFormResults,
  index = defaultIndex,
  ignoreShow = false
) => {
  if (!checkPlaceholders(question.title, results, index) || !checkPlaceholders(question.description, results, index)) {
    return false;
  }
  if (ignoreShow || !question.show) {
    return true;
  }
  const isSet = (a: any) =>
    typeof a === 'undefined' ? false : typeof a === 'boolean' ? a : typeof +a === 'number' ? +a !== 0 : true;
  const checkAnswers = (ids: string) => {
    const ands = ids.split('&');
    return ands.length === 1
      ? isSet(getAnswer(ids.trim(), results, index))
      : ands.reduce((p, c) => p && isSet(getAnswer(c.trim(), results, index)), true);
  };
  const show = question.show instanceof Array ? question.show : [question.show];
  return show.some(v => checkAnswers(v));
};

const repeatRegex = /(\$chapterIndex)|(\$sectionIndex)|(\$questionIndex)/;

/**
 * Replace the $chapterIndex, $sectionIndex and $questionIndex with a number.
 * Same for $chapterIndexStr, $sectionIndexStr and $questionIndexStr with a letter.
 */
const replaceRepeatIndex = (index: string, str: string) => {
  if (!repeatRegex.test(str)) {
    return str;
  }
  const [c, s, q] = parseIndex(index);
  return str
    .replace(/\$chapterIndexStr/g, `${toLetters(c + 1)}`)
    .replace(/\$sectionIndexStr/g, `${toLetters(s + 1)}`)
    .replace(/\$questionIndexStr/g, `${toLetters(q + 1)}`)
    .replace(/\$chapterIndex/g, `${c + 1}`)
    .replace(/\$sectionIndex/g, `${s + 1}`)
    .replace(/\$questionIndex/g, `${q + 1}`);
};

const placeholderRegex = /&([a-zA-Z0-9_]+\.[a-zA-Z0-9_]+)/g;

/**
 * Replace placeholders, as &name, with their value.
 * @default: processMarkdown is true
 */
export const replacePlaceholders = (
  txt: string | string[] | undefined,
  results?: IFormResults,
  index = defaultIndex,
  processMarkdown = true
) => {
  if (!txt) {
    return '';
  }
  let s = txt instanceof Array ? txt.join('\n') : txt;
  s = replaceRepeatIndex(index, s);
  let rep: RegExpExecArray | null;
  const replacements: { [key: string]: string } = {};
  do {
    rep = placeholderRegex.exec(s);
    if (rep !== null) {
      if (rep.index === placeholderRegex.lastIndex) {
        placeholderRegex.lastIndex++;
      }

      // The result can be accessed through the `m`-variable.
      rep.forEach((match, groupIndex) => {
        if (groupIndex === 0) {
          return;
        }
        const answer = getAnswer(match, results, index);
        // const answer = answers.hasOwnProperty(match) ? answers[match][index] : undefined;
        if (answer && s) {
          replacements[`&${match}`] = `${answer}`;
        }
      });
    }
  } while (rep !== null);
  Object.keys(replacements).map(key => {
    s = s.replace(key, replacements[key]);
  });
  return processMarkdown ? markdown(s) : s;
};

/** Check whether all placeholders can be replaced. */
export const checkPlaceholders = (txt: string | string[] | undefined, answers?: IFormResults, index = defaultIndex) => {
  if (!txt) {
    return true;
  }
  const s = txt instanceof Array ? txt.join() : txt;
  let rep: RegExpExecArray | null;
  let isComplete = true;
  do {
    rep = placeholderRegex.exec(s);
    if (rep !== null) {
      if (rep.index === placeholderRegex.lastIndex) {
        placeholderRegex.lastIndex++;
      }

      // The result can be accessed through the `m`-variable.
      rep.forEach((match, groupIndex) => {
        if (groupIndex === 0) {
          return;
        }
        const answer = getAnswer(match, answers, index);
        // const answer = answers.hasOwnProperty(match) ? answers[match][index] : undefined;
        if (!answer) {
          isComplete = false;
        }
      });
    }
  } while (rep !== null && isComplete);
  return isComplete;
};
