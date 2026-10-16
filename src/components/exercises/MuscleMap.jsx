import React from 'react';
import AnatomyFigure from '@/components/exercises/AnatomyFigure';

// Thin wrapper: renders the single generated anatomical body illustration
// with dynamic gold highlighting. Parent components handle muscle info cards.
export default function MuscleMap({ primaryMuscle, secondaryMuscles = [], className }) {
  return (
    <AnatomyFigure
      primaryMuscle={primaryMuscle}
      secondaryMuscles={secondaryMuscles}
      className={className}
    />
  );
}