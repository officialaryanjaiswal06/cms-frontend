import React, { useState, useEffect } from 'react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { SchemaField } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import {
    Type,
    AlignLeft,
    Image as ImageIcon,
    CheckSquare,
    ToggleLeft,
    Calendar,
    Hash,
    Mail,
    Link as LinkIcon,
    GripVertical,
    Trash2,
    Settings,
    Plus,
    Loader2
} from 'lucide-react';
import axios from 'axios';
import { useAuth } from '@/contexts/AuthContext';
import { modulesApi } from '@/services/api';

// Field Types Definition
const FIELD_TYPES = [
    { type: 'text', label: 'Text Input', icon: Type },
    { type: 'textarea', label: 'Text Area', icon: AlignLeft },
    { type: 'rich-text', label: 'Rich Text', icon: AlignLeft },
    { type: 'number', label: 'Number', icon: Hash },
    { type: 'email', label: 'Email', icon: Mail },
    { type: 'url', label: 'URL', icon: LinkIcon },
    { type: 'date', label: 'Date', icon: Calendar },
    { type: 'checkbox', label: 'Checkbox', icon: CheckSquare },
    { type: 'toggle', label: 'Toggle', icon: ToggleLeft },
    { type: 'image', label: 'Image', icon: ImageIcon },
] as const;

// Sortable Item Component
function SortableItem({ field, onRemove, onSelect, isSelected }: {
    field: SchemaField;
    onRemove: (id: string) => void;
    onSelect: (field: SchemaField) => void;
    isSelected: boolean;
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: field.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`relative group mb-3 ${field.gridWidth === 2 ? 'col-span-2' : 'col-span-1'}`}
        >
            <Card
                className={`cursor-pointer transition-all border-2 ${isSelected ? 'border-primary' : 'border-transparent hover:border-muted'
                    }`}
                onClick={() => onSelect(field)}
            >
                <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div {...attributes} {...listeners} className="cursor-grab text-muted-foreground hover:text-foreground">
                            <GripVertical size={20} />
                        </div>
                        <div>
                            <div className="font-semibold text-sm">{field.label || 'Untitled Field'}</div>
                            <div className="text-xs text-muted-foreground flex gap-2">
                                <span className="bg-secondary px-1.5 py-0.5 rounded uppercase text-[10px]">{field.type}</span>
                                <span className="font-mono text-[10px]">{field.name}</span>
                                {field.required && <span className="text-destructive text-[10px]">Required</span>}
                            </div>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                            e.stopPropagation();
                            onRemove(field.id);
                        }}
                    >
                        <Trash2 size={16} />
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}

