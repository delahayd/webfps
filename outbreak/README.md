# Outbreak — The Possessed Lab

A standalone English-language browser FPS inspired by the Saint-Priest research campus. Restore Building B's systems, cross the campus courtyard, override containment in Building A, and defeat the fictional possessed unit director in her northern chamber.

From the repository root:

```sh
python3 -m http.server 8080
```

Open http://localhost:8080/outbreak/dist/ in a desktop browser with WebGL. After an update, reload with Ctrl+Shift+R to refresh scripts and images.

## Opening cinematic

Click **LIBERATE THE LAB** to watch a 15-second animated opening. The fictional director sits in her office in Building A, an experimental signal becomes unstable, violet energy appears, and she transforms into the same monster used by the final boss. The layered canvas animation combines seated/intermediate character artwork with the existing boss sprite, animated monitors, papers, particles, desk cracks, light changes, a camera push and original synthesized sound cues. A locally composed 20-second tension score adds minor-key drones and heartbeat-like pulses. English captions introduce the event. MUSIC and SOUND control the score; it stops at every cinematic handoff.

Press **Escape**, **Space**, **Enter** or **SKIP INTRO** to enter gameplay directly. The natural ending opens a short briefing; **ENTER BUILDING B** starts the mission and captures the mouse. Mission time, enemies and combat remain frozen during the cinematic. The introduction is shown once per page load; death retries and pause/resume skip it. It stops advancing while the tab is hidden or the window loses focus. Reduced-motion preferences disable camera shake, the camera push, flashes and flying particles.

Chrome verification of the opening:

```sh
node outbreak/tests/intro-browser.cjs
```

With the local server and debugging Chrome described below, this checks first-start behavior, all three illustrated stages, natural handoff, keyboard/button skipping, resume and retry, with no JavaScript errors. Screenshots: `/tmp/outbreak-intro-human.png`, `/tmp/outbreak-intro-transform.png`, `/tmp/outbreak-intro-boss.png`.

## Campus and offices

The expanded outdoor area has an open sky with clouds and sunlight, lawns, a paved connecting path, six branching deciduous trees and three parked cars with bevelled bodies, sloping windscreens, circular tyres and alloy rims. Both buildings have visible multi-storey facades, window bands, roof cornices and covered entrances. Courtyard terrain, cars, tree trunks and buildings use 3D geometry. Vehicles and trunks block movement and fire.

Six 2 m wide, 3.25 m high office doors separate Computer Science, microelectronics, robotics and administration rooms from the corridors and from adjacent offices. Face a nearby door and press **E** to open it. Doors slide into the jamb, block movement and shots until opened, and have frames and lintels. The former internal partitions have been removed to make research offices substantially larger. Desks, screens, keyboards, drawer units, rolling chairs and storage cabinets furnish the interior in 3D. Mission fire doors still open only after the appropriate system objectives.

Two concealed service passages hold the plasma rifle and BFG. Face a damaged panel at close range and press **E**. The map hides the caches until discovery. Restart resets both secrets, all doors and the arsenal.

