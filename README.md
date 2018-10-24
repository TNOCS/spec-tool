# Introduction

Spec-tool is a web application to guide the end-user in creating a requirements document or any kind of formalized overview based on their answers. By answering questions, the savvy but non-technical end-user creates a (specification) document, e.g. for:

- Creating a specification for a well-defined field (where you often ask the same questions)
- Creating an overview or structured summary of a meeting
- Creating a Lessons Learned document based on answering questions
- ...

You can easily create your own questionnaire, upload and edit it, or you can fork the project and add your own template to the deployed website.

## Features

- A specification is divided into chapters. Each chapter is divided into sections. Both can contain one or more questions.
- Questions can be of different kind:
  - Choices (radio buttons)
  - Options (check boxes)
  - Text inputs (strings and numbers), where placeholders like `_name_` or `_count_` in the question's title will be converted to input boxes, making `questionId.name` or `questionId.count` available for show or repeat instructions and for the output.
  - Additionally, the placeholder `$index` (note the dollar sign) is replaced with the current repeat number (starting at `1`). Similarly, `$indexStr` is replaced by a letter (starting at `a`).
- Each chapter, section and question has a title and description. For each, markdown can be used.
- Each chapter, section and question may contain placeholders that reference another question, e.g.
  - In the title `Project &project.name`, `&project.name` is replaced by the value of the previously requested input. As long as `project.name` is undefined, the question will be hidden.
- Each chapter, section or question is displayed, unless it is hidden. It is hidden when:
  - One of the placeholders is still empty, e.g. when `&project.name` has not been specified yet
  - One of the 'show' requirements has not been answered, where show is a list of strings, where
    each entry signifies an OR condition, and the entry itself may contain `&` to represent AND conditions,
    e.g. `show: ["project.budget", "project.name & project.duration"]` means that we only show the question
    when the `project.budget` is specified OR `project.name` and `project.duration` are specified.
- You can apply pre-set answers, so when you select a radio or check an option, many other questions can be answered too.
- If a title or a template question, i.e. a question that asks for inputs using the `_inputId_` placeholder, contains a `\n`, the first part of the title will be displayed as header, while the rest of the text will be displayed as ordinary text.
- Each question can contain 'output' properties: this markdown text, after substitution of placeholders, will be used to generate the output document. If you start the output text with a dash, e.g. `- option1`, the output document will be formatted as a list. If you add two spaces before the dash, it will indent one level deeper.
- Each question can contain data properties, e.g. to set the start value, to specify the type of input (text (default), textarea, number, date, color, url, email), or to specify additional properties, like min/max for numbers or minLength and maxLength for text.
- Each template can be internationalized by adding the proper headers and labels to the template info section.

## Build instructions

During development, you can just use `npm start` to get going.

## Install

Assuming you have installed `node.js` and checked out the code, you can do:

```bash
> npm i
> npm start
```

You may also want to try `pnpm (npm i -g pnpm)`, which stores all dependencies only once.

## Deploy to GitHub pages

If you fork this project, you can deploy your own questionnaire to GitHub pages by using `npm run build:domain`. The optimized code will be saved in the `docs` folder.

Please note that you have to change the output domain in the `build:domain` script in `package.json`, and that you need to update the GitHub settings to use the docs folder to share your project.

## Generate the JSON schema file

Generate the JSON schema for validating your specification document.

```bash
> npm run gen:schema
```

To use the schema in `vscode`, add the schema to your workspace settings. Now when you name your specification `myspec.spec.json` or `myspec.spec.yaml`, the editor will read the schema and use it for validation and intellisense.

```json
{
  "json.schemas": [
    {
      "fileMatch": ["/*.spec.json"],
      "url": "./schema/spec.json"
    }
  ],
  "yaml.schemas": {
    "./schema/spec.json": "/*.spec.yaml",
  }
}
```
