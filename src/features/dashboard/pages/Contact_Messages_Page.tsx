import { useEffect, useState } from 'react';
import { apiClient } from '../../../config/axios.config';
import { useDebounce } from '../../../hooks/use_debounce';
import toast from 'react-hot-toast';
import './Contact_Messages_Page.scss';

export interface ContactMessage {
     id: string;
     name: string;
     email: string;
     subject: string | null;
     message: string;
     createdAt: string;
}

const Contact_Messages_Page = () => {
     const [messages, setMessages] = useState<ContactMessage[]>([]);
     const [searchQuery, setSearchQuery] = useState('');
     const debouncedSearchQuery = useDebounce(searchQuery, 300);
     const [loading, setLoading] = useState(true);
     const [error, setError] = useState('');
     const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);

     const fetchMessages = async () => {
          setLoading(true);
          setError('');
          try {
               const res = await apiClient.get<{ success: boolean; data: ContactMessage[] }>('/superadmin/contact-messages');
               if (res.data.success) {
                    setMessages(res.data.data);
               } else {
                    setError('Failed to fetch contact messages.');
               }
          } catch (err: any) {
               setError(err.response?.data?.message || 'Error loading contact messages.');
          } finally {
               setLoading(false);
          }
     };

     const handleDelete = async (id: string) => {
          try {
               const res = await apiClient.delete(`/superadmin/contact-messages/${id}`);
               if (res.data.success) {
                    setMessages((prev) => prev.filter((m) => m.id !== id));
                    toast.success('Message deleted successfully.');
               } else {
                    toast.error('Failed to delete message.');
               }
          } catch (err: any) {
               toast.error(err.response?.data?.message || 'Error deleting message.');
          }
     };

     useEffect(() => {
          fetchMessages();
     }, []);

     const filteredMessages = messages.filter((msg) => {
          const query = debouncedSearchQuery.toLowerCase();
          return (
               msg.name.toLowerCase().includes(query) ||
               msg.email.toLowerCase().includes(query) ||
               (msg.subject && msg.subject.toLowerCase().includes(query)) ||
               msg.message.toLowerCase().includes(query)
          );
     });


     return (
          <div className="contacts_page">
               {error && <div className="contacts_page__error">{error}</div>}

               <div className="contacts_page__card">
                    <div className="contacts_page__header">
                         <div>
                              <h2 className="contacts_page__card_title">Contact Form Messages</h2>
                              <p className="contacts_page__card_subtitle">
                                   View and manage queries submitted by visitors from the public Contact page.
                              </p>
                         </div>
                         <div className="contacts_page__count_pill">
                              <span>{messages.length}</span> Messages
                         </div>
                    </div>

                    <div className="contacts_page__search_bar">
                         <svg className="contacts_page__search_icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="11" cy="11" r="8" />
                              <line x1="21" y1="21" x2="16.65" y2="16.65" />
                         </svg>
                         <input
                              type="text"
                              placeholder="Search by sender, email, subject, or message content..."
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                         />
                    </div>

                    {loading ? (
                         <div className="contacts_page__empty">
                              <div className="contacts_page__spinner"></div>
                              <p>Loading messages...</p>
                         </div>
                    ) : filteredMessages.length === 0 ? (
                         <div className="contacts_page__empty">
                              <svg className="contacts_page__empty_icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                   <path d="M21 15a4 4 0 0 1-4 4H7l-4 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8Z" />
                                   <path d="M8 9h8" />
                                   <path d="M8 13h5" />
                              </svg>
                              <p>{searchQuery ? 'No messages match your search.' : 'No contact messages received yet.'}</p>
                         </div>
                    ) : (
                         <div className="contacts_page__table_container">
                              <table className="contacts_page__table">
                                   <thead>
                                        <tr>
                                             <th>Sender</th>
                                             <th>Subject</th>
                                             <th>Message Snippet</th>
                                             <th>Received Date</th>
                                             <th>Action</th>
                                        </tr>
                                   </thead>
                                   <tbody>
                                        {filteredMessages.map((msg) => (
                                             <tr key={msg.id} className="contacts_page__row" onClick={() => setSelectedMessage(msg)}>
                                                  <td>
                                                       <div className="contacts_page__sender_cell">
                                                            <div className="contacts_page__avatar">
                                                                 {msg.name.charAt(0).toUpperCase()}
                                                            </div>
                                                            <div className="contacts_page__sender_info">
                                                                 <span className="contacts_page__sender_name">{msg.name}</span>
                                                                 <span className="contacts_page__sender_email">{msg.email}</span>
                                                            </div>
                                                       </div>
                                                  </td>
                                                  <td className="contacts_page__subject_cell">
                                                       <span className="contacts_page__subject_text">
                                                            {msg.subject || '(No Subject)'}
                                                       </span>
                                                  </td>
                                                  <td className="contacts_page__message_cell">
                                                       <span className="contacts_page__message_snippet">
                                                            {msg.message.length > 60 ? `${msg.message.substring(0, 60)}...` : msg.message}
                                                       </span>
                                                  </td>
                                                  <td>
                                                       <span className="contacts_page__date">
                                                            {new Date(msg.createdAt).toLocaleDateString('en-IN', {
                                                                 day: 'numeric',
                                                                 month: 'short',
                                                                 year: 'numeric',
                                                                 hour: '2-digit',
                                                                 minute: '2-digit'
                                                            })}
                                                       </span>
                                                  </td>
                                                  <td>
                                                       <div className="contacts_page__actions_cell">
                                                            <button 
                                                                 type="button" 
                                                                 className="contacts_page__action_btn"
                                                                 onClick={(e) => {
                                                                      e.stopPropagation();
                                                                      setSelectedMessage(msg);
                                                                 }}
                                                            >
                                                                 View
                                                            </button>
                                                            <button 
                                                                 type="button" 
                                                                 className="contacts_page__delete_btn"
                                                                 onClick={(e) => {
                                                                      e.stopPropagation();
                                                                      if (window.confirm(`Are you sure you want to delete the message from ${msg.name}?`)) {
                                                                           handleDelete(msg.id);
                                                                      }
                                                                 }}
                                                            >
                                                                 Delete
                                                            </button>
                                                       </div>
                                                  </td>
                                             </tr>
                                        ))}
                                   </tbody>
                              </table>
                         </div>
                    )}
               </div>

               {/* Full Message Details Modal */}
               {selectedMessage && (
                    <div className="contacts_page__modal_overlay" onClick={() => setSelectedMessage(null)}>
                         <div className="contacts_page__modal" onClick={(e) => e.stopPropagation()}>
                              <div className="contacts_page__modal_header">
                                   <h3>Message Details</h3>
                                   <button className="contacts_page__modal_close" onClick={() => setSelectedMessage(null)}>
                                        &times;
                                   </button>
                              </div>
                              <div className="contacts_page__modal_body">
                                   <div className="contacts_page__detail_row">
                                        <span className="contacts_page__detail_label">From:</span>
                                        <span className="contacts_page__detail_value">
                                             <strong>{selectedMessage.name}</strong> &lt;{selectedMessage.email}&gt;
                                        </span>
                                   </div>
                                   <div className="contacts_page__detail_row">
                                        <span className="contacts_page__detail_label">Subject:</span>
                                        <span className="contacts_page__detail_value font-semibold">
                                             {selectedMessage.subject || '(No Subject)'}
                                        </span>
                                   </div>
                                   <div className="contacts_page__detail_row">
                                        <span className="contacts_page__detail_label">Date:</span>
                                        <span className="contacts_page__detail_value">
                                             {new Date(selectedMessage.createdAt).toLocaleString('en-IN', {
                                                  day: 'numeric',
                                                  month: 'long',
                                                  year: 'numeric',
                                                  hour: '2-digit',
                                                  minute: '2-digit',
                                                  second: '2-digit'
                                             })}
                                        </span>
                                   </div>
                                   <hr className="contacts_page__divider" />
                                   <div className="contacts_page__detail_message_label">Message:</div>
                                   <div className="contacts_page__detail_message_body">
                                        {selectedMessage.message}
                                   </div>
                              </div>
                              <div className="contacts_page__modal_footer">
                                   <a 
                                        href={`mailto:${selectedMessage.email}?subject=RE: ${encodeURIComponent(selectedMessage.subject || 'Oakbridge Enquiry')}`} 
                                        className="contacts_page__btn contacts_page__btn--primary"
                                   >
                                        Reply via Email
                                   </a>
                                   <button
                                        type="button"
                                        className="contacts_page__btn contacts_page__btn--danger"
                                        onClick={() => {
                                             if (window.confirm('Are you sure you want to delete this message?')) {
                                                  handleDelete(selectedMessage.id);
                                                  setSelectedMessage(null);
                                             }
                                        }}
                                   >
                                        Delete
                                   </button>
                                   <button
                                        type="button"
                                        className="contacts_page__btn contacts_page__btn--secondary"
                                        onClick={() => setSelectedMessage(null)}
                                   >
                                        Close
                                   </button>
                              </div>
                         </div>
                    </div>
               )}
          </div>
     );
};

export default Contact_Messages_Page;
