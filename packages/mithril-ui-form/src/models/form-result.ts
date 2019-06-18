/** The returned result when completing a form. */
export interface IFormResult {
  /** If the result was given by a preset, mark it as such, so we can replace it with another preset's value. */
  presetName?: string;
  /** The actual result */
  value: boolean | number | string;
}

export interface IFormResults { [id: string]: { [repeat: string]: IFormResult }; }
