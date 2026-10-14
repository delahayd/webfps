# Generated game artwork

## Final cinematic artwork

Final project asset: `ending-characters.png`, generated with the built-in imagegen tool. Reference: `intro-characters.png`. The source regions contain the deceased fictional human director and the masked player seated in her chair. The game crops each region at render time and preserves PNG transparency.

Prompt:

Use case: stylized-concept. Asset: two-column transparent character sheet for the ending cinematic of a retro horror FPS. Reference image shows the fictional research director before and during possession; use her HUMAN face, black hair, black blazer and white blouse as identity reference. EXACTLY TWO separate equal columns with ample transparent padding, no overlapping characters. LEFT column: the fictional director has died after the final battle, returned to human form, lying on her side on the floor, full body horizontal pose, eyes closed, peaceful tragic expression, lightly torn business suit, small blood stain on sleeve, no graphic wounds or gore. RIGHT column: anonymous player character, a laboratory rescuer in dark tactical clothing and a protective vest, face obscured by a visor, seated in the director's black rolling office chair, front view, hands resting on chair arms, exhausted but resolute, full body. Detailed painted retro FPS art matching reference. No office or desk, no scenery, no text, no floor or cast shadows. True transparent alpha background. Each character complete inside its column.

Created using the built-in imagegen tool. Final project assets:

- `zombie.png`: zombified male researcher in torn white coat, glasses and ID lanyard.
- `scientist.png`: possessed female scientist in teal coat, black hair and violet magic.
- `mutant.png`: hulking robotics mutant in orange hazard vest, cybernetic arm and bone spikes.
- `director.png`: fictional female director demon, black business suit, horn crown, purple chest and tendrils.
- `weaponAtlas.png`: first-person chainsaw, rocket launcher, blue plasma rifle and green BFG cannon.

## Directional sheet prompt template

Use case: stylized-concept. Asset: transparent directional walking sprite sheet for a retro horror FPS. Use attached image only as character identity/style reference. Depict ONLY [character description above, corresponding to its column in researchers.png]. STRICT uniform 4 columns × 2 rows, eight isolated full-body sprites of the SAME character, each centered in its own equal cell with ample TRANSPARENT padding and feet aligned. Columns left to right: FRONT view (facing viewer), RIGHT profile (nose pointing right), BACK view (back of head visible, no face), LEFT profile (nose pointing left). Top row: walking stride left foot forward. Bottom row: opposite walking stride right foot forward. Preserve costume, materials, colors, body proportions in all eight views. Exactly four columns and two rows, never extra characters, never overlaps, no text, no grid lines, no ground. Detailed painted 1990s horror game sprites with readable silhouettes. Genuine alpha transparency.

The scientist, mutant and director sheets received this background-extraction edit:

Use case: background-extraction. Edit target: attached 4-column 2-row walking sprite sheet. Remove the entire colored gradient backdrop to genuine transparent alpha, including space between limbs and all empty areas. Preserve exactly the eight characters, their positions, original grid layout, framing, full bodies, costume details, faces, all four directions and both walking frames. Preserve violet magical energy and tendrils as semitransparent foreground only. No scenery, no replacement background, no shadows on ground. Do not redesign the characters. Output a transparent PNG sprite sheet.

## Weapon atlas prompt

Use case: stylized-concept. Asset: transparent FIRST PERSON weapon sprite atlas for retro Doom-inspired FPS. One wide image, EXACTLY 4 EQUAL COLUMNS, each has one distinct weapon centered inside its column with ample padding, no overlap. Left to right: 1 brutal yellow industrial chainsaw with chain blade pointing forward and up; 2 steel military shoulder-fired rocket launcher, thick circular tube; 3 futuristic blue glowing plasma rifle with copper coils; 4 huge green energy cannon BFG 9000 with enormous rectangular armored body and bright green central muzzle. Each weapon seen FROM BEHIND, player perspective, muzzle pointing AWAY from viewer toward upper center, grip/body in foreground bottom, strong foreshortening, same viewpoint as centered classic Doom weapon HUD. All four visibly different, detailed painted steel and scratches, no hands needed, no letters or labels, no scenery, no ground, transparent alpha background. Weapons must be complete inside each column, no cropped edges.

Renderer source regions keep adjacent weapon art out of the foreground. PNG alpha and all 32 enemy textures are verified by the Chrome test.

## Opening cinematic artwork

Final asset: `intro-characters.png`, generated with the built-in imagegen tool, referencing `director.png` for the fictional director's identity. Alpha transparency is preserved. The opening uses source-region cropping to isolate the seated human and transformation pose, then transitions to the existing boss sprite.

Prompt:

Use case: stylized-concept. Asset: transparent two-column transformation character sheet for an animated horror game opening. Attached image is identity reference for the final fictional female director demon only. Output EXACTLY TWO equally wide columns with ample transparent padding, no overlap, both full body. LEFT: the SAME woman before possession, ordinary human research unit director about 45 years old, long black hair, dignified weary face, modest black business blazer over white blouse, seated in an office chair, viewed front-on, leaning forward with hands positioned to rest on an unseen desk. No desk drawn. RIGHT: the SAME woman halfway through a terrifying demonic transformation, standing front-on, business suit torn, face still recognizable, purple glowing eyes, small horns emerging, one hand starting to become a claw, spectral purple tendrils emerging behind her shoulders, anguish in expression. Preserve the female boss identity, face, hair and suit from the reference. Detailed painted retro horror FPS art matching the reference. No scenery, no office, no labels, no floor or shadows. Genuine transparent alpha background.
