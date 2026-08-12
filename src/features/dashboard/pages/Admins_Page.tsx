import { useEffect, useState, useCallback } from 'react';
import { auth_api } from '../../auth/api/auth.api';
import Button from '../../../components/common/button/Button';
import './Admins_Page.scss';

interface AdminUser {
     id: string;
     username: string;
     email: string;
     createdAt: string;
}

const Admins_Page = () => {
     const [admins, setAdmins] = useState<AdminUser[]>([]);
     const [loading, setLoading] = useState(true);
     const [error, setError] = useState('');
     const [success, setSuccess] = useState('');

     // Add admin form
     const [newUsername, setNewUsername] = useState('');
     const [newEmail, setNewEmail] = useState('');
     const [newPassword, setNewPassword] = useState('');
     const [adding, setAdding] = useState(false);
     const [removingId, setRemovingId] = useState<string | null>(null);

     const fetchAdmins = useCallback(async () => {
          try {
               setLoading(true);
               const res = await auth_api.get_admins();
               setAdmins(res.admins);
          } catch (err: any) {
               setError(err.response?.data?.message || 'Failed to fetch admins');
          } finally {
               setLoading(false);
          }
     }, []);

     useEffect(() => {
          fetchAdmins();
     }, [fetchAdmins]);

     const handleAddAdmin = async (e: React.FormEvent) => {
          e.preventDefault();
          if (!newUsername || !newEmail || !newPassword) {
               setError('All fields are required');
               return;
          }
          setError('');
          setSuccess('');
          setAdding(true);
          try {
               await auth_api.add_admin({
                    username: newUsername,
                    email: newEmail,
                    password: newPassword,
               });
               setSuccess(`Admin "${newUsername}" added successfully`);
               setNewUsername('');
               setNewEmail('');
               setNewPassword('');
               fetchAdmins();
          } catch (err: any) {
               setError(err.response?.data?.message || 'Failed to add admin');
          } finally {
               setAdding(false);
          }
     };

     const handleRemoveAdmin = async (adminId: string, adminName: string) => {
          setError('');
          setSuccess('');
          setRemovingId(adminId);
          try {
               await auth_api.remove_admin(adminId);
               setSuccess(`Admin "${adminName}" removed successfully`);
               fetchAdmins();
          } catch (err: any) {
               setError(err.response?.data?.message || 'Failed to remove admin');
          } finally {
               setRemovingId(null);
          }
     };

     return (
          <div className="admin_dash">
               {/* Status Messages */}
               {error && <div className="admin_dash__error">{error}</div>}
               {success && <div className="admin_dash__success">{success}</div>}

               {/* Admins Section */}
               <div className="admin_dash__card">
                    <div className="admin_dash__members_header">
                         <h2 className="admin_dash__card_title">Admin Management</h2>
                         <p className="admin_dash__members_count">
                              <span>{admins.length}</span> active admins
                         </p>
                    </div>

                    {/* Add Admin Form */}
                    <form className="admin_dash__add_form" onSubmit={handleAddAdmin}>
                         <div className="admin_dash__add_field">
                              <label>Username</label>
                              <input
                                   type="text"
                                   placeholder="e.g. john_admin"
                                   value={newUsername}
                                   onChange={(e) => setNewUsername(e.target.value)}
                                   required
                              />
                         </div>
                         <div className="admin_dash__add_field">
                              <label>Email</label>
                              <input
                                   type="email"
                                   placeholder="e.g. admin@example.com"
                                   value={newEmail}
                                   onChange={(e) => setNewEmail(e.target.value)}
                                   required
                              />
                         </div>
                         <div className="admin_dash__add_field">
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
                              {adding ? 'Adding...' : 'Add Admin'}
                         </Button>
                    </form>

                    {/* Admins Table */}
                    {loading ? (
                         <div className="admin_dash__empty">Loading admins...</div>
                    ) : admins.length === 0 ? (
                         <div className="admin_dash__empty">
                              No admins yet. Add your first administrator above.
                         </div>
                    ) : (
                         <div className="admin_dash__table_wrapper">
                              <table className="admin_dash__members_table">
                                   <thead>
                                        <tr>
                                             <th>Name</th>
                                             <th>Email</th>
                                             <th>Joined</th>
                                             <th></th>
                                        </tr>
                                   </thead>
                                   <tbody>
                                        {admins.map((adm) => (
                                             <tr key={adm.id}>
                                                  <td>{adm.username}</td>
                                                  <td>{adm.email}</td>
                                                  <td>
                                                       {new Date(adm.createdAt).toLocaleDateString('en-IN', {
                                                            day: 'numeric',
                                                            month: 'short',
                                                            year: 'numeric',
                                                       })}
                                                  </td>
                                                  <td>
                                                       <button
                                                            className="admin_dash__remove_btn"
                                                            disabled={removingId === adm.id}
                                                            onClick={() => handleRemoveAdmin(adm.id, adm.username)}
                                                       >
                                                            {removingId === adm.id ? 'Removing...' : 'Remove'}
                                                       </button>
                                                  </td>
                                             </tr>
                                        ))}
                                   </tbody>
                              </table>
                         </div>
                    )}

               </div>
          </div>
     );
};

export default Admins_Page;
