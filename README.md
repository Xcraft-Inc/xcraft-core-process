# 📘 Documentation du module xcraft-core-process

## Aperçu

Le module `xcraft-core-process` est une bibliothèque utilitaire qui améliore la gestion des processus dans l'écosystème Xcraft. Il fournit une abstraction au-dessus des fonctions natives de Node.js pour lancer des processus (`spawn`, `fork`, `exec`), avec des fonctionnalités avancées pour la gestion des flux de sortie, le logging et le parsing des résultats.

## Sommaire

- [Structure du module](#structure-du-module)
- [Fonctionnement global](#fonctionnement-global)
- [Exemples d'utilisation](#exemples-dutilisation)
- [Interactions avec d'autres modules](#interactions-avec-dautres-modules)
- [Configuration avancée](#configuration-avancée)
- [Détails des sources](#détails-des-sources)
- [Cas d'utilisation avancés](#cas-dutilisation-avancés)

## Structure du module

Le module est organisé comme suit:

- **Module principal** (`index.js`) - Point d'entrée exposant les fonctions principales
- **PrintBuffer** (`lib/printbuffer.js`) - Gestion des tampons de sortie
- **Loggers** (`lib/loggers/`) - Différentes stratégies de logging
- **Forwarders** (`lib/forwarders/`) - Gestion des niveaux de log selon le type de sortie
- **Parsers** (`lib/parsers/`) - Analyseurs spécifiques pour différents outils (cmake, git, msbuild, etc.)

## Fonctionnement global

Le module permet de lancer des processus externes tout en fournissant un contrôle précis sur:

1. La capture et le traitement des flux stdout/stderr
2. La gestion des codes de retour
3. Le parsing des sorties pour extraire des informations spécifiques (comme les barres de progression)
4. Le logging formaté selon différentes stratégies

Lorsqu'un processus est lancé via ce module, les flux de sortie sont capturés, analysés ligne par ligne, et traités selon les configurations spécifiées. Des callbacks peuvent être fournis pour réagir à chaque ligne de sortie ou à la fin du processus.

## Exemples d'utilisation

### Exemple basique

```javascript
const xProcess = require('xcraft-core-process')();

// Lancer un processus
const proc = xProcess.spawn(
  'ls',
  ['-la'],
  {},
  (err, code) => {
    // Callback appelé à la fin du processus
    console.log(`Process exited with code ${code}`);
  },
  (stdout) => {
    // Callback pour chaque ligne de stdout
    console.log(`STDOUT: ${stdout}`);
  },
  (stderr) => {
    // Callback pour chaque ligne de stderr
    console.log(`STDERR: ${stderr}`);
  }
);
```

### Exemple avec options personnalisées

```javascript
const xProcess = require('xcraft-core-process')({
  logger: 'xlog', // Utiliser le logger xlog
  forwarder: 'default', // Utiliser le forwarder par défaut
  parser: 'git', // Utiliser le parser git
});

// Lancer un processus git avec suivi de progression
const proc = xProcess.spawn(
  'git',
  ['clone', 'https://github.com/user/repo'],
  {encoding: 'utf8'},
  (err, code) => {
    if (err) {
      console.error(`Error: ${err}`);
    } else {
      console.log('Clone successful');
    }
  }
);

// Récupérer le PID du processus
console.log(`Process PID: ${xProcess.getpid()}`);
```

## Interactions avec d'autres modules

Ce module est une bibliothèque de base dans l'écosystème Xcraft et est utilisé par de nombreux autres modules qui ont besoin de lancer des processus externes. Il n'a pas de dépendances directes sur d'autres modules Xcraft, ce qui en fait un module fondamental.

## Configuration avancée

Le module accepte plusieurs options de configuration:

| Option      | Description                        | Type   | Valeur par défaut                       |
| ----------- | ---------------------------------- | ------ | --------------------------------------- |
| `logger`    | Stratégie de logging à utiliser    | String | `'default'`                             |
| `forwarder` | Stratégie de forwarding à utiliser | String | `'default'`                             |
| `parser`    | Stratégie de parsing à utiliser    | String | `'default'`                             |
| `encoding`  | Encodage à utiliser pour les flux  | String | Dépend des options passées à spawn/fork |

### Variables d'environnement

| Variable         | Description                                 | Exemple | Valeur par défaut |
| ---------------- | ------------------------------------------- | ------- | ----------------- |
| `PEON_DEBUG_PKG` | Active le mode debug pour les packages wpkg | `1`     | Non défini        |

## Détails des sources

### `index.js`

Ce fichier est le point d'entrée du module. Il expose une fonction factory qui retourne un objet avec les méthodes principales:

- `getpid()` - Récupère le PID du dernier processus lancé
- `spawn()` - Lance un processus avec child_process.spawn
- `fork()` - Lance un processus Node.js avec child_process.fork

Le module gère également le parsing des lignes de sortie et la redirection vers les loggers appropriés.

#### Méthodes publiques

- **`getpid()`** - Retourne le PID du dernier processus lancé.

- **`spawn(bin, args, opts, callback, callbackStdout, callbackStderr)`** - Lance un processus externe.

  - `bin` - Chemin vers l'exécutable
  - `args` - Tableau d'arguments
  - `opts` - Options pour spawn (voir Node.js child_process.spawn)
  - `callback` - Fonction appelée à la fin du processus avec (err, code)
  - `callbackStdout` - Fonction appelée pour chaque ligne de stdout
  - `callbackStderr` - Fonction appelée pour chaque ligne de stderr
  - Retourne l'instance du processus ou null si spawn a échoué et exec a été utilisé en fallback

- **`fork(bin, args, opts, callback, callbackStdout, callbackStderr)`** - Lance un processus Node.js.
  - Paramètres identiques à spawn
  - Retourne l'instance du processus

### `lib/printbuffer.js`

Classe utilitaire qui gère la mise en tampon des lignes de sortie. Elle accumule les caractères jusqu'à rencontrer un saut de ligne, puis appelle la fonction de sortie.

#### Méthodes publiques

- **`buf(line, outFunc, prepend, append)`** - Ajoute une ligne au tampon et la traite si elle se termine par un saut de ligne.
  - `line` - Ligne à ajouter au tampon
  - `outFunc` - Fonction à appeler lorsqu'une ligne complète est disponible
  - `prepend` - Texte à ajouter au début de la ligne (optionnel)
  - `append` - Texte à ajouter à la fin de la ligne (optionnel)

### Loggers

Les loggers déterminent comment les sorties des processus sont affichées ou traitées.

#### `lib/loggers/default.js`

Logger par défaut qui écrit les sorties sur stdout/stderr selon le niveau déterminé par le forwarder.

#### `lib/loggers/xlog.js`

Logger qui utilise l'API de logging Xcraft pour afficher les sorties avec des niveaux de verbosité appropriés.

#### `lib/loggers/daemon.js`

Logger qui préfixe chaque ligne avec le PID du processus, utile pour les processus en arrière-plan.

#### `lib/loggers/none.js`

Logger qui ignore toutes les sorties, utile pour les processus silencieux.

### Forwarders

Les forwarders déterminent le niveau de log à utiliser pour chaque ligne de sortie.

#### `lib/forwarders/default.js`

Forwarder par défaut qui associe stdout au niveau 'verb' et stderr au niveau 'warn'.

#### `lib/forwarders/msbuild.js`

Forwarder spécifique pour MSBuild qui analyse les lignes pour détecter les erreurs et avertissements.

#### `lib/forwarders/wpkg.js`

Forwarder spécifique pour wpkg qui analyse les lignes pour détecter les différents niveaux de log.

### Parsers

Les parsers analysent les sorties des processus pour extraire des informations spécifiques ou traiter des cas particuliers.

#### `lib/parsers/default.js`

Parser par défaut qui transmet simplement le code de retour au callback.

#### `lib/parsers/cmake.js`

Parser pour CMake qui détecte les barres de progression et les affiche via l'API de progression.

#### `lib/parsers/git.js`

Parser pour Git qui détecte les barres de progression lors des opérations comme clone, pull, etc.

#### `lib/parsers/msbuild.js`

Parser pour MSBuild qui gère les codes d'erreur spécifiques.

#### `lib/parsers/ninja.js`

Parser pour Ninja build qui détecte et affiche la progression de la compilation.

#### `lib/parsers/wpkg.js`

Parser pour wpkg qui gère les cas spéciaux comme --is-installed et --compare-versions.

#### `lib/parsers/esign.js`

Parser pour esign qui détecte les barres de progression lors de la signature électronique.

#### `lib/parsers/null.js`

Parser qui ignore complètement les sorties, utile pour les processus dont on ne veut pas traiter la sortie.

## Cas d'utilisation avancés

### Gestion des barres de progression

Le module peut détecter et afficher les barres de progression pour plusieurs outils comme Git, CMake, Ninja et esign:

```javascript
const xProcess = require('xcraft-core-process')({
  parser: 'git',
  logger: 'xlog',
  resp: this.quest.resp,
});

xProcess.spawn(
  'git',
  ['clone', 'https://github.com/user/repo'],
  {encoding: 'utf8'},
  (err, code) => {
    // Fin du processus
  }
);
```

### Gestion des erreurs spécifiques

Certains parsers comme wpkg gèrent des cas d'erreur spécifiques:

```javascript
const xProcess = require('xcraft-core-process')({
  parser: 'wpkg',
});

xProcess.spawn(
  'wpkg',
  ['--is-installed', 'package-name'],
  {encoding: 'utf8'},
  (err, code) => {
    if (code === 0) {
      console.log('Package is installed');
    } else if (code === 1) {
      console.log('Package is not installed');
    } else if (code === 2) {
      console.log('Package is partially installed');
    } else {
      console.error(`Error: ${err}`);
    }
  }
);
```

---

_Cette documentation a été mise à jour automatiquement._