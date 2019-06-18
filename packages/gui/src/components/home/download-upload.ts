import { dashboardSvc } from './../../services/dashboard-service';
import { SelectSpec } from './../ui/select-spec';
import m from 'mithril';
import { specSvc } from '../../services/spec-service';
import { Button } from 'mithril-materialized';
import { storageSvc } from '../../services/local-storage-service';

const stopPropagation = (e: UIEvent) => {
  e.stopPropagation();
  e.preventDefault();
};

const handleFiles = (files: FileList | null) => {
  const file = files && files.length > 0 ? files[0] : undefined;
  if (file && /\.json$/.test(file.name)) {
    specSvc.loadSpecification(file, err => {
      if (err) {
        console.error(err);
      }
      m.route.set(dashboardSvc.defaultRoute);
    });
  } else {
    console.error('Cannot open file!');
  }
};

export const DownloadUpload = () => ({
  oncreate: () => {
    const elems = document.querySelectorAll('.tooltipped');
    M.Tooltip.init(elems);
  },
  view: () =>
    m(
      '.row.download-upload',
      m('.col.s12', [
        m(Button, {
          label: specSvc.templateInfo.downloadJsonLabel,
          iconName: 'cloud_download',
          ui: {
            onclick: (el: UIEvent) => {
              const data =
                'text/json;charset=utf-8,' +
                encodeURIComponent(JSON.stringify(specSvc.json, null, 2));
              (el.target as any).setAttribute('href', 'data:' + data);
              (el.target as any).setAttribute(
                'download',
                specSvc.templateInfo.downloadJsonFilename
              );
            },
          },
        }),
        m(Button, {
          label: specSvc.templateInfo.downloadMarkdownLabel,
          iconName: 'cloud_download',
          ui: {
            onclick: (el: UIEvent) => {
              const report = specSvc.report;
              if (!report) {
                return;
              }
              const data =
                'text/json;charset=utf-8,' +
                encodeURIComponent(JSON.stringify(report));
              (el.target as any).setAttribute('href', 'data:' + data);
              (el.target as any).setAttribute(
                'download',
                specSvc.templateInfo.downloadMarkdownFilename
              );
            },
          },
        }),
        m(
          `.upload-btn-wrapper.tooltipped[data-position=bottom][data-tooltip=${
            specSvc.templateInfo.uploadTooltipLabel
          }]`,
          [
            m(
              'a.waves-effect.waves-light.btn',
              {
                onclick: () => {
                  const inputs = document.querySelectorAll('.upload-file');
                  if (inputs && inputs.length > 0) {
                    const inp = inputs[0] as HTMLInputElement;
                    inp.click();
                  }
                },
              },
              m(
                'i.material-icons.left',
                {
                  ondragover: stopPropagation,
                  ondragenter: stopPropagation,
                  ondrop: (e: DragEvent) => {
                    stopPropagation(e);
                    const dt = e.dataTransfer;
                    if (dt) {
                      handleFiles(dt.files);
                    }
                  },
                },
                'cloud_upload'
              ),
              'UPLOAD'
            ),
            m(
              'input.upload-file[id=specfile][type=file][multiple=false][accept=.json]',
              {
                onchange: (e: UIEvent) => {
                  const files = (e.srcElement as HTMLInputElement).files;
                  handleFiles(files);
                },
              }
            ),
          ]
        ),
        m(Button, {
          label: specSvc.templateInfo.deleteLocalStorageLabel,
          iconName: 'delete_forever',
          contentClass: 'red',
          ui: {
            onclick: () => storageSvc.delete(),
          },
        }),
        specSvc.templateInfo.showTemplateSelector ? m(SelectSpec) : undefined,
      ])
    ),
});
