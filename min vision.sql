uppdaterad 2025-11-13

Struktur för företagskunder

När man kommer in på vår första sida så ska man komma in på den säljande ”skapa konto” sidan.
Har man redan ett konto så trycker man uppe i högra hörnet för att komma in på sitt konto.
Har man inget konto så ska man trycka på ”skapa abonnemang” eller läs mer om 2månader gratis. Har man ett konto och har loggat in så kommer man in på sin Dashboard
Här kan man välja om man vill klicka sig vidare på sitt hunddagis, hundpensionat, hundfrisör eller logga in ytterligare på sitt admin konto där man kan se mer detaljerad information. Klickar man sig in på mitt hunddagis så ska sidan med hunddagisets redan existerande hundar synas. Man ska kunna lägga till en ny hund och redigera en befintlig.

Det ska också finnas en flik för ”intresseanmälningar”.Och en flik för ”dagen schema” där ska de finnas:🏡 Hunddagis
• Dagens schema / promenadlistor
– En lista på vilka hundar som ska gå ”idag” och vilken i personalen som går med (hundarna delas in i grupper baserat på vilket rum dom sitter i) vilka tider ( en ruta där personalen kan skriva i förhand) Det ska vara en simpel lista som man kan skriva i förhand. Det enda som behöver synas är egentligen vilka hundar som går den dagen och en ruta för förmiddagspromenad och en för eftermiddagspromenad. I rutorna ska man kunna skriva i ett namn förhand på personalen som har ansvar för gruppen. 
Det ska också finnas en ruta där personalen kan anteckna saker som:
• Hundar som kommer sent / går tidigt
• Frånvarande hundar
• Hundar som behöver extra tillsyn
(t.ex. medicin, särskilt beteende, ny hund, rehab)
• Anteckningar från dagen
– små noteringar om hur hundarna mått, bajs/mat-status, lek, vila.
• Händelser att rapportera till ägare
– kan sammanställas automatiskt i dagrapport.Detta ska spara automatiskt av systemet två månader bakåt sedan raderas det. Om man istället klickat sig in på hundpensionat ifrån dashboard så ska man komma in på pensionatets sida. Det första man ser här är en överblick över sitt hundpensionat. ( • In- och utcheckningar idag
– tider, kontaktuppgifter, ev. betalningsstatus.
• Antal lediga platser (status)
– bra både för internt och framtida bokning.
• Hundar på plats med datum för in/ut
• Mediciner / särskilda behov
• Aktiviteter under dagen
– promenader, rastning, träning, lek.
)Man ska också kunna söka på en hund eller ägare för att få upp dens profil.Man ska också kunna se dagens utcheckning och incheckningar. Om de hundar som ska checka ut ifrån pensionatet nästkommande dag så ska deras tilläggstjänster synas. Det är alltså dags att bada klippa klor eller vad som nu lagt till så de blir gjort dagen innan så hundarna är fräscha när dom checkar ut dagen efter. Klickar man istället sig in på hundfrisör så ska man få upp en lista dagens bokningar, ✂️ Hundtrim / Hundfrisör
• Bokningar för dagen (schema)
– hund, ras, behandlingstyp, beräknad tid.
• Journal / historik per hund
– senast klippt, vilken maskin/skär som användes, stil, önskemål.
• Kundnotiser
– “ägaren vill att öronen ska trimmas extra”, “hund rädd för hårtork”.
• Materialstatus
– t.ex. påminnelse om rengöring av maskiner, schampo-slut osv.

Om man istället trycker på fliken för admin så ska man komma till ytterligare en vallista:

- Faktura Här kan man se alla bla se fakturaunderlag, öppna och stängda fakturor och om personalen har skrivit viktiga anteckningar på specifika hundar i kommentarsfältet på deras profil ” till ekonomi” 
- Mitt abonnemangHär ska man kunna ändra / pausa / ta bort sitt abonnemang för DogPlanner.
  PriserHär ska man kunna fylla i sitt företagspriser på abonnemang, datum, tilläggstjänster, rabatter osv. 
  HundrumHär kan man fylla i vilka rum man har, vad rummen ska heta och vilka kvadratmeter rummet är så man sen kan räkna ut ytan för ett specifikt rum och specifika hundarSidor som blir sparat ifrån företagssidan där företagen loggar in.
  En sida där pensionatskunder kan logga in på deras profil - en sida där nya kunder kan ansöka om plats till specifikt pensionat
  En sida där personer kan ansöka om att bli dagskunder kan lämna in sin ansökan

Hundpensionat – struktur, innehåll och flödenOBS! Notera att denna fil kan innehålla tablets som inte är korrekt med supabase. Ta därför bara kopplingsnamn ifrån Supabase och inte namnen och kopplingar ifrån denna fil då dom kan ha ändats något nu när vi byggt.Nu måste du tänka smart gällande hemsidan. Se över min supabase struktur och hur jag skulle kunna bygga upp hundpensionat på bästa sätt utifrån de jag skickar nu. Sidan ska vara snygg och användarvänlig. Den ska vara smidig och enkel att hitta i utan att kännas stökig. Tydlig struktur och flikar. Se över resterande hemsida/uppbyggnad för att se samspelet mellan de olika sidorna. Det är viktigt att det blir rätt ifrån början.
Se alla supabase kopplingar och triggers i schema.sql 

1. Översikt
   Mål: En personlig sida kopplad till varje ansökan, där all hund- och ägarinformation samlas och följer bokningen från intresseanmälan till in-/utcheckning och fakturering.
   Resultat: Rätt pris automatiskt (storlek + säsong/helg/högtid), tydlig beläggningsöversikt, smidig hantering för personal och enkel upplevelse för hundägaren.

2. Hundens profil (kopplad till ansökan)
   Obligatoriskt:
   Hundens namn, ras, födelsedatum (ålder räknas automatiskt)
   Mankhöjd (cm) → kategoriserar automatiskt:
   Liten: 0–35 cm
   Mellan: 36–55 cm
   Stor: 55+ cm
   Allergier/intoleranser
   Beteende: biter sönder saker? kan vara med andra hundar?
   Tidigare vistelser hos pensionatet (ja/nej + datum)
   Mat & utfodring:
   Vad hunden äter (egen/pensionatets foder)
   Mängd per dag och per utfodringstillfälle
   Antal utfodringar per dag
   Övriga instruktioner (t.ex. medicin, specialkost)
   Övrigt:
   Fria anteckningar (särskilda behov/övriga upplysningar)
   Möjlighet att ladda upp bild på hunden
   Vaccinationer:
   DHP (datum/senaste) sprutan håller i tre år, sen ska den tas om.
   PI – kennelhosta (datum/senaste), sprutan håller i ett år sen bör den tas om.
   Övrig information (kryssrutor):
   Hunden löper (vid aktuell period)
   Skott-/åskrädd:
   Får leka med hundkompisar under vistelsen:
   Ägaren godkänner publicering av foto på sociala medier.

3. Ägarens profil
   För- och efternamn
   Adress, postnummer, ort
   Telefon och e-post
   Kontaktperson 2: för- och efternamn samt telefonnummer
   (Stöd för flera hundar per ägare: sam- och flerhundsbokning i samma flöde.)

4. Bokning & beläggning (”hotell-upplägg”)
   Kalenderöversikt (månad/vecka/dag):
   En kalender som visar:
   Visa incheckade hundar per dag och rumsstatus (ledigt/upptaget)
   Färgkoder:
   Grön = inne
   Röd = checkar ut idag
   Gul = anländer idag
   Check-in/Check-out:
   Registrera exakt datum och tid för in- och utcheckning
   Systemet räknar antal debiterbara nätter/dagar automatiskt
   Tjänstepaket & tillval (betalas vid utcheckning):
   Öronrengöring
   Tandvård
   Tovutredning
   Spapaket (hundbad, kloklipp, öronrengöring)
   Hundbad (differentierade priser efter storlek)
   Tasstrim och kloklipp
   Löptillägg
   Extra mattillfälle
   Hämtning/lämning utanför receptionstid
   Valptillägg
   Rabatter/prisavdrag (styrt av regler som admin kan lägga till/ändra på hundägarens konto):Tex:
   Fler än två hundar → t.ex. 15 % rabatt
   Dagishund/stammis → t.ex. 20 % rabatt

5. Prislogik och säsonger
   Storlekskategorier från hundprofilens mankhöjd:Prislistor (som admin sätter/bestämmer):
   Grundpris per natt (liten/mellan/stor)
   Tillägg för högsäsong (valfria datumintervall)
   Tillägg för helger (lör–sön)
   Tillägg för högtider (t.ex. midsommar, jul, nyår)
   Beräkning vid bokning:
   Systemet hämtar hundens storlek → väljer rätt grundpris
   Matchar varje bokningsdatum mot säsong/helg/högtid
   Lägger på relevanta tillägg och rabatter
   Räknar fram totalpris
   Skapar fakturaunderlag (PDF eller skickas via länk/mejl)
   Betalningsflöde:
   Förskottsbetalning/handpenning för själva pensionatspriset
   Tillval/tjänster betalas vid utcheckning
   Betalningsstatus: Ej betald / Handpenning betald / Betald
   Påminnelser via mejl/SMS om betalning saknas

6. Admin & personalverktyg
   Dagslista (operativ vy):
   Dagens incheckningar, dagens utcheckningar, redan inne
   Förvarning inför morgondagens utcheckningar (planera bad/kloklipp i förväg)
   Utskriftsmall (A4 att sätta på dörren där hunden bor) man ska kunna trycka på specifik hund för att skriva ut en snygg A4 papper där man kan se information om hunden som är bra att känna till under hundens vistelse: Den ska vara kopplas till hundens profil och uppgifterna som ska synas är:
   Hundens namn, ålder
   Allergier, särskilda behov
   Matinformation (foder, mängd, antal mål, egen/pensionatets)
   In-/utcheckningsdatum
   Kan dela rum? Ja/nej (om flera hundar i samma rum → alla på samma A4)
   Beställda tilläggstjänster + bocklista för personal (kan kryssas av för hand)Kom ihåg att göra denna så snygg du bara kan. Den ska passa alla och vara med vit bakgrund så man inte behöver använda så mkt färg på skrivaren.
   Journalhistorik:
   Notiser/anteckningar från tidigare vistelser kopplade till hundprofilen
   Samtycken & GDPR:
   Vid bokningsförfrågan kryssar kunden i att personuppgifter lagras enligt integritetspolicyn
   Statistik & rapporter:
   Beläggning över tid
   Intäkter per period
   Mest använda tilläggstjänster

7. Intresseanmälan (en egen sida för kunden)
   Skapa konto (GDPR-samtycke) som blir kopplat till specifikt hundpensionat som är anslutna till våran hemsida
   Skapa hundprofil (namn, ras, födelsedatum, mankhöjd cm, vaccinationer, mat, allergier, beteende, bild, preferenser och samtycken)
   Välj datum (incheckning och utcheckning)
   Välj tillval/tjänster (kloklipp, bad, trimning, tasstrim, hämtning/lämning, valptillägg, m.m.)
   Pris visas (storlek + säsong/helg/högtid + ev. rabatter)
   Skicka ansökan → admin godkänner → fakturaunderlag skapas
   Handpenning/förskott betalas enligt inställningar

