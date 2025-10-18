export default function Terms() {
  return (
    <section className="features" style={{ maxWidth: 900, textAlign: "left" }}>
      <h2 style={{ color: "#2c7a4c" }}>Våra villkor</h2>

      <p>
        <b>Testperiod & betalning</b>
      </p>
      <ul>
        <li>
          DogPlanner kan användas kostnadsfritt i 2 månader per
          organisationsnummer.
        </li>
        <li>Efter testperioden faktureras månadsavgiften i förskott.</li>
        <li>
          Det är inte tillåtet att nyttja flera testperioder på samma
          organisationsnummer.
        </li>
      </ul>

      <p>
        <b>Ansvar & GDPR</b>
      </p>
      <ul>
        <li>
          Du ansvarar för all information som registreras och att den hanteras
          enligt gällande lagar, inklusive GDPR.
        </li>
        <li>
          DogPlanner skickar inte fakturor till era kunder; tjänsten visar
          endast sammanställningar och underlag.
        </li>
      </ul>

      <p>
        <b>Konto, paus & radering</b>
      </p>
      <ul>
        <li>
          Abonnemang kan pausas när som helst. Vid paus låses kontot för
          ändringar tills abonnemanget återaktiveras.
        </li>
        <li>
          Önskar du radera hela kontot kontaktar du DogPlanner via e-post.
          Raderingen är permanent och kan inte ångras.
        </li>
      </ul>

      <p>
        <b>Begränsning av ansvar</b>
      </p>
      <ul>
        <li>
          DogPlanner ersätter inte kostnader för felaktiga beräkningar, förlorad
          information eller obehörig åtkomst till följd av händelser utanför vår
          kontroll.
        </li>
      </ul>

      <p style={{ opacity: 0.8, marginTop: 16 }}>
        Genom att skapa ett konto godkänner du dessa villkor. Har du frågor,
        kontakta oss gärna.
      </p>
    </section>
  );
}
