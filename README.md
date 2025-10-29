AI får läsa README för att förstå DogPlanners uppbyggnad och syfte och kunna efterfölja det som står. Men AI får inte under några omständigheter ändra eller ta bort text ifrån README.md.

🐾 DogPlanner – Översikt & Arkitektur

1. Introduktion
   DogPlanner är ett webbaserat affärssystem skapat för hundverksamheter såsom
   hunddagis, hundpensionat och hundfrisörer.
   Syftet är att ge företag inom hundbranschen ett modernt, användarvänligt och
   automatiserat verktyg för att hantera sin verksamhet – från bokningar och
   kundrelationer till fakturering och rapportering.
   Systemet är byggt som en molntjänst där varje företag har sitt eget konto
   med separata kunder, priser och fakturor.
   Det kan enkelt anpassas, utökas och driftsättas oberoende av vald teknisk
   backend.
2. Syfte och mål
   DogPlanner är framtaget för att:
   Automatisera administrativa processer för hunddagis, pensionat och frisör.
   Minska manuell handpåläggning vid fakturering, betalningar och uppföljning.
   Ge tydlig överblick över bokningar, beläggning, intäkter och kunder.
   Förenkla kommunikationen mellan personal, ägare och administratör.
   Säkerställa att systemet följer svensk lag och GDPR.
   Systemet ska vara enkelt, pålitligt och skalbart – byggt för både små och
   större verksamheter.
3. Teknisk översikt
   DogPlanner är uppbyggt som en modulär webbapplikation med separata
   komponenter för varje huvuddel av verksamheten.
   Frontend byggs i Next.js + TypeScript och använder Tailwind CSS samt
   ShadCN/UI för ett enhetligt gränssnitt.
   Backend består av databas, autentisering, lagring och serverfunktioner för
   tunga uppgifter som PDF-generering och e-postutskick.
   Systemet är uppdelat i tre lager:
   Presentation (UI) – gränssnitt för användare, personal och
   administratörer.
   Applikationslogik – regler för bokningar, priser, abonnemang och
   fakturering.
   Datahantering – lagring, triggers och realtidsuppdateringar mellan
   användare.
   PDF-fakturor skapas server-side med stöd för QR-kod (Swish eller bankgiro).
4. Kärnfunktioner
   DogPlanner omfattar alla centrala delar för att driva en hundverksamhet
   effektivt:
   Kundregister – lagrar ägare, kontaktuppgifter och hundar.
   Bokningar och tjänster – dagisplatser, pensionatsnätter, frisörtider.
   Prisberäkning – stöd för storlek, säsong, helg, högtid och rabatter.
   Fakturering – automatisk generering av fakturaunderlag och PDF-fakturor.
   Realtid och loggning – uppdateringar mellan personal och administratörer.
   GDPR-säkerhet – data isoleras per företag med tydliga åtkomstregler.
5. Systemarkitektur
   5.1 Frontend
   Byggd i Next.js + TypeScript.
   Tailwind CSS för design, ShadCN/UI för komponentbibliotek.
   Realtidsuppdatering av data (bokningar, fakturastatus).
   Responsivt för desktop, surfplatta och mobil.
   5.2 Backend
   Hanterar autentisering, datalagring, affärslogik och fakturagenerering.
   Triggers och schemalagda funktioner används för att automatiskt:
   Sätta rätt företags-ID vid skapande av data.
   Uppdatera totalpris när prislistor ändras.
   Räkna ut fakturarader (antal × enhetspris).
   5.3 Lagring och säkerhet
   Data lagras per organisation (företag).
   Rättigheter styrs via roller (admin / personal / kund).
   Fakturor och kundinformation följer GDPR.
   PDF-filer kan raderas eller arkiveras automatiskt efter viss tid.
6. Kodstruktur
   Strukturen gör det enkelt att underhålla och utöka projektet med nya moduler,
   exempelvis bokningskalender, statistik eller kundportal.
