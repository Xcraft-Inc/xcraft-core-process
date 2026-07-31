# 📘 xcraft-core-process

## Aperçu

`xcraft-core-process` est une bibliothèque utilitaire de bas niveau de l'écosystème Xcraft qui encapsule les fonctions natives de Node.js (`child_process.spawn`, `child_process.fork`, `child_process.exec`) pour lancer des processus externes de manière robuste et instrumentée. Le module capture les flux `stdout`/`stderr` ligne par ligne, permet de les rediriger vers différentes stratégies de journalisation (loggers), d'en filtrer le niveau de gravité selon l'outil lancé (forwarders), et d'en extraire des informations spécifiques comme des barres de progression (parsers). Il constitue la brique de base utilisée par tous les modules Xcraft ayant besoin d'exécuter des outils externes (git, cmake, ninja, msbuild, wpkg, esign, etc.).

## Sommaire

- [Structure du module](#structure-du-module)
- [Fonctionnement global](#fonctionnement-global)
- [Exemples d'utilisation](#exemples-dutilisation)
- [Interactions avec d'autres modules](#interactions-avec-dautres-modules)
- [Configuration avancée](#configuration-avancée)
- [Détails des sources](#détails-des-sources)
- [Licence](#licence)

## Structure du module

Le module est organisé en quatre familles de composants qui collaborent lors de l'exécution d'un processus :

- **Point d'entrée** (`index.js`) — factory exposant `getpid()`, `spawn()` et `fork()`, ainsi que la logique interne de découpage des flux en lignes (`parseLine`) et de bufferisation (`parse`).
- **`lib/printbuffer.js`** — classe utilitaire `PrintBuffer` qui accumule les fragments de sortie tant qu'aucun saut de ligne n'est reçu.
- **`lib/loggers/*.js`** — stratégies de sortie : où et comment écrire les lignes produites par le processus (`default`, `xlog`, `daemon`, `none`).
- **`lib/forwarders/*.js`** — déterminent le niveau de sévérité (`verb`, `info`, `warn`, `err`, `dbg`) d'une ligne selon l'outil lancé (`default`, `msbuild`, `wpkg`).
- **`lib/parsers/*.js`** — analysent les lignes de sortie pour détecter des motifs spécifiques (progression, erreurs) et déterminent le résultat final (`rc`) transmis au callback de fin (`default`, `cmake`, `git`, `msbuild`, `ninja`, `wpkg`, `esign`, `null`).

## Fonctionnement global

Lorsqu'un processus est lancé via `spawn()` ou `fork()`, le module :

1. Instancie le `logger` demandé (option `logger`), qui lui-même charge en interne le `forwarder` et le `parser` correspondants aux options fournies.
2. Démarre le processus enfant natif Node.js (`spawn`/`fork`/`exec` en secours).
3. Écoute les événements `data` sur `stdout` et `stderr`, découpe chaque paquet reçu en lignes complètes (`parseLine`), et bufferise les fragments incomplets via `PrintBuffer` (une instance par flux).
4. Pour chaque ligne complète, appelle `logger.onStdout(line)` ou `logger.onStderr(line)`, qui décide — via le `parser.exec()` — si la ligne doit être supprimée (cas d'une barre de progression déjà traitée) ou transmise au `forwarder.level()` puis affichée/journalisée.
5. À la fermeture du processus (événement `close` si des flux existent, sinon `exit`) ou en cas d'erreur (`error`), le module vide les tampons résiduels (`drain`) puis appelle `logger.onClose(code, callback)`, qui délègue à `parser.rc()` la construction du résultat final transmis au `callback` utilisateur.

Les callbacks optionnels `callbackStdout` et `callbackStderr` sont invoqués en parallèle du logger pour chaque ligne complète, indépendamment de la stratégie de log choisie.

### Repli automatique sur `exec`

Si `child_process.spawn` échoue avec un code d'erreur `UNKNOWN` (certains installeurs échouent ainsi sous Windows pour des raisons indéterminées), `spawn()` retente automatiquement l'exécution via `child_process.exec` en concaténant l'exécutable et ses arguments dans une seule chaîne (`"bin" arg1 arg2 ...`). Dans ce mode de secours, le PID n'est pas disponible (`getpid()` renverra `-1`) et les flux ne sont pas traités ligne par ligne au fil de l'eau : la sortie complète est traitée d'un bloc une fois le processus terminé.

## Exemples d'utilisation

### Lancer un processus simple

```javascript
const xProcess = require('xcraft-core-process')();

const proc = xProcess.spawn(
  'ls',
  ['-la'],
  {},
  (err, code) => {
    console.log(`Processus terminé avec le code ${code}`);
  },
  (line) => console.log(`STDOUT: ${line}`),
  (line) => console.log(`STDERR: ${line}`)
);

console.log(`PID du processus : ${xProcess.getpid()}`);
```

### Suivre la progression d'un clone Git via le logger Xcraft

```javascript
const xProcess = require('xcraft-core-process')({
  logger: 'xlog',
  forwarder: 'default',
  parser: 'git',
});

xProcess.spawn(
  'git',
  ['clone', 'https://github.com/user/repo'],
  {encoding: 'utf8', resp: this.quest.resp},
  (err, code) => {
    if (err) {
      console.error(`Erreur : ${err}`);
    } else {
      console.log('Clone terminé avec succès');
    }
  }
);
```

Ici, le parser `git` détecte les lignes de progression (`Compressing...`, `Receiving objects...`, etc.) et appelle `resp.log.progress(...)` au lieu de les afficher brutalement, tandis que le logger `xlog` journalise le reste via l'API de logging Xcraft.

### Gérer un cas d'erreur spécifique (wpkg)

```javascript
const xProcess = require('xcraft-core-process')({
  parser: 'wpkg',
});

xProcess.spawn(
  'wpkg',
  ['--is-installed', 'mon-paquet'],
  {encoding: 'utf8'},
  (err, code) => {
    if (code === 0) {
      console.log('Le paquet est installé');
    } else if (code === 1) {
      console.log("Le paquet n'est pas installé");
    } else if (code === 2) {
      console.log('Le paquet est partiellement installé');
    } else {
      console.error(`Erreur : ${err}`);
    }
  }
);
```

Le parser `wpkg` adapte l'interprétation du code de retour selon les arguments passés (`--is-installed`, `--compare-versions`) et selon la variable d'environnement `PEON_DEBUG_PKG`.

## Interactions avec d'autres modules

`xcraft-core-process` est un module fondamental sans dépendance vers d'autres modules de l'écosystème Xcraft (sa seule dépendance externe est `ansi-regex`, utilisée par le forwarder `wpkg` pour nettoyer les codes couleur ANSI avant analyse). Il est en revanche utilisé en amont par de nombreux modules Xcraft — notamment ceux orchestrant des outils de build ou de packaging (compilation native, gestion de paquets wpkg, opérations Git, signature de binaires) — qui lui délèguent le lancement et l'instrumentation de leurs processus externes. Le logger `xlog` s'appuie sur l'objet `resp` (réponse de quête) fourni par les modules appelants pour journaliser via l'API de logging Xcraft et publier la progression, établissant ainsi le lien avec le système de quêtes du framework.

## Configuration avancée

La factory exportée par `index.js` accepte un objet d'options qui pilote le comportement du module :

| Option      | Description                                                                                             | Type   | Valeur par défaut                                |
| ----------- | ------------------------------------------------------------------------------------------------------- | ------ | ------------------------------------------------ |
| `logger`    | Nom du logger à charger (`lib/loggers/<logger>.js`)                                                     | String | `'default'`                                      |
| `forwarder` | Nom du forwarder à charger (`lib/forwarders/<forwarder>.js`)                                            | String | `'default'`                                      |
| `parser`    | Nom du parser à charger (`lib/parsers/<parser>.js`)                                                     | String | `'default'`                                      |
| `resp`      | Objet réponse de quête Xcraft, requis par le logger `xlog` et par les parsers affichant une progression | Object | `undefined`                                      |
| `encoding`  | Encodage utilisé pour décoder les flux stdout/stderr                                                    | String | Dépend de `opts.encoding` passé à `spawn`/`fork` |

### Variables d'environnement

| Variable         | Description                                                                                                                                                                                         | Exemple | Valeur par défaut |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- | ----------------- |
| `PEON_DEBUG_PKG` | Bascule le forwarder et le parser `wpkg` en mode debug : les lignes normalement classées `err` passent en `warn`, et les erreurs de `rc` (hors `--is-installed`/`--compare-versions`) sont ignorées | `1`     | Non défini        |

## Détails des sources

### `index.js`

Point d'entrée du module. La fonction exportée est une factory qui, à partir des options fournies, retourne un objet exposant trois méthodes. En interne, elle charge dynamiquement le fichier logger correspondant à l'option `logger` et conserve le PID du dernier processus lancé dans une variable partagée entre les appels.

Les fonctions internes `parseLine` et `parse` gèrent respectivement le découpage d'un paquet de données en lignes complètes, et le branchement des événements du processus enfant (`data`, `error`, `close`/`exit`) vers le logger.

#### Méthodes publiques

- **`getpid()`** — Retourne le PID du dernier processus lancé par cette instance de la factory, ou `-1` si aucun processus n'a été lancé ou si le dernier lancement est passé par le mode de secours `exec`.
- **`spawn(bin, args, opts, callback, callbackStdout, callbackStderr)`** — Lance un exécutable via `child_process.spawn`. `bin` est le chemin de l'exécutable, `args` un tableau d'arguments, `opts` les options transmises à `spawn` (l'attribut `encoding` en est extrait avant l'appel). `callback(err, code)` est appelé à la fin du processus, `callbackStdout`/`callbackStderr` pour chaque ligne complète des flux respectifs. Si `spawn` échoue avec le code `UNKNOWN`, la fonction retente automatiquement via `child_process.exec` et retourne alors `null` au lieu de l'instance du processus.
- **`fork(bin, args, opts, callback, callbackStdout, callbackStderr)`** — Lance un module Node.js via `child_process.fork`, avec la même signature de callbacks que `spawn`. Retourne toujours l'instance du processus enfant.

### `lib/printbuffer.js`

Classe utilitaire `PrintBuffer` qui accumule les fragments de texte reçus tant qu'ils ne se terminent pas par un saut de ligne, afin d'éviter de traiter des lignes coupées en plusieurs paquets réseau/pipe.

#### Méthodes publiques

- **`buf(line, outFunc, prepend, append)`** — Ajoute `line` au tampon interne. Si `line` ne se termine pas par `\n`, elle est simplement accumulée. Sinon, `outFunc` est appelée avec le tampon complet (préfixé par `prepend` si le tampon était vide, suffixé par `append`), puis le tampon est réinitialisé.

### Loggers (`lib/loggers/`)

Les loggers déterminent la destination finale des lignes de sortie et orchestrent le forwarder et le parser associés.

- **`default.js`** — Charge le forwarder et le parser indiqués dans les options. Pour chaque ligne, interroge d'abord le parser (`exec`) ; si celui-ci ne l'a pas déjà traitée (ex. affichage d'une progression), écrit la ligne sur `process.stdout` ou `process.stderr` selon le niveau retourné par le forwarder. À la fermeture, délègue à `parser.rc()`.
- **`xlog.js`** — Variante utilisant l'API de logging Xcraft (`opts.resp.log`) au lieu d'écrire directement sur les flux natifs. Configure la verbosité du logger via `parser.getLevel()` dès l'instanciation.
- **`daemon.js`** — Enrobe le logger `default` en préfixant chaque ligne avec `(pid)`, utile pour distinguer les sorties de processus démons tournant en arrière-plan.
- **`none.js`** — Ignore complètement les lignes de sortie (`onStdout`/`onStderr` sont des no-op), tout en déléguant néanmoins la gestion du code de retour à `parser.rc()`.

### Forwarders (`lib/forwarders/`)

Les forwarders déterminent le niveau de sévérité (`verb`, `info`, `warn`, `err`, `dbg`) à associer à une ligne selon sa provenance (`stdout`/`stderr`) et son contenu.

- **`default.js`** — Associe systématiquement `stdout` au niveau `verb` et `stderr` au niveau `warn`.
- **`msbuild.js`** — Analyse le contenu de `stdout` pour détecter les motifs `error MSBxxxx`/`CSxxxx`/`CAxxxx` (niveau `err`) ou `warning ...` (niveau `warn`) ; tout `stderr` est classé `warn`.
- **`wpkg.js`** — Nettoie les codes couleur ANSI (via `ansi-regex`) puis reconnaît le format `prog [module] Niveau:` pour en extraire le niveau exact. Gère aussi des motifs spécifiques (`^error`, `wpkg:debug`, `wpkg:info`, `wpkg:warning`, `(node) warning`). Le niveau par défaut pour les lignes non reconnues dépend de la variable `PEON_DEBUG_PKG` (`warn` si définie, `err` sinon).

### Parsers (`lib/parsers/`)

Les parsers analysent les lignes de sortie pour en extraire des informations structurées (essentiellement des barres de progression) et transforment le code de retour du processus en résultat exploitable par le `callback` final.

- **`default.js`** — Ne traite aucune ligne (`exec` renvoie toujours `false`). Le code de retour non nul devient l'erreur `'rc=<code>'`.
- **`cmake.js`** — Détecte les motifs `[NN%]` et transmet la progression via `resp.log.progress('CMake building', ...)`.
- **`git.js`** — Détecte les motifs de progression Git (`Compressing`, `Receiving`, `Resolving`, `Counting objects`, `Checking out files`, `Updating files`, suivis d'un pourcentage) et les transmet via `resp.log.progress`.
- **`ninja.js`** — Détecte les motifs `[N/M]` typiques de Ninja et les transmet via `resp.log.progress('Ninja building', ...)`.
- **`msbuild.js`** — Ne traite aucune ligne particulière ; retourne simplement une erreur générique `'msbuild error'` si le code de retour est non nul.
- **`esign.js`** — Détecte les motifs de progression `[NN,N%] libellé` et les transmet via `resp.log.progress`.
- **`wpkg.js`** — Ignore certaines lignes attendues selon les arguments passés (`--listfiles`, `--list-index-packages`, `--list-index-packages-json`, ou les échecs `chmod`/`chown`). Interprète le code de retour différemment selon le contexte : tolère les codes jusqu'à `2` pour `--is-installed`, ignore toujours l'erreur pour `--compare-versions`, et sinon ne signale une erreur que si `PEON_DEBUG_PKG` n'est pas défini.
- **`null.js`** — Ignore systématiquement toute ligne (`exec` renvoie toujours `true`, ce qui empêche tout affichage) et ne remonte jamais d'erreur au `callback`, quel que soit le code de retour.

Tous les parsers exposent une méthode **`getLevel()`** utilisée par le logger `xlog` pour fixer la verbosité ; dans l'implémentation actuelle, tous retournent `0`.

## Licence

Ce module est distribué sous [licence MIT](./LICENSE).

_Ce contenu a été généré par IA_
