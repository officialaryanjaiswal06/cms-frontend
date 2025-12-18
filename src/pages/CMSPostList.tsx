import React, { useEffect, useState } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import axios from 'axios';
import { Plus, FileText, Loader2, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface Post {
    id: number;
    created_by_username: string;
    attachmentPath?: string;
    data: Record<string, any>;
}

export default function CMSPostList() {
    const { moduleName } = useParams<{ moduleName: string }>();
    const { token, hasAnyRole, hasPermission } = useAuth();
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);

    const normalizedModule = moduleName ? moduleName.toUpperCase().replace(/-/g, '_') : '';
    const canCreate = hasAnyRole(['SUPERADMIN', 'ADMIN']) || hasPermission(`${normalizedModule}_CREATE`);

    useEffect(() => {
        const fetchPosts = async () => {
            if (!moduleName) return;
            setLoading(true);
            try {
                // Mock data fallback if API fails
                /*
                const res = await axios.get(`http://localhost:8080/content/posts/${normalizedModule}`, {
                     headers: { Authorization: `Bearer ${token}` }
                });
                setPosts(res.data);
                */

                try {
                    const res = await axios.get(`http://localhost:8080/content/posts/${normalizedModule}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    setPosts(res.data);
                } catch (err) {
                    console.warn("API fetch failed, using mock data");
                    setPosts([
                        {
                            id: 1,
                            created_by_username: 'mock_user',
                            attachmentPath: 'uploads/mock.jpg',
                            data: {
                                Title: 'Sample Post',
                                Mission: 'This is a sample mission statement.',
                                Featured: true
                            }
                        }
                    ]);
                }

            } catch (error) {
                console.error("Failed to fetch posts", error);
                toast.error("Failed to load content.");
            } finally {
                setLoading(false);
            }
        };

        fetchPosts();
    }, [moduleName, normalizedModule, token]);

    if (!moduleName) return <Navigate to="/dashboard" />;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight capitalize">{moduleName.replace(/-/g, ' ')} Posts</h1>
                    <p className="text-muted-foreground">Manage content for {moduleName}</p>
                </div>

                {canCreate && (
                    <Link to={`/modules/${moduleName}/new`}>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" /> Create New
                        </Button>
                    </Link>
                )}
            </div>

            {loading ? (
                <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
            ) : posts.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed rounded-lg bg-muted/10">
                    <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FileText className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">No posts yet</h3>
                    <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                        This module has no content yet. Create your first post to get started!
                    </p>
                    {canCreate && (
                        <Link to={`/modules/${moduleName}/new`}>
                            <Button>Create Content</Button>
                        </Link>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {posts.map((post) => {
                        // Intelligent Title Detection
                        const dataKeys = Object.keys(post.data);

                        // Helper to check if value is an image
                        const isImageValue = (val: any) => {
                            if (typeof val !== 'string') return false;
                            return val.match(/\.(jpeg|jpg|gif|png|webp)$/i) || val.includes('/content/images') || val.includes('/cms/upload');
                        };

                        // 1. Look for explicit title keys that are NOT images
                        // 2. Look for any short string that is NOT an image
                        // 3. Fallback to first non-image key
                        // 4. Absolute fallback to first key
                        const titleKey = dataKeys.find(k => ['title', 'name', 'headline', 'subject'].includes(k.toLowerCase()) && !isImageValue(post.data[k]))
                            || dataKeys.find(k => typeof post.data[k] === 'string' && post.data[k].length < 100 && !isImageValue(post.data[k]))
                            || dataKeys.find(k => !isImageValue(post.data[k]))
                            || dataKeys[0];

                        const title = post.data[titleKey];
                        // If the chosen title IS an image (absolute fallback), show a placeholder text instead of raw URL
                        const displayTitle = isImageValue(title) ? `Post #${post.id}` : (title || 'Untitled Post');

                        // Remaining keys to show (exclude titleKey, but INCLUDE image keys so they can be rendered in preview)
                        const previewKeys = dataKeys
                            .filter(k => k !== titleKey && typeof post.data[k] !== 'object')
                            .slice(0, 3);

                        return (
                            <Link to={`/modules/${moduleName}/posts/${post.id}`} key={post.id} className="group">
                                <Card className="overflow-hidden bg-card hover:shadow-xl transition-all duration-300 border-border/50 hover:border-primary/50 h-full flex flex-col">
                                    {post.attachmentPath ? (
                                        <div className="aspect-video relative overflow-hidden bg-muted">
                                            <img
                                                src={`http://localhost:8080/${post.attachmentPath}`}
                                                alt="Post attachment"
                                                className="object-cover w-full h-full transform group-hover:scale-105 transition-transform duration-500"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).src = 'https://placehold.co/600x400?text=No+Image';
                                                }}
                                            />
                                        </div>
                                    ) : (
                                        <div className="h-2 bg-gradient-to-r from-primary to-primary/50" />
                                    )}

                                    <CardHeader className="pb-3">
                                        <CardTitle className="line-clamp-2 text-lg group-hover:text-primary transition-colors">
                                            {String(displayTitle)}
                                        </CardTitle>
                                    </CardHeader>

                                    <CardContent className="flex-1">
                                        <div className="space-y-2.5">
                                            {previewKeys.map((key) => {
                                                const value = String(post.data[key]);
                                                // Check if value looks like an image URL (common extensions or starts with /content/images)
                                                const isImage = value.match(/\.(jpeg|jpg|gif|png|webp)$/i) || value.includes('/content/images/');

                                                return (
                                                    <div key={key} className="flex flex-col gap-0.5 text-sm">
                                                        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                                                            {key.replace(/_/g, ' ')}
                                                        </span>
                                                        {isImage ? (
                                                            <img
                                                                src={value.startsWith('http') ? value : `http://localhost:8080${value}`}
                                                                alt={key}
                                                                className="w-full h-32 object-cover rounded-md mt-1 border"
                                                            />
                                                        ) : (
                                                            <span className="line-clamp-2 text-foreground/90 font-medium">
                                                                {value}
                                                            </span>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                            {previewKeys.length === 0 && (
                                                <p className="text-sm text-muted-foreground italic">No snippet available</p>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