7. Triggermekanism och automatisering
   Systemet använder triggers och automatiserade processer för att hålla datan konsekvent:
   Organisation och användare kopplas automatiskt till nya poster.
   Bokningar uppdateras dynamiskt vid prisändringar eller statusändringar.
   Fakturarader beräknas direkt när kvantitet eller enhetspris ändras.
   Abonnemang förlängs eller avslutas baserat på giltighetsintervall.
   Bokningsformulär – Ny bokning eller incheckning
   Ett enhetligt formulär för administratörer att skapa eller uppdatera bokningar:
   Hund: välj befintlig hund eller skapa ny (inklusive ägare).
   Ägare: kopplas automatiskt via vald hund, men kan justeras.
   Period: från- och till-datum (standardutcheckning kl 12).
   Rum: dropdown som endast visar lediga rum baserat på hundens storlek och datum.
   Otillgängliga rum markeras röda.
   Tilläggstjänster: checkboxes eller multivälj (bad, kloklipp, promenad).
   Prisberäkning: knapp “Beräkna pris” visar sammanfattning, t.ex.
   “Beräknat pris: 2100 kr inkl. tillval och moms.”
   Rabatter:
   Stående rabatter kopplade till kund.
   Tillfälliga rabatter kan läggas manuellt vid bokning.
   Spara bokning: skapar bokning och genererar underlag för faktura.
8. UI-komponenter och designprinciper
   DogPlanner använder ett enhetligt UI-system byggt på ShadCN-komponenter:
   knappar, modaler, tabeller, formulär och kort.
   Designen följer företagets färgprofil med lugna blå, gröna, orange och grå
   toner. Färgkodning används även för statusar
   (ex. betald = grön, skickad = blå).
   Systemet prioriterar:
   Tydlighet – all relevant information syns direkt.
   Effektivitet – minimalt klickande vid dagliga uppgifter.
   Tillgänglighet – fungerar på alla skärmar och enheter.
9. Säkerhets- och GDPR-principer
   Varje företag har egen databasdel med isolerad åtkomst.
   Användare loggar in med säkra sessioner och ser endast sin organisation.
   Fakturor, kundregister och historik lagras enligt GDPR.
   Systemet erbjuder automatisk gallring och anonymisering av äldre data.
10. Sammanfattning
    Del 1 beskriver DogPlanners arkitektur och grundstruktur – ett skalbart, modernt och användarvänligt system byggt för svenska hundverksamheter.
    Designen är modulär, vilket gör att varje del – hunddagis, pensionat, frisör, fakturering och prissättning – kan byggas, testas och driftsättas oberoende men ändå samverka sömlöst.

🧩 DogPlanner – Moduler och Funktioner

1. Översikt
   DogPlanner består av flera kärnmoduler som tillsammans bildar ett heltäckande system för hundverksamheter:
   Hunddagis
   Hundpensionat
   Hundfrisör
   Hundrehab (under utveckling)
   Fakturering
   Prissättning
   Administrations- och felsökningsverktyg
   Varje modul är byggd med samma struktur och logik för enkel återanvändning och vidareutveckling.

2. Hunddagis
   2.1 Syfte
   Hunddagismodulen hanterar dagliga bokningar, abonnemang och kundrelationer.
   Den används främst för löpande placeringar där kunder abonnerar på heltids- eller deltidsplatser.

   2.2 Funktioner
   Bokningar per dag – varje bokning motsvarar en heldag eller deltid (2 eller 3).
   Deltid 2: två dagar per vecka.
   Deltid 3: tre dagar per vecka.
   Heltid: fem dagar per vecka.
   Hunddagiset är öppet vardagar (mån–fre).
   Dagshundar – kan boka i mån av plats utan fast veckodag.
   Abonnemangslogik – månatliga abonnemang med valfri längd.
   Fakturering – månadsvis baserad på abonnemang och tillägg.
   Rabatter – stöd för flerhundsrabatt och kundunika prislistor.
   Felsökningslogg – sparar händelser och ändringar.
   2.3 Logik
   Bokningar kopplas till hund och ägare via ID.
   Systemet summerar antal dagar per månad och genererar fakturaunderlag.
   Pris baseras på hundens storlek och abonnemangstyp.
   Personal kan lämna ekonomikommentarer direkt i profilen.

