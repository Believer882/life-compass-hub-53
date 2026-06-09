import { createFileRoute } from "@tanstack/react-router";
import { Fragment, useState } from "react";
import { useApp } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, X } from "lucide-react";

export const Route = createFileRoute("/planner")({
  head: () => ({ meta: [{ title: "Weekly Planner — Unified Life" }] }),
  component: PlannerPage,
});

const DAYS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
const HOURS = Array.from({length: 16}, (_,i) => i + 6); // 6am-9pm
const COLORS = ["primary","accent","success"] as const;

function PlannerPage() {
  const { plannerBlocks, addPlannerBlock, deletePlannerBlock } = useApp();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [day, setDay] = useState("0");
  const [startHour, setStartHour] = useState("9");
  const [duration, setDuration] = useState("1");
  const [color, setColor] = useState("primary");

  const save = () => {
    if (!title.trim()) return;
    addPlannerBlock({ title: title.trim(), day: +day, startHour: +startHour, duration: +duration, color });
    setTitle(""); setOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Weekly Planner</h1>
          <p className="text-muted-foreground">Time-block your week visually.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="gradient-primary text-primary-foreground shadow-glow"><Plus className="h-4 w-4 mr-1"/>Add Block</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Time Block</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Title</Label><Input value={title} onChange={(e)=>setTitle(e.target.value)} placeholder="Deep work, Gym, etc."/></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Day</Label>
                  <Select value={day} onValueChange={setDay}><SelectTrigger><SelectValue/></SelectTrigger>
                    <SelectContent>{DAYS.map((d,i)=>(<SelectItem key={d} value={String(i)}>{d}</SelectItem>))}</SelectContent>
                  </Select>
                </div>
                <div><Label>Color</Label>
                  <Select value={color} onValueChange={setColor}><SelectTrigger><SelectValue/></SelectTrigger>
                    <SelectContent>{COLORS.map((c)=>(<SelectItem key={c} value={c}>{c}</SelectItem>))}</SelectContent>
                  </Select>
                </div>
                <div><Label>Start hour</Label>
                  <Select value={startHour} onValueChange={setStartHour}><SelectTrigger><SelectValue/></SelectTrigger>
                    <SelectContent>{HOURS.map((h)=>(<SelectItem key={h} value={String(h)}>{h}:00</SelectItem>))}</SelectContent>
                  </Select>
                </div>
                <div><Label>Duration (h)</Label>
                  <Input type="number" min={1} max={12} value={duration} onChange={(e)=>setDuration(e.target.value)}/>
                </div>
              </div>
            </div>
            <DialogFooter><Button onClick={save} className="gradient-primary text-primary-foreground">Add</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="card-glass p-3 overflow-x-auto">
        <div className="min-w-[700px]">
          <div className="grid grid-cols-[60px_repeat(7,1fr)] gap-1">
            <div></div>
            {DAYS.map((d) => (
              <div key={d} className="text-center text-sm font-semibold py-2">{d}</div>
            ))}
            {HOURS.map((h) => (
              <Fragment key={`row-${h}`}>
                <div className="text-xs text-muted-foreground text-right pr-2 py-2 font-mono">{h}:00</div>
                {DAYS.map((_, dayIdx) => {
                  const block = plannerBlocks.find((b) => b.day === dayIdx && b.startHour === h);
                  const occupied = plannerBlocks.find((b) => b.day === dayIdx && h > b.startHour && h < b.startHour + b.duration);
                  if (occupied) return <div key={`${dayIdx}-${h}`}></div>;
                  return (
                    <div key={`${dayIdx}-${h}`} className="relative min-h-[44px] rounded border border-border/40 bg-card/20">
                      {block && (
                        <div className={`absolute inset-0 rounded gradient-${block.color === "primary" ? "primary" : block.color === "accent" ? "accent" : "success"} text-primary-foreground p-2 text-xs font-medium shadow-glow`} style={{height: `calc(${block.duration * 44}px + ${(block.duration-1)*4}px)`, zIndex: 1}}>
                          <div className="flex items-start justify-between">
                            <span className="truncate">{block.title}</span>
                            <button onClick={()=>deletePlannerBlock(block.id)} className="opacity-70 hover:opacity-100"><X className="h-3 w-3"/></button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </Fragment>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}