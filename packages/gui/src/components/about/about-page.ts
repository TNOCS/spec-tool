import m from 'mithril';
import { SpecificationInfo } from '../home/specification-info';

export const AboutPage = () => ({
  view: () =>
    m('.row', [
      m(SpecificationInfo),
      m('h1', 'Attribution'),
      m('ul.collection', [m('li.collection-item', 'Logo: ideation by Vytautas Alech from the Noun Project.')]),
    ]),
});
