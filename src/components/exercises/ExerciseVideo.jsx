import React from 'react';
import { Image } from '@/components/ui/image';
import { getExerciseImage, getUserExercisePhoto } from '@/lib/exerciseImages';
import { Dumbbell, Camera, Loader2, ImageIcon } from 'lucide-react';

// Shows a demonstration photo for an exercise, inline (no links).
// `compact` renders a small thumbnail (for dense lists like program rows).
// `userPhoto` overrides the default image with a user-uploaded photo.
// `slug` auto-loads a user-uploaded photo from localStorage if userPhoto isn't passed.
// `onUpload` enables an upload button overlay.
// When no photo is available, shows a placeholder with an upload prompt.
export default function ExerciseVideo({ name, videoUrl, instructions, compact, muscleGroup, userPhoto, slug, onUpload, uploading }) {
  const resolvedUserPhoto = userPhoto || (slug ? getUserExercisePhoto(slug) : null);
  const url = resolvedUserPhoto || videoUrl || getExerciseImage(name, muscleGroup);

  if (compact) {
    return (
      <div className="h-9 w-9 rounded-lg overflow-hidden shrink-0 border border-border/50 bg-muted/30 flex items-center justify-center">
        {url ? (
          <Image src={url} alt={`${name} form demonstration`} className="block w-full h-full" fittingType="fill" />
        ) : (
          <Dumbbell size={16} className="text-muted-foreground" />
        )}
      </div>
    );
  }

  return (
    <div className="mb-3">
      <div className="rounded-xl overflow-hidden border border-border/50 bg-background/40">
        <div className="relative aspect-video w-full">
          {url ? (
            <Image src={url} alt={`${name} form demonstration`} className="block w-full h-full" fittingType="fill" />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-muted/20">
              <ImageIcon size={32} className="text-muted-foreground/50" />
              <p className="text-[11px] text-muted-foreground/70">No demonstration photo</p>
            </div>
          )}
          {onUpload && (
            <button
              onClick={onUpload}
              disabled={uploading}
              className="absolute bottom-2 right-2 glass-strong rounded-full p-2.5 tap-min flex items-center justify-center text-luxury-blue disabled:opacity-50"
              title="Upload your own demonstration photo"
            >
              {uploading ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}
            </button>
          )}
          {resolvedUserPhoto && (
            <span className="absolute top-2 left-2 text-[9px] font-medium px-2 py-0.5 rounded-full glass-strong text-luxury-blue">
              Your photo
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] text-muted-foreground">
          <Dumbbell size={11} className="text-luxury-blue" /> How to do {name}
        </div>
        {instructions && (
          <div className="px-3 pb-3 pt-1">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">How to perform</p>
            <p className="text-xs text-foreground/80 leading-relaxed">{instructions}</p>
          </div>
        )}
      </div>
    </div>
  );
}