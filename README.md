# ChillCalendar — App iOS

Shell nativo (Capacitor) attorno alla web app di ChillCalendar. L'app carica il
sito live (`https://chillcalendar.vercel.app`) e aggiunge le **notifiche push
native** (APNs + Firebase Cloud Messaging).

La logica di registrazione delle push vive nella **web app** (componente
`NativePush`): quando gira dentro l'app, chiede il permesso, si registra,
manda il token a `/api/push/register` e apre la chat/evento giusto al tap.
Qui c'è solo il guscio nativo.

## Login Google (deep link)
Google blocca OAuth nelle WebView, quindi il login apre **SFSafariViewController**
(`@capacitor/browser`). A fine login il callback web apre il deep link
`com.chillcalendar.app://auth?token=…` che riporta l'app in primo piano:
lo URL scheme è registrato in `ios/App/App/Info.plist` (`CFBundleURLTypes`,
scheme `com.chillcalendar.app`, host `auth` — **non cambiarli**).
`AppDelegate.swift` inoltra l'apertura al bridge Capacitor (evento
`appUrlOpen`): il componente web `NativeAuth` lo riceve, chiude il browser e
scambia il token monouso con il cookie di sessione nella WebView.

## Push (APNs + FCM)
Le push iOS passano da APNs ma il backend consegna via FCM, quindi il token
registrato dev'essere quello **FCM**: in `AppDelegate.swift` il device token
APNs viene passato a `Messaging.messaging().apnsToken` e al bridge Capacitor
viene notificato il token FCM. Il pod `FirebaseMessaging` è nel `Podfile`;
le capability **Push Notifications** e **Background Modes → Remote
notifications** sono già configurate (`App.entitlements` + `Info.plist`).

## Prerequisiti
- **macOS con Xcode** (per compilare: da Linux/Windows non si può)
- **Node.js** 18+
- **CocoaPods** (`sudo gem install cocoapods` o `brew install cocoapods`)

## Setup (una volta, sul Mac)
La cartella `ios/` è già nel repo (generata con `npx cap add ios` e poi
modificata: URL scheme del deep link + push APNs/FCM).
```bash
npm install --ignore-scripts
npx cap sync ios
cd ios/App && pod install && cd ../..
npx cap open ios     # apre App.xcworkspace in Xcode (NON App.xcodeproj)
```

### Firebase / push — passi manuali rimasti
1. Copia **`GoogleService-Info.plist`** (dalla console Firebase, app iOS con
   bundle `com.chillcalendar.app`) in:
   ```
   ios/App/App/GoogleService-Info.plist
   ```
   e **aggiungilo al target App in Xcode**: File → Add Files to "App"…,
   spunta il target *App*. Il file è nel `.gitignore` (va copiato a mano su
   ogni macchina di sviluppo). Senza il file l'app parte lo stesso
   (`FirebaseApp.configure()` viene saltato), ma le push non funzionano.
2. Nella **console Firebase** (Impostazioni progetto → Cloud Messaging →
   app iOS) carica la **chiave APNs** (`.p8`) creata sul portale Apple
   Developer (Certificates → Keys → “+” con APNs abilitato), con Key ID e
   Team ID. Senza la chiave APNs, FCM non può consegnare nulla su iOS.
3. In Xcode, in *Signing & Capabilities*, seleziona il tuo **team** Apple
   Developer (serve l'account a pagamento per le push su dispositivo reale).

### Icona e splash
Già generate in `ios/App/App/Assets.xcassets/` dalle sorgenti in
`resources/` (le stesse del repo Android). Se cambi le immagini in
`resources/`, rigenera con:
```bash
npm run assets      # = capacitor-assets generate --ios
```

## Build
- **In locale**: da Xcode (Product → Run su simulatore o iPhone).
- **In CI**: la GitHub Action `.github/workflows/ios-build.yml` compila su
  `macos-latest` **senza firma** (`CODE_SIGNING_ALLOWED=NO`) come check di
  compilazione. La firma vera (certificati + provisioning profile, ad es.
  con fastlane match) si aggiunge quando c'è l'account Apple Developer.

## Test del login Google (su iPhone/simulatore)
1. Tap su "Accedi con Google" → si apre Safari in-app con barra URL.
2. Scegli l'account → compare "Accesso completato ✅ Ritorno all'app…".
3. **L'app deve tornare in primo piano da sola**, loggata.

Se resta bloccato su "Accesso completato": lo URL scheme in `Info.plist`
manca o è sbagliato (deve essere `com.chillcalendar.app`). La WebView si
ispeziona da Safari desktop: Sviluppo → [dispositivo] → App.

## Test delle notifiche (solo dispositivo reale, non simulatore)
1. Avvia l'app, fai login, **accetta il permesso notifiche**.
2. Il token FCM viene registrato su `/api/push/register`.
3. Fai inviare un messaggio in una chat o crea un evento **da un altro
   account/dispositivo**: dovrebbe arrivare la push. Al tap si apre la
   schermata giusta.

## Vincoli
- Bundle ID / scheme deep link: sempre **`com.chillcalendar.app`**.
- `server.url` resta `https://chillcalendar.vercel.app`.
- Mai committare: certificati di firma, chiavi APNs (`.p8`), provisioning
  profile, `GoogleService-Info.plist`, service-account Firebase.
