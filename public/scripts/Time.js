let offset = 0;
let DateNow = () => Date.now() - offset + Number(localStorage.getItem("count"));

fetch("https://worldtimeapi.org/api/ip")
  .then((response) =>
    response.json().then((data) => {
      offset = Date.now() - new Date(data.datetime).getTime();

      log("TIME", "Sync success", "aqua", offset);
    })
  )
  .catch((error) => log("TIME", "Sync failed", "red", error.message));
