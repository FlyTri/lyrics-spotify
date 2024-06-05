const log = (name, type, color, text, ...args) =>
  console.log(
    `%c ${name} %c %c ${type} %c ${text}`,
    "background: purple; color: white; font-weight: bold; border-radius: 5px;",
    "",
    `background: ${color}; color: black; font-weight: bold; border-radius: 5px;`,
    "",
    ...args
  )