3. Hundpensionat
   3.1 Syfte
   Hanterar bokningar över flera dygn med automatisk prisberäkning utifrån säsong, helg och högtid.
   3.2 Funktioner
   Bokning per natt med start- och slutdatum.
   Dynamisk prissättning beroende på datum, hundstorlek och tillägg.
   Säsongshantering (högsäsong, storhelger, lov).
   Rabatter för långvistelse eller flera hundar.
   Fakturering vid utcheckning eller samlad per månad.
   3.3 Prislogik
   Priser definieras per organisation och kan delas upp i:
   Vardagspris: standard per natt.
   Helgpris: separat för helger.
   Högtidstillägg: fast eller procentuellt påslag.
   Högsäsongstillägg: styrt av datumintervall.
   Rabatter kan vara procent eller fast belopp, och tillämpas på billigaste hunden.
4. Hundfrisör
   4.1 Syfte
   Frisörmodulen hanterar tidsbokningar för behandlingar och tjänster (bad, klipp, kloklipp m.m.).
   4.2 Funktioner
   Bokning per tjänst – varje rad motsvarar en behandling.
   Direktfakturering – faktura skapas vid slutförd behandling.
   Pakettjänster – kombinerade behandlingar till paketpris.
   Prislistor per företag.
   4.3 Flöde
   När behandlingen markeras som klar skapas en fakturarad automatiskt.
   Personal kan lägga till tillägg eller kommentarer före betalning.
5. Fakturering
   5.1 Syfte
   Samlar in underlag från alla moduler och genererar kompletta fakturor med kunduppgifter, belopp, moms och betalningsinformation.
   5.2 Funktioner
   Hämtar fakturor kopplade till ägare och organisation.
   Skapar nya fakturor baserat på underlag.
   Genererar PDF-fakturor med logotyp och QR-kod.
   Realtidsuppdateringar vid ändringar.
   Färgkodade statusar:
   Utkast: grå
   Skickad: blå
   Betald: grön
   Makulerad: röd
   5.3 Fakturaunderlag
   Endast följande skickas till fakturering:
   Aktiva abonnemang
   Tilläggstjänster
   Merförsäljning
   Personalens kommentarer visas i ekonomimodulen för manuell justering.
6. Prissättning
   6.1 Syfte
   Låter varje organisation hantera egen prislista, anpassad för olika tjänster och säsonger.
   6.2 Funktioner
   Separata prisnivåer för dagis, pensionat och frisör.
   Prisjustering efter hundens mankhöjd.
   Hantering av moms, tillägg och rabatter.
   Möjlighet till kundunika prislistor.
   6.3 Prisberäkning
   Systemet beräknar totalpris utifrån:
   Grundpris
   Storleksjustering (liten / mellan / stor hund)
   Antal dagar/nätter
   Tillägg (helg, högtid, säsong)
   Rabatter
   Moms
   Resultatet presenteras med tydlig uppdelning av varje delmoment.
7. Realtid, loggning och felsökning
   Realtidslyssning för att visa uppdateringar utan omladdning.
   Felsökningslogg finns i varje modul med tidsstämpel, händelsetyp och detaljer.
   Loggar visas direkt i gränssnittet under “Visa felsökningslogg”.
8. Design och användarupplevelse
   Systemet följer en konsekvent visuell profil:
   Mjuka färgtoner (grön, blå, orange, grå).
   Rundade hörn, tydliga knappar, minimalistiska kort.
   Färgkodning för statusar och filter.
   Modulär layout med tabs och tabeller.
   Användaren ser alltid:
   Vad som är aktivt (bokning, faktura, kund).
   Vad som återstår (obetalda fakturor, ej bokade tjänster).
