import React, { useState } from 'react';
import { LogIn, Key, Lock } from 'lucide-react';
import { useApp } from '../contexts/AppContext';

interface LoginFormProps {
  onLoginSuccess?: () => void;
}

export default function LoginForm({ onLoginSuccess }: LoginFormProps) {
  const [employeeNumber, setEmployeeNumber] = useState('');
  const [password, setPasswordInput] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPasswordSetup, setShowPasswordSetup] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const { login, users, setPassword, consumeOneTimeCode, t } = useApp();

  const sanitize = (s: string) => (s ?? '').trim().replaceAll('"','');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const emp = sanitize(employeeNumber);
    const pwd = (password ?? '').trim();

    console.log('Login form submitted for employee:', emp);

    try {
      // Check if user exists and has temporary code (first login path)
      const user = users.find(u => u.employeeNumber === emp);
      console.log('User lookup result:', user ? 'found' : 'not found');
      
      if (user && pwd === user.temporaryCode && user.isFirstLogin) {
        // Consume code atomically in DB (cannot be reused)
        const consumed = await consumeOneTimeCode(emp, pwd);
        if (!consumed) {
          setError('Deze eenmalige code is al gebruikt of ongeldig.');
          setIsLoading(false);
          return;
        }
        console.log('Temporary code consumed, showing password setup');
        setCurrentUser(consumed);
        setShowPasswordSetup(true);
        setIsLoading(false);
        return;
      }

      console.log('Attempting regular login');
      const success = await login(emp, pwd);
      if (!success) {
        console.log('Login failed');
        setError('Ongeldig personeelsnummer of wachtwoord');
      } else {
        console.log('Login successful, calling onLoginSuccess');
        onLoginSuccess?.();
      }
    } catch (err) {
      console.error('Login form error:', err);
      setError(t.loginError);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    console.log('Password setup form submitted');

    // Basic client-side validation to avoid Supabase 422 weak_password
    if (newPassword.trim().length < 6) {
      console.log('Password too short');
      setError('Wachtwoord moet minimaal 6 tekens zijn');
      setIsLoading(false);
      return;
    }
    
    if (newPassword !== confirmPassword) {
      console.log('Password confirmation mismatch');
      setError(t.passwordsNotMatch);
      setIsLoading(false);
      return;
    }

    console.log('Password validation passed, setting up password');

    try {
      if (currentUser) {
        console.log('Setting password for user:', currentUser.id);
        const passwordSet = await setPassword(currentUser.id, newPassword.trim());
        if (passwordSet) {
          console.log('Password set successfully, attempting login');
          // Now try to login with the new password
          const success = await login(sanitize(employeeNumber), newPassword.trim());
          if (success) {
            console.log('Login with new password successful');
            setShowPasswordSetup(false);
            onLoginSuccess?.();
          } else {
            console.log('Login with new password failed');
            setError('Er ging iets mis bij het inloggen met het nieuwe wachtwoord');
          }
        } else {
          console.log('Password setup failed');
          setError('Er ging iets mis bij het instellen van het wachtwoord');
        }
      }
    } catch (err) {
      console.error('Password setup error:', err);
      setError('Er ging iets mis bij het instellen van het wachtwoord');
    } finally {
      setIsLoading(false);
    }
  };

  if (showPasswordSetup) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-praxis-yellow-light to-gray-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="card p-8">
            <div className="text-center mb-8">
              <Key className="w-16 h-16 text-praxis-yellow mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-praxis-grey mb-2">Wachtwoord instellen</h1>
              <p className="text-gray-600">Welkom <strong className="text-gray-900">{currentUser?.name}</strong>! Stel je eigen wachtwoord in.</p>
            </div>

            <form onSubmit={handlePasswordSetup} className="space-y-6">
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Nieuw wachtwoord
                </label>
                <input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="input-field"
                  placeholder="Voer je nieuwe wachtwoord in"
                  required
                  minLength={6}
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Bevestig wachtwoord
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input-field"
                  placeholder="Bevestig je nieuwe wachtwoord"
                  required
                  minLength={6}
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-praxis-grey border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Lock className="w-5 h-5" />
                )}
                {isLoading ? 'Bezig...' : 'Wachtwoord instellen'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-praxis-yellow-light to-gray-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="card p-8">
          <div className="text-center mb-8">
            <img 
              src="https://images.pexels.com/photos/1181533/pexels-photo-1181533.jpeg?auto=compress&cs=tinysrgb&w=64&h=64&fit=crop"
              alt="Praxis Logo"
              className="w-16 h-16 rounded-lg mx-auto mb-4"
            />
            <h1 className="text-2xl font-bold text-praxis-grey mb-2">Praxis Tasks</h1>
            <p className="text-gray-600">{t.loginToAccount}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="employeeNumber" className="block text-sm font-medium text-gray-700 mb-2">
                {t.employeeNumber}
              </label>
              <input
                id="employeeNumber"
                type="text"
                value={employeeNumber}
                onChange={(e) => setEmployeeNumber(e.target.value)}
                className="input-field"
                placeholder="1001"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                {t.password}
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="input-field"
                placeholder={t.password}
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-praxis-grey border-t-transparent rounded-full animate-spin" />
              ) : (
                <LogIn className="w-5 h-5" />
              )}
              {isLoading ? t.loading : t.login}
            </button>
          </form>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-900 mb-2">Test Accounts:</h3>
            <div className="space-y-1 text-xs text-gray-600">
              <div><strong>Manager:</strong> 1001 / manager123</div>
              <div><strong>Gebruiker:</strong> 1002 / user123</div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
