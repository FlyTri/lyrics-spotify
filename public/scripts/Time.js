let DateNow = () => Date.now();

fetch("https://worldtimeapi.org/api/ip")
  .then((response) =>
    response.json().then((data) => {
      const offset = Date.now() - new Date(data.datetime).getTime();

      DateNow = () => Date.now() - offset;
      log("TIME", "Sync success", "aqua", offset);
      console.log(now());
    })
  )
  .catch((error) => log("TIME", "Sync failed", red, error.message));
