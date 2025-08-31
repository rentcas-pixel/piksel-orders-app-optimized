'use client';


import { SunIcon, MoonIcon, CalendarIcon } from '@heroicons/react/24/outline';

interface HeaderProps {
  onOpenWeekNumbers: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export function Header({ onOpenWeekNumbers, isDarkMode, onToggleDarkMode }: HeaderProps) {

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Title */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">P</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  Piksel Orders
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Užsakymų valdymas
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-4">
            {/* Week Numbers Button */}
            <button
              onClick={onOpenWeekNumbers}
              className="p-2 rounded-lg bg-gray-700 dark:bg-gray-600 text-white hover:bg-gray-800 dark:hover:bg-gray-700 transition-colors"
            >
              <CalendarIcon className="w-5 h-5" />
            </button>

            {/* Dark Mode Toggle */}
            <button
              onClick={onToggleDarkMode}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              {isDarkMode ? (
                <SunIcon className="w-5 h-5" />
              ) : (
                <MoonIcon className="w-5 h-5" />
              )}
            </button>


          </div>
        </div>
      </div>
    </header>
  );
}
