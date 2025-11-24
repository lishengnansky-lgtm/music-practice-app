const STORAGE_KEY = "musicPracticeTracker_v1";

const CATEGORY_LABELS = {
  vocal: "声乐",
  instrument: "乐器",
  songwriting: "创作",
  production: "制作",
  band: "乐队排练",
  other: "其他"
};

let state = {
  entriesByDate: {}, // { "2025-11-24": [entry, ...] }
  templates: [],
  settings: {
    reminderEnabled: false,
    reminderTime: "",      // "HH:MM"
    lastReminderDate: ""   // "YYYY-MM-DD"
  }
};

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      state = Object.assign(state, parsed);
    }
  } catch (e) {
    console.error("Failed to load state", e);
  }

  // 如果没有模板，初始化一些基础模板
  if (!state.templates || state.templates.length === 0) {
    state.templates = [
      {
        id: generateId(),
        name: "声乐日",
        items: [
          { name: "热身 + 呼吸练习" },
          { name: "胸声练习" },
          { name: "混声/高音练习" },
          { name: "一首曲目的完整演唱" }
        ]
      },
      {
        id: generateId(),
        name: "创作日",
        items: [
          { name: "歌词自由写作" },
          { name: "和声/和弦进行尝试" },
          { name: "一段 demo 录制" }
        ]
      },
      {
        id: generateId(),
        name: "制作日",
        items: [
          { name: "声音/音色整理" },
          { name: "鼓组编写" },
          { name: "整体 rough mix" }
        ]
      }
    ];
  }
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error("Failed to save state", e);
  }
}

