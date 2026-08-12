import { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import Login_Left_Panel from '../../components/login_left_panel/Login_Left_Panel';
import Input from '../../../../components/common/input/Input';
import Button from '../../../../components/common/button/Button';
import { auth_api } from '../../api/auth.api';
import '../login/Login_Page.scss';
import '../../components/login_right_panel/Login_Right_Panel.scss';

const EyeIcon = ({ show }: { show: boolean }) => (
     <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
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

const LockIcon = () => (
     <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#0066f2"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
     >
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
     </svg>
);

const CheckCircleIcon = () => (
     <svg
          xmlns="http://www.w3.org/2000/svg"
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#10B981"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
     >
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
     </svg>
);

const AlertTriangleIcon = () => (
     <svg
          xmlns="http://www.w3.org/2000/svg"
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#EF4444"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
     >
          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
     </svg>
);

const Reset_Password_Page = () => {
     const [searchParams] = useSearchParams();
     const token = searchParams.get('token') || '';
     const navigate = useNavigate();

     const [newPassword, setNewPassword] = useState('');
     const [confirmPassword, setConfirmPassword] = useState('');
     const [showNewPassword, setShowNewPassword] = useState(false);
     const [showConfirmPassword, setShowConfirmPassword] = useState(false);
     const [error, setError] = useState('');
     const [success, setSuccess] = useState('');
     const [loading, setLoading] = useState(false);

     const isLengthValid = newPassword.length >= 6;
     const isMatchValid = confirmPassword.length > 0 && newPassword === confirmPassword;

     const handleSubmit = async (e: React.FormEvent) => {
          e.preventDefault();
          if (!token) {
               setError('Invalid or missing password reset link.');
               return;
          }
          if (!isLengthValid) {
               setError('Password must be at least 6 characters long.');
               return;
          }
          if (newPassword !== confirmPassword) {
               setError('Passwords do not match.');
               return;
          }

          setError('');
          setLoading(true);

          try {
               const res = await auth_api.reset_password({
                    token,
                    new_password: newPassword,
               });
               setSuccess(res.message || 'Your password has been successfully reset.');
          } catch (err: any) {
               setError(
                    err.response?.data?.message ||
                    err.message ||
                    'Failed to reset password. The link may have expired.'
               );
          } finally {
               setLoading(false);
          }
     };

     return (
          <div className="login_page">
               <div className="login_page__container">
                    {/* Left Branding Panel */}
                    <div className="login_page__container__left_panel">
                         <Login_Left_Panel />
                    </div>

                    {/* Right Form Panel */}
                    <div className="login_right_panel">
                         <div className="login_right_panel__container">
                              {!token ? (
                                   /* Invalid or Missing Token State */
                                   <div className="login_right_panel__form" style={{ textAlign: 'center', alignItems: 'center' }}>
                                        <div style={{ marginBottom: '16px' }}>
                                             <AlertTriangleIcon />
                                        </div>
                                        <div className="login_right_panel__header" style={{ textAlign: 'center', alignItems: 'center', marginBottom: '16px' }}>
                                             <h1 style={{ fontSize: '28px' }}>Invalid Reset Link</h1>
                                             <p style={{ fontSize: '14px', textAlign: 'center' }}>
                                                  This password reset link is invalid or has expired. Please request a new password reset email.
                                             </p>
                                        </div>
                                        <Button
                                             type="button"
                                             variant="primary"
                                             fullWidth
                                             className="login_right_panel__submit-btn"
                                             onClick={() => navigate('/login')}
                                        >
                                             Return to Sign In
                                        </Button>
                                   </div>
                              ) : success ? (
                                   /* Success State */
                                   <div className="login_right_panel__form" style={{ textAlign: 'center', alignItems: 'center' }}>
                                        <div style={{ marginBottom: '16px' }}>
                                             <CheckCircleIcon />
                                        </div>
                                        <div className="login_right_panel__header" style={{ textAlign: 'center', alignItems: 'center', marginBottom: '20px' }}>
                                             <h1 style={{ fontSize: '28px' }}>Password Reset Complete!</h1>
                                             <p style={{ fontSize: '14.5px', textAlign: 'center', color: '#475569' }}>
                                                  {success} You can now log into your Oakbridge reader account using your new password.
                                             </p>
                                        </div>
                                        <Button
                                             type="button"
                                             variant="primary"
                                             fullWidth
                                             className="login_right_panel__submit-btn"
                                             onClick={() => navigate('/login')}
                                        >
                                             Sign In to Your Library
                                        </Button>
                                   </div>
                              ) : (
                                   /* Form State */
                                   <>
                                        <div className="login_right_panel__header">
                                             <div
                                                  style={{
                                                       width: '48px',
                                                       height: '48px',
                                                       borderRadius: '12px',
                                                       backgroundColor: '#eff6ff',
                                                       display: 'flex',
                                                       alignItems: 'center',
                                                       justifyContent: 'center',
                                                       marginBottom: '16px',
                                                       border: '1px solid #dbeafe',
                                                  }}
                                             >
                                                  <LockIcon />
                                             </div>
                                             <h1>Choose New Password</h1>
                                             <p>Set a strong password to protect your Oakbridge account.</p>
                                        </div>

                                        <form className="login_right_panel__form" onSubmit={handleSubmit}>
                                             {error && <div className="login_right_panel__error">{error}</div>}

                                             <div className="login_right_panel__inputs">
                                                  {/* New Password Field */}
                                                  <div className="login_right_panel__field-group">
                                                       <label className="login_right_panel__label">NEW PASSWORD</label>
                                                       <Input
                                                            type={showNewPassword ? 'text' : 'password'}
                                                            placeholder="Enter new password (min. 6 characters)"
                                                            value={newPassword}
                                                            onChange={(e) => setNewPassword(e.target.value)}
                                                            required
                                                            icon={<EyeIcon show={showNewPassword} />}
                                                            onIconClick={() => setShowNewPassword(!showNewPassword)}
                                                       />
                                                  </div>

                                                  {/* Confirm Password Field */}
                                                  <div className="login_right_panel__field-group">
                                                       <label className="login_right_panel__label">CONFIRM PASSWORD</label>
                                                       <Input
                                                            type={showConfirmPassword ? 'text' : 'password'}
                                                            placeholder="Re-enter your new password"
                                                            value={confirmPassword}
                                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                                            required
                                                            icon={<EyeIcon show={showConfirmPassword} />}
                                                            onIconClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                       />
                                                  </div>
                                             </div>

                                             {/* Password Requirement Badges */}
                                             <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '-4px', fontSize: '13px' }}>
                                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: isLengthValid ? '#059669' : '#64748B' }}>
                                                       <span style={{ fontWeight: 'bold' }}>{isLengthValid ? '✓' : '•'}</span>
                                                       <span>At least 6 characters</span>
                                                  </div>
                                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: isMatchValid ? '#059669' : '#64748B' }}>
                                                       <span style={{ fontWeight: 'bold' }}>{isMatchValid ? '✓' : '•'}</span>
                                                       <span>Passwords match</span>
                                                  </div>
                                             </div>

                                             <Button
                                                  type="submit"
                                                  variant="primary"
                                                  fullWidth
                                                  disabled={loading || !isLengthValid || !isMatchValid}
                                                  className="login_right_panel__submit-btn"
                                                  style={{ marginTop: '8px' }}
                                             >
                                                  {loading ? 'Updating Password...' : 'Reset Password'}
                                             </Button>

                                             <div className="login_right_panel__divider">
                                                  <div className="line"></div>
                                                  <span>OR</span>
                                                  <div className="line"></div>
                                             </div>

                                             <Link to="/login" style={{ textDecoration: 'none', width: '100%' }}>
                                                  <Button type="button" variant="outline" fullWidth className="login_right_panel__sso-btn">
                                                       Back to Sign In
                                                  </Button>
                                             </Link>
                                        </form>
                                   </>
                              )}
                         </div>
                    </div>
               </div>
          </div>
     );
};

export default Reset_Password_Page;
