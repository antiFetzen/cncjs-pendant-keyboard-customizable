const ExclusiveKeyboard = require('exclusive-keyboard')
const fillSpace = require('../fillSpaces')

const KEY_EVENTS = ['keyup', 'keydown', 'keypress']


/**
 * @typedef {Object} KeyEventContext
 * @property {number} keyCode number of the key
 * @property {string} keyId name of the key e.g. 'KEY_ESG'
 * @property {string} type event type: ['keypress'|'keyuo'|'keydown']
 * @property {string} dev device path
 */

/**
 * @typedef {Object} CNCjsKeyboardOptions
 * @property {boolean} exclusive set if the device should exclusive used vor CNCjsKeyboard (default: true)
 * @property {boolean} verbose print verbose event options (default: true)
 */

/**
 * @typedef {Object} CNCjsKeyboardEventContext
 * @property {socket} $socket socket instance of CNCjs
 * @property {emitSocket} $emit wrapper to emit an event to CNCjs. The port parameter is already set!
 * @property {emitSocketWrite} $write wrapper to emit a write event to CNCjs.
 * The port and event parameter is already set!
 * @property {string} $port port of the connected CNC
 * @property {Object} $global access to the global data instance
 * @property {getKeyState} $getKeyState read the current value of a key
 * @property {string} keyId named key identifier of the triggert key e.g.: `KEY_ESC`
 * @property {number} keyCode number of the triggert key
 * @property {KEY_EVENTS} event type of the triggered event
 * @property {string} dev device path of the keyboard
 * @property {boolean} value state of the triggered key
 */

class CNCjsKeyboard extends ExclusiveKeyboard {
  /** store the current key states */
  keyStates = {}

  /** global storage between events */
  global = {}

  /**
   * CNCjsKeyboard constructor
   * @param {string} device path of the device after `/dev/input/`
   * @param {socket} socket parent reference of cncjs-pendant to `socket` object
   * @param {string} port parent reference of cncjs-pendant `port`
   * @param {string | ConfigBuilder} config config name(within directory `/config/`, without extension `.js`) or config class (default: 'default')
   * @param {CNCjsKeyboardOptions} options
   */
  constructor(device, socket, port, config, options) {
    const {exclusive, verbose} = {
      exclusive: true,
      verbose: false,
      ...options,
    }

    super(device, exclusive)

    this.socket = socket
    this.port = port

    KEY_EVENTS.forEach(eventName => this.on(eventName, this.emitKeyEvent(eventName)))

    if (verbose) this.createVerboseEventListeners()

    if (config) this.processConfig(config)
  }

  /**
   * Validate the config data
   * @param {ConfigBuilder} config
   */
  validateConfig(config) {
    if (typeof config !== 'object') throw new Error('The config is not of the type "object"!')

    if (!config.hasOwnProperty('global')) throw new Error(`The property "global" was not found!`)

    if (!config.hasOwnProperty('events')) throw new Error(`The property "events" was not found!`)
    if (!Array.isArray(config.events)) throw new Error(`The property "events" have to be a array!`)


    const validateEventItemProperty = (item, index, propertyName, type) => item.hasOwnProperty(propertyName)
      ? typeof item[propertyName] === type || `events[${index}].${propertyName} | Type "${typeof item[propertyName]}" doesn't match type "${type}"!`
      : `events[${index}].${propertyName} |  Does not exist!`

    const eventValidation = config.events
      .map((item, index) => [
        validateEventItemProperty(item, index, 'event', 'string'),
        validateEventItemProperty(item, index, 'callback', 'function'),
      ])
      .flat()
      .filter(i => i !== true)

    if (eventValidation.length) throw new Error('Validation of the events failed:\n' + eventValidation.map(i => ' - ' + i).join('\n'))
  }

  /**
   * Read a config file within the config directory `./config/<filename>`(without extension `.js`)
   * @param {string} configName name of the config file (without extension)
   */
  readConfigFile(configName = 'default') {
    try {
      return require(`../../config/${configName}`)
    } catch (e) {
      if (e.code === 'MODULE_NOT_FOUND') throw new Error(`CNCjsKeyboard config module "./config/${configName}.js" could not found or open!
      Please check the file or create it.
      You can finde more details within the README.md.`)

      throw e
    }
  }

