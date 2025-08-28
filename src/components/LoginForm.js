import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { LogIn, Key, Lock } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
export default function LoginForm({ onLoginSuccess }) {
    const [employeeNumber, setEmployeeNumber] = useState('');
    const [password, setPasswordInput] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPasswordSetup, setShowPasswordSetup] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const { login, setPassword, consumeOneTimeCode, t } = useApp();
    const sanitizeEmployee = (s) => (s ?? '').trim().replace(/"/g, '');
    const handleSubmit = async (e) => {
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
            }
            else {
                onLoginSuccess?.();
            }
        }
        catch (err) {
            console.error('Login form error:', err);
            setError(t.loginError);
        }
        finally {
            setIsLoading(false);
        }
    };
    const handlePasswordSetup = async (e) => {
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
        }
        catch (err) {
            console.error('Password setup error:', err);
            setError('Er ging iets mis bij het instellen van het wachtwoord');
        }
        finally {
            setIsLoading(false);
        }
    };
    if (showPasswordSetup) {
        return (_jsx("div", { className: "min-h-screen bg-gradient-to-br from-praxis-yellow-light to-gray-100 flex items-center justify-center p-4", children: _jsx("div", { className: "max-w-md w-full", children: _jsxs("div", { className: "card p-8", children: [_jsxs("div", { className: "text-center mb-8", children: [_jsx(Key, { className: "w-16 h-16 text-praxis-yellow mx-auto mb-4" }), _jsx("h1", { className: "text-2xl font-bold text-praxis-grey mb-2", children: "Wachtwoord instellen" }), _jsxs("p", { className: "text-gray-600", children: ["Welkom ", _jsx("strong", { className: "text-gray-900", children: currentUser?.name || currentUser?.username }), "! Stel je eigen wachtwoord in. Let op, gebruik nooit een prive wachtwoord!"] })] }), _jsxs("form", { onSubmit: handlePasswordSetup, className: "space-y-6", children: [_jsxs("div", { children: [_jsx("label", { htmlFor: "newPassword", className: "block text-sm font-medium text-gray-700 mb-2", children: "Nieuw wachtwoord" }), _jsx("input", { id: "newPassword", type: "password", value: newPassword, onChange: (e) => setNewPassword(e.target.value), className: "input-field", placeholder: "Minimaal 6 tekens", required: true, minLength: 6 })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "confirmPassword", className: "block text-sm font-medium text-gray-700 mb-2", children: "Bevestig wachtwoord" }), _jsx("input", { id: "confirmPassword", type: "password", value: confirmPassword, onChange: (e) => setConfirmPassword(e.target.value), className: "input-field", placeholder: "Herhaal je wachtwoord", required: true, minLength: 6 })] }), error && (_jsx("div", { className: "bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg", children: error })), _jsxs("button", { type: "submit", disabled: isLoading, className: "w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed", children: [isLoading ? (_jsx("div", { className: "w-5 h-5 border-2 border-praxis-grey border-t-transparent rounded-full animate-spin" })) : (_jsx(Lock, { className: "w-5 h-5" })), _jsxs("div", { children: [_jsx("strong", { children: "Manager:" }), " Personeelsnr: 1001, Wachtwoord: manager123"] }), _jsxs("div", { children: [_jsx("strong", { children: "Gebruiker:" }), " Personeelsnr: 1002, Wachtwoord: user123"] }), _jsx("div", { className: "text-xs text-gray-500 mt-2", children: "Bij eerste login wordt automatisch een account aangemaakt." })] })] })] }) }) }));
    }
    return (_jsx("div", { className: "min-h-screen bg-gradient-to-br from-praxis-yellow-light to-gray-100 flex items-center justify-center p-4", children: _jsx("div", { className: "max-w-md w-full", children: _jsxs("div", { className: "card p-8", children: [_jsxs("div", { className: "text-center mb-8", children: [_jsx("img", { src: "https://images.pexels.com/photos/1181533/pexels-photo-1181533.jpeg?auto=compress&cs=tinysrgb&w=64&h=64&fit=crop", alt: "Praxis Logo", className: "w-16 h-16 rounded-lg mx-auto mb-4" }), _jsx("h1", { className: "text-2xl font-bold text-praxis-grey mb-2", children: "Praxis Tasks" }), _jsx("p", { className: "text-gray-600", children: t.loginToAccount })] }), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-6", children: [_jsxs("div", { children: [_jsx("label", { htmlFor: "employeeNumber", className: "block text-sm font-medium text-gray-700 mb-2", children: t.employeeNumber }), _jsx("input", { id: "employeeNumber", type: "text", value: employeeNumber, onChange: (e) => setEmployeeNumber(e.target.value), className: "input-field", placeholder: "Voer hier je personeelsnummer in", required: true })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "password", className: "block text-sm font-medium text-gray-700 mb-2", children: t.password }), _jsx("input", { id: "password", type: "password", value: password, onChange: (e) => setPasswordInput(e.target.value), className: "input-field", placeholder: t.password, required: true })] }), error && (_jsx("div", { className: "bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg", children: error })), _jsxs("button", { type: "submit", disabled: isLoading, className: "w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed", children: [isLoading ? (_jsx("div", { className: "w-5 h-5 border-2 border-praxis-grey border-t-transparent rounded-full animate-spin" })) : (_jsx(LogIn, { className: "w-5 h-5" })), isLoading ? t.loading : t.login] })] })] }) }) }));
}
