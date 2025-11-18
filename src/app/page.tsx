"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { Image as ImageIcon, MapPin, Download, RotateCcw, ExternalLink, Info, Github } from "lucide-react";
import exifr from "exifr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type Metadata = { [key: string]: string | number | boolean };
type Leaflet = typeof import('leaflet');

export default function ExifScrubberPage() {
  const [file, setFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<Metadata | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [mapLoading, setMapLoading] = useState(false);

  const mapRef = useRef<ReturnType<Leaflet['map']> | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    return () => {
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, [imageUrl]);

  const initializeMap = useCallback(async () => {
    if (!metadata?.latitude || !metadata?.longitude || mapRef.current) {
      return;
    }

    setMapLoading(true);
    setShowMap(true);
    
    // Wait for the container to be visible in the DOM before initializing Leaflet
    await new Promise(resolve => setTimeout(resolve, 100));

    if (!mapContainerRef.current) {
      setMapLoading(false);
      return;
    }

    try {
      if (!document.querySelector('link[href*="leaflet"]')) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
      }

      const leaflet = await import("leaflet");
      const L = leaflet.default;

      delete (L.Icon.Default.prototype as { _getIconUrl?: string })._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const map = L.map(mapContainerRef.current).setView([
        Number(metadata.latitude),
        Number(metadata.longitude),
      ], 13);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);
      L.marker([Number(metadata.latitude), Number(metadata.longitude)]).addTo(map);
      mapRef.current = map;
      
      // Trigger a resize to ensure the map renders correctly
      setTimeout(() => {
        map.invalidateSize();
      }, 100);
    } catch (err) {
      console.error("Failed to load map:", err);
      setShowMap(false);
    } finally {
      setMapLoading(false);
    }
  }, [metadata]);

  const handleFile = useCallback(async (acceptedFile: File) => {
    setIsLoading(true);
    setFile(acceptedFile);
    setError(null);
    setMetadata(null);
    setShowMap(false);
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }
    if (imageUrl) {
      URL.revokeObjectURL(imageUrl);
    }
    const url = URL.createObjectURL(acceptedFile);
    setImageUrl(url);
    try {
      const exifData = await exifr.parse(acceptedFile);
      if (exifData) {
        setMetadata(exifData);
      } else {
        setError("No EXIF metadata found in this image.");
      }
    } catch (e) {
      setError("Could not read metadata. The file might be corrupted or in an unsupported format.");
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [imageUrl]);

  const handleScrubAndDownload = () => {
    if (!imageRef.current || !file) return;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    const img = imageRef.current.querySelector('img');
    if (!img) return;
    
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    ctx.drawImage(img, 0, 0);
    
    const mime = file.type === "image/png" ? "image/png" : "image/jpeg";
    const quality = mime === "image/jpeg" ? 0.9 : undefined;
    
    const link = document.createElement("a");
    link.download = `scrubbed_${file.name}`;
    link.href = canvas.toDataURL(mime, quality);
    link.click();
  };

  const resetState = () => {
    if (imageUrl) {
      URL.revokeObjectURL(imageUrl);
    }
    setFile(null);
    setImageUrl(null);
    setMetadata(null);
    setIsLoading(false);
    setError(null);
    setShowMap(false);
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles: File[]) => handleFile(acceptedFiles[0]),
    accept: { "image/jpeg": [], "image/png": [] },
    multiple: false,
  });

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-300 dark:from-slate-900 dark:to-slate-800 flex flex-col overflow-x-hidden">
        <header className="w-full py-8 bg-white/80 dark:bg-slate-900/80 shadow-md">
          <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between">
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">EXIF Scrubber</h1>
            <span className="mt-2 md:mt-0 text-slate-600 dark:text-slate-300 text-base">Privacy-first image metadata remover</span>
          </div>
        </header>
        <main className="flex-1 flex flex-col items-center justify-center px-4 py-8 overflow-x-hidden">
          <div className="w-full max-w-6xl mx-auto">
            {!file ? (
              <Card 
                {...getRootProps()}
                className={`transition-all duration-200 border-2 border-dashed rounded-2xl p-10 bg-white/80 dark:bg-slate-900/80 shadow-xl flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 focus:border-blue-500 outline-none ${isDragActive ? "border-blue-500 bg-blue-100 dark:bg-blue-900/40" : "border-slate-300 dark:border-slate-700"}`}
                tabIndex={0}
                aria-label="Upload image"
              >
                <input {...getInputProps()} />
                <ImageIcon className="w-16 h-16 text-blue-400 mb-4 animate-bounce" />
                <CardTitle className="text-lg text-slate-700 dark:text-slate-200 font-medium mb-2 text-center">
                  {isDragActive ? "Drop the image here ..." : "Drag & drop an image, or click to select"}
                </CardTitle>
                <CardContent className="text-sm text-slate-500 dark:text-slate-400 text-center">
                  JPG or PNG only. All processing happens in your browser. No files are uploaded.
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Image Preview & Actions */}
                <Card className="bg-white/90 dark:bg-slate-900/80 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 p-6 flex flex-col animate-fade-in">
                  <CardHeader className="text-center pb-2">
                    <CardTitle className="text-xl font-bold text-slate-800 dark:text-slate-100">Image Preview</CardTitle>
                  </CardHeader>
                  <CardContent className="w-full flex flex-col items-center justify-center flex-1 pt-2">
                    <div className="w-full flex justify-center items-center mb-4">
                      <div ref={imageRef} className="relative flex justify-center items-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={imageUrl!}
                          alt="Image preview"
                          className="rounded-lg max-h-72 object-contain border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 shadow-md"
                          style={{ maxHeight: '18rem', maxWidth: '100%' }}
                        />
                      </div>
                    </div>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          onClick={handleScrubAndDownload}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg flex items-center justify-center transition-all duration-200 shadow-md hover:shadow-lg hover:scale-[1.02]"
                          aria-label="Download scrubbed image"
                        >
                          <Download className="w-5 h-5 mr-2" />
                          Download scrubbed image
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Download the image with all metadata removed</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="secondary"
                          onClick={resetState}
                          className="mt-3 w-full text-slate-800 dark:text-slate-100 font-semibold py-2 px-4 rounded-lg flex items-center justify-center transition-all duration-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          <RotateCcw className="w-4 h-4 mr-2" />
                          Scan Another Image
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Reset and scan a new image</TooltipContent>
                    </Tooltip>
                  </CardContent>
                </Card>
                {/* Metadata & Map */}
                <Card className="bg-white/90 dark:bg-slate-900/80 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 p-6 flex flex-col animate-fade-in">
                  <CardHeader className="text-center pb-2">
                    <CardTitle className="text-xl font-bold text-slate-800 dark:text-slate-100">Image Metadata</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col gap-3 justify-center pt-2">
                    {isLoading ? (
                      <div className="flex flex-col items-center justify-center h-48">
                        <Skeleton className="w-12 h-12 rounded-full mb-2" />
                        <span className="text-slate-500 dark:text-slate-400">Extracting metadata...</span>
                      </div>
                    ) : error ? (
                      <Alert variant="destructive" className="mb-4">
                        <Info className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    ) : metadata ? (
                      <>
                        {metadata.latitude && metadata.longitude && (
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="text-base font-semibold flex items-center text-blue-600 dark:text-blue-300">
                                <MapPin className="w-5 h-5 mr-2" />GPS Location
                              </h3>
                              <a
                                href={`https://maps.google.com/?q=${metadata.latitude},${metadata.longitude}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline flex items-center gap-1 transition-colors"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                                <span>View on Google Maps</span>
                              </a>
                            </div>
                            {!showMap && !mapLoading ? (
                              <Button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  initializeMap();
                                }}
                                variant="outline"
                                className="w-full mb-4"
                                aria-label="Show location on map"
                              >
                                Show location on map
                              </Button>
                            ) : null}
                            {(showMap || mapLoading) && (
                              <div
                                ref={mapContainerRef}
                                id="map"
                                className="h-48 w-full rounded-lg border border-slate-200 dark:border-slate-700 mb-4 shadow relative"
                              >
                                {mapLoading && (
                                  <div className="absolute inset-0 flex items-center justify-center bg-slate-50 dark:bg-slate-800 rounded-lg">
                                    <div className="text-slate-500 dark:text-slate-400 text-sm">Loading map...</div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                        <div className="overflow-y-auto overflow-x-auto max-h-64 custom-scrollbar min-w-0">
                          <table className="w-full text-sm border-separate border-spacing-y-1.5 table-fixed min-w-full">
                            <tbody>
                              {Object.entries(metadata).map(([key, value], idx) => (
                                <tr
                                  key={key}
                                  className={`transition-colors ${
                                    idx % 2 === 0
                                      ? "bg-slate-50 dark:bg-slate-800/60"
                                      : "bg-white dark:bg-slate-900/40"
                                  }`}
                                >
                                  <td className="py-2.5 px-3 font-medium text-slate-600 dark:text-slate-300 capitalize w-1/3 rounded-l-md break-words overflow-wrap-anywhere min-w-0">
                                    {key}
                                  </td>
                                  <td className="py-2.5 px-3 text-slate-800 dark:text-slate-100 break-words w-2/3 rounded-r-md overflow-wrap-anywhere min-w-0">
                                    {String(value)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </>
                    ) : (
                      <div className="text-slate-500 dark:text-slate-400">No metadata found.</div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </main>
        <footer className="w-full py-6 bg-white/80 dark:bg-slate-900/80 shadow-inner mt-8">
          <div className="container mx-auto px-4 text-center text-slate-500 dark:text-slate-400 text-sm flex flex-col items-center gap-3">
            <span>All processing is done 100% in your browser. Your images are never uploaded.</span>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 text-xs text-slate-400 dark:text-slate-500">
              <a 
                href="https://github.com/Yashman-Singh" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="inline-flex items-center gap-1.5 hover:text-blue-600 dark:hover:text-blue-400 hover:underline transition-colors"
              >
                <Github className="w-3.5 h-3.5" />
                <span>github.com/Yashman-Singh</span>
              </a>
              <span className="hidden sm:inline">•</span>
              <span className="inline-flex items-center gap-2">
                <span>Made with</span>
                <a href="https://nextjs.org/" target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 dark:hover:text-blue-400 hover:underline transition-colors">Next.js</a>,
                <a href="https://tailwindcss.com/" target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 dark:hover:text-blue-400 hover:underline transition-colors">Tailwind CSS</a>,
                <a href="https://ui.shadcn.com/" target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 dark:hover:text-blue-400 hover:underline transition-colors">shadcn/ui</a>
              </span>
            </div>
          </div>
        </footer>
      </div>
    </TooltipProvider>
  );
}
