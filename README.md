# La Dernière Porte — version 3
FPS infernal en français, avec décor 3D WebGL, textures de basalte détaillées et sprites réalistes sur fond transparent. Lancez `python3 -m http.server 8080 --directory dist` puis ouvrez http://localhost:8080 dans un navigateur de bureau compatible WebGL.

## Commandes
- Souris : vue horizontale à 360°, regard vertical (limité près des pôles pour éviter le retournement).
- Clic gauche : tirer ; maintenir pour enchaîner les tirs selon la cadence de l’arme.
- Clic droit maintenu : avancer dans la direction horizontale du regard.
- ZQSD/WASD : déplacements complémentaires ; Maj : courir.
- Flèches : tourner et regarder verticalement si la capture souris n’est pas disponible.
- 1/2 : revolver / fusil à pompe ; E : briser un sceau ; M : carte ; Échap : pause.

Brisez les trois sceaux puis atteignez le portail au nord. Cache secrète dans le renfoncement ouest. Les tirs prennent en compte la visée verticale.

## Visuels et vérification
Les matériaux et l’atlas (trois démons, deux armes et une boule de feu) sont générés avec imagegen et servis depuis `dist/assets`. Le renderer découpe l’atlas au chargement en textures WebGL et images d’armes ; aucun service externe requis pour jouer. Polices Google facultatives.

Vérification dans Chrome sans interface avec WebGL : chargement des assets, absence d’erreurs JavaScript/WebGL, clic droit déplacement/arrêt, clic gauche tir, suppression du menu contextuel, rotation 360° et regard vertical, visée verticale, progression des sceaux, victoire, relâchement des boutons à la pause. Capture du rendu inspectée.

Version ordinateur ; commandes tactiles non incluses. Ennemis détaillés en sprites orientés vers la caméra, décor entièrement en 3D.

## Combat : son et impacts
Les tirs Web Audio superposent un claquement bref, un souffle grave, des bruits mécaniques et des réflexions de la salle, avec trois variations par arme et un compresseur pour les tirs simultanés. Les sons sont synthétisés localement.

Les impacts créent des particules de sang en 3D avec gravité et traces au sol qui disparaissent après 22 à 28 secondes ; le nombre de particules et de traces est limité. Une élimination déclenche une des quatre répliques françaises, avec sous-titres et un délai minimum de 4,5 secondes entre les phrases. Les clips WAV sont des voix synthétiques filtrées façon radio et restent disponibles sans service vocal externe. Le bouton SON coupe aussi les voix ; la pause les interrompt.

Vérification Chrome supplémentaire : décodage des quatre clips, rendu audio hors ligne non silencieux et sans saturation, sang sur impact et élimination, évolution et disparition des traces, cadence des répliques, mute et rendu WebGL des effets.
