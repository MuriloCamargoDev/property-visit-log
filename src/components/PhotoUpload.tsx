import { useRef, useState } from "react";
import { Camera, ImagePlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PhotoUploadProps {
  photo: File | null;
  onPhotoChange: (file: File | null) => void;
}

const PhotoUpload = ({ photo, onPhotoChange }: PhotoUploadProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFile = (file: File | null) => {
    onPhotoChange(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    handleFile(file);
  };

  const removePhoto = () => {
    handleFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  };

  return (
    <div className="space-y-3">
      {preview ? (
        <div className="relative rounded-lg overflow-hidden border border-border animate-fade-in">
          <img src={preview} alt="Preview" className="w-full h-48 object-cover" />
          <button
            type="button"
            onClick={removePhoto}
            className="absolute top-2 right-2 bg-foreground/70 text-background rounded-full p-1.5 hover:bg-foreground/90 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            className="flex-1 h-20 flex-col gap-1 border-dashed"
            onClick={() => fileInputRef.current?.click()}
          >
            <ImagePlus className="w-5 h-5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Galeria</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            className="flex-1 h-20 flex-col gap-1 border-dashed"
            onClick={() => cameraInputRef.current?.click()}
          >
            <Camera className="w-5 h-5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Câmera</span>
          </Button>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleInputChange}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleInputChange}
      />
    </div>
  );
};

export default PhotoUpload;
