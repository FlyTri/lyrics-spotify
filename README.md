<div align="center">
    <img src="public/favicon.ico" alt="Logo"></img>
    <a href="https://lyrics-spotify.onrender.com/"><h1>Lyrics Spotify</h1></a>
    <p>(Spotify Lyrics)</p>
</div>

## Giới thiệu
Xem lời bài hát ngay trên trình duyệt của bạn (nên dùng trình duyệt nhân Chromium để có trải nghiệm tốt nhất)

> [!IMPORTANT]
> Nếu thời gian của lời bài hát không chính xác, cài đặt [Media Session Server](https://github.com/FlyTri/media-sessions-server) (Windows)

## Client ID, Client Secret
> [!WARNING]
> Để tránh rủi ro bảo mật, bạn nên tạo app mới, không sử dụng các app đã tạo

Thực hiện các bước sau:
- Vào trang [này](https://developer.spotify.com/dashboard/create) (Spotify for Developers)
- Điền các mục sau với nội dung tuỳ thích
   + App name
   + App description
- Tại ô **Redirect URIs**, nhập nội dung bên dưới và chọn nút **Add**
  
```cpp
https://lyrics-spotify.onrender.com/callback
```
- Tiếp, đánh dấu vào ô **Web API** và điều khoản dịch vụ ở bên dưới
- Chọn nút **Save** và chờ
- Sau đó, chọn nút **Settings**
- Tại đây, sẽ có ô [**Client ID**]
- Chọn dòng chữ **View client secret** và đây là [**Client Secret**]
## Nguồn
- Biểu tượng:
  + [FontAwesome](https://fontawesome.com/)
  + [Icons8](https://icons8.com/)
  + [Discord](https://discord.com/)
- Lời bài hát:
  + [QQ Music](https://y.qq.com/)
  + [Musixmatch](https://musixmatch.com/)
  + [ZingMP3](https://zingmp3.vn/)
- Design:
  + [Spotify](https://spotify.com/)
  + [Discord](https://discord.com/)