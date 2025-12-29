import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { Post } from '@/types';
import { Loader2, Calendar, User, ArrowLeft, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export default function PublicPostDetail() {
    const { moduleName, id } = useParams<{ moduleName: string; id: string }>();
    const [post, setPost] = useState<Post | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPost = async () => {
            if (!id) return;
            setLoading(true);
            try {
                // Fetch basic entry.
                // NOTE: We rely on server ensuring it is published OR we check client side.
                // Standard Public Endpoint usually filters. If we reuse admin endpoint, we must check published.
                // Requirement: "allow public visitors to see only finalized content."
                const res = await axios.get(`http://localhost:8080/content/post/entry/${id}`);
                const fetchedPost: Post = res.data;

                if (fetchedPost.data && typeof fetchedPost.data === 'string') {
                    try { fetchedPost.data = JSON.parse(fetchedPost.data); } catch (e) { }
                }

                // Client-side guard for Drafts (if API doesn't restrict)
                if (!fetchedPost.published) {
                    setPost(null); // Treat as 404
                } else {
                    setPost(fetchedPost);
                }
            } catch (error) {
                console.error("Failed to fetch post", error);
            } finally {
                setLoading(false);
            }
        };

        fetchPost();
    }, [id]);

    if (loading) {
        return <div className="flex items-center justify-center min-h-[50vh]"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;
    }

    if (!post) {
        return (
            <div className="container py-20 text-center">
                <h2 className="text-2xl font-bold mb-4">Post Not Found</h2>
                <p className="text-muted-foreground mb-8">The content you are looking for does not exist or has been removed.</p>
                <Button asChild>
                    <Link to={`/view/${moduleName}`}>Back to {moduleName}</Link>
                </Button>
            </div>
        );
    }

    // Identify Title and Hero Image
    const dataKeys = Object.keys(post.data);
    const isImageValue = (val: any) => typeof val === 'string' && (val.match(/\.(jpeg|jpg|gif|png|webp)$/i) || val.includes('/content/images'));

    // Find Title
    const titleKey = dataKeys.find(k => ['title', 'name', 'headline', 'subject'].includes(k.toLowerCase()) && !isImageValue(post.data[k]))
        || dataKeys.find(k => typeof post.data[k] === 'string' && post.data[k].length < 100 && !isImageValue(post.data[k]))
        || 'Untitled';

    const displayTitle = post.displayTitle || post.data[titleKey] || 'Untitled';

    // Exclude title from body
    const bodyKeys = dataKeys.filter(k => k !== titleKey);

    return (
        <article className="container max-w-4xl py-10 animate-in fade-in duration-500">
            <div className="mb-8">
                <Link
                    to={`/view/${moduleName}`}
                    className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors mb-6"
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to {moduleName}
                </Link>

                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                    <Badge variant="secondary" className="uppercase tracking-wider font-semibold text-[10px]">
                        {post.schemaType || moduleName}
                    </Badge>
                    <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{post.entryDateTime ? format(new Date(post.entryDateTime), 'MMMM d, yyyy') : 'Recent'}</span>
                    </div>
                </div>

                <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground mb-6 leading-tight">
                    {String(displayTitle)}
                </h1>

                {/* Hero Image */}
                {post.attachmentPath && (
                    <div className="rounded-xl overflow-hidden shadow-lg mb-10 bg-muted border">
                        <img
                            src={`http://localhost:8080/${post.attachmentPath}`}
                            alt={String(displayTitle)}
                            className="w-full h-auto max-h-[600px] object-cover"
                        />
                    </div>
                )}
            </div>

            {/* Content Body */}
            <div className="prose prose-lg dark:prose-invert max-w-none">
                {bodyKeys.map(key => {
                    const value = post.data[key];
                    if (!value) return null;

                    if (isImageValue(value)) {
                        return (
                            <figure key={key} className="my-8">
                                <img
                                    src={value.startsWith('http') ? value : `http://localhost:8080${value}`}
                                    alt={key}
                                    className="rounded-lg shadow-md w-full"
                                />
                                <figcaption className="text-center text-sm text-muted-foreground mt-2 capitalize">{key.replace(/_/g, ' ')}</figcaption>
                            </figure>
                        );
                    }

                    return (
                        <div key={key} className="mb-6">
                            <h3 className="text-xl font-bold mb-2 capitalize text-foreground/80">{key.replace(/_/g, ' ')}</h3>
                            <div className="whitespace-pre-wrap leading-relaxed">
                                {String(value)}
                            </div>
                        </div>
                    );
                })}
            </div>
        </article>
    );
}
