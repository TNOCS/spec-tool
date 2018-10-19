export interface ITemplateDefinition {
  /** When true, show the dropdown selector to switch between different examples. */
  showTemplateSelector: boolean;
  /** Label for the ToC */
  tableOfContent: string;
  /** Label for the document info */
  docInfoTitle: string;
  /** Label for the author */
  authorLabel: string;
  /** Label for the release info */
  releaseLabel: string;
  /** Label for the version */
  versionLabel: string;
  /** Label for the created time */
  createdLabel: string;
  /** Label for the updated time */
  updatedLabel: string;
  /** Label for navigation to the next page */
  nextLabel: string;
  /** Label for navigation to the previous page */
  prevLabel: string;
  /** In a list, how to display a, b, AND c */
  and: string;
  /** Home page tab */
  home: ITabDefinition;
  /** Edit page tab */
  edit: ITabDefinition;
  /** Spec page tab */
  spec: ITabDefinition;
  /** About page tab */
  about: ITabDefinition;
  /** What is the name of the JSON download file */
  downloadJsonFilename: string;
  /** How to name the JSON download button */
  downloadJsonLabel: string;
  /** What is the name of the Markdown download file */
  downloadMarkdownFilename: string;
  /** How to name the markdown download button */
  downloadMarkdownLabel: string;
  /** How to name the upload button */
  uploadTemplateLabel: string;
  /** Message to show when you hover above the upload area */
  uploadTooltipLabel: string;
  /** When there is no specification, what message do you want to display */
  emptySpecMessage: string;
}

export interface ITabDefinition {
  /** Label in the tab */
  label: string;
  /** Materialize CSS icon name */
  icon: string;
}
