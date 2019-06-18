import { dashboardSvc } from './../../services/dashboard-service';
import { specSvc } from './../../services/spec-service';
import M from 'materialize-css';
import m, { Component } from 'mithril';
import { specificationCatalogue } from '../../services/specification-catalogue';

/**
 * Dropdown list of all the example specifications.
 */
export const SelectSpec = () => {
  return {
    oncreate: () => {
      const elems = document.querySelectorAll('.select-spec');
      M.Dropdown.init(elems);
    },
    view: () => {
      return [
        m(
          'a.select-spec.waves-effect.waves-teal.btn.blue[href=#][data-target=dropdownspecs]',
          `Template: ${specSvc.specTitle}` || 'SELECT'
        ),
        m(
          'ul.dropdown-content[id=dropdownspecs]',
          specificationCatalogue.list.map(spec =>
            m(
              'li',
              m(
                'button.waves-effect.waves-teal.btn-flat',
                {
                  onclick: (e: UIEvent) => {
                    e.preventDefault();
                    specSvc.load(spec.title, spec.data);
                    m.route.set(dashboardSvc.defaultRoute);
                  },
                },
                spec.title
              )
            )
          )
        ),
      ];
    },
  } as Component<{}>;
};
