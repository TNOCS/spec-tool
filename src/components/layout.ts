import m, { Vnode } from 'mithril';
import background from '../assets/document.jpg';
import icon from '../assets/spec-tool.svg';
import tno from '../assets/tno.png';
import { dashboardSvc } from '../services/dashboard-service';
import M from 'materialize-css';
import { specSvc } from '../services/spec-service';

const isActive = (path: string) => (m.route.get().indexOf(path) >= 0 ? '.active' : '');

export const Layout = () => ({
  oncreate: () => {
    const elems = document.querySelectorAll('.sidenav');
    M.Sidenav.init(elems);
  },
  view: (vnode: Vnode) =>
    m('container', [
      m(
        'nav',
        m('.nav-wrapper', [
          m(
            'a.brand-logo.sidenav-trigger[href=#][data-target=slide-out]',
            // { style: 'margin-left: 20px' },
            m(`img[width=70][height=70][src=${icon}]`)
          ),
          // m('a.sidenav-trigger[href=#][data-target=slide-out]', m('i.material-icons', 'menu')),
          m(
            'ul.right',
            dashboardSvc
              .getList()
              .filter(d => d.visible)
              .map(d =>
                m(
                  `li${isActive(d.route)}`,
                  m(
                    `a[href="${d.route}"]`,
                    { oncreate: m.route.link },
                    d.icon ? m('i.material-icons', d.icon) : d.title
                  )
                )
              )
          ),
        ])
      ),
      m('ul.sidenav[id=slide-out]', [
        m(
          'li',
          m('.user-view', [
            m('.background', m(`img[src=${background}]`)),
            m(
              'a[href=http://www.tno.nl][target=_blank]',
              m(`img.circle[src=${tno}]`, { style: 'background: white; padding: 5px;' })
            ),
            m('a[href=mailto:erik.vullings@tno.nl][target=_blank]', m('span.black-text name', 'Contact')),
          ])
        ),
        ...specSvc.chapters.map(c =>
          m('li', m(`a[href=#!/${specSvc.templateInfo.edit.label.toLowerCase()}/${c.id}]`, c.title))
        ),
      ]),
      m('section.main', vnode.children),
    ]),
});
