import React from 'react';
import RecordEditor from '@/components/records/RecordEditor';
import { nutritionFields } from '@/lib/recordFields';

export default function EditNutritionLogSheet({ log, onClose, onSaved }) {
  return <RecordEditor entity="NutritionLog" record={log} fields={nutritionFields} title="Edit nutrition entry" onClose={onClose} onSaved={onSaved} />;
}