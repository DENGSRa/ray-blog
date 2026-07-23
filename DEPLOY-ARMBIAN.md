# Armbian 公网部署

此项目可直接部署在 ARM64 或 ARMv7 的 Armbian 设备上。Docker 会在设备上构建适配当前 CPU 架构的镜像；不需要把 macOS 的 `node_modules` 或镜像文件拷过去。

## 部署前检查

1. 准备一个域名，例如 `blog.example.com`。
2. 在 DNS 服务商中，将该域名的 A 记录指向设备公网 IPv4；若配置 IPv6，也添加 AAAA 记录。
3. 路由器或云服务器安全组需将 TCP `80` 和 `443` 转发/放行到这台 Armbian 设备。
4. 确保 `80`、`443` 未被 Nginx、Apache、宝塔等其他服务占用。

## 上传并启动

将压缩包传到设备后执行：

```sh
tar -xzf shanzhi-blog-armbian.tar.gz
cd shanzhi-blog
chmod +x scripts/prepare-armbian.sh
./scripts/prepare-armbian.sh
```

脚本首次运行会安装 Docker；按提示重新登录后再运行一次。随后它会要求输入域名、证书通知邮箱和后台密码，并自动：

- 构建适合 Armbian CPU 架构的应用镜像；
- 使用 Caddy 申请和续期 Let's Encrypt HTTPS 证书；
- 用浏览器基础认证保护 `/admin` 和所有写入 API；
- 将内容保存到项目目录的 `data/content.json`；
- 将上传的图片保存到项目目录的 `uploads/`。

上传图片会在服务器端自动旋转、限制最长边并转换为 WebP。默认最长边为 `2400px`、质量为 `84`，可通过 `.env` 中的 `IMAGE_MAX_DIMENSION` 和 `IMAGE_WEBP_QUALITY` 调整。

部署后：

- 站点：`https://你的域名`
- 后台：`https://你的域名/admin`

浏览器第一次进入后台会弹出账号密码框。使用部署时设置的管理员账号和密码即可。

后台提供以下管理入口：

- **文章**：新建、修改和删除文章，支持 Markdown 预览与正文插图；
- **相册**：新建相册、修改封面并管理相册照片；
- **媒体库**：浏览、复用和删除已上传图片；
- **站点设置**：修改博客名称、首页文字、头像、个人资料、社交链接、页脚、页面副标题、MBTI 和友情链接。

## 常用维护命令

```sh
# 查看运行状态与日志
docker compose ps
docker compose logs -f

# 更新项目文件后重新构建并上线
docker compose up -d --build

# 停止服务（不会删除文章、照片、证书）
docker compose down

# 备份全部内容和图片
tar -czf backup-$(date +%F).tar.gz data uploads
```

媒体库位于后台的“媒体库”选项，可以复用已上传图片。正在文章封面、相册封面或相册照片中使用的图片会被保护，不能直接删除。

## 安全说明

- `.env` 含后台密码哈希，绝不要提交或公开它。
- `data/`、`uploads/` 和 Docker 的 Caddy 卷都是需要备份的数据。
- 当前后台使用 Caddy 的 HTTP Basic Auth，适合单管理员博客；若将来需要多用户、权限管理或多人投稿，应改为完整账户系统和数据库。
