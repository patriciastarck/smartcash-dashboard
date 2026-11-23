// 1. Pegamos os elementos da tela que vamos manipular
const form = document.getElementById("transactionForm");
const descriptionInput = document.getElementById("descriptionInput");
const amountInput = document.getElementById("amountInput");
const categoryInput = document.getElementById("categoryInput");
const dateInput = document.getElementById("dateInput");
const feedback = document.getElementById("formFeedback");

const totalIncomeEl = document.getElementById("totalIncome");
const totalExpenseEl = document.getElementById("totalExpense");
const totalBalanceEl = document.getElementById("totalBalance");
const balanceStatusEl = document.getElementById("balanceStatus");

const transactionsListEl = document.getElementById("transactionsList");
const transactionsCounterEl = document.getElementById("transactionsCounter");
const emptyStateEl = document.getElementById("emptyState");
const clearAllBtn = document.getElementById("clearAllBtn");

const btnSetPositive = document.getElementById("btnSetPositive");
const btnSetNegative = document.getElementById("btnSetNegative");
const themeToggleBtn = document.getElementById("themeToggle");
const themeIcon = document.getElementById("themeIcon");

const STORAGE_KEY = "smartcash_transactions_simples";
const THEME_KEY = "smartcash_theme_v1";


function applyTheme(theme) {
  const isDark = theme === "dark";
  document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
  if (themeIcon) {
    themeIcon.textContent = isDark ? "☀️" : "🌙";
  }
  localStorage.setItem(THEME_KEY, isDark ? "dark" : "light");
}

applyTheme(localStorage.getItem(THEME_KEY) || "dark");

if (themeToggleBtn) {
  themeToggleBtn.addEventListener("click", () => {
    const current = document.documentElement.getAttribute("data-theme");
    applyTheme(current === "dark" ? "light" : "dark");
  });
}

//  Carrega as transações salvas no navegador
function loadTransactions() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return [];
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn("Dado corrompido no LocalStorage, iniciando vazio:", error);
    return [];
  }
}

let transactions = loadTransactions();

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

if (dateInput) {
  dateInput.value = getTodayDate();
}

function formatMoney(value) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatDateBR(isoDate) {
  if (!isoDate || !isoDate.includes("-")) return "";
  const [year, month, day] = isoDate.split("-");
  return `${day}/${month}/${year}`;
}

function escapeHTML(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
}

// feedback visual de positivo e negativo
function updateCards(list) {
  let income = 0;
  let expense = 0;

  for (const item of list) {
    if (item.amount > 0) {
      income += item.amount;
    } else if (item.amount < 0) {
      expense += Math.abs(item.amount);
    }
  }

  const balance = income - expense;

  totalIncomeEl.textContent = formatMoney(income);
  totalExpenseEl.textContent = formatMoney(expense);
  totalBalanceEl.textContent = formatMoney(balance);

  totalBalanceEl.classList.remove("positive-text", "negative-text");
  if (balanceStatusEl) {
    balanceStatusEl.classList.remove("positive", "negative", "neutral");
  }

  if (balance > 0) {
    totalBalanceEl.classList.add("positive-text");
    if (balanceStatusEl) {
      balanceStatusEl.classList.add("positive");
      balanceStatusEl.textContent = "↑ Saldo Positivo";
    }
  } else if (balance < 0) {
    totalBalanceEl.classList.add("negative-text");
    if (balanceStatusEl) {
      balanceStatusEl.classList.add("negative");
      balanceStatusEl.textContent = "↓ Saldo Negativo";
    }
  } else if (balanceStatusEl) {
    balanceStatusEl.classList.add("neutral");
    balanceStatusEl.textContent = "Equilibrado";
  }
}

// coloca a lista em ordem cronológica
function renderTransactions() {
  const chronological = [...transactions].sort((a, b) =>
    (a.date || "").localeCompare(b.date || "")
  );

  updateCards(chronological);
  transactionsListEl.innerHTML = "";

  if (transactionsCounterEl) {
    transactionsCounterEl.textContent = `${chronological.length} transação(ões)`;
  }
  if (emptyStateEl) {
    emptyStateEl.hidden = chronological.length > 0;
  }
  if (clearAllBtn) {
    clearAllBtn.hidden = transactions.length === 0;
  }

  chronological.forEach((tx) => {
    const isIncome = tx.amount > 0;
    const li = document.createElement("li");
    li.className = `tx-item ${isIncome ? "income" : "expense"}`;

    const iconAndSign = isIncome ? "↑ +" : "↓ -";
    const colorClass = isIncome ? "positive-text" : "negative-text";
    const absValue = formatMoney(Math.abs(tx.amount));

    li.innerHTML = `
      <div class="tx-info">
        <span class="tx-title">${escapeHTML(tx.description)}</span>
        <span class="tx-meta">${escapeHTML(tx.category)} • ${formatDateBR(tx.date)}</span>
      </div>
      <div class="tx-right">
        <span class="tx-amount ${colorClass}">${iconAndSign} ${absValue}</span>
        <button type="button" class="btn-delete" title="Excluir">✕</button>
      </div>
    `;

    li.querySelector(".btn-delete").addEventListener("click", () => {
      transactions = transactions.filter((item) => item.id !== tx.id);
      saveData();
      renderTransactions();
    });

    transactionsListEl.appendChild(li);
  });
}

// botões de Entrada, Saída e envio do formulário
if (btnSetPositive) {
  btnSetPositive.addEventListener("click", () => {
    const val = Number(amountInput.value);
    if (!Number.isNaN(val) && val !== 0) amountInput.value = Math.abs(val);
    amountInput.focus();
  });
}

if (btnSetNegative) {
  btnSetNegative.addEventListener("click", () => {
    const val = Number(amountInput.value);
    if (!Number.isNaN(val) && val !== 0) amountInput.value = -Math.abs(val);
    else if (!amountInput.value) amountInput.value = "-";
    amountInput.focus();
  });
}

if (form) {
  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const description = descriptionInput.value.trim();
    const amount = Number(amountInput.value);
    const category = categoryInput ? categoryInput.value : "Geral";
    const date = dateInput && dateInput.value ? dateInput.value : getTodayDate();

    if (!description) {
      if (feedback) {
        feedback.textContent = "Digite uma descrição.";
        feedback.className = "feedback-msg error";
      }
      return;
    }

    if (Number.isNaN(amount) || amount === 0) {
      if (feedback) {
        feedback.textContent = "Digite um valor diferente de zero (ex: 100 ou -50).";
        feedback.className = "feedback-msg error";
      }
      return;
    }

    transactions.push({
      id: Date.now(),
      description,
      amount,
      category,
      date,
    });

    saveData();
    renderTransactions();
    form.reset();
    if (dateInput) dateInput.value = getTodayDate();

    if (feedback) {
      feedback.textContent = "Transação registrada!";
      feedback.className = "feedback-msg success";
    }
  });
}

if (clearAllBtn) {
  clearAllBtn.addEventListener("click", () => {
    transactions = [];
    saveData();
    renderTransactions();
  });
}

// Inicia tela
renderTransactions();