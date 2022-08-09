class CncjsKeyboardConfigBuilder {
  constructor() {
    this.global = {}
    this.events = []
  }

  /**
   * Add a new event to the config.
   * @param {string} event name of the event <keyId|keyCode>[:keypressed|keyup|keydown]
   * @param {callback} callback define the callback for the event listener
   * @param {string} description define a description of the event for documentation purpose and a better log experiance
   */
  addEvent(event, callback, description = 'No Description') {
    this.events.push({ event, callback, description })

    return this
  }

  /**
   * Set the default global object. The data are accessable from every event listener.
   * @param {*} global 
   */
  setGlobal(global) {
    this.global = global

    return this
  }
}

module.exports = CncjsKeyboardConfigBuilder
