# cncjs-pendant-keyboard-customizable
*A smart and powerful solution to build up your own customizable CNCjs remote controller.*

Based on the [node-exclusive-keyboard](https://www.npmjs.com/package/exclusive-keyboard) keylogger you can use a normal keyboard exclusively as remote.

That means, take a keyboard and define for every key event by our own.
Unlock CNCjs, move the spindel, send commands, run macros, build up own functions with an internal data storage.


## Installation
// TODO: describe installation
```
npm install
```

## Usage
Run `bin/cncjs-pendant-boilerplate` to start the interactive client. Pass --help to `cncjs-pendant-boilerplate` for more options.

```
bin/cncjs-pendant-boilerplate --help
```



## Configuration

Now starts the interesting part. Let us build a config and see what opportunities we have.

### The config file
All configurations are stored withing the directory `/config`.
If you don't set the `--config` option the file `default.js` will load. The file doesn't exist.

You can modify the default config or create your own one.

### Config Boilerplate
Use the `ConfigBuilder` class to create easily a new config.

The minimal config looks like:
````javascript
const ConfigBuilder = require('../utils/cnckeyboard/config/ConfigBuilder')
const {grblRelativeMovement, grblAbsoluteMovement, limitValue} = require('../utils/cnckeyboard/config/Utils')
const config = new ConfigBuilder()

// insert some mindblowing key events! 🤯🤪

module.exports = config
````

This example is very boring and do nothing, but we have the basic setup!

### Events
The main purpose of this pendant is to send events to CNCjs. To define events the `ConfigBuilder` provides us the method `addEvent()`.

#### Define a `event`
The first parameter defines the `event` string it consists of two parts the required one **key identifier** and the optional **event type**. They are separated by `:`.

```
 key identifier
|-------------|
<keyId|keyCode>[:(keypressed|keyup|keydown)]
               |---------------------------|
                        event type
```

##### key identifier
You can use to access a key event by there code(it's a number) or id(a string like `KEY_ESC`).

##### event type
You can choose three event types to interact with: `keypress`, `keyup`, `keydown`.

ℹ️ My keyboard only emits the two types `keypress` and `keyup`.

If no type is defined (e.g. `KEY_ESC`) the event triggers on every key event.
To select a specific type modify the expression like `KEY_ESC`.

##### How to check the key identifier or event type
To see what id, code or event type your keyboard emits start the pendant with the `--verbose` option.

Ok, up to now it was dead simple.


#### Define a boring event
````javascript
config.addEvent('KEY_ESC:keypressed',
  () => console.log('Do nothing... 😴'),
  'I\'m a optional description what\'s happend here.')
````

This event will trigger on the **keypress** of the **ESC** key and prints a boring console log message.
The `description` parameter wan't to increase the readability of the config and is used within the logging of the pendant.

#### The POWER of the `callback`
It's the central point part of the event to do some suff. The `callback` will fired on the defined event.

The power comes with the `context` parameter which gives you access to the following properties:

##### Key related
`keyId: string` - named key identifier of the triggert key e.g.: KEY_ESC

`keyCode: number`- number of the triggert key

`event: 'keypressed'| 'keyup' | 'keydown` – type of the triggered event

`dev: string` – device path of the keyboard

`value: boolean` – state of the triggered key

##### Additional Features
`$socket: socket` – socket instance of CNCjs

`$emit: emitSocket` – wrapper to emit an event to CNCjs. The port parameter is already set!

`$write: emitSocketWrite` – wrapper to emit a write event to CNCjs. The port and event parameter is already set!

`$port: string` – port of the connected CNC

`$global: Object` – access to the global data instance

`$getKeyState: getKeyState` – read the current value of a key

#### Examples

##### CNCjs commands
Send command to CNCjs - default
```javascript
config.addEvent('KEY_ESC:keypressed',
    ({ $socket, $port }) => $socket.emit('command', $port, 'reset'),
    'Send the RESET comant to CNCjs on the basic way.')
```

Send command to CNCjs - shorthand
```javascript
config.addEvent('KEY_ESC:keypressed',
    ({ $emit }) => $emit('command', 'reset'),
    'The same as above only shorter')
```

##### write grbl
Write grbl code
```javascript
config.addEvent('KEY_ESC:keypressed',
    ({ $write }) => $write('$H'),
    'Write one line grbl code to the cnc - Homing')
```

Write multiline grbl code
```javascript
config.addEvent('KEY_ESC:keypressed',
    ({ $write }) => $write(['G91', 'G0 X10', 'G90']),
    'Write a multiline comand to the cnc - Move the x axis')
```

Turn on the spindel as long the key is pressed
```javascript
config.addEvent('KEY_ESC:keypressed',
    ({ $write }) => $write('M3 S1000'),
    'Set spindel ON')

config.addEvent('KEY_ESC:keypressed',
  ({ $write }) => $write('M5'),
  'Set spindel OFF')
```

Home axis if homing key is pressed else move axis 
```javascript
config.addEvent('KEY_LEFT:keypressed',
    ({ $write, $getKeyState }) => $getKeyState('KEY_1') ? $write('$HX') : $write(['G91', 'G0 X10', 'G90']),
    'Move x axis or if homing key is pressed home x axis')
```

##### macros
You can also call macros you defined within CNCjs

⚠️ Do not confuse MID with Macros widget.

To get the `macro-id` have a look to the `macro`-property in the `.cncrc` file located within your home directory.
```javascript
config.addEvent('KEY_KPMINUS:keypress',
    ({$emit}) => $emit('command', 'macro:run', 'cfc7acb0-0a3b-80ab-a7d3-8056b8c5f560'),
    'Run Macro: Home XY')
```

### $global
To give you a more flexible way to build up events you can use the `$global` object to interact between events.

At first you have to define and initialize the global object with the needed structure.
```javascript
config.setGlobal({
  step: 1,
  stepMaxZ: 10,
})
```

Now you can use it within the event callback.
```javascript
// define 3 keys to set the step size
config.addEvent('KEY_1:keypressed',
    ({ $global }) => $global.step = 1,
    'Set step size to 1mm')

config.addEvent('KEY_2:keypressed',
  ({ $global }) => $global.step = 10,
  'Set step size to 10mm')

config.addEvent('KEY_3:keypressed',
  ({ $global }) => $global.step = 20,
  'Set step size to 20mm')

// define the x axis movement
config.addEvent('KEY_LEFT:keypressed',
  ({ $write, $global }) => $write(['G91', `G0 X${$global.step}`, 'G90']),
  'Move x axis by step size')

// define the z axis with max restriction
config.addEvent('KEY_LEFT:keypressed',
  ({ $write, $global }) => $write(['G91', `G0 Z${$global.step > $global.stepMaxZ ? $global.stepMaxZ : $global.step }`, 'G90']),
  'Move z axis by step size but not more than 10mm')

```
### BuildConfig Utils
On top the `Utils` class beside the ConfigBuilder provides some convenient methods.


 



## Sources of Commands
- https://github.com/cncjs/cncjs/wiki/Controller-API
- https://github.com/cncjs/cncjs-controller/blob/master/src/controller.js#L213
