import { useState, useCallback } from 'react';
import { Upload, X, Star, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { compressImage } from '@/lib/compressImage';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { useTranslation } from 'react-i18next';
import {
  SortableContext,
  useSortable,
  horizontalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function SortableImage({ image, onRemove, onSetMain, isMain }) {
  const { t } = useTranslation();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: image.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative group aspect-[3/4] w-24 rounded-lg overflow-hidden border border-[var(--border)] bg-[var(--bg-secondary)] flex-shrink-0"
    >
      <img src={image.preview} alt="" className="w-full h-full object-cover" />

      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute top-1 left-1 p-0.5 rounded bg-black/40 text-white cursor-grab opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <GripVertical size={12} />
      </div>

      {/* Actions */}
      <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          type="button"
          onClick={() => onSetMain(image.id)}
          className={cn(
            'p-0.5 rounded text-white',
            isMain ? 'bg-[var(--accent)]' : 'bg-black/40 hover:bg-[var(--accent)]'
          )}
          title={t('imageUploader.setMain', { defaultValue: 'Set as main image' })}
        >
          <Star size={12} fill={isMain ? 'currentColor' : 'none'} />
        </button>
        <button
          type="button"
          onClick={() => onRemove(image.id)}
          className="p-0.5 rounded bg-black/40 hover:bg-red-600 text-white"
          title={t('common.remove', { defaultValue: 'Remove' })}
        >
          <X size={12} />
        </button>
      </div>

      {isMain && (
        <div className="absolute bottom-0 left-0 right-0 text-center text-[10px] bg-[var(--accent)] text-[var(--accent-foreground)] py-0.5">
          {t('imageUploader.main', { defaultValue: 'Main' })}
        </div>
      )}
    </div>
  );
}

/**
 * Props:
 *  images: [{ id, preview, file?, url?, publicId? }]
 *  onChange: (images) => void
 *  maxFiles: number
 */
export function ImageUploader({ images = [], onChange, maxFiles = 10 }) {
  const { t } = useTranslation();
  const [dragOver, setDragOver] = useState(false);
  const sensors = useSensors(useSensor(PointerSensor));

  const addFiles = useCallback(
    async (files) => {
      const remaining = maxFiles - images.length;
      const fileArray = Array.from(files)
        .slice(0, remaining)
        .filter((f) => f.type.startsWith('image/'));

      if (fileArray.length === 0) return;

      // Tüm dosyaları paralel olarak sıkıştır
      const compressed = await Promise.all(fileArray.map((f) => compressImage(f)));

      const toAdd = compressed.map((file, idx) => ({
        id: `${Date.now()}-${idx}-${Math.random()}`,
        file,
        preview: URL.createObjectURL(file),
        isMain: images.length === 0 && idx === 0,
      }));

      const updated = [...images, ...toAdd];
      if (!updated.some((i) => i.isMain)) updated[0].isMain = true;
      onChange(updated);
    },
    [images, maxFiles, onChange]
  );

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    addFiles(e.dataTransfer.files);
  }

  function handleFileInput(e) {
    addFiles(e.target.files);
    e.target.value = '';
  }

  function handleRemove(id) {
    const updated = images.filter((i) => i.id !== id);
    if (updated.length > 0 && !updated.some((i) => i.isMain)) updated[0].isMain = true;
    onChange(updated);
  }

  function handleSetMain(id) {
    onChange(images.map((i) => ({ ...i, isMain: i.id === id })));
  }

  function handleDragEnd(event) {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = images.findIndex((i) => i.id === active.id);
      const newIndex = images.findIndex((i) => i.id === over.id);
      onChange(arrayMove(images, oldIndex, newIndex));
    }
  }

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      {images.length < maxFiles && (
        <label
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={cn(
            'flex flex-col items-center justify-center gap-2 h-28 rounded-xl border-2 border-dashed cursor-pointer transition-colors',
            dragOver
              ? 'border-[var(--accent)] bg-[var(--accent)]/5'
              : 'border-[var(--border)] hover:border-[var(--accent)]/50 hover:bg-[var(--bg-secondary)]'
          )}
        >
          <Upload size={20} className="text-[var(--text-muted)]" />
          <div className="text-center">
            <p className="text-sm text-[var(--text-secondary)]">
              {t('imageUploader.uploadOrDrag', { defaultValue: 'Upload or drag and drop images' })}
            </p>
            <p className="text-xs text-[var(--text-muted)]">
              {images.length}/{maxFiles} · {t('imageUploader.fileTypes', { defaultValue: 'JPG, PNG, WEBP' })}
            </p>
          </div>
          <input
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            onChange={handleFileInput}
          />
        </label>
      )}

      {/* Sortable image list */}
      {images.length > 0 && (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={images.map((i) => i.id)} strategy={horizontalListSortingStrategy}>
            <div className="flex gap-2 flex-wrap">
              {images.map((img) => (
                <SortableImage
                  key={img.id}
                  image={img}
                  onRemove={handleRemove}
                  onSetMain={handleSetMain}
                  isMain={img.isMain}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}
