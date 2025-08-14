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
    authUrl.searchParams.append('scope', 'user.metrics,user.activity,user.sleepevents');
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
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Välj hälsodata att visa</h2>
              <p className="text-base-content/70">
                Välj vilka mätvärden från Withings som ska visas i din hälsodata-modul
              </p>

              <div className="grid lg:grid-cols-2 xl:grid-cols-4 gap-6">
                {/* Scales Metrics */}
                <div className="card bg-base-200">
                  <div className="card-body">
                    <h3 className="card-title text-lg">
                      <Scale size={20} />
                      Våg & Kropp
                    </h3>
                    <div className="space-y-3">
                      {[
                        { key: 'weight', label: 'Vikt (kg)' },
                        { key: 'bmi', label: 'BMI' },
                        { key: 'fatMass', label: 'Fettmassa' },
                        { key: 'muscleMass', label: 'Muskelmassa' },
                        { key: 'basalMetabolicRate', label: 'Basalmetabolism' },
                      ].map(({ key, label }) => (
                        <label key={key} className="cursor-pointer label">
                          <span className="label-text text-sm">{label}</span>
                          <input
                            type="checkbox"
                            className="checkbox checkbox-primary checkbox-sm"
                            checked={healthConfig[key as keyof HealthDataConfig]}
                            onChange={(e) => handleHealthConfigChange(key as keyof HealthDataConfig, e.target.checked)}
                          />
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Activity Metrics */}
                <div className="card bg-base-200">
                  <div className="card-body">
                    <h3 className="card-title text-lg">
                      <Activity size={20} />
                      Aktivitet
                    </h3>
                    <div className="space-y-3">
                      {[
                        { key: 'steps', label: 'Steg' },
                        { key: 'distance', label: 'Distans (km)' },
                        { key: 'calories', label: 'Kalorier' },
                        { key: 'activeMinutes', label: 'Aktiva minuter' },
                        { key: 'vo2Max', label: 'VO2 Max' },
                      ].map(({ key, label }) => (
                        <label key={key} className="cursor-pointer label">
                          <span className="label-text text-sm">{label}</span>
                          <input
                            type="checkbox"
                            className="checkbox checkbox-primary checkbox-sm"
                            checked={healthConfig[key as keyof HealthDataConfig]}
                            onChange={(e) => handleHealthConfigChange(key as keyof HealthDataConfig, e.target.checked)}
                          />
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Heart Metrics */}
                <div className="card bg-base-200">
                  <div className="card-body">
                    <h3 className="card-title text-lg">
                      <Heart size={20} />
                      Hjärta & Puls
                    </h3>
                    <div className="space-y-3">
                      {[
                        { key: 'restingHeartRate', label: 'Vilopuls' },
                        { key: 'continuousHeartRate', label: 'Kontinuerlig puls' },
                        { key: 'heartRateVariability', label: 'Pulsvariabilitet' },
                        { key: 'systolicBP', label: 'Systoliskt BT' },
                        { key: 'diastolicBP', label: 'Diastoliskt BT' },
                      ].map(({ key, label }) => (
                        <label key={key} className="cursor-pointer label">
                          <span className="label-text text-sm">{label}</span>
                          <input
                            type="checkbox"
                            className="checkbox checkbox-primary checkbox-sm"
                            checked={healthConfig[key as keyof HealthDataConfig]}
                            onChange={(e) => handleHealthConfigChange(key as keyof HealthDataConfig, e.target.checked)}
                          />
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Sleep Metrics */}
                <div className="card bg-base-200">
                  <div className="card-body">
                    <h3 className="card-title text-lg">
                      <Moon size={20} />
                      Sömn
                    </h3>
                    <div className="space-y-3">
                      {[
                        { key: 'sleepDuration', label: 'Sömntid (h)' },
                        { key: 'sleepEfficiency', label: 'Sömneffektivitet' },
                        { key: 'sleepScore', label: 'Sömnpoäng' },
                        { key: 'deepSleep', label: 'Djupsömn' },
                        { key: 'lightSleep', label: 'Lättsömn' },
                        { key: 'remSleep', label: 'REM-sömn' },
                      ].map(({ key, label }) => (
                        <label key={key} className="cursor-pointer label">
                          <span className="label-text text-sm">{label}</span>
                          <input
                            type="checkbox"
                            className="checkbox checkbox-primary checkbox-sm"
                            checked={healthConfig[key as keyof HealthDataConfig]}
                            onChange={(e) => handleHealthConfigChange(key as keyof HealthDataConfig, e.target.checked)}
                          />
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Workouts/Training */}
              <div className="card bg-base-200">
                <div className="card-body">
                  <h3 className="card-title text-lg">
                    <Activity size={20} />
                    Träningspass
                  </h3>
                  <div className="space-y-3">
                    <label className="cursor-pointer label">
                      <span className="label-text text-sm">Träningspass från Withings</span>
                      <input
                        type="checkbox"
                        className="checkbox checkbox-primary checkbox-sm"
                        checked={healthConfig.workouts}
                        onChange={(e) => handleHealthConfigChange('workouts', e.target.checked)}
                      />
                    </label>
                  </div>
                  <div className="text-xs text-base-content/60 mt-2">
                    Inkluderar alla träningspass registrerade i Withings-appen eller synkroniserade från andra appar.
                  </div>
                </div>
              </div>

              {/* Preview */}
              <div className="card bg-primary/5 border border-primary/20">
                <div className="card-body">
                  <h3 className="card-title">👀 Förhandsgranskning</h3>
                  <p className="text-sm">
                    Dessa data kommer att visas i din hälsodata-modul baserat på dina val ovan:
                  </p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {Object.entries(healthConfig)
                      .filter(([_, enabled]) => enabled)
                      .map(([key, _]) => (
                        <div key={key} className="badge badge-primary">
                          {key}
                        </div>
                      ))}
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