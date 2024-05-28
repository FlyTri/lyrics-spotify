const log = (name, type, color, ...text) =>
  console.log(
    `%c ${name} %c %c ${type} `,
    "background: purple; color: white; font-weight: bold; border-radius: 5px;",
    "",
    `background: ${color}; color: black; font-weight: bold; border-radius: 5px;`,
    ...text
  );
