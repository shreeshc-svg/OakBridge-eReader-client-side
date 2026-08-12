import { useEffect, useState, useCallback } from 'react';
import { auth_api } from '../../auth/api/auth.api';
import Button from '../../../components/common/button/Button';
import './Admins_Page.scss'; // Reuse the Admin management styles

interface ManagerUser {
     id: string;
     username: string;
     email: string;
     createdAt: string;
}

const Managers_Page = () => {
     const [managers, setManagers] = useState<ManagerUser[]>([]);
     const [loading, setLoading] = useState(true);
     const [error, setError] = useState('');
     const [success, setSuccess] = useState('');

     // Add manager form
     const [newUsername, setNewUsername] = useState('');
     const [newEmail, setNewEmail] = useState('');
     const [newPassword, setNewPassword] = useState('');
     const [adding, setAdding] = useState(false);
     const [removingId, setRemovingId] = useState<string | null>(null);

     const fetchManagers = useCallback(async () => {
          try {
               setLoading(true);
               const res = await auth_api.get_managers();
               setManagers(res.managers);
          } catch (err: any) {
               setError(err.response?.data?.message || 'Failed to fetch managers');
          } finally {
               setLoading(false);
          }
     }, []);

     useEffect(() => {
          fetchManagers();
     }, [fetchManagers]);

     const handleAddManager = async (e: React.FormEvent) => {
          e.preventDefault();
          if (!newUsername || !newEmail || !newPassword) {
               setError('All fields are required');
               return;
          }
          setError('');
          setSuccess('');
          setAdding(true);
          try {
               await auth_api.add_manager({
                    username: newUsername,
                    email: newEmail,
                    password: newPassword,
               });
               setSuccess(`Manager "${newUsername}" added successfully`);
               setNewUsername('');
               setNewEmail('');
               setNewPassword('');
               fetchManagers();
          } catch (err: any) {
               setError(err.response?.data?.message || 'Failed to add manager');
          } finally {
               setAdding(false);
          }
     };

     const handleRemoveManager = async (managerId: string, managerName: string) => {
          setError('');
          setSuccess('');
          setRemovingId(managerId);
          try {
               await auth_api.remove_manager(managerId);
               setSuccess(`Manager "${managerName}" removed successfully`);
               fetchManagers();
          } catch (err: any) {
               setError(err.response?.data?.message || 'Failed to remove manager');
          } finally {
               setRemovingId(null);
          }
     };

     return (
          <div className="admin_dash">
               {/* Status Messages */}
               {error && <div className="admin_dash__error">{error}</div>}
               {success && <div className="admin_dash__success">{success}</div>}

               {/* Managers Section */}
               <div className="admin_dash__card">
                    <div className="admin_dash__members_header">
                         <h2 className="admin_dash__card_title">Manager Management</h2>
                         <p className="admin_dash__members_count">
                              <span>{managers.length}</span> active managers
                         </p>
                    </div>

                    {/* Add Manager Form */}
                    <form className="admin_dash__add_form" onSubmit={handleAddManager}>
                         <div className="admin_dash__add_field">
                              <label>Username</label>
                              <input
                                   type="text"
                                   placeholder="e.g. john_manager"
                                   value={newUsername}
                                   onChange={(e) => setNewUsername(e.target.value)}
                                   required
                              />
                         </div>
                         <div className="admin_dash__add_field">
                              <label>Email</label>
                              <input
                                   type="email"
                                   placeholder="e.g. manager@example.com"
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
                              {adding ? 'Adding...' : 'Add Manager'}
                         </Button>
                    </form>

                    {/* Managers Table */}
                    {loading ? (
                         <div className="admin_dash__empty">Loading managers...</div>
                    ) : managers.length === 0 ? (
                         <div className="admin_dash__empty">
                              No managers yet. Add your first manager above.
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
                                        {managers.map((mng) => (
                                             <tr key={mng.id}>
                                                  <td>{mng.username}</td>
                                                  <td>{mng.email}</td>
                                                  <td>
                                                       {new Date(mng.createdAt).toLocaleDateString('en-IN', {
                                                            day: 'numeric',
                                                            month: 'short',
                                                            year: 'numeric',
                                                       })}
                                                  </td>
                                                  <td>
                                                       <button
                                                            className="admin_dash__remove_btn"
                                                            disabled={removingId === mng.id}
                                                            onClick={() => handleRemoveManager(mng.id, mng.username)}
                                                       >
                                                            {removingId === mng.id ? 'Removing...' : 'Remove'}
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

export default Managers_Page;
