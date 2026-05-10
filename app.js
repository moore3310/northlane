const spending = [
  { label: "Housing", value: 1680, pct: 84 },
  { label: "Groceries", value: 624, pct: 48 },
  { label: "Travel", value: 352, pct: 30 },
  { label: "Dining", value: 528, pct: 42 }
];

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const pageTitles = {
  dashboard: "Dashboard",
  accounts: "Accounts",
  transfer: "Transfer Money",
  cards: "Cards",
  bills: "Bills & Payments",
  security: "Profile & Security"
};

let state = {
  user: {},
  accounts: [],
  transactions: [],
  cards: [],
  bills: []
};
let balancesVisible = false;
let cardsVisible = false;

async function api(path, options = {}) {
  const response = await fetch(path, {
    credentials: "same-origin",
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options
  });
  const body = await response.json();
  if (!response.ok) {
    throw new Error(body.error || "Request failed");
  }
  return body;
}

function formatAmount(value) {
  return value < 0 ? `-${money.format(Math.abs(value))}` : money.format(value);
}

function setSignedIn(signedIn) {
  document.body.classList.toggle("login-active", !signedIn);
  document.querySelector("#loginScreen").classList.toggle("hidden", signedIn);
  document.querySelector("#appShell").classList.toggle("locked", !signedIn);
}

function applyState(nextState) {
  state = nextState;
  renderAll();
}

async function loadState() {
  applyState(await api("/api/state"));
}

function renderIdentity() {
  document.querySelector("#profileInitials").textContent = state.user.initials || "AM";
  document.querySelector("#profileName").textContent = state.user.name || "Alex Morgan";
}

function renderAccounts() {
  const total = state.accounts.reduce((sum, account) => sum + account.balance, 0);
  document.querySelector("#totalBalance").textContent = balancesVisible ? money.format(total) : "Hidden";
  document.querySelector("#toggleBalance").textContent = balancesVisible ? "Hide balance" : "Show balance";

  document.querySelector("#accountList").innerHTML = state.accounts.map(account => `
    <div class="account-row">
      <div>
        <strong>${account.name}</strong>
        <span>${account.type} ${account.number}</span>
      </div>
      <strong>${formatAmount(account.balance)}</strong>
    </div>
  `).join("");

  document.querySelector("#accountCards").innerHTML = state.accounts.map(account => `
    <article class="account-card">
      <header>
        <div>
          <h3>${account.name}</h3>
          <span>${account.type} account</span>
        </div>
        <span class="status-pill">${account.status}</span>
      </header>
      <strong class="balance">${formatAmount(account.balance)}</strong>
      <div class="account-meta">
        <div><span>Account</span><strong>${account.number}</strong></div>
        <div><span>Routing</span><strong>${account.routing}</strong></div>
        <div><span>Limit</span><strong>${account.limit}</strong></div>
      </div>
    </article>
  `).join("");

  document.querySelector("#fromAccount").innerHTML = state.accounts
    .filter(account => account.type !== "Credit")
    .map(account => `<option value="${account.name}">${account.name} - ${account.number}</option>`)
    .join("");
}

function renderTransactions(list = state.transactions) {
  const rows = list.map(item => `
    <tr>
      <td data-label="Date">${item.date}</td>
      <td data-label="Description"><strong>${item.description}</strong></td>
      <td data-label="Category">${item.category}</td>
      <td data-label="Account">${item.account}</td>
      <td data-label="Amount" class="num ${item.amount < 0 ? "negative" : "positive"}">${formatAmount(item.amount)}</td>
      <td data-label="Status"><span class="status-pill">${item.status}</span></td>
    </tr>
  `).join("");
  document.querySelector("#transactionRows").innerHTML = rows;
  document.querySelector("#historyRows").innerHTML = rows;
}

async function withBusy(button, label, action) {
  const original = button.textContent;
  button.disabled = true;
  button.textContent = label;
  try {
    return await action();
  } finally {
    button.disabled = false;
    button.textContent = original;
  }
}

function renderSpending() {
  document.querySelector("#spendingBars").innerHTML = spending.map(item => `
    <div class="bar-row">
      <strong>${item.label}</strong>
      <div class="bar-track" aria-label="${item.label} spending">
        <div class="bar-fill" style="width:${item.pct}%"></div>
      </div>
      <span>${money.format(item.value)}</span>
    </div>
  `).join("");
}

