"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { Loader2, Image as ImageIcon, MapPin, Download, RotateCcw, ExternalLink, Info } from "lucide-react";
import exifr from "exifr";
import "leaflet/dist/leaflet.css";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type Metadata = { [key: string]: string | number | boolean };

export default function ExifScrubberPage() {
  const [file, setFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<Metadata | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [L, setL] = useState<any>(null);
  const [mapReady, setMapReady] = useState(false);

  const mapRef = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    import("leaflet").then((leaflet) => {
      setL(leaflet.default);
    });
  }, []);

  // Clean up map on unmount
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Initialize map when metadata with GPS is available
  useEffect(() => {
    if (
      L &&
      metadata &&
      metadata.latitude &&
      metadata.longitude &&
      mapContainerRef.current &&
      !mapRef.current
    ) {
      // Set up Leaflet icon paths
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });
      // Initialize map
      const map = L.map(mapContainerRef.current).setView([
        Number(metadata.latitude),
        Number(metadata.longitude),
      ], 13);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);
      L.marker([Number(metadata.latitude), Number(metadata.longitude)]).addTo(map);
      mapRef.current = map;
      setMapReady(true);
    }
  }, [L, metadata]);

  const handleFile = useCallback(async (acceptedFile: File) => {
    setIsLoading(true);
    setFile(acceptedFile);
    setError(null);
    setMetadata(null);
    setMapReady(false);
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
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
  }, []);

  const handleScrubAndDownload = () => {
    if (!imageRef.current || !file) return;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = imageRef.current.naturalWidth;
    canvas.height = imageRef.current.naturalHeight;
    ctx.drawImage(imageRef.current, 0, 0);
    const link = document.createElement("a");
    link.download = `scrubbed_${file.name}`;
    link.href = canvas.toDataURL("image/jpeg", 0.9);
    link.click();
  };

  const resetState = () => {
    setFile(null);
    setImageUrl(null);
    setMetadata(null);
    setIsLoading(false);
    setError(null);
    setMapReady(false);
    if (imageUrl) URL.revokeObjectURL(imageUrl);
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
      <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-300 dark:from-slate-900 dark:to-slate-800 flex flex-col">
        <header className="w-full py-8 bg-white/80 dark:bg-slate-900/80 shadow-md">
          <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between">
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">EXIF Scrubber</h1>
            <span className="mt-2 md:mt-0 text-slate-600 dark:text-slate-300 text-base">Privacy-first image metadata remover</span>
          </div>
        </header>
        <main className="flex-1 flex flex-col items-center justify-center px-4 py-8">
          <div className="w-full max-w-4xl mx-auto">
            {!file ? (
              <Card className={`transition-all duration-200 border-2 border-dashed rounded-2xl p-10 bg-white/80 dark:bg-slate-900/80 shadow-xl flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 focus:border-blue-500 outline-none ${isDragActive ? "border-blue-500 bg-blue-100 dark:bg-blue-900/40" : "border-slate-300 dark:border-slate-700"}`}
                {...getRootProps()}
                tabIndex={0}
                aria-label="Upload image"
              >
                <input {...getInputProps()} />
                <ImageIcon className="w-16 h-16 text-blue-400 mb-4 animate-bounce" />
                <CardTitle className="text-lg text-slate-700 dark:text-slate-200 font-medium mb-2 text-center">
                  {isDragActive ? "Drop the image here ..." : "Drag & drop an image, or click to select"}
                </CardTitle>
                <CardContent className="text-sm text-slate-500 dark:text-slate-400 text-center">
                  JPG or PNG only. All processing is 100% in your browser.
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Image Preview & Actions */}
                <Card className="bg-white/90 dark:bg-slate-900/80 rounded-2xl shadow-lg p-6 flex flex-col items-center animate-fade-in">
                  <CardHeader>
                    <CardTitle className="text-xl font-bold text-slate-800 dark:text-slate-100 text-center">Image Preview</CardTitle>
                  </CardHeader>
                  <CardContent className="w-full flex flex-col items-center">
                    <div className="w-full flex justify-center mb-4">
                      <img
                        ref={imageRef}
                        src={imageUrl!}
                        alt="Image preview"
                        className="rounded-lg max-h-72 object-contain border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 shadow-md"
                      />
                    </div>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          onClick={handleScrubAndDownload}
                          className="mt-2 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg flex items-center justify-center transition-colors shadow-md"
                        >
                          <Download className="w-5 h-5 mr-2" />
                          Download Scrubbed Image
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Download the image with all metadata removed</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="secondary"
                          onClick={resetState}
                          className="mt-3 w-full text-slate-800 dark:text-slate-100 font-semibold py-2 px-4 rounded-lg flex items-center justify-center transition-colors"
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
                <Card className="bg-white/90 dark:bg-slate-900/80 rounded-2xl shadow-lg p-6 flex flex-col animate-fade-in">
                  <CardHeader>
                    <CardTitle className="text-xl font-bold text-slate-800 dark:text-slate-100">Image Metadata</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col gap-4">
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
                            <h3 className="text-base font-semibold flex items-center mb-2 text-blue-600 dark:text-blue-300">
                              <MapPin className="w-5 h-5 mr-2" />GPS Location
                              <a
                                href={`https://maps.google.com/?q=${metadata.latitude},${metadata.longitude}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="ml-2 text-blue-500 hover:underline flex items-center"
                              >
                                <ExternalLink className="w-4 h-4 inline-block mr-1" />
                                Google Maps
                              </a>
                            </h3>
                            <div
                              ref={mapContainerRef}
                              id="map"
                              className="h-48 w-full rounded-lg border border-slate-200 dark:border-slate-700 mb-4 shadow"
                            />
                          </div>
                        )}
                        <div className="overflow-y-auto max-h-64 pr-2">
                          <table className="w-full text-sm border-separate border-spacing-y-1">
                            <tbody>
                              {Object.entries(metadata).map(([key, value], idx) => (
                                <tr
                                  key={key}
                                  className={
                                    idx % 2 === 0
                                      ? "bg-slate-50 dark:bg-slate-800/60"
                                      : "bg-white dark:bg-slate-900/40"
                                  }
                                >
                                  <td className="py-2 px-2 font-medium text-slate-600 dark:text-slate-300 capitalize w-1/3">
                                    {key}
                                  </td>
                                  <td className="py-2 px-2 text-slate-800 dark:text-slate-100 break-words w-2/3">
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
          <div className="container mx-auto px-4 text-center text-slate-500 dark:text-slate-400 text-sm flex flex-col items-center gap-2">
            <span>All processing is done 100% in your browser. Your images are never uploaded.</span>
            <span className="inline-flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500 mt-2">
              <span>Made with</span>
              <a href="https://nextjs.org/" target="_blank" rel="noopener noreferrer" className="hover:underline">Next.js</a>,
              <a href="https://tailwindcss.com/" target="_blank" rel="noopener noreferrer" className="hover:underline">Tailwind CSS</a>,
              <a href="https://ui.shadcn.com/" target="_blank" rel="noopener noreferrer" className="hover:underline">shadcn/ui</a>
            </span>
          </div>
        </footer>
      </div>
    </TooltipProvider>
  );
}