Rekommenderad navigering på webbplatsen
Startsida
Kort presentation (hunddagis & hundpensionat)
Primär CTA: Boka plats / Skicka intresseanmälan
Snabbinfo: “Så funkar det för hundägare” / “För dig som driver pensionat”
För hundägare (ska alltså vara helt separat ifrån hundpensionattsidan ifrån dashboard så kunderna kan komma in ifrån eget håll).
Registrera konto / logga in
Skapa/uppdatera hundprofil
Skicka intresseanmälan (kopplas till profil)
Se och hantera kommande bokningar
För pensionatsägare (admin)
Prislistor (storlek & säsong/helg/högtid) som dom ska kunna ändra själva beroende på vilka priser dom vill ha på just sitt företag
Datumintervall för hög-/lågsäsong + högtider
Kalender med bekräftade & väntande bokningar
Kan redigera automatisk prisberäkning & fakturaunderlag
Kundlistor, hundprofiler, journal & utskriftsmallar
För personal och admin
Kan se automatisk prisberäkning & fakturaunderlag
Kundlistor, hundprofiler, journal & utskriftsmallar
Kan se hund och ägarprofiler
Hantera ut och incheckningar
Hantera bokningar lägga till/ta bort / redigera
Systemdesign för DogPlanner Hundpensionat (Admin-gränssnitt)
Introduktion
Detta dokument beskriver ett detaljerat förslag på admin-gränssnittet för DogPlanner Hundpensionat. Systemet är avsett för personal och administratörer på ett hundpensionat, med fokus på att hantera bokningar, beläggning, fakturering och administration av priser och rum. Gränssnittet ska erbjuda tydliga vyer för kalender och beläggning, automatisk prisberäkning och fakturaunderlag, samt flexibla inställningar för att hantera prislistor, säsonger och kapacitet. Målet är att systemet ska vara lättanvänt, responsivt (mobilanpassat) och tydligt särskiljt från DogPlanners hunddagismodul i utseende, samtidigt som det behåller en enhetlig plattformsupplevelse.
Kalender och beläggning
Admin-gränssnittet innehåller en omfattande beläggningskalender som hjälper personalen att planera och överblicka alla in- och utcheckningar. Kalendern presenteras i flera vyer för olika tidsintervall, kompletterat med färgkodning och filtreringsalternativ:
Daglig översikt (Dagsvy)
Lista över incheckade hundar: Varje dag visar en lista med alla hundar som är incheckade det datumet. För varje hund framgår namn, ras/storlek, tilldelat rum och eventuella ankomst/avresetider.
Statusindikatorer: Hundar markeras med färgkoder baserat på status:
Grön markering – Hunden är incheckad (och stannar över natten, ingen ankomst/avresa just idag).
Blå markering – Hunden checkar in idag (ankommande gäst).
Orange markering – Hunden checkar ut idag (avresande gäst).
Åtgärder per hund: Personalen kan klicka på en hund i listan för att se detaljer (hundens profil, ägare, bokningsperiod) samt genomföra snabba åtgärder som att registrera incheckning vid ankomst eller utcheckningvid hämtning. Detta utgör en del av bokningsflödet med in-/utcheckning för att spåra när hunden fysiskt anländer/lämnar pensionatet.
Veckoöversikt (Veckovy)
Sammanfattning per dag: Veckovyn visar kolumner för varje dag i veckan med summerad information – till exempel antal hundar incheckade per dag, och beläggningsgrad per rum eller totalt.
Grafisk överblick: Under varje veckodag kan en liten stapel eller procent visas för att indikera beläggningsgraden (utnyttjad kapacitet) för den dagen. Detta ger en snabb uppfattning om vilka dagar som är fullbelagda eller har ledigt utrymme.
Navigering: Personalen kan enkelt bläddra vecka för vecka. Om en dag klickas öppnas antingen dagsvyn för det datumet eller en detaljerad tooltip med hundarnas namn och status den dagen.
Månadsöversikt (Månadsvy)
Kalenderformat: Månadsöversikten presenteras som en klassisk kalender med datumrutor. Varje datumruta innehåller en indikation på beläggningen:
Antal incheckade hundar den dagen (t.ex. “5 hundar”).
Möjligen en färg- eller ikonindikator om dagen är fullbokad (t.ex. röd bakgrund om ingen kapacitet finns kvar) eller delvis ledig (grön/grå om det finns plats).
Snabbinfo: Använder man muspekaren eller trycker på ett datum får man en snabbinfo-popup som listar hundarna det datumet och markerar vilka som anländer/avreser (en komprimerad version av dagsvyn).
Överblick av trender: Månadsvis vy hjälper administratören att se högbelagda perioder (t.ex. att helger eller sommarveckor är mer fulla) vilket underlättar planering och bemanning.
Färgkodning och status
Färgkoder används konsekvent i kalendern för att tydligt visa status på bokningar och hundar:
Varje hundpost i kalendern har en färgad etikett (eller bakgrund) enligt status (incheckad, checkar ut, checkar in, etc. enligt ovan).
Eventuellt används även färger för att markera särskilda typer av bokningar eller tillstånd, exempelvis om en hund behöver extra tillsyn (dock är huvudsyftet att markera in/ut).
Övergripande modul-färg: Hundpensionat-modulen kan ha en egen accentfärg (enligt DogPlanners designriktlinjer används exempelvis blå ton för pensionatet, medan hunddagis kanske är grön). Detta gör att alla sidor och komponenter i pensionatets admin-del har en blå accent/fokus (t.ex. markerade knappar, rubriklinjer), vilket särskiljer dem visuellt från hunddagisets gröna tema, samtidigt som designen i övrigt är enhetlig.
Filtrering per rum
Rumsvy: Administratören kan filtrera kalendern eller växla till en rumsperspektiv. I en sådan vy väljer man ett specifikt rum för att se beläggningen i just det rummet.
Per rum per dag: Dagsvyn kan exempelvis grupperas per rum – med underrubriker för varje rum och listade hundar under respektive. Detta låter personalen snabbt se vilka hundar som befinner sig i samma rum en viss dag.
Filterkontroll: Ett drop-down filter eller fliksystem i UI:t låter användaren välja “Alla rum” (standard) eller ett enskilt rum. Vid val av rum uppdateras kalendern/översikten för att enbart visa bokningar i det rummet. Detta är användbart om man t.ex. vill se om ett visst rum har plats för en extra hund en viss period, eller om man behöver planera rengöring/underhåll av just det rummet.
Översikt av rumskapacitet: I rumsvyn kan även rummets totala kapacitet (yta) och utnyttjad yta för valda datum framgå tydligt (t.ex. “Rum Solsken – 12 m²: 8 m² upptagna, 4 m² lediga”).
Rumskapacitet och utrymmesberäkning
En unik funktion är kopplingen till varje rums kapacitet i kvadratmeter, och automatisk beräkning av utrymmesbehov per hund enligt gällande regler:
Rumsdefinitioner: Varje rum har ett angivet ytmått i kvadratmeter (m²) som registreras i systemet. Exempel: “Rum Solsken – 12 m²”, “Rum Ängen – 8 m²” osv.
Hundens utrymmesbehov: Varje hundprofil innehåller hundens mankhöjd (höjd till skulderblad). Systemet beräknar minsta yta hunden behöver, baserat på Jordbruksverkets djurskyddsregler eller användarens egna angivna normer. Till exempel:
Hund < 25 cm mankhöjd kräver 2 m².
25–35 cm kräver 2 m² (samma som ovan kategori enligt standard).
36–45 cm kräver 2,5 m².
46–55 cm kräver 3,5 m².
56–65 cm kräver 4,5 m².
65 cm kräver 5,5 m².(Notera: Dessa värden kan anpassas i systemets inställningar om reglerna uppdateras.)
Beläggningskontroll: När en bokning registreras och en hund placeras i ett rum under ett visst datumintervall, summerar systemet automatiskt den totala ytan som upptas i rummet per dag av de inbokade hundarna. Om flera hundar delar ett rum samma dag adderas deras respektive behov:
T.ex. i ett rum på 12 m²: en hund på 50 cm (3,5 m²) + en hund på 40 cm (2,5 m²) innebär 6 m² upptagna; systemet visar att 6 m² av 12 m² används (50% beläggning) och att 6 m² återstår.
Kapacitetsvarningar: Om man försöker boka in fler eller större hundar än rummet tillåter (utifrån yta), varnar systemet administratören att kapaciteten överskrids. Detta förhindrar överbokning. Dessutom kan systemet ha en fast maxgräns på antal hundar per rum (t.ex. max 2 hundar samtidigt om man av praktiska skäl vill begränsa även om ytan räcker till fler).
Visuellt i kalendern: I dags- och veckovy kan beläggningen per rum visas som en mätare. Exempelvis en färgad stapel för varje rum som fylls proportionellt mot rummets m² när hundar läggs till. Om rummet är fullt (0 m² kvar) kan stapeln eller rutan markeras i rött eller med en varningstext “Fullt”.
Ledigt utrymme: Personal kan klicka på en dag och se en rumskarta eller lista som anger för varje rum: vilka hundar är där, hur många m² upptagna, och hur många m² lediga. Detta uppfyller kravet att systemet tydligt ska visa var det finns ledigt utrymme varje dag, vilket underlättar när nya förfrågningar kommer in – man ser direkt om ett rum har plats för ytterligare en liten/stor hund den dagen.
Fakturaunderlag och fakturering
Faktureringen i DogPlanner Hundpensionat automatiseras så långt som möjligt för att spara tid och minimera fel. Systemet räknar ut priset för varje bokning baserat på definierade prisregler och genererar ett komplett fakturaunderlag som kan justeras av admin vid behov och sedan exporteras till PDF för kund.
Automatisk prisberäkning
När en bokning registreras eller en faktura ska skapas, beräknar systemet kostnaden utifrån flera parametrar:
Hundens storlek: Varje hund tillhör en storlekskategori (baserat på mankhöjd eller vikt, enligt verksamhetens indelning, t.ex. Liten, Mellan, Stor). Varje kategori har ett grundpris per natt. Exempel: liten hund 300 kr/natt, mellan 350 kr, stor 400 kr (dessa priser läggs in av admin i prislistan).
Helger: Nätter som infaller över en helg kan ha ett pristillägg. Detta kan vara antingen en fast summa per natt eller en procentuell ökning. T.ex. +50 kr per natt för fredag–söndag, eller +20% på grundpriset för helgnätter. Admin kan definiera hur helgtillägg ska beräknas.
Högtider: För specifika helgdagar eller högtidsperioder (t.ex. jul, nyår, midsommar) kan särskilda priser gälla. Systemet låter admin markera vissa datum som högtid och ange ett högtidstillägg (eller en separat prislista för dessa dagar). T.ex. dubbelt nattpris på storhelger, eller en extra engångsavgift för vistelser över storhelg.
Högsäsong / Lågsäsong: Admin kan definiera datumintervall som utgör högsäsong (t.ex. sommarmånader, populära semesterveckor) respektive lågsäsong. För högsäsong kan ett generellt pristillägg appliceras (eller särskilda högsäsongspriser per natt). Lågsäsong kan omvänt ha rabatterade priser. Systemet identifierar om bokningens datum ligger inom hög- eller lågsäsong och justerar nattpriset därefter.
Rabatter: Eventuella rabatter beaktas automatiskt eller kan läggas till manuellt:
Lojalitetsrabatt/stamkund: om kunden (hunden/ägaren) uppfyller vissa kriterier (t.ex. x antal vistelser tidigare) kan en rabattprocent dras av.
Längre vistelse: admin kan konfigurera rabattsteg, t.ex. vistelser längre än 10 nätter ger 10% rabatt.
Flerhundsrabatt: om en ägare har flera hundar inbokade under samma period (delar rum eller ej) kan en viss rabatt ges på den totala summan eller på den andra hundens pris.
Dessa regler kan vara inlagda i systemet och appliceras automatiskt, men admin ges också möjlighet att manuellt justera rabatter på en specifik faktura innan den slutförs.
Tillvalstjänster: Utöver logi kan extra tjänster bokas till för en vistelse, som t.ex. kloklippning, bad, extra rastning, medicinering etc. Varje tillval har ett fördefinierat pris (eller timpris) i systemet. När personalen lägger till ett tillval på en bokning läggs motsvarande kostnad till fakturaunderlaget.
Sammanställning per bokning: Systemet summerar kostnaden för varje natt inom bokningens datumintervall. Om t.ex. en bokning sträcker sig över både vardagar och helger kommer systemet att:
Ta grundpriset per natt enligt hundens storlek för respektive natt.
Bygga på med eventuellt helgtillägg för nätter som är fre/lör/sön.
Bygga på med eventuella högtidstillägg (om en natt är markerad högtid).
Applicera högsäsongstillägg för nätter inom definierad högsäsong.
Efter att nattkostnaderna är sammanställda, dra av eventuella rabatter på totalsumman enligt ovan.
Lägga till kostnader för samtliga tillvalstjänster som valts för den vistelsen.
Transparent beräkning: I gränssnittet kan admin klicka för att “Visa prisberäkning” och se en uppdelning, t.ex. en liten tabell över hur priset kalkylerats (antal nätter _ grundpris, + helgtillägg X nätter, + högtidstillägg, - rabatt, + tillval etc.). Detta är användbart både internt och om kunden undrar över priset.
Fakturagenerering och PDF-export
Skapa fakturaunderlag: När en har gjort sin bokningsförfrågan och personalen har bekräftat den så skapar systemet automatiskt en faktura som skickas till kunden på bokningsavgiften (antal dagar, eventuella påslag och/eller rabatter) och skickar till kunden. Kunden betalar fakturan i förskott om hundpensionatet kräver detta. Tjänster så som kloklippp, bad osv betalas när kunden hämtar sin butik på utcheckningsdagen i pensionatets egna kassalösningar. Hundpensionatet kan också välja att skicka ett fakturaunderlag till kunden men att dom betalar hela summan när dom hämtar ut sin hund på utckeckningsdagen.Fakturaunderlaget är redigerbart innan slutlig faktura fastställs – admin kan justera eller lägga till rader (t.ex. lägga på en kostnad för skada om något förstörts, eller ge en extra rabatt goodwill).
Fakturasida i admin: Det finns en dedikerad vy för fakturaunderlaget. Där listas alla prisposter:
Logikostnad (med angivet antal nätter á pris per natt och total).
Varje tillvalstjänst som separata rader (mängd _ pris).
Handpenning (förskottsbetalning) om sådan tas – se nedan.
Moms kan specificeras per rad eller som total, beroende på inställning (om företaget är momsregistrerat och vill visa moms separat).
Totalbeloppet för fakturan.
Handpenninghantering: Om hundpensionatet vill använda sig utav handpenning (att kunden betalar en del i förskott vid bokning):
I bokningen kan man ange handpenningens belopp eller procent. Detta belopp markeras i fakturaunderlaget.
Fakturan visar tydligt om handpenning är betald eller obetald. Exempel: “Handpenning 500 kr – Betald” eller “Handpenning 500 kr – Ej betald”. Om handpenning ej är betald vid faktureringstillfället, kan det antingen ligga kvar som obetalt belopp på fakturan eller hanteras separat.
Totalpriset på fakturan kan antingen vara hela summan med notis att X redan erlagts, eller resterande belopp efter handpenning. Vanligt är att fakturan visar full summa och sedan en rad “- Handpenning: 500 kr” följt av “Att betala: resterande belopp”.
Export till PDF: Gränssnittet erbjuder en knapp “Exportera/Skicka faktura”. Vid klick genereras en PDF-version av fakturan:
PDF:en är formgiven med företagets logotyp och kontaktuppgifter (inlagda i systemet), kundens uppgifter, fakturanummer, fakturadatum och förfallodatum.
Innehållet i PDF motsvarar fakturaunderlaget som syns i admin (pris per natt, tillval, handpenning, total, betalstatus etc.).
Teknisk lösning: PDF-exporten kan implementeras med t.ex. ett bibliotek som jsPDF (i kombination med jsPDF-AutoTable för tabellformatering) eller server-side generation via en serverless funktion som tar HTML och renderar PDF. Next.js kan använda edge/serverless functions för att generera PDF baserat på en fakturakomponent.
PDF-filen kan laddas ner direkt eller sparas och skickas via en länk till kunden (t.ex. om systemet integrerar e-postutskick, kan det skicka en e-post med en säker länk eller bifogad PDF).
Fakturastatus: Efter att faktura skapats kan admin markera den som “Skickad” och senare uppdatera betalningsstatus:
Ex. markera som Betald när kunden betalat (vilket kan ske manuellt, eller automatiskt om onlinebetalning integreras).
Om obetalt förbi förfallodatum, kan systemet flagga med röd text “Förfallen” och ev. trigga en påminnelse-funktion (t.ex. skicka påminnelsemail).
Flera fakturor & historik: I ekonomidelen av admin finns en översikt över alla fakturor (dagis och pensionat). Där kan man se fakturanummer, kund/hund, belopp, status, och filtrera på obetalda etc. Varje faktura kan öppnas (visa PDF eller detaljer). Detta ingår delvis under Ekonomi & fakturor-modulen men nämns här för helhetens skull.
Fakturainnehåll (detaljer)
En slutfaktura (PDF) till kunden innehåller typiskt följande:
Kunduppgifter: Hundägarens namn, adress, kontakt (hämtas från ägarprofilen i systemet).
Företagsuppgifter: Hundpensionatets namn, adress, organisationsnummer, eventuella referenser.
Faktura- och bokningsreferenser: Fakturanummer, fakturadatum, förfallodatum. Samt referens till bokningen (t.ex. boknings-ID eller hundens namn + period).
Specifikation av debitering:
Logidygn: en rad per kategori om olika priser förekommit. T.ex. “Logi 5 nätter (1–6 juli) á 350 kr – 1750 kr” och “Helgtillägg 2 nätter á 50 kr – 100 kr”.
Alternativt bryta ner per natt om de vill visa varje datum och pris (oftast onödigt detaljerat; bättre summerat som ovan).
Tillvalstjänster: varje tillval som beställts under vistelsen anges. T.ex. “Bad (stor hund) – 200 kr”, “Kloklippning – 150 kr”.
Rabatter: om rabatt givits så anges det som en minuspost. T.ex. “Långtidsrabatt (10%) – -185 kr”.
Handpenning: om tillämpat visas “Handpenning (erlagd) – -500 kr” för att subtrahera förskottet från slutbeloppet.
Totalsumma: Total kostnad att betala (inkl. moms om det specificeras). Om handpenning redan betalats kan totalen anges både före och efter handpenning, för tydlighet.
Betalningsinformation: Hur kunden ska betala (plusgiro/bankgiro/Swish eller om betalning skett online), inklusive OCR/referensnummer, och eventuellt “Betald den [datum]” om markering gjorts att betalning inkommit.
Notiser: T.ex. “Tack för att ni valde DogPlanner Hundpensionat. Vid frågor kontakta oss på ...” samt eventuella villkor eller påminnelsetexter.
Administrativa inställningar
Administrationssektionen låter verksamhetsägaren konfigurera systemet efter sina egna priser, rumsförutsättningar och säsongsdefinitioner. Detta ger flexibilitet så att systemet passar just deras hundpensionat. Fyra huvudområden för inställningar är prislistor, säsong/helgdefinitioner, rumsadministration och kapacitetsöversikt.
Prislistor och tillägg
Grundpris per storlek: Admin kan skapa/redigera prislistor för pensionatet. En prislista innehåller grundpriser per natt för olika hundstorlekar eller viktklasser. T.ex. en tabell där man anger pris för Liten hund, Mellanstor hund, Stor hund. Kategoriernas definition (ex mankhöjdsintervall eller exempelraser) kan också beskrivas här för tydlighet.
Helgpris / helgtillägg: I prisinställningarna kan man ange hur helger ska prissättas. Alternativ:
Separata fält för helgpris per kategori (t.ex. liten hund helgnatt 400 kr istället för 300).
Eller ett generellt helgtillägg (t.ex. +20% på ordinarie pris, eller +X kr).
Systemet kan erbjuda båda möjligheter: antingen ange explicit helgpriser eller ett påslag så räknar systemet ut.
Högtidstillägg: Admin kan definiera ett tillägg för högtider. Det kan vara en fast avgift per högtidsnatt (t.ex. +100 kr/natt) eller procentuellt. Om olika högtider har olika påslag, kan systemet låta admin specificera per högtid (men oftast räcker det med en generell högtids-tilläggssats).
Säsongsvariationer: I prislistan kan det finnas sektioner för högsäsong och lågsäsong. T.ex. admin anger att under juli-augusti är priserna högre: man kan antingen ange en procentsats (+15% under högsäsong) eller ange en separat uppsättning priser för högsäsong (t.ex. liten hund högsäsong 330 kr istället för 300). Samma för lågsäsong om man erbjuder rabatt då.
Rabattinställningar: Även om många rabatter appliceras case-by-case, kan admin sätta vissa standardregler:
Flerhundsrabatt: t.ex. “10% rabatt på den billigaste hunden när samma ägare har 2 eller fler hundar samtidigt”.
Långvistelse: t.ex. “5% rabatt om bokningen överstiger 7 nätter, 10% över 14 nätter” – detta kan konfigureras som trösklar.
Övrigt: Möjlighet att ange en manuell rabatt direkt på en bokning finns alltid, men standardrabatter kan listas så systemet föreslår dem automatiskt.
Företagsunika prislistor: Om DogPlanner är en molntjänst som stödjer flera olika företag, finns stöd för att varje företag (hundpensionat) har sin egen prislista. Dessa lagras i en databastabell kopplad till företagskontot, så att ändringar som admin gör endast påverkar dennes eget prisupplägg.
Säsongs- och helgdagsdefinitioner
För att prisberäkningen ska fungera korrekt måste systemet veta vilka datum som räknas som helg, högtid, etc. Admin har därför gränssnitt för att definiera detta:
Helgdagar: En kalenderliknande inställningssida där admin kan markera speciella helgdagar/högtider (t.ex. röda dagar, aftnar). DogPlanner kan förladda standardhelgdagar för Sverige, men ge möjlighet att lägga till egna eller justera (ifall verksamheten t.ex. tar ut högtidstillägg även på en klämdag).
Hög- och lågsäsong perioder: Admin kan välja perioder genom att ange start- och slutdatum som ska betraktas som högsäsong. Flera intervall kan stödjas (t.ex. sommarsäsong, och kanske en vintersäsong över jul/nyår). Lågsäsong definieras antingen implicit (alla som inte är högsäsong) eller via separata perioder. Dessa perioder sparas så att systemet kan kolla varje bokningsdatum mot dem.
Helgdefinition: Standardmässigt vet systemet vilka veckodagar som är helg (lördag, söndag). Men om verksamheten vill, kan de inkludera fredag kväll som helgpris, etc. I inställningarna skulle det kunna finnas en enkel checkbox-lista för vilka veckodagar som ska räknas som “helgnatt”. Vanligtvis räcker lör-sön, men flexibilitet finns.
Underhåll av listor: Denna sektion i admin kan exempelvis visas som:
En lista över kommande 12 månaders viktiga datum med etikett: “Högtid”, “Högsäsong”, etc.
Verktyg att lägga till ny säsong (välj namn, typ: hög/låg, datumintervall).
Verktyg att lägga till ny helgdag (välj datum och namn, t.ex. “Midsommarafton”).
Återkommande helgdagar: möjlighet att spara helgdagar som återkommer årligen (t.ex. julafton) så de automatiskt markeras varje år.
Effekt i övriga moduler: Dessa inställningar påverkar inte bara prisberäkning utan även kalendern visuellt – t.ex. dagarna markerade som högtid kan ha en speciell färg eller ikon (så personal vet att högtidstillägg gäller, och kanske för planering då fler hundar kan komma eller att det krävs extra personal).
Rumsadministration (rum och kapacitet)
Skapa och redigera rum: Admin har en vy där alla rum/kennelplatser är listade med sina egenskaper. Man kan lägga till nya rum, ändra namn eller yta på befintliga.
Varje rum har åtminstone fälten: Namn, Yta (m²). Namn kan vara t.ex. Stora rummet, Lilla rummet, eller numrering.
Max antal hundar: Om verksamheten har en policy att inte ha fler än X hundar per rum (oavsett storlek), kan det finnas ett fält för “Max hundar”. Detta används i beläggningskalkylen.
Typ av utrymme: Eventuellt kan man ange om rummet är inomhus, utomhus eller kombinerat (vilket kan vara relevant om man skulle lagra olika regler, men i de flesta fall är alla “rum” inomhus kallar vi dem).
Rumsstorlekseffekt: Systemet använder rummets yta + hundars mankhöjd för att som nämnt beräkna beläggning. Administratören kan här uppdatera ytan om man t.ex. slår ihop två rum eller gör om.
Inaktivera rum: Möjlighet att markera ett rum som inaktivt/tillfälligt stängt (kanske under renovering) så att det inte dyker upp som bokningsbart under en viss period.
Koppling till bokning: När admin lägger till ett rum här dyker det upp som val när man skapar eller redigerar en bokning (välja rum för hunden). Om ett rum tas bort eller inaktiveras, hanterar systemet befintliga bokningar i det rummet (kanske varnar att de måste flyttas).
Översiktlig kapacitetsvy: Inom rumsadministrationen kan det finnas en flik “Kapacitetsöversikt” där man ser en matris av datum vs rum:
T.ex. en tabell där rader är rum och kolumner är dagar (kanske 7 eller 14 dagar framåt), med siffror eller färgfält som visar beläggningsprocent. Grön ruta om <50% full, gul om 50-99%, röd om 100% full. Detta ger administratören en snabb överblick var det finns gott om plats respektive var det är trångt.
Man kan klicka i denna matris för att hoppa till den dagens vy för det rummet.
Kapacitetsöversikt och planering
Beläggningsrapport: Utöver kalendergränssnittet kan admin ta fram rapporter eller sidor som specifikt visar kapacitetsutnyttjandet. T.ex. en sida “Beläggning” som sammanfattar kommande månaden: “Genomsnittlig beläggning X%”, “Fullbokade dagar: [lista datum]”, “Ledig kapacitet finns främst i [rum] på [datum]”.
Sök ledigt utrymme: En funktion för att underlätta bokningsförfrågningar: admin kan ange t.ex. “2 mellanstora hundar, period 1–5 augusti” och systemet kan söka igenom rummen för att se om det finns en konfiguration som rymmer detta (detta är en avancerad funktion, men systemdesignen kan notera potentialen). Resultatet skulle säga t.ex. “Rum A har kapacitet för båda hundarna under dessa datum” eller “Rum B och C kombinerat kan ta varsin hund” etc. Om sådant stödjs kan det dramatiskt förenkla manuell planering.
Koppling till daglig drift: Personalen kan använda kapacitetsöversikten för att undvika överbokning och även för att fördela hundar på optimalt sätt (t.ex. undvika att stora hundar hamnar i små rum).
Användargränssnitt och design
Gränssnittet för hundpensionatsadmin ska vara intuitivt och effektivt för personalen, samtidigt som det visuellt knyter an till DogPlanner-plattformen. Här beskrivs designöverväganden, inklusive skillnader mot hunddagis-modulen, wireframe-idéer och responsivitet.
Layout och plattformsidentitet
Enhetligt men modulunikt: DogPlanner har en gemensam designstil (typografi, ikoner, komponentbibliotek) som genomsyrar alla moduler (dagis, pensionat, frisör, ekonomi osv). Varje modul får dock en unik accentfärg och något justerad layout för att man ska känna att det är en egen del. Som nämnt används exempelvis blå färgtema för hundpensionatet, jämfört med grönt för dagis. I praktiken innebär det att toppmenyn, knappar och highlights i pensionatsdelen är blå. Även vissa ikonval kan skilja (t.ex. en ikon av en hundkoja kan representera pensionatet, vs en hund i koppel för dagis).
Navigering: I toppnivå-menyn eller sidomenyn finns separata sektioner för Hunddagis, Hundpensionat, Frisör, Ekonomi etc (beroende på vilka moduler företaget har tillgång till). Användaren (admin/personal) kan växla modul genom att klicka respektive sektion. När man går in i Hundpensionat-modulen förändras UI-temat till blå nyans, men layoutstrukturen (t.ex. menyplacering, sidhuvud) förblir samma, vilket ger kontinuitet.
Sido-/toppmeny struktur: Under Hundpensionat kan det finnas undermenyer eller flikar för:
Kalender (dag/vecka/månadsvy av beläggning),
Bokningar (lista över alla kommande bokningar, med filter och sök, utöver kalenderpresentationen),
Nya bokningar (formulär för att lägga till en ny bokning/incheckning),
Fakturor (som kan vara gemensam under Ekonomi, eller filtrerad för pensionat),
Inställningar (prislistor, rum etc. som vi beskrev under administration).
Konsekvent UI-komponenter: Systemet använder troligen ett UI-bibliotek med Tailwind CSS-klasser, samt återanvändbara komponenter (t.ex. för tabeller, modaler, formulärfält). Detta gör att även om olika sidor har olika innehåll behåller de samma look-and-feel.
Wireframe-förslag för nyckelvyer
(Nedan följer beskrivningar av hur vissa vyer kan utformas – i textformat som ersätter visuella wireframes.)
Kalendervy (månad): En månads-kalender tar upp huvudytan. Överst finns knappar för att byta till vecka/dag vy samt filtrera per rum. Varje datumruta i kalendern innehåller:
Hörnindikatorer med små färgade cirklar för in/utcheckningar (t.ex. en blå prick om någon checkar in den dagen, orange om någon checkar ut).
Siffra eller liten text med antal hundar. Om trångt kan det visa t.ex. “5/6” (bokade vs max om man definierar total kapacitet i hundar).
Klick på en datumruta kan öppna en modal eller sidopanel “Detaljer [datum]” med fullständig lista av hundar och deras status den dagen.
Dagöversikt (detaljvy): Kan visas antingen som en hel sida (om man väljer dagvy) eller i en sidopanel/modal. Här är informationen strukturerad exempelvis som:
Datumhuvud: “Onsdag 12 juli 2025” med ikoner för ev. markering (om helgdag/högsäsong – ikon för “högtid”).
Rumsektioner: Lista av rum med hundar:
Rum Solsken (12 m²) – undertitel som eventuellt visar “8/12 m² upptaget”.
Hund 1 – Bella (Golden Retriever), Checkar ut idag kl 10:00.
Hund 2 – Charlie (Labrador), Incheckad, stannar till 14 juli.
[Lägg till ikon] knappt för att direkt lägga till en ny bokning i detta rum den dagen.
Rum Ängen (8 m²) – “4/8 m² upptaget”.
Hund 3 – Doris (Chihuahua), Checkar in idag kl 15:00.
(+ eventuellt tomma rum listas med “(ledig)”).
Varje hundrad i listan har kanske en färgad vänstermarginal (grön/blå/orange) som överensstämmer med status. Dessutom knappar som “Visa bokning” (för mer detaljer eller redigera), och t.ex. en checka in/checka ut-toggle-knapp för att snabbt registrera ankomst/avfärd.
Bokningsformulär (ny bokning/incheckning): En sida eller modal där admin fyller i:
Hund (välj befintlig hund från register, eller skapa ny hund + ägare i farten).
Ägare kopplas automatiskt via hundvalet men kan justeras.
Period: Från datum (och ev. tid) till Till datum (tid). Man kan anta utcheckning kl 12 standard t.ex.
Välj rum (dropdown med bara rum som har kapacitet för hundens storlek under hela perioden – systemet kan här göra en validering: otillgängliga rum markeras röda/ej valbara de datum där de inte får plats).
Välj tillvalstjänster (checkboxar eller multivälj lista).
Se prisberäkning (en knapp som “Beräkna pris” som fyller i en läsbar sammanfattning: “Beräknat pris: 2100 kr inkl tillval och moms”).
Man ska kunna ha möjlighet att lägga till rabatter på kunden. Både stående rabatter som ligger kvar på kunden sida. Så varje gång hen loggar in för att ansöka om att boka en pensionatsplats så ser hen redan sitt redigerade pris. Men det kan också vara tillfälliga rabatter som kan läggas in manuellt vid varje bokning.
Spara bokning.
Prisinställningar vy: En formulärsida under Administration:
Sektion “Grundpriser”: tabell med kolumner för storlekskategori, pris vardag, pris helg, pris högsäsong (om man valt separat pris per scenario; annars kan högsäsong/helg hanteras som tillägg i nästa sektion).
Sektion “Tillägg & rabatter”: en lista av inställningar:

