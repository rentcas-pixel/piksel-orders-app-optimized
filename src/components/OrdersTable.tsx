'use client';

import { useState, useEffect, useCallback } from 'react';
import { Order } from '@/types';
import { PocketBaseService } from '@/lib/pocketbase';
import { format } from 'date-fns';


interface OrdersTableProps {
  searchQuery: string;
  filters: {
    status: string;
    month: string;
    year: string;
    client: string;
    agency: string;
    media_received: string;
  };
  onEditOrder: (order: Order) => void;
}

export function OrdersTable({ searchQuery, filters, onEditOrder }: OrdersTableProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalSum, setTotalSum] = useState(0);
  const [sortField, setSortField] = useState<string>('updated');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Async function to calculate sum in background (non-blocking)
  const calculateSumAsync = async (filterString: string) => {
    try {
      const allOrdersForSum = await PocketBaseService.getOrders({
        page: 1,
        perPage: 200, // Reasonable limit
        sort: '-updated',
        filter: filterString
      });
      
      const approvedOrders = allOrdersForSum.items.filter(order => order.approved);
      const sum = approvedOrders.reduce((total, order) => total + (order.final_price || 0), 0);
      setTotalSum(sum);
    } catch {
      setTotalSum(0);
    }
  };

  // Function to check if media alert should be shown
  const shouldShowMediaAlert = (order: Order): boolean => {
    if (!order.approved || order.media_received) {
      return false;
    }

    try {
      const fromDate = new Date(order.from);
      const today = new Date();
      const timeDiff = fromDate.getTime() - today.getTime();
      const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
      
      // Show alert if: 2 days or less remaining, OR deadline has passed, OR today
      return daysDiff <= 2;
    } catch {
      return false;
    }
  };

  // Function to toggle invoice sent status
  const handleToggleInvoiceSent = async (order: Order) => {
    try {
      const updatedOrder = { ...order, invoice_sent: !order.invoice_sent };
      await PocketBaseService.updateOrder(order.id, updatedOrder);
      
      // Update local state
      setOrders(prev => prev.map(o => 
        o.id === order.id ? { ...o, invoice_sent: !o.invoice_sent } : o
      ));
    } catch (error) {
      console.error('Error updating invoice status:', error);
    }
  };

  const buildFilterString = useCallback(() => {
    const filtersArray = [];
    
    // Add search query filter
    if (searchQuery.trim()) {
      // Check if searching for "viad" to include viaduct orders
      if (searchQuery.toLowerCase().startsWith('viad')) {
        filtersArray.push(`(client~"${searchQuery}" || agency~"${searchQuery}" || invoice_id~"${searchQuery}" || viaduct=true)`);
      } else {
        filtersArray.push(`(client~"${searchQuery}" || agency~"${searchQuery}" || invoice_id~"${searchQuery}")`);
      }
    }
    
    // Status filter - handle boolean conversion
    if (filters.status) {
      if (filters.status === 'taip') {
        filtersArray.push(`approved=true`);
      } else if (filters.status === 'ne') {
        filtersArray.push(`approved=false`);
      }
    }
    
    // Client filter
    if (filters.client.trim()) {
      filtersArray.push(`client~"${filters.client}"`);
    }
    
    // Agency filter
    if (filters.agency.trim()) {
      filtersArray.push(`agency~"${filters.agency}"`);
    }
    
    // Media received filter
    if (filters.media_received) {
      if (filters.media_received === 'true') {
        filtersArray.push(`media_received=true`);
      } else if (filters.media_received === 'false') {
        filtersArray.push(`media_received=false`);
      }
    }
    
    // Date filters - show orders that overlap with the selected month
    if (filters.month && filters.year) {
      const startDate = `${filters.year}-${filters.month.padStart(2, '0')}-01`;
      const endDate = `${filters.year}-${filters.month.padStart(2, '0')}-31`;
      // Show orders that overlap with the selected month:
      // - order starts before month ends AND order ends after month starts
      filtersArray.push(`(from<="${endDate}" && to>="${startDate}")`);
    }
    
    // If no filters, return empty string
    if (filtersArray.length === 0) {
      return '';
    }
    
    const result = filtersArray.join(' && ');
    return result;
  }, [searchQuery, filters]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: string) => {
    if (sortField !== field) {
      return (
        <svg className="w-3 h-3 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
        </svg>
      );
    }
    
    if (sortDirection === 'asc') {
      return (
        <svg className="w-3 h-3 text-blue-500 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 9l4-4 4 4" />
        </svg>
      );
    }
    
    return (
      <svg className="w-3 h-3 text-blue-500 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 15l4 4 4-4" />
      </svg>
    );
  };

  const getStatusText = (approved: boolean) => {
    return approved ? 'Patvirtinta' : 'Nepatvirtinta';
  };

  const getStatusColor = (approved: boolean) => {
    if (approved) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'yyyy-MM-dd');
    } catch {
      return dateString;
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('lt-LT', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  };

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const filterString = buildFilterString();
        
        const result = await PocketBaseService.getOrders({
          page: currentPage,
          perPage: 20,
          sort: `${sortDirection === 'desc' ? '-' : ''}${sortField}`,
          filter: filterString
        });
        
        setOrders(result.items);
        setTotalPages(result.totalPages);
        setTotalItems(result.totalItems);
        
        // Calculate sum asynchronously in background (non-blocking)
        calculateSumAsync(filterString);
              } catch (error) {
          console.error('Failed to fetch orders:', error);
          setOrders([]);
          setTotalPages(1);
          setTotalItems(0);
        } finally {
          setLoading(false);
        }
      };

      fetchOrders();
    }, [currentPage, searchQuery, filters, sortField, sortDirection, buildFilterString]);























  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600 dark:text-gray-400">Kraunama...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Table Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Užsakymai ({totalItems})
              {totalSum > 0 && (
                <span className="ml-2 text-sm font-normal text-green-600 dark:text-green-400">
                  - Suma: €{totalSum.toLocaleString('lt-LT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              )}
            </h2>
            {sortField && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Rūšiuojama pagal: <span className="font-medium">{sortField}</span> 
                ({sortDirection === 'asc' ? 'didėjimo' : 'mažėjimo'} tvarka)
              </p>
            )}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Puslapis {currentPage} iš {totalPages}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                onClick={() => handleSort('client')}
              >
                <div className="flex items-center space-x-1">
                  <span>Klientas</span>
                  {getSortIcon('client')}
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                onClick={() => handleSort('agency')}
              >
                <div className="flex items-center space-x-1">
                  <span>Agentūra</span>
                  {getSortIcon('agency')}
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                onClick={() => handleSort('invoice_id')}
              >
                <div className="flex items-center space-x-1">
                  <span>Užsakymo Nr.</span>
                  {getSortIcon('invoice_id')}
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                onClick={() => handleSort('approved')}
              >
                <div className="flex items-center space-x-1">
                  <span>Statusas</span>
                  {getSortIcon('approved')}
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                onClick={() => handleSort('from')}
              >
                <div className="flex items-center space-x-1">
                  <span>Data nuo</span>
                  {getSortIcon('from')}
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                onClick={() => handleSort('to')}
              >
                <div className="flex items-center space-x-1">
                  <span>Data iki</span>
                  {getSortIcon('to')}
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                onClick={() => handleSort('media_received')}
              >
                <div className="flex items-center space-x-1">
                  <span>Media gautas</span>
                  {getSortIcon('media_received')}
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                onClick={() => handleSort('final_price')}
              >
                <div className="flex items-center space-x-1">
                  <span>Kaina</span>
                  {getSortIcon('final_price')}
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                onClick={() => handleSort('invoice_sent')}
              >
                <div className="flex items-center space-x-1">
                  <span>Sąskaita</span>
                  {getSortIcon('invoice_sent')}
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {orders.map((order) => (
              <tr 
                key={order.id} 
                className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                onClick={() => onEditOrder(order)}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    {order.viaduct && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        Viadukai
                      </div>
                    )}
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {order.client}
                      {shouldShowMediaAlert(order) && (
                        <span className="ml-2 text-red-600 animate-pulse">
                          ⚠️
                        </span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {order.agency || '-'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900 dark:text-white">
                    {order.invoice_id}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.approved)}`}>
                    {getStatusText(order.approved)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900 dark:text-white">
                    {formatDate(order.from)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900 dark:text-white">
                    {formatDate(order.to)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    order.media_received 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  }`}>
                    {order.media_received ? 'Taip' : 'Ne'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {formatPrice(order.final_price)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleInvoiceSent(order);
                    }}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                      order.invoice_sent ? 'bg-green-300' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        order.invoice_sent ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700 dark:text-gray-300">
              Rodoma {((currentPage - 1) * 20) + 1} - {Math.min(currentPage * 20, totalItems)} iš {totalItems} rezultatų
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Ankstesnis
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Sekantis
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
