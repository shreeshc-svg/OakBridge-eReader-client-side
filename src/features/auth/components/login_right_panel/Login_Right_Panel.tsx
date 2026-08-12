import { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import './Login_Right_Panel.scss';
import type { LoginRightPanelData } from '../../types/login.types';
import Input from '../../../../components/common/input/Input';
import Button from '../../../../components/common/button/Button';
import { useLogin } from '../../hooks/use_login';
import { auth_api } from '../../api/auth.api';
import {
     useAuthStore,
} from '../../../../store/auth.store';

interface LoginRightPanelProps {
     data?: LoginRightPanelData;
}

const EyeIcon = ({ show }: { show: boolean }) => (
     <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
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

const Login_Right_Panel = ({ data }: LoginRightPanelProps) => {
     const [showPassword, setShowPassword] = useState(false);
     const [email, setEmail] = useState('');
     const [password, setPassword] = useState('');
     const [error, setError] = useState('');
     const navigate = useNavigate();
     const [searchParams] = useSearchParams();
     const setAuth = useAuthStore((state) => state.setAuth);

     // Institutional State
     const [isInstitutionMode, setIsInstitutionMode] = useState(false);
     const [institutionName, setInstitutionName] = useState('');
     const [location, setLocation] = useState('');
     const [otp, setOtp] = useState('');
     const [otpSent, setOtpSent] = useState(false);
     const [sendingOtp, setSendingOtp] = useState(false);
     const [loggingInInstitution, setLoggingInInstitution] = useState(false);
     const [isRegisteredInstitution, setIsRegisteredInstitution] = useState(true);

     // Forgot Password State
     const [isForgotPasswordMode, setIsForgotPasswordMode] = useState(false);
     const [forgotEmail, setForgotEmail] = useState('');
     const [sendingForgotMail, setSendingForgotMail] = useState(false);
     const [forgotSuccessMessage, setForgotSuccessMessage] = useState('');

     const { mutate: loginUser, isPending } = useLogin();

     const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
          e.preventDefault();
          if (!forgotEmail) {
               setError('Email address is required');
               return;
          }
          setError('');
          setForgotSuccessMessage('');
          setSendingForgotMail(true);
          try {
               const res = await auth_api.forgot_password(forgotEmail);
               setForgotSuccessMessage(res.message || 'A password reset link has been sent to your email.');
          } catch (err: any) {
               setError(
                    err.response?.data?.message ||
                    err.message ||
                    'Failed to process password reset request.'
               );
          } finally {
               setSendingForgotMail(false);
          }
     };

     const handleSendOtp = async () => {
          if (!email) {
               setError('Email is required to send OTP');
               return;
          }
          setError('');
          setSendingOtp(true);
          try {
               const res = await auth_api.send_institution_otp(email);
               setIsRegisteredInstitution(res.isRegistered);
               setOtpSent(true);
          } catch (err: any) {
               setError(
                    err.response?.data?.message ||
                    err.message ||
                    'Failed to send OTP. Please check the email.'
               );
          } finally {
               setSendingOtp(false);
          }
     };

     const handleInstitutionSubmit = async (e: React.FormEvent) => {
          e.preventDefault();
          setError('');
          if (!otp) {
               setError('OTP is required');
               return;
          }
          setLoggingInInstitution(true);
          try {
               const res = await auth_api.login_institution({
                    email,
                    otp,
                    institution_name: institutionName || undefined,
                    location: location || undefined,
               });

               setAuth({
                    accessToken: res.access_token,
                    refreshToken: res.refresh_token,
                    user: res.user,
               });
               sessionStorage.setItem('just_logged_in', 'true');

               const redirectPath = searchParams.get('redirect');
               const role = res.user.role;
               if (res.user.institution && res.user.institution.tier === 'NONE') {
                    navigate('/subscription');
               } else if (role === 'SUPERADMIN' || role === 'ADMIN' || role === 'MANAGER') {
                    navigate('/superadmin/dashboard');
               } else if (role === 'INSTITUTION_ADMIN') {
                    navigate('/institution/dashboard');
               } else if (redirectPath) {
                    navigate(redirectPath);
               } else {
                    navigate('/user/dashboard');
               }
          } catch (err: any) {
               setError(
                    err.response?.data?.message ||
                    err.message ||
                    'Login failed. Please verify your OTP.'
               );
          } finally {
               setLoggingInInstitution(false);
          }
     };

     const handleSubmit = (e: React.FormEvent) => {
          e.preventDefault();
          if (isInstitutionMode) {
               handleInstitutionSubmit(e);
               return;
          }

          setError('');

          loginUser(
               { email, password },
               {
                    onSuccess: async (loginResponse) => {
                         const accessToken = loginResponse.access_token;
                         const refreshToken = loginResponse.refresh_token;

                         if (!accessToken || !refreshToken) {
                              setError(
                                   'Login succeeded but auth tokens are missing'
                              );
                              return;
                         }

                         try {
                              const meResponse =
                                   await auth_api.get_me(accessToken);

                              setAuth({
                                   accessToken,
                                   refreshToken,
                                   user: meResponse.user,
                              });
                              sessionStorage.setItem('just_logged_in', 'true');

                              const redirectPath = searchParams.get('redirect');
                              const role = meResponse.user.role;
                              if (role === 'SUPERADMIN' || role === 'ADMIN' || role === 'MANAGER') {
                                   navigate('/superadmin/dashboard');
                              } else if (role === 'INSTITUTION_ADMIN') {
                                   navigate('/institution/dashboard');
                              } else if (redirectPath) {
                                   navigate(redirectPath);
                              } else {
                                   navigate('/user/dashboard');
                              }
                         } catch (err) {
                              setError(
                                   (err as any).response?.data?.message ||
                                        (err instanceof Error
                                             ? err.message
                                             : 'Failed to fetch user details')
                              );
                         }
                    },
                    onError: (err) => {
                         setError(
                              err.response?.data?.message ||
                                   data?.messages?.login_failed ||
                                   'Login failed'
                         );
                    },
               }
          );
     };

     return (
          <div className="login_right_panel">
               <div className="login_right_panel__container">
                    {/* Back Button */}
                    <button
                         type="button"
                         className="login_right_panel__back_btn"
                         onClick={() => {
                              if (isForgotPasswordMode) {
                                   setIsForgotPasswordMode(false);
                                   setError('');
                              } else if (isInstitutionMode) {
                                   setIsInstitutionMode(false);
                                   setError('');
                              } else {
                                   navigate('/');
                              }
                         }}
                    >
                         <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                              <line x1="19" y1="12" x2="5" y2="12" />
                              <polyline points="12 19 5 12 12 5" />
                         </svg>
                         <span>Back to Store</span>
                    </button>

                    {/* Header: Title and subtitle */}
                    <div className="login_right_panel__header">
                         <h1>
                              {isForgotPasswordMode
                                   ? 'Reset Password'
                                   : !isInstitutionMode
                                   ? 'Welcome back.'
                                   : 'Institutional SSO'}
                         </h1>
                         <p>
                              {isForgotPasswordMode
                                   ? 'Enter your reader email to receive a password reset link.'
                                   : isInstitutionMode
                                   ? 'Sign in to access your institution subscription.'
                                   : searchParams.get('redirect')
                                   ? 'Log in to buy your first title.'
                                   : 'Sign in to access your purchased books.'}
                         </p>
                    </div>


                    {isForgotPasswordMode ? (
                         <form className="login_right_panel__form" onSubmit={handleForgotPasswordSubmit}>
                              {error && <div className="login_right_panel__error">{error}</div>}
                              {forgotSuccessMessage && (
                                   <div className="login_right_panel__new-inst-banner login_right_panel__new-inst-banner--registered" style={{ color: '#065F46', background: '#D1FAE5', borderColor: '#A7F3D0' }}>
                                        {forgotSuccessMessage}
                                   </div>
                              )}

                              {!forgotSuccessMessage ? (
                                   <>
                                        <div className="login_right_panel__inputs">
                                             <div className="login_right_panel__field-group">
                                                  <label className="login_right_panel__label">READER EMAIL ADDRESS</label>
                                                  <Input
                                                       type="email"
                                                       placeholder="Enter your registered email"
                                                       value={forgotEmail}
                                                       onChange={(e) => setForgotEmail(e.target.value)}
                                                       required
                                                  />
                                             </div>
                                        </div>

                                        <Button
                                             type="submit"
                                             variant="primary"
                                             fullWidth
                                             disabled={sendingForgotMail}
                                             className="login_right_panel__submit-btn"
                                        >
                                             {sendingForgotMail ? 'Sending Reset Link...' : 'Send Password Reset Link'}
                                        </Button>
                                   </>
                              ) : null}

                              <div className="login_right_panel__divider">
                                   <div className="line"></div>
                                   <span>OR</span>
                                   <div className="line"></div>
                              </div>

                              <Button
                                   type="button"
                                   variant="outline"
                                   fullWidth
                                   onClick={() => {
                                        setIsForgotPasswordMode(false);
                                        setError('');
                                        setForgotSuccessMessage('');
                                   }}
                              >
                                   Back to Sign In
                              </Button>
                         </form>
                    ) : (
                         <form
                              className="login_right_panel__form"
                              onSubmit={handleSubmit}
                         >
                              {error && (
                                   <div className="login_right_panel__error">
                                        {error}
                                   </div>
                              )}

                              {!isInstitutionMode ? (
                                   <>
                                        <div className="login_right_panel__inputs">
                                             <div className="login_right_panel__field-group">
                                                  <label className="login_right_panel__label">EMAIL</label>
                                                  <Input
                                                       type="email"
                                                       placeholder={data?.form?.email_placeholder || 'Enter your email'}
                                                       value={email}
                                                       onChange={(e) => setEmail(e.target.value)}
                                                       required
                                                  />
                                             </div>
                                             <div className="login_right_panel__field-group">
                                                  <label className="login_right_panel__label">PASSWORD</label>
                                                  <Input
                                                       type={showPassword ? 'text' : 'password'}
                                                       placeholder={
                                                            data?.form?.password_placeholder || 'Enter your password'
                                                       }
                                                       value={password}
                                                       onChange={(e) => setPassword(e.target.value)}
                                                       required
                                                       icon={<EyeIcon show={showPassword} />}
                                                       onIconClick={() =>
                                                            setShowPassword(!showPassword)
                                                       }
                                                  />
                                             </div>
                                        </div>

                                        <div className="login_right_panel__options-row">
                                             <label className="login_right_panel__keep-signed-in">
                                                  <input type="checkbox" defaultChecked />
                                                  <span>Keep me signed in</span>
                                             </label>
                                             <button
                                                  type="button"
                                                  className="login_right_panel__forgot-link"
                                                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                                                  onClick={() => {
                                                       setIsForgotPasswordMode(true);
                                                       setForgotEmail(email);
                                                       setError('');
                                                       setForgotSuccessMessage('');
                                                  }}
                                             >
                                                  {data?.form?.forgot_password_text || 'Forgot your password?'}
                                             </button>
                                        </div>

                                   <Button
                                        type="submit"
                                        variant="primary"
                                        fullWidth
                                        disabled={isPending}
                                        className="login_right_panel__submit-btn"
                                   >
                                        <svg 
                                             xmlns="http://www.w3.org/2000/svg" 
                                             width="14" 
                                             height="14" 
                                             viewBox="0 0 24 24" 
                                             fill="none" 
                                             stroke="currentColor" 
                                             strokeWidth="2.5" 
                                             strokeLinecap="round" 
                                             strokeLinejoin="round" 
                                             style={{ marginRight: '8px', verticalAlign: 'middle', transform: 'translateY(-1px)' }}
                                        >
                                             <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                             <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                        </svg>
                                        {isPending
                                             ? data?.form?.loading_button_text || 'Signing in...'
                                             : data?.form?.login_button_text || 'Sign in to your library'}
                                   </Button>

                                   <div className="login_right_panel__footer" style={{ marginTop: '1.5rem', marginBottom: '0.5rem' }}>
                                        <p>
                                             New to Oakbridge?{' '}
                                             <Link
                                                  to={`/signup${searchParams.get('redirect') ? `?redirect=${encodeURIComponent(searchParams.get('redirect')!)}` : ''}`}
                                                  className="buy-first-title-link"
                                             >
                                                  SIGN UP TO BUY YOUR FIRST TITLE
                                             </Link>
                                        </p>
                                   </div>

                                   <div className="login_right_panel__divider">
                                        <div className="line"></div>
                                        <span>OR</span>
                                        <div className="line"></div>
                                   </div>

                                   <Button
                                        type="button"
                                        variant="outline"
                                        fullWidth
                                        className="login_right_panel__sso-btn"
                                        onClick={() => {
                                             setIsInstitutionMode(true);
                                             setError('');
                                        }}
                                   >
                                        Continue with institutional SSO
                                   </Button>
                              </>
                         ) : (
                              <>
                                   <div className="login_right_panel__inputs">
                                        <div className="login_right_panel__field-group">
                                             <label className="login_right_panel__label">INSTITUTIONAL EMAIL</label>
                                             <Input
                                                  type="email"
                                                  placeholder="Enter your institutional email"
                                                  value={email}
                                                  onChange={(e) => {
                                                       setEmail(e.target.value);
                                                       setOtpSent(false);
                                                  }}
                                                  required
                                                  disabled={otpSent}
                                             />
                                        </div>
                                        {otpSent && !isRegisteredInstitution && (
                                             <>
                                                  <div className="login_right_panel__new-inst-banner">
                                                       New Institution! Please enter your name and location to register.
                                                  </div>
                                                  <div className="login_right_panel__field-group">
                                                       <label className="login_right_panel__label">INSTITUTION NAME</label>
                                                       <Input
                                                            type="text"
                                                            placeholder="Institution Name"
                                                            value={institutionName}
                                                            onChange={(e) => setInstitutionName(e.target.value)}
                                                            required
                                                       />
                                                  </div>
                                                  <div className="login_right_panel__field-group">
                                                       <label className="login_right_panel__label">LOCATION</label>
                                                       <Input
                                                            type="text"
                                                            placeholder="Location"
                                                            value={location}
                                                            onChange={(e) => setLocation(e.target.value)}
                                                            required
                                                       />
                                                  </div>
                                             </>
                                        )}
                                        {otpSent && isRegisteredInstitution && (
                                             <div className="login_right_panel__new-inst-banner login_right_panel__new-inst-banner--registered">
                                                  Welcome back! Enter the OTP sent to your email to log in.
                                             </div>
                                        )}
                                        {otpSent && (
                                             <div className="login_right_panel__field-group">
                                                  <label className="login_right_panel__label">ONE-TIME PASSWORD (OTP)</label>
                                                  <Input
                                                       type="text"
                                                       placeholder="Enter 6-digit OTP"
                                                       value={otp}
                                                       onChange={(e) => setOtp(e.target.value)}
                                                       required
                                                  />
                                             </div>
                                        )}
                                   </div>

                                   {!otpSent ? (
                                        <Button
                                             type="button"
                                             variant="primary"
                                             fullWidth
                                             onClick={handleSendOtp}
                                             disabled={sendingOtp || !email}
                                             className="login_right_panel__submit-btn"
                                        >
                                             {sendingOtp ? 'Sending OTP...' : 'Send OTP'}
                                        </Button>
                                   ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
                                             <Button
                                                  type="submit"
                                                  variant="primary"
                                                  fullWidth
                                                  disabled={loggingInInstitution || !otp}
                                                  className="login_right_panel__submit-btn"
                                             >
                                                  {loggingInInstitution ? 'Logging in...' : 'Log in / Register'}
                                             </Button>
                                             <Button
                                                  type="button"
                                                  variant="outline"
                                                  fullWidth
                                                  onClick={handleSendOtp}
                                                  disabled={sendingOtp}
                                             >
                                                  {sendingOtp ? 'Resending...' : 'Resend OTP'}
                                             </Button>
                                        </div>
                                   )}

                                   <div className="login_right_panel__divider">
                                        <div className="line"></div>
                                        <span>OR</span>
                                        <div className="line"></div>
                                   </div>

                                   <Button
                                        type="button"
                                        variant="outline"
                                        fullWidth
                                        className="login_right_panel__sso-btn"
                                        onClick={() => {
                                             setIsInstitutionMode(false);
                                             setError('');
                                        }}
                                   >
                                        Go back to standard login
                                   </Button>
                              </>
                         )}
                    </form>
               )}
          </div>
     </div>
);
};

export default Login_Right_Panel;
