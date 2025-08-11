import { useState, useEffect, useCallback, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Lily from "../assets/testimonials/Lily.png";
import Fam from "../assets/testimonials/Fam.png";

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

const AUTOPLAY_INTERVAL = 3500;

export const Testimonials = () => {
  // Start at index 2 because we add two clones to the left
  const [currentIndex, setCurrentIndex] = useState(2);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [transition, setTransition] = useState(true);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const clearLoopTimeout = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

//   const performLoopReset = (target: number) => {
//     timeoutRef.current = setTimeout(() => {
//       setTransition(false); // jump without animation
//       setCurrentIndex(target);
//     }, 700); // match your slide duration
//   };

  const handleTransition = (newIndex: number) => {
    setTransition(true);
    setCurrentIndex(newIndex);
    clearLoopTimeout();

    // // Wrap right (stepped onto clone of first)
    // if (newIndex === rightWrapIndex) {
    //   performLoopReset(realStartIndex);
    //   return;
    // }
    // // Wrap left (stepped onto clone of last)
    // if (newIndex === leftWrapIndex) {
    //   performLoopReset(lastRealExtendedIndex);
    //   return;
    // }
  };
    const handleContainerTransitionEnd = () => {
    // We just finished sliding onto a clone; instantly jump without animation
    if (currentIndex === rightWrapIndex) {
      setTransition(false);
      setCurrentIndex(realStartIndex);
    } else if (currentIndex === leftWrapIndex) {
      setTransition(false);
      setCurrentIndex(lastRealExtendedIndex);
    }
  };

  const goToNext = useCallback(() => {
    handleTransition(currentIndex + 1);
  }, [currentIndex]);

  const goToPrevious = useCallback(() => {
    handleTransition(currentIndex - 1);
  }, [currentIndex]);

  const goToSlide = useCallback((index: number) => {
    // index is real (0-based). Map to extended by +2
    setTransition(true);
    setCurrentIndex(index + realStartIndex);
  }, []);

  // Re-enable transitions AFTER an instant jump (next frame)
  useEffect(() => {
    if (!transition) {
      const id = requestAnimationFrame(() => {
        // Ensure we only re-enable when sitting on a real slide
        if (
          currentIndex !== rightWrapIndex &&
          currentIndex !== leftWrapIndex
        ) {
          setTransition(true);
        }
      });
      return () => cancelAnimationFrame(id);
    }
  }, [transition, currentIndex]);

  // Autoplay
  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(goToNext, AUTOPLAY_INTERVAL);
    return () => clearInterval(interval);
  }, [isAutoPlaying, goToNext]);

  // Cleanup
  useEffect(() => clearLoopTimeout, []);

  // Map extended index to real index
  const getRealIndex = () => {
    if (currentIndex === leftWrapIndex) return testimonials.length - 1;
    if (currentIndex === rightWrapIndex) return 0;
    return currentIndex - realStartIndex;
  };
  const realIndex = getRealIndex();

  return (
    <section
      className="w-full py-12 overflow-hidden"
      onMouseEnter={() => setIsAutoPlaying(false)}
      onMouseLeave={() => setIsAutoPlaying(true)}
      aria-label="Customer testimonials"
    >
      <div className="max-w-7xl mx-auto px-4">
        <div className="relative">
          <div className="relative h-80 mx-auto overflow-hidden">
            <div
              className={`flex items-center h-full ${
                transition
                  ? "transition-transform duration-700 ease-in-out"
                  : ""
              }`}
              style={{
                transform: `translateX(calc(-33.333% * ${currentIndex} + 33.333%))`,
              }}
              onTransitionEnd={handleContainerTransitionEnd}
            >
              {extendedTestimonials.map((testimonial, index) => {
                const distance = Math.abs(index - currentIndex);
                const isCenter = index === currentIndex;
                const isAdjacent = distance === 1;
                // Disable inner transitions while we are doing the instant jump
                const innerTransition =
                  transition ? "transition-all duration-700 ease-in-out" : "";
                return (
                  <div
                    key={`${testimonial.id}-${index}`}
                    className="w-1/3 flex-shrink-0 h-full px-4"
                  >
                    <div
                      className={`h-full flex items-center justify-center ${innerTransition}`}
                      style={{
                        transform: `scale(${isCenter ? 1 : 0.75})`,
                        opacity: isCenter ? 1 : isAdjacent ? 0.5 : 0.3,
                      }}
                    >
                      <img
                        src={testimonial.image}
                        alt={testimonial.alt}
                        className="h-full w-auto object-contain"
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
                  ? "w-8 h-2 bg-blue-600 rounded-full"
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
