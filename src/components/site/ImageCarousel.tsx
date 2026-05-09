import { useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface ImageCarouselProps {
  images: string[];
  title: string;
}

export function ImageCarousel({ images, title }: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const navButtonClass =
    "h-11 w-11 rounded-full border border-white/25 bg-background/88 text-foreground shadow-xl backdrop-blur-md transition-all hover:scale-105 hover:bg-background dark:border-orange/45 dark:bg-[hsl(var(--background)/0.82)] dark:text-primary dark:shadow-[0_0_22px_hsl(var(--primary)/0.28)] dark:hover:border-orange dark:hover:text-orange";

  if (!images || images.length === 0) {
    return (
      <div className="aspect-[16/10] w-full rounded-2xl border border-border bg-muted flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <div className="text-lg font-medium">No images available</div>
          <div className="text-sm">Property images will be added soon</div>
        </div>
      </div>
    );
  }

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const goToImage = (index: number) => {
    setCurrentIndex(index);
  };

  return (
    <>
      {/* Main Carousel */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-muted">
        {images.length > 1 ? (
          <div className="relative bg-background/94 px-4 py-4 backdrop-blur-md dark:bg-[hsl(var(--background)/0.96)] sm:px-6">
            <div className="relative aspect-[16/10] overflow-hidden rounded-xl border border-border/70 bg-muted">
              <img
                src={images[currentIndex]}
                alt={`${title} - Image ${currentIndex + 1}`}
                className="h-full w-full object-cover cursor-pointer"
                onClick={() => setIsFullscreen(true)}
              />
              <div className="absolute bottom-4 right-4 z-10 rounded-full bg-black/72 px-3 py-1 text-sm font-medium text-white shadow-lg">
                {currentIndex + 1} / {images.length}
              </div>
            </div>

            <div className="pointer-events-none absolute inset-y-0 left-0 right-0 top-1/2 z-10 flex -translate-y-1/2 items-center justify-between px-1 sm:px-2">
              <Button
                variant="secondary"
                size="icon"
                type="button"
                className={`pointer-events-auto ${navButtonClass}`}
                onClick={prevImage}
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <Button
                variant="secondary"
                size="icon"
                type="button"
                className={`pointer-events-auto ${navButtonClass}`}
                onClick={nextImage}
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="relative aspect-[16/10]">
            <img
              src={images[currentIndex]}
              alt={`${title} - Image ${currentIndex + 1}`}
              className="h-full w-full object-cover cursor-pointer"
              onClick={() => setIsFullscreen(true)}
            />
          </div>
        )}

        {/* Thumbnail Strip */}
        {images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto border-t border-border/70 bg-background/92 p-4 backdrop-blur-md dark:bg-[hsl(var(--background)/0.94)]">
            {images.map((src, index) => (
              <button
                key={src}
                type="button"
                onClick={() => goToImage(index)}
                className={`h-16 w-24 shrink-0 overflow-hidden rounded-md border-2 transition-all ${
                  index === currentIndex
                    ? "border-orange ring-2 ring-primary/30 shadow-[0_0_18px_hsl(var(--primary)/0.24)]"
                    : "border-transparent opacity-75 hover:border-primary/40 hover:opacity-100"
                }`}
              >
                <img
                  src={src}
                  alt={`Thumbnail ${index + 1}`}
                  className="h-full w-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Fullscreen Modal */}
      <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
        <DialogContent className="max-w-7xl h-[90vh] p-0">
          <div className="relative h-full">
            <img
              src={images[currentIndex]}
              alt={`${title} - Image ${currentIndex + 1}`}
              className="h-full w-full object-contain"
            />

            {/* Close Button */}
            <Button
              variant="secondary"
              size="icon"
              type="button"
              className="absolute right-4 top-4 z-10 h-11 w-11 rounded-full border border-white/20 bg-black/58 text-white backdrop-blur-md hover:bg-black/76"
              onClick={() => setIsFullscreen(false)}
            >
              <X className="h-5 w-5" />
            </Button>

            {/* Navigation in Fullscreen */}
            {images.length > 1 && (
              <div className="pointer-events-none absolute inset-x-3 top-1/2 z-10 flex -translate-y-1/2 items-center justify-between sm:inset-x-4">
                <Button
                  variant="secondary"
                  size="icon"
                  type="button"
                  className="pointer-events-auto h-12 w-12 rounded-full border border-white/20 bg-black/58 text-white backdrop-blur-md hover:scale-105 hover:bg-black/76"
                  onClick={prevImage}
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
                <Button
                  variant="secondary"
                  size="icon"
                  type="button"
                  className="pointer-events-auto h-12 w-12 rounded-full border border-white/20 bg-black/58 text-white backdrop-blur-md hover:scale-105 hover:bg-black/76"
                  onClick={nextImage}
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
              </div>
            )}

            {/* Image Counter in Fullscreen */}
            <div className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2 rounded-full bg-black/72 px-4 py-2 text-sm font-medium text-white shadow-lg">
              {currentIndex + 1} of {images.length}
            </div>

            {/* Thumbnail Strip in Fullscreen */}
            {images.length > 1 && (
              <div className="absolute bottom-4 left-4 right-4 flex gap-2 overflow-x-auto rounded-lg border border-white/10 bg-black/56 p-2 backdrop-blur-md">
                {images.map((src, index) => (
                  <button
                    key={src}
                    type="button"
                    onClick={() => goToImage(index)}
                    className={`h-12 w-20 shrink-0 overflow-hidden rounded border-2 transition-all ${
                      index === currentIndex
                        ? "border-orange shadow-[0_0_18px_rgba(255,153,51,0.45)]"
                        : "border-transparent opacity-65 hover:border-white/35 hover:opacity-100"
                    }`}
                  >
                    <img
                      src={src}
                      alt={`Thumbnail ${index + 1}`}
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
