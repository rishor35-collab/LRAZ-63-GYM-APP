import React from 'react';
import { Dumbbell } from 'lucide-react';
import { Image } from '@/components/ui/image';
import { getExerciseImage, getUserExercisePhoto } from '@/lib/exerciseImages';
import { cn } from '@/lib/utils';

// Clean hero image for an exercise. Uses an existing photo when available,
// otherwise an elegant placeholder — never an incorrect image.
export default function ExerciseHeroImage({ exercise, className }) {
  if (!exercise) return null;
  const userPhoto = getUserExercisePhoto(exercise.slug);
  const src = userPhoto || getExerciseImage(exercise.name, exercise.muscle_group);

  return (
    <div className={cn('relative w-full overflow-hidden rounded-2xl border border-border/40 bg-muted', className)}>
      {src ? (
        <Image src={src} alt={exercise.name} fittingType="fill" className="h-full w-full" />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-2.5 py-10">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <Dumbbell size={26} className="text-primary/70" />
          </div>
          <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">No photo available</span>
        </div>
      )}
    </div>
  );
}