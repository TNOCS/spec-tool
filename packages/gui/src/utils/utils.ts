import { IFormResult, UiFormElement, defaultIndex } from 'mithril-ui-form';
import { specSvc } from '../services/spec-service';
import { storageSvc } from '../services/local-storage-service';

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

/** Remove paragraphs <p> and </p> and the beginning and end of a string. */
export const removeParagraphs = (s: string) => s.replace(/<\/?p>/g, '');

export const removeHtml = (s: string) =>
  s.replace(/<\/?[0-9a-zA-Z=\[\]_ \-"]+>/gm, '').replace(/&quot;/gi, '"');

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
export const setResult = (
  id: string,
  value: boolean | string | number | Date,
  index = defaultIndex,
  options?: {
    presetName?: string;
    element?: UiFormElement;
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
    options.element &&
    options.element.data &&
    options.element.data.type &&
    options.element.data.type === 'url'
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
      : { value }) as IFormResult;
    storageSvc.save();
  }
  if (
    options &&
    options.element &&
    options.element.data &&
    options.element.data &&
    options.element.data.presets
  ) {
    const presets = options.element.data.presets;
    const pn = id.split('.').shift();
    clearPresets(pn);
    presets.forEach(p =>
      setResult(p.id, typeof p.value === 'undefined' ? true : p.value, index, {
        presetName: pn,
      })
    );
  }
};

export const createKey = (key: string) => (key2: string) =>
  `${key}.${key2}`;