The layout is an original gameplay approximation, not a surveyed reconstruction of LIRMM. Public campus reference: [LIRMM contact and access](https://www.lirmm.fr/contact-et-acces/). Events, interiors and characters are fictional; no actual director is depicted.

## First floors, stairs and destructible furniture

Both buildings have a playable first floor at **+4 m**, reached by physical sixteen-riser stairways with railings. Movement, camera height, enemy height, aiming, projectile collision, pickups and persistent blood/impacts follow the floor elevation. The map distinguishes stairs and elevated rooms.

In Building B, the stairway starts from the western ground-floor wing. It leads to **Computer Science**, the network isolation terminal, and the hidden plasma cache. The power terminal remains on the ground floor. Both systems must be restored to leave the building.

In Building A, the containment override unlocks the central stairway. Upstairs, an antechamber contains **eight guards**. Defeat all of them to open the director's office to the east, on the same first floor. The boss introduction triggers only after entering that office.

There are **11 desks and 11 cabinets**, built from actual 3D geometry. Desks have wood tabletops, metal legs, drawers, monitors, keyboards, mice, papers and rolling chairs. Cabinets have door panels, handles, shelves and binders. Shooting them causes visible damage: collapsed monitors, broken drawers and exposed cabinet shelves. Continued fire destroys them and leaves rubble. Intact furniture blocks movement and shots; destroyed furniture becomes traversable. All weapons, including chainsaw, rockets and energy weapons, can damage furniture. Restart restores every prop.

At zero boss health, a **4.8-second in-game death animation** plays inside the upstairs office: the demon collapses, violet energy disperses and the human director's body appears on the floor. The camera follows her downward before the existing ending cinematic begins. Combat is frozen during this sequence.

The title page states: “This is a work of fiction. Any resemblance to real persons, living or dead, is purely coincidental.”

## Controls and arsenal

WASD/ZQSD moves; mouse aims; left click fires (hold for automatic fire); right click advances; Shift sprints; **1–7** selects weapons; **E** opens office doors and secret panels; **M** toggles the map; Escape pauses. Arrow keys aim without mouse capture. Walk onto glowing SYS terminals to restore systems.

| Key | Weapon | Behavior / availability |
| --- | --- | --- |
| 1 | Revolver | Starting weapon, original Inferno statistics and art |
| 2 | Shotgun | Starting weapon, original Inferno statistics and art |
| 3 | Heavy machine gun | Building B reception, original automatic weapon |
| 4 | Chainsaw | Building B reception, melee only, unlimited fuel |
| 5 | Rocket launcher | Courtyard, flying rockets, splash damage and self damage |
| 6 | Plasma rifle | Upstairs secret passage in Building B, rapid blue projectiles |
| 7 | BFG 9000 | Secret passage in Building A, 0.65 s charge, large green projectile and area damage |

The BFG consumes 40 energy cells per shot and shares cells with the plasma rifle. Rocket crates and cell packs supplement general ammo pickups. New weapon artwork is original Doom-inspired imagery, generated specifically for this game. New weapon sounds are synthesized locally with Web Audio; Inferno's three recorded firing sounds, music and English voices are retained. Audio attribution: `dist/assets/sfx/CREDITS.txt`.

## Persistent combat traces and final sequences

Bullet holes, shotgun pellet chips, chainsaw scratches and energy/explosion scorch marks remain on the wall, floor or ceiling they hit. Blood splashes remain on walls and floors. Marks have no expiry or oldest-mark eviction; restarting the run clears them. Wall decals use their surface normal, and marks on office doors follow the opening panel.

Entering the director's chamber triggers a six-second confrontation: she addresses the player, the picture shakes, and purple energy surrounds her. Combat and mission time stop until the cinematic ends or is skipped. **FIGHT THE DIRECTOR** starts the encounter after the natural ending. Reduced-motion preferences disable shaking.

After the in-game death animation, defeating the boss leads to an 18-second ending. The director has died and returned to human form: the player could not save her. The laboratory is safe, however. The ending then shows the masked player character sitting in her office chair and concludes **THE ADVENTURE CONTINUES**. Skip the ending with Escape or its button to reach the same final result. The ending music is a quieter, slower version of the original tension score.

The score is reproducible with `python3 outbreak/scripts-compose-tension.py` from the repository root. No external audio is used for it.

## Enemies

Charging zombified researchers, ranged possessed scientists, tougher robotics mutants and the director each have front, right, back and left views, with two alternating walking poses per direction: **32 textures** in total. Rendering chooses the view from the monster's heading relative to the player. Enemies patrol when idle and turn to face the player when engaging. The director has 1,800 HP and attacks faster below half health.

New generated PNG assets and the imagegen prompt set are documented in [assets/GENERATED.md](dist/assets/GENERATED.md).

## Verification

From the repository root:

```sh
node --check outbreak/dist/furniture.js
node --check outbreak/dist/decals.js
node --check outbreak/dist/intro.js
node --check outbreak/dist/game.js
node --check outbreak/dist/world.js
node --check outbreak/dist/renderer.js
node --check outbreak/dist/combat-audio.js
node outbreak/tests/campaign.cjs
```

The campaign test covers office door interaction/collision/animation, mission door order, objective and spawn reachability, concealed passages, weapon pickups, chainsaw reach, projectile hits, blast occlusion, rocket self damage, plasma/BFG shared cells, BFG charge/ammo cost, directional animation, victory and reset. It checks that the original three Inferno weapon statistics remain unchanged.

Browser verification uses a local HTTP server and a separate temporary headless Chrome profile with a debugging port:

```sh
node outbreak/tests/browser.cjs http://127.0.0.1:8097/ http://127.0.0.1:9247
```

Chrome checks passed for seven weapon images, 32 directional walking textures, transparent sprite backgrounds, office/campus rendering, recorded and new synthesized sounds, music and voices, and no JavaScript or WebGL errors. Captures in `/tmp/outbreak-*.png` were inspected for both building facades, parking, open offices and the director. Desktop controls only.

The expanded browser check is `node outbreak/tests/update-browser.cjs` with the same local test server and Chrome debugging port. It checks tension music loading and cleanup, wider office doors, persistent wall/floor traces, the boss introduction, ending captions and result, reset, and rendering errors.

The current floor/furniture browser test is `node outbreak/tests/floors-browser.cjs`, using the local server on port 8097 and Chrome debugging port 9247. It checks new furniture meshes and damaged/rubble states, first-floor elevation, stair climbing, antechamber guards, in-game boss collapse, corpse rendering, ending handoff, reset and the English disclaimer. Chrome screenshots of both staircases, Computer Science, furniture damage and death phases are saved under `/tmp/outbreak-*.png`.
