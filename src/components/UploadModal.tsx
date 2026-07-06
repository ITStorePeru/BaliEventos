import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  UploadCloud, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  Copy, 
  Check, 
  FileImage,
  RefreshCw
} from 'lucide-react';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  aspectRatioRef?: string;
  cloudinaryData: { cloudName: string; apiKey?: string; uploadPreset: string };
  onUploadSuccess: (url: string) => void;
}

export function UploadModal({
  isOpen,
  onClose,
  title,
  aspectRatioRef = "1200x800px",
  cloudinaryData,
  onUploadSuccess
}: UploadModalProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset state
  const resetUploadState = () => {
    setSelectedFile(null);
    setFilePreview(null);
    setStatus('idle');
    setErrorMessage(null);
    setUploadedUrl(null);
    setCopied(false);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setStatus('error');
      setErrorMessage("El archivo seleccionado no es una imagen válida.");
      return;
    }
    
    // Limit to 10MB
    if (file.size > 10 * 1024 * 1024) {
      setStatus('error');
      setErrorMessage("La imagen supera el límite de tamaño permitido de 10MB.");
      return;
    }

    setSelectedFile(file);
    setStatus('idle');
    setErrorMessage(null);
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setFilePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const onButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    if (!cloudinaryData.cloudName || !cloudinaryData.uploadPreset) {
      setStatus('error');
      setErrorMessage("Por favor configure su Cloud Name y Upload Preset de Cloudinary en la pestaña 'Cloudinary' primero.");
      return;
    }

    setStatus('loading');
    setErrorMessage(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("upload_preset", cloudinaryData.uploadPreset);
      if (cloudinaryData.apiKey) {
        formData.append("api_key", cloudinaryData.apiKey);
      }

      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudinaryData.cloudName}/image/upload`, {
        method: "POST",
        body: formData
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error?.message || "Error al subir la imagen");
      }

      const uploadData = await res.json();
      if (uploadData.secure_url) {
        setUploadedUrl(uploadData.secure_url);
        onUploadSuccess(uploadData.secure_url);
        setStatus('success');
      } else {
        throw new Error("No se obtuvo la URL de la imagen de respuesta.");
      }
    } catch (err: any) {
      console.error("Cloudinary upload error:", err);
      setStatus('error');
      setErrorMessage(err.message || String(err));
    }
  };

  const copyToClipboard = () => {
    if (uploadedUrl) {
      navigator.clipboard.writeText(uploadedUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[100] p-4">
        {/* Overlay background closer */}
        <div className="absolute inset-0" onClick={() => { if (status !== 'loading') { resetUploadState(); onClose(); } }} />

        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: "spring", duration: 0.4 }}
          className="bg-[#121214] border border-white/10 rounded-3xl w-full max-w-lg overflow-hidden relative shadow-2xl z-[101]"
        >
          {/* Header */}
          <div className="p-6 border-b border-white/5 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider">{title}</h3>
              <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mt-0.5">Cargar imagen a Cloudinary</p>
            </div>
            {status !== 'loading' && (
              <button 
                onClick={() => { resetUploadState(); onClose(); }}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/60 hover:text-white transition-all cursor-pointer"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Body */}
          <div className="p-6 flex flex-col gap-6">
            {status === 'idle' && !selectedFile && (
              <div 
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={onButtonClick}
                className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center gap-4 transition-all cursor-pointer select-none group min-h-[220px] ${
                  dragActive 
                    ? "border-accent bg-accent/5 scale-[0.99]" 
                    : "border-white/10 bg-white/[0.02] hover:border-accent/40 hover:bg-white/[0.04]"
                }`}
              >
                <input 
                  ref={fileInputRef}
                  type="file" 
                  accept="image/*" 
                  onChange={handleFileChange}
                  className="hidden" 
                />
                
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-white/5 border border-white/10 text-white/40 group-hover:text-accent group-hover:border-accent/30 transition-all ${dragActive ? 'bg-accent/10 border-accent/30 text-accent' : ''}`}>
                  <UploadCloud size={24} className={dragActive ? "animate-bounce" : ""} />
                </div>

                <div className="flex flex-col gap-1">
                  <p className="text-xs font-bold text-white/80 group-hover:text-white transition-colors">
                    {dragActive ? "¡Suelta la imagen aquí!" : "Arrastra tu imagen aquí o haz clic para buscar"}
                  </p>
                  <p className="text-[10px] text-white/40 font-semibold">
                    Formatos soportados: JPG, PNG, GIF, WEBP (Máx. 10MB)
                  </p>
                </div>

                {aspectRatioRef && (
                  <span className="text-[9px] font-black tracking-widest text-accent uppercase px-2 py-0.5 bg-accent/10 border border-accent/20 rounded">
                    Dimensión: {aspectRatioRef}
                  </span>
                )}
              </div>
            )}

            {status === 'idle' && selectedFile && filePreview && (
              <div className="flex flex-col gap-4">
                <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black/40 border border-white/10 flex items-center justify-center">
                  <img 
                    src={filePreview} 
                    alt="Vista previa" 
                    className="max-w-full max-h-full object-contain"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                  <div className="absolute bottom-3 left-3 flex items-center gap-2 bg-black/60 backdrop-blur border border-white/10 px-3 py-1.5 rounded-xl">
                    <FileImage size={12} className="text-accent" />
                    <div className="flex flex-col">
                      <span className="text-[10px] text-white font-bold truncate max-w-[200px]">{selectedFile.name}</span>
                      <span className="text-[8px] text-white/40 font-semibold">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={resetUploadState}
                    className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl py-3 px-4 text-xs font-bold text-white/80 transition-all cursor-pointer"
                  >
                    Elegir otra
                  </button>
                  <button
                    onClick={handleUpload}
                    className="flex-1 bg-accent hover:bg-accent/90 border border-accent/20 rounded-xl py-3 px-4 text-xs font-black text-black shadow-lg shadow-accent/20 transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    Iniciar Subida
                  </button>
                </div>
              </div>
            )}

            {status === 'loading' && (
              <div className="flex flex-col items-center justify-center py-10 gap-4 text-center">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full border-2 border-accent/10 flex items-center justify-center">
                    <Loader2 size={32} className="text-accent animate-spin" />
                  </div>
                  <div className="absolute inset-0 rounded-full bg-accent/5 animate-ping opacity-30" />
                </div>
                <div className="flex flex-col gap-1">
                  <p className="text-xs font-black text-white uppercase tracking-wider">Subiendo imagen</p>
                  <p className="text-[10px] text-white/40 font-semibold">Conectando con Cloudinary y procesando archivo...</p>
                </div>
              </div>
            )}

            {status === 'success' && uploadedUrl && (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col items-center justify-center text-center gap-2 py-2">
                  <div className="w-12 h-12 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-400">
                    <CheckCircle size={24} />
                  </div>
                  <h4 className="text-xs font-black text-green-400 uppercase tracking-wider">¡Subida Exitosa!</h4>
                  <p className="text-[10px] text-white/40 font-semibold">La imagen se ha guardado de forma segura en Cloudinary</p>
                </div>

                <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black/40 border border-white/10 flex items-center justify-center">
                  <img 
                    src={uploadedUrl} 
                    alt="Imagen Subida" 
                    className="max-w-full max-h-full object-contain"
                    referrerPolicy="no-referrer"
                  />
                </div>

                <div className="flex gap-2 items-center bg-black/40 border border-white/5 rounded-xl p-2.5">
                  <input 
                    type="text" 
                    readOnly 
                    value={uploadedUrl}
                    className="flex-1 bg-transparent text-[10px] text-white/60 font-mono outline-none px-2 select-all"
                  />
                  <button
                    onClick={copyToClipboard}
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white transition-all flex items-center justify-center cursor-pointer"
                    title="Copiar URL"
                  >
                    {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                  </button>
                </div>

                <button
                  onClick={() => { resetUploadState(); onClose(); }}
                  className="w-full bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl py-3 px-4 text-xs font-bold text-white transition-all cursor-pointer"
                >
                  Finalizar
                </button>
              </div>
            )}

            {status === 'error' && (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col items-center justify-center text-center gap-2 py-4">
                  <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
                    <AlertCircle size={24} />
                  </div>
                  <h4 className="text-xs font-black text-red-400 uppercase tracking-wider">Error de Subida</h4>
                  <p className="text-[10px] text-white/60 font-semibold max-w-sm">
                    {errorMessage || "Ha ocurrido un error inesperado al subir la imagen."}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={resetUploadState}
                    className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl py-3 px-4 text-xs font-bold text-white/80 transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <RefreshCw size={12} />
                    Intentar de nuevo
                  </button>
                  <button
                    onClick={() => { resetUploadState(); onClose(); }}
                    className="flex-1 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-xl py-3 px-4 text-xs font-bold text-red-400 transition-all cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
