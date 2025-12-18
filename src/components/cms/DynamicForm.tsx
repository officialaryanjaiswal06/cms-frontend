import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import axios from 'axios';
import api from '@/services/api'; // Import the shared API instance
import { Loader2, Upload, CalendarIcon } from 'lucide-react';
import { format } from "date-fns"

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { PageSchema, SchemaField } from '@/types';
import { cn } from '@/lib/utils';

// Helper to generate Zod schema from JSON Schema
const generateZodSchema = (fields: SchemaField[]) => {
    const shape: any = {};

    fields.forEach((field) => {
        let validator: any;

        switch (field.type) {
            case 'text':
            case 'textarea':
            case 'rich-text':
            case 'email':
            case 'url':
                validator = z.string();
                if (field.validation?.minLength) validator = validator.min(field.validation.minLength, `${field.label} must be at least ${field.validation.minLength} chars`);
                if (field.validation?.maxLength) validator = validator.max(field.validation.maxLength, `${field.label} must be at most ${field.validation.maxLength} chars`);
                if (field.type === 'email') validator = validator.email("Invalid email address");
                if (field.type === 'url') validator = validator.url("Invalid URL");
                break;
            case 'number':
                validator = z.preprocess((val) => Number(val), z.number());
                if (field.validation?.min) validator = validator.min(field.validation.min);
                if (field.validation?.max) validator = validator.max(field.validation.max);
                break;
            case 'checkbox':
            case 'toggle':
                validator = z.boolean();
                break;
            case 'date':
                // Form stores date as YYYY-MM-DD string
                validator = z.string();
                break;
            case 'image':
                // For file upload, we handle it separately or use Zod to validate existence
                validator = z.any();
                break;
            default:
                validator = z.string();
        }

        if (!field.required && field.type !== 'image') { // Images handled separately often
            validator = validator.optional();
        } else if (field.required && field.type !== 'image') {
            // Only enforce non-empty for strings if required
            if (field.type === 'text' || field.type === 'textarea') validator = validator.min(1, `${field.label} is required`);
        }

        shape[field.name] = validator;
    });

    return z.object(shape);
};

interface DynamicFormProps {
    moduleName: string;
    schemaType?: string | null; // e.g. EVENT
    initialValues?: any;  // NEW: For Edit Mode
    editId?: string;      // NEW: For Edit Mode
}