Säsongsinställningar vy: Kan använda en kalenderkomponent där admin klickar/markerar datumintervall och sätter en etikett:
T.ex. markera 1 jun–31 aug, välj “Högsäsong”.
Klicka på 25 dec, välj “Helgdag (Juldag)”.
Markerade perioder visas färgade på kalender (t.ex. högsäsong i gul ton, helgdagar röd prick), och listas i en panel till höger med namn och datumspann. Admin kan ta bort eller ändra dem via listan.
Rumshantering vy: Enkel lista:
Rum (namn) – Yta – Max hundar – Aktiv(ja/nej) – [Redigera] [Ta bort].
“Lägg till rum” knapp öppnar ett formulär för nytt rum.
Kanske drag-and-drop för att sortera rum i en viss ordning (om ordning har visuell betydelse i kalendern).
Mobilvy: På mobil/surfplatta blir gränssnittet stackat och scrollbart:
Menyn kan bli en hamburgermeny uppe.
Kalendern månadsvis visas i kompakt format eller kanske en agenda-lista per dag istället (beroende på skärmbredd).
Daglig rumsvy kan bli att man först ser en dropdown för rum om man vill filtrera, eller att rum presenteras som kort under varandra.
Alla interaktiva element (knappar, tabeller) designas med Tailwind för att bli responsiva – t.ex. kolumner som staplas på små skärmar.
Mobilanpassning och responsiv design
Responsivt från grunden: Genom att använda Tailwind CSS och flexibla grid-layouter anpassar sig appen automatiskt. Kalenderkomponenten byter layout för små skärmar (t.ex. vecka/dag vyer kan visas som listor).
Touchvänligt: Knappar och interaktioner är utformade för att fungera med touch (tillräckligt stora klickytor, ingen hover-beroende viktig information).
Offline/real-time överväganden: Om personal använder t.ex. en surfplatta ute i anläggningen, kan realtidsuppdateringar (via Supabase Realtime) göra att om en kollega checkar in en hund via dator, så uppdateras surfplattans vy utan omladdning. Även notiser kan visas (t.ex. “Ny hund incheckad”).
PDF på mobil: Om admin behöver kan de generera och dela faktura-PDF även från mobilen, vilket genererar filen och antingen visar en förhandsvisning (som kan delas via t.ex. WhatsApp/e-post direkt från telefonen).
Tillgänglighet och användarvänlighet
Språk & format: Systemet är på svenska (i detta fall) med stöd för åäö, datum visas i svenskt format. Möjligen förberett för fler språk om DogPlanner expanderar.
Ikoner och färger med eftertanke: Eftersom färger används mycket (både i status och modulidentifiering) ser man till att det även finns ikoner eller text så att färgblinda eller de som skriver ut i svartvitt förstår informationen. T.ex. en liten pil uppåt ikon vid “checkar in” och pil nedåt vid “checkar ut” kan komplettera färg.
Tröskelfri design: Systemet följer vanliga UX-principer för att personal lätt ska kunna lära sig det. Viktiga funktioner är inte gömda djupt i menyer; t.ex. knappar för att lägga till bokning eller markera in/utcheckning är direkt på de relevanta skärmarna.
Teknisk implementation
Det föreslagna systemet byggs med moderna webbramverk och molnteknologier för robust prestanda och enkel utveckling/underhåll. Här beskrivs teknologival och en översiktlig databasdesign anpassad för funktionerna ovan.
Teknikval: Next.js 15, Supabase och Tailwind
Next.js 15: Frontend-ramverket Next.js (React-baserat) används i version 15, vilket ger fördelar som App Router-arkitektur, serverkomponenter och optimerad prestanda. SSR (server-side rendering) kan användas för initial inladdning av tunga vyer (som kalendern) för snabbare visning, medan interaktiva delar sköts med Reacts klientkomponenter. Next.js ger också möjlighet att enkelt skapa API-endpoints/serverless functions – nyttjas för t.ex. PDF-generering och eventuella bakgrundsjobb.
Supabase (PostgreSQL): Används som databas och autentiseringslösning. Supabase ger en skalbar PostgreSQL databas med inbyggd realtidslyssning (för att få uppdateringar i UI när ny bokning tillkommer, etc.). Även filhantering (om t.ex. uppladdning av hundens foto behövs) och Auth (hantering av användarinloggning och roller) hanteras. Row Level Security aktiveras så att t.ex. en personal bara ser sitt företags data om DogPlanner körs som SaaS för flera företag.
Tailwind CSS: För design implementeras UI med Tailwind, vilket ger snabb styling och ett konsekvent utseende. Man kan utgå från DogPlanners designsystem med definierade färgteman för varje modul (blå nyans för pensionat etc.). Tailwinds utility-klasser möjliggör responsiv design via breakpoints, vilket uppfyller mobilanpassningskraven. Komponenter som dialoger, tabeller, formulär använder antingen Tailwind direkt eller ett färdigt UI-bibliotek (t.ex. Shadcn UI eller Headless UI) integrerat med Tailwind för enhetligt utseende.
PDF-export: Som nämnts planeras PDF-generering med hjälp av verktyg som jsPDF i kombination med autoTable för tabellgenerering. Detta kan ske antingen helt i klienten (t.ex. när admin klickar “Exportera PDF” körs jsPDF i webbläsaren för att skapa filen) eller på serversidan (en Next.js API-route som genererar PDF och returnerar). För bättre kontroll och prestanda lutar man mot serverside generering, särskilt för längre fakturalistor eller om man vill använda server-Teckensnitt/logotyper utan exponering av dem i klienten. Genererad PDF kan lagras temporärt i Supabase Storage eller direkt streamas till användaren.
Övriga bibliotek:
State management: Reacts kontext API eller Zustand kan användas för att hantera global state (t.ex. aktuell vy, filterinställningar).
Datumhantering: Bibliotek som Day.js eller date-fns för att lätt räkna nätter, veckor, format datum i svenska format, beräkna helgdagar (kanske kan automatiseras viss del).
Charts/Graphs: Om man vill visualisera beläggning eller omsättning, kan bibliotek som Chart.js integreras för enklare diagram.
Auth och roller: Supabase Auth hanterar inloggning. Roller (admin, personal, hundägare etc.) hanteras genom anpassade claims eller en user-metadata tabell. Administrationsgränssnittet visas bara för de med behörighet (t.ex. admin och personal, ej hundägare).

