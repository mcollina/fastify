# Fastify is an OPEN Open Source Project

## What?

Individuals making significant and valuable contributions are given commit-access to the project to contribute as they see fit. This project is more like an open wiki than a standard guarded open source project.

See our [informal contributing guide](./docs/Guides/Contributing.md) for more
details on contributing to this project.

### I want to be a collaborator!

If you think you meet the above criteria and we have not invited you yet, we are sorry!
Feel free reach out to a [Lead Maintainer](https://github.com/fastify/fastify#team) privately with
a few links to your valuable contributions.
Read the [GOVERNANCE](GOVERNANCE.md) to get more information.

## Rules

There are a few basic ground-rules for contributors:

1. **No `--force` pushes** on `main` or modifying the Git history in any way after a PR has been merged.
1. **Non-main branches** ought to be used for ongoing work.
1. **External API changes and significant modifications** ought to be subject to an **internal pull-request** to solicit feedback from other contributors.
1. Internal pull-requests to solicit feedback are *encouraged* for any other non-trivial contribution but left to the discretion of the contributor.
1. Contributors should attempt to adhere to the prevailing code-style.
1. At least two contributors, or one core member, must approve pull-requests prior to merging.
1. All integrated CI services must be green before a pull-request can be merged.
1. A lead maintainer must merge SemVer-major changes in this repository.
1. In case it is not possible to reach consensus in a pull-request, the decision is left to the lead maintainer's team.

### Fastify v1.x

Code for Fastify's **v1.x** is in [branch 1.x](https://github.com/fastify/fastify/tree/1.x), so all Fastify 1.x related changes should be based on **`branch 1.x`**.

### Fastify v2.x

Code for Fastify's **v2.x** is in [branch 2.x](https://github.com/fastify/fastify/tree/2.x), so all Fastify 2.x related changes should be based on **`branch 2.x`**.

## Releases

Declaring formal releases remains the prerogative of the lead maintainers. Do not bump version numbers in pull requests.

## Plugins

The contributors to the Fastify's plugins must attend the same rules of the Fastify repository with a few adjustments:

1. Any member can publish a release.
1. The plugin version must follow the [semver](https://semver.org/) specification.
1. The Node.js compatibility must match with the Fastify's main branch.
1. The new release must have the changelog information stored in the GitHub release.
     For this scope we suggest to adopt a tool like [`releasify`](https://github.com/fastify/releasify) to archive this.
1. PR opened by bots (like Dependabot) can be merged if the CI is green and the Node.js versions supported are the same of the plugin.

## Changes to this arrangement

This is an experiment and feedback is welcome! This document may also be subject to pull-requests or changes by contributors where you believe you have something valuable to add or change.

# Fastify Organization Structure

The Fastify structure is detailed in the [GOVERNANCE](GOVERNANCE.md) document.

### Onboarding Collaborators

Welcome to the team! We are happy to have you. Before you start, please complete the following tasks:
1. Set up 2 factor authentication for GitHub and NPM
  - [GitHub 2FA](https://help.github.com/en/articles/securing-your-account-with-two-factor-authentication-2fa)
  - [NPM 2FA](https://docs.npmjs.com/about-two-factor-authentication)
2. Choose which team to join *(more than one is ok!)* based on how you want to help.
3. Open a pull request to [`fastify/fastify:HEAD`](https://github.com/fastify/fastify/pulls) that adds your name, username, and email to the team you have choosen in the [README.md](./README.md) and [package.json](./package.json) *(if you are part of the core team)* files. The members lists are sorted alphabetically; make sure to add your name in the proper order.
4. Open a pull request to [`fastify/website:HEAD`](https://github.com/fastify/website/pulls) adding yourself to the [team.yml](https://github.com/fastify/website/blob/HEAD/src/website/data/team.yml) file. This list is also sorted alphabetically so make sure to add your name in the proper order. Use your GitHub profile icon for the `picture:` field.
5. The person that does the onboarding must add you to the [npm org](https://www.npmjs.com/org/fastify), so that you can help maintaining the official plugins.

### Offboarding Collaborators

We are thankful to you and we are really glad to have worked with you.
We'll be really happy to see you here again if you want to come back, but for now the person that did the onboarding must:
1. Ask the collaborator if they want to stay or not.
1. If the collaborator can't work with us anymore, they should:
  1. Open a pull request to [`fastify/fastify:HEAD`](https://github.com/fastify/fastify/pulls) and move themselves to the *Past Collaborators* section.
  2. Open a pull request to [`fastify/website:HEAD`](https://github.com/fastify/website/pulls) and move themselves to the *Past Collaborators* section in the [team.yml](https://github.com/fastify/website/blob/HEAD/src/website/data/team.yml) file.

The person that did the onboarding must:
1. If the collaborator doesn't reply to the ping in reasonable time, open the pull requests described above.
2. Remove the collaborator from the Fastify teams on GitHub.
3. Remove the collaborator from the [npm org](https://www.npmjs.com/org/fastify).
4. Remove the collaborator from the Azure team.
-----------------------------------------

<a id="developers-certificate-of-origin"></a>
## Developer's Certificate of Origin 1.1

By making a contribution to this project, I certify that:

* (a) The contribution was created in whole or in part by me and I
  have the right to submit it under the open source license
  indicated in the file; or

* (b) The contribution is based upon previous work that, to the best
  of my knowledge, is covered under an appropriate open source
  license and I have the right under that license to submit that
  work with modifications, whether created in whole or in part
  by me, under the same open source license (unless I am
  permitted to submit under a different license), as indicated
  in the file; or

* (c) The contribution was provided directly to me by some other
  person who certified (a), (b) or (c) and I have not modified
  it.

* (d) I understand and agree that this project and the contribution
  are public and that a record of the contribution (including all
  personal information I submit with it, including my sign-off) is
  maintained indefinitely and may be redistributed consistent with
  this project or the open source license(s) involved.
