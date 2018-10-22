import m from 'mithril';
import { specSvc } from '../../services/spec-service';
import { replacePlaceholders, isVisible, markdown, removeHtml } from '../../utils/utils';
import { DownloadUpload } from './download-upload';

export const HomePage = () => ({
  oninit: () => {
    const specTitle = m.route.param('spec');
    if (!specTitle) {
      return;
    }
    specSvc.load(specTitle);
  },
  view: () =>
    m('.row', [
      m(
        '.col.s12.m7.l8',
        m('.introduction', [
          m.trust(markdown(specSvc.introduction)),
          m(DownloadUpload),
        ])
      ),
      m('.col.s12.m5.l4', [
        m('h1', m.trust(specSvc.templateInfo.tableOfContent)),
        m('ul.collection', [
          specSvc.chapters
            .filter(c => isVisible(c))
            .map(c =>
              m(
                'li.collection-item',
                m(
                  `a[href=/${specSvc.specTitle}/${specSvc.templateInfo.edit.label.toLowerCase()}/${
                    c.id
                  }]`,
                  { oncreate: m.route.link },
                  removeHtml(replacePlaceholders(c.title))
                )
              )
            ),
        ]),
      ]),
    ]),
});
