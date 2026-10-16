import React from 'react';
import { cn } from '@/lib/utils';
import getAnatomyMuscles from '@/components/exercises/anatomyMuscles';
import { Image } from '@/components/ui/image';

const ANATOMY_IMAGES = {
  front: 'https://base44.app/api/apps/6a7af27a605035ae79f8800a/files/mp/public/6a7af27a605035ae79f8800a/676c14226_natural-anatomy-front-transparent.png',
  back: 'https://base44.app/api/apps/6a7af27a605035ae79f8800a/files/mp/public/6a7af27a605035ae79f8800a/5d72deca1_natural-anatomy-back-transparent.png',
};

// Natural anatomical cutouts with real PNG transparency and gold highlights.
// Upper-body proportions match the reference; no image backdrop or frame.
export default function AnatomyFigure({ primaryMuscle, secondaryMuscles = [], className }) {
  const { view } = getAnatomyMuscles(primaryMuscle, secondaryMuscles);
  const src = ANATOMY_IMAGES[view] || ANATOMY_IMAGES.front;
  return (
    <div className={cn('relative mx-auto aspect-[4/5] w-full max-w-[128px] select-none', className)}>
      <Image
        src={src}
        alt={view === 'back' ? 'Anatomy — back view' : 'Anatomy — front view'}
        fittingType="fit"
        className="h-full w-full object-contain"
      />
    </div>
  );
}