function generateId() {
  return "id_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/* 初始化 UI 控件默认值 */
function initDateAndMonthPickers() {
  const today = new Date();
  const dateStr = formatDate(today);
  const monthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;

  const dateInput = document.getElementById("datePicker");
  const monthInput = document.getElementById("monthPicker");

  dateInput.value = dateStr;
  monthInput.value = monthStr;
}

/* 渲染模板下拉 */
function renderTemplateSelect() {
  const select = document.getElementById("templateSelect");
  select.innerHTML = "";

  state.templates.forEach(t => {
    const opt = document.createElement("option");
    opt.value = t.id;
    opt.textContent = t.name;
    select.appendChild(opt);
  });

  if (state.templates.length === 0) {
    const opt = document.createElement("option");
    opt.value = "";
    opt.textContent = "暂无模板";
    select.appendChild(opt);
  }
}

/* 渲染模板管理弹层中的列表 */
function renderTemplateList() {
  const container = document.getElementById("templateList");
  container.innerHTML = "";

  if (state.templates.length === 0) {
    container.textContent = "暂无模板";
    container.style.fontSize = "13px";
    container.style.color = "#9ca3af";
    return;
  }

  state.templates.forEach(t => {
    const div = document.createElement("div");
    div.className = "template-item";

    const header = document.createElement("div");
    header.className = "template-item-header";

    const name = document.createElement("span");
    name.className = "template-item-name";
    name.textContent = t.name;

    const delBtn = document.createElement("button");
    delBtn.textContent = "删除";
    delBtn.className = "secondary";
    delBtn.style.fontSize = "11px";
    delBtn.style.padding = "4px 10px";
    delBtn.onclick = () => {
      if (confirm(`确定删除模板「${t.name}」吗？`)) {
        state.templates = state.templates.filter(x => x.id !== t.id);
        saveState();
        renderTemplateSelect();
        renderTemplateList();
      }
    };

    header.appendChild(name);
    header.appendChild(delBtn);

    const items = document.createElement("div");
    items.className = "template-item-items";
    items.textContent = t.items.map(i => i.name).join(" / ");

    div.appendChild(header);
    div.appendChild(items);

    container.appendChild(div);
  });
}

/* 渲染某天的练习记录 */
function renderDailyEntries() {
  const dateInput = document.getElementById("datePicker");
  const dateStr = dateInput.value;
  const listEl = document.getElementById("dailyList");
  const todayTotalEl = document.getElementById("todayTotal");

  const entries = state.entriesByDate[dateStr] || [];

  if (entries.length === 0) {
    listEl.className = "list-empty";
    listEl.textContent = "暂无记录";
    todayTotalEl.textContent = "总计 0 分钟";
    return;
  }

  listEl.className = "";
  listEl.innerHTML = "";

  let totalMinutes = 0;

  entries.forEach(entry => {
    totalMinutes += entry.minutes || 0;

    const item = document.createElement("div");
    item.className = "entry-item";

    const header = document.createElement("div");
    header.className = "entry-header";

    const title = document.createElement("div");
    title.className = "entry-title";
    title.textContent = entry.title || "(未命名)";

    const meta = document.createElement("div");
    meta.className = "entry-meta";
    meta.textContent = `${entry.minutes || 0} 分钟`;

    header.appendChild(title);
    header.appendChild(meta);

    const metaRow = document.createElement("div");
    metaRow.className = "entry-meta";
    const chip = document.createElement("span");
    chip.className = `chip category-${entry.category}`;
    chip.textContent = CATEGORY_LABELS[entry.category] || "其他";
    metaRow.appendChild(chip);

    const notes = document.createElement("div");
    notes.className = "entry-notes";
    if (entry.notes && entry.notes.trim().length > 0) {
      notes.textContent = entry.notes;
    } else {
      notes.textContent = "";
    }

    const actions = document.createElement("div");
    actions.className = "entry-actions";

    const delBtn = document.createElement("button");
    delBtn.textContent = "删除";
    delBtn.onclick = () => {
      const arr = state.entriesByDate[dateStr] || [];
      const idx = arr.findIndex(e => e.id === entry.id);
      if (idx >= 0) {
        arr.splice(idx, 1);
        if (arr.length === 0) {
          delete state.entriesByDate[dateStr];
        }
        saveState();
        renderDailyEntries();
        renderMonthlyStats();
      }
    };

    actions.appendChild(delBtn);

    item.appendChild(header);
    item.appendChild(metaRow);
    if (notes.textContent) {
      item.appendChild(notes);
    }
    item.appendChild(actions);

    listEl.appendChild(item);
  });

  todayTotalEl.textContent = `总计 ${totalMinutes} 分钟`;
}

/* 渲染月份统计（总时长 + 分类 + 简易条形图） */
function renderMonthlyStats() {
  const monthInput = document.getElementById("monthPicker");
  const monthStr = monthInput.value; // "YYYY-MM"
  const summaryEl = document.getElementById("monthSummary");
  const chartEl = document.getElementById("monthChart");

  if (!monthStr) {
    summaryEl.textContent = "";
    chartEl.textContent = "";
    return;
  }

  const dayTotals = {}; // { "01": minutes }
  const categoryTotals = {
    vocal: 0,
    instrument: 0,
    songwriting: 0,
    production: 0,
    band: 0,
    other: 0
  };

  for (const dateStr in state.entriesByDate) {
    if (!dateStr.startsWith(monthStr + "-")) continue;
    const day = dateStr.slice(8, 10);
    let sum = 0;
    state.entriesByDate[dateStr].forEach(entry => {
      const m = entry.minutes || 0;
      sum += m;
      if (categoryTotals[entry.category] != null) {
        categoryTotals[entry.category] += m;
      } else {
        categoryTotals.other += m;
      }
    });
    dayTotals[day] = (dayTotals[day] || 0) + sum;
  }

  const days = Object.keys(dayTotals).sort((a, b) => Number(a) - Number(b));
  const totalMinutes = days.reduce((acc, d) => acc + (dayTotals[d] || 0), 0);

  if (days.length === 0) {
    summaryEl.textContent = "本月暂无记录";
    chartEl.textContent = "";
    return;
  }

  // 汇总表
  let tableHtml = `<div>本月总时长：<strong>${totalMinutes} 分钟</strong></div>`;
  tableHtml += `<table><thead><tr><th>类别</th><th>分钟数</th></tr></thead><tbody>`;

  for (const key of Object.keys(categoryTotals)) {
    const value = categoryTotals[key];
    if (value === 0) continue;
    tableHtml += `<tr><td>${CATEGORY_LABELS[key] || "其他"}</td><td>${value}</td></tr>`;
  }

  tableHtml += `</tbody></table>`;
  summaryEl.innerHTML = tableHtml;

  // 简单“按天总时长”条形图
  chartEl.innerHTML = "";
  const maxMinutes = Math.max(...days.map(d => dayTotals[d] || 0)) || 1;

  days.forEach(d => {
    const row = document.createElement("div");
    row.className = "chart-row";

    const label = document.createElement("div");
    label.className = "chart-label";
    label.textContent = `${Number(d)}日`;

    const barWrapper = document.createElement("div");
    barWrapper.className = "chart-bar-wrapper";

    const bar = document.createElement("div");
    bar.className = "chart-bar";
    const ratio = (dayTotals[d] || 0) / maxMinutes;
    bar.style.width = `${Math.max(ratio * 100, 2)}%`;

    barWrapper.appendChild(bar);
    row.appendChild(label);
    row.appendChild(barWrapper);

    chartEl.appendChild(row);
  });
}

/* 应用模板到当天 */
function applyTemplateToToday() {
  const select = document.getElementById("templateSelect");
  const templateId = select.value;
  if (!templateId) return;
  const template = state.templates.find(t => t.id === templateId);
  if (!template) return;

  const dateStr = document.getElementById("datePicker").value;
  if (!dateStr) return;

  const entries = state.entriesByDate[dateStr] || [];

  template.items.forEach(item => {
    entries.push({
      id: generateId(),
      category: "other",   // 默认可后续编辑升级为可选
      title: item.name,
      minutes: 0,
      notes: "",
      fromTemplateId: template.id
    });
  });

  state.entriesByDate[dateStr] = entries;
  saveState();
  renderDailyEntries();
  renderMonthlyStats();
}

/* 添加单条记录 */
function addEntryFromForm() {
  const dateStr = document.getElementById("datePicker").value;
  const category = document.getElementById("categorySelect").value;
  const title = document.getElementById("titleInput").value.trim();
  const minutes = Number(document.getElementById("minutesInput").value);
  const notes = document.getElementById("notesInput").value.trim();

  if (!dateStr) {
    alert("请先选择日期");
    return;
  }
  if (!minutes || minutes <= 0) {
    alert("请填写有效的时长（分钟）");
    return;
  }

  const entry = {
    id: generateId(),
    category,
    title: title || "(未命名)",
    minutes,
    notes
  };

  const entries = state.entriesByDate[dateStr] || [];
  entries.push(entry);
  state.entriesByDate[dateStr] = entries;
  saveState();
  renderDailyEntries();
  renderMonthlyStats();

  document.getElementById("titleInput").value = "";
  document.getElementById("minutesInput").value = "";
  document.getElementById("notesInput").value = "";
}

/* 保存新模板 */
function saveNewTemplate() {
  const nameInput = document.getElementById("newTemplateName");
  const itemsInput = document.getElementById("newTemplateItems");

  const name = nameInput.value.trim();
  const itemsLines = itemsInput.value.split("\n").map(l => l.trim()).filter(Boolean);

  if (!name) {
    alert("请输入模板名称");
    return;
  }
  if (itemsLines.length === 0) {
    alert("请至少输入一条练习项目");
    return;
  }

  const template = {
    id: generateId(),
    name,
    items: itemsLines.map(line => ({ name: line }))
  };

  state.templates.push(template);
  saveState();
  renderTemplateSelect();
  renderTemplateList();

  nameInput.value = "";
  itemsInput.value = "";
}

/* 模态框开关 */
function openTemplateModal() {
  document.getElementById("templateModal").classList.remove("hidden");
}

function closeTemplateModal() {
  document.getElementById("templateModal").classList.add("hidden");
}

/* 提醒逻辑（仅在 App 打开时轮询检查） */
let reminderIntervalId = null;

function initReminderSettingsUI() {
  const { reminderEnabled, reminderTime } = state.settings;
  document.getElementById("reminderEnabled").checked = !!reminderEnabled;
  document.getElementById("reminderTime").value = reminderTime || "";
}

function startReminderLoop() {
  if (reminderIntervalId) {
    clearInterval(reminderIntervalId);
    reminderIntervalId = null;
  }

  if (!state.settings.reminderEnabled || !state.settings.reminderTime) return;

  reminderIntervalId = setInterval(() => {
    const now = new Date();
    const nowDate = formatDate(now);
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    const nowTime = `${hh}:${mm}`;

    if (nowTime === state.settings.reminderTime && state.settings.lastReminderDate !== nowDate) {
      triggerReminder();
      state.settings.lastReminderDate = nowDate;
      saveState();
    }
  }, 60 * 1000); // 每分钟检查一次
}

function triggerReminder() {
  const msgTitle = "练习时间到啦";
  const msgBody = "今天要安排一点音乐练习时间吗？";

  if ("Notification" in window && Notification.permission === "granted") {
    new Notification(msgTitle, { body: msgBody });
  } else {
    alert(`${msgTitle}\n\n${msgBody}`);
  }
}

function handleReminderToggle() {
  const enabled = document.getElementById("reminderEnabled").checked;
  state.settings.reminderEnabled = enabled;

  if (enabled && "Notification" in window && Notification.permission === "default") {
    Notification.requestPermission().then(result => {
      console.log("Notification permission:", result);
    });
  }

  saveState();
  startReminderLoop();
}

function handleReminderTimeChange() {
  const time = document.getElementById("reminderTime").value;
  state.settings.reminderTime = time;
  saveState();
  startReminderLoop();
}

/* Service Worker 注册 */
function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("service-worker.js").catch(err => {
      console.warn("Service worker registration failed:", err);
    });
  }
}

