import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Edit2, Save, X, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CoverageArea {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radius: number;
  status: string;
}

const CoverageAreasManager = () => {
  const [areas, setAreas] = useState<CoverageArea[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    latitude: '',
    longitude: '',
    radius: '2000',
    status: 'active'
  });

  useEffect(() => {
    fetchAreas();
  }, []);

  const fetchAreas = async () => {
    const { data, error } = await supabase
      .from('coverage_areas')
      .select('*')
      .order('name');

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      setAreas(data || []);
    }
    setIsLoading(false);
  };

  const handleAdd = async () => {
    const { error } = await supabase.from('coverage_areas').insert({
      name: formData.name,
      latitude: parseFloat(formData.latitude),
      longitude: parseFloat(formData.longitude),
      radius: parseInt(formData.radius),
      status: formData.status
    });

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Coverage area added successfully' });
      setFormData({ name: '', latitude: '', longitude: '', radius: '2000', status: 'active' });
      setShowAddForm(false);
      fetchAreas();
    }
  };

  const handleUpdate = async (area: CoverageArea) => {
    const { error } = await supabase
      .from('coverage_areas')
      .update({
        name: area.name,
        latitude: area.latitude,
        longitude: area.longitude,
        radius: area.radius,
        status: area.status
      })
      .eq('id', area.id);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Coverage area updated successfully' });
      setEditingId(null);
      fetchAreas();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this coverage area?')) return;

    const { error } = await supabase.from('coverage_areas').delete().eq('id', id);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Coverage area deleted successfully' });
      fetchAreas();
    }
  };

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Coverage Areas</h2>
          <p className="text-muted-foreground">Manage network coverage zones on the map</p>
        </div>
        <Button onClick={() => setShowAddForm(!showAddForm)} variant="hero">
          <Plus className="w-4 h-4 mr-2" />
          Add Area
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
                <CardTitle className="text-lg">Add New Coverage Area</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Area Name</Label>
                    <Input
                      placeholder="e.g., Bulawayo CBD"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => setFormData({ ...formData, status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="expanding">Coming Soon</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Latitude</Label>
                    <Input
                      type="number"
                      step="any"
                      placeholder="-17.8292"
                      value={formData.latitude}
                      onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Longitude</Label>
                    <Input
                      type="number"
                      step="any"
                      placeholder="31.0522"
                      value={formData.longitude}
                      onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Radius (meters)</Label>
                    <Input
                      type="number"
                      placeholder="2000"
                      value={formData.radius}
                      onChange={(e) => setFormData({ ...formData, radius: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex gap-2 pt-4">
                  <Button onClick={handleAdd} variant="hero">
                    <Save className="w-4 h-4 mr-2" />
                    Save Area
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

      <div className="grid gap-4">
        {areas.map((area) => (
          <motion.div
            key={area.id}
            layout
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Card className="hover:border-primary/30 transition-colors">
              <CardContent className="py-4">
                {editingId === area.id ? (
                  <EditForm
                    area={area}
                    onSave={handleUpdate}
                    onCancel={() => setEditingId(null)}
                  />
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-3 h-3 rounded-full ${area.status === 'active' ? 'bg-green-500' : 'bg-yellow-500'}`} />
                      <div>
                        <h3 className="font-semibold text-foreground">{area.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {area.latitude.toFixed(4)}, {area.longitude.toFixed(4)} • {area.radius}m radius
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => setEditingId(area.id)}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(area.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

interface EditFormProps {
  area: CoverageArea;
  onSave: (area: CoverageArea) => void;
  onCancel: () => void;
}

const EditForm = ({ area, onSave, onCancel }: EditFormProps) => {
  const [editData, setEditData] = useState(area);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Name</Label>
          <Input
            value={editData.name}
            onChange={(e) => setEditData({ ...editData, name: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>Latitude</Label>
          <Input
            type="number"
            step="any"
            value={editData.latitude}
            onChange={(e) => setEditData({ ...editData, latitude: parseFloat(e.target.value) })}
          />
        </div>
        <div className="space-y-2">
          <Label>Longitude</Label>
          <Input
            type="number"
            step="any"
            value={editData.longitude}
            onChange={(e) => setEditData({ ...editData, longitude: parseFloat(e.target.value) })}
          />
        </div>
        <div className="space-y-2">
          <Label>Radius (m)</Label>
          <Input
            type="number"
            value={editData.radius}
            onChange={(e) => setEditData({ ...editData, radius: parseInt(e.target.value) })}
          />
        </div>
        <div className="space-y-2">
          <Label>Status</Label>
          <Select
            value={editData.status}
            onValueChange={(value) => setEditData({ ...editData, status: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="expanding">Coming Soon</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={() => onSave(editData)}>
          <Save className="w-4 h-4 mr-2" />
          Save
        </Button>
        <Button size="sm" variant="outline" onClick={onCancel}>
          <X className="w-4 h-4 mr-2" />
          Cancel
        </Button>
      </div>
    </div>
  );
};

export default CoverageAreasManager;
