import React, { useState, useEffect } from 'react';
import { BarChart, Users, Zap, TrendingUp, Loader } from 'lucide-react';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';

interface Contributor {
    name: string;
    score: number;
    color: string;
}

interface AnalyticsData {
    totalContributors: number;
    activePages: number;
    editsLastWeek: number;
    contributors: Contributor[];
    newContributors: number;
    editsChange: number;
}

const colors = ['bg-indigo-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-pink-500'];

const Analytics: React.FC = () => {
    const { user } = useAuth();
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadAnalytics = async () => {
            setIsLoading(true);
            try {
                // Get total documents count
                const { count: docCount } = await supabase
                    .from('documents')
                    .select('*', { count: 'exact', head: true });

                // Get unique collaborators count
                const { data: collaborators } = await supabase
                    .from('collaborators')
                    .select('user_id');

                const uniqueCollaborators = new Set(collaborators?.map(c => c.user_id) || []);

                // Get activity log for the past week
                const oneWeekAgo = new Date();
                oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

                const { data: recentActivity } = await supabase
                    .from('activity_log')
                    .select('user_id, profiles(username)')
                    .gte('created_at', oneWeekAgo.toISOString());

                // Count edits per user
                const userEdits: Record<string, { name: string; count: number }> = {};
                (recentActivity || []).forEach((item: any) => {
                    const userId = item.user_id;
                    const name = item.profiles?.username || 'Unknown';
                    if (!userEdits[userId]) {
                        userEdits[userId] = { name, count: 0 };
                    }
                    userEdits[userId].count++;
                });

                // Convert to contributors array
                const contributors = Object.values(userEdits)
                    .sort((a, b) => b.count - a.count)
                    .slice(0, 4)
                    .map((u, i) => ({
                        name: u.name,
                        score: Math.min(100, u.count * 10), // Normalize
                        color: colors[i % colors.length]
                    }));

                // If no activity data, show placeholder with actual user
                if (contributors.length === 0 && user) {
                    contributors.push({
                        name: user.name,
                        score: 100,
                        color: colors[0]
                    });
                }

                setData({
                    totalContributors: uniqueCollaborators.size + 1, // +1 for owner
                    activePages: docCount || 0,
                    editsLastWeek: recentActivity?.length || 0,
                    contributors,
                    newContributors: 0,
                    editsChange: 0
                });
            } catch (err) {
                console.error('Error loading analytics:', err);
                // Set default data on error
                setData({
                    totalContributors: 1,
                    activePages: 0,
                    editsLastWeek: 0,
                    contributors: user ? [{ name: user.name, score: 100, color: colors[0] }] : [],
                    newContributors: 0,
                    editsChange: 0
                });
            } finally {
                setIsLoading(false);
            }
        };

        loadAnalytics();
    }, [user]);

    if (isLoading) {
        return (
            <div className="flex-1 h-full flex items-center justify-center bg-white">
                <div className="flex flex-col items-center gap-4">
                    <Loader className="w-8 h-8 animate-spin text-indigo-500" />
                    <p className="text-slate-500">Loading analytics...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 h-full overflow-y-auto bg-white p-12">
            <div className="max-w-5xl mx-auto">
                <h1 className="text-2xl font-bold text-slate-900 mb-8 flex items-center gap-3">
                    <TrendingUp className="text-indigo-600" />
                    Collaboration Insights
                </h1>

                {/* KPI Cards */}
                <div className="grid grid-cols-3 gap-6 mb-12">
                    <div className="p-6 rounded-xl border border-slate-200 bg-slate-50">
                        <div className="flex items-center gap-3 text-slate-500 mb-2">
                            <Users size={20} /> Total Contributors
                        </div>
                        <div className="text-3xl font-bold text-slate-900">{data?.totalContributors || 0}</div>
                        {data?.newContributors ? (
                            <div className="text-xs text-green-600 font-medium mt-1">↑ {data.newContributors} this week</div>
                        ) : (
                            <div className="text-xs text-slate-400 font-medium mt-1">All time</div>
                        )}
                    </div>
                    <div className="p-6 rounded-xl border border-slate-200 bg-slate-50">
                        <div className="flex items-center gap-3 text-slate-500 mb-2">
                            <Zap size={20} /> Active Pages
                        </div>
                        <div className="text-3xl font-bold text-slate-900">{data?.activePages || 0}</div>
                        <div className="text-xs text-slate-400 font-medium mt-1">In your workspace</div>
                    </div>
                    <div className="p-6 rounded-xl border border-slate-200 bg-slate-50">
                        <div className="flex items-center gap-3 text-slate-500 mb-2">
                            <BarChart size={20} /> Edits (Last 7d)
                        </div>
                        <div className="text-3xl font-bold text-slate-900">{data?.editsLastWeek || 0}</div>
                        {data?.editsChange ? (
                            <div className="text-xs text-green-600 font-medium mt-1">↑ {data.editsChange}% vs prev week</div>
                        ) : (
                            <div className="text-xs text-slate-400 font-medium mt-1">This week</div>
                        )}
                    </div>
                </div>

                {/* Contribution Chart */}
                <div className="mb-8">
                    <h3 className="font-semibold text-slate-900 mb-4">Top Contributors</h3>
                    <div className="space-y-4">
                        {(data?.contributors || []).map(contributor => (
                            <div key={contributor.name} className="flex items-center gap-4">
                                <span className="w-32 text-sm font-medium text-slate-600 truncate">{contributor.name}</span>
                                <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full ${contributor.color} rounded-full transition-all duration-500`}
                                        style={{ width: `${contributor.score}%` }}
                                    ></div>
                                </div>
                                <span className="w-12 text-sm text-slate-500 text-right">{contributor.score}%</span>
                            </div>
                        ))}
                        {(data?.contributors?.length === 0) && (
                            <p className="text-slate-400 text-sm italic">No activity data yet. Start creating and editing documents!</p>
                        )}
                    </div>
                </div>

                {/* Knowledge Silos Alert */}
                {data?.activePages && data.activePages > 0 && data.totalContributors === 1 && (
                    <div className="p-6 rounded-xl border border-orange-200 bg-orange-50">
                        <h3 className="font-semibold text-orange-900 mb-2">Tip: Invite Collaborators</h3>
                        <p className="text-sm text-orange-800 mb-4">
                            You're working solo! Consider inviting team members to collaborate on your documents for better knowledge sharing.
                        </p>
                        <button className="text-xs font-bold text-orange-700 hover:underline uppercase tracking-wide">Learn More</button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Analytics;