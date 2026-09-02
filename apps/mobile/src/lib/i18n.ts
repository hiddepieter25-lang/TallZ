import { getLocales } from "expo-localization";

/**
 * Two languages, following the phone. Dutch for a Dutch device, English for
 * everything else — TallZ launches in the Netherlands and sources from
 * English-speaking retailers, so both matter and nothing else does yet.
 *
 * Deliberately a flat dictionary and a `t()` function rather than an i18n
 * library: two languages and a few hundred strings don't need plural rules
 * engines or lazy-loaded bundles. `{name}` placeholders are the only feature.
 *
 * Product data (names, retailers, categories) is never translated — it comes
 * from the shops as-is.
 */

export type Locale = "en" | "nl";

export function deviceLocale(): Locale {
  const code = getLocales()[0]?.languageCode?.toLowerCase();
  return code === "nl" ? "nl" : "en";
}

const en = {
  // Tabs and chrome
  "tabs.search": "Search",
  "tabs.explore": "Explore",
  "tabs.account": "Account",
  "header.logo": "TallZ — go to the introduction",

  // Shared
  "error.catalog": "Couldn't reach the catalog. Check your connection and try again.",
  "error.retry": "Try again",
  "common.cancel": "Cancel",
  "common.back": "Back",

  // Product card and fit
  "card.open": "{name} by {retailer}. Opens the product.",
  "card.save": "Save",
  "card.unsave": "Remove from saved",
  "fit.inseam": "{cm}cm inseam",
  "fit.sleeve": "{cm}cm sleeve",
  "fit.body": "{cm}cm body",

  // Search
  "search.eyebrow": "find your fit",
  "search.placeholder": "Trousers, 36 inseam, black",
  "search.count.one": "1 item",
  "search.count.other": "{count} items",
  "search.emptyFiltered": "Nothing matches that. Try a different word or filter.",
  "search.empty": "Start typing, or pick a filter.",
  "search.personalised": "sorted to your style",
  "chip.inseam36": '36" inseam',
  "chip.inseam38": '38" inseam',
  "chip.sleeve37": 'Long sleeve 37"',
  "chip.men": "Men",
  "chip.women": "Women",
  "chip.eu": "EU retailers",

  // Explore
  "explore.empty": "Nothing to explore yet.",
  "explore.shop": "Shop this",
  "explore.skip": "Skip",
  "explore.like": "Like",

  // Product detail
  "product.notFound": "This product is no longer available.",
  "product.open": "Open at {retailer}",
  "product.noLink": "No shop link for this item yet.",
  "product.details": "details",
  "product.fit": "Fit",
  "product.material": "Material",
  "product.color": "Colour",
  "product.category": "Category",
  "product.ships": "Ships to",
  "product.photoOf": "Photo {n} of {total}",

  // Account
  "account.eyebrow": "Account",
  "account.title": "your account",
  "account.signedInAs": "Signed in as",
  "account.saved": "Saved items",
  "account.savedEmpty": "Tap the heart on any product to keep it here.",
  "account.yourStyle": "Your style",
  "account.height": "Height",
  "account.fit": "Fit",
  "account.budget": "Budget",
  "account.changeAnswers": "Change my style answers",
  "account.takeQuiz": "Take the style quiz",
  "account.privacy": "Privacy",
  "account.loggingOn": "Activity logging: on",
  "account.loggingOff": "Activity logging: off",
  "account.change": "Change",
  "account.logout": "Log out",
  "account.logoutTitle": "Log out?",
  "account.logoutBody": "You'll need to sign in again to see your feed.",
  "account.delete": "Delete my account",
  "account.deleteTitle": "Delete your account?",
  "account.deleteBody":
    "This removes your account, your saved items and your style answers for good. It cannot be undone.",
  "account.deleteConfirm": "Delete",
  "account.deleteFailed": "Couldn't delete the account. Check your connection and try again.",

  // Home / introduction
  "home.eyebrow": "for women 173cm+ / men 183cm+",
  "home.hero": "Your closet.\nOne tap\nfrom yours.",
  "home.lede":
    "Affordable tall-fit finds from {count} pieces, curated like a feed you'd actually want to scroll. Tap through and check out on the seller's own site — TallZ just makes the match.",
  "home.createAccount": "Create account",
  "home.haveOne": "Already have one? ",
  "home.login": "Log in",
  "home.browse": "Browse the catalog",
  "home.heroCaption": "Cut long, worn well",
  "home.statementEyebrow": "the fit problem",
  "home.statement": "Cheap fashion shouldn't mean settling for a hem that stops an inch too soon.",
  "home.consent":
    "May we log which products you view and tap, to improve your feed? Links to shops work either way.",
  "home.noThanks": "No thanks",
  "home.allow": "Allow",
  "home.quizTitle": "Make this feed yours",
  "home.quizBody": "Six quick questions about your height and taste, and the order changes to match.",
  "home.start": "Start",
  "home.picksEyebrow": "the picks",
  "home.picksTitle": "Worth a look",
  "home.viewAll": "View all",
  "home.empty": "Nothing here yet.",
  "home.loadFailed": "Couldn't load products. Pull down to try again.",

  // Auth
  "auth.accountEyebrow": "Account",
  "auth.loginTitle": "log in",
  "auth.email": "Email",
  "auth.password": "Password",
  "auth.login": "Log in",
  "auth.forgot": "Forgot your password?",
  "auth.noAccount": "No account yet? ",
  "auth.signup": "Sign up",
  "auth.signupTitle": "create account",
  "auth.createAccount": "Create account",
  "auth.haveAccount": "Already have an account? ",
  "auth.checkEmailEyebrow": "Almost there",
  "auth.checkEmailTitle": "check your email",
  "auth.checkEmailBody": "We sent a confirmation link to {email}. Open it, then come back and log in.",
  "auth.backToLogin": "Back to log in",
  "auth.resetTitle": "reset password",
  "auth.resetBody": "Enter the email you signed up with and we'll send you a link to set a new password.",
  "auth.sendLink": "Send link",
  "auth.remembered": "Remembered it? ",
  "auth.sentEyebrow": "Check your email",
  "auth.sentTitle": "on its way",
  "auth.sentBody":
    "If an account exists for {email}, we sent a link to set a new password. Open it on this phone — it opens straight back into TallZ.",
  "auth.newPasswordTitle": "new password",
  "auth.newPassword": "New password",
  "auth.repeatPassword": "Repeat new password",
  "auth.savePassword": "Save password",
  "auth.mismatch": "The two passwords don't match.",
  "auth.linkExpiredTitle": "link expired",
  "auth.linkExpiredBody": "That reset link is no longer valid — they can only be used once, and they expire.",
  "auth.openFromEmail": "Open this screen from the link in your email, so we know which account to change.",
  "auth.sendNewLink": "Send a new link",

  // Onboarding
  "quiz.back": "Back",
  "quiz.close": "Close",
  "quiz.next": "Next",
  "quiz.finish": "Show my feed",
  "quiz.saving": "Saving…",
  "quiz.saveFailed": "Couldn't save your answers. Try again.",
  "quiz.step": "{n} of {total}",
  "quiz.heightTitle": "How tall are you?",
  "quiz.heightBody": "So we can hide anything that won't reach.",
  "quiz.proportionTitle": "Where do you need the length?",
  "quiz.proportionBody": "Tall people aren't tall in the same places.",
  "quiz.swipeTitle": "Which of these would you wear?",
  "quiz.swipeBody": "Tap the heart on what you like, cross what you don't.",
  "quiz.occasionTitle": "What are you shopping for?",
  "quiz.occasionBody": "Pick as many as you like.",
  "quiz.fitTitle": "How do you like it to fit?",
  "quiz.budgetTitle": "What's your usual budget per piece?",
} as const;

