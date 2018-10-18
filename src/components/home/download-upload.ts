import m from 'mithril';
import { specSvc } from '../../services/spec-service';
import { button } from '../../utils/html';

const stopPropagation = (e: UIEvent) => {
  e.stopPropagation();
  e.preventDefault();
};

const handleFiles = (files: FileList | null) => {
  const file = files && files.length > 0 ? files[0] : undefined;
  if (file && /\.json$/.test(file.name)) {
    specSvc.file = file;
    specSvc.loadSpecification(err => {
      if (err) {
        console.error(err);
      }
      m.redraw();
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
    m('.row.download-upload', [
      button({
        label: specSvc.templateInfo.downloadJsonLabel,
        iconName: 'cloud_download',
        ui: {
          onclick: el => {
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
      button({
        label: specSvc.templateInfo.downloadMarkdownLabel,
        iconName: 'cloud_download',
        ui: {
          onclick: el => {
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
            'button.upload-btn]',
            m(
              'i.material-icons',
              {
                ondragover: stopPropagation,
                ondragenter: stopPropagation,
                ondrop: (e: DragEvent) => {
                  stopPropagation(e);
                  const dt = e.dataTransfer;
                  if (dt) { handleFiles(dt.files); }
                },
              },
              'cloud_upload'
            )
          ),
          m('input[id=specfile][type=file][multiple=false][accept=.json]', {
            onchange: (e: UIEvent) => {
              const files = (e.srcElement as HTMLInputElement).files;
              handleFiles(files);
            },
          }),
        ]
      ),
    ]),
});
