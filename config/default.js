const ConfigBuilder = require('../utils/CncjsKeyboardConfigBuilder')
const { grblRelativeMovement, grblAbsoluteMovement, limitValue } = require('../utils/CncjsKeyboardConfigBuilderUtils')
const config = new ConfigBuilder()

config.setGlobal({
  step: 1,
  stepMaxZ: 10,
  vacuumState: false,
})


// Main controls
config
  .addEvent('KEY_BACKSPACE:keypress',
    ({ $emit }) => $emit('command','reset'),
    'Reset'
  )
  .addEvent('KEY_EQUAL:keypress',
    ({ $emit }) => $emit('command','unlock'),
    'Unlock'
  )
  .addEvent('KEY_TAB:keypress',
    ({ $emit }) => $emit('command','sleep'),
    'Sleep'
  )
  .addEvent('KEY_SYSRQ:keypress',
    ({ $emit }) => $emit('command', 'feedhold'),
    'Feedhold'
  )
  .addEvent('KEY_ESC:keypress',
    ({ $emit }) => $emit('command', 'gcode:start'),
    'GCode Start'
  )


// Movment
config
  .addEvent('KEY_8:keypress',
  ({ $write, $global }) => $write(grblRelativeMovement({ y: $global.step })),
    'Move Axis: Y+'
  )
  .addEvent('KEY_2:keypress',
    ({ $write, $global }) => $write(grblRelativeMovement({ y: -$global.step })),
    'Move Axis: Y-'
  )
  .addEvent('KEY_6:keypress',
    ({ $write, $global }) => $write(grblRelativeMovement({ x: $global.step })),
    'Move Axis: X+'
  )
  .addEvent('KEY_4:keypress',
    ({ $write, $global }) => $write(grblRelativeMovement({ x: -$global.step })),
    'Move Axis: X+'
  )
  .addEvent('KEY_5:keypress',
    ({ $write }) => $write(grblAbsoluteMovement({ x: 0, y: 0 })),
    // ({ $write }) => $write([
    //   'G0 X0 Y0'
    // ]),
    'Move Axis: XY to 0'
  )
  .addEvent('KEY_7:keypress',
    ({ $write, $global }) => $write(grblRelativeMovement({ x: -$global.step, y: $global.step })),
    'Move Axis: X-Y+'
  )
  .addEvent('KEY_1:keypress',
    ({ $write, $global }) => $write(grblRelativeMovement({ x: -$global.step, y: -$global.step })),
    'Move Axis: X-Y-'
  )
  .addEvent('KEY_9:keypress',
    ({ $write, $global }) => $write(grblRelativeMovement({ x: $global.step, y: $global.step })),
    'Move Axis: X+Y+'
  )
  .addEvent('KEY_3:keypress',
    ({ $write, $global }) => $write(grblRelativeMovement({ x: $global.step, y: -$global.step })),
    'Move Axis: X+Y-'
  )
  .addEvent('KEY_KPPLUS:keypress',
  ({ $write, $global }) => $write(grblRelativeMovement({ z: limitValue($global.step, { max: $global.stepMaxZ }) })),
    'Move Axis: Z+'
  )
  .addEvent('KEY_COMMA:keypress',
  ({ $write, $global }) => $write(grblRelativeMovement({ z: -limitValue($global.step, { max: $global.stepMaxZ }) })),
    'Move Axis: Z-'
  )

  // Steps
  config
    .addEvent('KEY_INSERT:keypress',
      ({ $global }) => $global.step = 1,
      'Set step width to 1mm'
    )
    .addEvent('KEY_HOME:keypress',
      ({ $global }) => $global.step = 2,
      'Set step width to 2mm'
    )
    .addEvent('KEY_PAGEUP:keypress',
      ({ $global }) => $global.step = 5,
      'Set step width to 5mm'
    )
    .addEvent('KEY_DELETE:keypress',
      ({ $global }) => $global.step = 10,
      'Set step width to 10mm'
    ) 
    .addEvent('KEY_END:keypress',
      ({ $global }) => $global.step = 20,
      'Set step width to 20mm'
    )
    .addEvent('KEY_PAGEDOWN:keypress',
      ({ $global }) => $global.step = 50,
      'Set step width to 50mm'
    )


    // Makros
    config
      .addEvent('KEY_KPSLASH:keypress',
        ({ $emit }) => $emit('command', 'macro:run', '2a08d8c7-2e42-4d47-930b-8bf562c36e6d'),
        'Run Macro: Home XY'
      )
      .addEvent('KEY_KPASTERISK:keypress', 
      ({ $write }) => $write([
          'G92 X0',
          'G92 Y0',
        ]),
        'Set Offset XY to 0'
      )
      .addEvent('KEY_KPMINUS:keypress',
      ({ $emit }) => $emit('command', 'macro:run', 'cfc7ccb0-0a3b-40bc-a7d3-8056b8c5f560'),
        'Run Macro: Home XY'
        // ({ $write }) => $write([
        //   '; Z-Probe',
        //   'G91',
        //   'G38.2 Z-20 F20',
        //   'G90',
        //   '; Set the active WCS Z0',
        //   'G10 L20 P1 Z5',
        //   '; Retract from the touch plate',
        //   'G91',
        //   'G0 Z10',
        //   'G90',
        // ]),
        // 'Touch Probe 5mm'
      )
    // TODO: NOT WORING!
    // config
    //   // Touch probe 5mm
    //   .addEvent('KEY_KPSLASH:keypess', ({ $emit }) => $emit('command', 'macro:run', '377f0ec1-22fa-497e-8862-7062b85222bd', '', (args) = console.log('callback', ...args)))
    //   // Set Offset XY
    //   .addEvent('KEY_KPASTERISK:keypess', ({ $emit }) => $emit('command', 'macro:run', '6939a850-7ea4-4981-be3d-5a2388e66014'))


    // Spindel
    config
      .addEvent('KEY_UP:keypress',
          ({ $write }) => $write('M3 S1000'),
          'Set Spindel ON'
      )
      .addEvent('KEY_DOWN:keypress',
          ({ $write }) => $write('M5'),
          'Set Spindel OFF'
      )

      // Vacuum
      config
        .addEvent('KEY_LEFT:keypress',
          ({ $write, $global }) => {
            $global.vacuumState = !$global.vacuumState
            $write($global.vacuumState ? 'M7' : 'M9')
          },
          'Toggle Vacuum'
        )

module.exports = config
