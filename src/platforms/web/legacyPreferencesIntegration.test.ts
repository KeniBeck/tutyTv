import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { describe, expect, it, vi } from "vitest";
import * as core from "../shared/legacyCoreBridge";

const source = readFileSync(new URL(
  "../../../source/usr/palm/applications/com.webosflux.xuptertv.fidelity/js/app.js",
  import.meta.url
), "utf8");
const merge = source.match(/ {4}function legacyMergePlaybackPreferences\(current, stored\) \{[\s\S]*?(?= {4}function legacyRelayStreamMode)/)?.[0];
const profile = source.match(/ {4}function legacyEnsureViewerProfile\(base, stored, now\) \{[\s\S]*?(?= {4}function legacyMergePlaybackPreferences)/)?.[0];
const selectTrack = source.match(/ {4}function legacySelectTrackIndex\(codes, preferredCode, preference\) \{[\s\S]*?(?= {4}function legacyRelayStreamMode)/)?.[0];
const language = source.match(/ {4}function Ia\(e, t\) \{[\s\S]*?(?= {4}function Ta\(e, t, i\))/)?.[0];
const audioIndex = source.match(/ {4}function Ka\(e\) \{[\s\S]*?(?= {4}function Ya\(e\))/)?.[0];
const subtitles = source.match(/ {4}function Ya\(e\) \{[\s\S]*?(?= {4}function Za\(e\))/)?.[0];
const subtitlePick = source.match(/ {4}function Za\(e\) \{[\s\S]*?(?= {4}function en\(\))/)?.[0];

describe("legacy playback preferences", () => {
  it.each([true, false])("restores stored playback options with fallback (core available: %s)", (withCore) => {
    expect(merge).toBeDefined();
    const exposedCore = { ...core, mergePlaybackPreferences: vi.fn(core.mergePlaybackPreferences) };
    const runtime = runInNewContext(`${merge}\n({ legacyMergePlaybackPreferences })`, {
      window: { TutyCore: withCore ? exposedCore : undefined }
    }) as {
      legacyMergePlaybackPreferences(current: object, stored: unknown): object;
    };

    const current = { streamMode: "normal", screen: 0, subtitle: true };
    const result = runtime.legacyMergePlaybackPreferences(current, {
      streamMode: "smooth",
      subtitle: false,
      unknown: "ignored"
    });
    expect(result).toBe(current);
    expect(current).toEqual({ streamMode: "smooth", screen: 0, subtitle: false });
    expect(runtime.legacyMergePlaybackPreferences(current, null)).toBe(current);
    expect(current).toEqual({ streamMode: "smooth", screen: 0, subtitle: false });
    expect(exposedCore.mergePlaybackPreferences).toHaveBeenCalledTimes(withCore ? 2 : 0);
  });

  it.each([true, false])("restores the viewer profile with fallback (core available: %s)", (withCore) => {
    expect(profile).toBeDefined();
    const exposedCore = { ...core, ensureViewerProfile: vi.fn(core.ensureViewerProfile) };
    const runtime = runInNewContext(`${profile}\n({ legacyEnsureViewerProfile })`, {
      window: { TutyCore: withCore ? exposedCore : undefined }
    }) as {
      legacyEnsureViewerProfile(base: object, stored: unknown, now: number): { profile: Record<string, unknown>; created: boolean };
    };

    const base = { id: "", createdAt: 0, history: [] as unknown[], reminders: {}, reminderCheckAt: 0 };
    const created = runtime.legacyEnsureViewerProfile(base, null, 1_700_000_123_456);
    expect(created.created).toBe(true);
    expect(created.profile).toBe(base);
    expect(base.id).toBe("TV-" + "1700000123456".slice(-8));
    expect(base.createdAt).toBe(1_700_000_123_456);
    expect(base.history).toEqual([]);

    const stored = { id: "TV-9", createdAt: 1, history: [] };
    const reused = runtime.legacyEnsureViewerProfile(base, stored, 2);
    expect(reused.created).toBe(false);
    expect(reused.profile).toBe(stored);
    expect(exposedCore.ensureViewerProfile).toHaveBeenCalledTimes(withCore ? 2 : 0);
  });

  it.each([true, false])("applies stored audio and subtitle language codes (core available: %s)", (withCore) => {
    expect(selectTrack && language && audioIndex && subtitles && subtitlePick).toBeTruthy();
    const exposedCore = {
      ...core,
      selectAudioTrackIndex: vi.fn(core.selectAudioTrackIndex),
      normalizeSubtitleTracks: vi.fn(core.normalizeSubtitleTracks),
      chooseSubtitleTrack: vi.fn(core.chooseSubtitleTrack)
    };
    const j = {
      playback: { audio: 0, audioCode: "", subLang: 0, subCode: "", subtitle: true }
    };
    const ua = vi.fn();
    const context = {
      window: { TutyCore: withCore ? exposedCore : undefined },
      j, Ua: ua, Ca: false, ba: false, ya: null as object | null
    };
    const runtime = runInNewContext(
      `${selectTrack}\n${language}\n${audioIndex}\n${subtitles}\n${subtitlePick}\n({ Ka, Za })`,
      context
    ) as {
      Ka(audio: string): number;
      Za(media: { subtitles: Array<{ lang: string; url: string }> }): void;
    };

    expect(runtime.Ka("spa,eng,jpn")).toBe(0);
    j.playback.audio = 2;
    expect(runtime.Ka("spa,eng,jpn")).toBe(1);
    j.playback.audioCode = "jpn";
    expect(runtime.Ka("spa,eng,jpn")).toBe(2);
    j.playback.audio = 0;
    j.playback.audioCode = "por";
    expect(runtime.Ka("spa,eng,jpn")).toBe(0);
    j.playback.audioCode = "";
    expect(runtime.Ka("jpn,kor")).toBe(0);

    const media = { subtitles: [{ lang: "spa", url: "es" }, { lang: "por", url: "pt" }] };
    j.playback.subLang = 1;
    runtime.Za(media);
    expect(context.ya).toMatchObject({ url: "pt" });
    expect(ua).toHaveBeenLastCalledWith(context.ya);
    j.playback.subCode = "spa";
    runtime.Za(media);
    expect(context.ya).toMatchObject({ url: "es" });
    j.playback.subtitle = false;
    runtime.Za(media);
    expect(context.ba).toBe(false);
    expect(context.ya).toBeNull();
    expect(ua).toHaveBeenLastCalledWith(null);
    expect(exposedCore.selectAudioTrackIndex).toHaveBeenCalledTimes(withCore ? 5 : 0);
    expect(exposedCore.normalizeSubtitleTracks).toHaveBeenCalledTimes(withCore ? 3 : 0);
    expect(exposedCore.chooseSubtitleTrack).toHaveBeenCalledTimes(withCore ? 2 : 0);
  });
});
