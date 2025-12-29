import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PublicHeaderSlider() {
    const [images, setImages] = useState<string[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHeaderImages = async () => {
            try {
                const res = await axios.get('http://localhost:8080/content/public/posts/HEADER');
                if (Array.isArray(res.data)) {
                    const imageUrls = res.data
                        .map((post: any) => post.data?.header)
                        .filter((url: any) => typeof url === 'string' && url.length > 0);
                    setImages(imageUrls);
                }
            } catch (error) {
                console.error("Failed to fetch header images", error);
            } finally {
                setLoading(false);
            }
        };
        fetchHeaderImages();
    }, []);

    const nextSlide = useCallback(() => {
        if (images.length === 0) return;
        setCurrentIndex((prev) => (prev + 1) % images.length);
    }, [images.length]);

    const prevSlide = useCallback(() => {
        if (images.length === 0) return;
        setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    }, [images.length]);

    // Auto-sliding every 5 seconds
    useEffect(() => {
        if (images.length <= 1) return;
        const interval = setInterval(nextSlide, 5000);
        return () => clearInterval(interval);
    }, [images.length, nextSlide]);

    if (loading) {
        return (
            <div className="w-full h-[300px] md:h-[500px] bg-slate-100 dark:bg-slate-900 animate-pulse flex items-center justify-center">
                <div className="text-slate-400 font-medium uppercase tracking-widest text-sm">Loading Highlights...</div>
            </div>
        );
    }

    if (images.length === 0) return null;

    return (
        <div className="relative w-full h-[300px] md:h-[500px] overflow-hidden bg-slate-900 group">
            {/* Slides */}
            {images.map((url, index) => (
                <div
                    key={index}
                    className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
                        }`}
                >
                    <img
                        src={url}
                        alt={`Slide ${index + 1}`}
                        className="w-full h-full object-cover select-none"
                    />
                    {/* Subtle Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 to-transparent" />
                </div>
            ))}

            {/* Navigation Buttons */}
            {images.length > 1 && (
                <>
                    <button
                        onClick={prevSlide}
                        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/20 hover:bg-amber-500 text-white transition-all duration-300 backdrop-blur-sm opacity-0 group-hover:opacity-100 translate-x-[-10px] group-hover:translate-x-0"
                    >
                        <ChevronLeft className="h-6 w-6" />
                    </button>
                    <button
                        onClick={nextSlide}
                        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/20 hover:bg-amber-500 text-white transition-all duration-300 backdrop-blur-sm opacity-0 group-hover:opacity-100 translate-x-[10px] group-hover:translate-x-0"
                    >
                        <ChevronRight className="h-6 w-6" />
                    </button>

                    {/* Indicators */}
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
                        {images.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => setCurrentIndex(index)}
                                className={`h-1.5 transition-all duration-500 rounded-full ${index === currentIndex ? 'w-8 bg-amber-500' : 'w-2 bg-white/40 hover:bg-white/60'
                                    }`}
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
