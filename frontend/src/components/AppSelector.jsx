import React from 'react';
import { Map, Users } from 'lucide-react';

function AppSelector({ onSelect }) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center p-4 transition-colors duration-300">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <div className="inline-block p-2 bg-white dark:bg-slate-800 rounded-2xl shadow-xl mb-6">
            <img src="/logo.png" alt="Tribuneo" className="w-20 h-20 rounded-xl" />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white mb-4">
            Bienvenue sur Tribuneo
          </h1>
          <p className="text-lg text-slate-500 dark:text-slate-400">
            Que souhaitez-vous consulter aujourd'hui ?
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Card: Map Procédure */}
          <button
            onClick={() => onSelect('map')}
            className="group relative bg-white dark:bg-slate-800 rounded-3xl p-8 text-left border-2 border-transparent hover:border-[#FF7900] overflow-hidden card-hover"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-100 dark:bg-orange-900/30 rounded-bl-full -mr-8 -mt-8 transition-transform duration-500 ease-out group-hover:scale-[1.3]" />
            <div className="relative z-10">
              <div className="w-16 h-16 bg-[#FF7900] rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg shadow-orange-200 dark:shadow-orange-900/40">
                <Map size={32} />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Map Procédure</h2>
              <p className="text-slate-500 dark:text-slate-400">
                Recherchez et analysez les entreprises en procédure collective sur une carte interactive.
              </p>
            </div>
          </button>

          {/* Card: Base de données contact */}
          <button
            onClick={() => onSelect('contacts')}
            className="group relative bg-white dark:bg-slate-800 rounded-3xl p-8 text-left border-2 border-transparent hover:border-indigo-500 overflow-hidden card-hover"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 dark:bg-indigo-900/30 rounded-bl-full -mr-8 -mt-8 transition-transform duration-500 ease-out group-hover:scale-[1.3]" />
            <div className="relative z-10">
              <div className="w-16 h-16 bg-indigo-500 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg shadow-indigo-200 dark:shadow-indigo-900/40">
                <Users size={32} />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Base de données contact</h2>
              <p className="text-slate-500 dark:text-slate-400">
                Consultez et recherchez parmi vos contacts issus des cartes de visite.
              </p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

export default AppSelector;
