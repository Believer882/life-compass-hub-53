import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useApp } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { Plus, Trash2, TrendingUp, TrendingDown, Wallet } from "lucide-react";

export const Route = createFileRoute("/finances")({
  head: () => ({ meta: [{ title: "Finances — Unified Life" }] }),
  component: FinancesPage,
});

const CATEGORIES = ["Salary","Freelance","Food","Rent","Transport","Entertainment","Shopping","Health","Savings","Other"];

function FinancesPage() {
  const { transactions, addTransaction, deleteTransaction } = useApp();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"income"|"expense">("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Food");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0,10));

  const save = () => {
    const a = parseFloat(amount);
    if (!a || a <= 0) return;
    addTransaction({ type, amount: a, category, note: note||undefined, date: new Date(date).toISOString() });
    setAmount(""); setNote(""); setOpen(false);
  };

  const income = transactions.filter(t=>t.type==="income").reduce((s,t)=>s+t.amount,0);
  const expense = transactions.filter(t=>t.type==="expense").reduce((s,t)=>s+t.amount,0);
  const balance = income - expense;

  // Build daily balance trend
  const sorted = [...transactions].sort((a,b)=>a.date.localeCompare(b.date));
  let running = 0;
  const chartData = sorted.map((t)=>{
    running += t.type === "income" ? t.amount : -t.amount;
    return { date: t.date.slice(5,10), balance: +running.toFixed(2) };
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Finances</h1>
          <p className="text-muted-foreground">Track income, expenses, and balance.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="gradient-primary text-primary-foreground shadow-glow"><Plus className="h-4 w-4 mr-1"/>New Transaction</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Transaction</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <Button type="button" variant={type==="income"?"default":"outline"} onClick={()=>setType("income")} className={type==="income"?"gradient-success text-primary-foreground":""}>Income</Button>
                <Button type="button" variant={type==="expense"?"default":"outline"} onClick={()=>setType("expense")} className={type==="expense"?"gradient-accent text-primary-foreground":""}>Expense</Button>
              </div>
              <div><Label>Amount</Label><Input type="number" step="0.01" value={amount} onChange={(e)=>setAmount(e.target.value)} placeholder="0.00"/></div>
              <div><Label>Category</Label>
                <Select value={category} onValueChange={setCategory}><SelectTrigger><SelectValue/></SelectTrigger>
                  <SelectContent>{CATEGORIES.map((c)=>(<SelectItem key={c} value={c}>{c}</SelectItem>))}</SelectContent>
                </Select>
              </div>
              <div><Label>Date</Label><Input type="date" value={date} onChange={(e)=>setDate(e.target.value)}/></div>
              <div><Label>Note</Label><Input value={note} onChange={(e)=>setNote(e.target.value)}/></div>
            </div>
            <DialogFooter><Button onClick={save} className="gradient-primary text-primary-foreground">Save</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard label="Balance" value={`$${balance.toFixed(2)}`} icon={Wallet} grad={balance>=0?"gradient-success":"gradient-accent"}/>
        <MetricCard label="Income (Profit)" value={`$${income.toFixed(2)}`} icon={TrendingUp} grad="gradient-success"/>
        <MetricCard label="Expense (Loss)" value={`$${expense.toFixed(2)}`} icon={TrendingDown} grad="gradient-accent"/>
      </div>

      <Card className="card-glass p-5">
        <h2 className="text-lg font-semibold mb-3">Balance Trend</h2>
        {chartData.length === 0 ? (
          <p className="text-sm text-muted-foreground">Add your first transaction to see the trend.</p>
        ) : (
          <div className="h-64">
            <ResponsiveContainer>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="bal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.5}/>
                    <stop offset="100%" stopColor="var(--primary)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={11}/>
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11}/>
                <Tooltip contentStyle={{background:"var(--card)", border:"1px solid var(--border)", borderRadius:8}}/>
                <Area type="monotone" dataKey="balance" stroke="var(--primary)" strokeWidth={2} fill="url(#bal)"/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      <Card className="card-glass p-5">
        <h2 className="text-lg font-semibold mb-3">Transaction Log</h2>
        {transactions.length === 0 ? (
          <p className="text-sm text-muted-foreground">No transactions yet.</p>
        ) : (
          <div className="space-y-2">
            {[...transactions].reverse().map((t)=>(
              <div key={t.id} className="flex items-center justify-between rounded-lg border border-border/50 bg-card/40 p-3">
                <div className="min-w-0">
                  <div className="font-medium">{t.category}{t.note?` — ${t.note}`:""}</div>
                  <div className="text-xs text-muted-foreground">{new Date(t.date).toLocaleDateString()}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`font-semibold ${t.type==="income"?"text-[oklch(0.72_0.17_150)]":"text-[oklch(0.78_0.17_60)]"}`}>
                    {t.type==="income"?"+":"-"}${t.amount.toFixed(2)}
                  </span>
                  <Button variant="ghost" size="icon" onClick={()=>deleteTransaction(t.id)}><Trash2 className="h-4 w-4"/></Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function MetricCard({ label, value, icon: Icon, grad }: any) {
  return (
    <Card className="card-glass relative overflow-hidden p-5">
      <div className={`absolute -right-6 -top-6 h-20 w-20 rounded-full ${grad} opacity-20 blur-2xl`}/>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs text-muted-foreground uppercase tracking-wide">{label}</div>
          <div className="mt-1 text-2xl font-bold">{value}</div>
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${grad}`}><Icon className="h-5 w-5 text-primary-foreground"/></div>
      </div>
    </Card>
  );
}