/* 事件绑定 */
function bindEvents() {
  document.getElementById("datePicker").addEventListener("change", () => {
    renderDailyEntries();
  });

  document.getElementById("monthPicker").addEventListener("change", () => {
    renderMonthlyStats();
  });

  document.getElementById("applyTemplateBtn").addEventListener("click", applyTemplateToToday);
  document.getElementById("addEntryBtn").addEventListener("click", addEntryFromForm);

  document
    .getElementById("openTemplateManagerBtn")
    .addEventListener("click", () => {
      renderTemplateList();
      openTemplateModal();
    });

  document
    .getElementById("closeTemplateModalBtn")
    .addEventListener("click", closeTemplateModal);

  document.getElementById("saveTemplateBtn").addEventListener("click", saveNewTemplate);

  document
    .getElementById("reminderEnabled")
    .addEventListener("change", handleReminderToggle);

  document
    .getElementById("reminderTime")
    .addEventListener("change", handleReminderTimeChange);

  // 点击遮罩关闭（可选）
  document.getElementById("templateModal").addEventListener("click", e => {
    if (e.target.id === "templateModal") {
      closeTemplateModal();
    }
  });
}

/* 启动 */
document.addEventListener("DOMContentLoaded", () => {
  loadState();
  initDateAndMonthPickers();
  renderTemplateSelect();
  renderDailyEntries();
  renderMonthlyStats();
  initReminderSettingsUI();
  startReminderLoop();
  bindEvents();
  registerServiceWorker();
});
