import { specSvc } from './../../services/spec-service';
import m, { Component } from 'mithril';

export interface INextPrevPage {
  isNext: boolean;
  title: string;
  link: string;
}

export const NextPrevPage = () => {
  const prevLabel = specSvc.templateInfo.prevLabel;
  const nextLabel = specSvc.templateInfo.nextLabel;
  return {
    view: ({ attrs }) => {
      const { next, prev } = attrs;
      return next || prev
        ? m('.row', [
            prev
              ? m(
                  '.next-prev-page.col.s5',
                  m(`a[href=${prev.link}]`, [
                    m(
                      `.next-prev-arrow`,
                      m('i.material-icons.medium', 'navigate_before')
                    ),
                    m('.next-prev-container.prev', [
                      m('span.next-prev', prevLabel),
                      m('span.next-prev-title', prev.title),
                    ]),
                  ])
                )
              : m('.col.s5'),
            next
              ? m(
                  '.next-prev-page.col.s5.offset-s2',
                  m(`a[href=${next.link}]`, [
                    m('.next-prev-container.next', [
                      m('span.next-prev', nextLabel),
                      m('span.next-prev-title', next.title),
                    ]),
                    m(
                      `.next-prev-arrow.next`,
                      m('i.material-icons.medium', 'navigate_next')
                    ),
                  ])
                )
              : undefined,
          ])
        : undefined;
    },
  } as Component<{ prev?: INextPrevPage; next?: INextPrevPage }>;
};
