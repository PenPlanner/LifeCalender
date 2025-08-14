# LifeCalendar

En dynamisk veckokalender med Withings-integration, träningsdata, to-do-listor och kosttillskottsloggning. Allt styrs via en adminpanel för maximal flexibilitet.

## Funktioner

### Veckovy (Användarsidan)
- **Fullskärmsvy** med 7 kolumner (måndag-söndag)
- **Navigation** mellan veckor med knapp för "Gå till idag"
- **Progressindikatorer** för dagliga mål:
  - Steg
  - Cardio-minuter  
  - Kalorier ut
  - Maxpuls (valbar)
  - Sömn (valbar)
- **Träningspass** med drag-and-drop för omschemaläggning
- **To-do-listor** per dag med real-time synkronisering
- **Kosttillskottsloggning** med visuella ikoner

### Adminpanel
- **Withings-integration**: Säker hantering av API-credentials
- **Modulinställningar**: Aktivera/inaktivera funktioner
- **Fältinställningar**: Välj vilka Withings-data som ska visas
- **Mål**: Anpassning av dagliga mål för progressbars
- **OAuth-testning**: Testa Withings-anslutning

## Teknikstack

### Frontend
- **React 18** med TypeScript
- **Vite** för snabb utveckling och build
- **Tailwind CSS** för styling
- **React Router** för navigation
- **@dnd-kit** för drag-and-drop
- **Lucide React** för ikoner
- **date-fns** för datumhantering

### Backend
- **PocketBase** för databas och real-time features
- **PHP 8.3** för API-endpoints och Withings-integration
- **Apache** webbserver med reverse proxy

### Säkerhet
- Krypterad lagring av API-credentials
- CORS-hantering
- Säkra HTTP-headers
- Ingen exponering av känslig data till frontend

## Installation

### 1. Klona och installera beroenden
```bash
git clone <repository-url>
cd LifeCalender
npm install
```

### 2. Konfigurera miljövariabler
```bash
cp .env.example .env
# Redigera .env med dina inställningar
```

### 3. Starta med Docker (rekommenderat)
```bash
docker-compose up -d
```

Detta startar:
- PocketBase på port 8090
- PHP API på port 8080  
- Frontend på port 3000
- Cron-jobb för datasynkronisering

### 4. Manuell installation

#### PocketBase
```bash
# Ladda ner PocketBase från https://pocketbase.io/
./pocketbase serve --dir=./pocketbase/pb_data --migrationsDir=./pocketbase/pb_migrations --hooksDir=./pocketbase/pb_hooks
```

#### PHP API
```bash
# Konfigurera Apache att servera backend-mappen
# Aktivera mod_rewrite och mod_headers
# Kör cron-jobbet för datasynkronisering:
*/2 * * * * cd /path/to/backend && php cron/refresh-tokens.php
```

#### Frontend
```bash
npm run dev
```

## Konfiguration

### Withings API-setup
1. Skapa ett utvecklarkonto på https://developer.withings.com/
2. Registrera din applikation
3. Kopiera Client ID och Client Secret till adminpanelen
4. Sätt Redirect URI till: `http://localhost:3000/auth/withings/callback`

### Adminpanel
Gå till `/admin` för att konfigurera:
- Withings API-credentials
- Aktivera/inaktivera moduler  
- Sätta dagliga mål
- Välja vilka datafält som ska visas

## Utveckling

### Projektstruktur
```
LifeCalender/
├── src/                 # Frontend React-kod
│   ├── components/      # Återanvändbara komponenter
│   ├── pages/          # Sidor (WeeklyCalendar, AdminPanel)
│   ├── services/       # API-kommunikation
│   ├── types/          # TypeScript-definitioner
│   └── utils/          # Hjälpfunktioner
├── backend/            # PHP backend
│   ├── api/            # API-endpoints
│   ├── src/            # PHP-klasser
│   ├── config/         # Konfiguration
│   └── cron/           # Cron-jobb
├── pocketbase/         # PocketBase-konfiguration
│   ├── pb_migrations/  # Databasmigrationer
│   └── pb_hooks/       # PocketBase hooks
└── docker/             # Docker-konfiguration
```

### API-endpoints
- `GET /api/admin/settings` - Hämta appinställningar
- `POST /api/admin/settings` - Uppdatera appinställningar  
- `POST /api/admin/withings/credentials` - Spara Withings API-credentials
- `GET /api/withings/week?start=YYYY-MM-DD` - Hämta veckodata
- `POST /api/todos` - Skapa to-do
- `PATCH /api/todos/:id` - Uppdatera to-do
- `DELETE /api/todos/:id` - Ta bort to-do
- `POST /api/supplements/toggle` - Växla kosttillskott

### Databas-schema
Se `pocketbase/pb_migrations/1734016800_init_collections.js` för fullständigt schema.

### Kommande funktioner
- PDF-export av veckosammanfattningar
- Fler Withings-datapunkter (vikt, kroppsfett)
- Mål- och streak-system
- Mobilapp med React Native

## Säkerhet

- All känslig data krypteras innan lagring
- API-credentials exponeras aldrig till frontend
- CORS-konfiguration för säker API-åtkomst
- Validering på både frontend och backend

## Support

För frågor eller buggar, skapa ett issue i projektets GitHub-repository.