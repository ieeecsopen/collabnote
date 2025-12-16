import { supabase } from './supabase';
import { Block } from '../types';

export interface Template {
    id: string;
    name: string;
    description: string;
    icon: string;
    category: string;
    blocks: Block[];
}

// Fetch all templates
export const fetchTemplates = async (): Promise<Template[]> => {
    const { data, error } = await supabase
        .from('templates')
        .select('*')
        .order('category', { ascending: true });

    if (error) {
        console.error('Error fetching templates:', error);
        return getDefaultTemplates();
    }

    return (data || []).map(t => ({
        id: t.id,
        name: t.name,
        description: t.description || '',
        icon: t.icon || '📄',
        category: t.category || 'General',
        blocks: typeof t.blocks === 'string' ? JSON.parse(t.blocks) : t.blocks || [],
    }));
};

// Get templates by category
export const getTemplatesByCategory = async (category: string): Promise<Template[]> => {
    const templates = await fetchTemplates();
    return templates.filter(t => t.category === category);
};

// Create custom template
export const createTemplate = async (
    name: string,
    description: string,
    icon: string,
    blocks: Block[],
    category: string = 'Custom'
): Promise<Template | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
        .from('templates')
        .insert({
            name,
            description,
            icon,
            category,
            blocks,
            created_by: user.id,
            is_public: false
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating template:', error);
        return null;
    }

    return {
        id: data.id,
        name: data.name,
        description: data.description || '',
        icon: data.icon || '📄',
        category: data.category || 'Custom',
        blocks: data.blocks || [],
    };
};

// Fallback templates if DB not available
const getDefaultTemplates = (): Template[] => [
    {
        id: 'default-1',
        name: 'Blank Document',
        description: 'Start with a clean slate',
        icon: '📄',
        category: 'General',
        blocks: [{ id: '1', type: 'heading-1', content: '' }]
    },
    {
        id: 'default-2',
        name: 'Meeting Notes',
        description: 'Capture meeting discussions',
        icon: '📝',
        category: 'Work',
        blocks: [
            { id: '1', type: 'heading-1', content: 'Meeting Notes' },
            { id: '2', type: 'heading-2', content: 'Attendees' },
            { id: '3', type: 'bullet-list', content: '' },
            { id: '4', type: 'heading-2', content: 'Action Items' },
            { id: '5', type: 'bullet-list', content: '' },
        ]
    },
    {
        id: 'default-3',
        name: 'Project Brief',
        description: 'Define project scope',
        icon: '🎯',
        category: 'Work',
        blocks: [
            { id: '1', type: 'heading-1', content: 'Project Brief' },
            { id: '2', type: 'heading-2', content: 'Overview' },
            { id: '3', type: 'paragraph', content: '' },
            { id: '4', type: 'heading-2', content: 'Goals' },
            { id: '5', type: 'bullet-list', content: '' },
        ]
    }
];
