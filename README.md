# pot-js

Script runner

## Table of Contents

<!-- MarkdownTOC -->

- [Features](#features)
- [Installing](#installing)
- [CLI Reference](#cli-reference)
- [Node.js module API Reference](#nodejs-module-api-reference)
  - [start\(\[options\]\)](#startoptions)
  - [stop\(\[options\]\)](#stopoptions)
  - [list\(\[options\]\)](#listoptions)
  - [log\(\[options\]\)](#logoptions)
  - [dir\(\[options\]\)](#diroptions)
- [License](#license)

<!-- /MarkdownTOC -->

<a name="features"></a>
## Features

- Automatically restart process if it crashes
- Provides both CLI and Node.js module API
- Supports namespace
- Built-in powerful logger system


<a name="installing"></a>
## Installing

```bash
$ npm install pot-js
```

For global CLI command, please add `-g` option

```bash
$ npm install -g pot-js
```


<a name="cli-reference"></a>
## CLI Reference

```bash
pot <command> [args]

Commands:
  start [entry]  Start process
  stop [name]    Stop process
  list           List processes                [aliases: ls]
  log [name]     Show log
  dir [name]     Show dir

Options:
  --version   Show version number                  [boolean]
  -h, --help  Show help                            [boolean]
```

<a name="nodejs-module-api-reference"></a>
## Node.js module API Reference

<a name="startoptions"></a>
#### start([options])

Spawn a process

###### Options

- `name` (String): Process monitor name. Defaults to the basename of `process.cwd()`.
- `workspace` (String): Workspace.
- `entry` (String): Defining the source script. Defaults to `./index.js`.
- `execArgs` (String|[String]): Executing arguments. Defaults to `[]`.
- `execCommand` (String): Executing command. Defaults to `process.execPath`, which returns the absolute pathname of the executable that started the Node.js process. i.e. `/usr/local/bin/node`.
- `inspect` (Boolean|String|Object): Enable [node inspector](https://nodejs.org/api/cli.html#cli_inspect_host_port). Defaults to `false`.
- `enableLog` (Boolean): Enable log. Defaults to `true`.
- `logLevel` (String|Object): Defining log level. See [pot-logger](https://github.com/cantonjs/pot-logger) for detail. Here are available levels:
  - ALL
  - TRACE
  - DEBUG (default in `development` mode)
  - INFO (default in `production` mode)
  - WARN
  - ERROR
  - FATAL
  - OFF
- `logsDir` (String): Defining log files directory. If `daemon` mode actived, log messages will write to some `.log` files. Defaults to `.logs`.
- `maxRestarts` (Number): Defining max restarts if crashed. Defaults to `-1` (`-1` equals to `Infinity`) in `production` mode, `0` in `development` mode.
- `monitorProcessTitle` (String): Monitor process title. Defaults to "node".
- `daemon` (Boolean): Enable `daemon` mode. Notice: to kill `daemon` process, please run `claypot stop ${name}`. Defaults to `false`.
- `production` (Boolean): Enable `production` mode. Defaults to `false`.
- `env` (Object): Defining custom environments. Defaults to `process.env`.
- `cwd` (String): Defining the current working directory. Defaults to `process.cwd()`.
- `watch` (Boolean|Object): Enable watch mode. Defaults to `false`. Here are available props for object config:
  - `enable` (Boolean): Enable `watch`. Defaults to `true`.
  - `dirs` (String|[String]): Defining watching directories.
  - `ignoreDotFiles` (Boolean): Ignore watching `.*` files. Defaults to `true`.
  - `ignoreNodeModulesDir` (Boolean): Ignore watching `node_modules` directory. Defaults to `true`.
- `configToEnv` (String): Setting an env name and pass the config json string to child process `env`.

---

<a name="stopoptions"></a>
#### stop([options])

Stop a process

###### Options

- `name` (String): Target process name.
- `workspace` (String): Workspace.
- `force` (Boolean): Force stopping without confirmation. Defaults to `false`.

---

<a name="listoptions"></a>
#### list([options])

List running processes

###### Options

- `workspace` (String): Workspace.

---

<a name="logoptions"></a>
#### log([options])

Displaying the last part of a process log files

- `name` (String): Target process name.
- `workspace` (String): Workspace.
- `category` (String): The category of log files.
- `line` (Number): The max lines of log messages. Defaults to 200.

---

<a name="diroptions"></a>
#### dir([options])

Displaying the directory of a pot process project.

- `name` (String): Target process name.
- `workspace` (String): Workspace.

---


<a name="license"></a>
## License

MIT
