import m from 'mithril';
import { specSvc } from '../../services/spec-service';
import { replacePlaceholders, isVisible, markdown } from '../../utils/utils';
import { DownloadUpload } from './download-upload';

export const HomePage = () => ({
  view: () =>
    m('.row', [
      m(
        '.col s7',
        m('.introduction', [
          m.trust(markdown(specSvc.introduction)),
          m(DownloadUpload),
        ])
      ),
      m('.col s5', [
        m('h1', m.trust(specSvc.templateInfo.tableOfContent)),
        m('ul.collection', [
          specSvc.chapters
            .filter(c => isVisible(c))
            .map(c =>
              m(
                'li.collection-item',
                m(
                  `a[href=#!/${specSvc.templateInfo.edit.label.toLowerCase()}/${
                    c.id
                  }]`,
                  replacePlaceholders(c.title).replace('<p>', '').replace('</p>', '')
                )
              )
            ),
        ]),
      ]),
    ]),
});