9. Sammanfattning
   Varje modul i DogPlanner följer samma grundstruktur men har anpassad logik:
   Hunddagis: daglig hantering & månadsfakturering.
   Hundpensionat: nattlogik & säsongsvariationer.
   Hundfrisör: per behandling & direktbetalning.
   Fakturor och priser utgör kärnan som binder ihop alla verksamhetsdelar.
   Tillsammans bildar modulerna ett komplett ekosystem för administration, kundhantering och ekonomi.
   💸 DogPlanner – Ekonomi, Statistik och Vidareutveckling
10. Ekonomimodulens syfte
    Ekonomidelen i DogPlanner är kärnan i systemets affärsflöde.
    Den ansvarar för att:
    Generera fakturor automatiskt utifrån bokningar, abonnemang och tillägg.
    Visa intäktsstatistik per månad, kund och tjänst.
    Exportera ekonomidata för bokföring och uppföljning.
    Säkerställa spårbarhet mellan verksamhetsdelar (kund → hund → bokning → faktura).
11. Fakturaunderlag
    2.1 Datainsamling
    Alla fakturor bygger på insamlade poster från systemet:
    Aktiva abonnemang (månatliga eller löpande).
    Bokningar (dagis, pensionat, frisör).
    Tilläggstjänster (bad, kloklipp, promenad m.m.).
    Rabatter och avdrag kopplade till kund eller bokning.
    2.2 Automatisk generering
    Fakturor skapas när:
    En bokning skapas.
    En abonnemangsperiod uppnås.
    Månadsfakturering körs enligt schema.
    2.3 Fakturastruktur
    Varje faktura består av:
    Fakturahuvud – kund, organisation, datum, totalbelopp.
    Fakturarader – tjänst, antal, pris, rabatt, moms.
    Betalningsinformation – Swish, bankgiro, referensnummer (kopplat till företagets egna konto).
    QR-kod – valfritt, för snabb betalning.
    2.4 Kommentarer till ekonomi
    Personal kan lämna kommentarer som syns för ekonomiavdelningen, t.ex.:
    “Avslutas 10/10 – korrigera faktura.”
    “Avdrag 500 kr nästa månad p.g.a. uppehåll.”
    Kommentarerna följer med i fakturaflödet och ökar spårbarheten.
12. Fakturering och betalningsflöde
    3.1 Statushantering
    Fakturor har tydliga statusnivåer:
    Utkast – skapad men ej skickad.
    Skickad – utsänd till kund.
    Betald – markerad som slutförd.
    Makulerad – annullerad eller ersatt.
    3.2 Realtidsuppdatering
    Vid betalning uppdateras status direkt i systemet, vilket ger:
    Snabb återkoppling till kund.
    Korrekt statistik i realtid.
    Minskad manuell hantering.
    3.3 Påminnelser
    Systemet stödjer manuella betalningspåminnelser:
    Första påminnelse efter 10 dagar.
    Andra påminnelse efter 20 dagar.
    Möjlighet att lägga till avgift eller ränta.
13. Ekonomiska rapporter
    4.1 Månatliga rapporter
    Varje månad sammanställs:
    Totala intäkter.
    Antal fakturor och snittbelopp.
    Andel obetalda fakturor.
    Fördelning per tjänstetyp (dagis, pensionat, frisör).
    4.2 Kundanalyser
    Administratören kan filtrera rapporter per kund:
    Historiska bokningar.
    Fakturerade belopp.
    Rabattnivåer.
    Betalningshistorik.
    4.3 Export och integration
    Rapporter kan exporteras till:
    CSV / Excel
    Bokföringssystem (Fortnox, Bokio, Visma via API)
    PDF för arkivering
    Svensk lagstiftning och GDPR följs alltid.
