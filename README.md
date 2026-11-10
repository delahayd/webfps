# WebFPS

Deux FPS autonomes jouables en anglais dans un navigateur de bureau compatible WebGL.

- [Inferno — The Last Gate](inferno/README.md) : forteresse infernale.
- [Outbreak — The Possessed Lab](outbreak/README.md) : libérer un laboratoire, du bâtiment B au bâtiment A.

Depuis cette racine :

```sh
python3 -m http.server 8080
```

- Inferno : http://localhost:8080/inferno/dist/
- Outbreak : http://localhost:8080/outbreak/dist/

## Outbreak sur GitHub Pages

Le workflow [Deploy Outbreak to GitHub Pages](.github/workflows/pages.yml) publie
uniquement `outbreak/dist`, directement à la racine du site Pages. Il vérifie la
campagne avant publication et se relance lors des modifications du jeu sur `main`.

Activation initiale : dans les paramètres du dépôt, **Settings → Pages → Build
and deployment → Source**, choisir **GitHub Actions**. Puis lancer le workflow
depuis **Actions → Deploy Outbreak to GitHub Pages → Run workflow** si nécessaire.
Un dépôt privé nécessite un abonnement GitHub compatible avec Pages.

Adresse attendue après le premier déploiement réussi (sans domaine personnalisé) :
https://delahayd.github.io/webfps/

Pour ajouter un lien depuis une page personnelle :

```html
<a href="https://delahayd.github.io/webfps/">Jouer à Outbreak</a>
```

Le jeu nécessite un navigateur de bureau compatible WebGL.
