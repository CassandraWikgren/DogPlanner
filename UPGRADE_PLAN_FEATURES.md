# 🚀 AVANCERADE FUNKTIONER

## 📊 DASHBOARD UPPGRADERINGAR

### Real-time statistik

```tsx
// Lägg till i dashboard
const DashboardStats = () => {
  return (
    <div className="stats-grid">
      <StatCard
        title="Hundar idag"
        value={todayDogs}
        change="+3 från igår"
        icon={PawPrint}
        color="green"
      />
      <StatCard
        title="Intäkter denna månad"
        value="45,200 kr"
        change="+12% från förra månaden"
        icon={TrendingUp}
        color="blue"
      />
      <StatCard
        title="Nya kunder"
        value="8"
        change="Denna vecka"
        icon={Users}
        color="purple"
      />
    </div>
  );
};
```

### Aktivitetsfeed

```tsx
const ActivityFeed = () => {
  const activities = [
    { type: "new_dog", message: "Bella registrerades", time: "2 min sedan" },
    { type: "checkout", message: "Max checkade ut", time: "15 min sedan" },
    { type: "payment", message: "Faktura 1234 betalades", time: "1h sedan" },
  ];

  return (
    <Card>
      <CardHeader>
        <h3>Senaste aktivitet</h3>
      </CardHeader>
      <CardContent>
        {activities.map((activity) => (
          <ActivityItem key={activity.id} {...activity} />
        ))}
      </CardContent>
    </Card>
  );
};
```

## 🔔 NOTIFIKATIONSSYSTEM

### Push-notifikationer

- **Nya bokningar** kommer in
- **Betalningar** som förfaller
- **Hundar** som inte hämtats
- **Personal** som är sen

### Email-automatisering

```tsx
const EmailTemplates = {
  welcomeOwner: {
    subject: "Välkommen till {dagisnamn}!",
    template: "welcome-owner.html",
  },
  paymentReminder: {
    subject: "Påminnelse: Faktura förfaller",
    template: "payment-reminder.html",
  },
  dogNotPickedUp: {
    subject: "Glömt att hämta {hundnamn}?",
    template: "pickup-reminder.html",
  },
};
```

## 📱 MOBILAPP-FUNKTIONER

### PWA (Progressive Web App)

```json
// manifest.json
{
  "name": "DogPlanner",
  "short_name": "DogPlanner",
  "start_url": "/dashboard",
  "display": "standalone",
  "background_color": "#2c7a4c",
  "theme_color": "#2c7a4c",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    }
  ]
}
```

### Offline-funktionalitet

- **Cache** viktiga data lokalt
- **Sync** när connection återkommer
- **Offline banner** när disconnected

## 📸 MULTIMEDIA

### Hundprofil-foton

```tsx
const DogPhotoUpload = ({ dogId }) => {
  const [uploading, setUploading] = useState(false);

  const uploadPhoto = async (file) => {
    setUploading(true);
    const { data, error } = await supabase.storage
      .from("dog-photos")
      .upload(`${dogId}/${Date.now()}.jpg`, file);
    setUploading(false);
  };

  return (
    <div className="photo-upload">
      <input type="file" onChange={uploadPhoto} accept="image/*" />
      {uploading && <Spinner />}
    </div>
  );
};
```

### Bildgalleri för varje hund

- **Flera foton** per hund
- **Före/efter** för frisörbesök
- **Thumbnails** i listor
- **Fullscreen viewer**
