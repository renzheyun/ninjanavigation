(function () {
  "use strict";

  const config = window.NINJA_NAV_CONFIG;
  if (!config || !Array.isArray(config.endpoints) || config.endpoints.length === 0) {
    throw new Error("NINJA_NAV_CONFIG requires at least one endpoint.");
  }

  const translations = {
    zh: {
      navHelp: "测速说明",
      title: "忍者云",
      subtitle: "稳定、快速、隐秘",
      description: "自 2021 年起，专注稳定、可靠、长期可用的网络连接体验。全平台支持，畅享全球流媒体与 AI 服务。",
      privacy: "测速在本机完成，不记录您的访问结果",
      panelKicker: "实时线路检测",
      testing: "正在寻找最快线路",
      readyHeading: "已找到最快线路",
      failedHeading: "暂未找到可用线路",
      running: "检测中",
      available: "可用",
      unavailable: "连接失败",
      queued: "等待检测",
      milliseconds: "毫秒",
      pleaseWait: "请稍候",
      retry: "重新测速",
      enterNow: "立即进入",
      goToRoute: "进入此线路",
      fastest: "当前最快",
      selected: "推荐最快线路：{label}，延迟 {latency} 毫秒。请确认后进入。",
      allFailed: "暂时无法连接任何线路。请检查网络后重新测速，或稍后再试。",
      processTitle: "一次检测，三步完成",
      processDescription: "结果来自您正在使用的网络，比固定推荐更贴近实际访问体验。",
      stepTest: "并行测速",
      stepTestDesc: "同时检测配置中的全部官网线路",
      stepCompare: "比较结果",
      stepCompareDesc: "使用多次成功请求的中位延迟排序",
      stepGo: "确认进入",
      stepGoDesc: "查看推荐结果后，手动确认或选择其他线路",
      faqTitle: "关于智能导航",
      faqDescription: "了解测速方式、结果差异与隐私保护。",
      faqOneQuestion: "如何选择最快线路？",
      faqOneAnswer: "页面会对每个官网域名进行多次连通性测试，取成功结果的中位延迟，选择响应最快的可用线路。",
      faqTwoQuestion: "测速结果为什么会变化？",
      faqTwoAnswer: "延迟受地区、运营商和实时网络状况影响。每次打开页面或重新测速时，结果都可能不同。",
      faqThreeQuestion: "测速会收集个人信息吗？",
      faqThreeAnswer: "测速直接在浏览器中完成，不会上传测速历史，也不会存储域名访问结果。"
    },
    en: {
      navHelp: "How it works",
      title: "Ninja Cloud",
      subtitle: "Stable, Fast, Private",
      description: "Since 2021, we have focused on stable, reliable, long-lasting connectivity across every platform for global streaming and AI services.",
      privacy: "Tests run locally. Your results are not stored",
      panelKicker: "Live route test",
      testing: "Finding the fastest route",
      readyHeading: "Fastest route found",
      failedHeading: "No route available",
      running: "Testing",
      available: "Available",
      unavailable: "Connection failed",
      queued: "Waiting",
      milliseconds: "ms",
      pleaseWait: "Please wait",
      retry: "Test again",
      enterNow: "Open now",
      goToRoute: "Open this route",
      fastest: "Fastest now",
      selected: "Recommended route: {label}, {latency} ms. Confirm when you are ready.",
      allFailed: "No route is reachable right now. Check your connection and test again.",
      processTitle: "One test, three actions",
      processDescription: "Results come from your current network, so they reflect your real connection.",
      stepTest: "Test together",
      stepTestDesc: "Check every configured official route in parallel",
      stepCompare: "Compare results",
      stepCompareDesc: "Rank successful requests by median latency",
      stepGo: "Confirm and open",
      stepGoDesc: "Review the recommendation, then choose a route manually",
      faqTitle: "About smart navigation",
      faqDescription: "How testing, result changes, and privacy work.",
      faqOneQuestion: "How is the fastest route selected?",
      faqOneAnswer: "The page tests every official domain several times, uses the median successful latency, and selects the fastest available route.",
      faqTwoQuestion: "Why do results change?",
      faqTwoAnswer: "Latency depends on your location, provider, and current network conditions. A new test may produce a different result.",
      faqThreeQuestion: "Does the test collect personal information?",
      faqThreeAnswer: "Testing happens in your browser. Route results and testing history are not uploaded or stored."
    }
  };

  const elements = {
    routeList: document.getElementById("route-list"),
    selection: document.getElementById("selection-message"),
    primary: document.getElementById("primary-action"),
    retry: document.getElementById("retry-button"),
    globalState: document.getElementById("global-state"),
    testHeading: document.getElementById("test-heading"),
    languageToggle: document.getElementById("language-toggle")
  };

  let language = localStorage.getItem("ninja-nav-language") === "en" ? "en" : "zh";
  let selectedEndpoint = null;
  let runId = 0;

  function t(key, values) {
    let value = translations[language][key] || key;
    if (values) {
      Object.entries(values).forEach(([name, replacement]) => {
        value = value.replace(`{${name}}`, String(replacement));
      });
    }
    return value;
  }

  function applyLanguage() {
    document.documentElement.lang = language === "zh" ? "zh-CN" : "en";
    document.querySelectorAll("[data-i18n]").forEach((node) => {
      node.textContent = t(node.dataset.i18n);
    });
    elements.languageToggle.textContent = language === "zh" ? "EN" : "中";
    elements.languageToggle.setAttribute(
      "aria-label",
      language === "zh" ? "Switch to English" : "切换到中文"
    );
  }

  function wait(duration) {
    return new Promise((resolve) => window.setTimeout(resolve, duration));
  }

  async function measureOnce(endpoint) {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), config.timeoutMs);
    const separator = endpoint.probePath.includes("?") ? "&" : "?";
    const probeUrl = new URL(endpoint.probePath, endpoint.url);
    probeUrl.search = `${probeUrl.search}${separator}nav_ping=${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const startedAt = performance.now();

    try {
      await fetch(probeUrl.href, {
        method: "GET",
        mode: "no-cors",
        cache: "no-store",
        credentials: "omit",
        redirect: "follow",
        signal: controller.signal
      });
      return Math.max(1, Math.round(performance.now() - startedAt));
    } catch (_error) {
      return null;
    } finally {
      window.clearTimeout(timeout);
    }
  }

  async function measureEndpoint(endpoint, currentRun) {
    const samples = [];
    for (let attempt = 0; attempt < config.attempts; attempt += 1) {
      if (currentRun !== runId) return null;
      const latency = await measureOnce(endpoint);
      if (latency !== null) samples.push(latency);
      if (attempt < config.attempts - 1) await wait(config.intervalMs);
    }

    if (samples.length === 0) {
      return { endpoint, available: false, latency: null, samples: [] };
    }

    samples.sort((a, b) => a - b);
    const middle = Math.floor(samples.length / 2);
    const latency = samples.length % 2
      ? samples[middle]
      : Math.round((samples[middle - 1] + samples[middle]) / 2);
    return { endpoint, available: true, latency, samples };
  }

  function createRouteRow(endpoint) {
    const row = document.createElement("article");
    row.className = "route-row is-testing";
    row.dataset.routeId = endpoint.id;
    row.innerHTML = `
      <div class="route-identity">
        <span class="route-status-dot" aria-hidden="true"></span>
        <div>
          <h3></h3>
          <p class="route-domain"></p>
        </div>
      </div>
      <div class="route-result">
        <span class="route-latency">${t("queued")}</span>
        <button class="route-link" type="button" hidden>${t("goToRoute")}</button>
      </div>
    `;
    row.querySelector("h3").textContent = endpoint.label;
    row.querySelector(".route-domain").textContent = new URL(endpoint.url).hostname;
    row.querySelector(".route-link").addEventListener("click", () => navigate(endpoint.url));
    return row;
  }

  function renderTestingRows() {
    elements.routeList.replaceChildren(...config.endpoints.map(createRouteRow));
    elements.routeList.setAttribute("aria-busy", "true");
  }

  function updateRouteRow(result, isBest) {
    const row = elements.routeList.querySelector(`[data-route-id="${result.endpoint.id}"]`);
    if (!row) return;
    row.classList.remove("is-testing");
    row.classList.toggle("is-available", result.available);
    row.classList.toggle("is-unavailable", !result.available);
    row.classList.toggle("is-best", isBest);

    const latency = row.querySelector(".route-latency");
    const link = row.querySelector(".route-link");
    if (result.available) {
      latency.textContent = `${result.latency} ${t("milliseconds")}${isBest ? ` · ${t("fastest")}` : ""}`;
      link.hidden = false;
    } else {
      latency.textContent = t("unavailable");
      link.hidden = true;
    }
  }

  function navigate(url) {
    window.location.assign(url);
  }

  async function runTests() {
    const currentRun = ++runId;
    selectedEndpoint = null;
    renderTestingRows();
    elements.selection.replaceChildren();
    elements.primary.disabled = true;
    elements.primary.textContent = t("pleaseWait");
    elements.retry.hidden = true;
    elements.globalState.className = "test-state is-running";
    elements.globalState.lastElementChild.textContent = t("running");
    elements.testHeading.textContent = t("testing");

    const results = (await Promise.all(
      config.endpoints.map((endpoint) => measureEndpoint(endpoint, currentRun))
    )).filter(Boolean);
    if (currentRun !== runId) return;

    const available = results
      .filter((result) => result.available)
      .sort((a, b) => a.latency - b.latency);
    const best = available[0] || null;

    results.forEach((result) => updateRouteRow(result, best && result.endpoint.id === best.endpoint.id));
    elements.routeList.setAttribute("aria-busy", "false");
    elements.retry.hidden = false;

    if (!best) {
      elements.globalState.className = "test-state is-error";
      elements.globalState.lastElementChild.textContent = t("unavailable");
      elements.testHeading.textContent = t("failedHeading");
      elements.selection.textContent = t("allFailed");
      elements.primary.disabled = true;
      elements.primary.textContent = t("enterNow");
      return;
    }

    selectedEndpoint = best.endpoint;
    elements.globalState.className = "test-state is-ready";
    elements.globalState.lastElementChild.textContent = t("available");
    elements.testHeading.textContent = t("readyHeading");
    elements.primary.disabled = false;
    elements.primary.textContent = t("enterNow");
    elements.selection.innerHTML = `
      <strong>${t("selected", {
        label: best.endpoint.label,
        latency: best.latency
      })}</strong>
    `;
  }

  elements.primary.addEventListener("click", () => {
    if (selectedEndpoint) navigate(selectedEndpoint.url);
  });

  elements.retry.addEventListener("click", runTests);

  elements.languageToggle.addEventListener("click", () => {
    language = language === "zh" ? "en" : "zh";
    localStorage.setItem("ninja-nav-language", language);
    applyLanguage();
    runTests();
  });

  document.getElementById("current-year").textContent = new Date().getFullYear();
  applyLanguage();
  runTests();
})();
