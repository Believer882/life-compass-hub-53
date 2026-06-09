import { toast } from "sonner";
import { useApp, type Task } from "./store";

export const ALARM_SOUNDS = [
  { id: "chime", label: "Chime", freqs: [880, 1320], pattern: [0.15, 0.1, 0.15] },
  { id: "bell", label: "Bell", freqs: [660, 990, 1320], pattern: [0.2, 0.15, 0.2] },
  { id: "alert", label: "Alert", freqs: [440, 880], pattern: [0.1, 0.05, 0.1, 0.05, 0.1] },
  { id: "soft", label: "Soft Tone", freqs: [523, 659, 783], pattern: [0.3, 0.2, 0.3] },
  { id: "buzz", label: "Buzzer", freqs: [220, 240], pattern: [0.4, 0.1, 0.4] },
];

let audioCtx: AudioContext | null = null;
function getCtx() {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const Ctx = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext;
    if (!Ctx) return null;
    audioCtx = new Ctx();
  }
  if (audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
}

export function playAlarm(soundId: string, repeats = 3) {
  const ctx = getCtx();
  if (!ctx) return;
  const sound = ALARM_SOUNDS.find((s) => s.id === soundId) || ALARM_SOUNDS[0];
  const now = ctx.currentTime;
  let t = now;
  for (let r = 0; r < repeats; r++) {
    sound.freqs.forEach((f, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = f;
      const dur = sound.pattern[i % sound.pattern.length];
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.25, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + dur + 0.05);
      t += dur + 0.05;
    });
    t += 0.2;
  }
}

export async function requestNotificationPermission() {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported" as const;
  if (Notification.permission === "granted") return "granted" as const;
  if (Notification.permission === "denied") return "denied" as const;
  const res = await Notification.requestPermission();
  return res;
}

function notify(task: Task) {
  if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
    try {
      new Notification("⏰ Task time: " + task.title, {
        body: task.notes || "It's time to complete this task.",
        tag: task.id,
        requireInteraction: true,
      });
    } catch {}
  }
  toast(`⏰ ${task.title}`, { description: task.notes || "Task alarm", duration: 15000 });
}

const scheduled = new Map<string, number>();

export function triggerAlarm(task: Task) {
  playAlarm(task.alarm?.sound || "chime", 4);
  notify(task);
}

export function scheduleTaskAlarm(task: Task) {
  if (!task.alarm?.enabled || !task.scheduledAt || task.completed) return;
  const when = new Date(task.scheduledAt).getTime();
  const delay = when - Date.now();
  if (delay <= 0 || delay > 2147483000) return;
  // clear previous
  const prev = scheduled.get(task.id);
  if (prev) window.clearTimeout(prev);
  const handle = window.setTimeout(() => {
    triggerAlarm(task);
    scheduled.delete(task.id);
  }, delay);
  scheduled.set(task.id, handle);
}

export function clearTaskAlarm(id: string) {
  const h = scheduled.get(id);
  if (h) window.clearTimeout(h);
  scheduled.delete(id);
}

let booted = false;
export function bootAlarmScheduler() {
  if (booted || typeof window === "undefined") return;
  booted = true;

  const reschedule = () => {
    const tasks = useApp.getState().tasks;
    scheduled.forEach((h) => window.clearTimeout(h));
    scheduled.clear();
    tasks.forEach(scheduleTaskAlarm);
  };

  reschedule();
  useApp.subscribe(reschedule);

  // Catch missed alarms when the tab was inactive
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      const now = Date.now();
      const tasks = useApp.getState().tasks;
      tasks.forEach((t) => {
        if (
          t.alarm?.enabled &&
          t.scheduledAt &&
          !t.completed &&
          new Date(t.scheduledAt).getTime() <= now &&
          new Date(t.scheduledAt).getTime() > now - 60_000 * 5
        ) {
          triggerAlarm(t);
        }
      });
      reschedule();
    }
  });
}