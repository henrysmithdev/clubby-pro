# Ball Tracer Replay Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Add a ClubbyPro feature where a golfer can record or upload a swing/shot video, draw or detect the ball flight tracer, replay it with the tracer overlay, and export/save the replay video.

**Architecture:** Build this in phases. Phase 1 is a reliable browser-based MVP: record/upload video, place/edit tracer points, replay with canvas overlay, and export the overlay as a new video using `canvas.captureStream()` + `MediaRecorder`. Phase 2 adds assisted ball detection using OpenCV-style frame differencing. Phase 3 adds server-side higher-quality rendering and saved user library.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, browser MediaRecorder API, HTMLVideoElement, Canvas 2D, optional IndexedDB/localStorage for drafts, optional Supabase Storage later for cloud saves.

---

## Product Decisions

### MVP behavior

1. User opens `/ball-tracer`.
2. User chooses either:
   - **Record Shot** using the phone/computer camera, or
   - **Upload Video** from camera roll.
3. Video loads into an editor.
4. User scrubs through video and adds tracer points by clicking/tapping where the ball is at different frames.
5. App draws a glowing ball flight path over the video during replay.
6. User can adjust tracer color, thickness, fade, and label.
7. User can replay inside the app.
8. User can export/save a new `.webm` replay video with tracer burned into the canvas.

### Why manual/semi-manual first

Fully automatic golf ball tracing is hard because:
- The ball is tiny and fast.
- Phone frame rate varies.
- Lighting, grass, sky, trees, and compression confuse detection.
- Down-the-line vs face-on angles differ.

A manual tracer MVP will feel useful immediately and can be built reliably. Automatic detection can be added after the UX works.

### User-facing name options

- **Ball Tracer Replay**
- **Shot Tracer**
- **Clubby Tracer**
- **Replay Studio**

Recommended nav label: **Ball Tracer**.

---

## Data Model

Create a reusable tracer data shape:

```ts
export interface TracerPoint {
  id: string;
  time: number; // seconds into video
  x: number; // normalized 0-1 canvas/video coordinate
  y: number; // normalized 0-1 canvas/video coordinate
}

export interface TracerSettings {
  color: string;
  glowColor: string;
  lineWidth: number;
  glowBlur: number;
  fadeSeconds: number;
  showBallDot: boolean;
}

export interface TracerProject {
  id: string;
  name: string;
  videoObjectUrl?: string;
  videoFileName?: string;
  points: TracerPoint[];
  settings: TracerSettings;
  createdAt: string;
  updatedAt: string;
}
```

For MVP, keep projects in browser state and optionally save draft metadata to localStorage. Do not attempt cloud storage until the editor is working.

---

## Task 1: Add Ball Tracer route shell

**Objective:** Create `/ball-tracer` with Clubby styling, hero copy, upload button, record button placeholder, and navigation back to existing pages.

**Files:**
- Create: `src/app/ball-tracer/page.tsx`
- Modify: main homepage/nav file if there is a global nav; otherwise leave nav local.

**Steps:**
1. Create the new page as a client component.
2. Add hero title: `Ball Tracer Replay`.
3. Add subtitle: `Record or upload a golf shot, add a pro-style flight tracer, and save the replay.`
4. Add two CTAs: `Upload Video` and `Record Shot`.
5. Add a short note: `Best with tripod video from behind the golfer or down-the-line.`
6. Run `npm run lint`.
7. Run `npm run build`.

**Verification:**
- `/ball-tracer` loads locally.
- No console errors.
- Upload and record buttons render.

---

## Task 2: Build video upload and preview

**Objective:** Let users upload MP4/MOV/WebM video and preview it in the browser.

**Files:**
- Modify: `src/app/ball-tracer/page.tsx`

**Steps:**
1. Add hidden `<input type="file" accept="video/*">`.
2. Validate file type starts with `video/`.
3. Validate size under 150MB for MVP.
4. Use `URL.createObjectURL(file)` to load the video.
5. Show video preview with controls.
6. Revoke old object URLs when a new file is loaded.

**Verification:**
- Uploading an MP4 shows playable video.
- Invalid files show an error.
- Re-uploading works without reload.

---

## Task 3: Add camera recording

**Objective:** Let users record a shot directly from the browser.

**Files:**
- Modify: `src/app/ball-tracer/page.tsx`

**Steps:**
1. Use `navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false })`.
2. Display live camera preview.
3. Start recording with `MediaRecorder`.
4. Stop recording and create a Blob URL.
5. Load recorded video into the same preview/editor flow as uploads.
6. Add fallback text if camera permission is denied.

**Verification:**
- On mobile/browser with camera access, recording creates a playable replay.
- Permission denied is handled cleanly.
- Recording can be discarded and retried.

---

## Task 4: Create canvas replay surface

**Objective:** Render the video through a canvas so tracer graphics can be overlaid and exported.

**Files:**
- Modify: `src/app/ball-tracer/page.tsx`
- Optional create: `src/components/ball-tracer/VideoCanvas.tsx`

**Steps:**
1. Add hidden video element or use visible video as the frame source.
2. Add `<canvas>` sized to video aspect ratio.
3. On animation frames, draw the current video frame to canvas.
4. Keep video controls or create basic controls: play, pause, scrub.
5. Handle loaded metadata to set canvas dimensions.

**Verification:**
- Canvas displays the video frames smoothly.
- Canvas aspect ratio matches source video.
- Play/pause works.

---

## Task 5: Add manual tracer point editor

**Objective:** Allow the user to click/tap ball positions at specific timestamps.

**Files:**
- Modify: `src/app/ball-tracer/page.tsx`
- Optional create: `src/components/ball-tracer/TracerEditor.tsx`

