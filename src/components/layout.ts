import m, { Vnode, Component } from 'mithril';
import M from 'materialize-css';
import background from '../assets/document.jpg';
import icon from '../assets/spec-tool.svg';
import tno from '../assets/tno.png';
import { dashboardSvc } from '../services/dashboard-service';
import { specSvc } from '../services/spec-service';
import { removeHtml, replacePlaceholders, isVisible } from '../utils/utils';

const isActive = (path: string) =>
  m.route.get().indexOf(path) >= 0 ? '.active' : '';

const isEditMenu = (route: string) =>
  route.indexOf(specSvc.templateInfo.edit.label.toLowerCase()) > 0;

/** Create a chapter link */
export const ChapterLink = (): Component<{ id: string; title: string }> => ({
  view: ({ attrs }) =>
    m(
      `a[href=/${
        specSvc.specTitle
      }/${specSvc.templateInfo.edit.label.toLowerCase()}/${attrs.id}]`,
      { oncreate: m.route.link },
      removeHtml(replacePlaceholders(attrs.title))
    ),
});

export const Layout = () => ({
  oncreate: () => {
    const sidenav = document.querySelectorAll('.sidenav');
    M.Sidenav.init(sidenav);
    const dropdown = document.querySelectorAll('.dropdown-trigger');
    M.Dropdown.init(dropdown, { constrainWidth: false });
  },
  view: (vnode: Vnode) =>
    m('container', [
      m(
        'ul.dropdown-content[id=editmenu]',
        specSvc.chapters
          .filter(c => isVisible(c))
          .map(c => m('li', m(ChapterLink, c)))
      ),
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
              .map(d => ({
                ...d,
                route: d.route.replace(':spec', specSvc.specTitle),
              }))
              .map(d =>
                m(
                  `li${isActive(d.route)}`,
                  isEditMenu(d.route)
                    ? m(
                        'a.dropdown-trigger[href=!#][data-target=editmenu]',
                        d.icon ? m('i.material-icons', d.icon) : d.title
                      )
                    : m(
                        'a',
                        { href: d.route, oncreate: m.route.link },
                        m(
                          'i.material-icons.right',
                          d.icon ? m('i.material-icons', d.icon) : d.title,
                          'arrow_drop_down'
                        )
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
              m(`img.circle[src=${tno}]`, {
                style: 'background: white; padding: 5px;',
              })
            ),
            m(
              'a[href=mailto:erik.vullings@tno.nl][target=_blank]',
              m('span.black-text name', 'Contact')
            ),
          ])
        ),
        ...specSvc.chapters
          .filter(c => isVisible(c))
          .map(c => m('li', m(ChapterLink, c))),
      ]),
      m('section.main', vnode.children),
    ]),
});
