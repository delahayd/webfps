# The Last Gate — Hell Forged
An English-language infernal browser FPS. From this `inferno` directory, run `python3 -m http.server 8080 --directory dist`, then open http://localhost:8080 in a desktop browser with WebGL. Run asset-generation scripts from this directory as well.

## Controls
- Mouse: horizontal 360° free look and vertical aiming.
- Left click: fire; hold for repeated shots at the weapon's firing rate.
- Hold right click: move forward; WASD / ZQSD: move; Shift: sprint.
- Arrow keys: look around when mouse capture is unavailable.
- 1 / 2 / 3: revolver / shotgun / heavy machine gun. The third weapon must be discovered first.
- E: investigate cracked secret walls. M: map. Escape: pause.
- Walk over a glowing floor seal to activate it automatically.

## Expanded fortress
The map is 47 × 35 cells, expanded from 33 × 19. It contains the main courtyard at elevation 0, the northern cathedral at +2.4 m and the lower eastern crypt at −1.8 m. Two stone stairways connect them with actual 30 cm risers. Camera height, enemies, projectiles, line of sight, weapon hits, pickups, blood and seal activation respect floor elevations. The map uses different colors for heights and stairs.

Three seals are located in the western ground-floor wing, the central courtyard and the lower crypt. All three must be activated before the demon gate opens in the upper cathedral. A final wave guards the exit; the animated gate's iron panels slide apart before victory becomes available.

## Secret passages and arsenal
Two cracked walls hide passages in the western hall and eastern crypt wing. Face one at close range and press E. Both ends open after a short stone rumble. The map hides each passage until discovery; the HUD counts 0–2 secrets. Restarting resets walls, rewards and the weapon unlock.

The heavy machine gun is in the western secret passage, alongside a supply cache. Picking it up unlocks [3], equips it and gives 180 rounds. It fires about 8.7 rounds per second while left click is held. Ammo pickups replenish heavy ammunition after discovery. The second secret contains health and ammo; the original western alcove cache remains.

## Graphics and audio
WebGL sector geometry, local detailed basalt textures, camera-facing demon sprites, a belt-fed heavy machine gun foreground and an ornate horned demon exit gate. Image assets generated with imagegen. Optional Google fonts; no external service is required to play.

Weapon effects now use isolated real firearm recordings, reinforced with low-frequency transients, short reflections and soft saturation. The source archive's credits and license notice are preserved in [audio credits](dist/assets/sfx/CREDITS.txt), also linked in the game. Generator: `scripts/prepare-gunshots.py`; source recordings remain outside the site.

**Hell Forged** is an original 48-second, 160 BPM instrumental metal loop with double-tracked distorted power chords, bass, kick/snare/cymbals and a short lead section. It is composed by `scripts/compose-metal.py`. Music fades in during play, fades out on pause/death/victory and ducks during speech. MUSIC and VOICE toggle independently; SOUND mutes all audio.

Four forceful English kill lines use local Kokoro neural clips: “Back to hell!”, “Stay down, demon!”, “That’s what you get!”, “Burn in hell!”. They retain English subtitles and a 4.5-second cooldown. Voice regeneration uses `scripts/generate-neural-voices.py` and temporary external model files.

Voice model: [Kokoro-82M](https://huggingface.co/hexgrad/Kokoro-82M), Apache-2.0; generator: [kokoro-onnx](https://github.com/thewh1teagle/kokoro-onnx), MIT. Real gunshot source: [Gunshot Sounds by Tabasco / Vincent Sevedge](https://opengameart.org/content/gunshot-sounds); the source page lists CC0 and its archive includes CC BY 3.0, so attribution is retained. The metal score uses no Doom audio or melody.

## Verification
Chrome checks: reachable objectives with height constraints, climbing and descending both staircases, shooting elevated targets, 3D line of sight, right-click movement and release, both hidden passage openings, all pickups reachable, heavy weapon unlock/equip/ammo/automatic cadence, automatic seal activation, single final-wave trigger, locked gate and victory, restart reset, three decoded recorded weapon sounds, neural clips, 48-second metal loop, finite unclipped mixed audio, and no JavaScript/WebGL errors. Stair and demon-gate/weapon screenshots inspected.

Desktop controls only. Enemies are detailed sprites; the world and stairs are rendered in 3D.
