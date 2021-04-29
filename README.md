# Lightning Platform, Lightning Data Service

This repository contains the source code for the Lightning Data Service.

## Prerequisites

[XCode](https://apps.apple.com/us/app/xcode/id497799835?mt=12) - [Older versions](https://developer.apple.com/download/more/?=xcode) if not using the latest version of Mac OS

[Homebrew](brew.sh)

### Git

Git Trailhead - [Git and GitHub Basics](https://trailhead.salesforce.com/content/learn/modules/git-and-git-hub-basics)

[Set up SSH access to Github](https://docs.github.com/en/github/authenticating-to-github/generating-a-new-ssh-key-and-adding-it-to-the-ssh-agent) if you haven't done so already.

[Setup Commit Signing](https://confluence.internal.salesforce.com/pages/viewpage.action?spaceKey=corescm&title=How+to+Set+Up+Commit+Signing) if you haven't done so already.

[Setup SSO access to GitHub Repos](https://github.com/orgs/salesforce/sso/sign_up) - More Information [here](https://gus.lightning.force.com/lightning/r/0D5B000001EoNvaKAF/view)

### Node.js/npm/Yarn

Check if node.js, npm and yarn are already installed,

```bash
node --version
v14.16.0

npm --version
6.14.12

yarn --version
1.22.10
```

If not, we use [Volta](https://volta.sh/) to ensure that all the contributors share the same version of `Node` (npm gets installed as part of node) and `Yarn` for development,

```bash
brew install volta
volta install node
volta install yarn
```

## Clone and Build

```bash
git clone git@github.com:salesforce/lds-lightning-platform.git
cd lds-lightning-platform
yarn
```

## Open IDE

[Visual Studio Code](https://code.visualstudio.com/) is the preferred IDE,

```bash
code .
```