export default function SchemaBuilder() {
    const { token } = useAuth();
    const [schemaName, setSchemaName] = useState('');
    const [schemaType, setSchemaType] = useState('');
    const [availableModules, setAvailableModules] = useState<string[]>([]);
    const [loadingModules, setLoadingModules] = useState(false);

    const [fields, setFields] = useState<SchemaField[]>([]);
    const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);

    useEffect(() => {
        const fetchModules = async () => {
            setLoadingModules(true);
            try {
                const list = await modulesApi.getInternalList();
                setAvailableModules(list);
            } catch (error) {
                console.error("Failed to fetch available modules", error);
                toast.error("Failed to fetch module list. Using demo data.");
                setAvailableModules(["DEMO_ACADEMIC", "DEMO_BLOG"]); // Explicitly mark as demo
            } finally {
                setLoadingModules(false);
            }
        };
        fetchModules();
    }, []);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const selectedField = fields.find(f => f.id === selectedFieldId);

    // Add new field
    const addField = (type: SchemaField['type']) => {
        const newField: SchemaField = {
            id: `field_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            type,
            name: `field_${fields.length + 1}`,
            label: `New ${type.charAt(0).toUpperCase() + type.slice(1)}`,
            gridWidth: 2,
            required: false,
        };
        setFields([...fields, newField]);
        setSelectedFieldId(newField.id);
    };

    // Remove field
    const removeField = (id: string) => {
        setFields(fields.filter(f => f.id !== id));
        if (selectedFieldId === id) setSelectedFieldId(null);
    };

    // Update field
    const updateField = (id: string, updates: Partial<SchemaField>) => {
        setFields(fields.map(f => (f.id === id ? { ...f, ...updates } : f)));
    };

    // Handle Drag End
    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (active.id !== over?.id) {
            setFields((items) => {
                const oldIndex = items.findIndex((i) => i.id === active.id);
                const newIndex = items.findIndex((i) => i.id === over?.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    // Save Schema
    const handleSave = async () => {
        if (!schemaName.trim()) {
            toast.error('Please select a Module');
            return;
        }
        if (!schemaType.trim()) {
            toast.error('Please enter a Schema Type (Form Name)');
            return;
        }
        if (fields.length === 0) {
            toast.error('Please add at least one field');
            return;
        }

        const payload = {
            schemaName: schemaName,
            schemaType: schemaType.toUpperCase().replace(/\s+/g, '_'),
            structure: fields.map(({ id, ...rest }) => rest), // Remove internal DnD ID
        };

        try {
            console.log("Saving Schema Payload:", payload);

            try {
                const response = await axios.post('http://localhost:8080/content/schema', payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                toast.success("Schema saved successfully!");
            } catch (err: any) {
                console.error("Schema Save Error:", err);
                if (err.response) {
                    console.error("Response Data:", err.response.data);
                    console.error("Response Status:", err.response.status);
                    toast.error(`Backend Error (${err.response.status}): ${JSON.stringify(err.response.data)}`);
                } else {
                    toast.error(`Error: ${err.message}`);
                }
            }

        } catch (error) {
            console.error(error);
            toast.error('Failed to save schema');
        }
    };

    return (
        <div className="h-[calc(100vh-4rem)] flex flex-col md:flex-row gap-4 p-4 bg-muted/20">

            {/* LEFT SIDEBAR - TOOLBOX */}
            <Card className="w-full md:w-64 flex-shrink-0 flex flex-col items-stretch">
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Plus className="w-5 h-5" /> Toolbox
                    </CardTitle>
                </CardHeader>
                <Separator />
                <ScrollArea className="flex-1">
                    <div className="p-4 grid grid-cols-1 gap-2">
                        {FIELD_TYPES.map((item) => (
                            <Button
                                key={item.type}
                                variant="outline"
                                className="justify-start gap-3 h-auto py-3"
                                onClick={() => addField(item.type)}
                            >
                                <item.icon size={16} className="text-muted-foreground" />
                                <span>{item.label}</span>
                            </Button>
                        ))}
                    </div>
                </ScrollArea>
            </Card>

            {/* CENTER - CANVAS */}
            <div className="flex-1 flex flex-col min-w-0">
                <Card className="h-full flex flex-col">
                    <CardHeader className="pb-4 border-b">
                        <div className="flex flex-col md:flex-row justify-between gap-4">
                            <div className="flex-1 flex gap-4">
                                <div className="flex-1">
                                    <Label className="mb-1.5 block">1. Select Module Name</Label>
                                    <Select value={schemaName} onValueChange={setSchemaName} disabled={loadingModules}>
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder={loadingModules ? "Loading modules..." : "Select a module"} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {availableModules.map((mod) => (
                                                <SelectItem key={mod} value={mod}>
                                                    {mod}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex-1">
                                    <Label className="mb-1.5 block">2. Schema Type (Form Name)</Label>
                                    <Input
                                        placeholder="e.g. EVENT, PROFILE"
                                        value={schemaType}
                                        onChange={(e) => setSchemaType(e.target.value)}
                                        className="font-mono uppercase"
                                    />
                                </div>
                            </div>
                            <div className="flex items-end">
                                <Button onClick={handleSave} className="w-full md:w-auto">Save Blueprint</Button>
                            </div>
                        </div>
                    </CardHeader>

                    <ScrollArea className="flex-1 bg-muted/10 p-4">
                        <div className="max-w-3xl mx-auto">
                            <DndContext
                                sensors={sensors}
                                collisionDetection={closestCenter}
                                onDragEnd={handleDragEnd}
                            >
                                <SortableContext
                                    items={fields.map(f => f.id)}
                                    strategy={verticalListSortingStrategy}
                                >
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {fields.length === 0 && (
                                            <div className="col-span-2 text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                                                <div className="flex flex-col items-center gap-2">
                                                    <Settings className="w-10 h-10 opacity-20" />
                                                    {schemaName ? (
                                                        <p>Start building the schema for <strong>{schemaName}</strong></p>
                                                    ) : (
                                                        <p>Select a module above to start</p>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                        {fields.map((field) => (
                                            <SortableItem
                                                key={field.id}
                                                field={field}
                                                onRemove={removeField}
                                                onSelect={() => setSelectedFieldId(field.id)}
                                                isSelected={selectedFieldId === field.id}
                                            />
                                        ))}
                                    </div>
                                </SortableContext>
                            </DndContext>
                        </div>
                    </ScrollArea>
                </Card>
            </div>

            {/* RIGHT SIDEBAR - PROPERTIES */}
            <Card className="w-full md:w-80 flex-shrink-0">
                <CardHeader className="pb-3 border-b">
                    <CardTitle className="text-lg">Properties</CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                    {selectedField ? (
                        <>
                            <div className="space-y-2">
                                <Label>Label</Label>
                                <Input
                                    value={selectedField.label}
                                    onChange={(e) => updateField(selectedField.id, { label: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Field Name (DB Key)</Label>
                                <Input
                                    value={selectedField.name}
                                    onChange={(e) => updateField(selectedField.id, { name: e.target.value })}
                                    className="font-mono text-xs"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Layout Width</Label>
                                <Select
                                    value={selectedField.gridWidth.toString()}
                                    onValueChange={(val) => updateField(selectedField.id, { gridWidth: parseInt(val) as 1 | 2 })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="1">Half Width (50%)</SelectItem>
                                        <SelectItem value="2">Full Width (100%)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex items-center justify-between py-2 border rounded-md px-3">
                                <Label className="cursor-pointer" htmlFor="required-switch">Required</Label>
                                <Switch
                                    id="required-switch"
                                    checked={selectedField.required}
                                    onCheckedChange={(checked) => updateField(selectedField.id, { required: checked })}
                                />
                            </div>

                            {['text', 'textarea', 'rich-text'].includes(selectedField.type) && (
                                <div className="space-y-2">
                                    <Label>Placeholder</Label>
                                    <Input
                                        value={selectedField.placeholder || ''}
                                        onChange={(e) => updateField(selectedField.id, { placeholder: e.target.value })}
                                    />
                                </div>
                            )}

                            {/* Add more validation/options here if needed */}
                            <div className="pt-4 border-t">
                                <p className="text-xs text-muted-foreground">
                                    Type: <span className="uppercase font-semibold">{selectedField.type}</span>
                                </p>
                            </div>

                        </>
                    ) : (
                        <div className="text-center py-10 text-muted-foreground">
                            Select a field to edit its properties
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
