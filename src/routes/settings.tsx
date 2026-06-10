import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ALARM_SOUNDS,
  getCustomSounds,
  saveCustomSounds,
  getSettings,
  setSettings,
  playAlarm,
  stopAlarm,
  requestNotificationPermission,
  type CustomSound,
} from "@/lib/alarm";
import { Bell, Trash2, Upload, Volume2, Play, Square } from "lucide-react";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Alarm Settings — Unified Life" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const [volume, setVolume] = useState(0.6);
  const [customs, setCustoms] = useState<CustomSound[]>([]);
  const [perm, setPerm] = useState<string>("default");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setVolume(getSettings().volume);
    setCustoms(getCustomSounds());
    if (typeof Notification !== "undefined") setPerm(Notification.permission);
  }, []);

  const onVolume = (v: number) => {
    setVolume(v);
    setSettings({ volume: v });
  };

  const askPermission = async () => {
    const res = await requestNotificationPermission();
    setPerm(res);
    if (res === "granted") {
      new Notification("✅ Notifications enabled", { body: "You'll be alerted when tasks are due." });
      toast.success("Notifications enabled");
    } else if (res === "denied") {
      toast.error("Permission denied. Enable it in your browser settings.");
    }
  };

  const testNotification = () => {
    if (typeof Notification === "undefined") return toast.error("Notifications not supported");
    if (Notification.permission !== "granted") return toast.error("Grant permission first");
    new Notification("⏰ Test alarm", { body: "This is what a task alarm looks like.", requireInteraction: false });
    toast("Notification sent");
  };

  const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const added: CustomSound[] = [];
    for (const file of files) {
      if (!file.type.startsWith("audio/")) {
        toast.error(`${file.name} is not an audio file`);
        continue;
      }
      if (file.size > 3 * 1024 * 1024) {
        toast.error(`${file.name} exceeds 3 MB`);
        continue;
      }
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(r.result as string);
        r.onerror = reject;
        r.readAsDataURL(file);
      });
      added.push({ id: Math.random().toString(36).slice(2), label: file.name.replace(/\.[^.]+$/, ""), dataUrl });
    }
    const next = [...customs, ...added];
    setCustoms(next);
    saveCustomSounds(next);
    if (added.length) toast.success(`Added ${added.length} sound${added.length > 1 ? "s" : ""}`);
    if (fileRef.current) fileRef.current.value = "";
  };

  const removeCustom = (id: string) => {
    const next = customs.filter((c) => c.id !== id);
    setCustoms(next);
    saveCustomSounds(next);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Alarm Settings</h1>
        <p className="text-sm text-muted-foreground">Test alerts, set volume, manage permissions, upload custom sounds.</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Bell className="h-4 w-4" /> Browser Notifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Current status</span>
            <span className={`font-medium ${perm === "granted" ? "text-green-500" : perm === "denied" ? "text-destructive" : ""}`}>
              {perm}
            </span>
          </div>
          <div className="flex gap-2">
            <Button onClick={askPermission} disabled={perm === "granted"}>Request permission</Button>
            <Button variant="outline" onClick={testNotification}>Send test notification</Button>
          </div>
          {perm === "denied" && (
            <p className="text-xs text-muted-foreground">
              Blocked. Open the lock icon in your browser address bar → Site settings → allow Notifications.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Volume2 className="h-4 w-4" /> Default Volume</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Slider value={[volume * 100]} onValueChange={(v) => onVolume(v[0] / 100)} max={100} step={1} className="flex-1" />
            <span className="w-12 text-right text-sm tabular-nums">{Math.round(volume * 100)}%</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Test Built-in Sounds</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {ALARM_SOUNDS.map((s) => (
            <Button key={s.id} variant="outline" onClick={() => playAlarm(s.id, 2)}>
              <Play className="h-3 w-3" /> {s.label}
            </Button>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Upload className="h-4 w-4" /> Custom Sounds</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label htmlFor="sound-upload" className="text-sm text-muted-foreground">
              Upload MP3/WAV/OGG (max 3 MB each). Stored locally on this device.
            </Label>
            <Input id="sound-upload" ref={fileRef} type="file" accept="audio/*" multiple onChange={onUpload} className="mt-2" />
          </div>
          {customs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No custom sounds uploaded yet.</p>
          ) : (
            <ul className="space-y-2">
              {customs.map((c) => (
                <li key={c.id} className="flex items-center justify-between rounded-md border border-border/60 bg-card/40 px-3 py-2">
                  <span className="text-sm font-medium truncate">{c.label}</span>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => playAlarm(`custom:${c.id}`, 1)}>
                      <Play className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={stopAlarm}>
                      <Square className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => removeCustom(c.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <p className="text-xs text-muted-foreground">
            Custom sounds appear in the task alarm sound picker as "Custom: name".
          </p>
        </CardContent>
      </Card>
    </div>
  );
}