import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import './Signup_Right_Panel.scss';
import type { SignupRightPanelData } from '../../types/login.types';
import Input from '../../../../components/common/input/Input';
import Button from '../../../../components/common/button/Button';
import { useSignup } from '../../hooks/use_signup';
import { useSendOtp } from '../../hooks/use_send_otp';
import { auth_api } from '../../api/auth.api';
import { useAuthStore } from '../../../../store/auth.store';

interface SignupRightPanelProps {
     data?: SignupRightPanelData;
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

const Signup_Right_Panel = ({ data }: SignupRightPanelProps) => {
     const [showPassword, setShowPassword] = useState(false);
     const [username, setUsername] = useState('');
     const [email, setEmail] = useState('');
     const [password, setPassword] = useState('');
     const [role, setRole] = useState('reader');
     const [otp, setOtp] = useState('');

     const [step, setStep] = useState(1);
     const [error, setError] = useState('');
     const [successMsg, setSuccessMsg] = useState('');
     const navigate = useNavigate();
     const [searchParams] = useSearchParams();

     const { mutate: sendOtp, isPending: isSendingOtp } = useSendOtp();
     const { mutate: signupUser, isPending: isSigningUp } = useSignup();

     // Institution mode state
     const [isInstitutionMode, setIsInstitutionMode] = useState(false);

     useEffect(() => {
          const mode = searchParams.get('mode');
          if (mode === 'institution') {
               setIsInstitutionMode(true);
          }
     }, [searchParams]);
     const [institutionName, setInstitutionName] = useState('');
     const [location, setLocation] = useState('');
     const [otpSent, setOtpSent] = useState(false);
     const [sendingOtpInst, setSendingOtpInst] = useState(false);
     const [loggingInInstitution, setLoggingInInstitution] = useState(false);
     const setAuth = useAuthStore((s) => s.setAuth);

     const handleSendOtpInstitution = async () => {
          if (!institutionName || !location) {
               setError('Institution name and location are required');
               return;
          }
          if (!email) {
               setError('Email is required to send OTP');
               return;
          }
          setError('');
          setSuccessMsg('');
          setSendingOtpInst(true);
          try {
               const res = await auth_api.send_institution_otp(email);
               setOtpSent(true);
               setSuccessMsg(res.message);
          } catch (err: any) {
               setError(
                    err.response?.data?.message ||
                    err.message ||
                    'Failed to send OTP. Please check the email.'
               );
          } finally {
               setSendingOtpInst(false);
          }
     };

     const handleInstitutionSubmit = async (e: React.FormEvent) => {
          e.preventDefault();
          if (!otp) {
               setError('Please enter the OTP');
               return;
          }
          setError('');
          setSuccessMsg('');
          setLoggingInInstitution(true);
          try {
               const res = await auth_api.login_institution({
                    email,
                    otp,
                    institution_name: institutionName,
                    location,
               });
               setAuth({
                    accessToken: res.access_token,
                    refreshToken: res.refresh_token,
                    user: res.user,
               });
               if (
                    res.user?.role === 'INSTITUTION_ADMIN' &&
                    (!res.user?.institution?.tier || res.user?.institution?.tier === 'NONE')
               ) {
                    navigate('/subscription');
               } else {
                    navigate('/institution/dashboard');
               }
          } catch (err: any) {
               setError(
                    err.response?.data?.message ||
                    err.message ||
                    'Login failed. Please try again.'
               );
          } finally {
               setLoggingInInstitution(false);
          }
     };

     const handleSendOtp = (e: React.MouseEvent) => {
          e.preventDefault();
          setError('');
          setSuccessMsg('');

          if (!email) {
               setError('Email is required to send OTP');
               return;
          }

          sendOtp(
               { email },
               {
                    onSuccess: () => {
                         setStep(2);
                         setSuccessMsg(
                              data?.messages?.otp_sent_success ||
                                   'OTP sent successfully'
                         );
                    },
                    onError: (err) => {
                         setError(
                              err.response?.data?.message ||
                                   data?.messages?.otp_sent_failed ||
                                   'Failed to send OTP'
                         );
                    },
               }
          );
     };

     const handleVerifyOtp = (e: React.MouseEvent) => {
          e.preventDefault();
          setError('');
          setSuccessMsg('');

          if (!otp) {
               setError('Please enter the OTP');
               return;
          }

          // Move to step 3
          setStep(3);
     };

     const handleSubmit = (e: React.FormEvent) => {
          e.preventDefault();
          setError('');
          setSuccessMsg('');

          if (!otp || !username || !password) {
               setError('Please fill in all details');
               return;
          }

          // Map frontend roles to backend ENUM expected values
          const mappedRole = role === 'reader' ? 'USER' : 'AUTHOR';

          signupUser(
               { username, email, password, role: mappedRole, otp },
               {
                    onSuccess: () => {
                         navigate('/login');
                    },
                    onError: (err) => {
                         setError(
                              err.response?.data?.message ||
                                   data?.messages?.signup_failed ||
                                   'Registration failed'
                         );
                    },
               }
          );
     };

     return (
          <div className="signup_right_panel">
               <div className="signup_right_panel__container">
                    {/* Back Button */}
                    <button
                         type="button"
                         className="signup_right_panel__back_btn"
                         onClick={() => {
                              if (isInstitutionMode) {
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
                    <div className="signup_right_panel__header">
                         <h1>{!isInstitutionMode ? 'Create account.' : 'Institution Signup'}</h1>
                         <p>
                              {isInstitutionMode
                                   ? 'Register your institution with Oakbridge.'
                                   : searchParams.get('redirect')
                                   ? 'Sign up to buy your first title.'
                                   : 'Get started on Oakbridge today.'}
                         </p>
                    </div>


                    <form
                         className="signup_right_panel__form"
                         onSubmit={isInstitutionMode ? handleInstitutionSubmit : handleSubmit}
                    >
                         {error && (
                              <div className="signup_right_panel__error">
                                   {error}
                              </div>
                         )}
                         {successMsg && (
                              <div className="signup_right_panel__success">
                                   {successMsg}
                              </div>
                         )}

                         {!isInstitutionMode ? (
                              <>
                                   <div className="signup_right_panel__inputs">
                                        {step === 1 && (
                                             <div className="signup_right_panel__field-group">
                                                  <label className="signup_right_panel__label">EMAIL</label>
                                                  <Input
                                                       type="email"
                                                       placeholder={
                                                            data?.form?.email_placeholder || 'Enter your email'
                                                       }
                                                       value={email}
                                                       onChange={(e) =>
                                                            setEmail(e.target.value)
                                                       }
                                                       required
                                                  />
                                             </div>
                                        )}

                                        {step === 2 && (
                                             <div className="signup_right_panel__field-group">
                                                  <label className="signup_right_panel__label">ONE-TIME PASSWORD (OTP)</label>
                                                  <Input
                                                       type="text"
                                                       placeholder={
                                                            data?.form?.otp_placeholder || 'Enter OTP'
                                                       }
                                                       value={otp}
                                                       onChange={(e) => setOtp(e.target.value)}
                                                       required
                                                  />
                                             </div>
                                        )}

                                        {step === 3 && (
                                             <>
                                                  <div className="signup_right_panel__field-group">
                                                       <label className="signup_right_panel__label">EMAIL</label>
                                                       <Input
                                                            type="email"
                                                            placeholder={
                                                                 data?.form?.email_placeholder || 'Enter your email'
                                                            }
                                                            value={email}
                                                            disabled
                                                            onChange={() => {}}
                                                       />
                                                  </div>
                                                  <div className="signup_right_panel__field-group">
                                                       <label className="signup_right_panel__label">USERNAME</label>
                                                       <Input
                                                            type="text"
                                                            placeholder={
                                                                 data?.form?.username_placeholder || 'Choose a username'
                                                            }
                                                            value={username}
                                                            onChange={(e) =>
                                                                 setUsername(e.target.value)
                                                            }
                                                            required
                                                       />
                                                  </div>
                                                  <div className="signup_right_panel__field-group">
                                                       <label className="signup_right_panel__label">PASSWORD</label>
                                                       <Input
                                                            type={
                                                                 showPassword
                                                                      ? 'text'
                                                                      : 'password'
                                                            }
                                                            placeholder={
                                                                 data?.form?.password_placeholder || 'Choose a password'
                                                            }
                                                            value={password}
                                                            onChange={(e) =>
                                                                 setPassword(e.target.value)
                                                            }
                                                            required
                                                            icon={
                                                                 <EyeIcon
                                                                      show={showPassword}
                                                                 />
                                                            }
                                                            onIconClick={() =>
                                                                 setShowPassword(!showPassword)
                                                            }
                                                       />
                                                  </div>

                                                  <div className="signup_right_panel__role_selector">
                                                       <label className="signup_right_panel__label">
                                                            {data?.form?.role_label || 'I AM A'}
                                                       </label>
                                                       <div className="role_options">
                                                            <button
                                                                 type="button"
                                                                 className={`role_btn ${role === 'reader' ? 'active' : ''}`}
                                                                 onClick={() =>
                                                                      setRole('reader')
                                                                 }
                                                            >
                                                                 Reader
                                                            </button>
                                                            <button
                                                                 type="button"
                                                                 className={`role_btn ${role === 'author' ? 'active' : ''}`}
                                                                 onClick={() =>
                                                                      setRole('author')
                                                                 }
                                                            >
                                                                 Author
                                                            </button>
                                                       </div>
                                                  </div>
                                             </>
                                        )}
                                   </div>

                                   {step === 1 && (
                                        <Button
                                             type="button"
                                             variant="primary"
                                             fullWidth
                                             onClick={handleSendOtp}
                                             disabled={isSendingOtp || !email}
                                             className="signup_right_panel__submit-btn"
                                        >
                                             {isSendingOtp
                                                  ? data?.form?.sending_otp_button_text || 'Sending OTP...'
                                                  : data?.form?.send_otp_button_text || 'Send OTP'}
                                        </Button>
                                   )}

                                   {step === 2 && (
                                        <div className="signup_right_panel__actions">
                                             <Button
                                                  type="button"
                                                  variant="primary"
                                                  fullWidth
                                                  onClick={handleVerifyOtp}
                                                  disabled={!otp}
                                                  className="signup_right_panel__submit-btn"
                                             >
                                                  {data?.form?.verify_otp_button_text ||
                                                       'Verify OTP'}
                                             </Button>
                                             <Button
                                                  type="button"
                                                  variant="outline"
                                                  fullWidth
                                                  onClick={() => setStep(1)}
                                             >
                                                  {data?.form?.back_button_text || 'Back'}
                                             </Button>
                                        </div>
                                   )}

                                   {step === 3 && (
                                        <div className="signup_right_panel__actions">
                                             <Button
                                                  type="submit"
                                                  variant="primary"
                                                  fullWidth
                                                  disabled={
                                                       isSigningUp ||
                                                       !username ||
                                                       !password
                                                  }
                                                  className="signup_right_panel__submit-btn"
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
                                                  {isSigningUp
                                                       ? data?.form?.loading_button_text || 'Registering...'
                                                       : data?.form?.signup_button_text || 'Register Account'}
                                             </Button>
                                             <Button
                                                  type="button"
                                                  variant="outline"
                                                  fullWidth
                                                  onClick={() => setStep(2)}
                                                  disabled={isSigningUp}
                                             >
                                                  {data?.form?.back_button_text || 'Back'}
                                             </Button>
                                        </div>
                                   )}

                                   <div className="signup_right_panel__divider">
                                        <div className="line"></div>
                                        <span>OR</span>
                                        <div className="line"></div>
                                   </div>

                                   <Button
                                        type="button"
                                        variant="outline"
                                        fullWidth
                                        className="signup_right_panel__sso-btn"
                                        onClick={() => {
                                             setIsInstitutionMode(true);
                                             setError('');
                                             setSuccessMsg('');
                                        }}
                                   >
                                        Register as an institution
                                   </Button>
                              </>
                         ) : (
                              <>
                                   <div className="signup_right_panel__inputs">
                                        {!otpSent ? (
                                             <>
                                                  <div className="signup_right_panel__field-group">
                                                       <label className="signup_right_panel__label">INSTITUTION NAME</label>
                                                       <Input
                                                            type="text"
                                                            placeholder="Institution Name"
                                                            value={institutionName}
                                                            onChange={(e) => setInstitutionName(e.target.value)}
                                                            required
                                                       />
                                                  </div>
                                                  <div className="signup_right_panel__field-group">
                                                       <label className="signup_right_panel__label">LOCATION</label>
                                                       <Input
                                                            type="text"
                                                            placeholder="Location"
                                                            value={location}
                                                            onChange={(e) => setLocation(e.target.value)}
                                                            required
                                                       />
                                                  </div>
                                                  <div className="signup_right_panel__field-group">
                                                       <label className="signup_right_panel__label">INSTITUTIONAL EMAIL</label>
                                                       <Input
                                                            type="email"
                                                            placeholder="Institutional Email"
                                                            value={email}
                                                            onChange={(e) => setEmail(e.target.value)}
                                                            required
                                                       />
                                                  </div>
                                             </>
                                        ) : (
                                             <>
                                                  <div className="signup_right_panel__new-inst-banner">
                                                       An OTP has been sent to <strong>{email}</strong>. Enter it below to continue.
                                                  </div>
                                                  <div className="signup_right_panel__field-group">
                                                       <label className="signup_right_panel__label">ONE-TIME PASSWORD (OTP)</label>
                                                       <Input
                                                            type="text"
                                                            placeholder="Enter 6-digit OTP"
                                                            value={otp}
                                                            onChange={(e) => setOtp(e.target.value)}
                                                            required
                                                       />
                                                  </div>
                                             </>
                                        )}
                                   </div>

                                   {!otpSent ? (
                                        <Button
                                             type="button"
                                             variant="primary"
                                             fullWidth
                                             onClick={handleSendOtpInstitution}
                                             disabled={sendingOtpInst || !email || !institutionName || !location}
                                             className="signup_right_panel__submit-btn"
                                        >
                                             {sendingOtpInst ? 'Sending OTP...' : 'Send OTP'}
                                        </Button>
                                   ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
                                             <Button
                                                  type="submit"
                                                  variant="primary"
                                                  fullWidth
                                                  disabled={loggingInInstitution || !otp}
                                                  className="signup_right_panel__submit-btn"
                                             >
                                                  {loggingInInstitution ? 'Processing...' : 'Register / Log in'}
                                             </Button>
                                             <Button
                                                  type="button"
                                                  variant="outline"
                                                  fullWidth
                                                  onClick={() => setOtpSent(false)}
                                             >
                                                  Back
                                             </Button>
                                        </div>
                                   )}

                                   <div className="signup_right_panel__divider">
                                        <div className="line"></div>
                                        <span>OR</span>
                                        <div className="line"></div>
                                   </div>

                                   <Button
                                        type="button"
                                        variant="outline"
                                        fullWidth
                                        className="signup_right_panel__sso-btn"
                                        onClick={() => {
                                             setIsInstitutionMode(false);
                                             setError('');
                                             setSuccessMsg('');
                                        }}
                                   >
                                        Go back to individual signup
                                   </Button>
                              </>
                         )}
                    </form>

                    <div className="signup_right_panel__footer">
                         <p>
                              Already have an account?{' '}
                              <Link
                                   to={`/login${searchParams.get('redirect') ? `?redirect=${encodeURIComponent(searchParams.get('redirect')!)}` : ''}`}
                                   className="buy-first-title-link"
                              >
                                   Sign in
                              </Link>
                         </p>
                    </div>
               </div>
          </div>
     );
};

export default Signup_Right_Panel;
