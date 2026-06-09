import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useApp } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { Heart } from "lucide-react";

export const Route = createFileRoute("/mood")({
  head: () => ({ meta: [{ title: "Mood & Journal — Unified Life" }] }),
  component: MoodPage,
});

const EMOJI = ["😞","😟","😕","😐","🙂","😊","😄","😁","🤩","🥳"];

function MoodPage() {
  const { moods, journal, logMood, addJournal } = useApp();
  const [score, setScore] = useState(7);
  const [note, setNote] = useState("");
  const [gratitude, setGratitude] = useState("");
  const [reflection, setReflection] = useState("");

  const chartData = moods.slice(-30).map((m) => ({ date: m.date.slice(5), score: m.score }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Mood & Journal</h1>
        <p className="text-muted-foreground">Track how you feel and capture gratitude.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="card-glass p-5">
          <h2 className="text-lg font-semibold mb-3">How do you feel today?</h2>
          <div className="text-7xl text-center my-2">{EMOJI[score-1]}</div>
          <input type="range" min={1} max={10} value={score} onChange={(e)=>setScore(+e.target.value)} className="w-full accent-primary"/>
          <div className="flex justify-between text-xs text-muted-foreground mt-1"><span>1</span><span className="font-bold text-base text-foreground">{score}/10</span><span>10</span></div>
          <Textarea className="mt-3" placeholder="Optional note about your mood…" value={note} onChange={(e)=>setNote(e.target.value)}/>
          <Button className="mt-3 w-full gradient-primary text-primary-foreground" onClick={()=>{logMood(score, note||undefined); setNote("");}}>Log Mood</Button>
        </Card>

        <Card className="card-glass p-5">
          <h2 className="text-lg font-semibold mb-3">Mood Trend</h2>
          {chartData.length === 0 ? (
            <p className="text-sm text-muted-foreground">Log your first mood to see the trend.</p>
          ) : (
            <div className="h-56">
              <ResponsiveContainer>
                <LineChart data={chartData}>
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={11}/>
                  <YAxis domain={[0,10]} stroke="hsl(var(--muted-foreground))" fontSize={11}/>
                  <Tooltip contentStyle={{background:"var(--card)", border:"1px solid var(--border)", borderRadius:8}}/>
                  <Line type="monotone" dataKey="score" stroke="var(--primary)" strokeWidth={3} dot={{fill:"var(--primary)"}}/>
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </div>

      <Card className="card-glass p-5">
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2"><Heart className="h-4 w-4 text-accent"/>Gratitude Journal</h2>
        <div className="space-y-3">
          <div><Label>I'm grateful for…</Label><Input value={gratitude} onChange={(e)=>setGratitude(e.target.value)} placeholder="Something good today"/></div>
          <div><Label>Reflection (optional)</Label><Textarea value={reflection} onChange={(e)=>setReflection(e.target.value)}/></div>
          <Button onClick={()=>{if(gratitude.trim()){addJournal(gratitude.trim(), reflection||undefined); setGratitude(""); setReflection("");}}} className="gradient-accent text-primary-foreground">Save Entry</Button>
        </div>
        <div className="mt-5 space-y-2">
          {[...journal].reverse().slice(0,10).map((j)=>(
            <div key={j.id} className="rounded-lg border border-border/50 bg-card/40 p-3">
              <div className="text-xs text-muted-foreground">{new Date(j.date).toLocaleDateString()}</div>
              <div className="text-sm font-medium mt-1">🙏 {j.gratitude}</div>
              {j.reflection && <div className="text-sm text-muted-foreground mt-1">{j.reflection}</div>}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}