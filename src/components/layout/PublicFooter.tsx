import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Shield } from 'lucide-react';

export default function PublicFooter() {
    const [academicPrograms, setAcademicPrograms] = useState<any[]>([]);
    const [footerData, setFooterData] = useState<any>(null);
    const [loadingPrograms, setLoadingPrograms] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch Programs
                const programsRes = await axios.get('http://localhost:8080/content/public/posts/PROGRAM');
                setAcademicPrograms(Array.isArray(programsRes.data) ? programsRes.data : []);
                setLoadingPrograms(false);

                // Fetch Footer Info
                const footerRes = await axios.get('http://localhost:8080/content/public/posts/FOOTER');
                if (Array.isArray(footerRes.data) && footerRes.data.length > 0) {
                    setFooterData(footerRes.data[0].data);
                }
            } catch (error) {
                console.error("Failed to fetch footer data", error);
                setLoadingPrograms(false);
            }
        };
        fetchData();
    }, []);

    return (
        <footer className="bg-slate-900 border-t border-slate-800 pt-16 pb-8 transition-colors duration-300">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
                    {/* Column 1: Brand Identity */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-amber-500/10 rounded-lg border border-amber-500/20">
                                <Shield className="h-6 w-6 text-amber-500" />
                            </div>
                            <span className="font-serif font-bold text-xl text-slate-50 uppercase tracking-tight">UCM</span>
                        </div>
                        <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
                            Universal College Of Management is dedicated to excellence in education,
                            fostering a culture of innovation and leadership for a brighter future.
                        </p>
                    </div>

                    {/* Column 2: Our Programs */}
                    <div className="space-y-6">
                        <h4 className="text-slate-50 font-bold uppercase tracking-widest text-sm">Our Programs</h4>
                        <ul className="space-y-3">
                            {academicPrograms.slice(0, 5).map(program => (
                                <li key={program.id}>
                                    <Link
                                        to={`/view/program/${program.id}`}
                                        className="text-slate-400 hover:text-amber-500 text-sm transition-colors duration-200 block"
                                    >
                                        {program.data?.Title || program.data?.title || 'Untitled Program'}
                                    </Link>
                                </li>
                            ))}
                            {academicPrograms.length === 0 && !loadingPrograms && (
                                <li className="text-slate-500 text-sm italic">No programs found</li>
                            )}
                            {loadingPrograms && (
                                <li className="text-slate-500 text-sm italic animate-pulse">Loading programs...</li>
                            )}
                        </ul>
                    </div>

                    {/* Column 3: Contact Information */}
                    <div className="space-y-6">
                        <h4 className="text-slate-50 font-bold uppercase tracking-widest text-sm">Contact Us</h4>
                        <div className="space-y-4">
                            {footerData ? (
                                <>
                                    <div className="flex items-start gap-3">
                                        <div className="mt-1 p-1 bg-slate-800 rounded border border-slate-700">
                                            <div className="h-3 w-3 bg-amber-500/50 rounded-full" />
                                        </div>
                                        <div>
                                            <p className="text-slate-300 text-xs font-bold uppercase tracking-wider mb-1">Location</p>
                                            <p className="text-slate-400 text-sm">{footerData.Location}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="mt-1 p-1 bg-slate-800 rounded border border-slate-700">
                                            <div className="h-3 w-3 bg-amber-500/50 rounded-full" />
                                        </div>
                                        <div>
                                            <p className="text-slate-300 text-xs font-bold uppercase tracking-wider mb-1">Call Us</p>
                                            <p className="text-slate-400 text-sm">{footerData["Call us"]}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="mt-1 p-1 bg-slate-800 rounded border border-slate-700">
                                            <div className="h-3 w-3 bg-amber-500/50 rounded-full" />
                                        </div>
                                        <div>
                                            <p className="text-slate-300 text-xs font-bold uppercase tracking-wider mb-1">Email Us</p>
                                            <p className="text-slate-400 text-sm">{footerData["Email us"]}</p>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="space-y-3 animate-pulse">
                                    <div className="h-4 bg-slate-800 rounded w-3/4" />
                                    <div className="h-4 bg-slate-800 rounded w-1/2" />
                                    <div className="h-4 bg-slate-800 rounded w-2/3" />
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="pt-8 border-t border-slate-800 text-center">
                    <p className="text-slate-500 text-[10px] tracking-[0.2em] uppercase font-bold">
                        © 2024 Universal College Of Management. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
}
