import { useState, useEffect, useCallback, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Lily from "../assets/testimonials/Lily.png";
import Fam from "../assets/testimonials/Fam.png";
import { ANIMATION_CONSTANTS } from "../utils/constants"

interface Testimonial {
  id: string;
  image: string;
  text: string;
  alt: string;
}

const testimonials: Testimonial[] = [
  {
    id: "lily",
    image: Lily,
    text: "This app made sharing my ideas so easy! — Lily",
    alt: "Lily's testimonial photo",
  },
  {
    id: "lily2",
    image: Lily,
    text: "This app made sharing my ideas so easy! — Lily2",
    alt: "Lily's testimonial photo",
  },
  {
    id: "lily3",
    image: Lily,
    text: "This app made sharing my ideas so easy! — Lily3",
    alt: "Lily's testimonial photo",
  },
  {
    id: "lily4",
    image: Lily,
    text: "This app made sharing my ideas so easy! — Lily4",
    alt: "Lily's testimonial photo",
  },
  {
    id: "family",
    image: Fam,
    text: "Yummy boba! — Faith, Jewel, and Keanu",
    alt: "Family testimonial photo",
  },
];

const AUTOPLAY_INTERVAL = ANIMATION_CONSTANTS.TESTIMONIALS_AUTOPLAY_INTERVAL;

export const Testimonials = () => {
  // Start at index 2 because we add two clones to the left
  const [currentIndex, setCurrentIndex] = useState(2);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [transition, setTransition] = useState(true);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isAnimatingRef = useRef(false);
  const [slidesPerView, setSlidesPerView] = useState(3); // NEW

  // Clone two items on each side for seamless adjacency during wrap
  const getExtendedTestimonials = () => {
    if (testimonials.length === 0) return [];
    if (testimonials.length === 1) return [testimonials[0]];
    if (testimonials.length === 2) {
      // Edge case: just duplicate sequence
      return [
        testimonials[0],
        testimonials[1],
        ...testimonials,
        testimonials[0],
        testimonials[1],
      ];
    }
    return [
      testimonials[testimonials.length - 2],
      testimonials[testimonials.length - 1],
      ...testimonials,
      testimonials[0],
      testimonials[1],
    ];
  };

  const extendedTestimonials = getExtendedTestimonials();
  const lastRealExtendedIndex = testimonials.length + 1; // n+1
  const rightWrapIndex = testimonials.length + 2; // n+2 (clone of first)
  const leftWrapIndex = 1; // clone of last
  const realStartIndex = 2; // first real

  const handleTransition = useCallback((newIndex: number) => {
    // Prevent re-entry while current slide is animating
    if (isAnimatingRef.current) return;
    isAnimatingRef.current = true;
    setTransition(true);
    setCurrentIndex(newIndex);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const handleContainerTransitionEnd = useCallback(() => {
    // If we landed on a clone, jump instantly to the matching real slide (no animation)
    if (currentIndex === rightWrapIndex) {
      setTransition(false);
      setCurrentIndex(realStartIndex);
      isAnimatingRef.current = false; // release lock immediately (no second transition)
      return;
    } else if (currentIndex === leftWrapIndex) {
      setTransition(false);
      setCurrentIndex(lastRealExtendedIndex);
      isAnimatingRef.current = false;
      return;
    }
    // Normal slide finished
    isAnimatingRef.current = false;
  }, [
    currentIndex,
    rightWrapIndex,
    leftWrapIndex,
    realStartIndex,
    lastRealExtendedIndex,
  ]);

  const goToNext = useCallback(() => {
    handleTransition(currentIndex + 1);
  }, [currentIndex, handleTransition]);

  const goToPrevious = useCallback(() => {
    handleTransition(currentIndex - 1);
  }, [currentIndex, handleTransition]);

  const goToSlide = useCallback(
    (index: number) => {
      // Allow direct navigation even mid animation: first cancel any ongoing transition
      if (isAnimatingRef.current) {
        // Instant jump to normalized real index then start new transition next frame
        isAnimatingRef.current = false;
      }
      setTransition(true);
      setCurrentIndex(index + realStartIndex);
    },
    [realStartIndex]
  );

  // Re-enable transitions AFTER an instant jump (next frame)
  useEffect(() => {
    if (!transition) {
      const id = requestAnimationFrame(() => {
        // Ensure we only re-enable when sitting on a real slide
        if (currentIndex !== rightWrapIndex && currentIndex !== leftWrapIndex) {
          setTransition(true);
        }
      });
      return () => cancelAnimationFrame(id);
    }
  }, [transition, currentIndex, rightWrapIndex]);

  // Autoplay
  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(goToNext, AUTOPLAY_INTERVAL);
    return () => clearInterval(interval);
  }, [isAutoPlaying, goToNext]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, []);

  // Responsive slides per view (1 on small screens)
  useEffect(() => {
    const update = () => setSlidesPerView(window.innerWidth < 640 ? 1 : 3);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // Map extended index to real index
  const getRealIndex = () => {
    if (currentIndex === leftWrapIndex) return testimonials.length - 1;
    if (currentIndex === rightWrapIndex) return 0;
    return currentIndex - realStartIndex;
  };
  const realIndex = getRealIndex();

  return (
    <section
      className="w-full py-12 overflow-hidden border-y-2 border-gray-600"
      onMouseEnter={() => setIsAutoPlaying(false)}
      onMouseLeave={() => setIsAutoPlaying(true)}
      aria-label="Customer testimonials"
    >
      <div className="max-w-7xl mx-auto px-4">
        <div className="relative">
          {/* Responsive fixed height to prevent squashed images */}
          <div className="relative mx-auto overflow-hidden h-[260px] sm:h-[320px] md:h-[420px] lg:h-[480px]">
            <div
              className={`flex items-center h-full ${
                transition
                  ? "transition-transform duration-700 ease-in-out"
                  : ""
              }`}
              style={{
                transform:
                  slidesPerView === 1
                    ? `translateX(calc(-100% * ${currentIndex}))`
                    : `translateX(calc(-${
                        100 / slidesPerView
                      }% * ${currentIndex} + ${100 / slidesPerView}%))`,
              }}
              onTransitionEnd={handleContainerTransitionEnd}
            >
              {extendedTestimonials.map((testimonial, index) => {
                const distance = Math.abs(index - currentIndex);
                const isCenter = index === currentIndex;
                const isAdjacent = distance === 1;
                const innerTransition = transition
                  ? "transition-all duration-700 ease-in-out"
                  : "";
                const slideWidthClass =
                  slidesPerView === 1 ? "w-full" : "w-1/3";
                const scale = slidesPerView === 1 ? 1 : isCenter ? 1 : 0.75;
                const opacity =
                  slidesPerView === 1
                    ? isCenter
                      ? 1
                      : 0.6
                    : isCenter
                    ? 1
                    : isAdjacent
                    ? 0.5
                    : 0.3;

                return (
                  <div
                    key={`${testimonial.id}-${index}`}
                    className={`${slideWidthClass} flex-shrink-0 h-full px-4`}
                  >
                    <div
                      className={`h-full flex items-center justify-center ${innerTransition}`}
                      style={{
                        transform: `scale(${scale})`,
                        opacity,
                      }}
                    >
                      <img
                        src={testimonial.image}
                        alt={testimonial.alt}
                        className="max-h-full h-full w-auto object-contain"
                        draggable={false}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-2 bg-white/80 hover:bg-white rounded-full shadow-lg transition-all hover:scale-110 backdrop-blur-sm"
            aria-label="Previous testimonial"
          >
            <ChevronLeft className="w-5 h-5 text-gray-700" />
          </button>

          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-2 bg-white/80 hover:bg-white rounded-full shadow-lg transition-all hover:scale-110 backdrop-blur-sm"
            aria-label="Next testimonial"
          >
            <ChevronRight className="w-5 h-5 text-gray-700" />
          </button>
        </div>

        <div className="mt-8 min-h-[3rem] flex items-center justify-center">
          <blockquote className="text-center text-lg text-gray-700 font-medium max-w-2xl px-4 transition-all duration-500">
            {testimonials[realIndex]?.text}
          </blockquote>
        </div>

        <div className="flex justify-center items-center gap-2 mt-6">
          {testimonials.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`transition-all duration-300 ${
                index === realIndex
                  ? "w-8 h-2 bg-blue-500 rounded-full"
                  : "w-2 h-2 bg-gray-300 hover:bg-gray-400 rounded-full"
              }`}
              aria-label={`Go to testimonial ${index + 1}`}
              aria-current={index === realIndex}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
