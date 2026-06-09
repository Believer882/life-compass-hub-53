import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useApp } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, Trash2, Bell, Volume2, Flame } from "lucide-react";
import { ALARM_SOUNDS, playAlarm } from "@/lib/alarm";

export const Route = createFileRoute("/routines")({
  head: () => ({ meta: [{ title: "Routines — Unified Life" }] }),
  component: RoutinesPage,
});

function RoutinesPage() {
  const { routines, addRoutine, toggleRoutineToday, deleteRoutine } = useApp();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [motive, setMotive] = useState("");
  const [time, setTime] = useState("08:00");
  const [alarmOn, setAlarmOn] = useState(true);
  const [sound, setSound] = useState("chime");

  const save = () => {
    if (!title.trim()) return;
    addRoutine({ title: title.trim(), motive: motive.trim() || undefined, time, alarm: { enabled: alarmOn, sound } });
    setTitle(""); setMotive(""); setTime("08:00"); setOpen(false);
  };

  const sorted = [...routines].sort((a,b) => a.time.localeCompare(b.time));
  const todayStr = new Date().toISOString().slice(0,10);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Routines</h1>
          <p className="text-muted-foreground">Your daily route — chronological habits that build momentum.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="gradient-primary text-primary-foreground shadow-glow"><Plus className="h-4 w-4 mr-1"/>New Routine</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Routine</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Title</Label><Input value={title} onChange={(e)=>setTitle(e.target.value)} placeholder="e.g. Morning Run"/></div>
              <div><Label>Motive (why?)</Label><Textarea value={motive} onChange={(e)=>setMotive(e.target.value)} placeholder="Why is this important to you?"/></div>
              <div><Label>Time</Label><Input type="time" value={time} onChange={(e)=>setTime(e.target.value)}/></div>
              <div className="rounded-lg border border-border bg-card/50 p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2"><Bell className="h-4 w-4"/>Alarm</Label>
                  <Switch checked={alarmOn} onCheckedChange={setAlarmOn}/>
                </div>
                {alarmOn && (
                  <div className="flex items-center gap-2">
                    <Select value={sound} onValueChange={setSound}><SelectTrigger className="flex-1"><SelectValue/></SelectTrigger>
                      <SelectContent>{ALARM_SOUNDS.map((s)=>(<SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>))}</SelectContent>
                    </Select>
                    <Button variant="outline" size="icon" onClick={()=>playAlarm(sound,1)}><Volume2 className="h-4 w-4"/></Button>
                  </div>
                )}
              </div>
            </div>
            <DialogFooter><Button onClick={save} className="gradient-primary text-primary-foreground">Add Routine</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="card-glass p-5">
        <h2 className="text-lg font-semibold mb-3">Today's Daily Route</h2>
        {sorted.length === 0 ? (
          <p className="text-sm text-muted-foreground">No routines yet.</p>
        ) : (
          <ol className="relative border-l-2 border-primary/30 ml-2 space-y-4">
            {sorted.map((r) => {
              const done = r.history.includes(todayStr);
              return (
                <li key={r.id} className="ml-6 relative">
                  <span className={`absolute -left-[33px] flex h-4 w-4 items-center justify-center rounded-full ${done?"gradient-success":"bg-muted"} ring-4 ring-background`}></span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono text-primary">{r.time}</span>
                    <span className={`font-medium ${done?"line-through opacity-70":""}`}>{r.title}</span>
                  </div>
                  <Button size="sm" variant={done?"secondary":"outline"} className="mt-1" onClick={()=>toggleRoutineToday(r.id)}>
                    {done ? "✓ Done today" : "Mark done"}
                  </Button>
                </li>
              );
            })}
          </ol>
        )}
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {sorted.map((r) => (
          <Card key={r.id} className="card-glass p-5">
            <div className="flex items-start justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold truncate">{r.title}</h3>
                  {r.alarm?.enabled && <Bell className="h-3.5 w-3.5 text-accent"/>}
                </div>
                <div className="text-xs text-muted-foreground">at {r.time}</div>
                {r.motive && <p className="text-sm text-muted-foreground mt-2 italic">"{r.motive}"</p>}
              </div>
              <Button variant="ghost" size="icon" onClick={()=>deleteRoutine(r.id)}><Trash2 className="h-4 w-4"/></Button>
            </div>
            <div className="mt-3 flex items-center gap-2 text-sm">
              <Flame className="h-4 w-4 text-accent"/>
              <span className="font-semibold">{r.daysActive}</span>
              <span className="text-muted-foreground">days active</span>
            </div>
            <MonthGrid history={r.history}/>
          </Card>
        ))}
      </div>
    </div>
  );
}

function MonthGrid({ history }: { history: string[] }) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const set = new Set(history);
  return (
    <div className="mt-4">
      <div className="text-xs text-muted-foreground mb-2">{now.toLocaleString(undefined,{month:"long",year:"numeric"})}</div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({length: daysInMonth}, (_,i)=>{
          const day = i+1;
          const dstr = `${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
          const done = set.has(dstr);
          const isToday = day === now.getDate();
          return (
            <div key={day} className={`aspect-square rounded text-[10px] flex items-center justify-center font-mono ${done ? "gradient-success text-primary-foreground" : "bg-muted/40 text-muted-foreground"} ${isToday?"ring-2 ring-primary":""}`}>
              {day}
            </div>
          );
        })}
      </div>
    </div>
  );
}