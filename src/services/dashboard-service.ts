import { specificationCatalogue } from './specification-catalogue';
import m, { RouteDefs, ComponentTypes } from 'mithril';
import { IDashboard } from '../models/dashboard';
// import { ISubscriptionDefinition } from './message-bus-service';
import { Layout } from '../components/layout';
import { HomePage } from '../components/home/home-page';
import { EditPage } from '../components/edit/edit-page';
import { AboutPage } from '../components/about/about-page';
import { SpecPage } from '../components/spec/spec-page';
import { specSvc } from './spec-service';

export const enum Dashboards {
  HOME = 'HOME',
  EDIT = 'EDIT',
  SPEC = 'SPEC',
  ABOUT = 'ABOUT',
}

class DashboardService {
  // private subscription!: ISubscriptionDefinition<any>;
  private dashboards!: ReadonlyArray<IDashboard>;

  constructor(private layout: ComponentTypes, dashboards: IDashboard[]) {
    this.setList(dashboards);
    this.subscribe();
  }

  public getList() {
    return this.dashboards;
  }

  public setList(list: IDashboard[]) {
    this.dashboards = Object.freeze(list);
  }

  public get defaultRoute() {
    const dashboard = this.dashboards.filter(d => d.default).shift();
    const route = dashboard ? dashboard.route : this.dashboards[0].route;
    return route.replace(
      ':spec',
      specSvc.specTitle || specificationCatalogue.default.title.toLowerCase()
    );
  }

  public get routingTable() {
    return this.dashboards.reduce(
      (p, c) => {
        p[c.route] = {
          render: () => {
            const spec = m.route.param('spec');
            specSvc.load(spec);
            return m(this.layout, m(c.component));
          },
        };
        return p;
      },
      {} as RouteDefs
    );
  }

  public switchTo(dashboardId: Dashboards, fragment = '') {
    const dashboard = this.dashboards.filter(d => d.id === dashboardId).shift();
    if (dashboard) {
      m.route.set(dashboard.route);
    }
  }

  private subscribe() {
    // this.subscription = esdlChannel.subscribe(TopicNames.ITEM_UPDATE, ({ cur }) => {
    //   if (cur) {
    //     this.setList(
    //       this.dashboards.map(d => {
    //         d.visible = d.id !== Dashboards.NEW_ITEM;
    //         return d;
    //       })
    //     );
    //     this.switchTo(Dashboards.ITEM, `/${cur.id}`);
    //   } else {
    //     this.setList(
    //       this.dashboards.map(d => {
    //         d.visible = d.id === Dashboards.HOME;
    //         return d;
    //       })
    //     );
    //     this.switchTo(Dashboards.HOME);
    //   }
    // });
  }
}

export const dashboardSvc: DashboardService = new DashboardService(Layout, [
  {
    id: Dashboards.HOME,
    default: true,
    title: specSvc.templateInfo.home.label,
    icon: specSvc.templateInfo.home.icon,
    route: `/:spec/${specSvc.templateInfo.home.label.toLowerCase()}`,
    visible: true,
    component: HomePage,
  },
  {
    id: Dashboards.EDIT,
    title: specSvc.templateInfo.edit.label,
    icon: specSvc.templateInfo.edit.icon,
    route: `/:spec/${specSvc.templateInfo.edit.label.toLowerCase()}/:id`,
    visible: false,
    component: EditPage,
  },
  {
    id: Dashboards.EDIT,
    title: specSvc.templateInfo.edit.label,
    icon: specSvc.templateInfo.edit.icon,
    route: `/:spec/${specSvc.templateInfo.edit.label.toLowerCase()}`,
    visible: true,
    component: EditPage,
  },
  {
    id: Dashboards.SPEC,
    title: specSvc.templateInfo.spec.label,
    icon: specSvc.templateInfo.spec.icon,
    route: `/:spec/${specSvc.templateInfo.spec.label.toLowerCase()}`,
    visible: true,
    component: SpecPage,
  },
  {
    id: Dashboards.ABOUT,
    title: specSvc.templateInfo.about.label,
    icon: specSvc.templateInfo.about.icon,
    route: `/:spec/${specSvc.templateInfo.about.label.toLowerCase()}`,
    visible: true,
    component: AboutPage,
  },
]);
