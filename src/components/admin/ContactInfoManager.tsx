import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Json } from '@/integrations/supabase/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Save, Phone, Mail, MapPin, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

interface ContactInfo {
  phone: string;
  email: string;
  location: string;
  whatsappLabel: string;
  supportHours: {
    weekdays: string;
    saturday: string;
    sunday: string;
  };
}

const defaultContactInfo: ContactInfo = {
  phone: '+263 78 380 0102',
  email: 'info@hextech.co.zw',
  location: 'Harare, Zimbabwe',
  whatsappLabel: 'WhatsApp',
  supportHours: {
    weekdays: '8:00 AM - 8:00 PM',
    saturday: '9:00 AM - 5:00 PM',
    sunday: 'Closed'
  }
};

const ContactInfoManager = () => {
  const [contactInfo, setContactInfo] = useState<ContactInfo>(defaultContactInfo);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [contentId, setContentId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchContactInfo();
  }, []);

  const fetchContactInfo = async () => {
    const { data, error } = await supabase
      .from('site_content')
      .select('*')
      .eq('section_key', 'contact')
      .single();

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else if (data) {
      setContentId(data.id);
      const content = data.content as Record<string, unknown> | null;
      if (content && Object.keys(content).length > 0) {
        setContactInfo({
          phone: (content.phone as string) || defaultContactInfo.phone,
          email: (content.email as string) || defaultContactInfo.email,
          location: (content.location as string) || defaultContactInfo.location,
          whatsappLabel: (content.whatsappLabel as string) || defaultContactInfo.whatsappLabel,
          supportHours: {
            weekdays: (content.supportHours as any)?.weekdays || defaultContactInfo.supportHours.weekdays,
            saturday: (content.supportHours as any)?.saturday || defaultContactInfo.supportHours.saturday,
            sunday: (content.supportHours as any)?.sunday || defaultContactInfo.supportHours.sunday,
          }
        });
      }
    }
    setIsLoading(false);
  };

  const handleSave = async () => {
    if (!contentId) {
      toast({ title: 'Error', description: 'Contact section not found', variant: 'destructive' });
      return;
    }

    setIsSaving(true);

    const { error } = await supabase
      .from('site_content')
      .update({
        content: JSON.parse(JSON.stringify(contactInfo)) as Json
      })
      .eq('id', contentId);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Contact information updated successfully' });
    }
    setIsSaving(false);
  };

  const updateField = (field: keyof ContactInfo, value: string) => {
    setContactInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const updateHours = (day: keyof ContactInfo['supportHours'], value: string) => {
    setContactInfo(prev => ({
      ...prev,
      supportHours: {
        ...prev.supportHours,
        [day]: value
      }
    }));
  };

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Contact Information</h2>
        <p className="text-muted-foreground">Manage contact details displayed on the website</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Contact Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="w-5 h-5 text-primary" />
                Contact Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  Phone / WhatsApp Number
                </Label>
                <Input
                  value={contactInfo.phone}
                  onChange={(e) => updateField('phone', e.target.value)}
                  placeholder="+263 78 380 0102"
                />
              </div>
              <div className="space-y-2">
                <Label>Phone Label (e.g., WhatsApp, Call Us)</Label>
                <Input
                  value={contactInfo.whatsappLabel}
                  onChange={(e) => updateField('whatsappLabel', e.target.value)}
                  placeholder="WhatsApp"
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  Email Address
                </Label>
                <Input
                  value={contactInfo.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  placeholder="info@hextech.co.zw"
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  Location
                </Label>
                <Input
                  value={contactInfo.location}
                  onChange={(e) => updateField('location', e.target.value)}
                  placeholder="Harare, Zimbabwe"
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Support Hours */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                Support Hours
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Monday - Friday</Label>
                <Input
                  value={contactInfo.supportHours.weekdays}
                  onChange={(e) => updateHours('weekdays', e.target.value)}
                  placeholder="8:00 AM - 8:00 PM"
                />
              </div>
              <div className="space-y-2">
                <Label>Saturday</Label>
                <Input
                  value={contactInfo.supportHours.saturday}
                  onChange={(e) => updateHours('saturday', e.target.value)}
                  placeholder="9:00 AM - 5:00 PM"
                />
              </div>
              <div className="space-y-2">
                <Label>Sunday</Label>
                <Input
                  value={contactInfo.supportHours.sunday}
                  onChange={(e) => updateHours('sunday', e.target.value)}
                  placeholder="Closed"
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <Button onClick={handleSave} variant="hero" disabled={isSaving}>
        <Save className="w-4 h-4 mr-2" />
        {isSaving ? 'Saving...' : 'Save Contact Information'}
      </Button>
    </div>
  );
};

export default ContactInfoManager;