  /**
   * Read, validate and process the config
   * @param {string | ConfigBuilder} config
   */
  processConfig(config) {
    if (typeof config === 'string') config = this.readConfigFile(config)

    this.validateConfig(config)

    // set global object
    this.global = config.global || {}

    // register event listeners
    config.events.forEach(({event, callback, description}) => this.on.call(this, event, (...args) => {
      console.info(`Triggered Event: ${fillSpace('[' + event + ']', 25)} - ${description}`)
      return callback.call(this, ...args)
    }))
  }

  /**
   * Helper function to print verbose event log
   * @param {KeyEventContext} data Key event data for: 'keyup', 'keydown', 'keypress'
   */
  printVerboseKeyEvent({keyCode, keyId, type}) {
    console.info(`Event: ${fillSpace(type, 10)} => #${fillSpace(keyCode, 3, {prepend: true})} [${keyId}]`)
  }

  /**
   * Register all available events for verbose logging
   */
  createVerboseEventListeners() {
    this.on('keyup', this.printVerboseKeyEvent)
    this.on('keydown', this.printVerboseKeyEvent)
    this.on('keypress', this.printVerboseKeyEvent)
    this.on('close', this.printVerboseKeyEvent)
    this.on('error', console.error)
  }

  /**
   * Store the current state of the emitted key
   * @param {string} id `keyId` of the event data
   * @param {number} code `keyCode` of the event data
   * @param {boolean} value Key state `true`: pressed; `false`: released
   */
  setKeyState(id, code, value) {
    this.keyStates[id] = this.keyStates[code] = value
  }

  /**
   * Return the state of the current key event
   * @param {string |number} key `keyId` or `keyCode`
   * @returns boolean
   */
  getKeyState(key) {
    return this.keyStates[key]
  }

  /**
   * Shorthand version of the socket emit method with prefilled port
   * @param {string} event Name of the event
   * @param  {...any} args
   */
  emitSocket(event, ...args) {
    this.socket.emit(event, this.port, ...args)
  }

  /**
   * Special helper to send commands on the `write` event.
   * It should help you to emit on a short way a list of commands
   * @param {string | string[]} commandList
   * @param {boolean} addLineEnding if `true`(default) at the end of every item will append `;\n`
   */
  emitSocketWrite(commandList, addLineEnding = true) {
    // create array if commandList is only single item
    if (!Array.isArray(commandList)) commandList = [commandList]

    commandList
      .map(i => addLineEnding ? i + ';\n' : i)
      .forEach(command => this.emitSocket('write', command))
  }

  /**
   * Event emitter for the single key event.
   * This method emits for `keyId` and `keyCode` a general emitter and a type based one.
   * The following events are available:
   *  - `<keyId>` e.g.: `'KEY_ESC'`
   *  - `<keyId>:<eventType>` e.g.: `'KEY_ESC:keypress'`
   *  - `<keyCode>` e.g.: `'0'`
   *  - `<keyCode>:<eventType>` e.g.: `'0:keypress'`
   * @param {string} eventName
   * @returns function(KeyEventContext)
   */
  emitKeyEvent(eventName) {
    return function ({keyId, keyCode, type, dev}) {
      const value = eventName === 'keyup' ? false : true
      this.setKeyState(keyId, keyCode, value)

      const ctx = {
        $socket: this.socket,
        $emit: (...args) => this.emitSocket.call(this, ...args),
        $write: (...args) => this.emitSocketWrite.call(this, ...args),
        $port: this.port,
        $global: this.global,
        $getKeyState: (...args) => this.getKeyState.call(this, ...args),
        keyId,
        keyCode,
        event: type,
        dev,
        value,
      }

      const events = [
        `${keyId}:${eventName}`,
        `${keyId}`,
        `${keyCode}:${eventName}`,
        `${keyCode}`,
      ]

      events.forEach(event => this.emit(event, ctx))
    }
  }
}

module.exports = CNCjsKeyboard
