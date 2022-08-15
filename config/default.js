const ConfigBuilder = require('../utils/cnckeyboard/config/ConfigBuilder')
const config = new ConfigBuilder()

// Create global variables
// config.setGlobal({
//   step: 1,
// })

// Create a new event
// config
//   .addEvent('KEY_BACKSPACE:keypress',
//     ({$emit}) => $emit('command', 'reset'),
//     'Reset')

module.exports = config
