import { useState } from 'react';
import Public_Navbar from '../components/public_navbar/Public_Navbar';
import { apiClient } from '../../../config/axios.config';
import './Contact_Page.scss';

const Contact_Page = () => {
     const [form, setForm] = useState({
          name: '',
          email: '',
          subject: '',
          message: ''
     });
     const [isSubmitting, setIsSubmitting] = useState(false);
     const [submitted, setSubmitted] = useState(false);

     const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
          const { name, value } = e.target;
          setForm(prev => ({ ...prev, [name]: value }));
     };

     const handleSubmit = async (e: React.FormEvent) => {
          e.preventDefault();
          if (!form.name || !form.email || !form.message) {
               import('react-hot-toast').then(({ toast }) => {
                    toast.error('Please fill in all required fields.', {
                         style: { background: '#dc2626', color: '#fff', borderRadius: '8px' }
                    });
               });
               return;
          }

          setIsSubmitting(true);
          try {
               await apiClient.post('/superadmin/contact-messages', form);
               setSubmitted(true);
               
               import('react-hot-toast').then(({ toast }) => {
                    toast.success('Your message has been sent successfully!', {
                         icon: '🚀',
                         style: { background: '#0d2342', color: '#fff', borderRadius: '8px' }
                    });
               });
          } catch (error: any) {
               import('react-hot-toast').then(({ toast }) => {
                    toast.error(error.response?.data?.message || 'Failed to send message. Please try again.', {
                         style: { background: '#dc2626', color: '#fff', borderRadius: '8px' }
                    });
               });
          } finally {
               setIsSubmitting(false);
          }
     };

     return (
          <div className="contact_page">
               <Public_Navbar />
               
               <div className="contact_layout">
                    {/* Header */}
                    <div className="contact_header">
                         <h1 className="contact_header__title">Get in Touch</h1>
                         <p className="contact_header__subtitle">
                              Have any questions about Oakbridge Reader, subscription tiers, or bulk corporate licensing? Drop us a line.
                         </p>
                    </div>

                    <div className="contact_grid">
                         {/* Info Sidebar Column */}
                         <div className="contact_info">
                              <div className="contact_info__card">
                                   <h2 className="contact_info__title">Contact Information</h2>
                                   
                                   <div className="contact_info__item">
                                        <div className="contact_info__icon">
                                             <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                                        </div>
                                        <div className="contact_info__text">
                                             <h3>Address</h3>
                                             <p>
                                                  Oakbridge Publishing Pvt. Ltd.<br />
                                                  934, 9th Floor, Tower B3,<br />
                                                  Spaze iTech Park, Sector 49,<br />
                                                  Gurugram, Haryana 122018
                                             </p>
                                        </div>
                                   </div>

                                   <div className="contact_info__item">
                                        <div className="contact_info__icon">
                                             <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
                                        </div>
                                        <div className="contact_info__text">
                                             <h3>Phone Support</h3>
                                             <p>+91 124 4305970</p>
                                             <p>+91 8800337299</p>
                                        </div>
                                   </div>

                                   <div className="contact_info__item">
                                        <div className="contact_info__icon">
                                             <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
                                        </div>
                                        <div className="contact_info__text">
                                             <h3>Email</h3>
                                             <p><a href="mailto:info@oakbridge.in">info@oakbridge.in</a></p>
                                             <p><a href="mailto:fpa@oakbridge.in">fpa@oakbridge.in</a></p>
                                        </div>
                                   </div>
                              </div>
                              
                              <div className="contact_map_mockup">
                                   <div className="contact_map_mockup__title">Find Us on Google Maps</div>
                                   <div className="contact_map_mockup__frame">
                                        <iframe 
                                             title="Oakbridge Location Map"
                                             src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3509.7335198089987!2d77.0427845!3d28.4122394!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390d226a3fffffff%3A0xe104a3774b934b17!2sSpaze%20iTech%20Park!5e0!3m2!1sen!2sin!4v1684394801944!5m2!1sen!2sin" 
                                             width="100%" 
                                             height="100%" 
                                             style={{ border: 0, borderRadius: '8px' }} 
                                             allowFullScreen={true} 
                                             loading="lazy"
                                             referrerPolicy="no-referrer-when-downgrade"
                                        ></iframe>
                                   </div>
                              </div>
                         </div>

                         {/* Contact Form Column */}
                         <div className="contact_form_container">
                              {submitted ? (
                                   <div className="contact_success">
                                        <div className="contact_success__icon">
                                             <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                                        </div>
                                        <h2 className="contact_success__title">Thank You!</h2>
                                        <p className="contact_success__msg">
                                             Your message has been received. Our support team will review your query and get back to you within 24 hours.
                                        </p>
                                        <button 
                                             type="button" 
                                             className="contact_success__btn"
                                             onClick={() => {
                                                  setForm({ name: '', email: '', subject: '', message: '' });
                                                  setSubmitted(false);
                                             }}
                                        >
                                             Send Another Message
                                        </button>
                                   </div>
                              ) : (
                                   <form className="contact_form" onSubmit={handleSubmit}>
                                        <h2 className="contact_form__title">Send Us a Message</h2>
                                        
                                        <div className="contact_form__row">
                                             <div className="contact_form__group">
                                                  <label htmlFor="name" className="contact_form__label">Full Name *</label>
                                                  <input 
                                                       type="text" 
                                                       id="name" 
                                                       name="name" 
                                                       className="contact_form__input"
                                                       placeholder="e.g. Rohan Sharma"
                                                       value={form.name}
                                                       onChange={handleChange}
                                                       required 
                                                  />
                                             </div>
                                        </div>

                                        <div className="contact_form__row">
                                             <div className="contact_form__group">
                                                  <label htmlFor="email" className="contact_form__label">Email Address *</label>
                                                  <input 
                                                       type="email" 
                                                       id="email" 
                                                       name="email" 
                                                       className="contact_form__input"
                                                       placeholder="e.g. rohan@example.com"
                                                       value={form.email}
                                                       onChange={handleChange}
                                                       required 
                                                  />
                                             </div>
                                        </div>

                                        <div className="contact_form__row">
                                             <div className="contact_form__group">
                                                  <label htmlFor="subject" className="contact_form__label">Subject</label>
                                                  <input 
                                                       type="text" 
                                                       id="subject" 
                                                       name="subject" 
                                                       className="contact_form__input"
                                                       placeholder="What is this regarding?"
                                                       value={form.subject}
                                                       onChange={handleChange}
                                                  />
                                             </div>
                                        </div>

                                        <div className="contact_form__row">
                                             <div className="contact_form__group">
                                                  <label htmlFor="message" className="contact_form__label">Message *</label>
                                                  <textarea 
                                                       id="message" 
                                                       name="message" 
                                                       rows={6}
                                                       className="contact_form__textarea"
                                                       placeholder="Write your message details here..."
                                                       value={form.message}
                                                       onChange={handleChange}
                                                       required 
                                                  ></textarea>
                                             </div>
                                        </div>

                                        <button 
                                             type="submit" 
                                             className={`contact_form__submit ${isSubmitting ? 'is_submitting' : ''}`}
                                             disabled={isSubmitting}
                                        >
                                             {isSubmitting ? 'Sending Message...' : 'Send Message'}
                                        </button>
                                   </form>
                              )}
                         </div>
                    </div>
               </div>
          </div>
     );
};

export default Contact_Page;
