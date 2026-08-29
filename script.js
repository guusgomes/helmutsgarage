const DATA = {
  "NITRO": [
    ["Garrafa Nitro Pequena", 5625, false],
    ["Refil Nitro", 625, false]
  ],
  "PEÇAS (STAGE)": [
    ["ECU (STAGE 1)", 9000, false],
    ["Kit Freio (STAGE 2)", 16500, false],
    ["Filtro de Ar (STAGE 2)", 11280, false],
    ["Escape Esportivo (STAGE 2)", 18000, false],
    ["Turbo (STAGE 3)", 22560, false],
    ["Intercooler", 11280, false],
    ["Suspensão 5", 11280, false],
    ["Racing Clutch", 11280, false],
    ["Coletor de Admissão", 11280, false],
    ["Sistema de Combustível", 11280, false],
    ["🔶 STAGE 1 E 2", 54780, false],
    ["🔥 FULL TUNING", 133740, false]
  ],
  "REPAROS / SERVIÇOS": [
    ["Reparo Lataria", 240, false],
    ["Reparo Motor", 840, false],
    ["Pneu (Cada)", 150, true],
    ["Reparo ECU", 900, true],
    ["Reparo Kit Freio", 900, true],
    ["Reparo Filtro de Ar", 900, true],
    ["Reparo Escape", 900, true],
    ["Reparo Turbo", 900, true],
    ["Reparo Intercooler", 900, true],
    ["Reparo Suspensão 5", 900, true],
    ["Reparo Racing Clutch", 900, true],
    ["Reparo Coletor Adm.", 900, true],
    ["Reparo Sist. Combust.", 900, true]
  ],
  "LOCKPICK / OUTROS": [
    ["Lockpick (Cada)", 300, true],
    ["Kit Reparo (Cada)", 3000, true],
    ["Lockpick Avançada", 600, true]
  ],
  "GUINCHO": [
    ["Los Santos", 600, false],
    ["Sandy / Grape", 1200, false],
    ["Paleto", 1800, false]
  ]
};

const tabsEl = document.getElementById("tabs");
const itemsEl = document.getElementById("items");
const searchEl = document.getElementById("search");
const discountEl = document.getElementById("discount");
const totalEl = document.getElementById("total");
const clientNameEl = document.getElementById("clientName");
const passportEl = document.getElementById("passport");
const emptyEl = document.getElementById("empty");
const toastEl = document.getElementById("toast");

let currentTab = "NITRO";
let selected = new Map();
let toastTimer;

const money = value => "$" + Math.round(value).toLocaleString("pt-BR");

function showToast(message) {
  toastEl.textContent = message;
  toastEl.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove("show"), 2200);
}

function renderTabs() {
  tabsEl.innerHTML = "";
  Object.keys(DATA).forEach(name => {
    const btn = document.createElement("button");
    btn.className = "tab" + (name === currentTab ? " active" : "");
    btn.textContent = name;
    btn.onclick = () => {
      currentTab = name;
      searchEl.value = "";
      renderTabs();
      renderItems();
    };
    tabsEl.appendChild(btn);
  });
}

function keyFor(tab, index) {
  return tab + "::" + index;
}

