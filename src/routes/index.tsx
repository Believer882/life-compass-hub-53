import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { useApp } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckSquare, Repeat, Target, TrendingUp, Wallet, Smile, Clock } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Unified Life" },
      { name: "description", content: "Your daily summary, schedule, and progress at a glance." },
    ],
  }),
  component: Index,
});

function Index() {
  const { tasks, routines, goals, transactions, moods } = useApp();
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayTasks = tasks.filter(
    (t) => t.scheduledAt?.slice(0, 10) === todayStr || (!t.scheduledAt && !t.completed),
  );
  const doneToday = todayTasks.filter((t) => t.completed).length;
  const balance = transactions.reduce((s, t) => s + (t.type === "income" ? t.amount : -t.amount), 0);
  const moodAvg = moods.length
    ? (moods.slice(-7).reduce((s, m) => s + m.score, 0) / Math.min(moods.length, 7)).toFixed(1)
    : "—";

  const upcoming = [...tasks]
    .filter((t) => t.scheduledAt && !t.completed && new Date(t.scheduledAt) >= new Date())
    .sort((a, b) => a.scheduledAt!.localeCompare(b.scheduledAt!))
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back <span className="text-gradient">.</span>
        </h1>
        <p className="text-muted-foreground">Here's your command center for today.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Tasks Today" value={`${doneToday}/${todayTasks.length}`} icon={CheckSquare} accent="primary" />
        <StatCard label="Active Routines" value={routines.length.toString()} icon={Repeat} accent="accent" />
        <StatCard label="Goals" value={goals.length.toString()} icon={Target} accent="success" />
        <StatCard label="Balance" value={`$${balance.toFixed(2)}`} icon={Wallet} accent={balance >= 0 ? "success" : "destructive"} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="card-glass p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2"><Clock className="h-4 w-4 text-primary"/>Today's Schedule</h2>
            <Link to="/tasks" className="text-xs text-primary hover:underline">View all</Link>
          </div>
          {upcoming.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing scheduled. <Link to="/tasks" className="text-primary">Add a task</Link></p>
          ) : (
            <ul className="space-y-2">
              {upcoming.map((t) => (
                <li key={t.id} className="flex items-center justify-between rounded-lg border border-border/60 bg-card/40 p-3">
                  <div>
                    <div className="text-sm font-medium">{t.title}</div>
                    <div className="text-xs text-muted-foreground">{new Date(t.scheduledAt!).toLocaleString(undefined, {weekday:"short",hour:"numeric",minute:"2-digit"})}</div>
                  </div>
                  <Badge variant="outline" className="capitalize">{t.priority}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="card-glass p-5">
          <h2 className="mb-4 text-lg font-semibold flex items-center gap-2"><Target className="h-4 w-4 text-accent"/>Goal Progress</h2>
          {goals.length === 0 ? (
            <p className="text-sm text-muted-foreground">No goals yet. <Link to="/goals" className="text-primary">Add one</Link></p>
          ) : (
            <div className="space-y-3">
              {goals.slice(0, 3).map((g) => {
                const done = g.milestones.filter((m) => m.done).length;
                const pct = g.milestones.length ? (done / g.milestones.length) * 100 : 0;
                return (
                  <div key={g.id}>
                    <div className="mb-1 flex justify-between text-sm"><span className="truncate">{g.title}</span><span className="text-muted-foreground">{Math.round(pct)}%</span></div>
                    <Progress value={pct} />
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="card-glass p-5">
          <h2 className="text-lg font-semibold flex items-center gap-2"><Smile className="h-4 w-4 text-accent"/>Mood (7-day avg)</h2>
          <p className="mt-2 text-4xl font-bold text-gradient">{moodAvg}<span className="text-base text-muted-foreground">/10</span></p>
          <Link to="/mood" className="mt-2 inline-block text-xs text-primary hover:underline">Log today's mood →</Link>
        </Card>
        <Card className="card-glass p-5">
          <h2 className="text-lg font-semibold flex items-center gap-2"><TrendingUp className="h-4 w-4 text-primary"/>Quick Actions</h2>
          <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
            <Link to="/tasks" className="rounded-lg border border-border/60 bg-card/40 p-3 hover:bg-card/80 transition">+ New Task</Link>
            <Link to="/routines" className="rounded-lg border border-border/60 bg-card/40 p-3 hover:bg-card/80 transition">+ Routine</Link>
            <Link to="/finances" className="rounded-lg border border-border/60 bg-card/40 p-3 hover:bg-card/80 transition">+ Transaction</Link>
            <Link to="/goals" className="rounded-lg border border-border/60 bg-card/40 p-3 hover:bg-card/80 transition">+ Goal</Link>
          </div>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, accent }: { label: string; value: string; icon: any; accent: "primary"|"accent"|"success"|"destructive" }) {
  const grad = accent === "primary" ? "gradient-primary" : accent === "accent" ? "gradient-accent" : accent === "success" ? "gradient-success" : "gradient-accent";
  return (
    <Card className="card-glass relative overflow-hidden p-5">
      <div className={`absolute -right-6 -top-6 h-20 w-20 rounded-full ${grad} opacity-20 blur-2xl`} />
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs text-muted-foreground uppercase tracking-wide">{label}</div>
          <div className="mt-1 text-2xl font-bold">{value}</div>
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${grad}`}>
          <Icon className="h-5 w-5 text-primary-foreground" />
        </div>
      </div>
    </Card>
  );
}
