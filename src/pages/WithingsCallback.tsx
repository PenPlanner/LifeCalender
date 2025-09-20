import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { withingsApi } from '../services/api';

export function WithingsCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('Bearbetar Withings-anslutning...');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const error = searchParams.get('error');

        if (error) {
          setStatus('error');
          setMessage(`Withings-fel: ${error}`);
          return;
        }

        if (!code) {
          setStatus('error');
          setMessage('Ogiltig callback från Withings');
          return;
        }

        const expectedState = sessionStorage.getItem('withings-oauth-state');
        sessionStorage.removeItem('withings-oauth-state');

        if (expectedState && state && expectedState !== state) {
          setStatus('error');
          setMessage('Säkerhetskontroll misslyckades (state)');
          return;
        }

        const userId = localStorage.getItem('lifecalendar-user-id') ?? 'user1';

        console.log('Completing Withings OAuth for user', userId);
        const result = await withingsApi.completeOAuth(code, userId);

        if (!result.success) {
          throw new Error('OAuth-uppdatering misslyckades');
        }

        setStatus('success');
        setMessage('Withings-anslutning lyckades! Omdirigerar...');

        // Redirect to admin after 2 seconds
        setTimeout(() => {
          navigate('/admin');
        }, 2000);

      } catch (error) {
        console.error('Withings callback error:', error);
        setStatus('error');
        setMessage(`Fel vid anslutning: ${error instanceof Error ? error.message : 'Okänt fel'}`);
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center">
      <div className="card bg-base-100 shadow-xl w-96">
        <div className="card-body text-center">
          <h2 className="card-title justify-center mb-4">
            🔗 Withings Anslutning
          </h2>
          
          {status === 'processing' && (
            <div className="space-y-4">
              <span className="loading loading-spinner loading-lg text-primary"></span>
              <p className="text-base-content/70">{message}</p>
            </div>
          )}

          {status === 'success' && (
            <div className="space-y-4">
              <div className="text-success text-4xl">✅</div>
              <p className="text-success font-semibold">{message}</p>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-4">
              <div className="text-error text-4xl">❌</div>
              <p className="text-error">{message}</p>
              <div className="card-actions justify-center">
                <button 
                  className="btn btn-primary"
                  onClick={() => navigate('/admin')}
                >
                  Tillbaka till Admin
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
