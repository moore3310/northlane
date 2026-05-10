const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const root = __dirname;
const port = Number(process.env.PORT || 4173);
const host = process.env.HOST || (process.env.PORT ? "0.0.0.0" : "127.0.0.1");
const dataFile = path.join(root, "data.json");
const sessions = new Map();

const user = {
  id: "mary.wyman",
  name: "Mary Wyman",
  initials: "MW",
  email: "mary.wyman@example.test",
  phone: "(555) 014-2288",
  address: "6995 Highway 29 N, Prescott, AR 71857",
  customerId: "NB-482910",
  salt: "northlane-secure-local",
  passwordHash: crypto.pbkdf2Sync("Northlane2026", "northlane-secure-local", 120000, 32, "sha256").toString("hex")
};

const defaultData = {
  accounts: [
    { name: "Everyday Checking", type: "Checking", balance: 850000, number: "**** 4821", routing: "071000013", limit: "$5,000/day", status: "Active" },
    { name: "Growth Savings", type: "Savings", balance: 28410.8, number: "**** 9274", routing: "071000013", limit: "$10,000/day", status: "Active" },
    { name: "Travel Reserve", type: "Savings", balance: 6225.16, number: "**** 6630", routing: "071000013", limit: "$2,500/day", status: "Active" },
    { name: "Rewards Credit", type: "Credit", balance: -2750.45, number: "**** 1188", routing: "N/A", limit: "$20,000", status: "Payment due" }
  ],
  transactions: [
    { date: "May 10, 2026", description: "External account transfer", category: "External Transfer", account: "Everyday Checking", amount: -2500.03, status: "Processing" },
    { date: "May 9, 2026", description: "Payroll Deposit", category: "Income", account: "Everyday Checking", amount: 8420, status: "Posted" },
    { date: "May 8, 2026", description: "Pacific Market", category: "Groceries", account: "Rewards Credit", amount: -86.42, status: "Posted" },
    { date: "May 7, 2026", description: "City Utilities", category: "Bills", account: "Everyday Checking", amount: -142.18, status: "Posted" },
    { date: "May 6, 2026", description: "Northline Rail", category: "Travel", account: "Rewards Credit", amount: -44.9, status: "Posted" },
    { date: "May 4, 2026", description: "CloudDesk Software", category: "Business", account: "Everyday Checking", amount: -29.99, status: "Posted" },
    { date: "May 3, 2026", description: "Blue Harbor Cafe", category: "Dining", account: "Rewards Credit", amount: -61.72, status: "Posted" },
    { date: "Apr 30, 2026", description: "Payroll Deposit", category: "Income", account: "Everyday Checking", amount: 8420, status: "Posted" },
    { date: "Apr 26, 2026", description: "Northlane Credit Card Payment", category: "Payment", account: "Everyday Checking", amount: -275, status: "Posted" },
    { date: "Apr 22, 2026", description: "Northlane Credit Card Payment", category: "Payment", account: "Rewards Credit", amount: 642.59, status: "Posted" },
    { date: "Apr 18, 2026", description: "Home Internet", category: "Bills", account: "Everyday Checking", amount: -78, status: "Posted" },
    { date: "Apr 15, 2026", description: "Federal Tax Refund", category: "Income", account: "Everyday Checking", amount: 3500, status: "Posted" },
    { date: "Apr 11, 2026", description: "Metro Insurance", category: "Bills", account: "Everyday Checking", amount: -118.34, status: "Posted" },
    { date: "Apr 7, 2026", description: "Mortgage Payment", category: "Housing", account: "Everyday Checking", amount: -3200, status: "Posted" },
    { date: "Mar 29, 2026", description: "Card Purchase - Home Furnishings", category: "Shopping", account: "Rewards Credit", amount: -3200, status: "Posted" },
    { date: "Mar 15, 2026", description: "Transfer to Growth Savings", category: "Transfer", account: "Everyday Checking", amount: -8100, status: "Posted" },
    { date: "Mar 15, 2026", description: "Transfer from Checking", category: "Transfer", account: "Growth Savings", amount: 8100, status: "Posted" },
    { date: "Feb 20, 2026", description: "Travel Reserve Deposit", category: "Transfer", account: "Everyday Checking", amount: -10000, status: "Posted" },
    { date: "Feb 20, 2026", description: "Transfer from Checking", category: "Transfer", account: "Travel Reserve", amount: 10000, status: "Posted" },
    { date: "Jan 31, 2026", description: "Annual Savings Interest", category: "Interest", account: "Growth Savings", amount: 310.8, status: "Posted" },
    { date: "Dec 18, 2025", description: "Prescott Travel Booking", category: "Travel", account: "Travel Reserve", amount: -8774.84, status: "Posted" },
    { date: "Oct 2, 2025", description: "Brokerage Transfer", category: "Transfer", account: "Everyday Checking", amount: -10896.46, status: "Posted" },
    { date: "Aug 20, 2025", description: "Travel Reserve Opening Deposit", category: "Deposit", account: "Travel Reserve", amount: 5000, status: "Posted" },
    { date: "Jun 10, 2025", description: "Growth Savings Opening Deposit", category: "Deposit", account: "Growth Savings", amount: 20000, status: "Posted" },
    { date: "Feb 15, 2025", description: "Incoming Wire Transfer", category: "Deposit", account: "Everyday Checking", amount: 125000, status: "Posted" },
    { date: "Jan 3, 2024", description: "Account Opening Deposit", category: "Deposit", account: "Everyday Checking", amount: 740000, status: "Posted" }
  ],
  cards: [
    { name: "Northlane Debit", kind: "debit", number: "4532 8841 7394 2086", holder: "Mary Wyman", detailLabel: "Expires", detail: "08/29", status: "Unlocked", frozen: false },
    { name: "Rewards Credit", kind: "credit", number: "5424 1188 4208 7731", holder: "$17,250.00", detailLabel: "Due date", detail: "May 22", status: "Payment due", frozen: false }
  ],
  bills: [
    { name: "City Utilities", due: "Due May 14", amount: "$142.18", status: "Autopay on", paid: false },
    { name: "Home Internet", due: "Due May 18", amount: "$78.00", status: "Scheduled", paid: false },
    { name: "Northlane Credit Card", due: "Due May 22", amount: "$275.00", status: "Minimum set", paid: false },
    { name: "Metro Insurance", due: "Due Jun 1", amount: "$118.34", status: "Needs review", paid: false }
  ]
};

