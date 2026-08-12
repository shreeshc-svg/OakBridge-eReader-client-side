import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Dashboard_Layout from '../../../layout/Dashboard_Layout';
import { dashboard_layout_data } from '../../../data';
import type { DashboardLayoutData } from '../../dashboard/types/dashboard.types';
import { useAuthStore } from '../../../store/auth.store';
import { institution_api } from '../api/institution.api';
import { subscriptionPlansApi } from '../../dashboard/api/subscription_plans.api';
import type { InstitutionMember } from '../types/institution.types';
import Button from '../../../components/common/button/Button';
import './Institution_Dashboard.scss';

const Institution_Dashboard = () => {
     const layoutData = dashboard_layout_data as DashboardLayoutData;
     const navigate = useNavigate();

     const accessToken = useAuthStore((s) => s.accessToken);
     const user = useAuthStore((s) => s.user);

     const [members, setMembers] = useState<InstitutionMember[]>([]);
     const [loading, setLoading] = useState(true);
     const [error, setError] = useState('');
     const [success, setSuccess] = useState('');

     // Add member form
     const [newUsername, setNewUsername] = useState('');
     const [newEmail, setNewEmail] = useState('');
     const [newPassword, setNewPassword] = useState('');
     const [adding, setAdding] = useState(false);
     const [removingId, setRemovingId] = useState<string | null>(null);

     const institution = user?.institution;
     const tier = institution?.tier || 'NONE';
     const [memberLimit, setMemberLimit] = useState(() => {
          if (tier === 'GOLD') return 3;
          if (tier === 'PLATINUM') return 5;
          return 0;
     });

     useEffect(() => {
          const loadActivePlans = async () => {
               try {
                    const activePlans = await subscriptionPlansApi.fetchActivePlans();
                    const currentPlan = activePlans.find(
                         (p) => p.tier.toUpperCase() === tier.toUpperCase()
                    );
                    if (currentPlan) {
                         setMemberLimit(currentPlan.memberLimit);
                    }
               } catch (err) {
                    console.error('Failed to load active plans for limit lookup', err);
               }
          };
          if (tier !== 'NONE') {
               loadActivePlans();
          }
     }, [tier]);

     // Auth guard
     useEffect(() => {
          if (!accessToken) {
               navigate('/login', { replace: true });
          } else if (user?.role !== 'INSTITUTION_ADMIN') {
               navigate('/user/dashboard', { replace: true });
          } else if (tier === 'NONE') {
               navigate('/subscription', { replace: true });
          }
     }, [accessToken, user, tier, navigate]);

     const fetchMembers = useCallback(async () => {
          try {
               setLoading(true);
               const res = await institution_api.get_members();
               setMembers(res.members);
          } catch (err: any) {
               setError(err.response?.data?.message || 'Failed to fetch members');
          } finally {
               setLoading(false);
          }
     }, []);

     useEffect(() => {
          if (accessToken && user?.role === 'INSTITUTION_ADMIN' && tier !== 'NONE') {
               fetchMembers();
          }
     }, [accessToken, user, tier, fetchMembers]);

     const handleAddMember = async (e: React.FormEvent) => {
          e.preventDefault();
          if (!newUsername || !newEmail || !newPassword) {
               setError('All fields are required');
               return;
          }
          setError('');
          setSuccess('');
          setAdding(true);
          try {
               await institution_api.add_member({
                    username: newUsername,
                    email: newEmail,
                    password: newPassword,
               });
               setSuccess(`Member "${newUsername}" added successfully`);
               setNewUsername('');
               setNewEmail('');
               setNewPassword('');
               fetchMembers();
          } catch (err: any) {
               setError(err.response?.data?.message || 'Failed to add member');
          } finally {
               setAdding(false);
          }
     };

     const handleRemoveMember = async (memberId: string, memberName: string) => {
          setError('');
          setSuccess('');
          setRemovingId(memberId);
          try {
               await institution_api.remove_member(memberId);
               setSuccess(`Member "${memberName}" removed successfully`);
               fetchMembers();
          } catch (err: any) {
               setError(err.response?.data?.message || 'Failed to remove member');
          } finally {
               setRemovingId(null);
          }
     };

     const expiresAt = institution?.subscription_expires_at;
     const expiryDate = expiresAt ? new Date(expiresAt).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
     }) : '—';

     return (
          <Dashboard_Layout data={layoutData} role="user">
               <div className="inst_dash">
                    {/* ── Top Info Row ────────────────────────────── */}
                    <div className="inst_dash__info_row">
                         {/* Institution Info */}
                         <div className="inst_dash__card">
                              <p className="inst_dash__card_title">Institution</p>
                              <div className="inst_dash__inst_info">
                                   <h2 className="inst_dash__inst_name">
                                        {institution?.name || 'Institution'}
                                   </h2>
                                   <div className="inst_dash__inst_detail">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                             <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                                             <circle cx="12" cy="10" r="3" />
                                        </svg>
                                        {institution?.location || '—'}
                                   </div>
                                   <div className="inst_dash__inst_detail">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                             <rect width="20" height="16" x="2" y="4" rx="2" />
                                             <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                                        </svg>
                                        {user?.email || '—'}
                                   </div>
                              </div>
                         </div>

                         {/* Subscription Info */}
                         <div className="inst_dash__card">
                              <p className="inst_dash__card_title">Subscription</p>
                              <div className="inst_dash__sub_info">
                                   <span className={`inst_dash__tier_badge inst_dash__tier_badge--${tier}`}>
                                        {tier === 'GOLD' ? '🥇' : tier === 'PLATINUM' ? '💎' : '—'}{' '}
                                        {tier} Tier
                                   </span>
                                   <p className="inst_dash__sub_detail">
                                        Members: <strong>{members.length} / {memberLimit}</strong>
                                   </p>
                                   <p className="inst_dash__sub_detail">
                                        Expires: <strong>{expiryDate}</strong>
                                   </p>
                                   <div className="inst_dash__renew_btn">
                                        <Button
                                             variant="outline"
                                             onClick={() => navigate('/subscription')}
                                        >
                                             Renew / Upgrade
                                        </Button>
                                   </div>
                              </div>
                         </div>
                    </div>

                    {/* ── Status Messages ─────────────────────────── */}
                    {error && <div className="inst_dash__error">{error}</div>}
                    {success && <div className="inst_dash__success">{success}</div>}

                    {/* ── Members Section ─────────────────────────── */}
                    <div className="inst_dash__card">
                         <div className="inst_dash__members_header">
                              <p className="inst_dash__card_title">Team Members</p>
                              <p className="inst_dash__members_count">
                                   <span>{members.length}</span> / {memberLimit} seats used
                              </p>
                         </div>

                         {/* Add Member Form */}
                         {members.length < memberLimit && (
                              <form className="inst_dash__add_form" onSubmit={handleAddMember}>
                                   <div className="inst_dash__add_field">
                                        <label>Username</label>
                                        <input
                                             type="text"
                                             placeholder="e.g. john_doe"
                                             value={newUsername}
                                             onChange={(e) => setNewUsername(e.target.value)}
                                             required
                                        />
                                   </div>
                                   <div className="inst_dash__add_field">
                                        <label>Email</label>
                                        <input
                                             type="email"
                                             placeholder="e.g. john@example.com"
                                             value={newEmail}
                                             onChange={(e) => setNewEmail(e.target.value)}
                                             required
                                        />
                                   </div>
                                   <div className="inst_dash__add_field">
                                        <label>Password</label>
                                        <input
                                             type="password"
                                             placeholder="Set a password"
                                             value={newPassword}
                                             onChange={(e) => setNewPassword(e.target.value)}
                                             required
                                        />
                                   </div>
                                   <Button
                                        type="submit"
                                        variant="primary"
                                        disabled={adding}
                                   >
                                        {adding ? 'Adding...' : 'Add Member'}
                                   </Button>
                              </form>
                         )}

                         {members.length >= memberLimit && (
                              <p style={{ fontSize: '13px', color: 'var(--color-neutral-500)' }}>
                                   You've reached the maximum of {memberLimit} members for your {tier} tier.
                                   <button
                                        type="button"
                                        onClick={() => navigate('/subscription')}
                                        style={{
                                             background: 'none',
                                             border: 'none',
                                             color: 'var(--color-brand)',
                                             fontWeight: 600,
                                             cursor: 'pointer',
                                             marginLeft: '4px',
                                             textDecoration: 'underline',
                                        }}
                                   >
                                        Upgrade plan
                                   </button>
                              </p>
                         )}

                         {/* Members Table */}
                         {loading ? (
                              <div className="inst_dash__empty">Loading members...</div>
                         ) : members.length === 0 ? (
                              <div className="inst_dash__empty">
                                   No members yet. Add your first team member above.
                              </div>
                         ) : (
                              <table className="inst_dash__members_table">
                                   <thead>
                                        <tr>
                                             <th>Name</th>
                                             <th>Email</th>
                                             <th>Joined</th>
                                             <th></th>
                                        </tr>
                                   </thead>
                                   <tbody>
                                        {members.map((m) => (
                                             <tr key={m.id}>
                                                  <td>{m.username}</td>
                                                  <td>{m.email}</td>
                                                  <td>
                                                       {new Date(m.createdAt).toLocaleDateString('en-IN', {
                                                            day: 'numeric',
                                                            month: 'short',
                                                            year: 'numeric',
                                                       })}
                                                  </td>
                                                  <td>
                                                       <button
                                                            className="inst_dash__remove_btn"
                                                            disabled={removingId === m.id}
                                                            onClick={() => handleRemoveMember(m.id, m.username)}
                                                       >
                                                            {removingId === m.id ? 'Removing...' : 'Remove'}
                                                       </button>
                                                  </td>
                                             </tr>
                                        ))}
                                   </tbody>
                              </table>
                         )}
                    </div>
               </div>
          </Dashboard_Layout>
     );
};

export default Institution_Dashboard;
