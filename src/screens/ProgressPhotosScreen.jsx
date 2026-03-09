import { useState, useEffect, useCallback, useRef } from 'react';
import { usePlan } from '../context/UserPlanContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../utils/supabase';
import { getCurrentWeek } from '../utils/dateUtils';
import { resizeImage } from '../utils/image';
import BeforeAfterSlider from '../components/BeforeAfterSlider';

export default function ProgressPhotosScreen() {
  const plan = usePlan();
  const { user } = useAuth();
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedType, setSelectedType] = useState('front');
  const fileInputRef = useRef(null);
  const currentWeek = getCurrentWeek(new Date(), plan);

  const loadPhotos = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      const { data } = await supabase
        .from('progress_photos')
        .select('*')
        .eq('user_id', user.id)
        .order('week_number', { ascending: true });
      setPhotos(data || []);
    } catch (err) {
      console.warn('Failed to load photos:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadPhotos();
  }, [loadPhotos]);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);

    try {
      const { base64 } = await resizeImage(file, 1200);
      const blob = await fetch(`data:image/jpeg;base64,${base64}`).then(r => r.blob());
      const path = `${user.id}/${currentWeek}/${selectedType}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from('progress-photos')
        .upload(path, blob, { upsert: true, contentType: 'image/jpeg' });

      if (uploadError) throw uploadError;

      // Save record
      await supabase.from('progress_photos').upsert({
        user_id: user.id,
        week_number: currentWeek,
        photo_type: selectedType,
        storage_path: path,
      });

      await loadPhotos();
    } catch (err) {
      console.warn('Upload failed:', err);
    } finally {
      setUploading(false);
    }
  };

  const getPhotoUrl = (storagePath) => {
    const { data } = supabase.storage.from('progress-photos').getPublicUrl(storagePath);
    return data?.publicUrl;
  };

  const frontPhotos = photos.filter(p => p.photo_type === 'front');
  const hasWeek1 = frontPhotos.some(p => p.week_number === 1);
  const latestPhoto = frontPhotos[frontPhotos.length - 1];

  return (
    <div className="pb-4 animate-fade-in">
      <h2 className="text-lg font-bold mb-4">Progress Photos</h2>

      {/* Before/After hero */}
      {hasWeek1 && latestPhoto && latestPhoto.week_number > 1 && (
        <BeforeAfterSlider
          beforeUrl={getPhotoUrl(frontPhotos[0].storage_path)}
          afterUrl={getPhotoUrl(latestPhoto.storage_path)}
          beforeLabel={`Week 1`}
          afterLabel={`Week ${latestPhoto.week_number}`}
        />
      )}

      {/* Upload section */}
      <div className="bg-[#1a1a1a] rounded-xl p-4 mb-4">
        <h3 className="font-semibold text-sm mb-3">Week {currentWeek} Photo</h3>

        <div className="flex gap-2 mb-3">
          {['front', 'side'].map(type => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                selectedType === type
                  ? 'bg-blue-600 text-white'
                  : 'bg-[#111] text-gray-400'
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Current week photo for selected type */}
        {(() => {
          const existing = photos.find(p => p.week_number === currentWeek && p.photo_type === selectedType);
          if (existing) {
            return (
              <div className="relative mb-3">
                <img
                  src={getPhotoUrl(existing.storage_path)}
                  alt={`Week ${currentWeek} ${selectedType}`}
                  className="w-full h-64 object-cover rounded-xl"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-3 py-1.5 rounded-lg"
                >
                  Replace
                </button>
              </div>
            );
          }
          return (
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-full h-48 border-2 border-dashed border-[#333] rounded-xl flex flex-col items-center justify-center text-gray-500 active:border-blue-500 mb-3"
            >
              {uploading ? (
                <>
                  <div className="w-6 h-6 border-2 border-gray-600 border-t-white rounded-full animate-spin mb-2" />
                  <span className="text-sm">Uploading...</span>
                </>
              ) : (
                <>
                  <span className="text-3xl mb-1">{'\u{1F4F7}'}</span>
                  <span className="text-sm">Take your Week {currentWeek} {selectedType} photo</span>
                </>
              )}
            </button>
          );
        })()}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleUpload}
          className="hidden"
        />
      </div>

      {/* Photo gallery by week */}
      <h3 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wide">All Photos</h3>
      {photos.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 text-sm">No photos yet. Start with Week {currentWeek}!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {Array.from(new Set(photos.map(p => p.week_number)))
            .sort((a, b) => b - a)
            .map(weekNum => {
              const weekPhotos = photos.filter(p => p.week_number === weekNum);
              return (
                <div key={weekNum} className="bg-[#1a1a1a] rounded-xl p-3">
                  <p className="text-xs text-gray-500 mb-2 font-medium">Week {weekNum}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {weekPhotos.map(photo => (
                      <img
                        key={photo.id}
                        src={getPhotoUrl(photo.storage_path)}
                        alt={`Week ${weekNum} ${photo.photo_type}`}
                        className="w-full h-40 object-cover rounded-lg"
                      />
                    ))}
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}