let data = loadData();

const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8"
};

function todayLabel() {
  return new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function loadData() {
  if (!fs.existsSync(dataFile)) {
    return structuredClone(defaultData);
  }

  try {
    const saved = JSON.parse(fs.readFileSync(dataFile, "utf8"));
    return {
      accounts: Array.isArray(saved.accounts) ? saved.accounts : structuredClone(defaultData.accounts),
      transactions: Array.isArray(saved.transactions) ? saved.transactions : structuredClone(defaultData.transactions),
      cards: Array.isArray(saved.cards) ? saved.cards : structuredClone(defaultData.cards),
      bills: Array.isArray(saved.bills) ? saved.bills : structuredClone(defaultData.bills)
    };
  } catch {
    return structuredClone(defaultData);
  }
}

function saveData() {
  fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
}

function sendJson(response, status, body, headers = {}) {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8", ...headers });
  response.end(JSON.stringify(body));
}

function readJson(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.on("data", chunk => {
      body += chunk;
      if (body.length > 1_000_000) {
        request.destroy();
      }
    });
    request.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(error);
      }
    });
  });
}

function getCookies(request) {
  return Object.fromEntries((request.headers.cookie || "").split(";").filter(Boolean).map(cookie => {
    const [name, ...value] = cookie.trim().split("=");
    return [name, decodeURIComponent(value.join("="))];
  }));
}

function getSession(request) {
  const sessionId = getCookies(request).northlane_session;
  return sessionId && sessions.get(sessionId);
}

function requireSession(request, response) {
  const session = getSession(request);
  if (!session) {
    sendJson(response, 401, { error: "Not signed in" });
    return null;
  }
  return session;
}

function safeUser() {
  const { passwordHash, salt, ...profile } = user;
  return profile;
}

function snapshot() {
  return { user: safeUser(), ...data };
}

