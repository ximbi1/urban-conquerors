import { useEffect, useState } from 'react';
import { MapPin, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface GPSPermissionDialogProps {
  onPermissionGranted: () => Promise<boolean>;
  onPermissionDenied: () => void;
}

const GPSPermissionDialog = ({ onPermissionGranted, onPermissionDenied }: GPSPermissionDialogProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const hasAskedPermission = localStorage.getItem('urbanz-gps-permission-asked');
    if (!hasAskedPermission) {
      setIsVisible(true);
    } else {
      // Si ya se pidió permiso antes, intentar activar directamente
      onPermissionGranted();
    }
  }, [onPermissionGranted]);

  const handleAccept = async () => {
    setIsRequesting(true);
    setError(null);
    
    const granted = await onPermissionGranted();
    
    if (granted) {
      localStorage.setItem('urbanz-gps-permission-asked', 'true');
      setIsVisible(false);
    } else {
      setError('No se pudo obtener tu ubicación. Verifica los permisos del navegador.');
      setIsRequesting(false);
    }
  };

  const handleDeny = () => {
    localStorage.setItem('urbanz-gps-permission-asked', 'true');
    setIsVisible(false);
    onPermissionDenied();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-fade-in">
      <Card className="w-full max-w-md bg-gradient-to-br from-card to-card/80 border-2 border-primary/30 p-8 space-y-6 animate-scale-in shadow-2xl">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center animate-pulse">
            <MapPin className="w-10 h-10 text-primary" />
          </div>
        </div>

        {/* Content */}
        <div className="space-y-4 text-center">
          <h2 className="text-2xl font-display font-bold glow-primary">
            Activa tu ubicación
          </h2>
          <p className="text-muted-foreground text-base leading-relaxed">
            URBANZ necesita acceso a tu ubicación para mostrarte en el mapa y registrar tus carreras en tiempo real.
          </p>
          <div className="bg-primary/10 border border-primary/30 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-3 text-sm">
              <Navigation className="w-5 h-5 text-primary flex-shrink-0" />
              <p className="text-left">Ver tu posición actual en el mapa</p>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <MapPin className="w-5 h-5 text-primary flex-shrink-0" />
              <p className="text-left">Registrar tu recorrido mientras corres</p>
            </div>
          </div>
          
          {error && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3">
              <p className="text-destructive text-sm">{error}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Button
            onClick={handleAccept}
            disabled={isRequesting}
            className="w-full h-12 text-base gap-2"
          >
            <MapPin className="w-5 h-5" />
            {isRequesting ? 'Solicitando permisos...' : 'Activar ubicación'}
          </Button>
          <Button
            onClick={handleDeny}
            variant="ghost"
            className="w-full"
            disabled={isRequesting}
          >
            Ahora no
          </Button>
        </div>

        {/* Note */}
        <p className="text-xs text-muted-foreground text-center">
          Puedes cambiar esto más tarde en la configuración de tu navegador
        </p>
      </Card>
    </div>
  );
};

export default GPSPermissionDialog;
