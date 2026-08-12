import { useState, useEffect } from 'react';
import type { Banner } from '../../public_store/types/banners.types';
import type { AuthRole } from '../../auth/types/auth.types';
import { useBanners } from '../../public_store/hooks/use_banners';
import Banner_Upload_Modal from '../components/banner_upload_modal/Banner_Upload_Modal';
import './Banners_Page.scss';

interface BannersPageProps {
     role: AuthRole | 'SUPERADMIN';
}

const PlusIcon = () => (
     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
     </svg>
);

const EditIcon = () => (
     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
          <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
     </svg>
);

const TrashIcon = () => (
     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
          <path d="M3 6h18" />
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
     </svg>
);

const Banners_Page = ({ role }: BannersPageProps) => {
     const canManage = role === 'SUPERADMIN' || role === 'ADMIN';
     const { allBanners, isLoading, fetchAllBanners, createBanner, updateBanner, deleteBanner, reorderBanners } = useBanners();
     
     const [isModalOpen, setIsModalOpen] = useState(false);
     const [bannerToEdit, setBannerToEdit] = useState<Banner | null>(null);

     // Drag and drop states
     const [localBanners, setLocalBanners] = useState<Banner[]>([]);
     const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

     useEffect(() => {
          fetchAllBanners();
     }, [fetchAllBanners]);

     useEffect(() => {
          setLocalBanners(allBanners);
     }, [allBanners]);

     const handleDragStart = (index: number) => {
          setDraggedIndex(index);
     };

     const handleDragOver = (e: React.DragEvent, index: number) => {
          e.preventDefault();
          if (draggedIndex === null || draggedIndex === index) return;

          const newList = [...localBanners];
          const draggedItem = newList[draggedIndex];
          newList.splice(draggedIndex, 1);
          newList.splice(index, 0, draggedItem);
          
          setDraggedIndex(index);
          setLocalBanners(newList);
     };

     const handleDragEnd = async () => {
          setDraggedIndex(null);
          try {
               const ids = localBanners.map((b) => b.id);
               await reorderBanners(ids);
          } catch (err) {
               console.error('Failed to save banner sequence:', err);
          }
     };

     const handleAddClick = () => {
          setBannerToEdit(null);
          setIsModalOpen(true);
     };

     const handleEditClick = (banner: Banner) => {
          setBannerToEdit(banner);
          setIsModalOpen(true);
     };

     const handleDeleteClick = async (id: string) => {
          if (window.confirm('Are you sure you want to delete this banner?')) {
               await deleteBanner(id);
          }
     };

     const handleModalSubmit = async (payload: FormData) => {
          if (bannerToEdit) {
               await updateBanner(bannerToEdit.id, payload);
          } else {
               await createBanner(payload);
          }
     };

     if (isLoading) {
          return <div>Loading banners...</div>;
     }

     return (
          <div className="banners_page">
               <div className="banners_page__header">
                    <div className="banners_page__title_group">
                         <h1>Banners</h1>
                         <p>Manage the promotional banners displayed on the Store page.</p>
                    </div>

                    {canManage && (
                         <div className="banners_page__actions">
                              <button
                                   className="banners_page__add_btn"
                                   onClick={handleAddClick}
                              >
                                   <PlusIcon />
                                   New Banner
                              </button>
                         </div>
                    )}
               </div>

               <div className="banners_page__grid">
                    {localBanners.map((banner, idx) => (
                         <div 
                              key={banner.id} 
                              className={`banners_page__card ${draggedIndex === idx ? 'dragging' : ''}`}
                              draggable={canManage}
                              onDragStart={() => handleDragStart(idx)}
                              onDragOver={(e) => handleDragOver(e, idx)}
                              onDragEnd={handleDragEnd}
                              style={{ cursor: canManage ? 'grab' : 'default' }}
                         >
                              <img src={banner.image_url} alt="Banner image" className="banners_page__card_image" />
                              <div className="banners_page__card_info">
                                   <span>{banner.subtitle || 'No subtitle'}</span>
                              </div>
                              <div className="banners_page__card_footer">
                                   <span style={{ fontSize: '12px', color: banner.is_active ? '#10b981' : '#6b7280', fontWeight: 'bold' }}>
                                        {banner.is_active ? 'ACTIVE' : 'INACTIVE'}
                                   </span>
                                   {canManage && (
                                        <div className="banners_page__card_actions">
                                             <button onClick={() => handleEditClick(banner)} title="Edit">
                                                  <EditIcon />
                                             </button>
                                             <button className="delete" onClick={() => handleDeleteClick(banner.id)} title="Delete">
                                                  <TrashIcon />
                                             </button>
                                        </div>
                                   )}
                              </div>
                         </div>
                    ))}
               </div>

               {allBanners.length === 0 && (
                    <div className="banners_page__empty_state">
                         <div className="banners_page__empty_icon">
                              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                         </div>
                         <h3>No Banners Yet</h3>
                         <p>Create your first promotional banner to engage users on the Store page. Banners can highlight new books, offers, or announcements.</p>
                         {canManage && (
                              <button
                                   className="banners_page__add_btn"
                                   onClick={handleAddClick}
                              >
                                   <PlusIcon />
                                   Add Your First Banner
                              </button>
                         )}
                    </div>
               )}

               {canManage && (
                    <Banner_Upload_Modal
                         isOpen={isModalOpen}
                         onClose={() => setIsModalOpen(false)}
                         onSubmit={handleModalSubmit}
                         bannerToEdit={bannerToEdit}
                    />
               )}
          </div>
     );
};

export default Banners_Page;
