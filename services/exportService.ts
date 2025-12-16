import { supabase } from './supabase';
import { Document, Block } from '../types';

// Get storage stats
export const getStorageStats = async (): Promise<{ totalBytes: number; documentCount: number; }> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { totalBytes: 0, documentCount: 0 };

    const { data, error, count } = await supabase
        .from('documents')
        .select('content', { count: 'exact' })
        .eq('owner_id', user.id)
        .is('deleted_at', null);

    if (error) return { totalBytes: 0, documentCount: 0 };

    // Calculate approximate size
    const totalBytes = (data || []).reduce((acc, doc) => {
        return acc + JSON.stringify(doc.content || {}).length;
    }, 0);

    return { totalBytes, documentCount: count || 0 };
};

// Format bytes to human readable
export const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

// Export documents as JSON
export const exportAsJSON = async (): Promise<string> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('owner_id', user.id)
        .is('deleted_at', null);

    if (error) throw error;

    const exportData = {
        exportedAt: new Date().toISOString(),
        userId: user.id,
        documents: data || []
    };

    return JSON.stringify(exportData, null, 2);
};

// Export single document as Markdown
export const exportDocumentAsMarkdown = (title: string, blocks: Block[]): string => {
    let markdown = `# ${title}\n\n`;

    for (const block of blocks) {
        const content = block.content.replace(/<[^>]*>/g, ''); // Strip HTML

        switch (block.type) {
            case 'heading-1':
                markdown += `# ${content}\n\n`;
                break;
            case 'heading-2':
                markdown += `## ${content}\n\n`;
                break;
            case 'heading-3':
                markdown += `### ${content}\n\n`;
                break;
            case 'bullet-list':
                markdown += `- ${content}\n`;
                break;
            case 'number-list':
                markdown += `1. ${content}\n`;
                break;
            case 'quote':
                markdown += `> ${content}\n\n`;
                break;
            case 'code':
                markdown += `\`\`\`\n${content}\n\`\`\`\n\n`;
                break;
            case 'divider':
                markdown += `---\n\n`;
                break;
            default:
                markdown += `${content}\n\n`;
        }
    }

    return markdown;
};

// Export all documents as Markdown
export const exportAllAsMarkdown = async (): Promise<string> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('owner_id', user.id)
        .is('deleted_at', null);

    if (error) throw error;

    let fullExport = `# CollabNote Export\n\nExported: ${new Date().toLocaleString()}\n\n---\n\n`;

    for (const doc of data || []) {
        const blocks = doc.content?.blocks || [];
        fullExport += exportDocumentAsMarkdown(doc.title || 'Untitled', blocks);
        fullExport += '\n---\n\n';
    }

    return fullExport;
};

// Download file helper
export const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

// Delete all user data
export const deleteAllUserData = async (): Promise<void> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Delete all documents (cascade will handle related data)
    await supabase
        .from('documents')
        .delete()
        .eq('owner_id', user.id);

    // Delete user settings
    await supabase
        .from('user_settings')
        .delete()
        .eq('user_id', user.id);

    // Delete profile
    await supabase
        .from('profiles')
        .delete()
        .eq('id', user.id);

    // Sign out and delete auth user
    await supabase.auth.signOut();
};