14. Statistik och nyckeltal
    5.1 Översikt
    Statistikmodulen visar:
    Intäkter per månad, kvartal och år.
    Beläggningsgrad per dag och rum.
    Antal bokningar per tjänst.
    Genomsnittlig intäkt per kund.
    5.2 Visualisering
    Dashboards visar data i realtid med:
    Linjediagram för intäkter.
    Cirkeldiagram för tjänstefördelning.
    Stapeldiagram för kundaktivitet.
    5.3 Prognoser
    Prognoser beräknas utifrån:
    Aktiva abonnemang.
    Inkommande bokningar.
    Historiska trender.
15. Automatisk analys och notifieringar
    Systemet kan identifiera mönster och varna vid avvikelser, t.ex.:
    “Tre kunder har inte betalat inom 10 dagar.”
    “Beläggningen nästa vecka är under 60 %.”
    “Fem kunder har abonnemang som löper ut denna månad.”
    Notifieringar kan visas i adminpanelen eller skickas via e-post.
16. Integrationer och AI-funktioner
    7.1 Integrationer
    E-postutskick av fakturor och kvitton.
    SMS-notiser till kunder.
    Automatiska betalningspåminnelser via e-post.
    7.2 AI-funktioner
    Automatisk klassificering av bokningar (ex. helg, säsong).
    Prediktion av beläggning baserat på historik.
17. Säkerhet och efterlevnad
    All ekonomidata loggas och versionshanteras.
    Fakturor och betalningar spåras via unika ID:n.
    Systemet följer alltid svensk bokföringslag och GDPR.
    DogPlanner tar inte ansvar för kunders obetalda fakturor – varje företag ansvarar för sina egna betalflöden.
    Exportfunktion finns för revision eller ekonomigranskning.
