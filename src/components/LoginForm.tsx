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

  const { login, setPassword, consumeOneTimeCode, t } = useApp();

  const sanitizeEmployee = (s: string) =>
    (s ?? '').trim().replace(/"/g, '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const emp = sanitizeEmployee(employeeNumber);
    const pwd = (password ?? '').trim();

    try {
      // 1) Check of dit een tijdelijke code is (server-side, betrouwbaar)
      const tmpUser = await consumeOneTimeCode(emp, pwd);
      if (tmpUser && tmpUser.isFirstLogin) {
        // Geldige tijdelijke code -> toon wachtwoord setup (NIET inloggen)
        setCurrentUser(tmpUser);
        setShowPasswordSetup(true);
        setIsLoading(false);
        return;
      }

      // 2) Geen tijdelijke code → normale login via Supabase Auth
      const ok = await login(emp, pwd);
      if (!ok) {
        setError('Ongeldig personeelsnummer of wachtwoord');
      } else {
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

    const pwd = (newPassword ?? '').trim();
    const confirm = (confirmPassword ?? '').trim();

    if (pwd !== confirm) {
      setError(t.passwordsNotMatch);
      setIsLoading(false);
      return;
    }
    if (pwd.length < 6) {
      setError('Wachtwoord moet minimaal 6 tekens zijn');
      setIsLoading(false);
      return;
    }

    try {
      if (!currentUser?.id) {
        setError('Geen gebruiker gevonden voor wachtwoordinstelling');
        setIsLoading(false);
        return;
      }

      // 1) Stel wachtwoord definitief in (maakt Auth-account aan als nodig)
      const setOk = await setPassword(currentUser.id, pwd);
      if (!setOk) {
        setError('Er ging iets mis bij het instellen van het wachtwoord');
        setIsLoading(false);
        return;
      }

      // 2) Direct inloggen met nieuw wachtwoord
      const emp = sanitizeEmployee(currentUser.employeeNumber || employeeNumber);
      const loginOk = await login(emp, pwd);
      if (!loginOk) {
        setError('Inloggen met het nieuwe wachtwoord is mislukt');
        setIsLoading(false);
        return;
      }

      onLoginSuccess?.();
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
              <p className="text-gray-600">
                Welkom <strong className="text-gray-900">{currentUser?.name || currentUser?.username}</strong>!
                Stel je eigen wachtwoord in. Let op, gebruik nooit een prive wachtwoord!
              </p>
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
                  placeholder="Minimaal 6 tekens"
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
                  placeholder="Herhaal je wachtwoord"
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
              <div><strong>Manager:</strong> Personeelsnr: 1001, Wachtwoord: manager123</div>
              <div><strong>Gebruiker:</strong> Personeelsnr: 1002, Wachtwoord: user123</div>
              <div className="text-xs text-gray-500 mt-2">
                Bij eerste login wordt automatisch een account aangemaakt.
              </div>
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
                placeholder="Voer hier je personeelsnummer in"
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
        </div>
      </div>
    </div>
  );
}