async function handleApi(request, response, url) {
  if (url.pathname === "/api/session" && request.method === "GET") {
    sendJson(response, 200, { signedIn: Boolean(getSession(request)), user: safeUser() });
    return true;
  }

  if (url.pathname === "/api/login" && request.method === "POST") {
    const body = await readJson(request);
    const hash = crypto.pbkdf2Sync(String(body.password || ""), user.salt, 120000, 32, "sha256").toString("hex");
    if (body.userId !== user.id || hash !== user.passwordHash) {
      sendJson(response, 401, { error: "Invalid credentials" });
      return true;
    }

    const sessionId = crypto.randomBytes(32).toString("hex");
    sessions.set(sessionId, { userId: user.id, createdAt: Date.now() });
    sendJson(response, 200, { signedIn: true, user: safeUser() }, {
      "Set-Cookie": `northlane_session=${sessionId}; HttpOnly; SameSite=Lax; Path=/; Max-Age=7200`
    });
    return true;
  }

  if (url.pathname === "/api/logout" && request.method === "POST") {
    const sessionId = getCookies(request).northlane_session;
    if (sessionId) sessions.delete(sessionId);
    sendJson(response, 200, { signedIn: false }, {
      "Set-Cookie": "northlane_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0"
    });
    return true;
  }

  if (url.pathname === "/api/state" && request.method === "GET") {
    if (!requireSession(request, response)) return true;
    sendJson(response, 200, snapshot());
    return true;
  }

  if (url.pathname === "/api/transfer" && request.method === "POST") {
    if (!requireSession(request, response)) return true;
    const body = await readJson(request);
    const amount = Number(body.amount);
    const recipient = String(body.recipient || "").trim();
    const source = data.accounts.find(account => account.name === body.fromAccount && account.type !== "Credit");
    if (!source || !Number.isFinite(amount) || amount <= 0) {
      sendJson(response, 400, { error: "Invalid transfer" });
      return true;
    }
    if (!recipient) {
      sendJson(response, 400, { error: "Recipient is required" });
      return true;
    }
    if (body.external) {
      const routing = String(body.routing || "");
      const accountNumber = String(body.accountNumber || "");
      if (!/^\d{9}$/.test(routing) || !/^\d{4,17}$/.test(accountNumber)) {
        sendJson(response, 400, { error: "Enter a valid routing and account number" });
        return true;
      }
    }
    if (source.balance < amount) {
      sendJson(response, 400, { error: "Insufficient available balance" });
      return true;
    }
    source.balance = Math.round((source.balance - amount) * 100) / 100;
    data.transactions.unshift({
      date: todayLabel(),
      description: body.memo || `Transfer to ${recipient}`,
      category: body.external ? "External Transfer" : "Transfer",
      account: source.name,
      amount: -amount,
      status: "Processing"
    });
    saveData();
    sendJson(response, 200, snapshot());
    return true;
  }

  if (url.pathname === "/api/card" && request.method === "POST") {
    if (!requireSession(request, response)) return true;
    const body = await readJson(request);
    const card = data.cards[Number(body.index)];
    if (!card) {
      sendJson(response, 404, { error: "Card not found" });
      return true;
    }
    if (body.action === "freeze") {
      card.frozen = !card.frozen;
    }
    saveData();
    sendJson(response, 200, { card, state: snapshot() });
    return true;
  }

  if (url.pathname === "/api/bill" && request.method === "POST") {
    if (!requireSession(request, response)) return true;
    const body = await readJson(request);
    const bill = data.bills[Number(body.index)];
    if (!bill) {
      sendJson(response, 404, { error: "Bill not found" });
      return true;
    }
    bill.paid = true;
    data.transactions.unshift({
      date: todayLabel(),
      description: `${bill.name} payment`,
      category: "Bills",
      account: "Everyday Checking",
      amount: -Number(bill.amount.replace(/[$,]/g, "")),
      status: "Processing"
    });
    saveData();
    sendJson(response, 200, snapshot());
    return true;
  }

  if (url.pathname === "/api/payee" && request.method === "POST") {
    if (!requireSession(request, response)) return true;
    const body = await readJson(request);
    const name = String(body.name || "").trim();
    const amount = Number(body.amount);
    const dueDate = String(body.dueDate || "").trim();
    const status = String(body.status || "Scheduled").trim();
    if (!name || !Number.isFinite(amount) || amount <= 0 || !dueDate) {
      sendJson(response, 400, { error: "Payee name, amount, and due date are required" });
      return true;
    }
    const due = new Date(`${dueDate}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    data.bills.push({ name, due: `Due ${due}`, amount: `$${amount.toFixed(2)}`, status, paid: false });
    saveData();
    sendJson(response, 200, snapshot());
    return true;
  }

  return false;
}

function serveStatic(url, response) {
  const requestedPath = url.pathname === "/" ? "/index.html" : url.pathname;
  const filePath = path.normalize(path.join(root, requestedPath));

  if (!filePath.startsWith(root)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      response.writeHead(404);
      response.end("Not found");
      return;
    }
    response.writeHead(200, { "Content-Type": types[path.extname(filePath)] || "application/octet-stream" });
    response.end(content);
  });
}

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host}`);
  try {
    if (url.pathname.startsWith("/api/") && await handleApi(request, response, url)) {
      return;
    }
    serveStatic(url, response);
  } catch (error) {
    sendJson(response, 500, { error: "Server error" });
  }
});

server.listen(port, host, () => {
  console.log(`Northlane Secure Banking running at http://${host}:${port}`);
});