För att hålla det enkelt kan DogPlanner ha en pris lista tabell med kolumner: company_id, data (JSONB), effective_from. Där data innehåller allt ovan i strukturerad form. Vid prisberäkning hämtar man aktuella price_list (den senaste effective_from som är <= idag). Detta underlättar framtida prisändringar (man kan lägga in ny price list som gäller från ett visst datum).

Exempel på flöde genom systemet
För att förstå hur allt hänger ihop kan vi följa ett exempel: En administratör lägger in sina rum och prisregler i systemet. När en kund vill boka in sin hund, går personalen till “Ny bokning”, fyller i att hund Fido (stor) ska vara incheckad 1–5 mars, väljer ett rum (systemet visar vilket rum som har plats; man väljer Rum Solsken 12 m²). Systemet ser att Fido är stor hund: grundpris 400 kr/natt. Datum 1–5 mars inkluderar en helg (lör-sön), så +50 kr/natt på de två nätterna. Mars är lågsäsong, ingen extra kostnad (kanske tom rabatt - inget här antaget). Inga helgdagar under den perioden. Personal lägger till tillval “Bad” en gång á 200 kr. Systemet beräknar pris: (5 nätter _ 400) + (2 helgnätter _ 50) + 200 = 2000 + 100 + 200 = 2300 kr. Handpenning 500 kr registreras. Kunden betalar handpenningen via Swish och personal markerar den som betald. Vid ankomst 1 mars checkas Fido in via dagsvyn (status blir Incheckad). Under vistelsen kanske personalen noterar något i en journal (om den funktionen finns). 5 mars hämtas Fido, personal markerar utcheckning. En faktura genereras automatiskt eller manuellt för resterande belopp (1800 kr). PDF skapas och mejlas till kunden. På administrationssidan markeras fakturan som betald när pengarna kommit in.
Sammanfattning
DogPlanner Hundpensionat-admin är utformat för att täcka alla behov i en hundpensionats vardag: från planering av beläggning med tydliga kalendervyer (dagligen och övergripande), kapacitetskontroll baserat på reglerad yta per hund, till automatisk prisberäkning och smidig fakturahantering. Genom att ge administratören verktyg att justera prislistor, definiera säsonger och hantera rum skapas ett flexibelt system som kan anpassas efter just deras verksamhet. Designmässigt hålls gränssnittet användarvänligt med tydliga färgmarkeringar och konsekvent layout – det särskiljer sig från dagis-delen med egna färger och innehåll, men behåller DogPlanners familjära känsla. Slutligen möjliggör den valda teknikstacken (Next.js, Supabase, Tailwind) en modern, robust applikation som är lätt att vidareutveckla och underhålla, samtidigt som den levererar en snabb och pålitlig upplevelse för användarna.

