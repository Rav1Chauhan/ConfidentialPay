const asyncErrorHandler = require("../middlewares/helpers/asyncErrorHandler");
const { getAggregatedTreasury, simulateRebalance } = require("../services/treasury/multiChainBalance");
const { deposit, withdraw } = require("../services/treasury/depositWithdraw");
const { transactions } = require("../data/businessData");
const { appendAudit } = require("../services/compliance/auditTrail");
const { resolveChain } = require("../config/chains");
const { randomUUID } = require("crypto");

// In-memory history for this assessment demo; restart clears the list.
const settlementAttempts = [];

exports.getBalances = (req, res) => {
  res.status(200).json({ success: true, ...getAggregatedTreasury() });
};

exports.getTreasuryTransactions = (req, res) => {
  res.status(200).json({ success: true, items: transactions });
};

exports.rebalance = (req, res) => {
  const plan = simulateRebalance(req.body || {});
  appendAudit({ type: "treasury_rebalance", ...plan });
  res.status(201).json({ success: true, plan });
};

exports.deposit = (req, res) => {
  const result = deposit(req.body || {});
  appendAudit({ type: "treasury_deposit", amount: req.body?.amount, chain: req.body?.chain });
  res.status(201).json({ success: true, ...result });
};

exports.withdraw = (req, res, next) => {
  try {
    const result = withdraw(req.body || {});
    appendAudit({ type: "treasury_withdraw", amount: req.body?.amount, chain: req.body?.chain });
    res.status(201).json({ success: true, ...result });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ success: false, message: err.message });
    next(err);
  }
};


exports.listSettlementAttempts = (req, res) => {
  res.status(200).json({ success: true, items: settlementAttempts.slice(0, 50) });
};

exports.createSettlementAttempt = (req, res) => {
  const { sourceToken, sourceChain, destinationChain, amount } = req.body || {};
  const token = String(sourceToken || "").trim().toUpperCase();
  const allowedTokens = new Set(["USDC", "USDT", "ETH"]);
  const source = resolveChain(sourceChain);
  const destination = resolveChain(destinationChain);
  const numericAmount = Number(amount);

  if (!allowedTokens.has(token)) {
    return res.status(400).json({ success: false, message: "Unsupported source token. Choose USDC, USDT, or ETH." });
  }
  if (!source || !destination) {
    return res.status(400).json({ success: false, message: "Choose supported source and destination chains." });
  }
  if (source.key === destination.key) {
    return res.status(400).json({ success: false, message: "Source and destination chains must be different." });
  }
  if (!Number.isFinite(numericAmount) || numericAmount <= 0 || numericAmount > 1_000_000_000) {
    return res.status(400).json({ success: false, message: "Amount must be a positive number no greater than 1,000,000,000." });
  }

  const attempt = {
    id: `set_${randomUUID().slice(0, 8)}`,
    sourceToken: token,
    sourceChain: source.key,
    destinationChain: destination.key,
    amount: numericAmount,
    status: "simulated",
    createdAt: new Date().toISOString(),
    mode: "simulation",
  };
  settlementAttempts.unshift(attempt);
  if (settlementAttempts.length > 100) settlementAttempts.length = 100;
  appendAudit({ type: "treasury_settlement_simulated", ...attempt });

  return res.status(201).json({
    success: true,
    message: "Settlement request recorded in simulation mode. No on-chain transfer was executed.",
    item: attempt,
  });
};