function renderCards() {
  document.querySelector("#bankCards").innerHTML = state.cards.map((card, index) => `
    <article class="bank-card ${card.kind === "credit" ? "credit" : ""}">
      <header class="card-topline">
        <h3>${card.name}</h3>
        <span class="status-pill">${card.frozen ? "Frozen" : card.status}</span>
      </header>
      <div class="card-chip" aria-hidden="true"></div>
      <p class="card-number">${cardsVisible ? card.number : maskCardNumber(card.number)}</p>
      <footer class="card-footer">
        <div><span>Cardholder</span><strong>${state.user.name || card.holder}</strong></div>
        <div><span>Valid thru</span><strong>${card.detailLabel === "Expires" ? card.detail : "11/29"}</strong></div>
        <strong class="card-network">${card.kind === "credit" ? "Mastercard" : "Visa"}</strong>
      </footer>
      <div class="card-actions">
        <button class="secondary-btn" type="button" data-card-action="freeze" data-card-index="${index}">${card.frozen ? "Unfreeze" : "Freeze"}</button>
        <button class="secondary-btn" type="button" data-card-action="visibility" data-card-index="${index}">${cardsVisible ? "Hide" : "Show"}</button>
        <button class="secondary-btn" type="button" data-card-action="limits" data-card-index="${index}">Limits</button>
        <button class="secondary-btn" type="button" data-card-action="replace" data-card-index="${index}">Replace</button>
      </div>
    </article>
  `).join("");
}

function maskCardNumber(number) {
  const digits = String(number).replace(/\D/g, "");
  if (digits.length < 4) return "**** **** **** ****";
  return `**** **** **** ${digits.slice(-4)}`;
}

function renderBills() {
  document.querySelector("#billList").innerHTML = state.bills.map((bill, index) => `
    <article class="bill-item">
      <div>
        <strong>${bill.name}</strong>
        <span>${bill.due}</span>
      </div>
      <div>
        <strong>${bill.amount}</strong>
        <span>${bill.paid ? "Paid" : bill.status}</span>
      </div>
      <button class="secondary-btn" type="button" data-bill-index="${index}" ${bill.paid ? "disabled" : ""}>${bill.paid ? "Paid" : "Pay"}</button>
    </article>
  `).join("");
}

function renderProfile() {
  document.querySelector(".profile-list").innerHTML = `
    <div><span>Full name</span><strong>${state.user.name}</strong></div>
    <div><span>Email</span><strong>${state.user.email}</strong></div>
    <div><span>Phone</span><strong>${state.user.phone}</strong></div>
    <div><span>Address</span><strong>${state.user.address}</strong></div>
    <div><span>Customer ID</span><strong>${state.user.customerId}</strong></div>
    <div><span>Session</span><strong>Server authenticated</strong></div>
  `;
}

function renderAll() {
  renderIdentity();
  renderAccounts();
  renderTransactions();
  renderSpending();
  renderCards();
  renderBills();
  renderProfile();
}

function showPage(page) {
  document.querySelectorAll(".page").forEach(section => section.classList.toggle("active", section.id === page));
  document.querySelectorAll("[data-page]").forEach(button => button.classList.toggle("active", button.dataset.page === page));
  document.querySelector("#pageTitle").textContent = pageTitles[page] || "Dashboard";
  document.querySelector(".sidebar").classList.remove("open");
}

function showModal(title, text) {
  document.querySelector("#modalTitle").textContent = title;
  document.querySelector("#modalText").textContent = text;
  document.querySelector("#modal").hidden = false;
}

document.querySelector("#loginForm").addEventListener("submit", async event => {
  event.preventDefault();
  const submitButton = event.submitter;
  const userId = document.querySelector("#loginUser").value.trim();
  const password = document.querySelector("#loginPassword").value;
  const message = document.querySelector("#loginMessage");

  await withBusy(submitButton, "Signing in", async () => {
    try {
      await api("/api/login", { method: "POST", body: JSON.stringify({ userId, password }) });
      message.textContent = "";
      setSignedIn(true);
      await loadState();
      showPage("dashboard");
    } catch (error) {
      message.textContent = "The user ID or password entered is incorrect.";
      message.className = "form-message negative";
    }
  });
});

document.querySelector("#logoutBtn").addEventListener("click", async () => {
  await api("/api/logout", { method: "POST", body: "{}" });
  setSignedIn(false);
});

document.querySelector("#toggleBalance").addEventListener("click", () => {
  balancesVisible = !balancesVisible;
  renderAccounts();
});

document.addEventListener("click", event => {
  const pageButton = event.target.closest("[data-page]");
  if (pageButton) {
    showPage(pageButton.dataset.page);
  }
});

document.querySelector(".menu-btn").addEventListener("click", () => {
  document.querySelector(".sidebar").classList.toggle("open");
});

document.querySelector("#closeModal").addEventListener("click", () => {
  document.querySelector("#modal").hidden = true;
});

document.querySelector("#contactBankBtn").addEventListener("click", () => {
  showModal("Contact Northlane Bank", "Call 1-800-555-0198 or send a secure message from your account inbox.");
});

document.querySelector("#searchInput").addEventListener("input", event => {
  const query = event.target.value.trim().toLowerCase();
  const filtered = state.transactions.filter(item =>
    [item.description, item.category, item.account, item.status].some(value => value.toLowerCase().includes(query))
  );
  renderTransactions(filtered);
});

