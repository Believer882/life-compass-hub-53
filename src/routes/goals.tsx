import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useApp } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, Trash2, Target } from "lucide-react";

export const Route = createFileRoute("/goals")({
  head: () => ({ meta: [{ title: "Goals — Unified Life" }] }),
  component: GoalsPage,
});

function GoalsPage() {
  const { goals, addGoal, toggleMilestone, addMilestone, deleteGoal } = useApp();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [newMilestone, setNewMilestone] = useState<Record<string,string>>({});

  const save = () => {
    if (!title.trim()) return;
    addGoal({ title: title.trim(), description: description.trim() || undefined, deadline: deadline || undefined });
    setTitle(""); setDescription(""); setDeadline(""); setOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Goals</h1>
          <p className="text-muted-foreground">Track long-term progress with sub-milestones.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="gradient-primary text-primary-foreground shadow-glow"><Plus className="h-4 w-4 mr-1"/>New Goal</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Goal</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Title</Label><Input value={title} onChange={(e)=>setTitle(e.target.value)} placeholder="Run a half marathon"/></div>
              <div><Label>Description</Label><Textarea value={description} onChange={(e)=>setDescription(e.target.value)}/></div>
              <div><Label>Deadline</Label><Input type="date" value={deadline} onChange={(e)=>setDeadline(e.target.value)}/></div>
            </div>
            <DialogFooter><Button onClick={save} className="gradient-primary text-primary-foreground">Create Goal</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {goals.length === 0 ? (
        <Card className="card-glass p-10 text-center text-muted-foreground">No goals yet. Set your first one!</Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {goals.map((g) => {
            const done = g.milestones.filter((m) => m.done).length;
            const pct = g.milestones.length ? (done / g.milestones.length) * 100 : 0;
            return (
              <Card key={g.id} className="card-glass p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-primary"/>
                      <h3 className="font-semibold">{g.title}</h3>
                    </div>
                    {g.description && <p className="text-sm text-muted-foreground mt-1">{g.description}</p>}
                    {g.deadline && <p className="text-xs text-accent mt-1">Due {new Date(g.deadline).toLocaleDateString()}</p>}
                  </div>
                  <Button variant="ghost" size="icon" onClick={()=>deleteGoal(g.id)}><Trash2 className="h-4 w-4"/></Button>
                </div>
                <div className="mt-3">
                  <div className="flex justify-between text-xs mb-1"><span>{done}/{g.milestones.length} milestones</span><span>{Math.round(pct)}%</span></div>
                  <Progress value={pct}/>
                </div>
                <ul className="mt-3 space-y-1">
                  {g.milestones.map((m) => (
                    <li key={m.id} className="flex items-center gap-2 text-sm">
                      <Checkbox checked={m.done} onCheckedChange={()=>toggleMilestone(g.id, m.id)}/>
                      <span className={m.done?"line-through text-muted-foreground":""}>{m.title}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-2 flex gap-2">
                  <Input
                    placeholder="Add milestone…"
                    value={newMilestone[g.id] || ""}
                    onChange={(e)=>setNewMilestone({...newMilestone, [g.id]: e.target.value})}
                    onKeyDown={(e)=>{
                      if (e.key === "Enter" && (newMilestone[g.id]||"").trim()) {
                        addMilestone(g.id, newMilestone[g.id].trim());
                        setNewMilestone({...newMilestone, [g.id]: ""});
                      }
                    }}
                  />
                  <Button variant="outline" onClick={()=>{
                    const v = (newMilestone[g.id]||"").trim();
                    if (v) { addMilestone(g.id, v); setNewMilestone({...newMilestone, [g.id]: ""}); }
                  }}>Add</Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}