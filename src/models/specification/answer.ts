export interface IAnswer {
  /** If the answer was given by a preset, mark it as such, so we can replace it with another preset's value. */
  presetName?: string;
  /** The given answer */
  value: boolean | number | string;
}