document.querySelector("#transferForm").addEventListener("submit", async event => {
  event.preventDefault();
  const submitButton = event.submitter;
  const amount = Number(document.querySelector("#transferAmount").value);
  const fromAccount = document.querySelector("#fromAccount").value;
  const recipientChoice = document.querySelector("#toRecipient").value;
  const external = recipientChoice === "external";
  const recipient = external ? document.querySelector("#externalName").value.trim() : recipientChoice;
  const routing = document.querySelector("#externalRouting").value.trim();
  const accountNumber = document.querySelector("#externalAccount").value.trim();
  const memo = document.querySelector("#transferMemo").value.trim();
  const message = document.querySelector("#transferMessage");

  await withBusy(submitButton, "Processing", async () => {
    try {
      applyState(await api("/api/transfer", {
        method: "POST",
        body: JSON.stringify({ amount, fromAccount, recipient, memo, external, routing, accountNumber })
      }));
      message.textContent = `Transfer of ${money.format(amount)} to ${recipient} is processing and will be completed after 2 to 3 business days.`;
      message.className = "form-message positive";
      showModal("Transfer Submitted", "This transaction is processing and will be completed after 2 to 3 business days.");
    } catch (error) {
      message.textContent = error.message;
      message.className = "form-message negative";
    }
  });
});

document.querySelector("#exportBtn").addEventListener("click", () => {
  const header = "Date,Description,Category,Account,Amount,Status";
  const rows = state.transactions.map(item => [item.date, item.description, item.category, item.account, item.amount, item.status].join(","));
  const csv = [header, ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "northlane-transactions.csv";
  link.click();
  URL.revokeObjectURL(url);
});

document.querySelector("#bankCards").addEventListener("click", async event => {
  const button = event.target.closest("[data-card-action]");
  if (!button) return;

  const index = Number(button.dataset.cardIndex);
  const card = state.cards[index];
  const action = button.dataset.cardAction;

  if (action === "freeze") {
    await withBusy(button, "Updating", async () => {
      const response = await api("/api/card", { method: "POST", body: JSON.stringify({ index, action }) });
      applyState(response.state);
      showModal("Card Control Updated", `${response.card.name} is now ${response.card.frozen ? "frozen" : "unfrozen"}.`);
    });
  }

  if (action === "visibility") {
    cardsVisible = !cardsVisible;
    renderCards();
  }

  if (action === "limits") {
    showModal("Card Limits", `${card.name} has a purchase limit of $3,000/day and ATM limit of $600/day.`);
  }

  if (action === "replace") {
    showModal("Contact Northlane Bank", `To replace ${card.name}, contact Northlane Bank at 1-800-555-0198 or send a secure message from your account inbox.`);
  }
});

document.querySelector("#billList").addEventListener("click", async event => {
  const button = event.target.closest("[data-bill-index]");
  if (!button) return;
  const index = Number(button.dataset.billIndex);
  const bill = state.bills[index];
  await withBusy(button, "Processing", async () => {
    applyState(await api("/api/bill", { method: "POST", body: JSON.stringify({ index }) }));
    showModal("Bill Payment Scheduled", `${bill.name} is processing and will be completed after 2 to 3 business days.`);
  });
});

document.querySelector("#openAccountBtn").addEventListener("click", () => {
  showModal("Contact Northlane Bank", "To open a new account, contact Northlane Bank at 1-800-555-0198 or send a secure message from your account inbox.");
});

document.querySelector("#requestCardBtn").addEventListener("click", () => {
  showModal("Contact Northlane Bank", "To request a new card, contact Northlane Bank at 1-800-555-0198 or send a secure message from your account inbox.");
});

document.querySelector("#payeeForm").addEventListener("submit", async event => {
  event.preventDefault();
  const submitButton = event.submitter;
  const message = document.querySelector("#payeeMessage");
  const name = document.querySelector("#payeeName").value.trim();
  const amount = Number(document.querySelector("#payeeAmount").value);
  const dueDate = document.querySelector("#payeeDueDate").value;
  const status = document.querySelector("#payeeStatus").value;

  await withBusy(submitButton, "Adding", async () => {
    try {
      applyState(await api("/api/payee", {
        method: "POST",
        body: JSON.stringify({ name, amount, dueDate, status })
      }));
      event.target.reset();
      document.querySelector("#payeeDueDate").valueAsDate = new Date();
      message.textContent = `${name} was added to bill pay.`;
      message.className = "form-message positive";
      showModal("Payee Added", `${name} was added to the bill list.`);
    } catch (error) {
      message.textContent = error.message;
      message.className = "form-message negative";
    }
  });
});

document.querySelector("#saveSecurityBtn").addEventListener("click", () => {
  showModal("Security Saved", "Security preferences were saved for this server session.");
});

async function init() {
  document.querySelector("#transferDate").valueAsDate = new Date();
  document.querySelector("#payeeDueDate").valueAsDate = new Date();
  document.querySelector("#toRecipient").addEventListener("change", event => {
    document.querySelector("#externalFields").hidden = event.target.value !== "external";
  });
  try {
    const session = await api("/api/session");
    setSignedIn(session.signedIn);
    if (session.signedIn) {
      await loadState();
    }
  } catch {
    setSignedIn(false);
  }
}

init();
