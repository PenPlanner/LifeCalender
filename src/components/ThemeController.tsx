import { useState, useEffect } from 'react';
import { Palette } from 'lucide-react';

const themes = [
  { name: 'lifecalendar', label: 'LifeCalendar', icon: '🗓️' },
  { name: 'light', label: 'Light', icon: '☀️' },
  { name: 'dark', label: 'Dark', icon: '🌙' },
  { name: 'cupcake', label: 'Cupcake', icon: '🧁' },
  { name: 'cyberpunk', label: 'Cyberpunk', icon: '🤖' },
  { name: 'valentine', label: 'Valentine', icon: '💝' },
  { name: 'garden', label: 'Garden', icon: '🌱' },
  { name: 'forest', label: 'Forest', icon: '🌲' },
  { name: 'aqua', label: 'Aqua', icon: '🌊' },
  { name: 'lofi', label: 'Lofi', icon: '🎵' },
  { name: 'pastel', label: 'Pastel', icon: '🎨' },
  { name: 'fantasy', label: 'Fantasy', icon: '🦄' },
  { name: 'wireframe', label: 'Wireframe', icon: '📐' },
  { name: 'luxury', label: 'Luxury', icon: '💎' },
  { name: 'dracula', label: 'Dracula', icon: '🧛' },
];

export function ThemeController() {
  const [currentTheme, setCurrentTheme] = useState('lifecalendar');

  useEffect(() => {
    const savedTheme = localStorage.getItem('lifecalendar-theme') || 'lifecalendar';
    setCurrentTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  const handleThemeChange = (theme: string) => {
    setCurrentTheme(theme);
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('lifecalendar-theme', theme);
  };

  const currentThemeObj = themes.find(t => t.name === currentTheme) || themes[0];

  return (
    <div className="dropdown dropdown-end">
      <div tabIndex={0} role="button" className="btn btn-ghost btn-xs gap-1" title="Byt tema">
        <Palette size={12} />
        <span className="text-xs">{currentThemeObj.icon}</span>
      </div>
      
      <div className="dropdown-content z-[1] p-2 shadow-2xl bg-base-100 rounded-box w-80 max-h-96 overflow-y-auto">
        <div className="grid grid-cols-1 gap-2 p-2">
          <div className="text-sm font-semibold text-base-content/70 px-2 py-1">
            Välj tema
          </div>
          
          {themes.map((theme) => (
            <button
              key={theme.name}
              className={`btn btn-sm justify-start gap-3 ${
                currentTheme === theme.name ? 'btn-primary' : 'btn-ghost'
              }`}
              onClick={() => handleThemeChange(theme.name)}
              data-theme={theme.name}
            >
              <span className="text-lg">{theme.icon}</span>
              <span>{theme.label}</span>
              {currentTheme === theme.name && (
                <div className="ml-auto">
                  <div className="badge badge-primary badge-sm">✓</div>
                </div>
              )}
            </button>
          ))}
        </div>
        
        <div className="divider divider-horizontal text-xs">Förhandsvisning</div>
        
        <div className="p-4" data-theme={currentTheme}>
          <div className="bg-base-100 rounded-lg p-3 shadow">
            <div className="flex gap-2 mb-2">
              <div className="badge badge-primary">Primary</div>
              <div className="badge badge-secondary">Secondary</div>
              <div className="badge badge-accent">Accent</div>
            </div>
            <div className="progress progress-primary w-full h-2"></div>
          </div>
        </div>
      </div>
    </div>
  );
}