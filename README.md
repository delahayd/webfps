# La Dernière Porte — version 2
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
