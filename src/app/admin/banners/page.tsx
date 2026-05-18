"use client";

import { useState, useEffect } from "react";
import { PlusCircle, Search, Image as ImageIcon, Trash2, Loader2, Link as LinkIcon, UploadCloud } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { compressImage } from "@/lib/image-utils";

interface Banner {
  id: string;
  title: string;
  image_url: string;
  link_url: string;
  status: string;
  created_at: string;
}

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState("");

  // Form State
  const [title, setTitle] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [status, setStatus] = useState("active");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBanners = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("banners").select("*").order("created_at", { ascending: false });
    if (!error && data) setBanners(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !imageFile) {
      setError("Title and Image File are required.");
      return;
    }
    setSaving(true);
    setError(null);

    // 1. Compress and Upload Image to Supabase Storage
    const compressedFile = await compressImage(imageFile, 1200, 0.8);
    const fileExt = compressedFile.name.split('.').pop() || 'jpg';
    const fileName = `${Date.now()}_${Math.random()}.${fileExt}`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('banners')
      .upload(fileName, compressedFile, { cacheControl: '3600', upsert: false });

    if (uploadError) {
      setError("Image upload failed! Ensure you have created a PUBLIC bucket named 'banners' in Supabase Storage. Error: " + uploadError.message);
      setSaving(false);
      return;
    }

    // 2. Get Public URL
    const { data: { publicUrl } } = supabase.storage.from('banners').getPublicUrl(fileName);

    // 3. Save to Database
    const { error: dbError } = await supabase.from("banners").insert([
      { title, image_url: publicUrl, link_url: linkUrl, status }
    ]);

    if (dbError) {
      setError(dbError.message);
      setSaving(false);
    } else {
      setIsModalOpen(false);
      setTitle(""); setImageFile(null); setPreviewUrl(""); setLinkUrl("");
      setSaving(false);
      fetchBanners();
    }
  };

  const handleDelete = async (id: string, imageUrl: string) => {
    if (!confirm("Are you sure you want to delete this banner?")) return;
    
    // Attempt to delete from storage as well
    try {
      const fileName = imageUrl.split('/').pop();
      if (fileName) {
        await supabase.storage.from('banners').remove([fileName]);
      }
    } catch (e) {}

    await supabase.from("banners").delete().eq("id", id);
    fetchBanners();
  };

  const filteredBanners = banners.filter(b => b.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
              <ImageIcon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            Homepage Banners
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage sliding banners shown on the user frontend. Recommended Size: <strong>1200 x 400 pixels</strong>.
          </p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-2.5 rounded-xl shadow-sm transition-colors"
        >
          <PlusCircle className="h-5 w-5" />
          Add New Banner
        </button>
      </div>

      {/* Modal for Adding Banner */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative overflow-hidden">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Add New Banner</h3>
            {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}
            
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1 text-gray-700 dark:text-gray-300">Banner Title</label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. SSC CGL Apply Now" className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" required />
              </div>
              
              <div>
                <label className="block text-sm font-semibold mb-1 text-gray-700 dark:text-gray-300">Upload Banner Image</label>
                <label className="flex flex-col items-center justify-center w-full aspect-[21/9] max-h-48 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl cursor-pointer bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors overflow-hidden">
                  {previewUrl ? (
                    <img src={previewUrl} alt="Preview" className="w-full h-full object-contain" />
                  ) : (
                    <div className="flex flex-col items-center justify-center pt-5 pb-6 text-gray-500">
                      <UploadCloud className="w-8 h-8 mb-2 text-gray-400" />
                      <p className="text-sm font-semibold">Click to upload image</p>
                      <p className="text-xs">PNG, JPG, WEBP (Max 2MB)</p>
                    </div>
                  )}
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                </label>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1 text-gray-700 dark:text-gray-300">Redirect Link (URL)</label>
                <input type="text" value={linkUrl} onChange={e => setLinkUrl(e.target.value)} placeholder="/job/ssc-cgl-2026" className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
                <p className="text-xs text-gray-500 mt-1">Jab user banner par click karega, to wo is link par jayega.</p>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1 text-gray-700 dark:text-gray-300">Status & Placement</label>
                <select value={status} onChange={e => setStatus(e.target.value)} className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none">
                  <option value="active">Active (Homepage Slider)</option>
                  <option value="mini_active">Global Mini Banner (Visible on all pages)</option>
                  <option value="hidden">Hidden</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">Cancel</button>
                <button type="submit" disabled={saving || !imageFile} className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Banner"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search banners by title..." className="w-full pl-11 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
        </div>
        
        {loading ? (
          <div className="py-20 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-indigo-500" /></div>
        ) : filteredBanners.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-gray-400">
            <ImageIcon className="h-12 w-12 mb-3 opacity-20" />
            <p className="font-medium text-gray-500">No banners found. Add one to get started!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
                <tr>
                  <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase">Banner Image</th>
                  <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase">Title & Link</th>
                  <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase">Status</th>
                  <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {filteredBanners.map((banner) => (
                  <tr key={banner.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                    <td className="px-5 py-4">
                      <div className="w-32 h-16 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                        <img src={banner.image_url} alt={banner.title} className="w-full h-full object-contain" />
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm font-bold text-gray-900 dark:text-white">{banner.title}</p>
                      {banner.link_url && (
                        <div className="flex items-center gap-1 mt-1 text-xs text-indigo-500">
                          <LinkIcon className="h-3 w-3" />
                          <span className="truncate max-w-[200px]">{banner.link_url}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-1 text-xs font-bold rounded-full capitalize ${
                        banner.status === 'active' 
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                          : banner.status === 'mini_active'
                          ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                          : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                      }`}>
                        {banner.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button onClick={() => handleDelete(banner.id, banner.image_url)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
