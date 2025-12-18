import { useState, useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import DynamicForm from '@/components/cms/DynamicForm';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export default function CMSModulePage() {
    const { moduleName } = useParams<{ moduleName: string }>();
    const { hasPermission, hasAnyRole, token } = useAuth();

    if (!moduleName) {
        return <Navigate to="/dashboard" replace />;
    }

    // Normalize module name (URL might be "academic", permission needs "ACADEMIC")
    const normalizedModule = moduleName.toUpperCase().replace(/-/g, '_');

    // Check permission
    // Admins usually have all access, but let's check explicit permission or Role
    const canCreate = hasAnyRole(['SUPERADMIN', 'ADMIN']) || hasPermission(`${normalizedModule}_CREATE`);

    // State for schema type selection
    const [selectedSchemaType, setSelectedSchemaType] = useState<string | null>(null);
    const [availableSchemas, setAvailableSchemas] = useState<string[]>([]);
    const [loadingSchemas, setLoadingSchemas] = useState(false);

    // Fetch available schemas for this module
    useEffect(() => {
        const fetchSchemas = async () => {
            setLoadingSchemas(true);
            try {
                // Fetch list of schema types for this module
                // Endpoint assumed: GET /content/schemas/{moduleName}
                // Expected response: ["EVENT", "PROFILE"]
                const res = await axios.get(`http://localhost:8080/content/schemas/${normalizedModule}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (Array.isArray(res.data)) {
                    // Extract schemaType from the response objects
                    const types = res.data
                        .map((item: any) => item.schemaType)
                        .filter((type: any) => typeof type === 'string' && type.trim() !== '');

                    // Deduplicate and sort
                    const uniqueTypes = Array.from(new Set(types)).sort();

                    setAvailableSchemas(uniqueTypes as string[]);
                } else {
                    console.warn("Unexpected response format for schema list", res.data);
                    setAvailableSchemas([]);
                }
            } catch (error) {
                console.error("Failed to fetch schemas", error);

                // If 404, it might mean no schemas are defined yet, or endpoint doesn't exist
                // We show an empty state rather than forcing mock data, 
                // so the user knows they need to Create a Schema first.
                setAvailableSchemas([]);
                toast.error(`Could not load content types for ${normalizedModule}. Do you need to create a Blueprint first?`);
            } finally {
                setLoadingSchemas(false);
            }
        };
        fetchSchemas();
    }, [normalizedModule, token]);

    if (!canCreate) {
        return (
            <div className="p-8 flex justify-center">
                <Card className="max-w-md border-destructive">
                    <CardContent className="pt-6 flex flex-col items-center text-center gap-4">
                        <AlertCircle className="h-12 w-12 text-destructive" />
                        <h2 className="text-xl font-bold text-destructive">Access Denied</h2>
                        <p className="text-muted-foreground">
                            You do not have permission to create content for the <span className="font-mono font-bold">{normalizedModule}</span> module.
                        </p>
                    </CardContent>
                </Card>
            </div>
        )
    }

    // Step 1: Schema Selection Screen
    if (!selectedSchemaType) {
        return (
            <ErrorBoundary name="CMSModulePage -> Selection List">
                <div className="max-w-4xl mx-auto p-6 space-y-6">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight capitalize">{moduleName.replace(/-/g, ' ')} Module</h1>
                        <p className="text-muted-foreground">Select the type of content you want to create.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {loadingSchemas ? (
                            <div className="col-span-3 text-center py-10">Loading content types...</div>
                        ) : availableSchemas.length > 0 ? (
                            availableSchemas.map((type) => (
                                <Card
                                    key={type}
                                    className="cursor-pointer hover:border-primary transition-colors"
                                    onClick={() => setSelectedSchemaType(type)}
                                >
                                    <CardContent className="p-6 flex flex-col items-center justify-center h-40 gap-3">
                                        <div className="p-3 bg-primary/10 rounded-full text-primary font-bold text-xl">
                                            {type.substring(0, 2)}
                                        </div>
                                        <span className="font-semibold text-lg">{type}</span>
                                    </CardContent>
                                </Card>
                            ))
                        ) : (
                            <div className="col-span-3 text-center py-10 text-muted-foreground">
                                No content types defined for this module.
                            </div>
                        )}
                    </div>
                </div>
            </ErrorBoundary >
        );
    }

    // Step 2: Render Form
    return (
        <ErrorBoundary name="CMSModulePage -> DynamicForm">
            <div className="space-y-6">
                <div className="flex items-center justify-between px-6">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setSelectedSchemaType(null)}
                            className="text-muted-foreground hover:text-foreground hover:underline text-sm"
                        >
                            &larr; Back to Types
                        </button>
                        <span className="text-muted-foreground">/</span>
                        <h1 className="text-2xl font-bold tracking-tight capitalize">New {selectedSchemaType}</h1>
                    </div>
                </div>
                <DynamicForm moduleName={normalizedModule} schemaType={selectedSchemaType} />
            </div>
        </ErrorBoundary>
    );
}
