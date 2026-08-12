import { useEffect, useState, useCallback } from 'react';
import { subscriptionPlansApi, type SubscriptionPlan } from '../api/subscription_plans.api';
import Button from '../../../components/common/button/Button';
import './Subscription_Plans_Manager.scss';

const Subscription_Plans_Manager = () => {
     const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
     const [loading, setLoading] = useState(true);
     const [error, setError] = useState('');
     const [success, setSuccess] = useState('');

     // Modal/Form states
     const [isModalOpen, setIsModalOpen] = useState(false);
     const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);

     // Form Fields
     const [tier, setTier] = useState('');
     const [name, setName] = useState('');
     const [priceInInr, setPriceInInr] = useState<number | ''>('');
     const [memberLimit, setMemberLimit] = useState<number | ''>('');
     const [durationMonths, setDurationMonths] = useState<number | ''>(12);
     const [features, setFeatures] = useState<string[]>([]);
     const [newFeatureText, setNewFeatureText] = useState('');
     const [isBestValue, setIsBestValue] = useState(false);
     const [isActive, setIsActive] = useState(true);
     const [saving, setSaving] = useState(false);

     const fetchPlans = useCallback(async () => {
          try {
               setLoading(true);
               const data = await subscriptionPlansApi.fetchPlans();
               setPlans(data);
          } catch (err: any) {
               setError(err.response?.data?.message || 'Failed to fetch subscription plans');
          } finally {
               setLoading(false);
          }
     }, []);

     useEffect(() => {
          fetchPlans();
     }, [fetchPlans]);

     const openCreateModal = () => {
          setEditingPlan(null);
          setTier('');
          setName('');
          setPriceInInr('');
          setMemberLimit('');
          setDurationMonths(12);
          setFeatures([]);
          setNewFeatureText('');
          setIsBestValue(false);
          setIsActive(true);
          setError('');
          setSuccess('');
          setIsModalOpen(true);
     };

     const openEditModal = (plan: SubscriptionPlan) => {
          setEditingPlan(plan);
          setTier(plan.tier);
          setName(plan.name);
          setPriceInInr(plan.price / 100);
          setMemberLimit(plan.memberLimit);
          setDurationMonths(plan.durationMonths || 12);
          setFeatures([...plan.features]);
          setNewFeatureText('');
          setIsBestValue(plan.isBestValue);
          setIsActive(plan.isActive);
          setError('');
          setSuccess('');
          setIsModalOpen(true);
     };

     const handleAddFeature = () => {
          if (newFeatureText.trim()) {
               setFeatures([...features, newFeatureText.trim()]);
               setNewFeatureText('');
          }
     };

     const handleRemoveFeature = (index: number) => {
          setFeatures(features.filter((_, i) => i !== index));
     };

     const handleSubmit = async (e: React.FormEvent) => {
          e.preventDefault();
          if (!tier || !name || priceInInr === '' || memberLimit === '' || durationMonths === '') {
               setError('Please fill in all required fields');
               return;
          }
          if (features.length === 0) {
               setError('Please add at least one features checklist item');
               return;
          }

          setError('');
          setSaving(true);
          try {
               const planData = {
                    tier: tier.toUpperCase(),
                    name,
                    price: Math.round(Number(priceInInr) * 100), // convert to paise
                    memberLimit: Number(memberLimit),
                    durationMonths: Number(durationMonths),
                    features,
                    isBestValue,
                    isActive,
               };

               if (editingPlan) {
                    await subscriptionPlansApi.updatePlan(editingPlan.id, planData);
                    setSuccess(`Subscription plan "${name}" updated successfully`);
               } else {
                    await subscriptionPlansApi.createPlan(planData);
                    setSuccess(`Subscription plan "${name}" created successfully`);
               }
               setIsModalOpen(false);
               fetchPlans();
          } catch (err: any) {
               setError(err.response?.data?.message || 'Failed to save subscription plan');
          } finally {
               setSaving(false);
          }
     };

     const handleDelete = async (id: string, planName: string) => {
          if (!window.confirm(`Are you sure you want to delete the plan "${planName}"?`)) {
               return;
          }
          setError('');
          setSuccess('');
          try {
               await subscriptionPlansApi.deletePlan(id);
               setSuccess(`Plan "${planName}" deleted successfully`);
               fetchPlans();
          } catch (err: any) {
               setError(err.response?.data?.message || 'Failed to delete subscription plan');
          }
     };

     return (
          <div className="sub_manager">
               <div className="sub_manager__header">
                    <div>
                         <h1>Subscription Plans Manager</h1>
                         <p>Configure institutional plans, features checklist, user member limits, and annual pricing.</p>
                    </div>
                    <Button variant="primary" onClick={openCreateModal}>
                         Create New Plan
                    </Button>
               </div>

               {error && <div className="sub_manager__error">{error}</div>}
               {success && <div className="sub_manager__success">{success}</div>}

               {/* Plans Grid */}
               {loading ? (
                    <div className="sub_manager__loading">Loading subscription plans...</div>
               ) : plans.length === 0 ? (
                    <div className="sub_manager__empty">
                         No plans found. Click "Create New Plan" to get started.
                    </div>
               ) : (
                    <div className="sub_manager__grid">
                         {plans.map((plan) => (
                              <div
                                   key={plan.id}
                                   className={`sub_manager__card ${plan.isBestValue ? 'sub_manager__card--premium' : ''} ${!plan.isActive ? 'sub_manager__card--inactive' : ''}`}
                              >
                                   {!plan.isActive && <span className="sub_manager__badge sub_manager__badge--draft">Disabled</span>}
                                   {plan.isBestValue && <span className="sub_manager__badge sub_manager__badge--premium">Best Value</span>}
                                   
                                   <div className="sub_manager__card_header">
                                        <div className="sub_manager__card_title_row">
                                             <h3>{plan.name}</h3>
                                             <span className="sub_manager__card_tier">{plan.tier}</span>
                                        </div>
                                        <p className="sub_manager__card_price">
                                             ₹{(plan.price / 100).toLocaleString('en-IN')}
                                             <span>/{plan.durationMonths || 12} months</span>
                                        </p>
                                        <p className="sub_manager__card_limit">
                                             Limit: <strong>{plan.memberLimit} members</strong> &middot; Validity: <strong>{plan.durationMonths || 12} months</strong>
                                        </p>
                                   </div>

                                   <div className="sub_manager__divider" />

                                   <ul className="sub_manager__features">
                                        {plan.features.map((feature, i) => (
                                             <li key={i}>
                                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#ff7a36', marginRight: '8px', flexShrink: 0 }}>
                                                       <polyline points="20 6 9 17 4 12" />
                                                  </svg>
                                                  <span>{feature}</span>
                                             </li>
                                        ))}
                                   </ul>

                                   <div className="sub_manager__card_actions">
                                        <Button variant="outline" onClick={() => openEditModal(plan)}>
                                             Edit Plan
                                        </Button>
                                        <button className="sub_manager__delete_btn" onClick={() => handleDelete(plan.id, plan.name)}>
                                             Delete
                                        </button>
                                   </div>
                              </div>
                         ))}
                    </div>
               )}

               {/* Create/Edit Modal */}
               {isModalOpen && (
                    <div className="sub_modal_overlay" onClick={() => setIsModalOpen(false)}>
                         <div className="sub_modal" onClick={(e) => e.stopPropagation()}>
                              <div className="sub_modal__header">
                                   <h2>{editingPlan ? 'Edit Subscription Plan' : 'Create Subscription Plan'}</h2>
                                   <button className="sub_modal__close" onClick={() => setIsModalOpen(false)}>
                                        &times;
                                   </button>
                              </div>

                              <form onSubmit={handleSubmit} className="sub_modal__form">
                                   <div className="sub_modal__row">
                                        <div className="sub_modal__field">
                                             <label>Plan Display Name *</label>
                                             <input
                                                  type="text"
                                                  value={name}
                                                  onChange={(e) => setName(e.target.value)}
                                                  placeholder="e.g. Gold Tier"
                                                  required
                                             />
                                        </div>
                                        <div className="sub_modal__field">
                                             <label>Tier ID Key *</label>
                                             <input
                                                  type="text"
                                                  value={tier}
                                                  onChange={(e) => setTier(e.target.value)}
                                                  placeholder="e.g. GOLD"
                                                  disabled={!!editingPlan} // tier key is unique and immutable
                                                  required
                                             />
                                        </div>
                                   </div>

                                   <div className="sub_modal__row">
                                        <div className="sub_modal__field">
                                             <label>Price (INR) *</label>
                                             <input
                                                  type="number"
                                                  value={priceInInr}
                                                  onChange={(e) => setPriceInInr(e.target.value !== '' ? Number(e.target.value) : '')}
                                                  placeholder="e.g. 4999"
                                                  required
                                             />
                                        </div>
                                        <div className="sub_modal__field">
                                             <label>Member Seat Limit *</label>
                                             <input
                                                  type="number"
                                                  value={memberLimit}
                                                  onChange={(e) => setMemberLimit(e.target.value !== '' ? Number(e.target.value) : '')}
                                                  placeholder="e.g. 3"
                                                  required
                                             />
                                        </div>
                                   </div>

                                   <div className="sub_modal__row">
                                        <div className="sub_modal__field">
                                             <label>Validity (Months) *</label>
                                             <input
                                                  type="number"
                                                  value={durationMonths}
                                                  onChange={(e) => setDurationMonths(e.target.value !== '' ? Number(e.target.value) : '')}
                                                  placeholder="e.g. 12"
                                                  required
                                             />
                                        </div>
                                        <div className="sub_modal__field" style={{ visibility: 'hidden' }}>
                                             {/* Dummy placeholder for flex alignment */}
                                        </div>
                                   </div>

                                   <div className="sub_modal__field">
                                        <label>Features Checklist *</label>
                                        <div className="sub_modal__feature_input">
                                             <input
                                                  type="text"
                                                  value={newFeatureText}
                                                  onChange={(e) => setNewFeatureText(e.target.value)}
                                                  placeholder="Enter a plan benefit/feature..."
                                                  onKeyDown={(e) => {
                                                       if (e.key === 'Enter') {
                                                            e.preventDefault();
                                                            handleAddFeature();
                                                       }
                                                  }}
                                             />
                                             <Button type="button" variant="outline" onClick={handleAddFeature}>
                                                  Add
                                             </Button>
                                        </div>
                                        <ul className="sub_modal__feature_list">
                                             {features.map((feat, index) => (
                                                  <li key={index} className="sub_modal__feature_item">
                                                       <span>{feat}</span>
                                                       <button type="button" onClick={() => handleRemoveFeature(index)}>
                                                            &times;
                                                       </button>
                                                  </li>
                                             ))}
                                        </ul>
                                   </div>

                                   <div className="sub_modal__row sub_modal__row--toggles">
                                        <label className="sub_modal__checkbox_label">
                                             <input
                                                  type="checkbox"
                                                  checked={isBestValue}
                                                  onChange={(e) => setIsBestValue(e.target.checked)}
                                             />
                                             <span>Highlight as "Best Value"</span>
                                        </label>

                                        <label className="sub_modal__checkbox_label">
                                             <input
                                                  type="checkbox"
                                                  checked={isActive}
                                                  onChange={(e) => setIsActive(e.target.checked)}
                                             />
                                             <span>Active & visible to institutions</span>
                                        </label>
                                   </div>

                                   <div className="sub_modal__actions">
                                        <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                                             Cancel
                                        </Button>
                                        <Button type="submit" variant="primary" disabled={saving}>
                                             {saving ? 'Saving...' : 'Save Plan'}
                                        </Button>
                                   </div>
                              </form>
                         </div>
                    </div>
               )}
          </div>
     );
};

export default Subscription_Plans_Manager;
