import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useApp, type Priority } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, Trash2, Bell, BellOff, Volume2 } from "lucide-react";
import { ALARM_SOUNDS, playAlarm, requestNotificationPermission, getCustomSounds } from "@/lib/alarm";
import { toast } from "sonner";

export const Route = createFileRoute("/tasks")({
  head: () => ({ meta: [{ title: "Daily Tasks — Unified Life" }] }),
  component: TasksPage,
});

const priorityColors: Record<Priority, string> = {
  high: "bg-destructive/20 text-destructive border-destructive/40",
  medium: "bg-accent/20 text-accent border-accent/40",
  low: "bg-primary/20 text-primary border-primary/40",
};

function TasksPage() {
  const { tasks, addTask, toggleTask, deleteTask } = useApp();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [scheduledAt, setScheduledAt] = useState("");
  const [alarmOn, setAlarmOn] = useState(true);
  const [sound, setSound] = useState("chime");

  const save = async () => {
    if (!title.trim()) return;
    if (alarmOn && scheduledAt) await requestNotificationPermission();
    addTask({
      title: title.trim(),
      notes: notes.trim() || undefined,
      priority,
      scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
      alarm: scheduledAt ? { enabled: alarmOn, sound } : undefined,
    });
    toast.success("Task added" + (alarmOn && scheduledAt ? " with alarm" : ""));
    setTitle(""); setNotes(""); setPriority("medium"); setScheduledAt(""); setAlarmOn(true); setSound("chime");
    setOpen(false);
  };

  const sorted = [...tasks].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    if (a.scheduledAt && b.scheduledAt) return a.scheduledAt.localeCompare(b.scheduledAt);
    return b.createdAt.localeCompare(a.createdAt);
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Daily Tasks</h1>
          <p className="text-muted-foreground">Set scheduled times and alarms for what matters today.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-primary text-primary-foreground shadow-glow"><Plus className="h-4 w-4 mr-1"/>New Task</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Task</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Title</Label><Input value={title} onChange={(e)=>setTitle(e.target.value)} placeholder="What needs to get done?"/></div>
              <div><Label>Notes</Label><Textarea value={notes} onChange={(e)=>setNotes(e.target.value)} placeholder="Optional details"/></div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Priority</Label>
                  <Select value={priority} onValueChange={(v)=>setPriority(v as Priority)}>
                    <SelectTrigger><SelectValue/></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Scheduled time</Label>
                  <Input type="datetime-local" value={scheduledAt} onChange={(e)=>setScheduledAt(e.target.value)}/>
                </div>
              </div>
              {scheduledAt && (
                <div className="rounded-lg border border-border bg-card/50 p-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2"><Bell className="h-4 w-4"/>Alarm at scheduled time</Label>
                    <Switch checked={alarmOn} onCheckedChange={setAlarmOn}/>
                  </div>
                  {alarmOn && (
                    <div className="flex items-center gap-2">
                      <Select value={sound} onValueChange={setSound}>
                        <SelectTrigger className="flex-1"><SelectValue/></SelectTrigger>
                        <SelectContent>
                          {ALARM_SOUNDS.map((s)=>(<SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>))}
                          {getCustomSounds().map((c)=>(<SelectItem key={c.id} value={`custom:${c.id}`}>Custom: {c.label}</SelectItem>))}
                        </SelectContent>
                      </Select>
                      <Button type="button" variant="outline" size="icon" onClick={()=>playAlarm(sound,1)} title="Preview"><Volume2 className="h-4 w-4"/></Button>
                    </div>
                  )}
                </div>
              )}
            </div>
            <DialogFooter><Button onClick={save} className="gradient-primary text-primary-foreground">Add Task</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {sorted.length === 0 ? (
        <Card className="card-glass p-10 text-center text-muted-foreground">No tasks yet. Click "New Task" to add one.</Card>
      ) : (
        <div className="space-y-2">
          {sorted.map((t) => (
            <Card key={t.id} className={`card-glass p-4 transition ${t.completed ? "opacity-60" : ""}`}>
              <div className="flex items-start gap-3">
                <Checkbox checked={t.completed} onCheckedChange={()=>toggleTask(t.id)} className="mt-1"/>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`font-medium ${t.completed?"line-through":""}`}>{t.title}</span>
                    <Badge variant="outline" className={`capitalize ${priorityColors[t.priority]}`}>{t.priority}</Badge>
                    {t.alarm?.enabled ? <Bell className="h-3.5 w-3.5 text-accent"/> : t.scheduledAt ? <BellOff className="h-3.5 w-3.5 text-muted-foreground"/> : null}
                  </div>
                  {t.scheduledAt && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {new Date(t.scheduledAt).toLocaleString(undefined,{weekday:"short",month:"short",day:"numeric",hour:"numeric",minute:"2-digit"})}
                    </div>
                  )}
                  {t.notes && <p className="text-sm text-muted-foreground mt-1">{t.notes}</p>}
                </div>
                <Button variant="ghost" size="icon" onClick={()=>deleteTask(t.id)}><Trash2 className="h-4 w-4"/></Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}