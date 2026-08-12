import React, { useEffect, useState, useCallback } from 'react';
import { couponsApi, type Coupon } from '../api/coupons.api';
import Button from '../../../components/common/button/Button';
import toast from 'react-hot-toast';
import './Coupons_Page.scss';

const Coupons_Page = () => {
     const [couponsList, setCouponsList] = useState<Coupon[]>([]);
     const [loading, setLoading] = useState(true);
     const [error, setError] = useState('');

     // Modal / Form states
     const [isModalOpen, setIsModalOpen] = useState(false);
     const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);

     // Form Fields
     const [code, setCode] = useState('');
     const [discountType, setDiscountType] = useState<'percentage' | 'flat'>('percentage');
     const [discountValue, setDiscountValue] = useState<number | ''>('');
     const [minOrderAmount, setMinOrderAmount] = useState<number | ''>('');
     const [maxDiscountAmount, setMaxDiscountAmount] = useState<number | ''>('');
     const [expiresAt, setExpiresAt] = useState('');
     const [usageLimit, setUsageLimit] = useState<number | ''>('');
     const [isActive, setIsActive] = useState(true);
     const [saving, setSaving] = useState(false);

     const fetchCoupons = useCallback(async () => {
          try {
               setLoading(true);
               const data = await couponsApi.fetchCoupons();
               setCouponsList(data);
          } catch (err: any) {
               setError(err.response?.data?.message || 'Failed to fetch coupons');
          } finally {
               setLoading(false);
          }
     }, []);

     useEffect(() => {
          fetchCoupons();
     }, [fetchCoupons]);

     const openCreateModal = () => {
          setEditingCoupon(null);
          setCode('');
          setDiscountType('percentage');
          setDiscountValue('');
          setMinOrderAmount('');
          setMaxDiscountAmount('');
          setExpiresAt('');
          setUsageLimit('');
          setIsActive(true);
          setError('');
          setIsModalOpen(true);
     };

     const openEditModal = (coupon: Coupon) => {
          setEditingCoupon(coupon);
          setCode(coupon.code);
          setDiscountType(coupon.discount_type);
          setDiscountValue(coupon.discount_type === 'percentage' ? coupon.discount_value : coupon.discount_value / 100);
          setMinOrderAmount(coupon.min_order_amount ? coupon.min_order_amount / 100 : '');
          setMaxDiscountAmount(coupon.max_discount_amount ? coupon.max_discount_amount / 100 : '');
          setExpiresAt(coupon.expires_at ? new Date(coupon.expires_at).toISOString().substring(0, 16) : '');
          setUsageLimit(coupon.usage_limit || '');
          setIsActive(coupon.is_active);
          setError('');
          setIsModalOpen(true);
     };

     const handleToggleActive = async (coupon: Coupon) => {
          try {
               const updated = await couponsApi.updateCoupon(coupon.id, {
                    is_active: !coupon.is_active,
               });
               toast.success(`Coupon code ${coupon.code} ${updated.is_active ? 'activated' : 'deactivated'}`);
               fetchCoupons();
          } catch (err: any) {
               toast.error(err.response?.data?.message || 'Failed to toggle status');
          }
     };

     const handleSubmit = async (e: React.FormEvent) => {
          e.preventDefault();
          if (!code.trim() || !discountType || discountValue === '') {
               setError('Please fill in all required fields');
               return;
          }

          setError('');
          setSaving(true);

          try {
               const payload = {
                    code: code.trim().toUpperCase(),
                    discount_type: discountType,
                    // Store value in cents/paise for flat rate, or keep as is for percentage
                    discount_value: discountType === 'percentage' ? Number(discountValue) : Math.round(Number(discountValue) * 100),
                    min_order_amount: minOrderAmount ? Math.round(Number(minOrderAmount) * 100) : null,
                    max_discount_amount: maxDiscountAmount ? Math.round(Number(maxDiscountAmount) * 100) : null,
                    expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
                    usage_limit: usageLimit ? Number(usageLimit) : null,
                    is_active: isActive,
               };

               if (editingCoupon) {
                    await couponsApi.updateCoupon(editingCoupon.id, payload);
                    toast.success(`Coupon "${payload.code}" updated successfully`);
               } else {
                    await couponsApi.createCoupon(payload);
                    toast.success(`Coupon "${payload.code}" created successfully`);
               }
               setIsModalOpen(false);
               fetchCoupons();
          } catch (err: any) {
               setError(err.response?.data?.message || 'Failed to save coupon');
          } finally {
               setSaving(false);
          }
     };

     const handleDelete = async (id: string, couponCode: string) => {
          if (!window.confirm(`Are you sure you want to delete coupon "${couponCode}"?`)) {
               return;
          }
          try {
               await couponsApi.deleteCoupon(id);
               toast.success(`Coupon "${couponCode}" deleted successfully`);
               fetchCoupons();
          } catch (err: any) {
               toast.error(err.response?.data?.message || 'Failed to delete coupon');
          }
     };

     const getCouponStatus = (coupon: Coupon) => {
          if (!coupon.is_active) return { label: 'Inactive', className: 'status-tag--inactive' };
          if (coupon.expires_at && new Date() > new Date(coupon.expires_at)) {
               return { label: 'Expired', className: 'status-tag--expired' };
          }
          if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) {
               return { label: 'Limit Reached', className: 'status-tag--limit' };
          }
          return { label: 'Active', className: 'status-tag--active' };
     };

     return (
          <div className="coupon_manager">
               <div className="coupon_manager__header">
                    <div>
                         <h1>Coupon Discounts Manager</h1>
                         <p>Create and monitor promo coupon codes, usage limits, expiration rules, and discount models.</p>
                    </div>
                    <Button variant="primary" onClick={openCreateModal}>
                         Create Coupon
                    </Button>
               </div>

               {error && <div className="coupon_manager__error">{error}</div>}

               {loading ? (
                    <div className="coupon_manager__loading">
                         <div className="coupon_spinner" />
                         <span>Loading coupons...</span>
                    </div>
               ) : couponsList.length === 0 ? (
                    <div className="coupon_manager__empty">
                         No coupon codes found. Click "Create Coupon" to register the first one.
                    </div>
               ) : (
                    <div className="coupon_manager__table_wrapper">
                         <table className="coupon_manager__table">
                              <thead>
                                   <tr>
                                        <th>Promo Code</th>
                                        <th>Discount Details</th>
                                        <th>Limits & Min Order</th>
                                        <th>Redemptions</th>
                                        <th>Expiry Date</th>
                                        <th>Status</th>
                                        <th>Toggle</th>
                                        <th>Actions</th>
                                   </tr>
                              </thead>
                              <tbody>
                                   {couponsList.map((coupon) => {
                                        const statusObj = getCouponStatus(coupon);
                                        return (
                                             <tr key={coupon.id} className={!coupon.is_active ? 'row--disabled' : ''}>
                                                  <td className="cell--code">
                                                       <strong>{coupon.code}</strong>
                                                  </td>
                                                  <td>
                                                       {coupon.discount_type === 'percentage' 
                                                            ? `${coupon.discount_value}% Off` 
                                                            : `₹${(coupon.discount_value / 100).toFixed(2)} Off`}
                                                       {coupon.discount_type === 'percentage' && coupon.max_discount_amount && (
                                                            <div className="cell--sub">Max: ₹{(coupon.max_discount_amount / 100).toFixed(2)}</div>
                                                       )}
                                                  </td>
                                                  <td>
                                                       {coupon.min_order_amount 
                                                            ? `Min Order: ₹${(coupon.min_order_amount / 100).toFixed(2)}` 
                                                            : 'No Minimum'}
                                                  </td>
                                                  <td className="cell--redemptions">
                                                       <strong>{coupon.used_count}</strong>
                                                       {coupon.usage_limit ? ` / ${coupon.usage_limit}` : ' uses'}
                                                  </td>
                                                  <td>
                                                       {coupon.expires_at 
                                                            ? new Date(coupon.expires_at).toLocaleDateString('en-IN', {
                                                                 day: '2-digit',
                                                                 month: 'short',
                                                                 year: 'numeric',
                                                                 hour: '2-digit',
                                                                 minute: '2-digit'
                                                            }) 
                                                            : 'Never'}
                                                  </td>
                                                  <td>
                                                       <span className={`status-tag ${statusObj.className}`}>
                                                            {statusObj.label}
                                                       </span>
                                                  </td>
                                                  <td>
                                                       <label className="coupon_switch">
                                                            <input
                                                                 type="checkbox"
                                                                 checked={coupon.is_active}
                                                                 onChange={() => handleToggleActive(coupon)}
                                                            />
                                                            <span className="coupon_switch_slider" />
                                                       </label>
                                                  </td>
                                                  <td className="cell--actions">
                                                       <button 
                                                            className="btn--action btn--edit" 
                                                            onClick={() => openEditModal(coupon)}
                                                       >
                                                            Edit
                                                       </button>
                                                       <button 
                                                            className="btn--action btn--delete" 
                                                            onClick={() => handleDelete(coupon.id, coupon.code)}
                                                       >
                                                            Delete
                                                       </button>
                                                  </td>
                                             </tr>
                                        );
                                   })}
                              </tbody>
                         </table>
                    </div>
               )}

               {/* Create/Edit Modal */}
               {isModalOpen && (
                    <div className="coupon_modal_overlay" onClick={() => setIsModalOpen(false)}>
                         <div className="coupon_modal" onClick={(e) => e.stopPropagation()}>
                              <div className="coupon_modal__header">
                                   <h2>{editingCoupon ? 'Edit Coupon Code' : 'Create Coupon Code'}</h2>
                                   <button className="coupon_modal__close" onClick={() => setIsModalOpen(false)}>
                                        &times;
                                   </button>
                              </div>

                              <form onSubmit={handleSubmit} className="coupon_modal__form">
                                   <div className="coupon_modal__row">
                                        <div className="coupon_modal__field">
                                             <label>Promo Code *</label>
                                             <input
                                                  type="text"
                                                  value={code}
                                                  onChange={(e) => setCode(e.target.value)}
                                                  placeholder="e.g. WELCOME20"
                                                  disabled={!!editingCoupon}
                                                  required
                                             />
                                        </div>
                                        <div className="coupon_modal__field">
                                             <label>Discount Model *</label>
                                             <select
                                                  value={discountType}
                                                  onChange={(e) => setDiscountType(e.target.value as 'percentage' | 'flat')}
                                                  required
                                             >
                                                  <option value="percentage">Percentage (%)</option>
                                                  <option value="flat">Flat Amount (₹)</option>
                                             </select>
                                        </div>
                                   </div>

                                   <div className="coupon_modal__row">
                                        <div className="coupon_modal__field">
                                             <label>Discount Value *</label>
                                             <input
                                                  type="number"
                                                  value={discountValue}
                                                  onChange={(e) => setDiscountValue(e.target.value !== '' ? Number(e.target.value) : '')}
                                                  placeholder={discountType === 'percentage' ? 'e.g. 20' : 'e.g. 150'}
                                                  required
                                             />
                                        </div>
                                        <div className="coupon_modal__field">
                                             <label>Min. Order Subtotal (INR)</label>
                                             <input
                                                  type="number"
                                                  value={minOrderAmount}
                                                  onChange={(e) => setMinOrderAmount(e.target.value !== '' ? Number(e.target.value) : '')}
                                                  placeholder="e.g. 500 (Optional)"
                                             />
                                        </div>
                                   </div>

                                   <div className="coupon_modal__row">
                                        <div className="coupon_modal__field">
                                             <label>Max. Cap Discount Limit (INR)</label>
                                             <input
                                                  type="number"
                                                  value={maxDiscountAmount}
                                                  onChange={(e) => setMaxDiscountAmount(e.target.value !== '' ? Number(e.target.value) : '')}
                                                  placeholder="e.g. 100 (Optional for %)"
                                                  disabled={discountType === 'flat'}
                                             />
                                        </div>
                                        <div className="coupon_modal__field">
                                             <label>Redemption Usage Limit</label>
                                             <input
                                                  type="number"
                                                  value={usageLimit}
                                                  onChange={(e) => setUsageLimit(e.target.value !== '' ? Number(e.target.value) : '')}
                                                  placeholder="e.g. 100 (Optional)"
                                             />
                                        </div>
                                   </div>

                                   <div className="coupon_modal__row">
                                        <div className="coupon_modal__field">
                                             <label>Expiration Date & Time</label>
                                             <input
                                                  type="datetime-local"
                                                  value={expiresAt}
                                                  onChange={(e) => setExpiresAt(e.target.value)}
                                             />
                                        </div>
                                        <div className="coupon_modal__field checkbox_field">
                                             <label className="coupon_modal__checkbox_label">
                                                  <input
                                                       type="checkbox"
                                                       checked={isActive}
                                                       onChange={(e) => setIsActive(e.target.checked)}
                                                  />
                                                  <span>Set Coupon Active on Save</span>
                                             </label>
                                        </div>
                                   </div>

                                   <div className="coupon_modal__actions">
                                        <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>
                                             Cancel
                                        </Button>
                                        <Button variant="primary" type="submit" disabled={saving}>
                                             {saving ? 'Saving...' : 'Save Coupon'}
                                        </Button>
                                   </div>
                              </form>
                         </div>
                    </div>
               )}
          </div>
     );
};

export default Coupons_Page;
