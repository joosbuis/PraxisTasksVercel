import React, { useEffect, useState } from 'react';
import { CheckCircle, Sparkles } from 'lucide-react';
import { useApp } from '../contexts/AppContext';

interface WelcomeScreenProps {
  onComplete: () => void;
}

export default function WelcomeScreen({ onComplete }: WelcomeScreenProps) {
  const { currentUser, t } = useApp();
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    // Toon content na korte delay voor smooth animatie
    const timer = setTimeout(() => setShowContent(true), 100);
    
    // Auto-complete na 3 seconden
    const autoComplete = setTimeout(() => onComplete(), 3000);
    
    return () => {
      clearTimeout(timer);
      clearTimeout(autoComplete);
    };
  }, [onComplete]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-praxis-yellow-light to-gray-100 flex items-center justify-center p-4">
      <div className={`text-center transition-all duration-1000 ${
        showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}>
        {/* Animated Logo */}
        <div className="relative mb-8">
          <div className="absolute inset-0 animate-ping">
            <div className="w-24 h-24 mx-auto bg-praxis-yellow rounded-full opacity-20"></div>
          </div>
          <div className="relative">
            <img 
              src="https://play-lh.googleusercontent.com/Gg4iUcjk0kYsRxbKrSGIjAOojuh3ch68QNrkdv64Sp2iPgKbO2L72kEDvpW07idtDA" 
              alt="Praxis Tasks Logo" 
              className="w-24 h-24 rounded-2xl mx-auto shadow-lg animate-bounce"
            />
          </div>
        </div>

        {/* Welcome Message */}
        <div className="space-y-4">
          <h1 className="text-4xl font-bold text-praxis-grey">
            {t.welcome} Welkom bij, Praxis Tasks!
          </h1>
          <p className="text-xl text-gray-600">
            {t.welcome} <span className="font-semibold text-praxis-grey">{currentUser?.name}</span>
          </p>
          <div className="flex items-center justify-center gap-2 text-green-600">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">{t.loginSuccess}</span>
          </div>
        </div>

        {/* Animated Swirl */}
        <div className="mt-8 relative">
          <div className="w-16 h-16 mx-auto">
            <div className="absolute inset-0 border-4 border-praxis-yellow border-t-transparent rounded-full animate-spin"></div>
            <div className="absolute inset-2 border-2 border-praxis-yellow-dark border-b-transparent rounded-full animate-spin animate-reverse" style={{ animationDuration: '1.5s' }}></div>
            <div className="absolute inset-4 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-praxis-yellow-dark animate-pulse" />
            </div>
          </div>
        </div>

        {/* Skip Button */}
        <button
          onClick={onComplete}
          className="mt-8 text-gray-500 hover:text-gray-700 text-sm transition-colors"
        >
       {t.tasks} →
        </button>
      </div>

      {/* Background Animation */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-4 -left-4 w-72 h-72 bg-praxis-yellow opacity-10 rounded-full animate-pulse"></div>
        <div className="absolute -bottom-8 -right-8 w-96 h-96 bg-praxis-yellow-dark opacity-5 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>
    </div>
  );
}