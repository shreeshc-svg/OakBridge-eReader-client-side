import { useState, useEffect } from 'react';
import type { Banner } from '../../../public_store/types/banners.types';
import './Banner_Upload_Modal.scss';

interface BannerModalProps {
     isOpen: boolean;
     onClose: () => void;
     onSubmit: (payload: FormData) => Promise<void>;
     bannerToEdit: Banner | null;
}

const XIcon = () => (
     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
     </svg>
);

const Banner_Upload_Modal = ({ isOpen, onClose, onSubmit, bannerToEdit }: BannerModalProps) => {
     const [title, setTitle] = useState('Banner');
     const [subtitle, setSubtitle] = useState('');
     const [linkUrl, setLinkUrl] = useState('');
     const [buttonText, setButtonText] = useState('');
     const [isActive, setIsActive] = useState(true);
     const [order, setOrder] = useState('0');
     const [image, setImage] = useState<File | null>(null);
     const [imageAlt, setImageAlt] = useState('');
     const [isSubmitting, setIsSubmitting] = useState(false);
     const [error, setError] = useState<string | null>(null);

     useEffect(() => {
          if (isOpen) {
               if (bannerToEdit) {
                    setTitle(bannerToEdit.title || 'Banner');
                    setSubtitle(bannerToEdit.subtitle || '');
                    setLinkUrl(bannerToEdit.link_url || '');
                    setButtonText(bannerToEdit.button_text || '');
                    setIsActive(bannerToEdit.is_active);
                    setOrder(bannerToEdit.order.toString());
                    setImageAlt(bannerToEdit.image_alt || '');
               } else {
                    setTitle('Banner');
                    setSubtitle('');
                    setLinkUrl('');
                    setButtonText('');
                    setIsActive(true);
                    setOrder('0');
                    setImageAlt('');
               }
               setImage(null);
               setError(null);
          }
     }, [isOpen, bannerToEdit]);

     const handleSubmit = async (e: React.FormEvent) => {
          e.preventDefault();
          if (!bannerToEdit && !image) {
               setError('Banner image is required for new banners');
               return;
          }

          setIsSubmitting(true);
          setError(null);

          try {
               const formData = new FormData();
               formData.append('title', title);
               formData.append('subtitle', subtitle);
               formData.append('link_url', linkUrl);
               formData.append('button_text', buttonText);
               formData.append('is_active', isActive ? 'true' : 'false');
               formData.append('order', order);
               formData.append('image_alt', imageAlt);
               
               if (image) {
                    formData.append('image', image);
               }

               await onSubmit(formData);
               onClose();
          } catch (err: any) {
               setError(err.message || 'An error occurred');
          } finally {
               setIsSubmitting(false);
          }
     };

     if (!isOpen) return null;

     return (
          <div className="banner_modal_overlay">
               <div className="banner_modal" role="dialog" aria-modal="true">
                    <div className="banner_modal__header">
                         <h2>{bannerToEdit ? 'Edit Banner' : 'New Banner'}</h2>
                         <button onClick={onClose} aria-label="Close modal">
                              <XIcon />
                         </button>
                    </div>

                    <form onSubmit={handleSubmit} className="banner_modal__body">
                         {error && <div style={{ color: '#ef4444', fontSize: '14px', background: 'rgba(239, 68, 68, 0.1)', padding: '12px', borderRadius: '8px' }}>{error}</div>}

                         <div className="banner_modal__field">
                              <label htmlFor="subtitle">Subtitle</label>
                              <input
                                   id="subtitle"
                                   type="text"
                                   value={subtitle}
                                   onChange={(e) => setSubtitle(e.target.value)}
                                   placeholder="e.g. 50% Off Everything"
                              />
                         </div>

                         <div className="banner_modal__field">
                              <label htmlFor="image">Banner Image {bannerToEdit ? '(Leave empty to keep current)' : '*'}</label>
                              <input
                                   id="image"
                                   type="file"
                                   accept="image/*"
                                   onChange={(e) => setImage(e.target.files?.[0] || null)}
                                   required={!bannerToEdit}
                              />
                         </div>

                         <div className="banner_modal__field">
                              <label htmlFor="imageAlt">Image Alt-Text (SEO & Accessibility)</label>
                              <input
                                   id="imageAlt"
                                   type="text"
                                   value={imageAlt}
                                   onChange={(e) => setImageAlt(e.target.value)}
                                   placeholder="Describe any text baked into the banner image..."
                              />
                         </div>

                         <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                              <div className="banner_modal__field">
                                   <label htmlFor="buttonText">Button Text</label>
                                   <input
                                        id="buttonText"
                                        type="text"
                                        value={buttonText}
                                        onChange={(e) => setButtonText(e.target.value)}
                                        placeholder="e.g. Shop Now"
                                   />
                              </div>

                              <div className="banner_modal__field">
                                   <label htmlFor="linkUrl">Link URL</label>
                                   <input
                                        id="linkUrl"
                                        type="text"
                                        value={linkUrl}
                                        onChange={(e) => setLinkUrl(e.target.value)}
                                        placeholder="e.g. /store"
                                   />
                              </div>
                         </div>
                         
                         <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                              <div className="banner_modal__field">
                                   <label htmlFor="order">Display Order (lowest first)</label>
                                   <input
                                        id="order"
                                        type="number"
                                        value={order}
                                        onChange={(e) => setOrder(e.target.value)}
                                   />
                              </div>
                              <div className="banner_modal__checkbox" style={{ alignSelf: 'flex-end', paddingBottom: '12px' }}>
                                   <input
                                        id="isActive"
                                        type="checkbox"
                                        checked={isActive}
                                        onChange={(e) => setIsActive(e.target.checked)}
                                   />
                                   <label htmlFor="isActive">Active (Show in store)</label>
                              </div>
                         </div>

                         <div className="banner_modal__footer">
                              <button type="button" className="cancel" onClick={onClose} disabled={isSubmitting}>
                                   Cancel
                              </button>
                              <button type="submit" className="submit" disabled={isSubmitting}>
                                   {isSubmitting ? 'Saving...' : 'Save Banner'}
                              </button>
                         </div>
                    </form>
               </div>
          </div>
     );
};

export default Banner_Upload_Modal;
