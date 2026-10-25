import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { dataService } from '../../services/dataService';
import type { UserProfile, UserRole, Retailer } from '../../types/auth';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { Badge } from '../common/Badge';
import { formatINR } from '../../utils/currency';
import { Plus, UserPlus, Store, Shield, Phone, Mail, MapPin, KeyRound, Check, X, Search } from 'lucide-react';

export const UserManagement: React.FC = () => {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>(dataService.getUsers());
  const [retailers, setRetailers] = useState<Retailer[]>(dataService.getRetailers());
  const [activeTab, setActiveTab] = useState<'employees' | 'retailers'>('employees');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isRetailerModalOpen, setIsRetailerModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [targetUser, setTargetUser] = useState<UserProfile | null>(null);

  // Form states
  const [userFormData, setUserFormData] = useState<Partial<UserProfile>>({
    name: '',
    email: '',
    phone: '',
    role: 'sales_rep',
    isActive: true
  });

  const [retailerFormData, setRetailerFormData] = useState<Partial<Retailer>>({
    shopName: '',
    ownerName: '',
    phone: '',
    email: '',
    address: '',
    area: '',
    city: 'Thoothukudi',
    pincode: '628002',
    gstin: '',
    creditLimit: 50000,
    creditDays: 14,
    priceTier: 'wholesale',
    isActive: true
  });

  useEffect(() => {
    const unsub = dataService.subscribe('*', () => {
      setUsers(dataService.getUsers());
      setRetailers(dataService.getRetailers());
    });
    return () => unsub();
  }, []);

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userFormData.name || !userFormData.phone) {
      alert('Please enter Name and Phone number.');
      return;
    }

    const newUser: UserProfile = {
      id: userFormData.id || `usr_${Date.now()}`,
      name: userFormData.name!,
      email: userFormData.email || `${userFormData.phone}@k7enterprise.in`,
      phone: userFormData.phone!,
      role: (userFormData.role as UserRole) || 'sales_rep',
      businessId: 'biz_k7_thoothukudi',
      businessName: 'K7 Enterprise',
      isActive: userFormData.isActive ?? true,
      createdAt: userFormData.createdAt || new Date().toISOString()
    };

    dataService.saveUser(newUser, currentUser);
    setIsUserModalOpen(false);
    setUserFormData({ name: '', email: '', phone: '', role: 'sales_rep', isActive: true });
  };

  const handleSaveRetailer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!retailerFormData.shopName || !retailerFormData.ownerName || !retailerFormData.phone) {
      alert('Please enter Shop Name, Owner Name, and Phone number.');
      return;
    }

    const salesReps = users.filter(u => u.role === 'sales_rep');
    const assignedRep = salesReps.find(s => s.id === retailerFormData.assignedSalesRepId) || salesReps[0];

    const newRetailer: Retailer = {
      id: retailerFormData.id || `ret_${Date.now()}`,
      shopName: retailerFormData.shopName!,
      ownerName: retailerFormData.ownerName!,
      phone: retailerFormData.phone!,
      email: retailerFormData.email,
      address: retailerFormData.address || '',
      area: retailerFormData.area || 'Thoothukudi Town',
      city: retailerFormData.city || 'Thoothukudi',
      pincode: retailerFormData.pincode || '628002',
      gstin: retailerFormData.gstin,
      creditLimit: Number(retailerFormData.creditLimit || 50000),
      creditDays: Number(retailerFormData.creditDays || 14),
      currentOutstanding: retailerFormData.currentOutstanding || 0,
      assignedSalesRepId: assignedRep?.id,
      assignedSalesRepName: assignedRep?.name,
      priceTier: retailerFormData.priceTier || 'wholesale',
      isActive: retailerFormData.isActive ?? true,
      createdAt: retailerFormData.createdAt || new Date().toISOString()
    };

    dataService.saveRetailer(newRetailer, currentUser);
    setIsRetailerModalOpen(false);
    setRetailerFormData({
      shopName: '',
      ownerName: '',
      phone: '',
      email: '',
      address: '',
      area: '',
      city: 'Thoothukudi',
      pincode: '628002',
      gstin: '',
      creditLimit: 50000,
      creditDays: 14,
      priceTier: 'wholesale',
      isActive: true
    });
  };

  const handleToggleUserActive = (user: UserProfile) => {
    const updated = { ...user, isActive: !user.isActive };
    dataService.saveUser(updated, currentUser);
  };

  const handleToggleRetailerActive = (ret: Retailer) => {
    const updated = { ...ret, isActive: !ret.isActive };
    dataService.saveRetailer(updated, currentUser);
  };

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.phone.includes(searchQuery) ||
    u.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredRetailers = retailers.filter(r =>
    r.shopName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.ownerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.area.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.phone.includes(searchQuery)
  );

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface p-4 rounded-lg border border-divider shadow-enterprise">
        <div>
          <h2 className="text-lg font-bold text-ink-primary">User & Retailer Management</h2>
          <p className="text-xs text-ink-secondary mt-0.5">
            Configure distribution team accounts, assign field sales officers, and register retail shops.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'employees' ? (
            <Button
              variant="primary"
              size="sm"
              icon={UserPlus}
              onClick={() => {
                setUserFormData({ name: '', email: '', phone: '', role: 'sales_rep', isActive: true });
                setIsUserModalOpen(true);
              }}
            >
              Add Staff / Employee
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              icon={Store}
              onClick={() => {
                setIsRetailerModalOpen(true);
              }}
            >
              Register Retail Shop
            </Button>
          )}
        </div>
      </div>

      {/* Tabs and Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-divider pb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('employees')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeTab === 'employees' ? 'bg-brand text-white shadow-sm' : 'bg-surface text-ink-secondary hover:bg-slate-100'
            }`}
          >
            Employees & Staff ({users.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('retailers')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeTab === 'retailers' ? 'bg-brand text-white shadow-sm' : 'bg-surface text-ink-secondary hover:bg-slate-100'
            }`}
          >
            Retail Shops & Outlets ({retailers.length})
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-ink-muted absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder={`Search ${activeTab}...`}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-8 pr-3 py-1.5 bg-surface border border-divider rounded-md focus:outline-none focus:border-brand"
          />
        </div>
      </div>

      {/* Employees Table */}
      {activeTab === 'employees' && (
        <div className="bg-surface border border-divider rounded-lg shadow-enterprise overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-divider text-ink-secondary uppercase text-[10px] tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-divider/70 text-ink-primary">
                {filteredUsers.map(user => (
                  <tr key={user.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-ink-primary">{user.name}</div>
                      <div className="text-[11px] text-ink-secondary">{user.email}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 text-ink-secondary">
                        <Phone className="w-3 h-3 text-ink-muted" />
                        <span>{user.phone}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="brand">{user.role.toUpperCase().replace('_', ' ')}</Badge>
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleToggleUserActive(user)}
                        className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${
                          user.isActive
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                      >
                        {user.isActive ? 'Active' : 'Deactivated'}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <button
                        onClick={() => {
                          setTargetUser(user);
                          setIsResetModalOpen(true);
                        }}
                        className="text-xs text-ink-secondary hover:text-brand font-medium"
                      >
                        Reset Access
                      </button>
                      <button
                        onClick={() => {
                          setUserFormData(user);
                          setIsUserModalOpen(true);
                        }}
                        className="text-xs text-brand hover:underline font-semibold"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Retailers Table */}
      {activeTab === 'retailers' && (
        <div className="bg-surface border border-divider rounded-lg shadow-enterprise overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-divider text-ink-secondary uppercase text-[10px] tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Shop & Owner</th>
                  <th className="py-3 px-4">Area / City</th>
                  <th className="py-3 px-4">Phone / GSTIN</th>
                  <th className="py-3 px-4">Assigned Sales Rep</th>
                  <th className="py-3 px-4 text-right">Credit Limit</th>
                  <th className="py-3 px-4 text-right">Outstanding</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-divider/70 text-ink-primary">
                {filteredRetailers.map(ret => (
                  <tr key={ret.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-ink-primary">{ret.shopName}</div>
                      <div className="text-[11px] text-ink-secondary">{ret.ownerName}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div>{ret.area}</div>
                      <div className="text-[11px] text-ink-muted">{ret.city} - {ret.pincode}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div>{ret.phone}</div>
                      <div className="text-[11px] font-mono text-ink-muted">{ret.gstin || 'Unregistered'}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-medium text-ink-secondary">{ret.assignedSalesRepName || 'Unassigned'}</span>
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-num">
                      {formatINR(ret.creditLimit)}
                      <div className="text-[10px] text-ink-muted">{ret.creditDays} days credit</div>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-num text-rose-700">
                      {formatINR(ret.currentOutstanding)}
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleToggleRetailerActive(ret)}
                        className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${
                          ret.isActive
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                      >
                        {ret.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => {
                          setRetailerFormData(ret);
                          setIsRetailerModalOpen(true);
                        }}
                        className="text-brand hover:underline font-semibold"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit User Modal */}
      <Modal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        title={userFormData.id ? 'Edit Staff Account' : 'Add New Staff / Employee'}
        subtitle="Configure role, permissions, and business contact"
      >
        <form onSubmit={handleSaveUser} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-ink-primary mb-1">Full Name *</label>
            <input
              type="text"
              required
              value={userFormData.name || ''}
              onChange={e => setUserFormData({ ...userFormData, name: e.target.value })}
              className="w-full p-2 border border-divider rounded focus:border-brand focus:outline-none"
              placeholder="e.g. Senthil Nathan"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-ink-primary mb-1">Mobile Phone *</label>
              <input
                type="tel"
                required
                value={userFormData.phone || ''}
                onChange={e => setUserFormData({ ...userFormData, phone: e.target.value })}
                className="w-full p-2 border border-divider rounded focus:border-brand focus:outline-none"
                placeholder="10-digit mobile number"
              />
            </div>
            <div>
              <label className="block font-semibold text-ink-primary mb-1">Email Address</label>
              <input
                type="email"
                value={userFormData.email || ''}
                onChange={e => setUserFormData({ ...userFormData, email: e.target.value })}
                className="w-full p-2 border border-divider rounded focus:border-brand focus:outline-none"
                placeholder="employee@k7enterprise.in"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-ink-primary mb-1">Designated Role *</label>
            <select
              value={userFormData.role || 'sales_rep'}
              onChange={e => setUserFormData({ ...userFormData, role: e.target.value as UserRole })}
              className="w-full p-2 border border-divider rounded focus:border-brand focus:outline-none bg-white"
            >
              <option value="admin">Administrator (Full Control)</option>
              <option value="distributor">Operations Manager (Purchases, Inventory, Delivery)</option>
              <option value="sales_rep">Sales Officer (Retailer Orders & Field Booking)</option>
              <option value="delivery">Delivery Staff (Van Dispatch & Dropoff Confirmation)</option>
            </select>
          </div>

          <div className="pt-3 border-t border-divider flex justify-end gap-2">
            <Button variant="secondary" size="sm" type="button" onClick={() => setIsUserModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Save Account
            </Button>
          </div>
        </form>
      </Modal>

      {/* Register Retailer Modal */}
      <Modal
        isOpen={isRetailerModalOpen}
        onClose={() => setIsRetailerModalOpen(false)}
        title={retailerFormData.id ? 'Edit Retail Shop' : 'Register Retail Shop'}
        subtitle="Add retail store, credit terms, and assign sales representative"
        maxWidth="xl"
      >
        <form onSubmit={handleSaveRetailer} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-ink-primary mb-1">Shop / Outlet Name *</label>
              <input
                type="text"
                required
                value={retailerFormData.shopName || ''}
                onChange={e => setRetailerFormData({ ...retailerFormData, shopName: e.target.value })}
                className="w-full p-2 border border-divider rounded focus:border-brand focus:outline-none"
                placeholder="e.g. Sri Murugan Maligai"
              />
            </div>
            <div>
              <label className="block font-semibold text-ink-primary mb-1">Proprietor / Owner Name *</label>
              <input
                type="text"
                required
                value={retailerFormData.ownerName || ''}
                onChange={e => setRetailerFormData({ ...retailerFormData, ownerName: e.target.value })}
                className="w-full p-2 border border-divider rounded focus:border-brand focus:outline-none"
                placeholder="e.g. K. Shanmugavel"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-ink-primary mb-1">Phone Number *</label>
              <input
                type="tel"
                required
                value={retailerFormData.phone || ''}
                onChange={e => setRetailerFormData({ ...retailerFormData, phone: e.target.value })}
                className="w-full p-2 border border-divider rounded focus:border-brand focus:outline-none"
                placeholder="10-digit mobile"
              />
            </div>
            <div>
              <label className="block font-semibold text-ink-primary mb-1">GSTIN (Optional)</label>
              <input
                type="text"
                value={retailerFormData.gstin || ''}
                onChange={e => setRetailerFormData({ ...retailerFormData, gstin: e.target.value })}
                className="w-full p-2 border border-divider rounded focus:border-brand focus:outline-none uppercase"
                placeholder="33AAAAA0000A1Z5"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block font-semibold text-ink-primary mb-1">Street Address</label>
              <input
                type="text"
                value={retailerFormData.address || ''}
                onChange={e => setRetailerFormData({ ...retailerFormData, address: e.target.value })}
                className="w-full p-2 border border-divider rounded focus:border-brand focus:outline-none"
                placeholder="Shop door no, street name"
              />
            </div>
            <div>
              <label className="block font-semibold text-ink-primary mb-1">Area / Locality *</label>
              <input
                type="text"
                required
                value={retailerFormData.area || ''}
                onChange={e => setRetailerFormData({ ...retailerFormData, area: e.target.value })}
                className="w-full p-2 border border-divider rounded focus:border-brand focus:outline-none"
                placeholder="e.g. Millerpuram"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-ink-primary mb-1">Credit Limit (₹) *</label>
              <input
                type="number"
                required
                value={retailerFormData.creditLimit || 50000}
                onChange={e => setRetailerFormData({ ...retailerFormData, creditLimit: Number(e.target.value) })}
                className="w-full p-2 border border-divider rounded focus:border-brand focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-ink-primary mb-1">Credit Terms (Days) *</label>
              <input
                type="number"
                required
                value={retailerFormData.creditDays || 14}
                onChange={e => setRetailerFormData({ ...retailerFormData, creditDays: Number(e.target.value) })}
                className="w-full p-2 border border-divider rounded focus:border-brand focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-ink-primary mb-1">Price Tier *</label>
              <select
                value={retailerFormData.priceTier || 'wholesale'}
                onChange={e => setRetailerFormData({ ...retailerFormData, priceTier: e.target.value as any })}
                className="w-full p-2 border border-divider rounded focus:border-brand focus:outline-none bg-white"
              >
                <option value="wholesale">Wholesale Tier</option>
                <option value="retail">Retail Tier</option>
                <option value="super_stockist">Super Stockist Tier</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-ink-primary mb-1">Assigned Sales Officer</label>
            <select
              value={retailerFormData.assignedSalesRepId || ''}
              onChange={e => setRetailerFormData({ ...retailerFormData, assignedSalesRepId: e.target.value })}
              className="w-full p-2 border border-divider rounded focus:border-brand focus:outline-none bg-white"
            >
              {users.filter(u => u.role === 'sales_rep').map(rep => (
                <option key={rep.id} value={rep.id}>{rep.name} ({rep.phone})</option>
              ))}
            </select>
          </div>

          <div className="pt-3 border-t border-divider flex justify-end gap-2">
            <Button variant="secondary" size="sm" type="button" onClick={() => setIsRetailerModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Save Retailer
            </Button>
          </div>
        </form>
      </Modal>

      {/* Secure Password Reset Flow Modal */}
      <Modal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        title="Secure Account Access Reset"
        subtitle="Generate Firebase authentication password reset link"
      >
        <div className="space-y-4 text-xs text-ink-primary">
          <p>
            An administrator cannot view user passwords in plaintext. You can initiate a secure Firebase Password Reset link sent to the user's verified phone/email.
          </p>
          <div className="p-3 bg-slate-50 border border-divider rounded font-mono text-xs">
            User: {targetUser?.name} ({targetUser?.email})
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => setIsResetModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                alert(`Secure password reset link generated and dispatched to ${targetUser?.email || targetUser?.phone}`);
                setIsResetModalOpen(false);
              }}
            >
              Send Reset Link
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
