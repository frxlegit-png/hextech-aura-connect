import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Upload, Trash2, Image, Plus, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SiteAsset {
  id: string;
  asset_key: string;
  asset_url: string;
  alt_text: string | null;
  asset_type: string;
}

const AssetsManager = () => {
  const [assets, setAssets] = useState<SiteAsset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    assetKey: '',
    altText: '',
    assetType: 'image' as string,
    file: null as File | null
  });

  useEffect(() => {
    fetchAssets();
  }, []);

  const fetchAssets = async () => {
    const { data, error } = await supabase
      .from('site_assets')
      .select('*')
      .order('asset_type', { ascending: true });

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      setAssets(data || []);
    }
    setIsLoading(false);
  };

  const handleUpload = async () => {
    if (!formData.file || !formData.assetKey) {
      toast({ title: 'Error', description: 'Please provide a file and asset key', variant: 'destructive' });
      return;
    }

    setUploading(true);

    try {
      const fileExt = formData.file.name.split('.').pop();
      const fileName = `${formData.assetKey}.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('site-assets')
        .upload(fileName, formData.file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('site-assets')
        .getPublicUrl(fileName);

      // Save to database
      const { error: dbError } = await supabase.from('site_assets').upsert({
        asset_key: formData.assetKey,
        asset_url: urlData.publicUrl,
        alt_text: formData.altText,
        asset_type: formData.assetType
      }, { onConflict: 'asset_key' });

      if (dbError) throw dbError;

      toast({ title: 'Success', description: 'Asset uploaded successfully' });
      setFormData({ assetKey: '', altText: '', assetType: 'image', file: null });
      setShowAddForm(false);
      fetchAssets();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (asset: SiteAsset) => {
    if (!confirm('Are you sure you want to delete this asset?')) return;

    try {
      // Delete from storage
      const fileName = asset.asset_url.split('/').pop();
      if (fileName) {
        await supabase.storage.from('site-assets').remove([fileName]);
      }

      // Delete from database
      const { error } = await supabase.from('site_assets').delete().eq('id', asset.id);
      if (error) throw error;

      toast({ title: 'Success', description: 'Asset deleted successfully' });
      fetchAssets();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Logos & Images</h2>
          <p className="text-muted-foreground">Upload and manage site assets</p>
        </div>
        <Button onClick={() => setShowAddForm(!showAddForm)} variant="hero">
          <Plus className="w-4 h-4 mr-2" />
          Upload Asset
        </Button>
      </div>

      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card className="border-primary/50">
              <CardHeader>
                <CardTitle className="text-lg">Upload New Asset</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Asset Key (unique identifier)</Label>
                    <Input
                      placeholder="e.g., main-logo, hero-background"
                      value={formData.assetKey}
                      onChange={(e) => setFormData({ ...formData, assetKey: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Asset Type</Label>
                    <Select
                      value={formData.assetType}
                      onValueChange={(value) => setFormData({ ...formData, assetType: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="logo">Logo</SelectItem>
                        <SelectItem value="image">Image</SelectItem>
                        <SelectItem value="icon">Icon</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Alt Text</Label>
                    <Input
                      placeholder="Image description for accessibility"
                      value={formData.altText}
                      onChange={(e) => setFormData({ ...formData, altText: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>File</Label>
                    <Input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      onChange={(e) => setFormData({ ...formData, file: e.target.files?.[0] || null })}
                    />
                  </div>
                </div>
                <div className="flex gap-2 pt-4">
                  <Button onClick={handleUpload} variant="hero" disabled={uploading}>
                    <Upload className="w-4 h-4 mr-2" />
                    {uploading ? 'Uploading...' : 'Upload'}
                  </Button>
                  <Button onClick={() => setShowAddForm(false)} variant="outline">
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {assets.map((asset) => (
          <motion.div
            key={asset.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="overflow-hidden hover:border-primary/30 transition-colors">
              <div className="aspect-video bg-secondary/50 flex items-center justify-center overflow-hidden">
                <img
                  src={asset.asset_url}
                  alt={asset.alt_text || asset.asset_key}
                  className="w-full h-full object-contain p-4"
                />
              </div>
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-foreground">{asset.asset_key}</p>
                    <p className="text-xs text-muted-foreground capitalize">{asset.asset_type}</p>
                  </div>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(asset)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}

        {assets.length === 0 && (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            <Image className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No assets uploaded yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AssetsManager;
