import React, { useState, useEffect } from 'react';
import { CollaboratorCursor } from '../hooks/useCollaboration';

interface PresenceBarProps {
    currentUser: { id: string; name: string; avatar: string } | null;
    collaborators: CollaboratorCursor[];
    maxVisible?: number;
}

/**
 * Presence Bar - Shows avatars of all users in the document
 */
export const PresenceBar: React.FC<PresenceBarProps> = ({
    currentUser,
    collaborators,
    maxVisible = 5
}) => {
    const allUsers = currentUser
        ? [{ ...currentUser, color: '#6366f1', isCurrentUser: true }, ...collaborators.map(c => ({ ...c, isCurrentUser: false }))]
        : collaborators.map(c => ({ ...c, isCurrentUser: false }));

    const visibleUsers = allUsers.slice(0, maxVisible);
    const overflowCount = allUsers.length - maxVisible;

    return (
        <div className="flex items-center -space-x-2">
            {visibleUsers.map((user) => (
                <div key={user.id} className="relative group">
                    <div
                        className="w-8 h-8 rounded-full border-2 border-white shadow-sm overflow-hidden transition-transform hover:scale-110 hover:z-10"
                        style={{ borderColor: user.isCurrentUser ? '#10b981' : user.color }}
                    >
                        <img
                            src={user.avatar}
                            alt={user.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                                (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=${user.color?.slice(1) || '6366f1'}&color=fff`;
                            }}
                        />
                    </div>

                    {/* Online indicator */}
                    {!user.isCurrentUser && (
                        <div
                            className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white"
                            style={{ backgroundColor: user.color }}
                        />
                    )}

                    {/* Tooltip */}
                    <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                        {user.name} {user.isCurrentUser && '(you)'}
                    </div>
                </div>
            ))}

            {overflowCount > 0 && (
                <div className="w-8 h-8 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-xs font-medium text-slate-600 shadow-sm">
                    +{overflowCount}
                </div>
            )}
        </div>
    );
};

interface LiveCursorProps {
    collaborator: CollaboratorCursor;
    containerRef: React.RefObject<HTMLElement>;
}

/**
 * Live Cursor - Shows a colored caret with name tag for a collaborator
 */
export const LiveCursor: React.FC<LiveCursorProps> = ({ collaborator, containerRef }) => {
    const [position, setPosition] = useState<{ x: number; y: number } | null>(null);

    useEffect(() => {
        if (!collaborator.position || !containerRef.current) {
            setPosition(null);
            return;
        }

        // Find the block element
        const blockEl = containerRef.current.querySelector(`[data-block-id="${collaborator.position.blockId}"]`);
        if (!blockEl) {
            setPosition(null);
            return;
        }

        const rect = blockEl.getBoundingClientRect();
        const containerRect = containerRef.current.getBoundingClientRect();

        // Calculate approximate position based on offset
        // This is a simplified calculation - real implementation would use Range API
        const charWidth = 8; // Approximate character width
        const xOffset = Math.min(collaborator.position.offset * charWidth, rect.width - 20);

        setPosition({
            x: rect.left - containerRect.left + xOffset,
            y: rect.top - containerRect.top
        });
    }, [collaborator.position, containerRef]);

    if (!position) return null;

    return (
        <div
            className="absolute pointer-events-none transition-all duration-150 ease-out z-40"
            style={{ left: position.x, top: position.y }}
        >
            {/* Cursor caret */}
            <div
                className="w-0.5 h-5 rounded-full animate-pulse"
                style={{ backgroundColor: collaborator.color }}
            />

            {/* Name tag */}
            <div
                className="absolute -top-5 left-0 px-1.5 py-0.5 rounded text-[10px] font-medium text-white whitespace-nowrap shadow-sm"
                style={{ backgroundColor: collaborator.color }}
            >
                {collaborator.name}
            </div>
        </div>
    );
};

interface LiveCursorsContainerProps {
    collaborators: CollaboratorCursor[];
    containerRef: React.RefObject<HTMLElement>;
}

/**
 * Container for all live cursors in the editor
 */
export const LiveCursorsContainer: React.FC<LiveCursorsContainerProps> = ({
    collaborators,
    containerRef
}) => {
    // Only show cursors for collaborators with positions
    const cursorsWithPositions = collaborators.filter(c => c.position);

    return (
        <>
            {cursorsWithPositions.map((collaborator) => (
                <LiveCursor
                    key={collaborator.id}
                    collaborator={collaborator}
                    containerRef={containerRef}
                />
            ))}
        </>
    );
};

interface CollaboratorSelectionProps {
    collaborator: CollaboratorCursor;
    blockRef: React.RefObject<HTMLElement>;
}

/**
 * Highlight for collaborator's text selection
 */
export const CollaboratorSelection: React.FC<CollaboratorSelectionProps> = ({
    collaborator,
    blockRef
}) => {
    if (!collaborator.selection || !blockRef.current) return null;

    const { anchor, head } = collaborator.selection;
    const start = Math.min(anchor, head);
    const end = Math.max(anchor, head);

    // This would need more complex implementation with Range API
    // For now, just show a highlight indicator
    return (
        <div
            className="absolute inset-0 pointer-events-none opacity-20 rounded"
            style={{ backgroundColor: collaborator.color }}
        />
    );
};

export default { PresenceBar, LiveCursor, LiveCursorsContainer, CollaboratorSelection };
