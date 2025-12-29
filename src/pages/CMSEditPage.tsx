import { useState, useEffect } from 'react';
import { useParams, Navigate, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import DynamicForm from '@/components/cms/DynamicForm';
import { useAuth } from '@/contexts/AuthContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export default function CMSEditPage() {
    const { moduleName, id } = useParams<{ moduleName: string; id: string }>();
    const { token } = useAuth();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [postData, setPostData] = useState<any>(null);
    const [fullPost, setFullPost] = useState<any>(null);
    const [schemaType, setSchemaType] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(false); // Moved up here

    // Normalize module name
    const normalizedModule = moduleName ? moduleName.toUpperCase().replace(/-/g, '_') : '';

    useEffect(() => {
        const fetchPost = async () => {
            if (!id || !normalizedModule) return;
            setLoading(true);
            try {
                // Fetch Post Data
                // Assuming Endpoint: GET /content/post/{id} 
                // We might need to adjust this if backend requires moduleName or schemaType in URL
                // Based on standard REST, ID should be unique enough, but let's see.
                // Endpoint: GET /content/post/entry/{id}
                const res = await axios.get(`http://localhost:8080/content/post/entry/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                console.log("Edit Page Response:", res.data); // Debug Log

                if (res.data) {
                    setFullPost(res.data);

                    let contentData = res.data.data;
                    // Check if 'data' is a string and needs parsing
                    if (typeof contentData === 'string') {
                        try {
                            contentData = JSON.parse(contentData);
                        } catch (e) {
                            console.error("Failed to parse data JSON", e);
                        }
                    }
                    console.log("Parsed Post Data:", contentData); // Debug Log

                    setPostData(contentData);

                    // Robust extraction of schemaType
                    const type = res.data.schemaType || res.data.schema?.schemaType;
                    console.log("Extracted Schema Type:", type);

                    setSchemaType(type);
                }

            } catch (error) {
                console.error("Failed to fetch post", error);
                toast.error("Failed to load post details.");
                navigate(`/modules/${moduleName}`);
            } finally {
                setLoading(false);
            }
        };

        fetchPost();
    }, [id, normalizedModule, token, navigate, moduleName]);

    if (loading) {
        return <div className="h-[50vh] flex items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;
    }

    if (!postData || !schemaType) {
        return <div className="p-8 text-center text-muted-foreground">Post not found.</div>;
    }

    const handleDelete = async () => {
        // Confirmation is now handled by AlertDialog

        try {
            await axios.delete(`http://localhost:8080/content/post/entry/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success("Post deleted successfully");
            navigate(`/modules/${moduleName}`);
        } catch (error) {
            console.error("Failed to delete post", error);
            toast.error("Failed to delete post");
        }
    };

    // The duplicate `const [isEditing, setIsEditing] = useState(false);` was removed here.

    // Display Metadata Card
    return (
        <ErrorBoundary name="CMSEditPage">
            <div className="space-y-6 max-w-5xl mx-auto pb-10">
                {/* Header */}
                <div className="flex items-center justify-between border-b pb-4">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate(`/modules/${moduleName}`)}
                            className="rounded-full hover:bg-muted"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">
                                {isEditing ? `Edit ${schemaType}` : `View ${schemaType}`}
                            </h1>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                                <span className="flex items-center gap-1 bg-muted px-2 py-0.5 rounded text-xs font-medium">
                                    ID: {id}
                                </span>
                                <span>•</span>
                                <span>{normalizedModule}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Status Badge */}
                        {fullPost && (
                            <Badge
                                variant={fullPost.published ? "default" : "secondary"}
                                className={cn(
                                    "text-sm px-3 py-1",
                                    fullPost.published ? "bg-green-600 hover:bg-green-700" : ""
                                )}
                            >
                                {fullPost.published ? "LIVE" : "DRAFT"}
                            </Badge>
                        )}

                        {!isEditing ? (
                            <>
                                <Button variant="outline" onClick={() => setIsEditing(true)}>
                                    Edit Post
                                </Button>

                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="destructive" disabled={loading}>
                                            Delete
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                This action cannot be undone. This will permanently delete the post
                                                and remove it from our servers.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                                Delete
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </>
                        ) : (
                            <Button variant="ghost" onClick={() => setIsEditing(false)}>
                                Cancel Editing
                            </Button>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content Column */}
                    <div className="lg:col-span-2 space-y-6">
                        {isEditing ? (
                            <DynamicForm
                                moduleName={normalizedModule}
                                schemaType={schemaType}
                                initialValues={postData}
                                editId={id}
                            />
                        ) : (
                            /* Read-Only View */
                            <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
                                {postData && typeof postData === 'object' && Object.entries(postData).map(([key, value], index) => {
                                    // Safe Render Helper
                                    const renderValue = (val: any) => {
                                        if (val === null || val === undefined) return <span className="text-muted-foreground italic">Empty</span>;
                                        const strVal = String(val);

                                        // Image Detection
                                        if (strVal.startsWith('http') && strVal.match(/\.(jpeg|jpg|gif|png|webp)$/i)) {
                                            return (
                                                <img
                                                    src={strVal}
                                                    alt="content"
                                                    className="max-w-full h-auto rounded-lg border max-h-[300px] object-contain"
                                                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                                />
                                            );
                                        }
                                        return <div className="whitespace-pre-wrap leading-relaxed">{strVal}</div>;
                                    };

                                    return (
                                        <div key={key} className={cn("flex flex-col md:flex-row md:items-start px-6 py-4 gap-4", index !== Object.keys(postData).length - 1 && "border-b")}>
                                            <div className="md:w-1/3 min-w-[120px]">
                                                <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider block mt-1">
                                                    {key.replace(/_/g, ' ')}
                                                </span>
                                            </div>
                                            <div className="md:w-2/3 break-words text-foreground">
                                                {renderValue(value)}
                                            </div>
                                        </div>
                                    );
                                })}
                                {(!postData || Object.keys(postData).length === 0) && (
                                    <div className="p-8 text-center text-muted-foreground italic">No content data available.</div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Metadata Sidebar */}
                    <div className="space-y-6">
                        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
                            <h3 className="font-semibold leading-none tracking-tight mb-4">Entry Details</h3>
                            <div className="space-y-4 text-sm">
                                <div className="grid grid-cols-2 gap-1">
                                    <span className="text-muted-foreground">Created By</span>
                                    {/* Fix: Backend returns camelCase createdByUsername */}
                                    <span className="font-medium text-right truncate" title={fullPost?.createdByUsername}>
                                        {fullPost?.createdByUsername || 'Unknown'}
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 gap-1">
                                    <span className="text-muted-foreground">Entry Date</span>
                                    <span className="font-medium text-right">
                                        {fullPost?.entryDateTime ? new Date(fullPost.entryDateTime).toLocaleDateString() : 'N/A'}
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 gap-1">
                                    <span className="text-muted-foreground">Entry Time</span>
                                    <span className="font-medium text-right">
                                        {fullPost?.entryDateTime ? new Date(fullPost.entryDateTime).toLocaleTimeString() : 'N/A'}
                                    </span>
                                </div>
                                <div className="border-t my-2 pt-2">
                                    <div className="grid grid-cols-2 gap-1">
                                        <span className="text-muted-foreground">Last Action</span>
                                        <span className="font-medium text-right capitalize">{fullPost?.lastAction || 'Unknown'}</span>
                                    </div>
                                    {/* Removed Entry Type as requested */}
                                </div>
                            </div>
                        </div>

                        {/* Removed System Info Debug Block as requested */}
                    </div>
                </div>
            </div>
        </ErrorBoundary>
    );
}
