import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../../store/auth.store';
import './Checkout_Address_Modal.scss';

interface Address {
     line1: string;
     line2: string;
     city: string;
     state: string;
     postalCode: string;
     country: string;
}

interface CheckoutAddressModalProps {
     isOpen: boolean;
     onClose: () => void;
     onSubmit: (shippingAddress: string, billingAddress: string) => void;
     title?: string;
}

const Checkout_Address_Modal: React.FC<CheckoutAddressModalProps> = ({
     isOpen,
     onClose,
     onSubmit,
     title = 'Billing & Shipping Information'
}) => {
     const user = useAuthStore((state) => state.user);

     const [billing, setBilling] = useState<Address>({
          line1: '',
          line2: '',
          city: '',
          state: '',
          postalCode: '',
          country: 'India'
     });

     const [shipping, setShipping] = useState<Address>({
          line1: '',
          line2: '',
          city: '',
          state: '',
          postalCode: '',
          country: 'India'
     });

     const [sameAsBilling, setSameAsBilling] = useState(true);

     useEffect(() => {
          if (isOpen && user) {
               const defaultAddress = {
                    line1: user.billing_address_line1 || '',
                    line2: user.billing_address_line2 || '',
                    city: user.billing_city || '',
                    state: user.billing_state || '',
                    postalCode: user.billing_postal_code || '',
                    country: user.billing_country || 'India'
               };
               setBilling(defaultAddress);
               if (sameAsBilling) {
                    setShipping(defaultAddress);
               }
          }
     }, [isOpen, user]);

     if (!isOpen) return null;

     const handleBillingChange = (field: keyof Address, value: string) => {
          setBilling((prev) => {
               const updated = { ...prev, [field]: value };
               if (sameAsBilling) {
                    setShipping(updated);
               }
               return updated;
          });
     };

     const handleShippingChange = (field: keyof Address, value: string) => {
          setShipping((prev) => ({ ...prev, [field]: value }));
     };

     const handleSameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
          const checked = e.target.checked;
          setSameAsBilling(checked);
          if (checked) {
               setShipping(billing);
          }
     };

     const formatAddressToString = (addr: Address): string => {
          const parts = [
               addr.line1,
               addr.line2,
               addr.city,
               addr.state,
               addr.postalCode,
               addr.country
          ].map(p => p.trim()).filter(Boolean);
          return parts.join(', ');
     };

     const handleSubmit = (e: React.FormEvent) => {
          e.preventDefault();

          // Validate billing
          if (!billing.line1 || !billing.city || !billing.state || !billing.postalCode || !billing.country) {
               alert('Please fill all required billing address fields.');
               return;
          }

          // Validate shipping
          if (!sameAsBilling) {
               if (!shipping.line1 || !shipping.city || !shipping.state || !shipping.postalCode || !shipping.country) {
                    alert('Please fill all required shipping address fields.');
                    return;
               }
          }

          const billingStr = formatAddressToString(billing);
          const shippingStr = sameAsBilling ? billingStr : formatAddressToString(shipping);
          onSubmit(shippingStr, billingStr);
     };

     return (
          <div className="checkout_address_modal_overlay">
               <div className="checkout_address_modal">
                    <div className="checkout_address_modal__header">
                         <h2>{title}</h2>
                         <button 
                              type="button" 
                              onClick={onClose} 
                              className="checkout_address_modal__close_btn"
                              aria-label="Close modal"
                         >
                              &times;
                         </button>
                    </div>

                    <form onSubmit={handleSubmit} className="checkout_address_modal__form">
                         <div className="checkout_address_modal__sections">
                              {/* ── BILLING ADDRESS ── */}
                              <div className="checkout_address_modal__section">
                                   <h3>Billing Address (Invoice details)</h3>
                                   <div className="checkout_address_modal__grid">
                                        <div className="checkout_address_modal__field checkout_address_modal__field--full">
                                             <label>Address Line 1 *</label>
                                             <input
                                                  type="text"
                                                  value={billing.line1}
                                                  onChange={(e) => handleBillingChange('line1', e.target.value)}
                                                  required
                                                  placeholder="Building No, Street Name"
                                             />
                                        </div>
                                        <div className="checkout_address_modal__field checkout_address_modal__field--full">
                                             <label>Address Line 2 (Optional)</label>
                                             <input
                                                  type="text"
                                                  value={billing.line2}
                                                  onChange={(e) => handleBillingChange('line2', e.target.value)}
                                                  placeholder="Locality, Area"
                                             />
                                        </div>
                                        <div className="checkout_address_modal__field">
                                             <label>City *</label>
                                             <input
                                                  type="text"
                                                  value={billing.city}
                                                  onChange={(e) => handleBillingChange('city', e.target.value)}
                                                  required
                                                  placeholder="City"
                                             />
                                        </div>
                                        <div className="checkout_address_modal__field">
                                             <label>State *</label>
                                             <input
                                                  type="text"
                                                  value={billing.state}
                                                  onChange={(e) => handleBillingChange('state', e.target.value)}
                                                  required
                                                  placeholder="State"
                                             />
                                        </div>
                                        <div className="checkout_address_modal__field">
                                             <label>PIN Code / ZIP *</label>
                                             <input
                                                  type="text"
                                                  value={billing.postalCode}
                                                  onChange={(e) => handleBillingChange('postalCode', e.target.value)}
                                                  required
                                                  placeholder="6-digit PIN"
                                             />
                                        </div>
                                        <div className="checkout_address_modal__field">
                                             <label>Country *</label>
                                             <input
                                                  type="text"
                                                  value={billing.country}
                                                  onChange={(e) => handleBillingChange('country', e.target.value)}
                                                  required
                                                  placeholder="Country"
                                             />
                                        </div>
                                   </div>
                              </div>

                              <div className="checkout_address_modal__same_checkbox">
                                   <label>
                                        <input
                                             type="checkbox"
                                             checked={sameAsBilling}
                                             onChange={handleSameChange}
                                        />
                                        <span>Shipping address is the same as billing address</span>
                                   </label>
                              </div>

                              {/* ── SHIPPING ADDRESS ── */}
                              {!sameAsBilling && (
                                   <div className="checkout_address_modal__section checkout_address_modal__section--shipping">
                                        <h3>Shipping Address (Delivery details)</h3>
                                        <div className="checkout_address_modal__grid">
                                             <div className="checkout_address_modal__field checkout_address_modal__field--full">
                                                  <label>Address Line 1 *</label>
                                                  <input
                                                       type="text"
                                                       value={shipping.line1}
                                                       onChange={(e) => handleShippingChange('line1', e.target.value)}
                                                       required
                                                       placeholder="Building No, Street Name"
                                                  />
                                             </div>
                                             <div className="checkout_address_modal__field checkout_address_modal__field--full">
                                                  <label>Address Line 2 (Optional)</label>
                                                  <input
                                                       type="text"
                                                       value={shipping.line2}
                                                       onChange={(e) => handleShippingChange('line2', e.target.value)}
                                                       placeholder="Locality, Area"
                                                  />
                                             </div>
                                             <div className="checkout_address_modal__field">
                                                  <label>City *</label>
                                                  <input
                                                       type="text"
                                                       value={shipping.city}
                                                       onChange={(e) => handleShippingChange('city', e.target.value)}
                                                       required
                                                       placeholder="City"
                                                  />
                                             </div>
                                             <div className="checkout_address_modal__field">
                                                  <label>State *</label>
                                                  <input
                                                       type="text"
                                                       value={shipping.state}
                                                       onChange={(e) => handleShippingChange('state', e.target.value)}
                                                       required
                                                       placeholder="State"
                                                  />
                                             </div>
                                             <div className="checkout_address_modal__field">
                                                  <label>PIN Code / ZIP *</label>
                                                  <input
                                                       type="text"
                                                       value={shipping.postalCode}
                                                       onChange={(e) => handleShippingChange('postalCode', e.target.value)}
                                                       required
                                                       placeholder="6-digit PIN"
                                                  />
                                             </div>
                                             <div className="checkout_address_modal__field">
                                                  <label>Country *</label>
                                                  <input
                                                       type="text"
                                                       value={shipping.country}
                                                       onChange={(e) => handleShippingChange('country', e.target.value)}
                                                       required
                                                       placeholder="Country"
                                                  />
                                             </div>
                                        </div>
                                   </div>
                              )}
                         </div>

                         <div className="checkout_address_modal__footer">
                              <button 
                                   type="button" 
                                   onClick={onClose} 
                                   className="checkout_address_modal__btn checkout_address_modal__btn--secondary"
                              >
                                   Cancel
                              </button>
                              <button 
                                   type="submit" 
                                   className="checkout_address_modal__btn checkout_address_modal__btn--primary"
                              >
                                   Proceed to Payment
                              </button>
                         </div>
                    </form>
               </div>
          </div>
     );
};

export default Checkout_Address_Modal;
