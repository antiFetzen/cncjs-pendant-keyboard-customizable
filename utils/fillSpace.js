const fillSpace = (value, width, options = {}) => {
  const { filler, prepend } = {
    filler: ' ',
    prepend: false,
    ...options,
  }

  value = value.toString()

  const count = width - value.length

  const filled = filler.repeat(count > 0 ? count : 0)
  
  return prepend
    ? filled + value
    : value + filled
}

module.exports = fillSpace