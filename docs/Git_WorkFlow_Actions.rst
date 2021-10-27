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
.. image:: githubworkFlow%20actions.PNG
   :width: 600

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
4) License Check: It consists of multiple dependent tests (setting up Node and Python). After setting up the environmet,
   it runs the test_licenses.sh which can be found here (https://github.com/learningequality/kolibri/blob/release-v0.15.x/test/conditional/test_licenses.sh)
5) Linting Check: Linting is the automated checking of your source code for programmatic and stylistic errors. Kolibri uses different type of linter but most of them are with Flake linting.

Detailed Linting File : https://github.com/learningequality/kolibri/blob/b87f9da274a6a9218419cf9f858be695aa04304a/.pre-commit-config.yaml

6) No Zombie Threads: This runs on pull requests as well as push. This make sures that there no zombie processes running where it runs the basic setup to setup the system on Ubuntu.
                      It makes sure that there are no invalid ports active as well as processes. The system gets shutdown properly. 
                      https://github.com/learningequality/kolibri/blob/b87f9da274a6a9218419cf9f858be695aa04304a/.github/workflows/no_zombies.yml

7) PostGre Tests: It is currently disabled for forks so a developer/contributor doesn't have to worry about this one.
8) Python2 Linting: Same linting workflow for all Python files  (Uses Flake 8 with Python to lint all python files)
9) Python Tests: This workflow takes more time then all other workflows since it runs unit tests on each section  
                Detailed workflow tests: It runs unit on each version of python and all operating systems as well as Postgres (Database)
                It installs tox, sets up tox envirnoment cache, runs all the tests and then cleans up all the processes
                All units tests can be found here: https://github.com/learningequality/kolibri/tree/release-v0.15.x/test
10) Static dependencies with and without C extensions: Ensure that for this Python version, we can actually compile ALL files in the kolibri directory, This is the second most essential workflow action
    It setups the staging environment where all the changes are tested throughly in Python 2.7.
    It takes average of 4 mins to test this C extension tests. 


