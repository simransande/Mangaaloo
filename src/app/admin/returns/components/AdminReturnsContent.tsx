'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Icon from '@/components/ui/AppIcon';
import { useToast } from '@/lib/contexts/ToastContext';

import { authService } from '@/lib/supabase/services/auth';
import { returnService } from '@/lib/supabase/services/returns';
import type { Return } from '@/lib/supabase/types';

export default function AdminReturnsContent() {
  const router = useRouter();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [returns, setReturns] = useState<Return[]>([]);
  const [filteredReturns, setFilteredReturns] = useState<Return[]>([]);
  const [updatingReturnId, setUpdatingReturnId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    refunded: 0,
    rejected: 0,
    totalRefundAmount: 0,
  });

  useEffect(() => {
    const checkAdminAndFetchData = async () => {
      try {
        setLoading(true);

        // Get current user with proper error handling
        let user = null;
        try {
          user = await authService.getCurrentUser();
        } catch (authError) {
          console.error('Auth error:', authError);
          router.push('/admin/login');
          return;
        }

        if (!user) {
          router.push('/admin/login');
          return;
        }

        // Check if user is admin
        let isAdmin = false;
        try {
          isAdmin = await authService.isAdmin(user.id);
        } catch (adminCheckError) {
          console.error('Admin check error:', adminCheckError);
          router.push('/admin/login');
          return;
        }

        if (!isAdmin) {
          router.push('/admin/login');
          return;
        }

        // Fetch returns
        const allReturns = await returnService.getAll();
        setReturns(allReturns);
        setFilteredReturns(allReturns);

        // Fetch stats
        const returnStats = await returnService.getStats();
        setStats(returnStats);

        // Subscribe to real-time return updates
        const channel = returnService.subscribeToReturnUpdates((updatedReturn) => {
          setReturns((prevReturns) => {
            const returnIndex = prevReturns.findIndex((r) => r.id === updatedReturn.id);
            if (returnIndex !== -1) {
              const newReturns = [...prevReturns];
              newReturns[returnIndex] = updatedReturn;
              return newReturns;
            } else {
              return [updatedReturn, ...prevReturns];
            }
          });
        });

        // Cleanup subscription on unmount
        return () => {
          returnService.unsubscribe(channel);
        };
      } catch (err: any) {
        console.error('Error fetching returns data:', err);
        setError(err.message || 'Failed to load returns data');
      } finally {
        setLoading(false);
      }
    };

    checkAdminAndFetchData();
  }, [router]);

  // Filter returns based on status and search query
  useEffect(() => {
    let filtered = returns;

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter((r) => r.status === filterStatus);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.return_number.toLowerCase().includes(query) ||
          r.customer_name.toLowerCase().includes(query) ||
          r.customer_email.toLowerCase().includes(query)
      );
    }

    setFilteredReturns(filtered);
  }, [filterStatus, searchQuery, returns]);

  const handleUpdateStatus = async (returnId: string, newStatus: Return['status']) => {
    try {
      setUpdatingReturnId(returnId);
      const user = await authService.getCurrentUser();
      if (!user) return;

      await returnService.updateStatus(returnId, newStatus, user.id);

      // Refresh stats
      const returnStats = await returnService.getStats();
      setStats(returnStats);
    } catch (err: any) {
      console.error('Error updating return status:', err);
      showToast(`Failed to update return status: ${err.message}`, 'error');
    } finally {
      setUpdatingReturnId(null);
    }
  };

  const handleProcessRefund = async (returnId: string) => {
    if (!confirm('Are you sure you want to process this refund?')) return;

    try {
      setUpdatingReturnId(returnId);
      const user = await authService.getCurrentUser();
      if (!user) return;

      await returnService.processRefund(returnId, user.id, 'Refund processed successfully');

      // Refresh stats
      const returnStats = await returnService.getStats();
      setStats(returnStats);

      showToast('Refund processed successfully!', 'success');
    } catch (err: any) {
      console.error('Error processing refund:', err);
      showToast(`Failed to process refund: ${err.message}`, 'error');
    } finally {
      setUpdatingReturnId(null);
    }
  };

  const getStatusBadgeColor = (status: Return['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-blue-100 text-blue-800';
      case 'refunded':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getReasonLabel = (reason: Return['reason']) => {
    const labels: Record<Return['reason'], string> = {
      defective: 'Defective',
      wrong_item: 'Wrong Item',
      size_issue: 'Size Issue',
      quality_issue: 'Quality Issue',
      not_as_described: 'Not as Described',
      changed_mind: 'Changed Mind',
      damaged_in_transit: 'Damaged in Transit',
      other: 'Other',
    };
    return labels[reason];
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin/dashboard">
                <Icon name="ArrowLeftIcon" size={24} className="text-gray-600 hover:text-primary" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Returns Management</h1>
                <p className="text-sm text-gray-600">Manage customer return requests and refunds</p>
              </div>
            </div>
            <Link
              href="/admin/dashboard"
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center gap-3">
              <Icon name="ClipboardDocumentListIcon" size={24} className="text-gray-600" />
              <div>
                <p className="text-sm text-gray-600">Total Returns</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center gap-3">
              <Icon name="ClockIcon" size={24} className="text-yellow-600" />
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center gap-3">
              <Icon name="CheckCircleIcon" size={24} className="text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Approved</p>
                <p className="text-2xl font-bold text-blue-600">{stats.approved}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center gap-3">
              <Icon name="CurrencyDollarIcon" size={24} className="text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Refunded</p>
                <p className="text-2xl font-bold text-green-600">{stats.refunded}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center gap-3">
              <Icon name="XCircleIcon" size={24} className="text-red-600" />
              <div>
                <p className="text-sm text-gray-600">Rejected</p>
                <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center gap-3">
              <Icon name="BanknotesIcon" size={24} className="text-primary" />
              <div>
                <p className="text-sm text-gray-600">Total Refunds</p>
                <p className="text-2xl font-bold text-primary">
                  ₹{stats.totalRefundAmount.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="all">All Returns</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="refunded">Refunded</option>
                <option value="rejected">Rejected</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <input
                type="text"
                placeholder="Search by return number, customer name, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Returns Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Return #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reason
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Refund Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredReturns.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      No returns found
                    </td>
                  </tr>
                ) : (
                  filteredReturns.map((returnItem) => (
                    <tr key={returnItem.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {returnItem.return_number}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{returnItem.customer_name}</div>
                        <div className="text-sm text-gray-500">{returnItem.customer_email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {getReasonLabel(returnItem.reason)}
                        </div>
                        {returnItem.reason_details && (
                          <div className="text-xs text-gray-500 mt-1 max-w-xs truncate">
                            {returnItem.reason_details}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          ₹{returnItem.refund_amount.toFixed(2)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(
                            returnItem.status
                          )}`}
                        >
                          {returnItem.status.charAt(0).toUpperCase() + returnItem.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(returnItem.created_at).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(returnItem.created_at).toLocaleTimeString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {returnItem.status === 'pending' && (
                            <>
                              <select
                                value={returnItem.status}
                                onChange={(e) =>
                                  handleUpdateStatus(
                                    returnItem.id,
                                    e.target.value as Return['status']
                                  )
                                }
                                disabled={updatingReturnId === returnItem.id}
                                className="text-sm px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50"
                              >
                                <option value="pending">Pending</option>
                                <option value="approved">Approve</option>
                                <option value="rejected">Reject</option>
                              </select>
                            </>
                          )}
                          {returnItem.status === 'approved' && (
                            <button
                              onClick={() => handleProcessRefund(returnItem.id)}
                              disabled={updatingReturnId === returnItem.id}
                              className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                            >
                              {updatingReturnId === returnItem.id
                                ? 'Processing...'
                                : 'Process Refund'}
                            </button>
                          )}
                          {(returnItem.status === 'refunded' ||
                            returnItem.status === 'rejected' ||
                            returnItem.status === 'cancelled') && (
                            <span className="text-sm text-gray-500">No actions</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