Bokningsformulär
Rubriken: ÄgareFörnamn:
Efternamn:Personnummer
Kundnummer: (denna ska vara kopplat till ID och vara kopplad till ägare - hund- faktura, systemet ska tilldela kunden ett kundnummer automatiskt vid första bokning). Epostadress:Telefonnummer:
Adress:
Postnummer:
Ort:

Kontaktperson 2:
Förnamn:
Efternamn:
Telefonnummer:
Rubrik: Hund:
Hundens namn:
Hundens namn
Ras
Mankhöjd
Födelsedatum
Kön (Tik / hane)
FörsäkringsnummerÖvrigt hund: (bocklista)
Kasterad / steriliserad
Hund biter på saker
Kissar inne
Hund skällig
Personalhund
Pensionatshund
Kund tillåter att hund får leka med andra hundar
Kund tillåter att vi tar bilder på hunden och använder på våra sociala medierRubrik: Hälsa:
Försäkringsbolag
Försäkringsnummer
Vaccination DHP (giltig 3år)
Vaccination Pi (giltig ett år)En ruta där man kan skriva i om Vård / MedicinRubrik: Bokning- En ruta där man kan skriva i journalanteckningar- En ruta där de står kommentarer ägare:- En ruta där man kan skriva i om foder Rubrik: Abonnemang:
Incheckningsdag:
Utcheckningsdag:
Rumsnummer
En ruta för tilläggstjänster: 
• En ruta där man kan skriva i anvisningar till ekonomi Allt i denna flik ska vara kopplat till fakturaunderlaget. 

Kund som vill ansöka om en bokad plats
Sidan ska vara för hundägare (ska alltså vara helt separat ifrån hundpensionattsidan ifrån dashboard så kunderna kan komma in ifrån eget håll). Där ska dom kunna
Registrera konto eller logga in (om dom redan är registrerade)
Skapa/uppdatera hundprofil på sina hundar som dom ska kunna lägga till
Skicka intresseanmälan (kopplas till profil) här ska det finnas en rullista på alla hundpensionat som är kollade till våran server som dom kan välja mellan.
Dom ska kunna se och hantera sina kommande bokningar

Om dom inte redan har ett konto ska dom kunna skapa ett. Dom ska först kunna skapa sin profil där dom får skriva in uppgifter som:

Rubriken: ÄgareFörnamn:
Efternamn:Personnummer
Kundnummer: (denna ska vara kopplat till ID och vara kopplad till ägare - hund- faktura, systemet ska tilldela kunden ett kundnummer automatiskt vid första bokning). Epostadress:Telefonnummer:
Adress:
Postnummer:
Ort:

Kontaktperson 2:
Förnamn:
Efternamn:
Telefonnummer:

Rubrik: Hundar
Hundens namn:
Hundens namn
Ras
Mankhöjd
Födelsedatum
Kön (Tik / hane)
FörsäkringsnummerÖvrigt hund: (bocklista)
Kasterad / steriliserad
Hund biter på saker
Kissar inne
Hund skällig
Personalhund
Pensionatshund
Kund tillåter att hund får leka med andra hundar
Kund tillåter att vi tar bilder på hunden och använder på våra sociala medierRubrik: Hälsa:
Försäkringsbolag
Försäkringsnummer
Vaccination DHP (giltig 3år)
Vaccination Pi (giltig ett år)En ruta där man kan skriva i om Vård / Medicin
(dom ska kunna lägga till flera hundar)

Skicka verifiering till deras epost → dom godkänner vårt policy och säkerhetsavtal ang kundhantering → dom kan nu logga in med sitt konto

När dom har skapat sin profil så ska dom kunna fylla i ansökan om bokning (bokningsformulär) uppgifterna ska då vara:
Välja hund/hundar (då ska dom kunna välja mellan hundarna som dom har lagt in i sin profil)
Välj datum (incheckning och utcheckning)
Välj tillval/tjänster (kloklipp, bad, trimning, tasstrim, hämtning/lämning, valptillägg, m.m.)
Pris visas (storlek på hund som baseras på pensionats pristabell för liten /mellan / stor hund som räknas ut med mankhöjden + pris för vardag/säsong/helg/högtid + ev. rabatter)

Skicka ansökan till specifikt pensionat → personalen får då en förfrågan på en sida som heter ansökningar, där ska personalen kunna godkänna eller avslå ansökan, om personelen godkänner så ska dom ha möjlighet att lägga till eventuella kostnader och/eller rabatter → fakturaunderlag skapas → faktura skickas till kunden via mejl och bokningen är därmed bekräftad.

På kundsidan för registeringen ska inte logga ut knappen synas. Och Dogplannerloggan ska inte ta kunden till dashboard. Den ska bara vara en bild utan funktion.

Sammanställning: Ny kund/konto pensionat (nya onlinebokningar)
Registrera konto / Skapa konto (GDPR-samtycke)
Skapa hundprofil (namn, ras, födelsedatum, mankhöjd cm, vaccinationer, mat, allergier, beteende, bild, samtycken). Man ska kunna lägga till flera hundar.
Välj datum (incheckning och utcheckning)
Välj tillval/tjänster (kloklipp, bad, trimning, tasstrim, hämtning/lämning, valptillägg, m.m.)
Pris visas (storlek + säsong/helg/högtid + ev. rabatter)
Skicka ansökan → verifieringsmejl skickas till deras epostadress att man godkänner att pensionatet sparar och behandlar deras uppgifter enligt GDPR→ om dom godkänner skickas ansökan till pensionatet→ admin godkänner och lägger in eventuella rabatter→ fakturaunderlag skapas
Handpenning/förskott betalas enligt inställningar


För hundägare som redan har ett konto, sammanställning:
Logga in,
Möjlighet att Uppdatera hundprofil lägga/ta bort hund
Välj datum (incheckning och utcheckning) och vilka hundar man vill boka till
Välj tillval/tjänster (kloklipp, bad, trimning, tasstrim, hämtning/lämning, valptillägg, m.m.)
Pris visas (storlek + säsong/helg/högtid + ev. rabatter)
Skicka ansökan → admin godkänner och lägger in eventuella rabatter → fakturaunderlag skapas
Handpenning/förskott betalas enligt inställningar
Se och hantera kommande bokningar

Hunddagisets hundar – sammanställning
När man tryck in på hunddagis ifrån dashboard så kommer man in på hunddagiset sida.
Den ska vara grön upptill med public/logotyp i vänstra hörnet i Navbaren och Hunddagis texten under den gröna navbar. Det ska finnas en sökruta där man kan söka efter uppgifter som visas på sidan. De ska också finnas en rullista där man kan välja att visa Våra hundar (alla hunddagishundar hos företaget), Tjänster, Hundrum, Väntelistan. Det ska finnas två st livesymboler till höger. Livesymbolerna ska vara:
Dagishundar(Här ska de visas hur många hundar som hunddagiset har inskrivet som dagishund)OchIntresseanmälningar(Här ska de synas hur många intresseanmälningar finns på de aktuella dagiset. Klickar man på denna text så ska man se en lista på alla sina intresseanmälningar. )Info om de olika flikarna:
TjänsterHär ska alla vilka hundar som ska ha kloklipp/ tassklipp och bad i månaden. När man trycker på denna liverapportering så ska de komma upp en lista på alla hundar som har något utav dessa tillägg. Det ska också gå att kryssa i hunden när man har gjort den tjänsten den månaden, detta är för att personalen lättare ska kunna se vad som redan blivit gjort och vem i personalen som utfärdat tjänsten.
HundrumHär ska man kunna se hur många dagisrum man har Tycker man här ska man se vilka hundar som sitter i vilka rum och hur mycket plats dom tar upp. Detta är för att veta om man har möjlighet att ta in nya hunddagisar eller om dagiset är fullbelagt. IntresseanmälningarHär ska de synas hur många intresseanmälningar som kommit in den senaste månadenOm man klickar på här så kommer de upp en sammanställd lista på ALLA hundar som ligger på intresselistan för de specifika hunddagiset. Mina priserTrycker man här så ska man komma in på mina priser sidan. Man ska kunna se vad de olika abonnemangen och tilläggstjänsterna kostar. Men här kan man inte ändra priserna. Denna sida ska kopplas upp mot den som ligger under dashboard/admin/priser - hunddagis. Det är på admin sidan som endast admin kan gå in och lägga till och ändra priserna på sitt hunddagis, men denna som ska visas här är en ”låst sida” som ingen kan ändra på. Den är till för övrig personal som vill se sina priser på hunddagiset. 
Flik 1: ”Våra dagishundar”
I hundlistan ska det finnas en sök- och filtreringsfunktion där personalen snabbt kan söka på bla hundens namn, ras, ägare eller abonnemangstyp. Det ska även gå att filtrera listan baserat på tex heltid, deltid eller dagshund, samt efter vilka dagar hunden vistas på dagiset. När man klickar på en hunds namn öppnas en profil som visar hundens bild, ras, kontaktuppgifter till ägaren, vanor, foder, eventuella allergier och vaccinationsinformation. Det finns även ett anteckningsfält där personalen kan skriva korta noteringar, som till exempel “Luna har lite ont i tassen idag”. Det är viktigt att alla uppgifter som finns på hunden i EditDogModual ska man kunna välja att visa/dölja i listan.
Schema och bokningar
Systemet ska automatiskt koppla hundens abonnemang till ett veckoschema. Till exempel kan ett deltidsabonnemang innebära att hunden kommer måndag, onsdag och fredag. Det ska också finnas en särskild vy för dagens hundar, där personalen snabbt kan se vilka som väntas komma. Heltid menas med att hunden går 5 arbetsdagar i veckan. Deltid 2 menas att hunden går två arbetsdagar i veckan och deltid 3 menas med att hunden går 3arbetsdagar i veckan. Man betalar för sin reserverade plats de specifika dagarna som man har valt i sitt abonnemang och inte för antal utnyttjade dag.
Administration och betalningar
Fakturor och betalningspåminnelser ska skapas automatiskt utifrån hundens abonnemang. Systemet genererar fakturaunderlag utifrån informationen som anges i EditDogModal.tsx för varje kundnummer. Det ska även finnas statistik och rapporter som visar beläggning per dag och hur många hundar som är heltid, deltid2 och deltid 3. Det här gör det enkelt för ägaren att få överblick över verksamheten.
Systemet skickar automatiska påminnelser till hundägarens mejladress när vaccinationer håller på att gå ut, abonnemang behöver förnyas och när ändringar i hundens abonnemanget har gjort.
Struktur för “Våra hundar”-vyn
Systemet hämtar information automatiskt från EditDogModal. Varje kolumn i tabellen kan visas eller döljas via en inställningsmeny, och alla kolumnval sparas lokalt. Bland kolumnerna ska man kunna välja att visa/dölja ifrån alla upplysningar som man har på redigeringssidan för hunden. Alltså:Rubrik: ÄgareFörnamn:Efternamn:PersonnummerKundnummer: (denna ska vara kopplat till ID och vara kopplad till ägare - hund- faktura). Systemet tilldelar ett kundnummer automatiskt till kunden när ny hund skapas eller när företaget tar emot en hund ifrån intresselistan och lägger över den som dagishund.)Epostadress:Telefonnummer:
Adress:
Postnummer:
Ort:

