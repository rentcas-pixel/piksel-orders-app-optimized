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
import * as XLSX from 'xlsx';
import { format } from 'date-fns';

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

  // Build filter string for API calls
  const buildFilterString = useCallback(() => {
    const filtersArray = [];
    
    // Add search query filter
    if (searchQuery.trim()) {
      if (searchQuery.toLowerCase().startsWith('viad')) {
        filtersArray.push(`(client~"${searchQuery}" || agency~"${searchQuery}" || invoice_id~"${searchQuery}" || viaduct=true)`);
      } else {
        filtersArray.push(`(client~"${searchQuery}" || agency~"${searchQuery}" || invoice_id~"${searchQuery}")`);
      }
    }
    
    // Status filter
    if (filters.status) {
      if (filters.status === 'taip') {
        filtersArray.push(`approved=true`);
      } else if (filters.status === 'ne') {
        filtersArray.push(`approved=false`);
      }
    }
    
    // Date filters - show orders that overlap with the selected month (same as OrdersTable)
    if (filters.month && filters.year) {
      const startDate = `${filters.year}-${filters.month.padStart(2, '0')}-01`;
      const endDate = `${filters.year}-${filters.month.padStart(2, '0')}-31`;
      // Show orders that overlap with the selected month:
      // - order starts before month ends AND order ends after month starts
      filtersArray.push(`(from<="${endDate}" && to>="${startDate}")`);
    } else if (filters.year) {
      // Only year filter if no month specified
      filtersArray.push(`from ~ "${filters.year}"`);
    }
    
    // Client filter
    if (filters.client) {
      filtersArray.push(`client="${filters.client}"`);
    }
    
    // Agency filter
    if (filters.agency) {
      filtersArray.push(`agency="${filters.agency}"`);
    }
    
    // Media received filter
    if (filters.media_received) {
      if (filters.media_received === 'taip') {
        filtersArray.push(`media_received=true`);
      } else if (filters.media_received === 'ne') {
        filtersArray.push(`media_received=false`);
      }
    }
    
    return filtersArray.join(' && ');
  }, [searchQuery, filters]);


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

  // Excel export function
  const handleExportToExcel = async () => {
    try {
      // Build filter string for export
      const filterString = buildFilterString();
      
      console.log('Export filters:', filters);
      console.log('Export filter string:', filterString);
      
      // Get all orders matching current filters
      const result = await PocketBaseService.getOrders({
        page: 1,
        perPage: 1000, // Get all orders
        sort: '-updated',
        filter: filterString
      });

      console.log('Export result:', result.items.length, 'orders');
      console.log('Approved orders:', result.items.filter(o => o.approved).length);

      if (result.items.length === 0) {
        alert('Nėra duomenų eksportuoti');
        return;
      }

      // Prepare data for Excel
      const excelData: any[] = result.items.map(order => ({
        'Užsakymo ID': order.invoice_id,
        'Klientas': order.client,
        'Agentūra': order.agency,
        'Data nuo': order.from ? format(new Date(order.from), 'yyyy-MM-dd') : '',
        'Data iki': order.to ? format(new Date(order.to), 'yyyy-MM-dd') : '',
        'Kaina': (Number(order.final_price) || 0) as number,
        'Statusas': order.approved ? 'Patvirtinta' : 'Nepatvirtinta',
        'Medija gauta': order.media_received ? 'Taip' : 'Ne',
        'Sąskaita išsiųsta': order.invoice_sent ? 'Taip' : 'Ne',
        'Atnaujinta': order.updated ? format(new Date(order.updated), 'yyyy-MM-dd HH:mm') : ''
      }));

      // Calculate total sum for current month
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();
      
      const approvedOrders = result.items.filter(order => {
        if (!order.approved) return false;
        
        // Check if order is from current month
        if (order.from) {
          const orderDate = new Date(order.from);
          return orderDate.getMonth() + 1 === currentMonth && orderDate.getFullYear() === currentYear;
        }
        return false;
      });
      
      const totalSum = approvedOrders.reduce((sum, order) => {
        const price = typeof order.final_price === 'string' ? parseFloat(order.final_price) : order.final_price;
        return sum + (price || 0);
      }, 0);

      // Add summary row
      excelData.push({
        'Užsakymo ID': '',
        'Klientas': '',
        'Agentūra': '',
        'Data nuo': '',
        'Data iki': '',
        'Kaina': `MĖNESIO SUMA: €${totalSum.toLocaleString('lt-LT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        'Statusas': '',
        'Medija gauta': '',
        'Sąskaita išsiųsta': '',
        'Atnaujinta': ''
      });

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(excelData);

      // Set column widths
      const colWidths = [
        { wch: 12 }, // Užsakymo ID
        { wch: 20 }, // Klientas
        { wch: 20 }, // Agentūra
        { wch: 12 }, // Data nuo
        { wch: 12 }, // Data iki
        { wch: 15 }, // Kaina
        { wch: 12 }, // Statusas
        { wch: 12 }, // Medija gauta
        { wch: 15 }, // Sąskaita išsiųsta
        { wch: 18 }  // Atnaujinta
      ];
      ws['!cols'] = colWidths;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Užsakymai');

      // Generate filename
      const now = new Date();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const year = now.getFullYear();
      const filename = `Užsakymai_${year}_${month}.xlsx`;

      // Save file
      XLSX.writeFile(wb, filename);
      
      alert(`Eksportuota ${result.items.length} užsakymų į ${filename}`);
    } catch (error) {
      console.error('Export error:', error);
      alert('Klaida eksportuojant duomenis');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header 
        onOpenWeekNumbers={handleOpenWeekNumbers}
        isDarkMode={isDarkMode}
        onToggleDarkMode={toggleDarkMode}
        onExportToExcel={handleExportToExcel}
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
