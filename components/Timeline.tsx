import React, { useState, useEffect, useCallback } from 'react';
import { History, FileEdit, MessageSquare, Trash2, Share2, Eye, Loader, Filter, RefreshCw, Calendar, User, X } from 'lucide-react';
import {
    ActivityEvent,
    ActivityType,
    ActivityFilter,
    fetchActivity,
    subscribeToActivity,
    unsubscribeFromActivity,
    formatRelativeTime,
    getActivityByDate,
    getDateLabel
} from '../services/activityService';
import { useAuth } from '../hooks/useAuth';

interface TimelineProps {
    onSelectDocument?: (docId: string) => void;
}

const Timeline: React.FC<TimelineProps> = ({ onSelectDocument }) => {
    const { user } = useAuth();
    const [events, setEvents] = useState<ActivityEvent[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showFilters, setShowFilters] = useState(false);

    // Filter state
    const [filterType, setFilterType] = useState<ActivityType | 'all'>('all');
    const [filterDateRange, setFilterDateRange] = useState<'today' | 'week' | 'month' | 'all'>('all');

    // Load activity with filters
    const loadActivity = useCallback(async () => {
        setIsLoading(true);
        try {
            const filters: ActivityFilter = {};

            if (filterType !== 'all') {
                filters.type = filterType;
            }

            if (filterDateRange !== 'all') {
                const now = new Date();
                const startDate = new Date();

                switch (filterDateRange) {
                    case 'today':
                        startDate.setHours(0, 0, 0, 0);
                        break;
                    case 'week':
                        startDate.setDate(now.getDate() - 7);
                        break;
                    case 'month':
                        startDate.setMonth(now.getMonth() - 1);
                        break;
                }
                filters.startDate = startDate;
            }

            const data = await fetchActivity(100, filters);
            setEvents(data);
        } catch (err) {
            console.error('Error loading activity:', err);
        } finally {
            setIsLoading(false);
        }
    }, [filterType, filterDateRange]);

    // Initial load
    useEffect(() => {
        loadActivity();
    }, [loadActivity]);

    // Real-time subscription
    useEffect(() => {
        const channel = subscribeToActivity((newEvent) => {
            // Add new event at the top
            setEvents(prev => [newEvent, ...prev]);
        });

        return () => {
            unsubscribeFromActivity(channel);
        };
    }, []);

    const getIcon = (type: ActivityType) => {
        switch (type) {
            case 'comment': return <MessageSquare size={14} />;
            case 'share': return <Share2 size={14} />;
            case 'delete': return <Trash2 size={14} />;
            case 'create': return <FileEdit size={14} />;
            case 'view': return <Eye size={14} />;
            default: return <FileEdit size={14} />;
        }
    };

    const getColor = (type: ActivityType): string => {
        switch (type) {
            case 'edit': return 'bg-blue-500';
            case 'comment': return 'bg-green-500';
            case 'share': return 'bg-purple-500';
            case 'create': return 'bg-indigo-500';
            case 'delete': return 'bg-red-500';
            case 'view': return 'bg-slate-400';
            default: return 'bg-slate-500';
        }
    };

    const handleTargetClick = (event: ActivityEvent) => {
        if (event.targetId && event.targetType === 'document' && onSelectDocument) {
            onSelectDocument(event.targetId);
        }
    };

    const clearFilters = () => {
        setFilterType('all');
        setFilterDateRange('all');
    };

    const hasActiveFilters = filterType !== 'all' || filterDateRange !== 'all';
    const groupedEvents = getActivityByDate(events);

    return (
        <div className="flex-1 h-full overflow-y-auto bg-white">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-slate-100 px-12 py-6 z-10">
                <div className="max-w-3xl mx-auto flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                            <History className="text-indigo-600" />
                            Activity Timeline
                        </h1>
                        <p className="text-slate-500 text-sm mt-1">
                            {events.length} activities {hasActiveFilters && '(filtered)'}
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={loadActivity}
                            disabled={isLoading}
                            className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Refresh"
                        >
                            <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
                        </button>
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${showFilters || hasActiveFilters
                                    ? 'bg-indigo-100 text-indigo-700'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                        >
                            <Filter size={16} />
                            Filter
                            {hasActiveFilters && (
                                <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
                            )}
                        </button>
                    </div>
                </div>

                {/* Filter Panel */}
                {showFilters && (
                    <div className="max-w-3xl mx-auto mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                        <div className="flex flex-wrap items-center gap-4">
                            {/* Type Filter */}
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-slate-600">Type:</span>
                                <select
                                    value={filterType}
                                    onChange={(e) => setFilterType(e.target.value as ActivityType | 'all')}
                                    className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                >
                                    <option value="all">All Types</option>
                                    <option value="create">Created</option>
                                    <option value="edit">Edited</option>
                                    <option value="delete">Deleted</option>
                                    <option value="share">Shared</option>
                                    <option value="comment">Comments</option>
                                </select>
                            </div>

                            {/* Date Filter */}
                            <div className="flex items-center gap-2">
                                <Calendar size={16} className="text-slate-400" />
                                <select
                                    value={filterDateRange}
                                    onChange={(e) => setFilterDateRange(e.target.value as typeof filterDateRange)}
                                    className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                >
                                    <option value="all">All Time</option>
                                    <option value="today">Today</option>
                                    <option value="week">Last 7 Days</option>
                                    <option value="month">Last 30 Days</option>
                                </select>
                            </div>

                            {hasActiveFilters && (
                                <button
                                    onClick={clearFilters}
                                    className="flex items-center gap-1 px-2 py-1 text-xs text-slate-500 hover:text-slate-700"
                                >
                                    <X size={14} />
                                    Clear filters
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="px-12 py-8">
                <div className="max-w-3xl mx-auto">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <Loader className="w-8 h-8 animate-spin text-indigo-500" />
                            <p className="text-slate-500 mt-4">Loading activity...</p>
                        </div>
                    ) : events.length === 0 ? (
                        <div className="text-center py-12">
                            <History size={48} className="mx-auto mb-4 text-slate-300" />
                            <h3 className="text-lg font-semibold text-slate-900 mb-2">
                                {hasActiveFilters ? 'No matching activity' : 'No activity yet'}
                            </h3>
                            <p className="text-slate-500">
                                {hasActiveFilters
                                    ? 'Try adjusting your filters to see more results.'
                                    : 'Start creating and editing documents to see your activity here.'
                                }
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {Array.from(groupedEvents.entries()).map(([dateKey, dateEvents]) => (
                                <div key={dateKey}>
                                    {/* Date Header */}
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="text-sm font-semibold text-slate-900">
                                            {getDateLabel(dateKey)}
                                        </div>
                                        <div className="flex-1 h-px bg-slate-200"></div>
                                        <div className="text-xs text-slate-400">
                                            {dateEvents.length} {dateEvents.length === 1 ? 'activity' : 'activities'}
                                        </div>
                                    </div>

                                    {/* Events for this date */}
                                    <div className="relative border-l-2 border-slate-100 ml-3 space-y-6">
                                        {dateEvents.map(event => (
                                            <div key={event.id} className="relative pl-8 group">
                                                {/* Timeline dot */}
                                                <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 border-white shadow-sm ${getColor(event.type)} flex items-center justify-center`}>
                                                    <span className="text-white" style={{ transform: 'scale(0.6)' }}>
                                                        {getIcon(event.type)}
                                                    </span>
                                                </div>

                                                <div className="bg-white border border-slate-100 rounded-lg p-4 hover:border-slate-200 hover:shadow-sm transition-all">
                                                    <div className="flex items-start gap-3">
                                                        {/* Avatar */}
                                                        {event.userAvatar ? (
                                                            <img
                                                                src={event.userAvatar}
                                                                alt={event.userName}
                                                                className="w-8 h-8 rounded-full"
                                                            />
                                                        ) : (
                                                            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 text-xs font-bold">
                                                                {event.userName.charAt(0).toUpperCase()}
                                                            </div>
                                                        )}

                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <span className="font-semibold text-slate-900">
                                                                    {user?.id === event.userId ? 'You' : event.userName}
                                                                </span>
                                                                <span className="text-slate-500">{event.action}</span>
                                                                <button
                                                                    onClick={() => handleTargetClick(event)}
                                                                    className={`font-medium text-indigo-600 truncate max-w-[200px] ${event.targetId ? 'hover:underline cursor-pointer' : ''
                                                                        }`}
                                                                >
                                                                    {event.target}
                                                                </button>
                                                            </div>

                                                            {event.details && (
                                                                <p className="text-sm text-slate-600 mt-1 line-clamp-2">
                                                                    {event.details}
                                                                </p>
                                                            )}

                                                            <div className="text-xs text-slate-400 mt-2">
                                                                {formatRelativeTime(event.createdAt)}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Timeline;