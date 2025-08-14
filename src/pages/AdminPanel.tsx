import { useState } from 'react';
import { Save, TestTube, Eye, EyeOff, Settings as SettingsIcon } from 'lucide-react';
import type { Settings, WithingsCredentials } from '../types';

const defaultSettings: Settings = {
  modules_enabled: {
    withings: true,
    todos: true,
    supplements: true,
    weekly_summary: true,
  },
  day_fields: {
    steps: true,
    cardio_minutes: true,
    calories_out: true,
    max_hr: false,
    sleep: false,
  },
  goals: {
    steps: 10000,
    cardio_minutes: 30,
    calories_out: 2500,
  },
  layout_order: ['metrics', 'workouts', 'todos', 'supplements'],
};

export function AdminPanel() {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [credentials, setCredentials] = useState<WithingsCredentials>({
    client_id: '',
    client_secret: '',
    redirect_uri: 'http://localhost:3000/auth/withings/callback',
    scopes: ['user.metrics', 'user.activity'],
  });
  const [showSecret, setShowSecret] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTestingOAuth, setIsTestingOAuth] = useState(false);
  
  const handleCredentialChange = (field: keyof WithingsCredentials, value: string | string[]) => {
    setCredentials(prev => ({ ...prev, [field]: value }));
  };
  
  const handleModuleToggle = (module: keyof Settings['modules_enabled']) => {
    setSettings(prev => ({
      ...prev,
      modules_enabled: {
        ...prev.modules_enabled,
        [module]: !prev.modules_enabled[module],
      },
    }));
  };
  
  const handleFieldToggle = (field: keyof Settings['day_fields']) => {
    setSettings(prev => ({
      ...prev,
      day_fields: {
        ...prev.day_fields,
        [field]: !prev.day_fields[field],
      },
    }));
  };
  
  const handleGoalChange = (goal: keyof Settings['goals'], value: number) => {
    setSettings(prev => ({
      ...prev,
      goals: {
        ...prev.goals,
        [goal]: value,
      },
    }));
  };
  
  const handleSaveCredentials = async () => {
    setIsSaving(true);
    try {
      // TODO: API call to save credentials
      console.log('Saving credentials:', { ...credentials, client_secret: '[HIDDEN]' });
      await new Promise(resolve => setTimeout(resolve, 1000)); // Mock delay
    } catch (error) {
      console.error('Error saving credentials:', error);
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleTestOAuth = async () => {
    setIsTestingOAuth(true);
    try {
      // TODO: API call to test OAuth flow
      console.log('Testing OAuth flow');
      await new Promise(resolve => setTimeout(resolve, 2000)); // Mock delay
      alert('OAuth test successful! (Mock)');
    } catch (error) {
      console.error('Error testing OAuth:', error);
      alert('OAuth test failed');
    } finally {
      setIsTestingOAuth(false);
    }
  };
  
  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      // TODO: API call to save settings
      console.log('Saving settings:', settings);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Mock delay
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="glass-panel p-8 text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <SettingsIcon className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
          Adminpanel
        </h1>
        <p className="text-gray-600">Konfigurera din LifeCalendar-upplevelse</p>
      </div>
      
      {/* Withings Integration */}
      <div className="glass-panel p-8">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
            <span className="text-xl">⌚</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Withings-integration</h2>
            <p className="text-gray-600 text-sm">Anslut din Apple Watch data via Withings</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Client ID
            </label>
            <input
              type="text"
              value={credentials.client_id}
              onChange={(e) => handleCredentialChange('client_id', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Din Withings Client ID"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Client Secret
            </label>
            <div className="relative">
              <input
                type={showSecret ? 'text' : 'password'}
                value={credentials.client_secret}
                onChange={(e) => handleCredentialChange('client_secret', e.target.value)}
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Din Withings Client Secret"
              />
              <button
                type="button"
                onClick={() => setShowSecret(!showSecret)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showSecret ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Redirect URI
            </label>
            <input
              type="url"
              value={credentials.redirect_uri}
              onChange={(e) => handleCredentialChange('redirect_uri', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Scopes
            </label>
            <input
              type="text"
              value={credentials.scopes.join(', ')}
              onChange={(e) => handleCredentialChange('scopes', e.target.value.split(', ') as string[])}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="user.metrics, user.activity"
            />
          </div>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleSaveCredentials}
            disabled={isSaving}
            className="primary-button disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save size={18} />
            <span>{isSaving ? 'Sparar...' : 'Spara credentials'}</span>
          </button>
          
          <button
            onClick={handleTestOAuth}
            disabled={isTestingOAuth}
            className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-200 shadow-md hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <TestTube size={18} />
            <span>{isTestingOAuth ? 'Testar...' : 'Testa OAuth'}</span>
          </button>
        </div>
      </div>
      
      {/* Module Settings */}
      <div className="glass-panel p-8">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
            <span className="text-xl">🔧</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Modulinställningar</h2>
            <p className="text-gray-600 text-sm">Aktivera eller inaktivera funktioner</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(settings.modules_enabled).map(([key, enabled]) => (
            <label key={key} className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={enabled}
                onChange={() => handleModuleToggle(key as keyof Settings['modules_enabled'])}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <span className="text-sm font-medium text-gray-700 capitalize">
                {key.replace('_', ' ')}
              </span>
            </label>
          ))}
        </div>
      </div>
      
      {/* Field Settings */}
      <div className="bg-white rounded-lg p-6 shadow-sm border">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Fältinställningar</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          {Object.entries(settings.day_fields).map(([key, enabled]) => (
            <label key={key} className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={enabled}
                onChange={() => handleFieldToggle(key as keyof Settings['day_fields'])}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <span className="text-sm font-medium text-gray-700">
                {key.replace('_', ' ')}
              </span>
            </label>
          ))}
        </div>
        
        {/* Goals */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-medium text-gray-800 mb-4">Mål</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Steg per dag
              </label>
              <input
                type="number"
                value={settings.goals.steps}
                onChange={(e) => handleGoalChange('steps', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                min="0"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cardio-minuter per dag
              </label>
              <input
                type="number"
                value={settings.goals.cardio_minutes}
                onChange={(e) => handleGoalChange('cardio_minutes', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                min="0"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kalorier ut per dag
              </label>
              <input
                type="number"
                value={settings.goals.calories_out}
                onChange={(e) => handleGoalChange('calories_out', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                min="0"
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSaveSettings}
          disabled={isSaving}
          className="flex items-center space-x-2 px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 transition-colors"
        >
          <Save size={18} />
          <span>{isSaving ? 'Sparar...' : 'Spara alla inställningar'}</span>
        </button>
      </div>
    </div>
  );
}