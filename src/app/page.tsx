'use client';

import { useState, useEffect, useCallback } from 'react';
import { OrdersTable } from '@/components/OrdersTable';
import { Header } from '@/components/Header';
import { SearchAndFilters } from '@/components/SearchAndFilters';
import { OrderDetailsModal } from '@/components/OrderDetailsModal';
import { EditOrderModal } from '@/components/EditOrderModal';
import { ReminderNotifications } from '@/components/ReminderNotifications';
import { WeekNumbersModal } from '@/components/WeekNumbersModal';
import { PocketBaseService } from '@/lib/pocketbase';
import { Order } from '@/types';
import { useDebounce } from '@/hooks/useDebounce';

export default function Home() {
  const [isWeekNumbersModalOpen, setIsWeekNumbersModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showReminders, setShowReminders] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Load dark mode preference from localStorage
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode !== null) {
      const darkMode = JSON.parse(savedDarkMode);
      setIsDarkMode(darkMode);
      // Apply dark mode class to document immediately
      if (darkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, []);

  // Save dark mode preference to localStorage and apply to document
  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  const handleOpenWeekNumbers = () => {
    setIsWeekNumbersModalOpen(true);
  };
  
  // Get current date for default filters
  const now = new Date();
  const currentMonth = String(now.getMonth() + 1).padStart(2, '0'); // 01-12
  const currentYear = now.getFullYear();
  
  const [filters, setFilters] = useState({
    status: '', // Default: Visi statusai - rodo visus užsakymus
    month: '', // Default: Visi mėnesiai - rodo visus mėnesius
    year: currentYear.toString(), // Default: einamieji metai (2025)
    client: '',
    agency: '',
    media_received: '',
    invoice_sent: ''
  });

  // Debounce filters to prevent excessive API calls
  const debouncedFilters = useDebounce(filters, 1000);
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  // Memoize filter changes to prevent unnecessary re-renders
  const handleFiltersChange = useCallback((newFilters: typeof filters) => {
    setFilters(newFilters);
  }, []);

  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);


  const handleEditOrder = (order: Order) => {
    setEditingOrder(order);
  };

  const handleOrderUpdated = () => {
    // Force OrdersTable to refresh by updating the refresh key
    setRefreshKey(prev => prev + 1);
    setEditingOrder(null);
  };

  const handleOpenEditModalFromReminder = async (orderId: string) => {
    try {
      const order = await PocketBaseService.getOrder(orderId);
      setEditingOrder(order);
    } catch (error) {
      console.error('Error loading order for edit:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header 
        onOpenWeekNumbers={handleOpenWeekNumbers}
        isDarkMode={isDarkMode}
        onToggleDarkMode={toggleDarkMode}
      />
      
      <main className="container mx-auto px-4 py-6">
        <SearchAndFilters
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          filters={filters}
          onFiltersChange={handleFiltersChange}
        />
        
        <OrdersTable
          key={refreshKey}
          searchQuery={debouncedSearchQuery}
          filters={debouncedFilters}
          onEditOrder={handleEditOrder}
        />
      </main>

      {/* Order Details Modal */}
      <OrderDetailsModal
        order={selectedOrder}
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
      />

      {/* Edit Order Modal */}
      <EditOrderModal
        order={editingOrder}
        isOpen={!!editingOrder}
        onClose={() => setEditingOrder(null)}
        onOrderUpdated={handleOrderUpdated}
      />

      {/* Reminder Notifications */}
      {showReminders && (
        <ReminderNotifications
          onClose={() => setShowReminders(false)}
          onOpenEditModal={handleOpenEditModalFromReminder}
        />
      )}

      {/* Week Numbers Modal */}
      <WeekNumbersModal
        isOpen={isWeekNumbersModalOpen}
        onClose={() => setIsWeekNumbersModalOpen(false)}
      />
    </div>
  );
}
