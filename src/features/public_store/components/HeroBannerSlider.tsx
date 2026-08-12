import React, { useState, useEffect } from 'react';
import type { Banner } from '../types/banners.types';
import './HeroBannerSlider.scss';

interface HeroBannerSliderProps {
     banners: Banner[];
}

export const HeroBannerSlider: React.FC<HeroBannerSliderProps> = ({ banners }) => {
     const [activeIndex, setActiveIndex] = useState(0);

     useEffect(() => {
          if (banners.length <= 1) return;
          const interval = setInterval(() => {
               setActiveIndex((prev) => (prev + 1) % banners.length);
          }, 5000);
          return () => clearInterval(interval);
     }, [banners]);

     if (!banners || banners.length === 0) return null;

     return (
          <div className="store_banner_slider">
               {banners.map((banner, index) => (
                    <div 
                         key={banner.id}
                         className={`store_banner_slider__slide ${index === activeIndex ? 'store_banner_slider__slide--active' : ''}`}
                    >
                         <img 
                              src={banner.image_url} 
                              alt={banner.image_alt || banner.title || 'Storefront Promotional Banner'}
                              className="store_banner_slider__bg"
                         />
                         <div className="store_banner_slider__overlay" />
                         
                         <div className="store_banner_slider__content">
                              {banner.subtitle && (
                                   <div className="store_banner_slider__eyebrow">
                                        <div className="store_banner_slider__eyebrow_dot" />
                                        {banner.subtitle}
                                   </div>
                              )}
                              
                              {(banner.button_text || banner.link_url) && (
                                   <div className="store_banner_slider__actions">
                                        <a href={banner.link_url || '#'} className="store_banner_slider__btn store_banner_slider__btn--primary">
                                             {banner.button_text || 'Learn More'}
                                        </a>
                                   </div>
                              )}
                         </div>
                    </div>
               ))}

               {banners.length > 1 && (
                    <div className="store_banner_slider__dots">
                         {banners.map((_, index) => (
                              <button
                                   key={index}
                                   className={`store_banner_slider__dot ${index === activeIndex ? 'store_banner_slider__dot--active' : ''}`}
                                   onClick={() => setActiveIndex(index)}
                              />
                         ))}
                    </div>
               )}
          </div>
     );
};
