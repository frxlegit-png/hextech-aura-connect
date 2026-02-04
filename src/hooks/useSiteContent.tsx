import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SiteContent {
  id: string;
  section_key: string;
  title: string | null;
  subtitle: string | null;
  description: string | null;
  content: unknown;
}

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

export const useSiteContent = () => {
  const [content, setContent] = useState<Record<string, SiteContent>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchContent = async () => {
      const { data, error } = await supabase
        .from('site_content')
        .select('*');

      if (!error && data) {
        const contentMap: Record<string, SiteContent> = {};
        data.forEach(item => {
          contentMap[item.section_key] = item;
        });
        setContent(contentMap);
      }
      setIsLoading(false);
    };

    fetchContent();
  }, []);

  const getSection = (key: string) => content[key];

  const getContactInfo = (): ContactInfo => {
    const contactData = content['contact']?.content;
    const contactContent = (typeof contactData === 'object' && contactData !== null && !Array.isArray(contactData)) 
      ? contactData as Record<string, unknown> 
      : null;
    if (!contactContent || Object.keys(contactContent).length === 0) {
      return defaultContactInfo;
    }
    
    return {
      phone: (contactContent.phone as string) || defaultContactInfo.phone,
      email: (contactContent.email as string) || defaultContactInfo.email,
      location: (contactContent.location as string) || defaultContactInfo.location,
      whatsappLabel: (contactContent.whatsappLabel as string) || defaultContactInfo.whatsappLabel,
      supportHours: {
        weekdays: (contactContent.supportHours as any)?.weekdays || defaultContactInfo.supportHours.weekdays,
        saturday: (contactContent.supportHours as any)?.saturday || defaultContactInfo.supportHours.saturday,
        sunday: (contactContent.supportHours as any)?.sunday || defaultContactInfo.supportHours.sunday,
      }
    };
  };

  return {
    content,
    isLoading,
    getSection,
    getContactInfo,
  };
};

export type { SiteContent, ContactInfo };
