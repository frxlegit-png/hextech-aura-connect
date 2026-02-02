import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Save, FileText } from 'lucide-react';
import { motion } from 'framer-motion';

interface SiteContent {
  id: string;
  section_key: string;
  title: string | null;
  subtitle: string | null;
  description: string | null;
}

const ContentManager = () => {
  const [content, setContent] = useState<SiteContent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editedContent, setEditedContent] = useState<Record<string, SiteContent>>({});
  const { toast } = useToast();

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    const { data, error } = await supabase
      .from('site_content')
      .select('*')
      .order('section_key');

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      setContent(data || []);
      const edited: Record<string, SiteContent> = {};
      data?.forEach(item => {
        edited[item.id] = item;
      });
      setEditedContent(edited);
    }
    setIsLoading(false);
  };

  const handleSave = async (item: SiteContent) => {
    const { error } = await supabase
      .from('site_content')
      .update({
        title: item.title,
        subtitle: item.subtitle,
        description: item.description
      })
      .eq('id', item.id);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: `${item.section_key} section updated` });
      fetchContent();
    }
  };

  const updateField = (id: string, field: keyof SiteContent, value: string) => {
    setEditedContent(prev => ({
      ...prev,
      [id]: { ...prev[id], [field]: value }
    }));
  };

  const getSectionLabel = (key: string) => {
    const labels: Record<string, string> = {
      hero: 'Hero Section',
      about: 'About Section',
      contact: 'Contact Section',
      services: 'Services Section',
      coverage: 'Coverage Section'
    };
    return labels[key] || key.charAt(0).toUpperCase() + key.slice(1);
  };

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Site Content</h2>
        <p className="text-muted-foreground">Edit text content across the website</p>
      </div>

      <div className="grid gap-6">
        {content.map((item) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  {getSectionLabel(item.section_key)}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    value={editedContent[item.id]?.title || ''}
                    onChange={(e) => updateField(item.id, 'title', e.target.value)}
                    placeholder="Section title..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Subtitle</Label>
                  <Input
                    value={editedContent[item.id]?.subtitle || ''}
                    onChange={(e) => updateField(item.id, 'subtitle', e.target.value)}
                    placeholder="Section subtitle..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={editedContent[item.id]?.description || ''}
                    onChange={(e) => updateField(item.id, 'description', e.target.value)}
                    placeholder="Section description..."
                    rows={4}
                  />
                </div>
                <Button
                  onClick={() => handleSave(editedContent[item.id])}
                  variant="hero"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default ContentManager;
