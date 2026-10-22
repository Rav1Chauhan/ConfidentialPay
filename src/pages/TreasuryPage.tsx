import { useState, type FormEvent } from "react";
import { useApiData } from "@/lib/useApiData";
import { Wallet, ArrowDownLeft, ArrowUpRight, RefreshCw, ArrowLeftRight } from "lucide-react";
import toast from "react-hot-toast";
import { api } from "@/lib/api";
import { fmtUSD, fmtNum, relTime } from "@/lib/format";
import { GlassCard, PageHeader, ChainBadge, StatusBadge } from "@/components/layout/Primitives";

export default function TreasuryPage() {
  const balances = useApiData<any>("/api/treasury/balances");
  const txs = useApiData<any[]>("/api/treasury/transactions", (payload) => payload.items ?? []);
  const settlements = useApiData<any[]>("/api/treasury/settlements", (payload) => payload.items ?? []);
  const [busy, setBusy] = useState<"deposit" | "withdraw" | "rebalance" | "settlement" | null>(null);
  const [sourceToken, setSourceToken] = useState("USDC");
  const [sourceChain, setSourceChain] = useState("BNB");
  const [destinationChain, setDestinationChain] = useState("ETH");
  const [amount, setAmount] = useState("100");
  const [settlementMessage, setSettlementMessage] = useState("");

  const data = balances.data;

  async function deposit() {
    setBusy("deposit");
    try {
      await api.post("/api/treasury/deposit", { amount: 10000, chain: "BNB", asset: "USDC" });
      toast.success("Deposit recorded");
      balances.reload();
      txs.reload();
    } catch {
      toast.error("Deposit failed");
    } finally {
      setBusy(null);
    }
  }

  async function withdraw() {
    setBusy("withdraw");
    try {
      await api.post("/api/treasury/withdraw", { amount: 2500, chain: "BNB", asset: "USDC" });
      toast.success("Withdrawal queued");
      balances.reload();
      txs.reload();
    } catch {
      toast.error("Withdrawal failed");
    } finally {
      setBusy(null);
    }
  }

  async function rebalance() {
    setBusy("rebalance");
    try {
      await api.post("/api/treasury/rebalance", { fromChain: "BNB", toChain: "ETH", amount: 5000 });
      toast.success("Rebalance planned");
      balances.reload();
      txs.reload();
    } catch {
      toast.error("Rebalance failed");
    } finally {
      setBusy(null);
    }
  }

  async function submitSettlement(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSettlementMessage("");
    setBusy("settlement");
    try {
      const response = await api.post("/api/treasury/settle", {
        sourceToken,
        sourceChain,
        destinationChain,
        amount: Number(amount),
      });
      const result = response.data;
      setSettlementMessage(result.message || "Settlement request recorded as a simulation.");
      toast.success("Settlement request submitted");
      settlements.reload();
    } catch (error: any) {
      const message = error?.response?.data?.message || "Could not submit settlement request.";
      setSettlementMessage(message);
      toast.error(message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Treasury"
        subtitle="Monitor multi-chain balances, reserves, and settlement liquidity."
        actions={
          <div className="flex flex-wrap gap-2">
            <button onClick={deposit} disabled={!!busy} className="btn-primary px-4 py-2 text-sm disabled:opacity-60">
              <ArrowDownLeft className="h-4 w-4" /> Deposit
            </button>
            <button
              onClick={withdraw}
              disabled={!!busy}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-4 py-2 text-sm font-semibold hover:bg-muted disabled:opacity-60"
            >
              <ArrowUpRight className="h-4 w-4" /> Withdraw
            </button>
            <button
              onClick={rebalance}
              disabled={!!busy}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-4 py-2 text-sm font-semibold hover:bg-muted disabled:opacity-60"
            >
              <RefreshCw className="h-4 w-4" /> Rebalance
            </button>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <GlassCard>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Total</p>
          <p className="mt-3 font-display text-3xl font-bold">{data ? fmtUSD(data.total) : "—"}</p>
        </GlassCard>
        <GlassCard>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Available</p>
          <p className="mt-3 font-display text-3xl font-bold">{data ? fmtUSD(data.available) : "—"}</p>
        </GlassCard>
        <GlassCard>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Reserved</p>
          <p className="mt-3 font-display text-3xl font-bold">{data ? fmtUSD(data.reserved) : "—"}</p>
        </GlassCard>
        <GlassCard>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Gas fees</p>
          <p className="mt-3 font-display text-3xl font-bold">{data ? fmtUSD(data.gasFees) : "—"}</p>
        </GlassCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <GlassCard>
          <div className="flex items-center gap-2">
            <ArrowLeftRight className="h-4 w-4 text-primary" />
            <h3 className="text-base font-semibold">Cross-chain settlement</h3>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">Submit a settlement request between supported chains. This demo records a simulated request; it does not move tokens on-chain.</p>
          <form onSubmit={submitSettlement} className="mt-4 space-y-4">
            <div>
              <label htmlFor="settlement-token" className="mb-1 block text-sm font-medium">Source token</label>
              <select id="settlement-token" value={sourceToken} onChange={(e) => setSourceToken(e.target.value)} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm">
                <option value="USDC">USDC</option>
                <option value="USDT">USDT</option>
                <option value="ETH">ETH</option>
              </select>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="source-chain" className="mb-1 block text-sm font-medium">Source chain</label>
                <select id="source-chain" value={sourceChain} onChange={(e) => setSourceChain(e.target.value)} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm">
                  <option value="BNB">BNB Chain</option><option value="ETH">Ethereum</option><option value="BASE">Base</option><option value="ARB">Arbitrum</option><option value="SOL">Solana</option><option value="MATIC">Polygon</option>
                </select>
              </div>
              <div>
                <label htmlFor="destination-chain" className="mb-1 block text-sm font-medium">Destination chain</label>
                <select id="destination-chain" value={destinationChain} onChange={(e) => setDestinationChain(e.target.value)} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm">
                  <option value="ETH">Ethereum</option><option value="BNB">BNB Chain</option><option value="BASE">Base</option><option value="ARB">Arbitrum</option><option value="SOL">Solana</option><option value="MATIC">Polygon</option>
                </select>
              </div>
            </div>
            <div>
              <label htmlFor="settlement-amount" className="mb-1 block text-sm font-medium">Amount</label>
              <input id="settlement-amount" type="number" min="0.000001" step="any" required value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm" placeholder="Enter amount" />
            </div>
            {sourceChain === destinationChain && <p className="text-sm text-destructive">Choose two different chains.</p>}
            {settlementMessage && <p role="status" className="rounded-lg border border-border bg-background/60 px-3 py-2 text-sm">{settlementMessage}</p>}
            <button type="submit" disabled={!!busy || sourceChain === destinationChain || !Number.isFinite(Number(amount)) || Number(amount) <= 0} className="btn-primary w-full justify-center px-4 py-2 text-sm disabled:opacity-60">
              {busy === "settlement" ? "Submitting…" : "Submit settlement request"}
            </button>
          </form>
        </GlassCard>

        <GlassCard>
          <h3 className="text-base font-semibold">Recent settlement attempts</h3>
          <p className="mt-1 text-sm text-muted-foreground">Latest requests submitted through this demo.</p>
          <div className="mt-4 space-y-3">
            {(settlements.data ?? []).slice(0, 8).map((item: any) => (
              <div key={item.id} className="rounded-xl border border-border bg-background/60 px-3 py-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">{fmtNum(item.amount)} {item.sourceToken}</p>
                    <p className="text-xs text-muted-foreground">{item.sourceChain} → {item.destinationChain} · {relTime(item.createdAt)}</p>
                  </div>
                  <StatusBadge status={item.status} />
                </div>
                <p className="mt-2 text-xs text-muted-foreground">{item.id} · simulated, no on-chain transfer</p>
              </div>
            ))}
            {!settlements.data?.length && !settlements.isLoading && <p className="text-sm text-muted-foreground">No settlement attempts yet.</p>}
            {settlements.isLoading && <p className="text-sm text-muted-foreground">Loading settlement history…</p>}
          </div>
        </GlassCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <GlassCard>
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-primary" />
            <h3 className="text-base font-semibold">Token balances</h3>
          </div>
          <div className="mt-4 space-y-3">
            {(data?.tokens ?? []).map((token: any) => (
              <div
                key={`${token.symbol}-${token.chain}`}
                className="flex items-center justify-between rounded-xl border border-border bg-background/60 px-3 py-3"
              >
                <div>
                  <p className="font-semibold">
                    {token.symbol} <span className="text-muted-foreground">· {token.chain}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">{fmtNum(token.balance)} units</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{fmtUSD(token.value)}</p>
                  <ChainBadge chain={token.chain} />
                </div>
              </div>
            ))}
            {!data?.tokens?.length && (
              <p className="text-sm text-muted-foreground">Loading treasury balances…</p>
            )}
          </div>
        </GlassCard>

        <GlassCard>
          <h3 className="text-base font-semibold">Recent treasury activity</h3>
          <div className="mt-4 space-y-3">
            {(txs.data ?? []).slice(0, 8).map((tx: any) => (
              <div key={tx.id} className="rounded-xl border border-border bg-background/60 px-3 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold capitalize">{tx.type}</p>
                    <p className="text-xs text-muted-foreground">{relTime(tx.date)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{fmtUSD(tx.amount)}</p>
                    <StatusBadge status={tx.status} />
                  </div>
                </div>
              </div>
            ))}
            {!txs.data?.length && !txs.isLoading && (
              <p className="text-sm text-muted-foreground">No treasury transactions yet.</p>
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