export default function DynamicForm({ moduleName, schemaType, initialValues, editId }: DynamicFormProps) {
    const { token, roles, user } = useAuth(); // Deconstruct roles and user for debugging
    const [schema, setSchema] = useState<PageSchema | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    // const [file, setFile] = useState<File | null>(null); // Unused

    // We can't use useForm hook at top level with dynamic schema effectively without a wrapper or remounting
    // But we can reset it.
    const [formSchema, setFormSchema] = useState<z.ZodObject<any>>(z.object({}));

    const {
        register,
        handleSubmit,
        control,
        formState: { errors },
        reset,
        setValue,
        watch // exposing watch to debug if needed, though control._formValues access works but is internal
    } = useForm({
        resolver: zodResolver(formSchema),
        mode: 'onBlur'
    });

    // Fetch Schema
    useEffect(() => {
        const fetchSchema = async () => {
            setLoading(true);
            try {
                // Determine Endpoint URL
                // If schemaType is present: GET /content/schema/{moduleName}/{schemaType}
                // If not: (Legacy fallback) GET /content/schema/{moduleName}
                const url = schemaType
                    ? `http://localhost:8080/content/schema/${moduleName}/${schemaType}`
                    : `http://localhost:8080/content/schema/${moduleName}`;

                console.log(`Fetching schema from: ${url}`);

                const res = await axios.get(url, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const fetchedSchema: PageSchema = res.data;

                // Ensure structure exists to prevent crashes
                if (!fetchedSchema.structure) {
                    fetchedSchema.structure = [];
                }

                setSchema(fetchedSchema);
                setFormSchema(generateZodSchema(fetchedSchema.structure));

                // Set initial values (for Edit) or Defaults (for Create)
                console.log("DynamicForm initialValues:", initialValues); // Debug Log

                if (initialValues) {
                    console.log("Resetting form with initialValues");
                    reset(initialValues);
                } else {
                    const defaults: any = {};
                    fetchedSchema.structure.forEach(field => {
                        if (field.defaultValue !== undefined) defaults[field.name] = field.defaultValue;
                    });
                    reset(defaults);
                }

            } catch (error: any) {
                console.error("Failed to load schema", error);
                toast.error(`Failed to load form schema: ${error.response?.data?.message || error.message}`);
                // No mock fallback - we want to fail if backend is missing
            } finally {
                setLoading(false);
            }
        };

        if (moduleName) {
            fetchSchema();
        }
    }, [moduleName, schemaType, token, reset, initialValues]); // Added initialValues

    const [uploadingFields, setUploadingFields] = useState<Record<string, boolean>>({});

    // DEBUG: Log current user context when component mounts or updates
    useEffect(() => {
        console.log("DynamicForm Active User:", {
            username: user?.username,
            roles: roles,
            isAuthenticated: !!token
        });
    }, [user, roles, token]);

    // Image Upload Handler
    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Create FormData for upload
        const formData = new FormData();
        formData.append('file', file);

        setUploadingFields(prev => ({ ...prev, [fieldName]: true }));
        try {
            // Get token directly from localStorage to ensure it's fresh, 
            // fallback to context token if needed.
            const storedToken = localStorage.getItem('token') || token;

            console.log("Starting Upload...");
            if (!storedToken) {
                console.error("No token found!");
                toast.error("Authentication error: No token found");
                return;
            }

            console.log("Token (first 10 chars):", storedToken.substring(0, 10) + "...");
            console.log("File Details:", { name: file.name, type: file.type, size: file.size });

            // Upload to /content/upload (Correct Controller Endpoint)
            // We set Content-Type to undefined to force the browser to generate the multipart header with the correct boundary.
            const res = await axios.post('http://localhost:8080/content/upload', formData, {
                headers: {
                    Authorization: `Bearer ${storedToken}`,
                    'Content-Type': undefined
                }
            });

            // The backend returns the public URL string directly
            const imageUrl = res.data;
            console.log("Upload Success, URL:", imageUrl);

            // Set the URL string into the form field
            setValue(fieldName, imageUrl);
            toast.success("Image uploaded!");
        } catch (err: any) {
            console.error("Upload failed FULL ERROR:", err);
            if (err.response) {
                console.error("Error Status:", err.response.status);
                console.error("Error Data:", err.response.data);
                console.error("Error Headers:", err.response.headers);
            } else if (err.request) {
                console.error("No response received:", err.request);
            } else {
                console.error("Error setting up request:", err.message);
            }
            const msg = err.response?.data?.message || "Image upload failed";
            toast.error(msg);
        } finally {
            setUploadingFields(prev => ({ ...prev, [fieldName]: false }));
        }
    };

    const onSubmit = async (data: any) => {
        setSubmitting(true);
        try {

            let url;
            if (editId) {
                // EDIT MODE: PUT /content/post/entry/{id}
                url = `http://localhost:8080/content/post/entry/${editId}`;
            } else {
                // CREATE MODE
                url = schemaType
                    ? `http://localhost:8080/content/post/${moduleName}/${schemaType}`
                    : `http://localhost:8080/content/post/${moduleName}`;
            }

            // Prepare Payload
            const jsonPayload = JSON.stringify(data);
            const formData = new FormData();
            formData.append('data', jsonPayload);

            if (editId) {
                await axios.put(url, formData, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                toast.success("Content Updated Successfully!");
            } else {
                await axios.post(url, formData, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                toast.success("Content Saved Successfully!");
                reset(); // Only reset on create
            }

        } catch (error: any) {
            console.error(error);
            const msg = error.response?.data?.message || "Failed to save content";
            toast.error(msg);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return <div className="p-8 flex justify-center"><Loader2 className="animate-spin" /></div>;
    }

    if (!schema) {
        return <div className="p-8 text-center text-muted-foreground">No schema found for {moduleName}</div>;
    }

    return (
        <div className="max-w-4xl mx-auto p-6">
            <Card>
                <CardHeader>
                    <CardTitle>Create {moduleName} Content</CardTitle>
                    <CardDescription>Fill in the details below</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {schema.structure.map((field) => (
                                <div
                                    key={field.name}
                                    className={cn(
                                        "space-y-2",
                                        field.gridWidth === 2 ? "md:col-span-2" : "md:col-span-1"
                                    )}
                                >
                                    <Label>
                                        {field.label} {field.required && <span className="text-destructive">*</span>}
                                    </Label>

                                    {/* INPUT RENDERER SWITCH */}
                                    {(() => {
                                        switch (field.type) {
                                            case 'textarea':
                                                return (
                                                    <Textarea {...register(field.name)} placeholder={field.placeholder} />
                                                );
                                            case 'toggle':
                                                return (
                                                    <Controller
                                                        control={control}
                                                        name={field.name}
                                                        render={({ field: { value, onChange } }) => (
                                                            <div className="flex items-center space-x-2">
                                                                <Switch checked={value} onCheckedChange={onChange} />
                                                                <span className="text-sm text-muted-foreground">{value ? 'Yes' : 'No'}</span>
                                                            </div>
                                                        )}
                                                    />
                                                );
                                            case 'checkbox':
                                                return (
                                                    <div className="flex items-center space-x-2">
                                                        {/* Fix: Use Controller for Checkbox or ensure register works with the component */}
                                                        <Controller
                                                            control={control}
                                                            name={field.name}
                                                            render={({ field: { value, onChange } }) => (
                                                                <Checkbox
                                                                    id={field.name}
                                                                    checked={value}
                                                                    onCheckedChange={onChange}
                                                                />
                                                            )}
                                                        />
                                                        <label htmlFor={field.name} className="text-sm">Enabled</label>
                                                    </div>
                                                )
                                            case 'date':
                                                return (
                                                    <Controller
                                                        control={control}
                                                        name={field.name}
                                                        render={({ field: { value, onChange } }) => (
                                                            <Popover>
                                                                <PopoverTrigger asChild>
                                                                    <Button
                                                                        variant={"outline"}
                                                                        className={cn(
                                                                            "w-full justify-start text-left font-normal",
                                                                            !value && "text-muted-foreground"
                                                                        )}
                                                                    >
                                                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                                                        {value ? format(new Date(value), "PPP") : <span>Pick a date</span>}
                                                                    </Button>
                                                                </PopoverTrigger>
                                                                <PopoverContent className="w-auto p-0">
                                                                    <Calendar
                                                                        mode="single"
                                                                        selected={value ? new Date(value) : undefined}
                                                                        onSelect={(date) => onChange(date?.toISOString().split('T')[0])} // Store as YYYY-MM-DD string
                                                                        initialFocus
                                                                    />
                                                                </PopoverContent>
                                                            </Popover>
                                                        )}
                                                    />
                                                );
                                            case 'image':
                                                const currentImageUrl = watch(field.name);
                                                const isUploading = uploadingFields[field.name];

                                                return (
                                                    <div className="space-y-4">
                                                        {currentImageUrl ? (
                                                            <div className="relative group rounded-md overflow-hidden border">
                                                                <img
                                                                    src={currentImageUrl}
                                                                    alt="Preview"
                                                                    className="w-full h-48 object-cover"
                                                                />
                                                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    <Button
                                                                        type="button"
                                                                        variant="destructive"
                                                                        size="sm"
                                                                        onClick={() => setValue(field.name, '')}
                                                                    >
                                                                        Remove Image
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="border-2 border-dashed rounded-md p-6 flex flex-col items-center justify-center bg-muted/20 hover:bg-muted/40 transition-colors relative">
                                                                {isUploading ? (
                                                                    <div className="flex flex-col items-center justify-center py-4">
                                                                        <Loader2 className="h-8 w-8 text-primary animate-spin mb-2" />
                                                                        <span className="text-sm text-muted-foreground">Uploading...</span>
                                                                    </div>
                                                                ) : (
                                                                    <>
                                                                        <Input
                                                                            type="file"
                                                                            id={field.name}
                                                                            className="hidden"
                                                                            onChange={(e) => handleImageUpload(e, field.name)}
                                                                            accept="image/*"
                                                                        />
                                                                        <label htmlFor={field.name} className="cursor-pointer flex flex-col items-center w-full h-full">
                                                                            <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                                                                            <span className="text-sm font-medium">Click to upload image</span>
                                                                            <span className="text-xs text-muted-foreground mt-1">Supports JPG, PNG</span>
                                                                        </label>
                                                                    </>
                                                                )}
                                                            </div>
                                                        )}
                                                        {/* Hidden input to hold the URL string value for form submission */}
                                                        <input type="hidden" {...register(field.name)} />
                                                    </div>
                                                );
                                            default: // Text, props etc
                                                return (
                                                    <Input
                                                        type={field.type === 'number' ? 'number' : field.type === 'email' ? 'email' : 'text'}
                                                        {...register(field.name)}
                                                        placeholder={field.placeholder}
                                                    />
                                                );
                                        }
                                    })()}

                                    {errors[field.name] && (
                                        <p className="text-sm text-destructive">{errors[field.name]?.message as string}</p>
                                    )}
                                </div>
                            ))}
                        </div>

                        <Button type="submit" disabled={submitting} className="w-full md:w-auto">
                            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Content
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