function renderItems() {
  const query = searchEl.value.trim().toLowerCase();
  itemsEl.innerHTML = "";

  DATA[currentTab].forEach((item, index) => {
    const [name, price, hasQty] = item;
    if (query && !name.toLowerCase().includes(query)) return;

    const key = keyFor(currentTab, index);
    const state = selected.get(key) || { checked: false, qty: 0 };

    const card = document.createElement("div");
    card.className = "item";

    const check = document.createElement("input");
    check.type = "checkbox";
    check.checked = state.checked;
    check.addEventListener("change", () => {
      const s = selected.get(key) || { checked: false, qty: 0 };
      s.checked = check.checked;
      if (hasQty && s.checked && (!s.qty || s.qty < 1)) s.qty = 1;
      selected.set(key, s);
      renderItems();
      updateTotal();
    });

    const label = document.createElement("span");
    label.className = "item-name";
    label.textContent = name;

    const priceEl = document.createElement("span");
    priceEl.className = "item-price";
    priceEl.textContent = money(price);

    card.append(check, label, priceEl);

    if (hasQty) {
      const qty = document.createElement("input");
      qty.className = "qty";
      qty.type = "number";
      qty.min = "0";
      qty.step = "1";
      qty.value = state.qty || 0;
      qty.addEventListener("input", () => {
        let value = Math.max(0, parseInt(qty.value || "0", 10));
        const s = selected.get(key) || { checked: false, qty: 0 };
        s.qty = value;
        s.checked = value > 0;
        selected.set(key, s);
        check.checked = s.checked;
        updateTotal();
      });
      card.appendChild(qty);
    }

    itemsEl.appendChild(card);
  });

  emptyEl.classList.toggle("hidden", itemsEl.children.length !== 0);
}

function updateTotal() {
  let subtotal = 0;
  for (const [key, state] of selected.entries()) {
    if (!state.checked) continue;
    const [tab, indexString] = key.split("::");
    const index = Number(indexString);
    const item = DATA[tab]?.[index];
    if (!item) continue;
    const qty = item[2] ? Math.max(1, Number(state.qty) || 1) : 1;
    subtotal += item[1] * qty;
  }

  const discount = Number(discountEl.value) || 0;
  const total = subtotal * (1 - discount / 100);
  totalEl.textContent = money(total);
  return { subtotal, discount, total };
}

function getOrder() {
  const lines = [];
  for (const [key, state] of selected.entries()) {
    if (!state.checked) continue;
    const [tab, indexString] = key.split("::");
    const item = DATA[tab]?.[Number(indexString)];
    if (!item) continue;
    const qty = item[2] ? Math.max(1, Number(state.qty) || 1) : 1;
    lines.push({ tab, name: item[0], price: item[1], qty, total: item[1] * qty });
  }
  return lines;
}

function orderText() {
  const { subtotal, discount, total } = updateTotal();
  const lines = getOrder();
  const client = clientNameEl.value.trim();
  const passport = passportEl.value.trim();

  let text = "ORDEM DE SERVIÇO\n";
  text += "============================\n";
  if (client) text += `Cliente: ${client}\n`;
  if (passport) text += `Passaporte / ID: ${passport}\n`;
  text += "\n";
  lines.forEach(x => {
    text += `${x.name}${x.qty > 1 ? ` x${x.qty}` : ""} - ${money(x.total)}\n`;
  });
  text += "\n";
  text += `Subtotal: ${money(subtotal)}\n`;
  text += `Desconto: ${discount}%\n`;
  text += `TOTAL: ${money(total)}\n`;
  return text;
}

document.getElementById("copyBtn").onclick = async () => {
  try {
    await navigator.clipboard.writeText(orderText());
    showToast("Ordem copiada!");
  } catch {
    showToast("Não foi possível copiar automaticamente.");
  }
};

document.getElementById("clearBtn").onclick = () => {
  selected.clear();
  discountEl.value = "0";
  clientNameEl.value = "";
  passportEl.value = "";
  renderItems();
  updateTotal();
  showToast("Ordem limpa.");
};

document.getElementById("saveBtn").onclick = () => {
  if (!passportEl.value.trim()) {
    showToast("Informe o Passaporte / ID.");
    passportEl.focus();
    return;
  }
  const saved = {
    date: new Date().toISOString(),
    client: clientNameEl.value.trim(),
    passport: passportEl.value.trim(),
    discount: Number(discountEl.value),
    items: getOrder(),
    totals: updateTotal()
  };
  localStorage.setItem("ultimaOrdemOficina", JSON.stringify(saved));
  showToast("Ordem salva neste navegador!");
};

searchEl.addEventListener("input", renderItems);
discountEl.addEventListener("change", updateTotal);

renderTabs();
renderItems();
updateTotal();
