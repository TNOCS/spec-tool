import m from 'mithril';
import { TextInput, TextArea } from './../../utils/html';
import { specSvc } from '../../services/spec-service';

export const SpecificationInfo = () => ({
  view: () => {
    const ti = specSvc.templateInfo;
    const info = specSvc.specificationInfo;
    return m('.row', [
      m('h1', ti.docInfoTitle),
      m(TextInput, {
        id: 'author',
        label: ti.authorLabel,
        iconName: 'account_circle',
        contentClass: 'col s12',
        initialValue: info.author,
        onchange: (v: string | number | boolean | Date) => (info.author = v.toString()),
      }),
      m(TextInput, {
        id: 'version',
        label: ti.versionLabel,
        iconName: 'label',
        contentClass: 'col s12',
        initialValue: info.version,
        onchange: (v: string | number | boolean | Date) => (info.version = v.toString()),
      }),
      m(TextArea, {
        id: 'release',
        label: ti.releaseLabel,
        iconName: 'new_releases',
        contentClass: 'col s12',
        initialValue: info.releaseInfo,
        onchange: (v: string | number | boolean | Date) => (info.releaseInfo = v.toString()),
      }),
      m(TextInput, {
        id: 'updated',
        label: ti.updatedLabel,
        iconName: 'event_available',
        contentClass: 'col s6',
        disabled: true,
        initialValue: info.updated ? info.updated.toLocaleDateString() : new Date().toLocaleDateString(),
        onchange: () => null,
      }),
      m(TextInput, {
        id: 'created',
        label: ti.createdLabel,
        iconName: 'event',
        contentClass: 'col s6',
        disabled: true,
        initialValue: info.created ? info.created.toLocaleDateString() : new Date().toLocaleDateString(),
        onchange: () => null,
      }),
    ]);
  },
});
