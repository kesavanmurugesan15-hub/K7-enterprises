import React, { useState } from 'react';
import { useBusiness } from '../../context/BusinessContext';
import { Button } from '../common/Button';
import { Save, Building2, Landmark, FileText, CheckCircle2 } from 'lucide-react';

export const BusinessSettingsView: React.FC = () => {
  const { settings, updateSettings } = useBusiness();
  const [formData, setFormData] = useState(settings);
  const [isSaved, setIsSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(formData);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="bg-surface p-4 rounded-lg border border-divider shadow-enterprise flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-ink-primary">Business Settings & Profile</h2>
          <p className="text-xs text-ink-secondary mt-0.5">
            Configure K7 Enterprise master details, GSTIN, invoice prefixes, and settlement bank accounts.
          </p>
        </div>
        {isSaved && (
          <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-md font-medium animate-in fade-in">
            <CheckCircle2 className="w-4 h-4" />
            <span>Settings saved successfully</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 text-xs">
        {/* Business Entity Details */}
        <div className="bg-surface p-5 rounded-lg border border-divider shadow-enterprise space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-divider">
            <Building2 className="w-4 h-4 text-brand" />
            <h3 className="text-sm font-semibold text-ink-primary">Distributor Entity & Location</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-ink-primary mb-1">Company / Firm Name *</label>
              <input
                type="text"
                required
                value={formData.businessName}
                onChange={e => setFormData({ ...formData, businessName: e.target.value, distributorName: e.target.value })}
                className="w-full p-2 border border-divider rounded focus:border-brand focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-ink-primary mb-1">Business Tagline / Subtitle</label>
              <input
                type="text"
                value={formData.subTitle}
                onChange={e => setFormData({ ...formData, subTitle: e.target.value })}
                className="w-full p-2 border border-divider rounded focus:border-brand focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-ink-primary mb-1">Registered Godown & Office Address *</label>
            <input
              type="text"
              required
              value={formData.address}
              onChange={e => setFormData({ ...formData, address: e.target.value })}
              className="w-full p-2 border border-divider rounded focus:border-brand focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="block font-semibold text-ink-primary mb-1">City / Town *</label>
              <input
                type="text"
                required
                value={formData.city}
                onChange={e => setFormData({ ...formData, city: e.target.value })}
                className="w-full p-2 border border-divider rounded focus:border-brand focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-ink-primary mb-1">District *</label>
              <input
                type="text"
                required
                value={formData.district}
                onChange={e => setFormData({ ...formData, district: e.target.value })}
                className="w-full p-2 border border-divider rounded focus:border-brand focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-ink-primary mb-1">State *</label>
              <input
                type="text"
                required
                value={formData.state}
                onChange={e => setFormData({ ...formData, state: e.target.value })}
                className="w-full p-2 border border-divider rounded focus:border-brand focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-ink-primary mb-1">Pincode *</label>
              <input
                type="text"
                required
                value={formData.pincode}
                onChange={e => setFormData({ ...formData, pincode: e.target.value })}
                className="w-full p-2 border border-divider rounded focus:border-brand focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div>
              <label className="block font-semibold text-ink-primary mb-1">GSTIN Number *</label>
              <input
                type="text"
                required
                value={formData.gstin}
                onChange={e => setFormData({ ...formData, gstin: e.target.value })}
                className="w-full p-2 border border-divider rounded focus:border-brand focus:outline-none font-mono uppercase"
              />
            </div>
            <div>
              <label className="block font-semibold text-ink-primary mb-1">PAN Number *</label>
              <input
                type="text"
                required
                value={formData.panNumber}
                onChange={e => setFormData({ ...formData, panNumber: e.target.value })}
                className="w-full p-2 border border-divider rounded focus:border-brand focus:outline-none font-mono uppercase"
              />
            </div>
            <div>
              <label className="block font-semibold text-ink-primary mb-1">FSSAI License Number</label>
              <input
                type="text"
                value={formData.fssaiNumber}
                onChange={e => setFormData({ ...formData, fssaiNumber: e.target.value })}
                className="w-full p-2 border border-divider rounded focus:border-brand focus:outline-none font-mono"
              />
            </div>
          </div>
        </div>

        {/* Bank & Settlement Details */}
        <div className="bg-surface p-5 rounded-lg border border-divider shadow-enterprise space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-divider">
            <Landmark className="w-4 h-4 text-brand" />
            <h3 className="text-sm font-semibold text-ink-primary">Primary Bank & UPI Settlement Information</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-ink-primary mb-1">Beneficiary Name *</label>
              <input
                type="text"
                required
                value={formData.bankDetails.accountName}
                onChange={e => setFormData({
                  ...formData,
                  bankDetails: { ...formData.bankDetails, accountName: e.target.value }
                })}
                className="w-full p-2 border border-divider rounded focus:border-brand focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-ink-primary mb-1">Bank Name *</label>
              <input
                type="text"
                required
                value={formData.bankDetails.bankName}
                onChange={e => setFormData({
                  ...formData,
                  bankDetails: { ...formData.bankDetails, bankName: e.target.value }
                })}
                className="w-full p-2 border border-divider rounded focus:border-brand focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-ink-primary mb-1">Account Number *</label>
              <input
                type="text"
                required
                value={formData.bankDetails.accountNumber}
                onChange={e => setFormData({
                  ...formData,
                  bankDetails: { ...formData.bankDetails, accountNumber: e.target.value }
                })}
                className="w-full p-2 border border-divider rounded focus:border-brand focus:outline-none font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-ink-primary mb-1">Branch Name</label>
              <input
                type="text"
                value={formData.bankDetails.branch}
                onChange={e => setFormData({
                  ...formData,
                  bankDetails: { ...formData.bankDetails, branch: e.target.value }
                })}
                className="w-full p-2 border border-divider rounded focus:border-brand focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-ink-primary mb-1">IFSC Code *</label>
              <input
                type="text"
                required
                value={formData.bankDetails.ifscCode}
                onChange={e => setFormData({
                  ...formData,
                  bankDetails: { ...formData.bankDetails, ifscCode: e.target.value }
                })}
                className="w-full p-2 border border-divider rounded focus:border-brand focus:outline-none font-mono uppercase"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-ink-primary mb-1">UPI ID (For Quick QR Collections)</label>
            <input
              type="text"
              value={formData.bankDetails.upiId}
              onChange={e => setFormData({
                ...formData,
                bankDetails: { ...formData.bankDetails, upiId: e.target.value }
              })}
              className="w-full p-2 border border-divider rounded focus:border-brand focus:outline-none font-mono"
              placeholder="k7enterprise@tmb"
            />
          </div>
        </div>

        {/* Invoice & Prefix Rules */}
        <div className="bg-surface p-5 rounded-lg border border-divider shadow-enterprise space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-divider">
            <FileText className="w-4 h-4 text-brand" />
            <h3 className="text-sm font-semibold text-ink-primary">Invoicing Rules & Approval Limits</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-ink-primary mb-1">Invoice Prefix *</label>
              <input
                type="text"
                required
                value={formData.invoicePrefix}
                onChange={e => setFormData({ ...formData, invoicePrefix: e.target.value })}
                className="w-full p-2 border border-divider rounded focus:border-brand focus:outline-none font-mono"
                placeholder="K7/INV/26-27/"
              />
            </div>
            <div>
              <label className="block font-semibold text-ink-primary mb-1">Order Prefix *</label>
              <input
                type="text"
                required
                value={formData.orderPrefix}
                onChange={e => setFormData({ ...formData, orderPrefix: e.target.value })}
                className="w-full p-2 border border-divider rounded focus:border-brand focus:outline-none font-mono"
                placeholder="K7-SO-"
              />
            </div>
            <div>
              <label className="block font-semibold text-ink-primary mb-1">Current Financial Year *</label>
              <input
                type="text"
                required
                value={formData.financialYear}
                onChange={e => setFormData({ ...formData, financialYear: e.target.value })}
                className="w-full p-2 border border-divider rounded focus:border-brand focus:outline-none font-mono"
                placeholder="2026-27"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-ink-primary mb-1">Order Approval Threshold (₹)</label>
            <input
              type="number"
              value={formData.requireOrderApprovalThreshold}
              onChange={e => setFormData({ ...formData, requireOrderApprovalThreshold: Number(e.target.value) })}
              className="w-full p-2 border border-divider rounded focus:border-brand focus:outline-none"
            />
            <p className="text-[11px] text-ink-secondary mt-1">
              Sales orders exceeding this amount or credit limits will automatically require Administrator approval.
            </p>
          </div>
        </div>

        <div className="flex justify-end">
          <Button variant="primary" size="md" icon={Save} type="submit">
            Save All Settings
          </Button>
        </div>
      </form>
    </div>
  );
};
