# 忍者云智能导航

一个部署在 GitHub Pages 的零依赖静态导航页。它会从访客浏览器测试多个忍者云官网域名的连通性与延迟，推荐中位延迟最低的可用线路，由访客手动确认后进入。

## 线路配置

编辑 [`config.js`](./config.js) 即可增删域名或调整测试参数：

```js
window.NINJA_NAV_CONFIG = {
  endpoints: [
    {
      id: "ninjacloud",
      label: "NinjaCloud 主线路",
      url: "https://www.ninjacloud.online/",
      probePath: "favicon.ico"
    }
  ],
  attempts: 3,
  timeoutMs: 4500,
  intervalMs: 180
};
```

每条线路会进行多次 `no-cors` 请求，成功结果按中位延迟排序。测速完成后只推荐最快线路，不会自动跳转。

## 本地预览

```bash
python3 -m http.server 4173
```

访问 `http://localhost:4173/`。

## 部署

推送 `main` 分支后，GitHub Actions 会将仓库根目录部署到 GitHub Pages。
