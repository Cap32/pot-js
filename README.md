# pot-js

Script runner

## Table of Contents

<!-- MarkdownTOC -->

- [Features](#features)
- [Installing](#installing)
- [Usage](#usage)
    - [CLI](#cli)
    - [Node.js module API](#nodejs-module-api)
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


<a name="usage"></a>
## Usage

<a name="cli"></a>
### CLI

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

<a name="nodejs-module-api"></a>
### Node.js module API

- start([options])
- stop([options])
- list([options])
- log([options])
- dir([options])


<a name="license"></a>
## License

MIT
