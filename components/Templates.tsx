import React, { useState, useEffect } from 'react';
import { FileText, Briefcase, User, Loader, Plus, X, Sparkles } from 'lucide-react';
import { Block } from '../types';
import { Template, fetchTemplates, createTemplate } from '../services/templateService';

interface TemplatesProps {
    onUseTemplate: (blocks: Block[], title: string) => void;
    currentBlocks?: Block[]; // For saving current doc as template
}

const Templates: React.FC<TemplatesProps> = ({ onUseTemplate, currentBlocks }) => {
    const [templates, setTemplates] = useState<Template[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState<string>('All');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newTemplate, setNewTemplate] = useState({ name: '', description: '', icon: '📄', category: 'Custom' });
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        loadTemplates();
    }, []);

    const loadTemplates = async () => {
        setIsLoading(true);
        const t = await fetchTemplates();
        setTemplates(t);
        setIsLoading(false);
    };

    const handleCreateTemplate = async () => {
        if (!newTemplate.name.trim() || !currentBlocks) return;

        setIsCreating(true);
        const template = await createTemplate(
            newTemplate.name,
            newTemplate.description,
            newTemplate.icon,
            currentBlocks,
            newTemplate.category
        );

        if (template) {
            setTemplates([template, ...templates]);
        }

        setIsCreating(false);
        setShowCreateModal(false);
        setNewTemplate({ name: '', description: '', icon: '📄', category: 'Custom' });
    };

    const categories = ['All', ...new Set(templates.map(t => t.category))];

    const filteredTemplates = activeCategory === 'All'
        ? templates
        : templates.filter(t => t.category === activeCategory);

    const getCategoryIcon = (category: string) => {
        switch (category) {
            case 'Work': return <Briefcase size={16} />;
            case 'Personal': return <User size={16} />;
            case 'Custom': return <Sparkles size={16} />;
            default: return <FileText size={16} />;
        }
    };

    const iconOptions = ['📄', '📝', '📋', '📊', '🎯', '💡', '🔬', '📅', '✅', '💼', '🏠', '🎨'];

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
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 mb-2">Templates</h1>
                        <p className="text-slate-500">Start from a proven structure to save time.</p>
                    </div>
                    {currentBlocks && currentBlocks.length > 0 && (
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
                        >
                            <Plus size={16} />
                            Save as Template
                        </button>
                    )}
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

            {/* Create Template Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowCreateModal(false)}>
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-semibold text-slate-900">Save as Template</h2>
                            <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                                <input
                                    type="text"
                                    value={newTemplate.name}
                                    onChange={e => setNewTemplate({ ...newTemplate, name: e.target.value })}
                                    placeholder="My Template"
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                                <textarea
                                    value={newTemplate.description}
                                    onChange={e => setNewTemplate({ ...newTemplate, description: e.target.value })}
                                    placeholder="What is this template for?"
                                    rows={2}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 resize-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Icon</label>
                                <div className="flex flex-wrap gap-2">
                                    {iconOptions.map(icon => (
                                        <button
                                            key={icon}
                                            onClick={() => setNewTemplate({ ...newTemplate, icon })}
                                            className={`w-10 h-10 rounded-lg border-2 text-xl flex items-center justify-center transition-all ${newTemplate.icon === icon
                                                    ? 'border-indigo-500 bg-indigo-50'
                                                    : 'border-slate-200 hover:border-slate-300'
                                                }`}
                                        >
                                            {icon}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                                <select
                                    value={newTemplate.category}
                                    onChange={e => setNewTemplate({ ...newTemplate, category: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300"
                                >
                                    <option value="Custom">Custom</option>
                                    <option value="Work">Work</option>
                                    <option value="Personal">Personal</option>
                                    <option value="General">General</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateTemplate}
                                disabled={!newTemplate.name.trim() || isCreating}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
                            >
                                {isCreating ? 'Saving...' : 'Save Template'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Templates;