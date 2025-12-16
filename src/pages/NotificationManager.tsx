import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { adminNotificationsApi, Notification } from '@/services/api';
import { toast } from 'sonner';
import { Loader2, Trash2, Send, Radio, Mail, AlertTriangle, User, Tag, RefreshCcw } from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
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
} from "@/components/ui/alert-dialog";

const NotificationManager: React.FC = () => {
    const [history, setHistory] = useState<Notification[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSending, setIsSending] = useState(false);

    // Form States
    const [manualEmail, setManualEmail] = useState('');
    const [manualSubject, setManualSubject] = useState('');
    const [manualMessage, setManualMessage] = useState('');
    const [manualCategory, setManualCategory] = useState<'SYSTEM_ALERT' | 'ACCOUNT' | 'PROMOTION'>('SYSTEM_ALERT');

    const [broadcastSubject, setBroadcastSubject] = useState('');
    const [broadcastMessage, setBroadcastMessage] = useState('');
    const [broadcastCategory, setBroadcastCategory] = useState<'SYSTEM_ALERT' | 'ACCOUNT' | 'PROMOTION'>('SYSTEM_ALERT');

    const fetchHistory = async () => {
        setIsLoading(true);
        try {
            const data = await adminNotificationsApi.getHistory();
            setHistory(data);
        } catch (error) {
            toast.error("Failed to fetch notification history");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, []);

    const handleDelete = async (id: number) => {
        try {
            await adminNotificationsApi.delete(id);
            setHistory(prev => prev.filter(item => item.id !== id));
            toast.success("Log deleted");
        } catch (error) {
            toast.error("Failed to delete log");
        }
    };

    const handleSendManual = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSending(true);
        try {
            await adminNotificationsApi.sendManual({
                email: manualEmail,
                subject: manualSubject,
                messageBody: manualMessage,
                category: manualCategory
            });
            toast.success("Notification Queued");
            setManualEmail('');
            setManualSubject('');
            setManualMessage('');
            fetchHistory(); // Refresh history
        } catch (error) {
            toast.error("Failed to send notification");
        } finally {
            setIsSending(false);
        }
    };

    const [showBroadcastConfirm, setShowBroadcastConfirm] = useState(false);

    const handleBroadcast = (e: React.FormEvent) => {
        e.preventDefault();
        setShowBroadcastConfirm(true);
    };

    const executeBroadcast = async () => {
        setIsSending(true);
        try {
            await adminNotificationsApi.broadcast({
                subject: broadcastSubject,
                messageBody: broadcastMessage,
                category: broadcastCategory
            });
            toast.success("Broadcast Queued");
            setBroadcastSubject('');
            setBroadcastMessage('');
            fetchHistory(); // Refresh history
            setShowBroadcastConfirm(false);
        } catch (error) {
            toast.error("Failed to send broadcast");
        } finally {
            setIsSending(false);
        }
    };

    const getCategoryBadge = (category: string) => {
        switch (category) {
            case 'SYSTEM_ALERT': return <Badge variant="destructive" className="items-center gap-1"><AlertTriangle className="h-3 w-3" /> System Alert</Badge>;
            case 'PROMOTION': return <Badge className="bg-blue-500 hover:bg-blue-600 items-center gap-1"><Tag className="h-3 w-3" /> Promotion</Badge>;
            case 'ACCOUNT': return <Badge className="bg-green-500 hover:bg-green-600 items-center gap-1"><User className="h-3 w-3" /> Account</Badge>;
            case 'OTP': return <Badge variant="secondary" className="items-center gap-1">OTP</Badge>;
            default: return <Badge variant="outline">{category}</Badge>;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold tracking-tight">Notification Manager</h1>
                <Button variant="outline" size="sm" onClick={fetchHistory} disabled={isLoading}>
                    <RefreshCcw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                    Refresh Logs
                </Button>
            </div>

            <Tabs defaultValue="history" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="history">History Log</TabsTrigger>
                    <TabsTrigger value="manual">Manual Push</TabsTrigger>
                    <TabsTrigger value="broadcast">Broadcast</TabsTrigger>
                </TabsList>

                <TabsContent value="history" className="space-y-4">
                    <div className="rounded-md border bg-card">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[80px]">ID</TableHead>
                                    <TableHead>Recipient</TableHead>
                                    <TableHead>Subject</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {history.length > 0 ? (
                                    history.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell className="font-mono">{item.id}</TableCell>
                                            <TableCell>{item.email}</TableCell>
                                            <TableCell>{item.subject}</TableCell>
                                            <TableCell>{getCategoryBadge(item.category)}</TableCell>
                                            <TableCell>
                                                <Badge variant={item.status === 'SENT' ? 'default' : 'secondary'}>
                                                    {item.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground text-sm">
                                                {new Date(item.createdAt).toLocaleString()}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                This action cannot be undone. This will permanently delete the notification log
                                                                for <strong>{item.subject}</strong> from the server history.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => handleDelete(item.id)}>
                                                                Delete
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-24 text-center">
                                            No logs found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </TabsContent>

                <TabsContent value="manual">
                    <div className="max-w-xl mx-auto border rounded-xl p-6 bg-card shadow-sm">
                        <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
                            <Mail className="h-5 w-5 text-amber-500" />
                            Send Single Notification
                        </h2>
                        <form onSubmit={handleSendManual} className="space-y-4">
                            <div className="space-y-2">
                                <Label>Recipient Email</Label>
                                <Input
                                    placeholder="user@example.com"
                                    type="email"
                                    value={manualEmail}
                                    onChange={e => setManualEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Category</Label>
                                    <Select
                                        value={manualCategory}
                                        onValueChange={(val: any) => setManualCategory(val)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="SYSTEM_ALERT">System Alert</SelectItem>
                                            <SelectItem value="ACCOUNT">Account</SelectItem>
                                            <SelectItem value="PROMOTION">Promotion</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Subject</Label>
                                    <Input
                                        placeholder="Header..."
                                        value={manualSubject}
                                        onChange={e => setManualSubject(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Message</Label>
                                <Textarea
                                    placeholder="Type your message here..."
                                    className="min-h-[120px]"
                                    value={manualMessage}
                                    onChange={e => setManualMessage(e.target.value)}
                                    required
                                />
                            </div>
                            <Button type="submit" className="w-full" disabled={isSending}>
                                {isSending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Send Notification
                            </Button>
                        </form>
                    </div>
                </TabsContent>

                <TabsContent value="broadcast">
                    <div className="max-w-xl mx-auto border rounded-xl p-6 bg-destructive/5 border-destructive/20 shadow-sm">
                        <h2 className="text-lg font-medium mb-4 flex items-center gap-2 text-destructive">
                            <Radio className="h-5 w-5" />
                            Broadcast to All Users
                        </h2>
                        <div className="mb-6 p-3 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 text-sm rounded-lg flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4" />
                            Warning: This will email every registered user with role 'USER'.
                        </div>

                        <form onSubmit={handleBroadcast} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Category</Label>
                                    <Select
                                        value={broadcastCategory}
                                        onValueChange={(val: any) => setBroadcastCategory(val)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="SYSTEM_ALERT">System Alert</SelectItem>
                                            <SelectItem value="ACCOUNT">Account</SelectItem>
                                            <SelectItem value="PROMOTION">Promotion</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Subject</Label>
                                    <Input
                                        placeholder="Annoucement Header..."
                                        value={broadcastSubject}
                                        onChange={e => setBroadcastSubject(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Message</Label>
                                <Textarea
                                    placeholder="Type your announcement here..."
                                    className="min-h-[120px]"
                                    value={broadcastMessage}
                                    onChange={e => setBroadcastMessage(e.target.value)}
                                    required
                                />
                            </div>
                            <Button type="submit" variant="destructive" className="w-full" disabled={isSending}>
                                {isSending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Send Broadcast
                            </Button>
                        </form>
                    </div>

                    <AlertDialog open={showBroadcastConfirm} onOpenChange={setShowBroadcastConfirm}>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Confirm Broadcast</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Are you sure you want to send this notification to <strong>ALL registered users</strong>?
                                    <br /><br />
                                    This action cannot be undone and creates a system-wide alert.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                    className="bg-red-600 hover:bg-red-700"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        executeBroadcast();
                                    }}
                                >
                                    {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Broadcast Now"}
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default NotificationManager;
