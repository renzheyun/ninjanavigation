/**
 * 忍者云智能导航配置
 *
 * 增删线路只需编辑 endpoints。probePath 应指向体积小、稳定存在的同源文件。
 * 测速完成后仅推荐最快线路，页面不会自动跳转。
 */
window.NINJA_NAV_CONFIG = Object.freeze({
  endpoints: Object.freeze([
    Object.freeze({
      id: "ninjacloud",
      label: "NinjaCloud 主线路",
      url: "https://www.ninjacloud.online/",
      probePath: "favicon.ico"
    }),
    Object.freeze({
      id: "ninjiacloud",
      label: "NinjiaCloud 备用线路",
      url: "https://www.ninjiacloud.online/",
      probePath: "favicon.ico"
    })
  ]),
  attempts: 3,
  timeoutMs: 4500,
  intervalMs: 180
});
