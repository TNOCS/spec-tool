import { ISpecification } from './../models/specification/specification';
import example from '../config/example.spec.json';
import bob from '../config/bob.spec.json';
import llf from '../config/llf.spec.json';
import repeat from '../config/repeat.spec.json';
// import vmg from '../config/vmg.spec.json';

const specs: Array<{ title: string; data: ISpecification }> = [
  // { title: 'VMG', data: vmg as ISpecification },
  { title: 'Example', data: example as ISpecification },
  { title: 'BOB', data: bob as ISpecification },
  { title: 'LLF', data: llf as ISpecification },
  { title: 'Repeat', data: repeat as ISpecification },
];

/** List of all the example specifications. Add one here if you want to show it on the home page. */
export const specificationCatalogue = {
  list: specs,
  default: specs[0],
  add: (title: string, data: ISpecification) => {
    const index = specs.reduce(
      (p, c, i) => (c.title.toLowerCase() === title.toLowerCase() ? i : p),
      -1
    );
    if (index >= 0) {
      specs[index].data = data;
    } else {
      specs.push({ title, data });
    }
  },
  find: (title: string) =>
    specs.filter(s => s.title.toLowerCase() === title.toLowerCase()).shift(),
};
