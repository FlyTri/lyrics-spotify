document.addEventListener("DOMContentLoaded", () =>
  $(".download").addEventListener("click", async () => {
    if (!spotify.id)
      return showMessage("Bạn cần mở một bài hát", null, "error");

    $(".download").classList.add("disabled");

    const data = await axios(`/api/download/${spotify.id}`)
      .then((response) => response.data)
      .catch(() => null);

    $(".download").classList.remove("disabled");

    if (!data) return showMessage("Không thể gửi yêu cầu", null, "error");
    if (data.message) return showMessage(data.message, null, "error");

    if (playing) open(data.link);
  })
);
