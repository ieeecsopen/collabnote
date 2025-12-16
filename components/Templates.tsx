import React, { useState, useEffect } from 'react';
import { FileText, Briefcase, User, Loader } from 'lucide-react';
import { Block } from '../types';
import { Template, fetchTemplates } from '../services/templateService';

interface TemplatesProps {
    onUseTemplate: (blocks: Block[], title: string) => void;
}

const Templates: React.FC<TemplatesProps> = ({ onUseTemplate }) => {
    const [templates, setTemplates] = useState<Template[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState<string>('All');

    useEffect(() => {
        loadTemplates();
    }, []);

    const loadTemplates = async () => {
        setIsLoading(true);
        const t = await fetchTemplates();
        setTemplates(t);
        setIsLoading(false);
    };

    const categories = ['All', ...new Set(templates.map(t => t.category))];

    const filteredTemplates = activeCategory === 'All'
        ? templates
        : templates.filter(t => t.category === activeCategory);

    const getCategoryIcon = (category: string) => {
        switch (category) {
            case 'Work': return <Briefcase size={16} />;
            case 'Personal': return <User size={16} />;
            default: return <FileText size={16} />;
        }
    };

    if (isLoading) {
        return (
            <div className="flex-1 h-full flex items-center justify-center bg-white">
                <Loader className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
        );
    }

    return (
        <div className="flex-1 h-full overflow-y-auto bg-white scroll-smooth p-12">
            <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-slate-900 mb-2">Templates</h1>
                    <p className="text-slate-500">Start from a proven structure to save time.</p>
                </div>

                {/* Category Tabs */}
                <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${activeCategory === cat
                                    ? 'bg-slate-900 text-white'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* Template Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredTemplates.map(template => (
                        <div
                            key={template.id}
                            className="group p-6 rounded-xl border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer bg-white"
                            onClick={() => onUseTemplate(
                                template.blocks.map(b => ({ ...b, id: crypto.randomUUID() })),
                                template.name
                            )}
                        >
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                                    {template.icon}
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                                        {template.name}
                                    </h3>
                                    <p className="text-sm text-slate-500 mt-1">{template.description}</p>
                                    <div className="flex items-center gap-2 mt-3">
                                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 rounded-md text-xs text-slate-600">
                                            {getCategoryIcon(template.category)}
                                            {template.category}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {filteredTemplates.length === 0 && (
                    <div className="text-center py-12">
                        <p className="text-slate-400">No templates found in this category.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Templates;