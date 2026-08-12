import { useEffect, useState } from 'react';
import { settings_api } from '../api/settings.api';
import { useAuthStore } from '../../../store/auth.store';
import './Settings_Page.scss';

const Settings_Page = () => {
     const accessToken = useAuthStore((state) => state.accessToken);
     const [disableRightClick, setDisableRightClick] = useState(true);
     const [loading, setLoading] = useState(true);
     const [saving, setSaving] = useState(false);
     const [error, setError] = useState('');
     const [success, setSuccess] = useState('');

     useEffect(() => {
          const fetchSetting = async () => {
               try {
                    setLoading(true);
                    const res = await settings_api.get_setting('disable_right_click');
                    setDisableRightClick(res.value === 'true');
               } catch (err: any) {
                    setError('Failed to load system settings');
               } finally {
                    setLoading(false);
               }
          };

          fetchSetting();
     }, []);

     const handleToggleRightClick = async (e: React.ChangeEvent<HTMLInputElement>) => {
          if (!accessToken) return;
          const newValue = e.target.checked;
          
          setError('');
          setSuccess('');
          setSaving(true);

          try {
               await settings_api.update_setting(
                    'disable_right_click',
                    newValue ? 'true' : 'false',
                    accessToken
               );
               setDisableRightClick(newValue);
               setSuccess(
                    `Right-click protection successfully ${
                         newValue ? 'enabled' : 'disabled'
                    }`
               );
          } catch (err: any) {
               setError(err.response?.data?.message || 'Failed to update system setting');
          } finally {
               setSaving(false);
          }
     };

     return (
          <div className="settings_dash">
               {/* Status Messages */}
               {error && <div className="settings_dash__error">{error}</div>}
               {success && <div className="settings_dash__success">{success}</div>}

               {/* Settings Card */}
               <div className="settings_dash__card">
                    <h2 className="settings_dash__card_title">Security Settings</h2>
                    <p className="settings_dash__card_desc">
                         Configure system-wide digital rights management (DRM) and reader restrictions.
                    </p>

                    {loading ? (
                         <div className="settings_dash__loading">Loading settings...</div>
                    ) : (
                         <div className="settings_dash__list">
                              <div className="settings_dash__item">
                                   <div className="settings_dash__item_info">
                                        <h3 className="settings_dash__item_label">
                                             Disable Reader Right-Click
                                        </h3>
                                        <p className="settings_dash__item_desc">
                                             Block copy operations, context menu access, and print-screen shortcut combinations within the manuscript reader viewport.
                                        </p>
                                   </div>
                                   <div className="settings_dash__item_action">
                                        <label className="switch_toggle">
                                             <input
                                                  type="checkbox"
                                                  checked={disableRightClick}
                                                  disabled={saving}
                                                  onChange={handleToggleRightClick}
                                             />
                                             <span className="switch_toggle__slider"></span>
                                        </label>
                                   </div>
                              </div>
                         </div>
                    )}
               </div>
          </div>
     );
};

export default Settings_Page;
