import React, { useState, useEffect } from 'react';
import { SupabaseService } from '../../services/SupabaseClient';
import './Settings.css';

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigSaved: () => void;
}

function Settings({ isOpen, onClose, onConfigSaved }: SettingsProps) {
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseKey, setSupabaseKey] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Load from environment variables or localStorage
      const url = process.env.REACT_APP_SUPABASE_URL || localStorage.getItem('supabase_url') || '';
      const key = process.env.REACT_APP_SUPABASE_ANON_KEY || localStorage.getItem('supabase_key') || '';
      setSupabaseUrl(url);
      setSupabaseKey(key);
      setTestResult(null);
    }
  }, [isOpen]);

  const handleTest = async () => {
    if (!supabaseUrl || !supabaseKey) {
      setTestResult({ success: false, message: 'Please enter both URL and Key' });
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      SupabaseService.initialize({ url: supabaseUrl, anonKey: supabaseKey });
      const { connected, error } = await SupabaseService.checkConnection();

      if (connected) {
        setTestResult({ success: true, message: 'Connection successful!' });
      } else {
        setTestResult({ success: false, message: error || 'Connection failed' });
      }
    } catch (error) {
      setTestResult({ success: false, message: (error as Error).message });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    if (!supabaseUrl || !supabaseKey) {
      setTestResult({ success: false, message: 'Please enter both URL and Key' });
      return;
    }

    // Save to localStorage
    localStorage.setItem('supabase_url', supabaseUrl);
    localStorage.setItem('supabase_key', supabaseKey);

    // Initialize service
    SupabaseService.initialize({ url: supabaseUrl, anonKey: supabaseKey });

    onConfigSaved();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="settings-header">
          <h2>Supabase Configuration</h2>
          <button className="settings-close" onClick={onClose}>×</button>
        </div>

        <div className="settings-content">
          <div className="settings-field">
            <label>
              Supabase URL:
              <input
                type="text"
                value={supabaseUrl}
                onChange={(e) => setSupabaseUrl(e.target.value)}
                placeholder="https://your-project.supabase.co"
              />
            </label>
          </div>

          <div className="settings-field">
            <label>
              Supabase Anon Key:
              <input
                type="password"
                value={supabaseKey}
                onChange={(e) => setSupabaseKey(e.target.value)}
                placeholder="your-anon-key"
              />
            </label>
          </div>

          {testResult && (
            <div className={`test-result ${testResult.success ? 'success' : 'error'}`}>
              {testResult.message}
            </div>
          )}

          <div className="settings-actions">
            <button
              className="btn btn-secondary"
              onClick={handleTest}
              disabled={testing || !supabaseUrl || !supabaseKey}
            >
              {testing ? 'Testing...' : 'Test Connection'}
            </button>
            <button
              className="btn btn-primary"
              onClick={handleSave}
              disabled={!supabaseUrl || !supabaseKey}
            >
              Save
            </button>
            <button className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;

