'use client';

import { SunIcon, MoonIcon, CalendarIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline';

interface HeaderProps {
  onOpenWeekNumbers: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onExportToExcel: () => void;
}

export function Header({ onOpenWeekNumbers, isDarkMode, onToggleDarkMode, onExportToExcel }: HeaderProps) {

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-24">
          {/* Logo and Title */}
          <div className="flex items-center justify-center flex-1">
            <div className="flex flex-col items-center">
              <img 
                src="Piksel-logo-black-2023.png" 
                alt="Piksel" 
                className="h-10 w-auto dark:invert"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-4">
            {/* Excel Export Button */}
            <button
              onClick={onExportToExcel}
              className="p-2 rounded-lg bg-green-600 dark:bg-green-700 text-white hover:bg-green-700 dark:hover:bg-green-600 transition-colors"
              title="Eksportuoti į Excel"
            >
              <DocumentArrowDownIcon className="w-5 h-5" />
            </button>

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
