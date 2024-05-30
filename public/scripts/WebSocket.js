let storedID = localStorage.getItem("id");

if (!storedID) {
  const id = prompt("Nhập ID Discord của bạn") || "";
  if (!id || !/^\d{17,19}$/.test(id)) window.location.reload();

  localStorage.setItem("id", id);
  storedID = id;
}

const connect = () => {
  const ws = new WebSocket("wss://api.lanyard.rest/socket");
  const start = Date.now();
  let heartbeat_interval = null;
  ws.onopen = (event) => {
    log("LANYARD", "Connected", "aqua", Date.now() - start);
    ws.send(JSON.stringify({ op: 2, d: { subscribe_to_id: storedID } }));
  };
  ws.onmessage = async ({ data }) => {
    const parsed = JSON.parse(data);
    const { op, d } = parsed;

    log("LANYARD", "Message", "pink", parsed.t || "-", parsed);
    if (parsed.t === "INIT_STATE") {
      if (!d.discord_user)
        return log(
          "USER",
          "Not found",
          "red",
          "Please join https://discord.gg/lanyard"
        );

      log("USER", "Hello", "yellow", d.discord_user.username);
    }

    switch (op) {
      case 1: {
        heartbeat_interval = setInterval(() => {
          log("LANYARD", "HeartBeat", "coral", "Sending...");

          ws.send(JSON.stringify({ op: 3 }));
        }, d.heartbeat_interval);
        break;
      }
      case 0: {
        handleData(parsed);
      }
    }
  };
  ws.onerror = (event) => {
    log("LANYARD", "Error", "red", event.reason || "No reason");
  };
  ws.onclose = (event) => {
    clearInterval(heartbeat_interval);

    log(
      "LANYARD",
      "Disconnected",
      "white",
      event.code,
      event.reason || "No reason"
    );

    setTimeout(() => {
      log("LANYARD", "Reconnecting", "orange");

      connect();
    }, 2500);
  };
};
connect();