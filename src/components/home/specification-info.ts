import m from 'mithril';
import { inputText, inputTextArea } from './../../utils/html';
import { specSvc } from '../../services/spec-service';

export const SpecificationInfo = () => ({
  view: () => {
    const ti = specSvc.templateInfo;
    const info = specSvc.specificationInfo;
    return m('.row', [
      m('h1', ti.docInfoTitle),
      m(
        inputTextArea({
          id: 'author',
          label: ti.authorLabel,
          iconName: 'account_circle',
          initialValue: info.author,
          onchange: v => (info.author = v.toString()),
        })
      ),
      m(
        inputTextArea({
          id: 'release',
          label: ti.releaseLabel,
          iconName: 'new_releases',
          initialValue: info.releaseInfo,
          onchange: v => (info.releaseInfo = v.toString()),
        })
      ),
      m(
        inputText({
          id: 'version',
          label: ti.versionLabel,
          iconName: 'label',
          initialValue: info.version,
          onchange: v => (info.version = v.toString()),
        })
      ),
      m(
        inputText({
          id: 'updated',
          label: ti.updatedLabel,
          iconName: 'event_available',
          disabled: true,
          initialValue: info.updated
            ? info.updated.toLocaleDateString()
            : new Date().toLocaleDateString(),
          onchange: v => null,
        })
      ),
      m(
        inputText({
          id: 'created',
          label: ti.createdLabel,
          iconName: 'event',
          disabled: true,
          initialValue: info.created
            ? info.created.toLocaleDateString()
            : new Date().toLocaleDateString(),
          onchange: v => null,
        })
      ),
    ]);
  },
});
