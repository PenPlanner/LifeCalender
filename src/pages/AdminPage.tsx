import { useState, useEffect } from 'react';
import { Save, Key, Activity, Heart, Moon, Scale, RefreshCw } from 'lucide-react';

interface WithingsConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  accessToken?: string;
  refreshToken?: string;
  userId?: string;
  isConnected: boolean;
}

interface HealthDataConfig {
  // Scales Metrics
  weight: boolean;
  fatMass: boolean;
  muscleMass: boolean;
  bmi: boolean;
  basalMetabolicRate: boolean;
  
  // Activity Metrics  
  steps: boolean;
  distance: boolean;
  calories: boolean;
  activeMinutes: boolean;
  vo2Max: boolean;
  
  // Heart Metrics
  restingHeartRate: boolean;
  continuousHeartRate: boolean;
  heartRateVariability: boolean;
  
  // Sleep Metrics
  sleepDuration: boolean;
  sleepEfficiency: boolean;
  deepSleep: boolean;
  lightSleep: boolean;
  remSleep: boolean;
  sleepScore: boolean;
  
  // Blood Pressure
  systolicBP: boolean;
  diastolicBP: boolean;
  
  // Workouts/Training
  workouts: boolean;
}

const defaultHealthConfig: HealthDataConfig = {
  // Scales - Default enabled
  weight: true,
  fatMass: false,
  muscleMass: false,
  bmi: true,
  basalMetabolicRate: false,
  
  // Activity - Default enabled
  steps: true,
  distance: true,
  calories: true,
  activeMinutes: true,
  vo2Max: false,
  
  // Heart - Default enabled
  restingHeartRate: true,
  continuousHeartRate: false,
  heartRateVariability: false,
  
  // Sleep - Default disabled
  sleepDuration: false,
  sleepEfficiency: false,
  deepSleep: false,
  lightSleep: false,
  remSleep: false,
  sleepScore: false,
  
  // Blood Pressure - Default disabled
  systolicBP: false,
  diastolicBP: false,
  
  // Workouts - Default enabled
  workouts: true,
};

