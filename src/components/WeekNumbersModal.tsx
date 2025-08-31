'use client';

import { useState, useEffect, useRef } from 'react';
import { Dialog } from '@headlessui/react';
import { XMarkIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { getWeek, getWeekYear, startOfWeek, endOfWeek, format, addWeeks } from 'date-fns';
import { lt } from 'date-fns/locale';

interface WeekNumbersModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WeekNumbersModal({ isOpen, onClose }: WeekNumbersModalProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const currentWeekRef = useRef<HTMLDivElement>(null);

  // Get current week number
  const currentWeek = getWeek(currentDate, { weekStartsOn: 1, locale: lt });
  const currentYear = getWeekYear(currentDate, { weekStartsOn: 1, locale: lt });

  // Reset to current week and year when modal opens, and scroll to current week
  useEffect(() => {
    if (isOpen) {
      const now = new Date();
      setCurrentDate(now);
      setSelectedYear(now.getFullYear());
      
      // Scroll to current week after a short delay to ensure DOM is rendered
      setTimeout(() => {
        if (currentWeekRef.current) {
          currentWeekRef.current.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });
        }
      }, 100);
    }
  }, [isOpen]);

  // Generate weeks for selected year
  const generateWeeksForYear = (year: number) => {
    const weeks = [];
    const startDate = new Date(year, 0, 1); // January 1st
    const endDate = new Date(year, 11, 31); // December 31st
    
    let currentWeekStart = startOfWeek(startDate, { weekStartsOn: 1 });
    
    while (currentWeekStart <= endDate) {
      const weekNumber = getWeek(currentWeekStart, { weekStartsOn: 1, locale: lt });
      const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 });
      
      weeks.push({
        weekNumber,
        startDate: currentWeekStart,
        endDate: weekEnd,
        isCurrentWeek: weekNumber === currentWeek && year === currentYear
      });
      
      currentWeekStart = addWeeks(currentWeekStart, 1);
    }
    
    return weeks;
  };

  const weeks = generateWeeksForYear(selectedYear);

  const goToPreviousYear = () => {
    setSelectedYear(prev => prev - 1);
  };

  const goToNextYear = () => {
    setSelectedYear(prev => prev + 1);
  };

  const goToCurrentYear = () => {
    const now = new Date();
    setSelectedYear(now.getFullYear());
    setCurrentDate(now);
    
    // Scroll to current week when going to current year
    setTimeout(() => {
      if (currentWeekRef.current) {
        currentWeekRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }
    }, 100);
  };

  const formatDate = (date: Date) => {
    return format(date, 'yyyy-MM-dd', { locale: lt });
  };

  const getWeekStatus = (week: { isCurrentWeek: boolean; startDate: Date }) => {
    if (week.isCurrentWeek) return 'bg-blue-100 border-blue-300 text-blue-800';
    if (week.startDate < new Date()) return 'bg-gray-50 border-gray-200 text-gray-600';
    return 'bg-white border-gray-200 text-gray-900';
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-4xl w-full bg-white dark:bg-gray-800 rounded-xl shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <Dialog.Title className="text-xl font-semibold text-gray-900 dark:text-white">
              Savaičių numeriai {selectedYear}
            </Dialog.Title>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Year Navigation */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={goToPreviousYear}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <ChevronLeftIcon className="w-5 h-5" />
            </button>
            
            <div className="flex items-center space-x-4">
              <span className="text-lg font-semibold text-gray-900 dark:text-white">
                {selectedYear}
              </span>
              <button
                onClick={goToCurrentYear}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Dabar
              </button>
            </div>
            
            <button
              onClick={goToNextYear}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <ChevronRightIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Weeks Grid */}
          <div className="p-6 max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-gray-100 dark:scrollbar-track-gray-800">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {weeks.map((week, index) => (
                <div
                  key={`${week.weekNumber}-${selectedYear}-${index}`}
                  ref={week.isCurrentWeek ? currentWeekRef : null}
                  className={`p-4 rounded-lg border-2 ${getWeekStatus(week)} transition-all duration-200 hover:shadow-md ${
                    week.isCurrentWeek ? 'ring-2 ring-blue-400' : ''
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`font-bold text-lg ${
                      week.isCurrentWeek ? 'text-blue-600' : ''
                    }`}>
                      Savaitė {week.weekNumber}
                    </span>
                    {week.isCurrentWeek && (
                      <span className="px-2 py-1 text-xs bg-blue-600 text-white rounded-full">
                        Dabar
                      </span>
                    )}
                  </div>
                  
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Nuo:</span>
                      <span className="font-medium">{formatDate(week.startDate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Iki:</span>
                      <span className="font-medium">{formatDate(week.endDate)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              ISO 8601 standartas • Savaitė prasideda pirmadienį
            </div>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Uždaryti
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
