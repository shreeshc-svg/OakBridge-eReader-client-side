import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../../store/auth.store';
import { auth_api } from '../../api/auth.api';
import Dashboard_Layout from '../../../../layout/Dashboard_Layout';
import { dashboard_layout_data } from '../../../../data';
import type { DashboardLayoutData } from '../../../dashboard/types/dashboard.types';
import toast from 'react-hot-toast';
import './Profile_Page.scss';

const EyeIcon = ({ show }: { show: boolean }) => (
     <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          width="18"
          height="18"
     >
          {show ? (
               <>
                    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                    <circle cx="12" cy="12" r="3" />
               </>
          ) : (
               <>
                    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                    <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                    <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                    <line x1="2" x2="22" y1="2" y2="22" />
               </>
          )}
     </svg>
);

const Profile_Page = () => {
     const navigate = useNavigate();
     const { user, updateUser } = useAuthStore();

     const [username, setUsername] = useState(user?.username || '');
     const [email, setEmail] = useState(user?.email || '');
     const [newPassword, setNewPassword] = useState('');
     const [confirmPassword, setConfirmPassword] = useState('');
     const [showNewPassword, setShowNewPassword] = useState(false);
     const [showConfirmPassword, setShowConfirmPassword] = useState(false);
     const [billingAddressLine1, setBillingAddressLine1] = useState(user?.billing_address_line1 || '');
     const [billingAddressLine2, setBillingAddressLine2] = useState(user?.billing_address_line2 || '');
     const [billingCity, setBillingCity] = useState(user?.billing_city || '');
     const [billingState, setBillingState] = useState(user?.billing_state || '');
     const [billingPostalCode, setBillingPostalCode] = useState(user?.billing_postal_code || '');
     const [billingCountry, setBillingCountry] = useState(user?.billing_country || 'India');
     const [saving, setSaving] = useState(false);
     const [error, setError] = useState('');
     const [success, setSuccess] = useState('');

     if (!user) {
          navigate('/login');
          return null;
     }

     const handleSubmit = async (e: React.FormEvent) => {
          e.preventDefault();
          setError('');
          setSuccess('');

          // Validate
          if (!username.trim()) {
               setError('Username is required');
               return;
          }

          if (!email.trim()) {
               setError('Email is required');
               return;
          }

          if (newPassword && newPassword.length < 6) {
               setError('Password must be at least 6 characters');
               return;
          }

          if (newPassword && newPassword !== confirmPassword) {
               setError('Passwords do not match');
               return;
          }

          // Check if anything actually changed
          const hasUsernameChange = username.trim() !== user.username;
          const hasEmailChange = email.trim() !== user.email;
          const hasPasswordChange = newPassword.length > 0;
          const hasAddressLine1Change = billingAddressLine1.trim() !== (user.billing_address_line1 || '');
          const hasAddressLine2Change = billingAddressLine2.trim() !== (user.billing_address_line2 || '');
          const hasCityChange = billingCity.trim() !== (user.billing_city || '');
          const hasStateChange = billingState.trim() !== (user.billing_state || '');
          const hasPostalCodeChange = billingPostalCode.trim() !== (user.billing_postal_code || '');
          const hasCountryChange = billingCountry.trim() !== (user.billing_country || 'India');

          const hasAddressChange =
               hasAddressLine1Change ||
               hasAddressLine2Change ||
               hasCityChange ||
               hasStateChange ||
               hasPostalCodeChange ||
               hasCountryChange;

          if (!hasUsernameChange && !hasEmailChange && !hasPasswordChange && !hasAddressChange) {
               setError('No changes to save');
               return;
          }

          setSaving(true);

          try {
               const updatePayload: {
                    username?: string;
                    email?: string;
                    password?: string;
                    billing_address_line1?: string;
                    billing_address_line2?: string;
                    billing_city?: string;
                    billing_state?: string;
                    billing_postal_code?: string;
                    billing_country?: string;
               } = {};

               if (hasUsernameChange) {
                    updatePayload.username = username.trim();
               }
               if (hasEmailChange) {
                    updatePayload.email = email.trim();
               }
               if (hasPasswordChange) {
                    updatePayload.password = newPassword;
               }
               if (hasAddressLine1Change) {
                    updatePayload.billing_address_line1 = billingAddressLine1.trim();
               }
               if (hasAddressLine2Change) {
                    updatePayload.billing_address_line2 = billingAddressLine2.trim();
               }
               if (hasCityChange) {
                    updatePayload.billing_city = billingCity.trim();
               }
               if (hasStateChange) {
                    updatePayload.billing_state = billingState.trim();
               }
               if (hasPostalCodeChange) {
                    updatePayload.billing_postal_code = billingPostalCode.trim();
               }
               if (hasCountryChange) {
                    updatePayload.billing_country = billingCountry.trim();
               }

               const result = await auth_api.update_profile(updatePayload);

               if (result.success && result.user) {
                    updateUser(result.user);
                    setSuccess('Profile updated successfully');
                    toast.success('Profile updated!');

                    // Clear password fields
                    setNewPassword('');
                    setConfirmPassword('');
               }
          } catch (err: any) {
               const message =
                    err.response?.data?.message ||
                    err.message ||
                    'Failed to update profile. Please try again.';
               setError(message);
               toast.error(message);
          } finally {
               setSaving(false);
          }
     };

     const handleCancel = () => {
          setUsername(user.username || '');
          setEmail(user.email || '');
          setNewPassword('');
          setConfirmPassword('');
          setBillingAddressLine1(user.billing_address_line1 || '');
          setBillingAddressLine2(user.billing_address_line2 || '');
          setBillingCity(user.billing_city || '');
          setBillingState(user.billing_state || '');
          setBillingPostalCode(user.billing_postal_code || '');
          setBillingCountry(user.billing_country || 'India');
          setError('');
          setSuccess('');
     };

     const layoutData = dashboard_layout_data as DashboardLayoutData;

     return (
          <Dashboard_Layout data={layoutData} role="user">
               <div className="profile_page">
                    <div className="profile_page__container">
                         <button
                              type="button"
                              className="profile_page__back_btn"
                              onClick={() => navigate(-1)}
                         >
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                   <line x1="19" y1="12" x2="5" y2="12" />
                                   <polyline points="12 19 5 12 12 5" />
                              </svg>
                              <span>Back</span>
                         </button>

                         <div className="profile_page__header">
                              <h1>Profile Settings</h1>
                              <p>Manage your account details and security preferences.</p>
                         </div>

                         {error && <div className="profile_page__error">{error}</div>}
                         {success && <div className="profile_page__success">{success}</div>}

                         <form onSubmit={handleSubmit}>
                              {/* Account Information Card */}
                              <div className="profile_page__card">
                                   <h2 className="profile_page__card_title">Account Information</h2>
                                   <div className="profile_page__divider" />

                                   <div className="profile_page__field_group">
                                        <label className="profile_page__label" htmlFor="profile-username">Username</label>
                                        <input
                                             id="profile-username"
                                             type="text"
                                             className="profile_page__input"
                                             value={username}
                                             onChange={(e) => setUsername(e.target.value)}
                                             placeholder="Enter your username"
                                             disabled={saving}
                                        />
                                   </div>

                                   <div className="profile_page__field_group">
                                        <label className="profile_page__label" htmlFor="profile-email">Email</label>
                                        <input
                                             id="profile-email"
                                             type="email"
                                             className="profile_page__input"
                                             value={email}
                                             onChange={(e) => setEmail(e.target.value)}
                                             placeholder="Enter your email"
                                             disabled={saving}
                                        />
                                   </div>
                              </div>

                              {/* Password Card */}
                              <div className="profile_page__card" style={{ marginTop: '1.5rem' }}>
                                   <h2 className="profile_page__card_title">Change Password</h2>
                                   <div className="profile_page__divider" />

                                   <div className="profile_page__field_group">
                                        <label className="profile_page__label" htmlFor="profile-new-password">New Password</label>
                                        <div className="profile_page__input_wrapper">
                                             <input
                                                  id="profile-new-password"
                                                  type={showNewPassword ? 'text' : 'password'}
                                                  className="profile_page__input"
                                                  value={newPassword}
                                                  onChange={(e) => setNewPassword(e.target.value)}
                                                  placeholder="Enter new password"
                                                  disabled={saving}
                                             />
                                             <button
                                                  type="button"
                                                  className="profile_page__toggle_password"
                                                  onClick={() => setShowNewPassword(!showNewPassword)}
                                                  tabIndex={-1}
                                             >
                                                  <EyeIcon show={showNewPassword} />
                                             </button>
                                        </div>
                                        <p className="profile_page__input_hint">Leave blank to keep your current password.</p>
                                   </div>

                                   <div className="profile_page__field_group">
                                        <label className="profile_page__label" htmlFor="profile-confirm-password">Confirm Password</label>
                                        <div className="profile_page__input_wrapper">
                                             <input
                                                  id="profile-confirm-password"
                                                  type={showConfirmPassword ? 'text' : 'password'}
                                                  className="profile_page__input"
                                                  value={confirmPassword}
                                                  onChange={(e) => setConfirmPassword(e.target.value)}
                                                  placeholder="Re-enter new password"
                                                  disabled={saving || !newPassword}
                                             />
                                             <button
                                                  type="button"
                                                  className="profile_page__toggle_password"
                                                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                  tabIndex={-1}
                                             >
                                                  <EyeIcon show={showConfirmPassword} />
                                             </button>
                                        </div>
                                   </div>
                              </div>

                              {/* Billing Address Card */}
                              <div className="profile_page__card" style={{ marginTop: '1.5rem' }}>
                                   <h2 className="profile_page__card_title">Billing Address</h2>
                                   <div className="profile_page__divider" />

                                   <div className="profile_page__field_group">
                                        <label className="profile_page__label" htmlFor="profile-billing-line1">Address Line 1</label>
                                        <input
                                             id="profile-billing-line1"
                                             type="text"
                                             className="profile_page__input"
                                             value={billingAddressLine1}
                                             onChange={(e) => setBillingAddressLine1(e.target.value)}
                                             placeholder="Building No, Street Name"
                                             disabled={saving}
                                        />
                                   </div>

                                   <div className="profile_page__field_group">
                                        <label className="profile_page__label" htmlFor="profile-billing-line2">Address Line 2</label>
                                        <input
                                             id="profile-billing-line2"
                                             type="text"
                                             className="profile_page__input"
                                             value={billingAddressLine2}
                                             onChange={(e) => setBillingAddressLine2(e.target.value)}
                                             placeholder="Locality, Area"
                                             disabled={saving}
                                        />
                                   </div>

                                   <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                                        <div className="profile_page__field_group">
                                             <label className="profile_page__label" htmlFor="profile-billing-city">City</label>
                                             <input
                                                  id="profile-billing-city"
                                                  type="text"
                                                  className="profile_page__input"
                                                  value={billingCity}
                                                  onChange={(e) => setBillingCity(e.target.value)}
                                                  placeholder="City"
                                                  disabled={saving}
                                             />
                                        </div>

                                        <div className="profile_page__field_group">
                                             <label className="profile_page__label" htmlFor="profile-billing-state">State</label>
                                             <input
                                                  id="profile-billing-state"
                                                  type="text"
                                                  className="profile_page__input"
                                                  value={billingState}
                                                  onChange={(e) => setBillingState(e.target.value)}
                                                  placeholder="State"
                                                  disabled={saving}
                                             />
                                        </div>
                                   </div>

                                   <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginTop: '1rem' }}>
                                        <div className="profile_page__field_group">
                                             <label className="profile_page__label" htmlFor="profile-billing-postal-code">PIN / Postal Code</label>
                                             <input
                                                  id="profile-billing-postal-code"
                                                  type="text"
                                                  className="profile_page__input"
                                                  value={billingPostalCode}
                                                  onChange={(e) => setBillingPostalCode(e.target.value)}
                                                  placeholder="PIN Code"
                                                  disabled={saving}
                                             />
                                        </div>

                                        <div className="profile_page__field_group">
                                             <label className="profile_page__label" htmlFor="profile-billing-country">Country</label>
                                             <input
                                                  id="profile-billing-country"
                                                  type="text"
                                                  className="profile_page__input"
                                                  value={billingCountry}
                                                  onChange={(e) => setBillingCountry(e.target.value)}
                                                  placeholder="Country"
                                                  disabled={saving}
                                             />
                                        </div>
                                   </div>
                              </div>

                              {/* Actions */}
                              <div className="profile_page__actions" style={{ marginTop: '1.5rem' }}>
                                   <button
                                        type="submit"
                                        className="profile_page__save_btn"
                                        disabled={saving}
                                   >
                                        {saving ? 'Saving...' : 'Save Changes'}
                                   </button>
                                   <button
                                        type="button"
                                        className="profile_page__cancel_btn"
                                        onClick={handleCancel}
                                        disabled={saving}
                                   >
                                        Reset
                                   </button>
                              </div>
                         </form>
                    </div>
               </div>
          </Dashboard_Layout>
     );
};

export default Profile_Page;