export function AdminPage() {
  const [activeTab, setActiveTab] = useState<'connection' | 'data-selection'>('connection');
  const [withingsConfig, setWithingsConfig] = useState<WithingsConfig>({
    clientId: '',
    clientSecret: '',
    redirectUri: `${window.location.origin}/api/withings/callback`,
    isConnected: false,
  });
  const [healthConfig, setHealthConfig] = useState<HealthDataConfig>(defaultHealthConfig);
  const [isSaving, setIsSaving] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');

  useEffect(() => {
    // Load saved configuration from localStorage
    const savedWithingsConfig = localStorage.getItem('withings-config');
    const savedHealthConfig = localStorage.getItem('health-data-config');
    
    if (savedWithingsConfig) {
      setWithingsConfig(JSON.parse(savedWithingsConfig));
    }
    if (savedHealthConfig) {
      setHealthConfig(JSON.parse(savedHealthConfig));
    }
  }, []);

  const handleWithingsConfigChange = (field: keyof WithingsConfig, value: string) => {
    setWithingsConfig(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleHealthConfigChange = (field: keyof HealthDataConfig, value: boolean) => {
    setHealthConfig(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const saveConfiguration = async () => {
    setIsSaving(true);
    try {
      // Save to localStorage (in real app, save to backend)
      localStorage.setItem('withings-config', JSON.stringify(withingsConfig));
      localStorage.setItem('health-data-config', JSON.stringify(healthConfig));
      
      // Simulate save delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Show success message
      alert('Konfiguration sparad!');
    } catch (error) {
      alert('Fel vid sparande av konfiguration');
    } finally {
      setIsSaving(false);
    }
  };

  const connectToWithings = () => {
    if (!withingsConfig.clientId || !withingsConfig.clientSecret) {
      alert('Fyll i Client ID och Client Secret först');
      return;
    }
    
    setConnectionStatus('connecting');
    
    // Save current config before OAuth
    localStorage.setItem('withings-config', JSON.stringify(withingsConfig));
    
    // OAuth 2.0 flow URL for Withings
    const authUrl = new URL('https://account.withings.com/oauth2_user/authorize2');
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('client_id', withingsConfig.clientId);
    authUrl.searchParams.append('redirect_uri', withingsConfig.redirectUri);
    authUrl.searchParams.append('scope', 'user.info,user.metrics,user.activity,user.sleepevents');
    authUrl.searchParams.append('state', 'lifecalendar-auth');
    
    // Redirect to Withings OAuth (full page redirect instead of popup)
    window.location.href = authUrl.toString();
  };

  const disconnectFromWithings = () => {
    setWithingsConfig(prev => ({
      ...prev,
      accessToken: undefined,
      refreshToken: undefined,
      userId: undefined,
      isConnected: false,
    }));
    setConnectionStatus('disconnected');
  };

  const testConnection = async () => {
    if (!withingsConfig.isConnected) {
      alert('Anslut till Withings först');
      return;
    }
    
    setConnectionStatus('connecting');
    
    try {
      // Simulate API test call
      await new Promise(resolve => setTimeout(resolve, 2000));
      setConnectionStatus('connected');
      alert('Anslutning fungerar! ✅');
    } catch (error) {
      setConnectionStatus('error');
      alert('Anslutning misslyckades! ❌');
    }
  };

  return (
    <div className="min-h-screen bg-base-200 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-base-100 rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-2xl font-bold text-base-content mb-2">
            🔧 Admin Panel - LifeCalendar
          </h1>
          <p className="text-base-content/70">
            Konfigurera din Withings-integration och välj vilka hälsodata som ska visas
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="tabs tabs-lifted mb-6">
          <button 
            className={`tab tab-lg ${activeTab === 'connection' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('connection')}
          >
            <Key size={16} className="mr-2" />
            Withings Anslutning
          </button>
          <button 
            className={`tab tab-lg ${activeTab === 'data-selection' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('data-selection')}
          >
            <Activity size={16} className="mr-2" />
            Dataval
          </button>
        </div>

        {/* Tab Content */}
        <div className="bg-base-100 rounded-lg shadow-sm p-6">
          {activeTab === 'connection' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Withings API-konfiguration</h2>
                <div className={`badge badge-lg ${
                  connectionStatus === 'connected' ? 'badge-success' : 
                  connectionStatus === 'connecting' ? 'badge-warning' : 
                  connectionStatus === 'error' ? 'badge-error' : 'badge-neutral'
                }`}>
                  {connectionStatus === 'connected' ? '🟢 Ansluten' :
                   connectionStatus === 'connecting' ? '🟡 Ansluter...' :
                   connectionStatus === 'error' ? '🔴 Fel' : '⚫ Frånkopplad'}
                </div>
              </div>

              {/* API Configuration Form */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">Client ID</span>
                    </label>
                    <input
                      type="text"
                      className="input input-bordered"
                      placeholder="Ditt Withings Client ID"
                      value={withingsConfig.clientId}
                      onChange={(e) => handleWithingsConfigChange('clientId', e.target.value)}
                    />
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">Client Secret</span>
                    </label>
                    <input
                      type="password"
                      className="input input-bordered"
                      placeholder="Ditt Withings Client Secret"
                      value={withingsConfig.clientSecret}
                      onChange={(e) => handleWithingsConfigChange('clientSecret', e.target.value)}
                    />
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">Redirect URI</span>
                    </label>
                    <input
                      type="url"
                      className="input input-bordered"
                      placeholder="OAuth callback URL"
                      value={withingsConfig.redirectUri}
                      onChange={(e) => handleWithingsConfigChange('redirectUri', e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="card bg-base-200">
                    <div className="card-body">
                      <h3 className="card-title text-lg">📋 Instruktioner</h3>
                      <ol className="list-decimal list-inside space-y-2 text-sm">
                        <li>Gå till <a href="https://developer.withings.com/" target="_blank" className="link link-primary">Withings Developer Portal</a></li>
                        <li>Skapa en ny applikation</li>
                        <li>Kopiera Client ID och Client Secret hit</li>
                        <li>Lägg till Redirect URI i din Withings-app</li>
                        <li>Klicka "Anslut till Withings" nedan</li>
                      </ol>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {!withingsConfig.isConnected ? (
                      <button 
                        className="btn btn-primary btn-block"
                        onClick={connectToWithings}
                        disabled={connectionStatus === 'connecting'}
                      >
                        {connectionStatus === 'connecting' ? (
                          <>
                            <span className="loading loading-spinner loading-sm"></span>
                            Ansluter...
                          </>
                        ) : (
                          <>
                            <Key size={16} />
                            Anslut till Withings
                          </>
                        )}
                      </button>
                    ) : (
                      <div className="space-y-2">
                        <button 
                          className="btn btn-success btn-block"
                          onClick={testConnection}
                          disabled={connectionStatus === 'connecting'}
                        >
                          <RefreshCw size={16} />
                          Testa anslutning
                        </button>
                        <button 
                          className="btn btn-error btn-outline btn-block"
                          onClick={disconnectFromWithings}
                        >
                          Koppla från
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'data-selection' && (
            <div className="space-y-8">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-base-content mb-2">Hälsodata Konfiguration</h2>
                <p className="text-base-content/70 max-w-2xl mx-auto">
                  Anpassa vilka hälsomätvärden som ska visas i din kalender. Välj från våra kategoriserade alternativ nedan.
                </p>
              </div>

              {/* Stats Cards */}
              <div className="grid md:grid-cols-4 gap-4">
                <div className="stats stats-vertical lg:stats-horizontal shadow">
                  <div className="stat">
                    <div className="stat-figure text-primary">
                      <Activity size={24} />
                    </div>
                    <div className="stat-title">Aktiverade</div>
                    <div className="stat-value text-primary">
                      {Object.values(healthConfig).filter(Boolean).length}
                    </div>
                    <div className="stat-desc">av {Object.keys(healthConfig).length} mätvärden</div>
                  </div>
                </div>
                
                <div className="stats stats-vertical lg:stats-horizontal shadow">
                  <div className="stat">
                    <div className="stat-figure text-secondary">
                      <Scale size={24} />
                    </div>
                    <div className="stat-title">Kroppsmått</div>
                    <div className="stat-value text-secondary">
                      {['weight', 'fatMass', 'muscleMass', 'bmi', 'basalMetabolicRate'].filter(key => healthConfig[key as keyof HealthDataConfig]).length}
                    </div>
                    <div className="stat-desc">av 5 alternativ</div>
                  </div>
                </div>

                <div className="stats stats-vertical lg:stats-horizontal shadow">
                  <div className="stat">
                    <div className="stat-figure text-accent">
                      <Heart size={24} />
                    </div>
                    <div className="stat-title">Hjärta</div>
                    <div className="stat-value text-accent">
                      {['restingHeartRate', 'continuousHeartRate', 'heartRateVariability', 'systolicBP', 'diastolicBP'].filter(key => healthConfig[key as keyof HealthDataConfig]).length}
                    </div>
                    <div className="stat-desc">av 5 alternativ</div>
                  </div>
                </div>

                <div className="stats stats-vertical lg:stats-horizontal shadow">
                  <div className="stat">
                    <div className="stat-figure text-info">
                      <Moon size={24} />
                    </div>
                    <div className="stat-title">Sömn</div>
                    <div className="stat-value text-info">
                      {['sleepDuration', 'sleepEfficiency', 'deepSleep', 'lightSleep', 'remSleep', 'sleepScore'].filter(key => healthConfig[key as keyof HealthDataConfig]).length}
                    </div>
                    <div className="stat-desc">av 6 alternativ</div>
                  </div>
                </div>
              </div>

              <div className="divider">
                <span className="text-base-content/60">Konfigurera Kategorier</span>
              </div>

              <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-8">
                {/* Scales Metrics */}
                <div className="card bg-gradient-to-br from-secondary/5 to-secondary/10 border border-secondary/20 shadow-lg hover:shadow-xl transition-shadow">
                  <div className="card-body p-6">
                    <h3 className="card-title text-xl text-secondary mb-4">
                      <div className="p-2 bg-secondary/10 rounded-lg">
                        <Scale size={24} />
                      </div>
                      Våg & Kropp
                    </h3>
                    <p className="text-sm text-base-content/60 mb-4">
                      Mätvärden från smart våg och kroppsmätningar
                    </p>
                    <div className="space-y-3">
                      {[
                        { key: 'weight', label: 'Vikt (kg)', desc: 'Din aktuella kroppsvikt' },
                        { key: 'bmi', label: 'BMI', desc: 'Body Mass Index beräkning' },
                        { key: 'fatMass', label: 'Fettmassa (kg)', desc: 'Mängd kroppsfett i kilogram' },
                        { key: 'muscleMass', label: 'Muskelmassa (kg)', desc: 'Total muskelvikt' },
                        { key: 'basalMetabolicRate', label: 'Basalmetabolism', desc: 'Viloenergiförbrukning per dag' },
                      ].map(({ key, label, desc }) => (
                        <div key={key} className="flex items-center justify-between p-3 bg-base-100/50 rounded-lg hover:bg-base-100/70 transition-colors">
                          <div className="flex-1">
                            <div className="font-medium text-sm">{label}</div>
                            <div className="text-xs text-base-content/60">{desc}</div>
                          </div>
                          <input
                            type="checkbox"
                            className="checkbox checkbox-secondary"
                            checked={healthConfig[key as keyof HealthDataConfig]}
                            onChange={(e) => handleHealthConfigChange(key as keyof HealthDataConfig, e.target.checked)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Activity Metrics */}
                <div className="card bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 shadow-lg hover:shadow-xl transition-shadow">
                  <div className="card-body p-6">
                    <h3 className="card-title text-xl text-primary mb-4">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Activity size={24} />
                      </div>
                      Aktivitet & Träning
                    </h3>
                    <p className="text-sm text-base-content/60 mb-4">
                      Dagliga aktiviteter och träningsstatistik
                    </p>
                    <div className="space-y-3">
                      {[
                        { key: 'steps', label: 'Steg', desc: 'Antal steg per dag' },
                        { key: 'distance', label: 'Distans (km)', desc: 'Tillryggalagd sträcka' },
                        { key: 'calories', label: 'Kalorier', desc: 'Förbrända kalorier' },
                        { key: 'activeMinutes', label: 'Aktiva minuter', desc: 'Tid i måttlig/hög aktivitet' },
                        { key: 'vo2Max', label: 'VO2 Max', desc: 'Maximal syreupptagningsförmåga' },
                      ].map(({ key, label, desc }) => (
                        <div key={key} className="flex items-center justify-between p-3 bg-base-100/50 rounded-lg hover:bg-base-100/70 transition-colors">
                          <div className="flex-1">
                            <div className="font-medium text-sm">{label}</div>
                            <div className="text-xs text-base-content/60">{desc}</div>
                          </div>
                          <input
                            type="checkbox"
                            className="checkbox checkbox-primary"
                            checked={healthConfig[key as keyof HealthDataConfig]}
                            onChange={(e) => handleHealthConfigChange(key as keyof HealthDataConfig, e.target.checked)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Heart Metrics */}
                <div className="card bg-gradient-to-br from-accent/5 to-accent/10 border border-accent/20 shadow-lg hover:shadow-xl transition-shadow">
                  <div className="card-body p-6">
                    <h3 className="card-title text-xl text-accent mb-4">
                      <div className="p-2 bg-accent/10 rounded-lg">
                        <Heart size={24} />
                      </div>
                      Hjärta & Blodtryck
                    </h3>
                    <p className="text-sm text-base-content/60 mb-4">
                      Hjärt- och kärlhälsomätningar
                    </p>
                    <div className="space-y-3">
                      {[
                        { key: 'restingHeartRate', label: 'Vilopuls (bpm)', desc: 'Hjärtfrekvens i vila' },
                        { key: 'continuousHeartRate', label: 'Kontinuerlig puls', desc: 'Puls under dagen' },
                        { key: 'heartRateVariability', label: 'Pulsvariabilitet', desc: 'HRV-mätning för återhämtning' },
                        { key: 'systolicBP', label: 'Systoliskt BT (mmHg)', desc: 'Övre blodtrycksvärde' },
                        { key: 'diastolicBP', label: 'Diastoliskt BT (mmHg)', desc: 'Nedre blodtrycksvärde' },
                      ].map(({ key, label, desc }) => (
                        <div key={key} className="flex items-center justify-between p-3 bg-base-100/50 rounded-lg hover:bg-base-100/70 transition-colors">
                          <div className="flex-1">
                            <div className="font-medium text-sm">{label}</div>
                            <div className="text-xs text-base-content/60">{desc}</div>
                          </div>
                          <input
                            type="checkbox"
                            className="checkbox checkbox-accent"
                            checked={healthConfig[key as keyof HealthDataConfig]}
                            onChange={(e) => handleHealthConfigChange(key as keyof HealthDataConfig, e.target.checked)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Sleep Metrics */}
                <div className="card bg-gradient-to-br from-info/5 to-info/10 border border-info/20 shadow-lg hover:shadow-xl transition-shadow">
                  <div className="card-body p-6">
                    <h3 className="card-title text-xl text-info mb-4">
                      <div className="p-2 bg-info/10 rounded-lg">
                        <Moon size={24} />
                      </div>
                      Sömn & Vila
                    </h3>
                    <p className="text-sm text-base-content/60 mb-4">
                      Sömnkvalitet och viloanalys
                    </p>
                    <div className="space-y-3">
                      {[
                        { key: 'sleepDuration', label: 'Sömntid (h)', desc: 'Total sömntid per natt' },
                        { key: 'sleepEfficiency', label: 'Sömneffektivitet (%)', desc: 'Andel tid i sömn vs i säng' },
                        { key: 'sleepScore', label: 'Sömnpoäng', desc: 'Övergripande sömnkvalitetsbetyg' },
                        { key: 'deepSleep', label: 'Djupsömn (h)', desc: 'Tid i djup, återställande sömn' },
                        { key: 'lightSleep', label: 'Lättsömn (h)', desc: 'Tid i lätt sömnfas' },
                        { key: 'remSleep', label: 'REM-sömn (h)', desc: 'Tid i drömfasen' },
                      ].map(({ key, label, desc }) => (
                        <div key={key} className="flex items-center justify-between p-3 bg-base-100/50 rounded-lg hover:bg-base-100/70 transition-colors">
                          <div className="flex-1">
                            <div className="font-medium text-sm">{label}</div>
                            <div className="text-xs text-base-content/60">{desc}</div>
                          </div>
                          <input
                            type="checkbox"
                            className="checkbox checkbox-info"
                            checked={healthConfig[key as keyof HealthDataConfig]}
                            onChange={(e) => handleHealthConfigChange(key as keyof HealthDataConfig, e.target.checked)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Workouts/Training */}
              <div className="card bg-gradient-to-br from-warning/5 to-warning/10 border border-warning/20 shadow-lg hover:shadow-xl transition-shadow lg:col-span-2 xl:col-span-3">
                <div className="card-body p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="card-title text-xl text-warning">
                      <div className="p-2 bg-warning/10 rounded-lg">
                        <Activity size={24} />
                      </div>
                      Träningspass & Workouts
                    </h3>
                    <div className="badge badge-warning badge-lg">
                      {healthConfig.workouts ? 'Aktiverad' : 'Inaktiverad'}
                    </div>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm text-base-content/70 mb-4">
                        Aktivera för att visa alla träningspass och workouts från Withings-appen eller synkroniserade från andra fitness-appar.
                      </p>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-4 bg-base-100/50 rounded-lg">
                          <div className="flex-1">
                            <div className="font-medium">Träningspass från Withings</div>
                            <div className="text-xs text-base-content/60 mt-1">
                              Inkluderar alla registrerade träningsaktiviteter med tid, kalorier och träningstyp
                            </div>
                          </div>
                          <input
                            type="checkbox"
                            className="checkbox checkbox-warning checkbox-lg"
                            checked={healthConfig.workouts}
                            onChange={(e) => handleHealthConfigChange('workouts', e.target.checked)}
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-base-100/30 rounded-lg p-4">
                      <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                        <div className="badge badge-ghost badge-sm">Demo</div>
                        Exempel på träningsdata
                      </h4>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between items-center p-2 bg-warning/10 rounded">
                          <span>🏃‍♂️ Löpning</span>
                          <span>45min • 420 kcal</span>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-warning/10 rounded">
                          <span>💪 Styrketräning</span>
                          <span>60min • 280 kcal</span>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-warning/10 rounded">
                          <span>🚴‍♀️ Cykling</span>
                          <span>90min • 650 kcal</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Live Preview */}
              <div className="divider mt-8">
                <span className="text-base-content/60">Live Förhandsgranskning</span>
              </div>

              <div className="grid lg:grid-cols-2 gap-8">
                {/* Preview Card */}
                <div className="card bg-gradient-to-br from-success/5 to-success/10 border border-success/20 shadow-lg">
                  <div className="card-body p-6">
                    <h3 className="card-title text-success text-xl mb-4">
                      <div className="p-2 bg-success/10 rounded-lg">
                        📱
                      </div>
                      Kalender Förhandsgranskning
                    </h3>
                    <p className="text-sm text-base-content/70 mb-4">
                      Se hur din hälsodata kommer att visas i kalendern
                    </p>
                    
                    {/* Mock Calendar Day */}
                    <div className="bg-base-100 border border-red-200/50 rounded-lg p-3">
                      <div className="text-xs font-bold text-center text-red-600 mb-2 border-b border-red-200/50 pb-1">
                        Måndag 14/8
                      </div>
                      <div className="space-y-1">
                        {Object.entries(healthConfig)
                          .filter(([_, enabled]) => enabled)
                          .slice(0, 8) // Limit to first 8 to avoid overflow
                          .map(([key, _]) => {
                            const mockValues: Record<string, string> = {
                              weight: '75.2kg',
                              steps: '8,432',
                              calories: '2,180',
                              restingHeartRate: '68bpm',
                              sleepDuration: '7.5h',
                              distance: '6.2km',
                              workouts: '💪 Gym 45min',
                              bmi: '23.1'
                            };
                            const icons: Record<string, string> = {
                              weight: '⚖️',
                              steps: '👣',
                              calories: '🔥',
                              restingHeartRate: '❤️',
                              sleepDuration: '😴',
                              distance: '📏',
                              workouts: '💪',
                              bmi: '📊'
                            };
                            return (
                              <div key={key} className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-1">
                                  <span>{icons[key] || '📊'}</span>
                                  <span className="text-base-content/70 capitalize">{key}</span>
                                </div>
                                <span className="font-semibold text-red-600">
                                  {mockValues[key] || '---'}
                                </span>
                              </div>
                            );
                          })}
                        {Object.values(healthConfig).filter(Boolean).length === 0 && (
                          <div className="text-center py-4 text-xs text-base-content/50">
                            Inga mätvärden valda
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Settings Summary */}
                <div className="card bg-gradient-to-br from-neutral/5 to-neutral/10 border border-neutral/20 shadow-lg">
                  <div className="card-body p-6">
                    <h3 className="card-title text-neutral-content text-xl mb-4">
                      <div className="p-2 bg-neutral/10 rounded-lg">
                        📋
                      </div>
                      Konfigurationssammanfattning
                    </h3>
                    <div className="space-y-4">
                      <div className="stats stats-vertical shadow-sm">
                        <div className="stat py-2">
                          <div className="stat-title text-xs">Totalt aktiverat</div>
                          <div className="stat-value text-lg">{Object.values(healthConfig).filter(Boolean).length}</div>
                          <div className="stat-desc text-xs">av {Object.keys(healthConfig).length} tillgängliga</div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { label: 'Kroppsmått', keys: ['weight', 'fatMass', 'muscleMass', 'bmi', 'basalMetabolicRate'], color: 'badge-secondary' },
                          { label: 'Aktivitet', keys: ['steps', 'distance', 'calories', 'activeMinutes', 'vo2Max'], color: 'badge-primary' },
                          { label: 'Hjärta', keys: ['restingHeartRate', 'continuousHeartRate', 'heartRateVariability', 'systolicBP', 'diastolicBP'], color: 'badge-accent' },
                          { label: 'Sömn', keys: ['sleepDuration', 'sleepEfficiency', 'deepSleep', 'lightSleep', 'remSleep', 'sleepScore'], color: 'badge-info' }
                        ].map(({ label, keys, color }) => (
                          <div key={label} className="text-center">
                            <div className={`badge ${color} badge-sm w-full`}>
                              {label}
                            </div>
                            <div className="text-lg font-bold mt-1">
                              {keys.filter(key => healthConfig[key as keyof HealthDataConfig]).length}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">Aktiva mätvärden:</h4>
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(healthConfig)
                            .filter(([_, enabled]) => enabled)
                            .map(([key, _]) => (
                              <div key={key} className="badge badge-outline badge-xs">
                                {key}
                              </div>
                            ))}
                          {Object.values(healthConfig).filter(Boolean).length === 0 && (
                            <div className="text-xs text-base-content/50 italic">
                              Inga mätvärden aktiverade
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Save Button */}
        <div className="mt-6 flex justify-end">
          <button 
            className="btn btn-primary btn-lg"
            onClick={saveConfiguration}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <span className="loading loading-spinner loading-sm"></span>
                Sparar...
              </>
            ) : (
              <>
                <Save size={16} />
                Spara konfiguration
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}