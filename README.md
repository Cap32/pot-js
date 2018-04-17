# pot-js

[![Build Status](https://travis-ci.org/Cap32/pot-js.svg?branch=master)](https://travis-ci.org/Cap32/pot-js)

Script runner

## Table of Contents

<!-- TOC -->

* [Table of Contents](#table-of-contents)
* [Features](#features)
* [Installing](#installing)
* [CLI Reference](#cli-reference)
* [Node.js module API Reference](#nodejs-module-api-reference)
  * [start([options])](#startoptions)
    * [Options](#options)
  * [stop([options])](#stopoptions)
    * [Options](#options-1)
  * [stopall([options])](#stopalloptions)
    * [Options](#options-2)
  * [list([options])](#listoptions)
    * [Options](#options-3)
  * [log([options])](#logoptions)
  * [dir([options])](#diroptions)
* [License](#license)

<!-- /TOC -->

## Features

* Automatically restart process if it crashes
* Supports workspace
* Easy to run as a daemon on UNIX based systems
* Provides both CLI and Node.js module API
* Built-in powerful logger system
* Interactive CLI

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
  pot start [entry]  Spawn and monitor a process
  pot restart [name]  Restart a process
  pot restartall      Restart all processes
  pot stop [name]    Stop a process
  pot stopall        Stop all processes
  pot list           List processes                      [aliases: ls]
  pot log [name]     Show log
  pot dir [name]     Show dir

Options:
  --version   Show version number                            [boolean]
  -h, --help  Show help                                      [boolean]
```

## Node.js module API Reference

#### start([options])

Spawn and monitor a process.

###### Options

* `baseDir` (String): The base directory for resolving modules or directories. Defaults to the `current working directory`.
* `config` (String): Path to the config file Defaults to `.potrc`.
* `configToEnv` (String): Setting an env name and pass the config json string to child process `env`.
* `cwd` (String): Defining the current working directory. Defaults to `process.cwd()`.
* `daemon` (Boolean): Enable `daemon` mode. Notice: to kill `daemon` process, please run `pot stop ${name}`. Defaults to `false`.
* `entry` (String): Defining the source script. Defaults to `./index.js`.
* `env` (Object): Defining custom environments. Defaults to `process.env`.
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
* `execArgs` (String|[String]): Executing arguments. Defaults to `[]`.
* `execCommand` (String): Executing command. Defaults to `process.execPath`, which returns the absolute pathname of the executable that started the Node.js process. i.e. `/usr/local/bin/node`.
* `inspect` (Boolean|String|Object): Enable [node inspector](https://nodejs.org/api/cli.html#cli_inspect_host_port). Defaults to `false`.
* `logLevel` (String|Object): Defining log level. See [pot-logger](https://github.com/cantonjs/pot-logger) for detail. Here are available levels:
  * ALL
  * TRACE
  * DEBUG (default in `development` mode)
  * INFO (default in `production` mode)
  * WARN
  * ERROR
  * FATAL
  * OFF
* `logsDir` (String): Defining log files directory. If `daemon` mode actived, log messages will write to some `.log` files. Defaults to `.logs`.
* `maxRestarts` (Number): Defining max restarts if crashed. Defaults to `-1` (`-1` equals to `Infinity`) in `production` mode, `0` in `development` mode.
* `monitorProcessTitle` (String): Monitor process title. Defaults to "node".
* `name` (String): Process monitor name. Defaults to the basename of `baseDir`.
* `production` (Boolean): Enable `production` mode. Defaults to `true`.
* `watch` (Boolean|Object): Enable watch mode. Defaults to `false`. Here are available props for object config:
  * `enable` (Boolean): Enable `watch`. Defaults to `true`.
  * `dirs` (String|[String]): Defining watching directories.
  * `ignoreDotFiles` (Boolean): Ignore watching `.*` files. Defaults to `true`.
  * `ignoreNodeModulesDir` (Boolean): Ignore watching `node_modules` directory. Defaults to `true`.
* `workspace` (String): Workspace.

---

#### stop([options])

Stop a process.

###### Options

* `name` (String): Target process name.
* `workspace` (String): Workspace.
* `force` (Boolean): Force stopping without confirmation. Defaults to `false`.

---

#### stopall([options])

Stop all processes.

###### Options

* `workspace` (String): Workspace.
* `force` (Boolean): Force stopping without confirmation. Defaults to `false`.

---

#### list([options])

List processes.

###### Options

* `workspace` (String): Workspace.

---

#### log([options])

Displaying the last part of a process log files.

* `name` (String): Target process name.
* `workspace` (String): Workspace.
* `category` (String): The category of log files.
* `line` (Number): The max lines of log messages. Defaults to 200.

---

#### dir([options])

Displaying the directory of a pot process project.

* `name` (String): Target process name.
* `workspace` (String): Workspace.

---

## License

MIT