Kontaktperson 2:
Förnamn:
Efternamn:
Telefonnummer:
Rubrik: Hund:

Hundens namn
Ras
Mankhöjd
Födelsedatum
Kön (Tik / hane)
FörsäkringsnummerÖvrigt hund: (bocklista)
Kasterad / steriliserad
Hund biter på saker
Kissar inne
Hund skällig
Personalhund
PensionatshundDessa bockar har vi haft problem med. Det är viktigt att rutan ligger intill texten som hör ihop med rutan ordentligt. Rubrik: Hälsa:
Försäkringsbolag
Försäkringsnummer
Vaccination DHP (giltig 3år)
Vaccination Pi (giltig ett år)En ruta där man kan skriva i om Vård / MedicinRubrik: Kommentarer- En ruta där man kan skriva i journalanteckningar. Detta sparas och loggas på den specifika hunden upp till två år.- En ruta där de står kommentarer ägare:- En ruta där man kan skriva i om foder Rubrik: Abonnemang:
Det ska gå att välja mellan Heltid / Deltid 3 och Deltid 3 / Dagshund. Man ska också kunna skriva i start och slutdatum på abonnemanget. Heltid menas med att hunden går 5 arbetsdagar i veckan. Deltid 2 menas att hunden går två arbetsdagar i veckan och deltid 3 menas med att hunden går 3arbetsdagar i veckan. Man betalar för sin reserverade plats de specifika dagarna som man har valt i sitt abonnemang och inte för antal utnyttjade dagar.
Bockruta där man kan kryssa i vilka dagar hunden ska gå (måndag / tisdag / onsdag / torsdag / fredag)
Rumsnummer
En ruta för Tilläggsabongemang (tex kloklipp 1ggr/månad). Man ska också kunna skriva i start och slutdatum. (Viktigt att de går att ta bort nollan som ligger i fältet, de hade vi problem med sist att de vart tex 099 istället för 99.
En ruta där man kan skriva i anvisningar till ekonomi (kopplad till faktura, det kan vara tex ändringar i abonnemang)Allt i denna flik ska vara kopplat till fakturaunderlaget och ekonomiansvarig ska enkelt komma åt informationen ifrån faktura sidan när hen skapar/ändrar eller tar bort fakturaunderlagen.
Vissa uppgifter är kopplade till fakturor, som till exempel mankhöjd, abonnemangstyp, veckodagar, tilläggsabonnemang, kommentarer till ekonomi, merförsäljning, start- och slutdatum samt pris. Andra uppgifter, som rum, ras och journalanteckningar, används endast internt.
Abonnemangstyperna kan vara heltid, deltid 2, deltid 3 eller dagshund. Heltids- och deltidsabonnemang påverkas av hundens mankhöjd, medan priset för dagshundar hanteras manuellt genom merförsäljning.men som standard när man kommer in på sidan så ska man se kolumner som: Hundens namn, hundens ras, vilka veckodagar hunden ska gå, abonnemangstyp, tilläggstjänster och ägarens för och efternamn. Sedan ska man enkelt kunna visa/dölja för att få upp den informationen som man behöver. ✅ Öppna kolumnmenyn med "Kolumner"-knappen
✅ Klicka i checkboxarna för att visa/dölja kolumner
✅ Klicka var som helst utanför menyn för att stänga den (inte bara på krysset)
✅ Eller klicka på krysset som vanligt


TilläggabonemangLägg till flera abonnemang - När du redigerar en hund i fliken "Tillägg/Extra":
Fyll i namn (t.ex. "Kloklipp")
Välj antal gånger per månad (t.ex. "2")
Valfritt: start- och slutdatum
Klicka "+ Lägg till"
Upprepa för fler abonnemang (t.ex. "Badning 1ggr/mån")
Se tillagda abonnemang - Alla tillagda visas i en lista ovanför formuläret med:
Namn och antal/månad
Start- och slutdatum (om ifyllda)
"Ta bort"-knapp för varje addon
Sparas separat - Varje tilläggsabonnemang sparas som en egen rad i extra_service-tabellen
Laddas automatiskt - När du öppnar en befintlig hund laddas alla dess tilläggsabonnemang in

Funktioner
Systemet har svenska rubriker och stöd för att visa eller dölja kolumner. Sortering fungerar på alla kolumner. Månadsvyn täcker de senaste 24 månaderna. Hundar som har slutdatum under aktuell månad markeras i rött, medan de som redan avslutats döljs men finns kvar i historiken.
Klickar man på hundens namn öppnas redigeringssidan, och det går även att exportera informationen till PDF med svenska rubriker. Hundens abonnemang färgkodas automatiskt och veckodagar visas som färgade symboler. Layouten är densamma som i DogPlanner och är enkel att använda.
Prislogik och fakturering
Se annat dokument för mer information om faktura och betalningar för att få en bra förståelse.

Redigera befintlig hund eller lägga till ny hund (EditDogModual)Det är på EditDogModual som man ändra eller lägger till en ny hund ifrån hunddagis/page sidan. Man ska kunna trycka på: lägg till ny hund eller en liten ruta på sidan utav hundens namn för att kunna redigera befintlig hund. Alla uppgifterna som ska kunna läggas till är: 
Rubrik: ÄgareFörnamn:
Efternamn:Personnummer
Kundnummer: (denna ska vara kopplat till ID och vara kopplad till ägare - hund- faktura). Systemet tilldelar ett kundnummer automatiskt till kunden när ny hund skapas eller när företaget tar emot en hund ifrån intresselistan och lägger över den som dagishund.)Epostadress:Telefonnummer:
Adress:
Postnummer:
Ort:

Kontaktperson 2:
Förnamn:
Efternamn:
Telefonnummer:
Rubrik: Hund:

