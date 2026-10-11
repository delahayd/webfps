# The Last Gate
An English-language infernal browser FPS. Run `python3 -m http.server 8080 --directory dist`, then open http://localhost:8080 in a desktop browser with WebGL.

## Controls
- Mouse: horizontal 360° free look and vertical aiming.
- Left click: fire; hold to fire at the weapon's normal rate.
- Hold right click: move forward in the horizontal direction of your view.
- WASD / ZQSD: movement; Shift: sprint.
- Arrow keys: look around when mouse capture is unavailable.
- 1 / 2: revolver / shotgun; E: break a seal; M: map; Escape: pause.

Break three seals and reach the northern gate. A secret stash is hidden in the western alcove.

## Graphics and combat
WebGL world geometry, locally served basalt textures and transparent demon/weapon sprites. Assets generated with imagegen. Optional Google fonts; no external service needed to play.

Weapon sounds combine a sharp report, a low-frequency blast, mechanical sounds and room reflections. Blood particles have gravity and leave temporary floor stains. Particle and stain counts are capped.

## English voices
Four voiced kill lines: “Back to hell”, “One less demon”, “Your ticket to hell”, “Not today, demon”. Voice lines have matching English subtitles and a 4.5-second cooldown. A suitable English system/browser voice is used when available; local English WAV clips provide a fallback when no suitable voice exists or speech synthesis fails. The fallback clips use an American male synthetic voice with lighter filtering than the earlier French clips. Voice quality depends on the voices installed in the browser or operating system. SOUND mutes both effects and speech; pausing interrupts speech.

## Verification
Chrome: controls, 360° and vertical aiming, seals/victory, blood impacts and expiry, English text, four decoded voice clips, rendered audio, mute/pause, WebGL errors. Desktop controls only. Enemies are camera-facing detailed sprites; the environment is 3D.
