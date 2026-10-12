"use client";

import { useEffect, useRef, useState } from "react";
import { Maximize, Pause, Play } from "lucide-react";
import { useTranslations } from "next-intl";
import { useToast } from "./toast";

const DURATION = 30;
const SPEEDS = [1, 0.75, 1.5];

/** Draws one frame of the animated footwork placeholder at `time` seconds. */
function drawFrame(canvas: HTMLCanvasElement, time: number) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const bg = ctx.createLinearGradient(0, 0, 1280, 720);
  bg.addColorStop(0, "#181818");
  bg.addColorStop(1, "#311717");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 1280, 720);

  ctx.strokeStyle = "#ffffff0d";
  ctx.lineWidth = 1;
  for (let x = 610; x < 1300; x += 60) {
    ctx.beginPath();
    ctx.moveTo(x, 80);
    ctx.lineTo(x, 680);
    ctx.stroke();
  }
  for (let y = 80; y < 700; y += 60) {
    ctx.beginPath();
    ctx.moveTo(610, y);
    ctx.lineTo(1280, y);
    ctx.stroke();
  }

  const phase = time * 1.5;
  for (let i = 0; i < 2; i++) {
    const x = 850 + i * 115 + Math.sin(phase + i * 2) * 55;
    const y = 360 + Math.cos(phase + i * 2) * 100;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Math.sin(phase + i) * 0.4);
    ctx.fillStyle = i ? "#f7eee8" : "#ed342d";
    ctx.shadowColor = i ? "#fff4" : "#ed342d66";
    ctx.shadowBlur = 35;
    ctx.beginPath();
    ctx.ellipse(0, 0, 27, 56, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  ctx.font = "bold 20px Arial";
  ctx.fillStyle = "#ff837c";
  ctx.fillText(["2", "3", "4", "&", "1"][Math.floor(time * 2) % 5], 920, 590);
}

/**
 * A silent 30-second animated stand-in for a lesson video. Production playback will use
 * access-controlled video (Mux) after checking enrollment on the server.
 */
export function DemoPlayer({ danceName, lessonTitle }: { danceName: string; lessonTitle: string }) {
  const t = useTranslations("player");
  const toast = useToast();
  const player = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const timeRef = useRef(0);
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);

  useEffect(() => {
    if (canvas.current) drawFrame(canvas.current, time);
  }, [time]);

  useEffect(() => {
    if (!playing) return;
    let last = performance.now();
    let frame = requestAnimationFrame(function tick(now) {
      const next = Math.min(DURATION, timeRef.current + ((now - last) / 1000) * speed);
      last = now;
      timeRef.current = next;
      setTime(next);
      if (next >= DURATION) setPlaying(false);
      else frame = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(frame);
  }, [playing, speed]);

  function seek(value: number) {
    timeRef.current = value;
    setTime(value);
  }

  function togglePlay() {
    if (timeRef.current >= DURATION) seek(0);
    setPlaying((value) => !value);
  }

  function fullscreen() {
    if (document.fullscreenElement) void document.exitFullscreen();
    else if (player.current?.requestFullscreen) player.current.requestFullscreen().catch(() => toast(t("fullscreenUnavailable")));
    else toast(t("fullscreenUnavailable"));
  }

  return (
    <div className="player" ref={player}>
      <canvas ref={canvas} width={1280} height={720} aria-label={t("canvasLabel")} />
      <span className="playerBadge">{t("badge")}</span>
      <div className="playerCaption">
        <small>{danceName.toUpperCase()}</small>
        <h3>{lessonTitle}</h3>
        <p>{t("placeholder")}</p>
      </div>
      <div className="controls">
        <button aria-label={playing ? t("pause") : t("play")} onClick={togglePlay}>
          {playing ? <Pause size={16} aria-hidden /> : <Play size={16} aria-hidden />}
        </button>
        <span className="timer">
          00:{String(Math.floor(time)).padStart(2, "0")} / 00:{DURATION}
        </span>
        <input
          type="range"
          min={0}
          max={DURATION}
          step={0.1}
          value={time}
          aria-label={t("seek")}
          onChange={(event) => seek(Number(event.target.value))}
        />
        <select aria-label={t("speed")} value={speed} onChange={(event) => setSpeed(Number(event.target.value))}>
          {SPEEDS.map((value) => (
            <option key={value} value={value}>
              {value}×
            </option>
          ))}
        </select>
        <button aria-label={t("fullscreen")} onClick={fullscreen}>
          <Maximize size={16} aria-hidden />
        </button>
      </div>
    </div>
  );
}
