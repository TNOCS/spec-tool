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
          specSvc.specFile || 'SELECT',
        ),
        m(
          'ul.dropdown-content[id=dropdownspecs]',
          specificationCatalogue.map(spec =>
            m(
              'li',
              m(
                'button.waves-effect.waves-teal.btn-flat',
                {
                  onclick: (e: UIEvent) => {
                    e.preventDefault();
                    specSvc.load(spec.title, spec.data);
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
