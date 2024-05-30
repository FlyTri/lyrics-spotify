let DateNow = () => Date.now() + localStorage.getItem("count");

fetch("https://worldtimeapi.org/api/ip")
  .then((response) =>
    response.json().then((data) => {
      const offset = Date.now() - new Date(data.datetime).getTime();

      DateNow = () => Date.now() - offset + localStorage.getItem("count");
      log("TIME", "Sync success", "aqua", offset);
    })
  )
  .catch((error) => log("TIME", "Sync failed", "red", error.message));
