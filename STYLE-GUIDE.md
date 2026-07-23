# 博客样式修改指南

日常改样式只编辑：

`src/styles/custom.css`

这个文件在所有默认样式之后加载，写进去的规则会覆盖默认效果。这样不会碰到历史 CSS 的覆盖顺序问题。

## 先改颜色和整体观感

在 `custom.css` 顶部修改这些变量即可影响全站：

```css
:root {
  --bg: #f6f3ed;          /* 页面背景 */
  --surface: #fffdf9;     /* 卡片背景 */
  --text: #34414b;        /* 正文文字 */
  --muted: #76838e;       /* 次要文字 */
  --blue: #5179a8;        /* 主色、链接与按钮 */
  --line: rgba(80,101,118,.15); /* 边框 */
}

:root[data-theme="dark"] {
  --bg: #1b1f23;
  --surface: #21272b;
  --text: #ccd4db;
  --blue: #648ab5;
}
```

## 页面样式地图

| 你想改什么 | 在 `custom.css` 使用的选择器 |
| --- | --- |
| 顶部导航、博客名称 | `.site-header`、`.brand`、`.site-header nav` |
| 首页大标题和副标题 | `.hero h1`、`.hero p` |
| 首页精选文章 | `.featured-card`、`.featured-image`、`.featured-copy` |
| 首页文章列表 | `.home-post`、`.home-post-image` |
| 文章列表卡片 | `.article-tile`、`.article-cover`、`.article-tile-image` |
| 文章详情正文 | `.post-page`、`.post-detail`、`.article-body` |
| 相册列表卡片 | `.album-card`、`.album-cover`、`.album-cover-image` |
| 相册详情照片网格 | `.album-photo-grid`、`.album-photo-grid button` |
| 画廊拼贴网格 | `.gallery-mosaic`、`.gallery-mosaic .gallery-item` |
| 关于页个人资料 | `.profile-card`、`.profile-avatar`、`.profile-copy` |
| MBTI 卡片 | `.personality` |
| 友情链接卡片 | `.friend-grid a`、`.friend-avatar` |
| 后台页面 | `.admin-page`、`.admin-sidebar`、`.editor-form` |
| 图片预览弹窗 | `.photo-viewer`、`.photo-viewer figure img` |

## 常用示例

### 文章卡片改为三列

```css
.articles.grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}
```

### 加大相册封面高度

```css
.album-card > .album-cover {
  height: 300px;
}
```

### 调整画廊图片间隙

```css
.gallery-mosaic {
  gap: 8px;
}
```

### 关闭文章卡片发光，只保留放大

```css
.article-tile.hover-glow:hover > .article-cover {
  box-shadow: none;
}
```

### 调整文章和相册的悬停放大力度

```css
.article-tile.hover-glow:hover .article-tile-image,
.album-card.hover-glow:hover > .album-cover > .album-cover-image {
  transform: scale(1.03);
}
```

## 交错动画 / 级联延迟入场

当前页面已经启用交错动画：页面标题先出现，主体随后出现，重复卡片再按顺序依次淡入上浮。

动画代码位于：

`src/styles/custom.css`

常用调整位置：

```css
/* 单张卡片动画时长 */
.articles.grid > .article-tile,
.album-grid > .album-card {
  animation-duration: .48s;
}

/* 第一张卡片的延迟 */
.articles.grid > :nth-child(1) {
  animation-delay: .06s;
}

/* 动画从下方上浮的距离 */
@keyframes stagger-enter {
  from {
    transform: translateY(18px);
  }
}
```

如果想让所有卡片同时出现，可以在 `custom.css` 最后添加：

```css
.articles.grid > .article-tile,
.album-grid > .album-card,
.gallery-mosaic > .gallery-item {
  animation-delay: 0s;
}
```

## 不建议直接修改的文件

- `src/styles.css`：基础页面样式，仍含早期兼容规则。
- `src/styles/interactions.css`：已经整理好的卡片悬停与交互规则。

需要长期修改交互时，再编辑 `src/styles/interactions.css`；普通视觉调整优先写进 `src/styles/custom.css`。

## 修改后如何查看

开发模式正在运行时，保存 `custom.css` 后浏览器会自动刷新。若手动部署到设备，修改后执行：

```sh
npm run build
```

Docker 部署则执行：

```sh
docker compose up -d --build
```