Hundens namn
Ras
Mankhöjd
Födelsedatum
Kön (Tik / hane)
FörsäkringsnummerÖvrigt hund: (bocklista)
Kasterad / steriliserad
Hund biter på saker
Kissar inne
Hund skällig
Personalhund
PensionatshundDessa bockar har vi haft problem med. Det är viktigt att rutan ligger intill texten som hör ihop med rutan ordentligt. Rubrik: Hälsa:
Försäkringsbolag
Försäkringsnummer
Vaccination DHP (giltig 3år)
Vaccination Pi (giltig ett år)En ruta där man kan skriva i om Vård / MedicinRubrik: Kommentarer- En ruta där man kan skriva i journalanteckningar. När man sparar dessa så ska dom - En ruta där de står kommentarer ägare:- En ruta där man kan skriva i om foder Rubrik: Abonnemang:
Det ska gå att välja mellan Heltid / Deltid 3 och Deltid 3 / Dagshund. Man ska också kunna skriva i start och eventuellt ett slutdatum på abonnemanget. Om inte slutdatum är inskrivet så gäller abonnemangsavtalet tills vidare. Dagisabonemanget betalas en månad i förskott. Heltid menas med att hunden går 5 arbetsdagar i veckan. Deltid 2 menas att hunden går två arbetsdagar i veckan och deltid 3 menas med att hunden går 3arbetsdagar i veckan. Man betalar för sin reserverade plats de specifika dagarna som man har valt i sitt abonnemang och inte för antal utnyttjade dagar.
Bockruta där man kan kryssa i vilka dagar hunden ska gå (måndag / tisdag / onsdag / torsdag / fredag)
Rumsnummer
En ruta för Tilläggsabongemang (tex kloklipp 1ggr/månad). Man ska också kunna skriva i start och slutdatum. (Viktigt att de går att ta bort nollan som ligger i fältet, de hade vi problem med sist att de vart tex 099 istället för 99. Man ska även ha möjlighet att lägga till flera olika tilläggsabonemang om kunden vill ha flera olika tjänster. Om man har skrivit i ett slutdatum för sitt tilläggsabonemang så försvinner det listan månaden efter, tex om hunden har slutdatum på sitt kloklippabonemang 11/10 så syns det i nästkommande fakturaunderlag (eftersom dom betalar tillängabonemang en månad efter) och när det är ny månad (nov) så ska tilläggsabonemanget tas bort i tilläggsaboenmanglistan automatiskt.
En ruta där man kan skriva i anvisningar till ekonomi (kopplad till faktura, det kan vara tex hund köpte en fodersäck 799:-Allt i denna flik ska vara kopplat till fakturaunderlaget och ekonomiansvarig ska enkelt komma åt informationen ifrån faktura sidan när hen skapar/ändrar eller tar bort fakturaunderlagen.När ny hund skapas så skapas också automatiskt ett kundnummer som är ansluten till hunden - ägaren - fakturan om kundnummer inte finns. Läs mer om kopplingar och triggers på schema i VS. Viktigt att när hunden sparas så hamnar all information på en i listan på hunddata/page där hunddagiset kan se alla sina nuvarande hundar. Klickar dom på en befintlig hund för att redigera innehållet så ska allt innehåll som redan finns på hunden redan vara ifyllt på EditDogModual. 
Journal
När modal öppnas för en befintlig hund hämtas alla tidigare journalanteckningar
Sorterade från nyast till äldst
Sparas i journalHistory-state
3. Visar journalhistorik i UI (lines ~1135-1165)
Under journaltextfältet visas en scrollbar lista med tidigare anteckningar
Varje anteckning visar:
📅 Datum och tid i svenskt format (t.ex. "31 okt 2025, 14:30")
🏷️ Entry type-badge om det inte är en vanlig "note"
📝 Innehållet med preserved line breaks
Grå bakgrund för att skilja från nytt fält
Max-höjd 300px med scroll för många anteckningarEfter att ny journalanteckning sparas:
✅ Hämtar uppdaterad journalhistorik automatiskt
✅ Visar den nya anteckningen direkt i listan
✅ Rensar journaltextfältet (redo för nästa anteckning)Användning:
Öppna befintlig hund → Se alla tidigare journalanteckningar under textfältet
Skriv ny anteckning i textfältet
Klicka Spara → Anteckningen läggs till i dog_journal-tabellen
Historiken uppdateras direkt → Den nya anteckningen visas överst
Textfältet rensas → Redo för nästa anteckning
Resultat:
✅ Komplett journalhistorik synlig vid varje hund✅ Kronologisk ordning (nyast först)✅ Append-only (gamla anteckningar bevaras)✅ Auto-update efter sparning✅ Ingen kompilering fel

Ny flik: Intresseanmälan hundHär ska en hundägare som vill ansöka om en hunddagis plats synas. Alla uppgifter som kunden skickar in på ansökningsformuläret hamnar här i en snygg rullista. Här ska man kunna gå in på en hund och lägga till kommentarer enkelt som tex ”kund kommer på visning 10/10” eller ”kund ej intressant, ta ej emot hunden”.Det ska också gå att ta bort en intresseanmälan eller lägga över den som ”antagen” och då hamnar den automatiskt i hunddagis/page när man fyllt i startdatum för hunden. ———-
Kund som vill skicka in sin intresseanmälan till hunddagisetAnsökningsformulär

Denna sida ska hunddagiset kunna länka till ifrån deras egna hemsida. Då kommer kunderna som vill ansöka om en dagisplats till sin hund fylla i formuläret, när dom skickar in det så kommer det till hunddagisets DogPlanner konto och hundarna hamnar på deras ”kölista”.

Uppgifter som hundägarna ska fylla i är:
Ägarens för och efternamn
Epostadress
Telefonnummer
Ort

Hundens namn
Ras
Födelsedagsdatum
Kön (tik/hane)
Mankhöjd angivet i cm
Önskat abonnemang (Heltid, deltid 2, deltid 3, dagshund). Om dom väljer deltid så måste dom kunna fylla i vilka dagar dom önskar, tex måndagar och torsdagar eller måndag, tisdagar, onsdagar för att dagispersonalen lättare ska kunna matcha med sina nuvarande hundar.
Önskat startdatum

Dom kan också fylla i en ruta om hunden behöver extra vård eller anpassningar. (Tex är rymningsbenägen, kan öppna dörrar, klättrar över staket. Dom ska också kunna fylla i om hunden har några allergier eller äter någon medicin.
En bockruta som man kan fylla i om hunden är kastrerad/steriliserad, rymningsbenägen, ej rumsren eller hunden biter sönder saker.

Det ska också finnas ruta längst ned att som dom behöver bocka i för att kunna skicka intresseanmälan

”Jag har läst & godkänner hunddagisets integritetspolicy” som dom måste bocka i för att kunna skicka in intresseanmälningen.

När intresseanmälningen är inskickad så kommer ansökan till specifikt hunddagis. Deras ansökan kommer att ligga i hunddagisets väntelista. Kunden får en bekräftelse på att deras anmälan kommit fram.

Intresselistan:

Här ska alla hundar som har ansökt till dagiset komma upp.

Man ska kunna se en sammanställd lista på alla. Uppgifterna som syns är ifrån den informationen som ägarna skickade in via intresseanmälan.

Kolumnerna:
Redigera hund
Hundens namn
Hundens ras
Hundens kön (Tik/ kastrerad tik/hane/ kastrerad hane)
Hundens mankhöjd
Ansökt abonnemang heltid/deltid 2/deltid 3/ dagshund
Vilka veckodagar kunden önskar att hunden ska gå
Önskat startdatum
Händelser (här ska de visas information om tex hunddagiset pratat med kunden, detta ifylls på hundens redigeringslista).
Man ska kunna motta en hund som ligger på intresseanmälan och föra över den direkt i sin hunddagislista, då ska alla uppgifter som hundägaren fyllt i ifrån intresseanmälningen automatiskt föras över. Personalen ska vid behov lägga till och ändra uppgifter som tex startdatum och abonnemang. När hunden är överflyttad till hunddagis så börjar den visas i listan på den månad där startdatumet är lagt ifrån. Kunden ska få ett mejl att hunden är mottagen och faktura skapas eftersom man betalar sin abonemangsavgift i förskott.

🔧 Teknisk status
Dataflöde (fungerar nu korrekt):
Skapa/Redigera hund → EditDogModal öppnas
Fyll i fält → State uppdateras i React
Klicka Spara → dogPayload skapas med alla fält
Supabase INSERT/UPDATE → Data sparas i rätt kolumner
onSavedAction() → page.tsx anropar fetchDogs()
Listan uppdateras → Nya/ändrade data visas direkt

✂️ Hundfrisörens journal – funktioner

När man kommer in på huvudsidan så ska det komma upp en liten ruta ” mina bokningar” och så ska hundens namn och tid komma upp. Man ska kunna klicka sig in på hunden för att få mer information om den (journalsidan) under rutan ”mina bokningar” komma in på en lista på alla hundar som man har klippt/trimmat. Det ska finnas en sammanställd lista för hunddagishundar och utomstående hundar.Man ska kunna söka på ägarens eller hundens namn för att få upp rätt hund/journal som man kan klicka sig in på.
Inloggning och Rollhantering
Implementera säkra inloggningsfunktioner
Överskådlig Dashboard
Mini-översikt med "Mina bokningar" på startsidan.
Klickbara hundnamn och tider för snabb tillgång till detaljer.
Sök och Filtrering
Kraftfull sökfunktion på hundnamn, ägarens namn och kundnummer.
Filter för hunddagishundar vs. utomstående kunder.
Integration med Hunddagis
Automatisk hämtning av data via ifrån hunddagis/id/page. Kopplat till kundnumret.
Automatisk validering av kundnummer och datauppdatering.
Hundens Profil och Journal
Enkel editering av hundens uppgifter.
Tidsstämplade journalposter med möjlighet att lägga till bilder, verktyg, produkter, beteendeanmärkningar.
Historik och Påminnelser
Automatiska påminnelser via e-post eller aviseringar (ex. 8 veckor sedan senaste klipp).
Snabböversikt av senaste klippningar.
Bokningssystem
Interaktiv kalender för lediga tider.
Direktbokning av tider via systemet.
Möjlighet att avboka eller omboka enkelt.
Betalning och Kvittoundlag
Integrerad betalningslösning för platsbetalning.
Möjlighet att koppla journaler till fakturor för hunddagiskund.
Exportfunktion för bokföring.
Mall- och Exportfunktioner
Spara favoritmalar för olika klippningar.
Exportera journaler och fakturor som PDF eller CSV för enkel utskrift och bokföring.
Tillägg och Automatisering
Automatiska förslag på nästa tid baserat på senaste klipp.
Skapa påminnelselistor för återkommande kunder.
Användarvänlighet & Mobilanpassning
Enkel och tydlig design.
Mobilanpassad för snabb åtkomst i farten.
Möjligte förbättringar:
Medicinska journaler och allergier för att ge extra trygghet.
Bildgalleri för hundarnas före- och efterbilder.
Kommentarsfunktion för snabb intern kommunikation mellan frisörer.
Kundportal för ägare att se sina bokningar och journaluppgifter.

Hundrum

Nu skulle vi behöva bygga en ny sida som ska heta Hundrum

Precis som sidan där hunddagisägarna kan lägga in sina unika företagspriser så ska dom kunna fylla i hur många hundrum dom har och hur många hundar som får plats i rummen. Det ska alltså finnas en tabell där dom kan fylla tex hur många rum dom har och hur många kvadratmeter deras rum är. Detta är för att dom enkelt ska kunna se om dom har plats kvar i något rum och hur vilken storlek på hund som dom kan få in i rummet.
Detta ska sedan vara kopplat till hundarnas personliga konton, där ska man kunna fylla i vilket rum hunden tillhör. Sedan ska hemsidan visa en sida med sammanställd information
vilka hundar som sitter i rummet
Hur många kvadratmeter som dom tar upp
Hur många kvadratmeter som finns kvar (alltså möjlighet för dom att ta in en till hund).
Hundarna kan gå heltid, deltid 3 eller deltid 2, det syns i deras personlig konto vilket abonnemang dom har. Därför är det viktigt att tabellen räknar ut tex på måndag finns det så här många hundar i rummet (och då kanske rummet är fullt) men på tisdagar kanske det finns plats över eftersom en hund inte går just tisdagar). På så sätt kan deltidshundarna gå om varandra.Deltid 2 menas att hunden går två vardagar i veckanDeltid 3 menas att hunden går tre vardagar i veckanHeltid menas med att hunden går alla vardagar i veckan (mån-fre)

Utrymme för flera hundar
När två eller flera hundar delar ett rum behövs större utrymme. Hur mycket plats som krävs beror på hundarnas mankhöjd och hur många hundar som finns i rummet. Utrymmet får gärna vara större än minimikraven, men aldrig mindre.
Man utgår alltid från den största hunden i gruppen. Därefter lägger man till en viss yta för varje ytterligare hund, beroende på deras storlek.
Om den största hunden är under 25 centimeter i mankhöjd krävs minst 2 kvadratmeter, och man lägger till 1 kvadratmeter för varje extra hund.Om den största hunden är mellan 25 och 35 centimeter behövs 2 kvadratmeter, och man lägger till 1,5 kvadratmeterför varje ytterligare hund.För hundar som är 36 till 45 centimeter höga krävs 2,5 kvadratmeter, plus 1,5 kvadratmeter per extra hund.Om den största hunden är 46 till 55 centimeter krävs 3,5 kvadratmeter, och därefter lägger man till 2 kvadratmeter för varje extra hund.Hundar som är 56 till 65 centimeter behöver 4,5 kvadratmeter, med ett tillägg på 2,5 kvadratmeter per extra hund.För de största hundarna, över 65 centimeter i mankhöjd, krävs 5,5 kvadratmeter, och man lägger till 3 kvadratmeterför varje ytterligare hund.
Det betyder alltså att för varje extra hund i samma rum lägger man till ytan som motsvarar den hundens storlek enligt ovan.
Exempel
Om du till exempel ska bygga en box för tre hundar, där hundarnas mankhöjd är 30, 40 och 50 centimeter, börjar du med den största hunden – den som är 50 centimeter hög. Enligt måtten behöver den största hunden 3,5 kvadratmeter.
Sedan lägger du till ytan för de två mindre hundarna. Eftersom deras mankhöjder är mellan 25 och 45 centimeter lägger du till 1,5 kvadratmeter för vardera hund.
Det betyder att den totala ytan som krävs blir 3,5 + 1,5 + 1,5 = 6,5 kvadratmeter.

Automatisk varning vid överbeläggning
“Om ett rum överskrider tillåten yta ska systemet automatiskt markera rummet i rött och visa en varning.”
Möjlighet att exportera rumsläget
“Det ska gå att exportera rumsöversikten till PDF eller CSV för planering och tillsyn.”
Koppling till fakturering
“Rumsyta och beläggningsgrad kan kopplas till fakturaunderlaget för att visa kapacitetsutnyttjande per månad.”
A4 - skriva ut till hunddagishundarnaNär man klickar på hundrummen så ska man kunna skriva ut specifikt hundrum på ett A4. Det är för att man ska kunna sätta upp pappret på hunddagisets rum så man ser vilka som bor där. Det ska vara en snygg layout. En bild på hunden och info vad hunden heter, vilka dagar den ska gå på dagis tex måndag, tisdag, onsdag eller tors, fre osv (beroende på vad som står i hundens profil). Det ska också stå om hunden har några hälsofel, tex allergi som är viktigt att känna till. Hundens födelsedag får gärna också stå. Tänk att de ska vara all nödvändig information för en nyanställd som ännu inte känner hundarna som ska ta hand om dom. På a4 pappret ska man alltså få en sammanställning på alla hundarna som bor i just de rummet så man slipper skriva ut ett a4 papper per hund för att sätta på dörren. Det är viktigt att det blir en snygg layout med vitbakgrund för att inte slösa så mycket på skrivarfärg. Den ska vara symetrisk och tilltalande att kolla på. Gärna med en liten DogPlanner stämpel längst ner i högra hörnet för att göra lite smygreklam för min hemsida. Informationen till A4 pappret tas ifrån informationen som finns editdogmodual där man lägger till hundens rum.

🐾 DogPlanner – Arkitektur och byggmanual
DogPlanner är ett webbaserat affärssystem för hundverksamheter som hunddagis, hundpensionat och hundfrisörer. Systemet hanterar bokningar, kunder, priser och fakturor. Det är byggt i Next.js 15.5 med Supabase som backend (för autentisering, databas, lagring och edge-functions).
Syftet är att automatisera hantering av kundregister (ägare och hundar), bokningar och tjänster, prisberäkning inklusive moms, rabatter och säsonger, samt fakturaunderlag och PDF-fakturor. Det stöder realtidsuppdateringar mellan personal och administratör.Varje företag (organisation) som använder systemet har egna priser, kunder och fakturor.

Teknisk struktur
Frontend är byggd i Next.js 15.5 + TypeScript med Tailwind CSS och ShadCN/UI för gränssnittet.Backend körs på Supabase (Postgres, Auth, Storage, Edge Functions) med realtidsuppdatering via Supabase Realtime Channels.PDF-fakturor genereras med PDFKit, QRCode och Stream-Buffers.Databasen använder RLS (Row Level Security).Autentisering hanteras med Supabase Auth Helpers för Next.js.Systemet kan driftsättas på Vercel eller Supabase Edge Runtime.
Triggers används för att automatiskt sätta rätt organisation och användare på fakturor, uppdatera totalpris vid prisändringar och beräkna fakturaradernas belopp automatiskt.

Kodstruktur
Appen har en tydlig struktur med komponentmappar för UI och delade komponenter.Logik för prissättning finns i lib/pricing.ts och Supabase-klienten i lib/supabaseClient.ts.API-routen api/pdf/route.ts hanterar PDF-generering.Sidor finns för hunddagis, pensionat, frisör, fakturor och priser.
Dataflöde:Hundägare → Hundprofil → Bokning/Abonnemang → Fakturaunderlag → PDF-faktura → Rapportering
Alla delar är kopplade via organisationens ID och uppdateras i realtid.

Fakturasidan
Fakturasidan hanterar alla fakturor i systemet och används av administratör.Den hämtar data från Supabase, kopplar fakturor till ägare och företag, lyssnar i realtid på ändringar, kan skapa nya fakturor och generera PDF-fakturor via en Edge-function.Systemet visar totalsummor för betalda, obetalda och totala fakturor samt har en felsökningspanel som sparar händelser lokalt. Realtidskanaler används för att uppdatera fakturor direkt.

Prissidan
Prissidan används för att administrera priser för olika verksamhetstyper (dagis, pensionat, frisör). Varje företag kan själv sätta sina egna priser och uppdatera dem vid behov.
Priser beräknas i pricing.ts genom flera steg:
Hämtning av grundpris för organisationen.
Beräkning av pris baserat på hundens storlek (mankhöjd).
Beräkning av antal nätter eller dagar.
Tillägg för helger, högtider eller säsonger.
Kundunika rabatter.
Påslag av moms enligt företagets inställningar.
Resultatet är ett totalpris inklusive moms.

Hunddagis, Hundpensionat och Hundfrisör
Alla tre sidor delar samma struktur och använder Supabase-klienter med autentisering.Hunddagis använder bokningar per dag, fakturering sker månatligen.Hundpensionat fakturerar per natt och inkluderar säsongs- och högtidstillägg samt rabatter.Hundfrisör fakturerar per tjänst och kan ha flera fakturarader (t.ex. bad, kloklipp).
Realtidskoppling används för att synkronisera bokningar och fakturor mellan användare.

Supabase-klienter och imports
På klientsidan används createClientComponentClient och på serversidan createClient.Vanliga UI-komponenter importeras från ShadCN-biblioteket (t.ex. knappar, inputs, accordions).

Fakturagenerering (PDF)
PDF-fakturor genereras via en Edge Function (app/api/pdf/route.ts) som hämtar fakturadata, lägger till företagslogotyp och kunduppgifter, skapar QR-kod för betalning via Swish eller bankgiro, och exporterar resultatet till Supabase Storage.

Felsökning och loggar
Systemet sparar felsökningsloggar i localStorage och visar dem via en Accordion-komponent. Alla loggar innehåller tidsstämpel, typ, meddelande och detaljer.

Diagram (dataflöde)
Hundägare → Hund → Bokning → Faktura → PDF/StorageRabatter, priser och moms hämtas längs vägen.

Rekommenderad utvecklingsprocess
Börja med Hunddagis (enklast att testa).
Kopiera till Hundpensionat (ändra tidslogik till nätter).
Kopiera till Hundfrisör (använd services i stället för bookings).
Testa hela fakturaflödet.
Lägg till realtidskanaler och verifiera triggers.
Lägg till UI-förbättringar som färgkodning, filtrering och PDF-statusar.

Säkerhet och GDPR
Alla data isoleras per organisation.RLS ser till att användare bara ser sina egna data.Fakturor och kundinformation hanteras enligt GDPR, och PDF-fakturor kan raderas automatiskt efter viss tid.

Vidareutveckling
Förslag är bland annat automatisk påminnelse för obetalda fakturor, integration med ekonomisystem (Fortnox, Bokio, Visma), abonnemangs- och fakturahantering via Stripe, statistikmodul samt export till CSV/Excel.

Faktura – struktur och funktion
Fakturasidan hämtar alla fakturor från databasen med relationer till kund och organisation.Den beräknar totalsummor, filtrerar på namn, kundnummer eller e-post och genererar PDF:er via Edge-function.Faktura­statusar är färgkodade: utkast (grå), skickad (blå), betald (grön) och makulerad (röd).

Prissättning och rabattlogik
Företagen sätter egna priser. För hunddagis finns heltid, deltid och dagshund. Rabatter kan ges till specifika kunder, till exempel familjer med flera hundar.EditDogModal innehåller fält för kommentarer till ekonomi – t.ex. om kunden ska avslutas eller få avdrag.
För pensionat finns separata inställningar för vardag, helg och högtider.Organisationen kan ange prispåslag per datum (lov, storhelger, säsonger) och skapa regler för flerhunds- och långtidsrabatter.

Fakturaunderlag
Endast relevanta poster (abonnemang, tillägg, merförsäljning) skickas till ekonomi. Kommentarer från EditDogModal visas för den ekonomiansvarige vid fakturering.

Resultat av prisberäkning
Varje prisberäkning returnerar en fullständig uppdelning med delmoment (grundpris, logi, tillägg, moms, totalt).Supabase hanterar triggers för att automatiskt sätta organisation och användare.Felhantering sker med try/catch, toast och logDebug.Loggar sparas lokalt och kan visas via felsökningspanelen.

Sammantaget fungerar företagssidan som kärnan, men det finns några områden där konsistensen kan stärkas ytterligare:Koppling av hunddagis, pensionat, frisör m.m. till företaget
I dagsläget verkar varje verksamhetsdel knytas till företaget främst genom organisations-id samt namngivning. Alla kunder (ägare) och deras hundar är gemensamma för företaget oavsett om de nyttjar dagis, pensionat eller andra tjänster – de ligger i tabellerna owners och dogs med org_id som binder dem till företaget. Detta innebär t.ex. att en hund kan ha både ett dagisabonnemang och bokningar på pensionatet under samma company record, istället för duplicerade kundregister per verksamhet. Det är korrekt enligt design: företaget är navet som alla delar relaterar till.
Däremot saknas i nuläget en tydlig strukturell markör i databasen för att särskilja olika verksamheter inom samma företag. I fakturavyn filtreras fakturor på “dagis”, “pensionat” eller “frisör” genom att kolla om organisationsnamnet innehåller ordet dagis, pensionat respektive frisör. Detta antyder att man idag kanske har separata organisationsposter per verksamhet (t.ex. “ABC Hunddagis” som en org och “ABC Hundpensionat” som en annan org under samma koncern), eller att namngivningen används som provisorisk kategori. En mer robust lösning är att koppla verksamhetstyper explicit till företaget. Här finns ett par alternativ att överväga:
Branch-tabell per org: Inför en tabell branches som representerar underenheter eller verksamhetsgrenar inom en organisation. Varje branch har t.ex. ett namn, en typ (dagis/pensionat/frisör) och refererar till org_id. Då kan t.ex. en faktura istället kopplas till både org_id och branch_id, vilket möjliggör filtrering per branch utan att förlita sig på namnsträngar. Om företaget “ABC Hundcenter” har två grenar (en dagis-branch och en frisör-branch), så är båda branch-posterna kopplade till samma org men med olika id och typ. Fakturor, bokningar m.m. kan då märkas med branch_id för att indikera vilken del av verksamheten det gäller. Detta designmönster skapar en tydligare koppling: all data är knuten till en organisation, men kan kategoriseras per branch.

Tydligare koppling av verksamhetstyper: Byt ut den nuvarande filtreringen baserat på org-namn mot en strukturerad lösning. Implementera antingen en branches-tabell eller lägg till ett service_type-fält på relevanta rader. Detta gör koden mer robust och datamodellen mer flexibel. Med branch-id på fakturor kan vi direkt filtrera WHERE invoices.branch_id = X istället för att tolka namn. Det underlättar också om ett företag byter namn – filtreringen ska inte baseras på hårdkodade strängar.
Enhetlig namngivning av foreign keys: Se över kolumnnamn som dogs_id i extra_service. För konsistens bör foreign keys generellt döpas {entitet}\_id i singular. I de flesta tabeller används redan singular (t.ex. owner_id, dog_id, branch_id), så justera avvikare om möjligt. Detta är mest stylistiskt, men minskar förvirring för framtida utvecklare.
Org-id i all ny data: Säkerställ att alla tabeller som innehåller organisationsspecifik data faktiskt har en org-kolumn och använder triggers/defaults för att sätta den. Om någon tabell förbisetts (t.ex. om branches initialt saknade org_id, eller dog_journal saknar org_id), bör det åtgärdas. I de fall man väljer att inte ha org_id (t.ex. kanske dog_journal), måste i stället RLS-policyn strikt använda join via hunden för att skydda datat. Men enklast är att även journalposter har org_id som sätts via triggern (t.ex. NEW.org_id := (SELECT org_id FROM dogs WHERE id = NEW.dog_id)). Då kan man ha samma policy-mönster på journaler.
Korrekt användning av Supabase-auth i frontend: I koden för att spara prislistor ser det ut som att man använder user.id som org_id vid insert. Detta är sannolikt inte korrekt om en användare inte har samma UUID som org-id. Här bör frontenden istället hämta aktuell org för användaren. Om ni har en profil i databasen med org_id, kan ni hämta den vid inloggning och lagra i er AuthContext. Exempelvis kan AuthContext innehålla currentOrgId, så kan man göra supabase.from('price_lists').insert({ org_id: currentOrgId, ... }). I annat fall får triggers rädda situationen – men det är bättre att koden semantiskt avspeglar att det är org som avses, inte user. Detta blir särskilt viktigt när ni stödjer flera användare per org: då kan user A (admin) och user B (personal) båda ha org_id X. De borde båda spara prislistor på org X. Att då sätta org_id = user.id skulle splitta datat. Så, refaktorera där det behövs för att använda företags-ID rätt.
Användar- och rollhantering: Om det inte redan finns, överväg att införa en membership tabell (t.ex. user_org_roles med user_id, org_id, role). Det verkar som ni hittills kanske antar att en användare = en org (vilket förenklar triggersna). Men om t.ex. en anställd ska kunna vara kopplad till två olika org-konton, behövs en sådan struktur. Även om det inte är ett krav nu, kan en membership-tabell framtidssäkra systemet. För närvarande kan ni ändå fortsätta med antagandet en-till-en, men ha i åtanke att Auth.user.id inte bör likställas med org.id. Bättre då att ha profiles tabell med user_id, org_id, role och trigga in org_id i JWT vid login.
Synkronisering mellan abonnemangstabell och hundar: I DogDraft finns det både fält som subscription, startdate, enddate på hund och en separat subscriptions-array. Detta kan leda till dubbellagring av abonnemangsinfo (både i dogs och i subscriptions-tabellen). Fundera på om hundtabellens fält behövs, eller om de kan ersättas helt av att alltid slå upp senaste aktiva subscription. Kanske används de som cache för snabb filtrering/sökning (t.ex. hundens etikett “Heltid” direkt i listor). Det är okej, men då måste man vid ändringar se till att uppdatera båda ställena. Ett förslag är att använda en vy eller en funktion för att hämta hund med dess aktiva abonnemang så att man undviker mismatch. Datamodellen i övrigt för abonnemang ser bra ut – varje subscription rad kopplas via dog_id (och bör triggas med org_id). Koden visar hur nya subcriptions inserteras vid hundregistrering, men kontrollera även här att det inte sker dubblettskapande vid varje uppdatering.
Fakturagenerering och underlag: Slutligen, formalisera hur underlagen itas med på faktura. Det kan vara bra att införa en kolumn på underlagstabellerna för att markera att de fakturerats. Annars riskerar man att fakturera samma post flera gånger om man kör generering flera gånger eller om en hundägare har ett tillägg som löper. Exempel: en extra_service(“Valptillägg”) kanske ska debiteras varje månad tills hunden är viss ålder – då kan man antingen lägga in det varje månad, eller lägga in en gång och markera period. Oavsett, se till att fakturaprocessen antingen konsumerarunderlagen (sätter koppling till faktura) eller är idempotent per period. Detta hör mer till affärslogik, men är värt att nämna eftersom företagsdatat är navet: man vill inte duplicera debiteringar inom samma org.
Sammanfattningsvis bör koden och datamodellen justeras för att fullt ut spegla att organisationen är det centraliserande navet. Alla komponenter – hunddagis, pensionat, hundfrisör, användare, prislistor, fakturor – ska relatera till på ett entydigt sätt. De befintliga triggers och RLS-polices ska utökas till nya tabeller och kontrolleras så att inga luckor finns. Med tydliga relationer (foreign keys) och enhetlig namngivning blir koden enklare att underhålla och mindre felbenägen. Genom att införa explicita kopplingar för verksamhetstyper (t.ex. branches) ökar systemets skalbarhet ifall ett företag expanderar med nya tjänsteområden. Slutligen förstärks säkerheten och multi-tenancy-känslan genom att alltid använda företagsinformationen (org_id) för att avgränsa dataåtkomst, vilket tryggar både fakturering, behörighetsstyrning och statistikframtagning för varje kundföretag i DogPlanner-plattformen
GDPR & säkerhetsåtgärder:
Krypterad datakommunikation (TLS 1.3)
Rollbaserad åtkomst (RLS i Supabase)
Automatisk rensning av känslig data efter 24 månader
Möjlighet för företag att exportera eller radera sina egna data
Säker lagring av fakturor i EU-baserade datacenter
Det är viktigt att hemsidan alltid följer svensk lagstiftning och GDPR.

Mina priser

Varje konto ska vara unikt och alla måste kunna skriva sina egna priser.

Därför är denna en sida där dom själva kan skriva i vad dagisabonemang heltid, deltid 2, deltid 3, kloklipp, bad, tasstrim, tandvård, öronens, mat på dagis, valptillägg, extra och vad extradagar kostar.
Detta ska automatiskt komma in på hundarnas profiler när dom lägger till tex ett kloklipp just den månaden.
Sedan ska all information som är lagt den månaden automatiskt skickas över till sidan som heter fakturor som ska vara en sammanställning på vad deras dagiskunder ska betala. Jag vill bara poängtera att vi bara sammanställer fakturorna, dom skickas inte ifrån oss till kunderna utan dagisägarna får själva använda valfritt fakturasystem som passar dom.

Om dom väljer att ändra sina priser på den här sidan så ändras priserna för den aktuella månaden och framåt.

Det vore därför bra om det finns en text längst ned där det tex står (dina priser ändrades senast detta datum).

Priserna härifrån hämtas och sammanställs sedan i invoices.html där en sammanställning på fakturorna görs.

Trycker man på tillbaka knappen så ska man komma till dashboard.html
