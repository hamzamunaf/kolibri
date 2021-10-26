GitHub Workflows: 
~~~~~~~~~~~~~~

At a high level, we follow the 'Gitflow' model. Some helpful references:

- `Atlassian tutorial <https://www.atlassian.com/git/tutorials/comparing-workflows/gitflow-workflow/>`__
- `Original description <http://nvie.com/posts/a-successful-git-branching-model/>`__


GitHub Workflows: 
~~~~~~~~~~~~~~
GitHub Actions help you automate tasks within your software development life cycle. GitHub Actions are event-driven, meaning that you can run a series of commands after a specified event has occurred. 
For example, every time someone creates a pull request for a repository, you can automatically run a command that executes a software testing script.

The workflow is an automated procedure that you add to your repository. Workflows are made up of one or more jobs and can be scheduled or triggered by an event.

A normal workflow example looks like:
name: learn-github-actions
on: [push]
jobs:
  check-bats-version:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '14'
      - run: npm install -g bats
      - run: bats -v

"on" means on what kind of git action it will take place, for example push, pull, fetch and etc
"runs-on" means what type of operating system or subsystem it will run on
"Actions" they define what type of action will be used in the job workflow

Kolibri consists of several workflows:
1) Build WHL file (whl file is essentially a ZIP ( . zip ) archive with a specially crafted filename that tells installers what Python versions and platforms the wheel will support. A wheel is a type of built distribution.)
2) Docs: It makes sure that All document files are in the doc folder with supported type of document files.
3) JavaScript Tests: This workflow is for push/pull requests:
    It runs on the ubuntu-latest
    It runs three types of testing
    First test: It makes sure that there are no duplicate files and all the path match with files types
    Second Test: It runs frontEnd tests as a pre job as well as caches all node.js Modules to make sure to it doesn't encounter any compile problems
    Third Tests : Making sure there are no dependencies are deprecated.
4) 