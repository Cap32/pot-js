# pot-js

[![Build Status](https://travis-ci.org/Cap32/pot-js.svg?branch=master)](https://travis-ci.org/Cap32/pot-js)

Process management module

![logger](./screenshot.gif)

## Table of Contents

<!-- TOC -->

* [Table of Contents](#table-of-contents)
* [Motivation](#motivation)
* [Features](#features)
* [Installing](#installing)
* [CLI Reference](#cli-reference)
* [Node.js module API Reference](#nodejs-module-api-reference)
  * [exec([options])](#execoptions)
  * [Operators](#operators)
  * [Connection](#connection)
  * [Commands](#commands)
  * [createCli()](#createcli)
  * [Schemas](#schemas)
* [License](#license)

<!-- /TOC -->

## Motivation

[forever](https://github.com/foreverjs/forever) and [pm2](https://github.com/Unitech/pm2) are great third-party process management tools, but they are not module friendly. Saying if you are writing a CLI service tool, you may need to built-in a process management module for handling process monitor, run as a daemon, stop, scale, reload, and then you could just focus on developing your service logic. So I created this module.

## Features

* Automatically restart process if it crashes. Like [forever](https://github.com/foreverjs/forever)
* Able to scale or reload instances with zero down time. Like [pm2](https://github.com/Unitech/pm2)
* Provides both CLI and Node.js module API
* Supports isolated workspaces
* User friendly interactive CLI
* Easy to extend
* Built-in powerful logger system

## Installing

```bash
$ npm install pot-js
```

For global CLI command, please add `-g` option

```bash
$ npm install -g pot-js
```

## CLI Reference

```bash
pot <command> [options]

Commands:
  pot start [entry]             Spawn and monitor a process
  pot restart [name]            Restart a process
  pot restartall                Restart all processes
  pot reload [name]             Reload a process
  pot reloadall                 Reload all processes
  pot stop [name]               Stop a process
  pot stopall                   Stop all processes
  pot scale [name] [instances]  Scale up/down a process
  pot list                      List processes                     [aliases: ls]
  pot log [name] [category]     Show log
  pot show [name]               Show process information
  pot flush [name]              Remove log files
  pot flushall                  Remove all log files

Options:
  --version   Show version number                                      [boolean]
  -h, --help  Show help                                                [boolean]
```

## Node.js module API Reference

### exec([options])

Spawn and monitor a process.

###### Options

* `args` (String|String[]): List of string arguments. Defaults to `[]`.
* `baseDir` (String): The base directory for resolving modules or directories. Defaults to the `current working directory`.
* `cluster` (Boolean): Enforce using cluster mode. If not set, it will automatically set to `true` when spawning a Node.js related process.
* `config` (String): Path to the config file. Defaults to `.potrc`.
* `cwd` (String): Current working directory. Defaults to `process.cwd()`.
* `daemon` (Boolean): Run as a daemon. Defaults to `false`.
* `entry` (String): Entry script path. Defaults to `./index.js`.
* `env` (Object): Environment variables object. Defaults to `process.env`.
* `events` (Object): Defining scripts by event hooks. Like `scripts` in `package.json`. Here are available event hooks:
  * `spawn`: New child process has been spawned
  * `start`: The monitor has started
  * `stop`: The monitor has fully stopped and the process is killed
  * `crash`: The monitor has crashed (too many restarts or spawn error)
  * `sleep`: monitor is sleeping
  * `exit`: Child process has exited
  * `stdout`: Child process stdout has emitted data
  * `stderr`: Child process stderr has emitted data
  * `warn`: Child process has emitted an error
* `execArgs` (String|String[]): Execution arguments. Defaults to `[]`.
* `execPath` (String): Execution Path. Defaults to `process.execPath`, which returns the absolute pathname of the executable that started the Node.js process. i.e. `/usr/local/bin/node`.
* `force` (Boolean): Enforce restart even if the process is exists. Defaults to `false`.
* `inspect` (Boolean|String|Object): Enable [node inspector](https://nodejs.org/api/cli.html#cli_inspect_host_port). Require Node.js >= v6.3.0. Defaults to `false`.
* `instances` (Number): Cluster instances. Defaults to `1`.
* `logLevel` (String|Object): Log level. See [pot-logger](https://github.com/cantonjs/pot-logger) for detail. Here are available levels:
  * ALL
  * TRACE
  * DEBUG (default in `development` mode)
  * INFO (default in `production` mode)
  * WARN
  * ERROR
  * FATAL
  * OFF
* `logsDir` (String): Log files directory. In `daemon` mode, log messages will write to some `.log` files.
* `maxRestarts` (Number): How many restarts are allowed within 60s.
* `monitorProcessTitle` (String): Monitor process title. Defaults to "node".
* `name` (String): Process monitor name. Shoule be unique. Defaults to the basename of `baseDir`.
* `production` (Boolean): Production mode. Short hand for setting NODE_ENV="production" env. Defaults to `true`.
* `watch` (Boolean|Object): Enable watch mode. Defaults to `false`. Here are available props for object config:
  * `enable` (Boolean): Enable `watch`. Defaults to `true`.
  * `dirs` (String|String[]): Defining watching directories.
  * `ignoreDotFiles` (Boolean): Ignore watching `.*` files. Defaults to `true`.
  * `ignoreNodeModulesDir` (Boolean): Ignore watching `node_modules` directory. Defaults to `true`.
* `workspace` (String): Workspace.

---

### Operators

Command lines interface helper functions

_(TODO)_

* `Operators.start(options)`
* `Operators.restart(options)`
* `Operators.restartAll(options)`
* `Operators.reload(options)`
* `Operators.reloadAll(options)`
* `Operators.stop(options)`
* `Operators.stopAll(options)`
* `Operators.scale(options)`
* `Operators.list(options)`
* `Operators.show(options)`
* `Operators.log(options)`
* `Operators.flush(options)`
* `Operators.flushAll(options)`

---

### Connection

API to communicate with monitors

_(TODO)_

* `Connection.getNames(options)`
* `Connection.getByName(name, options)`
* `Connection.getState(name, options)`
* `Connection.getAllInstances(options)`
* `Connection.flushOffline()`
* `connection#getState(instanceId)`
* `connection#restart()`
* `connection#reload(options)`
* `connection#scale(number)`
* `connection#flush()`
* `connection#disconnect()`
* `connection#requestStopServer(options)`

---

### Commands

`pot-js` commands descriptor. Useful to extend or modify command via `createCli()`

_(TODO)_

---

### createCli()

A helper function to create CLI, built on top of [yargs](https://github.com/yargs/yargs)

_(TODO)_

---

### Schemas

Config and CLI json schemas

_(TODO)_

## License

MIT
