import { useState } from 'react';
import { X, Share2, Download, Copy, Check } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Run } from '@/types/territory';
import { toast } from 'sonner';

interface ShareConquestProps {
  run: Run;
  onClose: () => void;
}

export const ShareConquest = ({ run, onClose }: ShareConquestProps) => {
  const [generating, setGenerating] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}min`;
    }
    return `${minutes}min`;
  };

  const generateShareText = () => {
    const totalTerritories = run.territoriesConquered + run.territoriesStolen;
    let text = `🏃‍♂️ ¡Nueva carrera en Urbanz!\n\n`;
    text += `📍 ${(run.distance / 1000).toFixed(2)} km\n`;
    text += `⏱️ ${formatDuration(run.duration)}\n`;
    text += `⚡ ${run.avgPace.toFixed(2)} min/km\n`;
    
    if (totalTerritories > 0) {
      text += `\n🗺️ ${totalTerritories} territorios conquistados`;
      if (run.territoriesStolen > 0) {
        text += ` (${run.territoriesStolen} robados! 🔥)`;
      }
    }
    
    text += `\n🏆 +${run.pointsGained} puntos\n\n`;
    text += `#Urbanz #Running #TerritoryConquest`;
    
    return text;
  };

  const generateImage = async () => {
    setGenerating(true);
    try {
      // Generar prompt para la imagen
      const prompt = `Create a modern, vibrant social media post image for a running app conquest. 
      
      Design requirements:
      - Dark gradient background (purple to blue)
      - Bold, modern typography
      - Include these stats prominently:
        * Distance: ${(run.distance / 1000).toFixed(2)} km
        * Time: ${formatDuration(run.duration)}
        * Pace: ${run.avgPace.toFixed(2)} min/km
        * Territories: ${run.territoriesConquered + run.territoriesStolen}
        * Points: +${run.pointsGained}
      - Running/map icons
      - "Urbanz" logo text at bottom
      - Trophy/achievement visual elements
      - Instagram/social media friendly aspect ratio (1080x1080)
      - Professional and energetic feel`;

      // Aquí usarías el AI Gateway de Lovable para generar la imagen
      // Por ahora, mostraremos un canvas generado localmente
      const canvas = document.createElement('canvas');
      canvas.width = 1080;
      canvas.height = 1080;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) throw new Error('No se pudo crear el canvas');

      // Fondo gradiente
      const gradient = ctx.createLinearGradient(0, 0, 0, 1080);
      gradient.addColorStop(0, '#8b5cf6');
      gradient.addColorStop(1, '#3b82f6');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 1080, 1080);

      // Título
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 72px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText('¡Nueva Conquista!', 540, 150);

      // Estadísticas
      ctx.font = 'bold 120px system-ui';
      ctx.fillText(`${(run.distance / 1000).toFixed(2)} km`, 540, 350);
      
      ctx.font = '48px system-ui';
      ctx.fillText(formatDuration(run.duration), 540, 450);
      ctx.fillText(`${run.avgPace.toFixed(2)} min/km`, 540, 520);

      // Territorios y puntos
      if (run.territoriesConquered + run.territoriesStolen > 0) {
        ctx.font = 'bold 64px system-ui';
        ctx.fillText(`🗺️ ${run.territoriesConquered + run.territoriesStolen} territorios`, 540, 650);
      }

      ctx.font = 'bold 80px system-ui';
      ctx.fillStyle = '#fbbf24';
      ctx.fillText(`🏆 +${run.pointsGained} puntos`, 540, 780);

      // Logo
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 48px system-ui';
      ctx.fillText('Urbanz', 540, 980);

      // Convertir a imagen
      const dataUrl = canvas.toDataURL('image/png');
      setImageUrl(dataUrl);
      toast.success('Imagen generada');
    } catch (error) {
      toast.error('Error al generar imagen');
      console.error(error);
    } finally {
      setGenerating(false);
    }
  };

  const downloadImage = () => {
    if (!imageUrl) return;
    
    const link = document.createElement('a');
    link.download = `urbanz-conquest-${Date.now()}.png`;
    link.href = imageUrl;
    link.click();
    toast.success('Imagen descargada');
  };

  const copyText = async () => {
    const text = generateShareText();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('Texto copiado al portapapeles');
    } catch (error) {
      toast.error('Error al copiar texto');
    }
  };

  const shareNative = async () => {
    const text = generateShareText();
    
    if (navigator.share) {
      try {
        if (imageUrl) {
          // Convertir data URL a blob
          const response = await fetch(imageUrl);
          const blob = await response.blob();
          const file = new File([blob], 'urbanz-conquest.png', { type: 'image/png' });
          
          await navigator.share({
            text,
            files: [file],
          });
        } else {
          await navigator.share({ text });
        }
        toast.success('Compartido exitosamente');
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          toast.error('Error al compartir');
        }
      }
    } else {
      copyText();
    }
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl bg-card border-glow p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-display font-bold glow-primary">
            Compartir Conquista
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Preview del texto */}
        <Card className="p-4 bg-muted/30 border-border">
          <pre className="whitespace-pre-wrap text-sm font-mono">
            {generateShareText()}
          </pre>
        </Card>

        {/* Imagen generada */}
        {imageUrl ? (
          <div className="space-y-3">
            <img 
              src={imageUrl} 
              alt="Conquista compartida" 
              className="w-full rounded-lg border border-border"
            />
            <div className="flex gap-2">
              <Button onClick={downloadImage} className="flex-1">
                <Download className="h-4 w-4 mr-2" />
                Descargar Imagen
              </Button>
            </div>
          </div>
        ) : (
          <Button 
            onClick={generateImage} 
            disabled={generating}
            className="w-full"
          >
            {generating ? 'Generando imagen...' : 'Generar Imagen para Compartir'}
          </Button>
        )}

        {/* Botones de compartir */}
        <div className="grid grid-cols-2 gap-3">
          <Button onClick={copyText} variant="outline">
            {copied ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                ¡Copiado!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 mr-2" />
                Copiar Texto
              </>
            )}
          </Button>
          
          <Button onClick={shareNative} variant="outline">
            <Share2 className="h-4 w-4 mr-2" />
            Compartir
          </Button>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          Comparte tu conquista en redes sociales para inspirar a otros corredores
        </p>
      </Card>
    </div>
  );
};
