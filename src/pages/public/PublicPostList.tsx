import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { Post } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Calendar, User } from 'lucide-react';
import { format } from 'date-fns';

export default function PublicPostList() {
    const { moduleName } = useParams<{ moduleName: string }>();
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);

    const normalizedModule = moduleName ? moduleName.toUpperCase().replace(/-/g, '_') : '';

    useEffect(() => {
        const fetchPosts = async () => {
            if (!moduleName) return;
            setLoading(true);
            try {
                // Public Endpoint: GET /content/public/posts/{moduleName}
                const res = await axios.get(`http://localhost:8080/content/public/posts/${normalizedModule}`);
                setPosts(res.data);
            } catch (error) {
                console.error("Failed to fetch public posts", error);
            } finally {
                setLoading(false);
            }
        };

        fetchPosts();
    }, [moduleName, normalizedModule]);

    if (loading) {
        return <div className="flex justify-center py-20"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;
    }

    return (
        <div className="container py-10">
            <h1 className="text-4xl font-bold mb-2 capitalize">{moduleName?.replace(/-/g, ' ')}</h1>
            <p className="text-muted-foreground mb-10">Latest updates and stories.</p>

            {posts.length === 0 ? (
                <div className="text-center py-20 bg-muted/30 rounded-lg">
                    <p className="text-muted-foreground">No posts found for this section.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {posts.map((post) => {
                        // Intelligent Title Detection (Reused logic)
                        const dataKeys = Object.keys(post.data);
                        const isImageValue = (val: any) => typeof val === 'string' && (val.match(/\.(jpeg|jpg|gif|png|webp)$/i) || val.includes('/content/images'));

                        const titleKey = dataKeys.find(k => ['title', 'name', 'headline'].includes(k.toLowerCase()) && !isImageValue(post.data[k]))
                            || dataKeys.find(k => typeof post.data[k] === 'string' && post.data[k].length < 100 && !isImageValue(post.data[k]))
                            || dataKeys[0];

                        const title = post.displayTitle || post.data[titleKey] || 'Untitled';
                        const displayTitle = isImageValue(title) ? 'Post' : title;

                        return (
                            <Link to={`/view/${moduleName}/${post.id}`} key={post.id} className="group">
                                <Card className="h-full overflow-hidden hover:shadow-lg transition-all duration-300 border-border/50 hover:border-primary/50 flex flex-col">
                                    {post.attachmentPath && (
                                        <div className="aspect-video relative overflow-hidden bg-muted">
                                            <img
                                                src={`http://localhost:8080/${post.attachmentPath}`}
                                                alt={String(displayTitle)}
                                                className="object-cover w-full h-full transform group-hover:scale-105 transition-transform duration-500"
                                            />
                                        </div>
                                    )}
                                    <CardHeader>
                                        <CardTitle className="line-clamp-2 group-hover:text-primary transition-colors">
                                            {String(displayTitle)}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="mt-auto flex items-center justify-end text-sm text-muted-foreground pt-0">
                                        <div className="flex items-center gap-1">
                                            <Calendar className="h-3 w-3" />
                                            <span>{post.entryDateTime ? format(new Date(post.entryDateTime), 'MMM d, yyyy') : 'Recent'}</span>
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
