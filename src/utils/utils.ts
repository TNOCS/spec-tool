import { IAnswer } from '../models/specification/answer';
import { Renderer, parse } from 'marked';
// import { AppState } from '../models/app-state';
import { Question } from '../models/specification/question';
import { specSvc } from '../services/spec-service';
import { storageSvc } from '../services/local-storage-service';

/**
 * Create a GUID
 * @see https://stackoverflow.com/a/2117523/319711
 *
 * @returns RFC4122 version 4 compliant GUID
 */
export const uuid4 = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    // tslint:disable-next-line:no-bitwise
    const r = (Math.random() * 16) | 0;
    // tslint:disable-next-line:no-bitwise
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

/**
 * Create a unique ID
 * @see https://stackoverflow.com/a/2117523/319711
 *
 * @returns RFC4122 version 4 compliant GUID
 */
export const uniqueId = () => {
  return 'idxxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, c => {
    // tslint:disable-next-line:no-bitwise
    const r = (Math.random() * 16) | 0;
    // tslint:disable-next-line:no-bitwise
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

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
export const range = (
  from: number,
  to: number,
  count: number = to - from + 1,
  step: number = 1
) => {
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
 * Deep copy function for TypeScript.
 * @param T Generic type of target/copied value.
 * @param target Target value to be copied.
 * @see Source project, ts-deepcopy https://github.com/ykdr2017/ts-deepcopy
 * @see Code pen https://codepen.io/erikvullings/pen/ejyBYg
 */
export const deepCopy = <T>(target: T): T => {
  if (target === null) {
    return target;
  }
  if (target instanceof Date) {
    return new Date(target.getTime()) as any;
  }
  if (target instanceof Array) {
    const cpy = [] as any[];
    (target as any[]).forEach(v => {
      cpy.push(v);
    });
    return cpy.map((n: any) => deepCopy<any>(n)) as any;
  }
  if (typeof target === 'object' && target !== {}) {
    const cpy = { ...(target as { [key: string]: any }) } as {
      [key: string]: any;
    };
    Object.keys(cpy).forEach(k => {
      cpy[k] = deepCopy<any>(cpy[k]);
    });
    return cpy as T;
  }
  return target;
};

/**
 * Function to filter case-insensitive title and description.
 * @param filterValue Filter text
 */
export const titleAndDescriptionFilter = (filterValue: string) => {
  filterValue = filterValue.toLowerCase();
  return (content: { title: string; description: string }) =>
    !filterValue ||
    !content.title ||
    content.title.toLowerCase().indexOf(filterValue) >= 0 ||
    (content.description &&
      content.description.toLowerCase().indexOf(filterValue) >= 0);
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

export const deepEqual = <T extends { [key: string]: any }>(
  x?: T,
  y?: T
): boolean => {
  const tx = typeof x;
  const ty = typeof y;
  return x && y && tx === 'object' && tx === ty
    ? Object.keys(x).length === Object.keys(y).length &&
        Object.keys(x).every(key => deepEqual(x[key], y[key]))
    : x === y;
};

// let i = 0;
// console.log(`${++i}: ${deepEqual([1, 2, 3], [1, 2, 3])}`);
// console.log(`${++i}: ${deepEqual([1, 2, 3], [1, 2, 3, 4])}`);
// console.log(`${++i}: ${deepEqual({ a: 'foo', b: 'bar' }, { a: 'foo', b: 'bar' })}`);
// console.log(`${++i}: ${deepEqual({ a: 'foo', b: 'bar' }, { b: 'bar', a: 'foo' })}`);

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

export const removeHtml = (s: string) =>
  s.replace(/<\/?[0-9a-zA-Z=\[\]_ \-"]+>/gm, '').replace(/&quot;/gi, '"');

/**
 * Every chapter, section and question can be repeated. The index keeps track of the
 * number of repeats, such that each answer is given a unique index.
 * INDEX = CHAPTER_REPEAT.SECTION_REPEAT.QUESTION_REPEAT
 */
export const defaultIndex = '0.0.0';

/** Parse the index and extract the chapter, section and question repeat count. */
export const parseIndex = (index: string): number[] =>
  index.split('.').map(i => +i);
/** Create a new index based on the number of repeats */
export const createIndex = (c: number, s: number, q: number) =>
  `${c}.${s}.${q}`;
/** Update an existing index */
export const updateIndex = (
  index: string,
  x: number,
  type: 'chapter' | 'section' | 'question'
) => {
  const [c, s, q] = parseIndex(index);
  switch (type) {
    case 'chapter':
      return createIndex(x, s, q);
    case 'section':
      return createIndex(c, x, q);
    case 'question':
      return createIndex(c, s, x);
  }
};

/** Get a new index, one level up for looking up answers (question -> section -> chapter) */
export const levelUpIndex = (index: string) => {
  const [c, s, q] = parseIndex(index);
  return q > 0 && s > 0
    ? createIndex(c, s - 1, 0)
    : c > 0
      ? createIndex(c - 1, 0, 0)
      : undefined;
};

/** For radio buttons, provide a means to clear an answer */
export const clearAnswer = (id: string, index = defaultIndex) => {
  const answers = specSvc.answers;
  if (answers.hasOwnProperty(id) && answers[id].hasOwnProperty(index)) {
    delete answers[id][index];
    if (!answers[id][index]) {
      delete answers[id];
    }
  }
};

const clearPresets = (presetName: string | undefined) => {
  if (!presetName) {
    return;
  }
  const answers = specSvc.answers;
  for (const a in answers) {
    if (!answers.hasOwnProperty(a)) {
      continue;
    }
    const answer = answers[a];
    for (const k in answer) {
      if (!answer.hasOwnProperty(k)) {
        continue;
      }
      if (answer[k].presetName === presetName) {
        delete answer[k];
        if (Object.keys(answer).length === 0) {
          delete answers[a];
        }
      }
    }
  }
};

/** Set an answer */
export const setAnswer = (
  id: string,
  value: boolean | string | number,
  index = defaultIndex,
  options?: {
    presetName?: string;
    question?: Question;
  }
) => {
  const answers = specSvc.answers;
  const presetName = options ? options.presetName : undefined;
  if (!answers.hasOwnProperty(id)) {
    answers[id] = {};
  }
  if (typeof value === 'string' && /^[0-9.]+$/.test(value)) {
    value = +value;
  } else if (
    typeof value === 'string' &&
    options &&
    options.question &&
    options.question.data &&
    options.question.data.type &&
    options.question.data.type === 'url'
  ) {
    value = /^https?:\/\//.test(value) ? value : `http://${value}`;
  }
  if (
    presetName &&
    answers[id].hasOwnProperty(index) &&
    !answers[id][index].presetName
  ) {
    return; // When using a preset, do not override answers already given.
  } else {
    answers[id][index] = (presetName
      ? { presetName, value }
      : { value }) as IAnswer;
    storageSvc.save();
  }
  if (
    options &&
    options.question &&
    options.question.data &&
    options.question.data &&
    options.question.data.presets
  ) {
    const presets = options.question.data.presets;
    const pn = id.split('.').shift();
    clearPresets(pn);
    presets.forEach(p =>
      setAnswer(p.id, typeof p.value === 'undefined' ? true : p.value, index, {
        presetName: pn,
      })
    );
  }
};

// /** Move the index a level up */
// export const levelUp = (i: string) =>
//   i
//     .split('.')
//     .filter((v, j, arr) => j < arr.length - 1)
//     .join('.');

/** Create the answer id by combining two id. */
export const newId = (id: string | number, subId?: string | number) =>
  subId ? `${id}.${subId}` : `${id}`;

/** Check if a single answer has been answered */
const checkSingleAnswer = (answer: IAnswer) => {
  const v = answer.value;
  return typeof v === 'boolean' ? v : typeof v === 'string' ? v !== '' : true;
};

/** Check whether this question, with the specific index, has been answered, and if so, return the answer. */
export const getDirectAnswer = (
  id: string,
  index = defaultIndex
): IAnswer | undefined => {
  const answers = specSvc.answers;
  return answers.hasOwnProperty(id) &&
    answers[id].hasOwnProperty(index) &&
    checkSingleAnswer(answers[id][index])
    ? answers[id][index]
    : undefined;
};

/** Get an answer */
export const getAnswer = (
  id: string,
  index = defaultIndex
): boolean | string | number | undefined => {
  const answers = specSvc.answers;
  if (!answers.hasOwnProperty(id)) {
    return undefined;
  }
  const find = (i = index): IAnswer | undefined => {
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
export const getRepeat = (question: Question, index = defaultIndex) => {
  const r = question.repeat;
  if (!r) {
    return undefined;
  }
  const answer = typeof r === 'number' ? r : getAnswer(r, index);
  return answer
    ? typeof answer === 'string'
      ? parseInt(answer, 10)
      : typeof answer === 'number'
        ? answer
        : 0
    : 0;
};

/**
 * Is the chapter, section or question visible, i.e. are all injected variables (&) provided,
 * and are all referenced (show) questions given.
 */
export const isVisible = (question: Question, index = defaultIndex) => {
  if (
    !checkPlaceholders(question.title, index) ||
    !checkPlaceholders(question.description, index)
  ) {
    return false;
  }
  if (!question.show) {
    return true;
  }
  const isSet = (a: any) =>
    typeof a === 'undefined'
      ? false
      : typeof a === 'boolean'
        ? a
        : typeof +a === 'number'
          ? +a !== 0
          : true;
  const checkAnswers = (ids: string) => {
    const ands = ids.split('&');
    return ands.length === 1
      ? isSet(getAnswer(ids.trim(), index))
      : ands.reduce((p, c) => p && isSet(getAnswer(c.trim(), index)), true);
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

/** Replace placeholders, as &name, with their value. */
export const replacePlaceholders = (
  txt: string | string[] | undefined,
  index = defaultIndex,
  toMarkdown = true
) => {
  if (!txt) {
    return '';
  }
  let s = txt instanceof Array ? txt.join('<br/>') : txt;
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
        const answer = getAnswer(match, index);
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
  return toMarkdown ? markdown(s) : s;
};

/** Check whether all placeholders can be replaced. */
export const checkPlaceholders = (
  txt: string | string[] | undefined,
  index = defaultIndex
) => {
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
        const answer = getAnswer(match, index);
        // const answer = answers.hasOwnProperty(match) ? answers[match][index] : undefined;
        if (!answer) {
          isComplete = false;
        }
      });
    }
  } while (rep !== null && isComplete);
  return isComplete;
};