**Steps:**
1. On canvas click/tap, capture normalized x/y and current video time.
2. Add point to `points` array sorted by time.
3. Display point markers on canvas.
4. Add buttons: `Undo Point`, `Clear Points`.
5. Add small point list showing timestamp and delete button.

**Verification:**
- Clicking canvas adds points.
- Points stay correctly positioned on different screen sizes.
- Undo and clear work.

---

## Task 6: Draw smooth glowing tracer path

**Objective:** Draw a professional-looking flight path like a ball tracer app.

**Files:**
- Create: `src/components/ball-tracer/drawTracer.ts`
- Modify: `src/app/ball-tracer/page.tsx`

**Steps:**
1. Implement a `drawTracer(ctx, points, currentTime, settings, width, height)` helper.
2. Convert normalized coordinates to canvas pixels.
3. Draw only points with `point.time <= currentTime`.
4. Smooth the path using quadratic curves.
5. Add glow: draw wider transparent stroke first, then bright center stroke.
6. Add optional ball dot at the latest visible point.
7. Add fade so older path segments can slowly disappear if selected.

**Verification:**
- Path appears during playback.
- Tracer line is smooth and premium-looking.
- Ball dot follows latest point.

---

## Task 7: Add tracer settings controls

**Objective:** Let users customize the replay style.

**Files:**
- Modify: `src/app/ball-tracer/page.tsx`

**Settings:**
- Color: white, gold, neon green, orange
- Thickness: thin / normal / bold
- Glow: low / medium / high
- Fade: off / short / long
- Show ball dot: on/off

**Verification:**
- Changing settings updates canvas immediately.
- Settings persist during current edit session.

---

## Task 8: Export replay video with tracer burned in

**Objective:** Save the replay as a new video file with the tracer overlay included.

**Files:**
- Modify: `src/app/ball-tracer/page.tsx`
- Optional create: `src/components/ball-tracer/exportReplay.ts`

**Steps:**
1. Use `canvas.captureStream(30)`.
2. Use `MediaRecorder` on the canvas stream.
3. Reset source video to `0`.
4. Play video while canvas draws each frame and tracer overlay.
5. Stop recorder when video ends.
6. Create Blob URL from recorded chunks.
7. Show `Download Replay` link with `download="clubby-ball-tracer.webm"`.

**Verification:**
- Export creates a playable `.webm` video.
- Tracer is visible in the exported video.
- Export progress UI appears while rendering.

**Known limitation:** Browser export may output WebM, not MP4. MP4 export can come later with server-side FFmpeg.

---

## Task 9: Add mobile UX polish

**Objective:** Make recording/editing usable on phones at the range.

**Files:**
- Modify: `src/app/ball-tracer/page.tsx`

**Steps:**
1. Make canvas full-width on mobile.
2. Add large touch-friendly controls.
3. Add instruction card:
   - Use tripod or steady phone.
   - Film down-the-line or behind the ball.
   - Keep sky/ball flight visible.
   - Use slow motion if possible.
4. Prevent accidental page scroll while placing points on canvas.

**Verification:**
- Works on iPhone/Android browser viewport.
- Controls are easy to tap.

---

## Task 10: Add navigation from homepage and Swing Analyzer

**Objective:** Surface the new feature clearly.

**Files:**
- Modify existing homepage file, likely `src/app/page.tsx`
- Modify `src/app/swing/page.tsx`

**Steps:**
1. Add nav link: `Ball Tracer`.
2. Add homepage feature card: `Create pro-style shot tracer replays`.
3. Add link from Swing Analyzer: `Want a replay instead? Try Ball Tracer`.

**Verification:**
- Users can find `/ball-tracer` from homepage and swing page.

---

## Task 11: Optional assisted ball detection prototype

**Objective:** Add a helper that suggests tracer points automatically from high-contrast ball movement.

**Files:**
- Create: `src/components/ball-tracer/suggestBallPoints.ts`
- Modify: `src/app/ball-tracer/page.tsx`

**Approach:**
1. Extract frames every 0.05–0.1 seconds after impact.
2. Use frame differencing to find small fast-moving bright objects.
3. Filter candidates by size, brightness, and movement direction.
4. Let the user accept/edit suggested points.

**Verification:**
- Works on simple videos with sky background.
- Fails gracefully and asks user to place points manually.

**Important:** This should not block MVP release.

---

## Task 12: Optional cloud save and MP4 export

**Objective:** Save projects/replays to user account or Supabase Storage and export MP4.

**Files:**
- New API route: `src/app/api/ball-tracer/render/route.ts`
- Possible Supabase tables/storage bucket later.

**Approach:**
1. Upload source video and tracer JSON.
2. Server renders MP4 using FFmpeg.
3. Store final replay in Supabase Storage.
4. Return share/download URL.

**Verification:**
- User can revisit a saved replay.
- Download is MP4 and social-media friendly.

**Important:** Do this after MVP because it adds hosting/storage cost and deployment complexity.

---

## Acceptance Criteria for MVP

- `/ball-tracer` page exists.
- User can upload a video.
- User can record a video from camera where supported.
- User can manually place ball tracer points.
- User can replay video with a glowing tracer overlay.
- User can export/download a video with tracer burned in.
- Page works on mobile-sized screens.
- Build passes with `npm run build`.

---

## Suggested Implementation Order

1. Route shell
2. Upload preview
3. Canvas replay
4. Manual point editor
5. Tracer drawing
6. Export replay
7. Camera recording
8. Mobile polish
9. Homepage/nav links
10. Assisted detection prototype later
11. Cloud save/MP4 later

---

## Notes for Bryce

This can absolutely become similar to Smooth Swing Golf/Ball Tracer apps, but the reliable first version should be: **record/upload → mark ball path → replay/export with tracer**. Then we add automatic ball detection after we have the editor working.
