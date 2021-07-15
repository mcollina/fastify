# Contributing To Fastify
<a id="contributing"></a>

Thank you for taking an interest in contributing to Fastify. We are excited
to receive your support and knowledge. This guide is our attempt to help you
help us.

> ## Note
> This is an informal guide. Please review the formal
> [CONTRIBUTING document](/CONTRIBUTING.md) for full details and our
> [Developer Certificate of Origin](https://en.wikipedia.org/wiki/Developer_Certificate_of_Origin).

## Table Of Contents
<a id="contributing-toc"></a>

0. [Types Of Contributions We're Looking For](#contribution-types)
0. [Ground Rules & Expectations](#contributing-rules)
0. [How To Contribute](#contributing-how-to)
0. [Setting Up Your Environment](#contributing-environment)
  * [Using Visual Studio Code](#contributing-vscode)

## Types Of Contributions We're Looking For
<a id="contribution-types"></a>

In short, we welcome any type of contribution you are willing to provide. No
contribution is too small. We gladly accept contributions such as:

* Documentation improvements: from small typo corrections to major document reworks
* Helping others by answering questions in pull requests and [discussions](https://github.com/fastify/fastify/discussions)
* Fixing [known bugs](https://github.com/fastify/fastify/issues?q=is%3Aissue+is%3Aopen+label%3Abug)
* Reporting previously unknown bugs by opening an issue with a minimal reproduction

## Ground Rules & Expectations
<a id="contributing-rules"></a>

Before we get started, here are a few things we expect from you (and that
you should expect from others):

* Be respectful and thoughtful in your conversations around this project. This
  project is maintained by a diverse set of people from all across the globe.
  Each person has their own views and opinions about the project. Try to listen
  to each other and reach an agreement or compromise.
* We have a [Code of Conduct](/CODE_OF_CONDUCT.md). You must adhere to it to
  participate in this project.
* If you open a pull request, please ensure that your contribution passes all
  tests. If there are test failures, you will need to address them before we
  can merge your contribution.

## How To Contribute
<a id="contributing-how-to"></a>

If you'd like to contribute, start by searching through the
[issues](https://github.com/fastify/fastify/issues) and
[pull requests](https://github.com/fastify/fastify/pulls) to see whether
someone else has raised a similar idea or question.

If you don't see your idea listed, and you think it fits into the goals of this
guide, do one of the following:
* **If your contribution is minor,** such as a typo fix, open a pull request.
* **If your contribution is major,** such as a new feature, start by opening an
  issue first. That way, other people can weigh in on the discussion before you
  do any work.

<!--
TODO: add link to a style guide, when we have one, here as in
https://github.com/github/opensource.guide/blob/2868efbf0c14aec821909c19e210c3603a4a7805/CONTRIBUTING.md#style-guide
-->

## Setting Up Your Environment
<a id="contributing-environment"></a>

Please adhere to the project's code and documentation style. Some popular tools
that automatically "correct" code and documentation do not follow a style that
conforms to the styles this project uses. Notably, this project uses
[StandardJS](https://standardjs.com) for code formatting.

### Using Visual Studio Code
<a id="contributing-vscode"></a>
What follows is how to use [Visual Studio Code (VSCode) portable](https://code.visualstudio.com/docs/editor/portable)
to create a Fastify specific environment. This guide is written as if you are
setting up the environment on macOS, but the prinicples are the same across
all platforms. See the previously linked VSCode portable guide for help with
other platforms.

First, [download VSCode](https://code.visualstudio.com/download) and unpackage
it to `/Applications/VSCodeFastify/`. Upon doing so, the following should
output "found" when run in a terminal:

```sh
[ -d /Applications/VSCodeFastify/Visual\ Studio\ Code.app ] && echo "found"
```

As mentioned in the VSCode portable guide, we need to unsandbox the application
for the portable mode to work correctly. So issue the following in a terminal:

```sh
xattr -dr com.apple.quarantine /Applications/VSCodeFastify/Visual\ Studio\ Code.app
```

Next, create the required data directories for VSCode:

```sh
mkdir -p /Applications/VSCodeFastify/code-portable-data/{user-data,extensions}
```

Before continuing, we need to add the `code` command to your terminal's
`PATH`. To do so, we will [manually add VSCode to the `PATH`](https://code.visualstudio.com/docs/setup/mac#_launching-from-the-command-line). As outlined in that document, the
instructions vary depending on your default shell, so you should follow the
instructions in that guide as relates to your preferred shell. However, we will
tweak them slightly by defining an alias instead of a direct reference to the
`code` tool. This is so we do not conflict with any other installation of
VSCode you may have, and to keep this guide specific to Fastify. So, ultimately,
we want the following:

```sh
alias code-fastify="/Applications/VSCodeFastify/Visual\ Studio\ Code.app/Contents/Resources/app/bin/code"
```

The result should be that `code-fastify --version` results in something like:

```sh
❯ code-fastify --version
1.50.0
93c2f0fbf16c5a4b10e4d5f89737d9c2c25488a3
x64
```

Now that VSCode is installed, and we can work with it via the command line,
we need to install an extension that will aid in keeping any JavaScript you
write for the project formatted according to the project's style:

```sh
code-fastify --install-extension dbaeumer.vscode-eslint
```

Upon successful execution of the previous command, the following command should
result in "found" being output:

```sh
[ -d /Applications/VSCodeFastify/code-portable-data/extensions/dbaeumer.vscode-eslint-* ] && echo "found"
```

Now, from within the directory of your local clone of the Fastify project, we
can open VSCode:

```sh
code-fastify .
```

A new VSCode window should open and you should see the Fastify project files
in the left sidebar. But wait! We are not quite done yet. There are a few more
baseline settings that should be set before VSCode is ready.

Press `cmd+shift+p` to bring up the VSCode command input prompt. Type
`open settings (json)` and then choose the same item from the filtered menu.
This will open a document that is the settings for the editor. Paste
the following JSON into this document, overwriting any text already present,
and save it:

```json
{
    "[javascript]": {
        "editor.defaultFormatter": "dbaeumer.vscode-eslint",
        "editor.codeActionsOnSave": {
            "source.fixAll": true
        }
    },

    "workbench.colorCustomizations": {
        "statusBar.background": "#178bb9"
    }
}
```

Next, from the menu bar, select "Terminal > New Terminal" to open a new terminal
in the editor. Run `npm install` to install the Fastify dependencies. Finally,
we need to tell the eslint plugin to use the Fastify local install of eslint.
Press `cmd+shift+p` to bring up the VSCode command input, type
`eslint: manage library execution` and select it from the filtered menu. On
the prompt, click the "Allow" button.

At this point, you are all setup with a custom VSCode instance that can be used
to work on Fastify contributions. As you edit and save JavaScript files, the
editor will autocorrect any style issues.
