import m from 'mithril';
import { specSvc } from '../../services/spec-service';

export const SpecPage = () => ({
  view: () =>
    m('.row', [
      m('h5', 'Spec'),
      m('span', m.trust(specSvc.report)),
    ]),
});