export type MessageKey = keyof typeof en;

const nl: Record<MessageKey, string> = {
  "tabs.search": "Zoeken",
  "tabs.explore": "Ontdek",
  "tabs.account": "Account",
  "header.logo": "TallZ — naar de introductie",

  "error.catalog": "De catalogus is niet bereikbaar. Controleer je verbinding en probeer opnieuw.",
  "error.retry": "Opnieuw proberen",
  "common.cancel": "Annuleren",
  "common.back": "Terug",

  "card.open": "{name} van {retailer}. Opent het product.",
  "card.save": "Bewaren",
  "card.unsave": "Uit bewaard verwijderen",
  "fit.inseam": "{cm}cm binnenbeen",
  "fit.sleeve": "{cm}cm mouw",
  "fit.body": "{cm}cm rug",

  "search.eyebrow": "vind je maat",
  "search.placeholder": "Broek, 36 binnenbeen, zwart",
  "search.count.one": "1 item",
  "search.count.other": "{count} items",
  "search.emptyFiltered": "Niets gevonden. Probeer een ander woord of filter.",
  "search.empty": "Begin met typen, of kies een filter.",
  "search.personalised": "gesorteerd op jouw stijl",
  "chip.inseam36": '36" binnenbeen',
  "chip.inseam38": '38" binnenbeen',
  "chip.sleeve37": 'Lange mouw 37"',
  "chip.men": "Heren",
  "chip.women": "Dames",
  "chip.eu": "EU-winkels",

  "explore.empty": "Nog niets te ontdekken.",
  "explore.shop": "Bekijk in winkel",
  "explore.skip": "Overslaan",
  "explore.like": "Leuk",

  "product.notFound": "Dit product is niet meer beschikbaar.",
  "product.open": "Bekijk bij {retailer}",
  "product.noLink": "Nog geen winkellink voor dit item.",
  "product.details": "details",
  "product.fit": "Pasvorm",
  "product.material": "Materiaal",
  "product.color": "Kleur",
  "product.category": "Categorie",
  "product.ships": "Verzendt naar",
  "product.photoOf": "Foto {n} van {total}",

  "account.eyebrow": "Account",
  "account.title": "jouw account",
  "account.signedInAs": "Ingelogd als",
  "account.saved": "Bewaarde items",
  "account.savedEmpty": "Tik op het hartje bij een product om het hier te bewaren.",
  "account.yourStyle": "Jouw stijl",
  "account.height": "Lengte",
  "account.fit": "Pasvorm",
  "account.budget": "Budget",
  "account.changeAnswers": "Mijn stijlantwoorden aanpassen",
  "account.takeQuiz": "Doe de stijlquiz",
  "account.privacy": "Privacy",
  "account.loggingOn": "Activiteit bijhouden: aan",
  "account.loggingOff": "Activiteit bijhouden: uit",
  "account.change": "Wijzig",
  "account.logout": "Uitloggen",
  "account.logoutTitle": "Uitloggen?",
  "account.logoutBody": "Je moet opnieuw inloggen om je feed te zien.",
  "account.delete": "Mijn account verwijderen",
  "account.deleteTitle": "Account verwijderen?",
  "account.deleteBody":
    "Dit verwijdert je account, je bewaarde items en je stijlantwoorden definitief. Dit kan niet ongedaan worden gemaakt.",
  "account.deleteConfirm": "Verwijderen",
  "account.deleteFailed": "Verwijderen is niet gelukt. Controleer je verbinding en probeer opnieuw.",

  "home.eyebrow": "voor vrouwen 173cm+ / mannen 183cm+",
  "home.hero": "Jouw kast.\nEén tik\nvan de jouwe.",
  "home.lede":
    "Betaalbare lange maten uit {count} items, samengesteld als een feed die je écht wilt scrollen. Tik door en reken af bij de winkel zelf — TallZ maakt alleen de match.",
  "home.createAccount": "Account aanmaken",
  "home.haveOne": "Heb je er al een? ",
  "home.login": "Inloggen",
  "home.browse": "Bekijk de catalogus",
  "home.heroCaption": "Lang gesneden, goed gedragen",
  "home.statementEyebrow": "het pasvormprobleem",
  "home.statement": "Betaalbare mode hoeft niet te betekenen dat je pijpen net te kort zijn.",
  "home.consent":
    "Mogen we bijhouden welke producten je bekijkt en aantikt, om je feed te verbeteren? Winkellinks werken hoe dan ook.",
  "home.noThanks": "Nee, bedankt",
  "home.allow": "Toestaan",
  "home.quizTitle": "Maak deze feed van jou",
  "home.quizBody": "Zes korte vragen over je lengte en smaak, en de volgorde past zich aan.",
  "home.start": "Start",
  "home.picksEyebrow": "de selectie",
  "home.picksTitle": "De moeite waard",
  "home.viewAll": "Alles bekijken",
  "home.empty": "Nog niets hier.",
  "home.loadFailed": "Producten laden is niet gelukt. Trek omlaag om opnieuw te proberen.",

  "auth.accountEyebrow": "Account",
  "auth.loginTitle": "inloggen",
  "auth.email": "E-mail",
  "auth.password": "Wachtwoord",
  "auth.login": "Inloggen",
  "auth.forgot": "Wachtwoord vergeten?",
  "auth.noAccount": "Nog geen account? ",
  "auth.signup": "Aanmelden",
  "auth.signupTitle": "account aanmaken",
  "auth.createAccount": "Account aanmaken",
  "auth.haveAccount": "Heb je al een account? ",
  "auth.checkEmailEyebrow": "Bijna klaar",
  "auth.checkEmailTitle": "check je e-mail",
  "auth.checkEmailBody": "We hebben een bevestigingslink gestuurd naar {email}. Open die, en log daarna in.",
  "auth.backToLogin": "Terug naar inloggen",
  "auth.resetTitle": "wachtwoord resetten",
  "auth.resetBody": "Vul het e-mailadres in waarmee je je hebt aangemeld. Je krijgt een link om een nieuw wachtwoord in te stellen.",
  "auth.sendLink": "Link sturen",
  "auth.remembered": "Toch onthouden? ",
  "auth.sentEyebrow": "Check je e-mail",
  "auth.sentTitle": "onderweg",
  "auth.sentBody":
    "Als er een account bestaat voor {email}, hebben we een link gestuurd om een nieuw wachtwoord in te stellen. Open die op deze telefoon — hij opent direct in TallZ.",
  "auth.newPasswordTitle": "nieuw wachtwoord",
  "auth.newPassword": "Nieuw wachtwoord",
  "auth.repeatPassword": "Herhaal nieuw wachtwoord",
  "auth.savePassword": "Wachtwoord opslaan",
  "auth.mismatch": "De twee wachtwoorden komen niet overeen.",
  "auth.linkExpiredTitle": "link verlopen",
  "auth.linkExpiredBody": "Die resetlink is niet meer geldig — ze werken maar één keer, en verlopen.",
  "auth.openFromEmail": "Open dit scherm via de link in je e-mail, zodat we weten welk account we moeten aanpassen.",
  "auth.sendNewLink": "Nieuwe link sturen",

  "quiz.back": "Terug",
  "quiz.close": "Sluiten",
  "quiz.next": "Volgende",
  "quiz.finish": "Toon mijn feed",
  "quiz.saving": "Opslaan…",
  "quiz.saveFailed": "Je antwoorden opslaan is niet gelukt. Probeer opnieuw.",
  "quiz.step": "{n} van {total}",
  "quiz.heightTitle": "Hoe lang ben je?",
  "quiz.heightBody": "Zodat we alles kunnen verbergen wat niet lang genoeg is.",
  "quiz.proportionTitle": "Waar heb je de lengte nodig?",
  "quiz.proportionBody": "Lange mensen zijn niet op dezelfde plekken lang.",
  "quiz.swipeTitle": "Wat zou je hiervan dragen?",
  "quiz.swipeBody": "Tik op het hartje bij wat je leuk vindt, het kruisje bij wat niet.",
  "quiz.occasionTitle": "Waar shop je voor?",
  "quiz.occasionBody": "Kies er zoveel als je wilt.",
  "quiz.fitTitle": "Hoe wil je dat het zit?",
  "quiz.budgetTitle": "Wat is je gebruikelijke budget per item?",
};

const dictionaries: Record<Locale, Record<MessageKey, string>> = { en, nl };

let current: Locale = deviceLocale();

/** Only for tests and previews — the app itself follows the device. */
export function setLocale(locale: Locale) {
  current = locale;
}

export function currentLocale(): Locale {
  return current;
}

/**
 * Look up a message and fill its placeholders. An unknown key returns the key
 * itself rather than throwing, so a typo shows up on screen as "search.foo"
 * instead of crashing the app — loud, but survivable.
 */
export function t(key: MessageKey, vars: Record<string, string | number> = {}): string {
  const template = dictionaries[current][key] ?? en[key] ?? key;
  return template.replace(/\{(\w+)\}/g, (_, name: string) =>
    name in vars ? String(vars[name]) : `{${name}}`
  );
}

/** "1 item" / "3 items" — the one plural the app needs. */
export function tCount(base: "search.count", count: number): string {
  return count === 1 ? t(`${base}.one`) : t(`${base}.other`, { count });
}
