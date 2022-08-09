
/**
 * build a command list to move a relative distance.
 * (no comand/line endings like `;\n`)
 * @param {object} movement 
 * @property {number} x distance x axis
 * @property {number} y distance y axis
 * @property {number} z distance z axis
 * @returns string[]
 * @example
 * ['G91', 'G0 X1 Z-2', 'G90']
 */
const parseMovementList = (movement = { x: null, y: null, z: null }) => ['x', 'y', 'z']
.map(axis => ((v) => Number.isNaN(Number(v))? undefined : `${axis.toUpperCase()}${Math.floor(v)}`)(movement[axis]))
.filter(i => i)

const grblRelativeMovement = (movement = { x: null, y: null, z: null }) => {
  const movementList = parseMovementList(movement)
      
  return movementList.length
    ? [
      'G91',
      `G0 ${movementList.join(' ')}`,
      'G90',
    ]
    : `; grbRelativeMovement could not parse the input: ${movement} `
}

/**
 * build a command list to move to a absolute position.
 * (no comand/line endings like `;\n`)
 * @param {object} movement 
 * @property {number} x position x axis
 * @property {number} y position y axis
 * @property {number} z position z axis
 * @returns string[]
 * @example
 * ['G90', 'G0 X1 Z-2', 'G90']
 */
const  grblAbsoluteMovement = (movement = { x: null, y: null, z: null }) => {
  const movementList = parseMovementList(movement)
      
  return movementList.length
    ? [
      'G90',
      `G0 ${movementList.join(' ')}`,
      'G90',
    ]
    : `; grblAbsolutMovement could not parse the input: ${movement} `
}

/**
 * Set the valute to the given limit if out of range.
 * @param {number} value number to check 
 * @param {object} limits 
 * @property {number | null} min lower limit - if `null` no check will happend
 * @property {number | null} max upper limit - if `null` no check will happend
 * @returns 
 */
const limitValue = (value, limits) => {
  const { min, max } = {
    min: null,
    max: null,
    ...limits,
  }

  if (!Number.isNaN(Number(min)) && value < min) value = min
  if (!Number.isNaN(Number(max)) && value > max) value = max
  
  return value
}

module.exports = {
  grblRelativeMovement,
  grblAbsoluteMovement,
  limitValue,
} 