18. Sammanfattning
    Ekonomimodulen i DogPlanner ger full kontroll över intäkter, fakturor och kunddata.
    Med automatisk fakturering, rapporter och integrationer kan verksamheten växa utan extra administration.
    DogPlanner är inte bara ett verktyg – det är ett komplett ekonomiskt nav för hela hundverksamheten.
    🐾 DogPlanner – UI Design och Layoutspecifikation
    DogPlanner är byggt med en tydlig, professionell och lugn layout.
    Varje komponent ska följa samma proportioner, marginaler, färger och typografi.
    Designen ska kännas stabil, enkel och förtroendeingivande – i linje med modern nordisk SaaS-design.

    🎨 Färg och formspråk
    Primärfärg: grön #2C7A4C
    Sekundära färger:
    Ljusgrön #E6F4EA – hover/bakgrundstoner
    Vit #FFFFFF – kort, tabeller, modaler
    Ljusgrå #F5F5F5 – bakgrund
    Textfärg #333333
    Fel #D9534F
    Länk/neutralt #3B82F6
    Alla kort, knappar och tabeller har rundade hörn (8–12 px) och mjuk skugga (0 4 10 rgba(0, 0, 0, 0.05)).

    ✍️ Typografi
    Font: Inter (fallback Roboto eller Segoe UI).
    H1 – 32 px, bold, #2C7A4C
    H2 – 24 px, semibold, #2C7A4C
    H3 – 18 px, medium, #2C7A4C
    Brödtext – 16 px, #333333
    Tabellrubriker – 14 px, semibold
    Knappar/etiketter – 15 px, semibold, vit text på grön bakgrund
    Linjehöjd 1.6, vänsterställd text.
    Hero-rubriker (<h1>) är centrerade och vita (#FFF) över bild eller grön gradient med textskugga (0 2 4 rgba(0,0,0,0.25)).

    🧱 Struktur och layout
    12-kolumners rutnät (maxbredd 1200 px).
    Sidmarginal 24 px, vertikal spacing 32 px.
    Bakgrund #FDFDFD.
    Header:
    Grön (#2C7A4C), vit text, logotyp vänster (50–60 px hög).
    Logotypen länkar till dashboard.
    Knapp höger (“Logga in/ut”), vit text, 6 px rundning, hover ljusare.
    Main-content:
    Rubrik, filterfält, huvudinnehåll (tabell eller kort).
    Bakgrund vit, padding 32 px.
    Footer:
    Ljusgrå (#F5F5F5), centrerad text.

    🏠 Startsida
    Hero-sektion med grön gradient och tonad bakgrundsbild.
    Rubrik 36 px, vit, bold
    Underrubrik 18 px, vit, line-height 1.6
    Under hero: vita kort för moduler (hunddagis, pensionat, frisör m.fl.)
    Bakgrund #FFF, rundning 12 px, padding 24 px
    Titel 20 px grön, text 16 px grå
    Knapp grön med vit text, hover ljusgrön
    Layout: 3 kolumner desktop, 2 surfplatta, 1 mobil.

    🐕 Hunddagis – layoutspecifikation
    Två huvuddelar: Hero-sektion och datasektion.
    Hero-sektion:
    Grön gradient (background: linear-gradient(180deg, rgba(44,122,76,0.9), rgba(44,122,76,0.8))) över bakgrundsbild med opacitet 0.85–0.9.
    Padding 64 px vertikalt, 32 px horisontellt.
    Rubrik “Hunddagis” vit 36 px, centrerad med textskugga.
    Underrubrik 18 px vit med 0.9 opacitet.
    Statistikrutor:
    Fem per rad (desktop), 3 på surfplatta, 2 mobil.
    Bakgrund rgba(255,255,255,0.15), rundning 12 px, padding 20×28 px.
    Text vit, centrerad; siffra 28 px bold, beskrivning 15 px semibold.
    Knappar under rutorna:
    “PDF-export” grå (#4B5563), vit text.
    “Ladda om” vit med grön kant (#2C7A4C).
    Höjd 44 px, rundning 6 px, padding 0–20 px.

    Datasektion:
    Vit bakgrund, centrerat innehåll.
    Filterfält överst (400 px brett, höjd 40 px).
    Dropdowns 220 px bred, vit bakgrund, grå ram (#D1D5DB), fokus grön ram.
    Knappar för “Kolumner”, “Exportera PDF”, “Ny hund” i rad (12 px mellanrum).
    Kolumner: vit med grön kant.
    Exportera PDF: grå.
    Ny hund: grön primärknapp.
    Tabell:
    Vit bakgrund, rundade hörn 8 px.
    Rubrikrad #2C7A4C, vit text, höjd 44 px.
    Växlande radrutor (vit / #F9FAFB), hover #F3F4F6.
    Ingen linje mellan rader, vänsterställd text.
    Tomt läge: “Inga hundar hittades för vald månad.” ljusgrå (#9CA3AF).

    🧩 Kolumnväljare
    Knapp “Kolumner” öppnar dropdown med vit bakgrund, rundning 10 px, skugga (0 2 8 rgba(0,0,0,0.1)).
    Bredd 280 px, maxhöjd 420 px, padding 12 px.
    Checkboxar grön #2C7A4C markerad, grå ram #D1D5DB omarkerad.
    Text 15 px, #111827, radavstånd 8 px.
    Hover #F3F9F5.
    Stänger inte vid markering – användaren kan välja flera kolumner innan stängning.
    🧾 Statistikpanel (hundpensionat)
    Översta delen har grön halvtransparent gradient (#2C7A4C 85 %).
    Rubrik 28 px vit, bold.
    Boxar 160×100 px, rundade hörn 12 px, bakgrund rgba(255,255,255,0.15).
    Text centrerad 20 px vit.
    Hover ljusare bakgrund.

    🐶 Formulär
    Vit bakgrund, centrerad layout.
    Fältrubrik 15 px, grön (#2C7A4C), bold.
    Input vit bakgrund, grå ram (#D1D5DB), rundning 6 px, fokus grön kant.
    Checkboxar fyrkantiga med grön bock.
    Knappar nedtill:
    “Avbryt” vit med grön kant.
    “Spara” grön med vit text.
    Mellanrum 12 px.
    Sektioner som “Övrigt hund” ska ha versaler, bold #2C7A4C och 20 px toppmarginal.
    🔐 Inloggning
    Kort centrerat vertikalt.
    Vit bakgrund, rundning 12 px, padding 32 px.
    Skugga 0 4 10 rgba(0,0,0,0.1).
    Rubrik 24 px grön, bold.
    Knapp “Logga in” grön med vit text.
    Felmeddelande röd 14 px.
    Länk “Skapa konto” grön, hover understruken.
    📱 Responsivitet
    Mobil – komponenter vertikalt, knappar två per rad.
    Surfplatta – två kolumner.
    Desktop – full layout.
    Textstorlek justeras proportionellt (rubriker –4 px, brödtext –2 px).
    🧾 PDF-export
    PDF-er följer samma stil: grön rubrik, svart text, vit bakgrund.
    Rubriker 18 px bold, text 14 px, mellanrum 12 px.

    🌿 Sammanfattning
    DogPlanner har en lugn, harmonisk och effektiv design som kombinerar naturlig enkelhet med teknisk precision.
    Gränssnittet är byggt för verkliga verksamheter – med fokus på struktur, tydlighet och varmt uttryck.
    Denna stilguide ska alltid följas för att säkerställa konsekvent design och enkel vidareutveckling.

🧩 Företagsstruktur och Datamodell
Texten skulle integreras så här (redigerad och lätt anpassad till README-formatet, utan att förlora något av ditt innehåll):
5.4 Företagets roll och datamodell
Företagssidan är kärnan i DogPlanner – alla kunder, hundar, abonnemang och fakturor knyts till ett specifikt företag via org_id.
Detta säkerställer isolerad datahantering mellan olika organisationer.
Koppling mellan verksamheter
Alla delar (hunddagis, pensionat, frisör osv.) är kopplade till samma företag via org_id.
En kund och hund hör alltid till samma företag, oavsett vilken verksamhet de använder.
Exempel: en hund kan ha både ett dagisabonnemang och en pensionatsbokning under samma företagskonto.
Förbättrad struktur
För att särskilja verksamhetsgrenar rekommenderas en tabell branches, som knyter samman flera enheter inom samma företag:
Fält Typ Beskrivning
id UUID Unikt branch-ID
org_id UUID Referens till företag
name text Namn på verksamheten
type text Typ (t.ex. dagis, pensionat, frisör)
Fakturor, bokningar och prislistor kan därefter referera till branch_id i stället för att filtrera via namnsträngar.
Fördelar
Robust filtrering: WHERE invoices.branch_id = X
Namnändringar påverkar inte datalänkar
Enklare hantering av företag med flera verksamheter
Tekniska rekommendationer
Foreign keys: använd konsekvent singularform, t.ex. dog_id, owner_id, branch_id.
Org-ID: alla tabeller med företagsdata ska innehålla org_id och sättas via trigger.
Triggers: om branches saknar org_id, ska den sättas med NEW.org_id := (SELECT org_id FROM dogs WHERE id = NEW.dog_id).
Autentisering
Frontenden ska inte sätta org_id = user.id.
Hämta organisationens ID via en profil (t.ex. profiles-tabell med user_id, org_id, role) och använd currentOrgId från AuthContext.
Detta möjliggör flera användare per företag och rättvis hantering av behörigheter.
Framtidssäkring
Om flera användare ska kunna tillhöra samma organisation, inför tabellen user_org_roles med user_id, org_id och role.
Detta öppnar för multi-tenant-stöd och enklare rollstyrning.
Datakonsistens
Säkerställ att dogs, subscriptions och abonnemang synkas för att undvika dubbellagring.
Använd vyer eller funktioner för att hämta aktivt abonnemang.
Markera underlag som fakturerade för att undvika dubbeldebitering.
Slutsats
Organisationen är navet i DogPlanner.
Alla entiteter (hunddagis, pensionat, frisör, prislistor, fakturor) ska knytas till företaget via org_id eller branch_id.
Detta stärker skalbarhet, säkerhet och multi-tenant-isolering.
All hantering ska ske i enlighet med svensk lag och GDPR.
