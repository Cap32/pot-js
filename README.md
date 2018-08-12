# pot-js

[![Build Status](https://travis-ci.org/Cap32/pot-js.svg?branch=master)](https://travis-ci.org/Cap32/pot-js)

Process management module

![logger](./screenshot.gif)

## Table of Contents

- [Table of Contents](#table-of-contents)
- [Motivation](#motivation)
- [Features](#features)
- [Installing](#installing)
- [CLI Reference](#cli-reference)
- [Node.js module API Reference](#nodejs-module-api-reference)
  - [Pot.exec([options])](#potexecoptions)
  - [Pot.getNames()](#potgetnames)
  - [Pot.getList()](#potgetlist)
  - [Pot.getByName(name, options)](#potgetbynamename-options)
  - [Pot.getStateList(name, options)](#potgetstatelistname-options)
  - [Pot.flushOffline(options)](#potflushofflineoptions)
  - [pot.createCli(pkg, commands)](#potcreateclipkg-commands)
  - [pot.Commands](#potcommands)
  - [pot.Operators](#potoperators)
  - [pot.Schemas](#potschemas)
  - [pot#getStateList()](#potgetstatelist)
  - [pot#restart()](#potrestart)
  - [pot#reload(options)](#potreloadoptions)
  - [pot#scale(number)](#potscalenumber)
  - [pot#size()](#potsize)
  - [pot#flush()](#potflush)
  - [pot#disconnect()](#potdisconnect)
  - [pot#requestShutDown(options)](#potrequestshutdownoptions)
- [License](#license)

## Motivation

[forever](https://github.com/foreverjs/forever) and [pm2](https://github.com/Unitech/pm2) are great third-party process management tools, but they are not module friendly. Saying if you are writing a CLI service tool, you may need to built-in a process management module for handling process monitor, run as a daemon, stop, scale, reload, and then you could just focus on developing your service logic. So I created this module.

## Features

- Automatically restart process if it crashes. Like [forever](https://github.com/foreverjs/forever)
- Able to scale or reload instances with zero down time. Like [pm2](https://github.com/Unitech/pm2)
- Provides both CLI and Node.js module API
- Supports isolated workspaces
- User friendly interactive CLI
- Easy to extend
- Built-in powerful logger system

## Installing

```bash
$ npm install pot-js
```

For global CLI command, please add `-g` option

```bash
$ npm install -g pot-js
```

## CLI Reference

```config
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

### Pot.exec([options])

Spawn and monitor a process. Returns a promise of a `Pot` instance.

##### Options

- `args` (String|String[]): List of string arguments. Defaults to `[]`.
- `baseDir` (String): The base directory for resolving modules or directories. Defaults to the `current working directory`.
- `cluster` (Boolean): Enforce using cluster mode. If not set, it will automatically set to `true` when spawning a Node.js related process.
- `config` (String): Path to the config file. Defaults to `.potrc`.
- `cwd` (String): Current working directory. Defaults to `process.cwd()`.
- `daemon` (Boolean): Run as a daemon. Defaults to `false`.
- `entry` (String): Entry script path. Defaults to `./index.js`.
- `env` (Object): Environment variables object. Defaults to `process.env`.
- `events` (Object): Defining scripts by event hooks. Like `scripts` in `package.json`. Here are available event hooks:
  - `spawn`: New child process has been spawned
  - `start`: The monitor has started
  - `stop`: The monitor has fully stopped and the process is killed
  - `crash`: The monitor has crashed (too many restarts or spawn error)
  - `sleep`: The monitor is sleeping
  - `exit`: Child process has exited
  - `stdout`: Child process stdout has emitted data
  - `stderr`: Child process stderr has emitted data
  - `warn`: Child process has emitted an error
- `execArgs` (String|String[]): Execution arguments. Defaults to `[]`.
- `execPath` (String): Execution Path. Defaults to `process.execPath`, which returns the absolute pathname of the executable that started the Node.js process. i.e. `/usr/local/bin/node`.
- `force` (Boolean): Enforce restart even if the process is exists. Defaults to `false`.
- `inspect` (Boolean|String|Object): Enable [node inspector](https://nodejs.org/api/cli.html#cli_inspect_host_port). Require Node.js >= v6.3.0. Defaults to `false`.
- `instances` (Number): Cluster instances. Defaults to `1`.
- `logLevel` (String|Object): Log level. See [pot-logger](https://github.com/cantonjs/pot-logger) for detail. Here are available levels:
  - ALL
  - TRACE
  - DEBUG (default in `development` mode)
  - INFO (default in `production` mode)
  - WARN
  - ERROR
  - FATAL
  - OFF
- `logsDir` (String): Log files directory. In `daemon` mode, log messages will write to some `.log` files.
- `maxRestarts` (Number): How many restarts are allowed within 60s.
- `monitorProcessTitle` (String): Monitor process title. Defaults to "node".
- `name` (String): Process monitor name. Should be unique. Defaults to the basename of `baseDir`.
- `production` (Boolean): Production mode. Short hand for setting NODE_ENV="production" env. Defaults to `true`.
- `watch` (Boolean|Object): Enable watch mode. Defaults to `false`. Here are available props for object config:
  - `enable` (Boolean): Enable `watch`. Defaults to `true`.
  - `dirs` (String|String[]): Defining watching directories.
  - `ignoreDotFiles` (Boolean): Ignore watching `.*` files. Defaults to `true`.
  - `ignoreNodeModulesDir` (Boolean): Ignore watching `node_modules` directory. Defaults to `true`.
- `workspace` (String): Workspace.

---

### Pot.getNames()

Get all running `pot` names. Returns a promise of array.

### Pot.getList()

Get all running `pot` instances. Returns a promise of array.

### Pot.getByName(name, options)

Get `pot` by name. Returns a promise of `Pot` instance.

### Pot.getStateList(name, options)

Get `pot` state list by name. Returns a promise of state array.

### Pot.flushOffline(options)

Flush offline processes (pid and log files).

### pot.createCli(pkg, commands)

A helper function to create CLI, built on top of [yargs](https://github.com/yargs/yargs)

#### Arguments

- `pkg` (Object|Function): An object that should contains `name` and `version` props. Could also be a function that returns an object.
- `commands` (Object): A key/value object. Each value should be an object that contains `command`, `description`, `schema` and `operator`. Checkout [pot.Commands](#potcommands) to learn more.

#### Example

**bin/app**

```js
#!/usr/bin/env node

import Pot from "pot-js";
import pkg from "./package.json";

Pot.createCli(pkg, Pot.Commands);
```

### pot.Commands

`pot-js` commands descriptor. Useful to create or extend CLI via `createCli(pkg, commands)`

A command may contain these props:

- `command` (String): A string representing the command. eg: `stop [name]`
- `description` (String): Command description
- `schema` (Object): The JSON schema of options and positional arguments. eg: `Pot.Schema.stop`
- `operator` (Function): The operator function of the command. eg: `Pot.Operators.stop`

### pot.Operators

Command lines interface helper functions

- `Operators.start(options)`
- `Operators.restart(options)`
- `Operators.restartAll(options)`
- `Operators.reload(options)`
- `Operators.reloadAll(options)`
- `Operators.stop(options)`
- `Operators.stopAll(options)`
- `Operators.scale(options)`
- `Operators.list(options)`
- `Operators.show(options)`
- `Operators.log(options)`
- `Operators.flush(options)`
- `Operators.flushAll(options)`

### pot.Schemas

Config and CLI json schemas

### pot#getStateList()

Get pot state list

### pot#restart()

Restart

### pot#reload(options)

Reload

### pot#scale(number)

Scale

### pot#size()

Get instances size

### pot#flush()

Flush pid and log files

### pot#disconnect()

Disconnect

### pot#requestShutDown(options)

Request to shut down

---

## License

MIT
