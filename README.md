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

## Voices and music
Four English kill lines use locally generated Kokoro neural voice clips (`am_fenrir`, speed 0.94), with natural intonation and no radio filter. Browser speech synthesis has been removed, so playback is consistent across devices. The four lines retain their English subtitles and 4.5-second cooldown.

An original 64-second stereo dark ambient score combines low drones, slow heartbeat-like percussion, dissonant swells and distant metallic notes. The loop fades in while playing, fades out on pause/death/victory, and ducks automatically during spoken lines. MUSIC and VOICE can be toggled independently; SOUND mutes all audio.

The music and clips are served from `dist/assets`; no speech service or neural model is loaded by the browser. Regeneration scripts are in `scripts/` and require an external temporary Python environment. The 300 MB voice model is deliberately excluded from the site.

Voice model: [Kokoro-82M](https://huggingface.co/hexgrad/Kokoro-82M), Apache-2.0; generator: [kokoro-onnx](https://github.com/thewh1teagle/kokoro-onnx), MIT. Music is an original procedural composition for this project.

## Verification
Chrome: controls, 360° and vertical aiming, seals/victory, blood impacts and expiry, English text, four decoded neural voice clips, 64-second decoded music loop, music ducking and restoration, independent voice/music switches, rendered mixed audio, mute/pause and WebGL errors. Desktop controls only. Enemies are camera-facing detailed sprites; the environment is 3D.
