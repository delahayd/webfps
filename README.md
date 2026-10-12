# webfps

Collection de FPS jouables dans un navigateur. Chaque jeu dispose de son propre répertoire.

- [Inferno — The Last Gate: Hell Forged](inferno/README.md) : FPS dans une forteresse infernale.

Pour lancer Inferno depuis la racine du dépôt :

```sh
python3 -m http.server 8080 --directory inferno/dist
```

Ouvrir ensuite http://localhost:8080 dans un navigateur de bureau compatible WebGL.

Pour régénérer les ressources, lancer les scripts depuis le répertoire `inferno`.
