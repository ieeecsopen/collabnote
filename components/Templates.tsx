import React from 'react';
import { Layout, Calendar, Bug, BookOpen, Rocket, Target, Users } from 'lucide-react';
import { Block } from '../types';

interface Template {
    id: string;
    title: string;
    description: string;
    icon: React.ReactNode;
    blocks: Block[];
}

const TEMPLATES: Template[] = [
    {
        id: 'meeting-notes',
        title: 'Meeting Notes',
        description: 'Capture agenda, attendees, and action items efficiently.',
        icon: <BookOpen className="text-blue-500" size={24} />,
        blocks: [
             { id: 't1', type: 'heading-1', content: 'Meeting Notes' },
             { id: 't2', type: 'heading-2', content: 'Attendees' },
             { id: 't3', type: 'bullet-list', content: '@User1' },
             { id: 't4', type: 'heading-2', content: 'Agenda' },
             { id: 't5', type: 'bullet-list', content: 'Topic 1' },
             { id: 't6', type: 'heading-2', content: 'Action Items' },
             { id: 't7', type: 'number-list', content: 'Task 1' },
        ]
    },
    {
        id: 'product-roadmap',
        title: 'Product Roadmap',
        description: 'Track quarterly milestones and feature releases.',
        icon: <Calendar className="text-purple-500" size={24} />,
        blocks: [
             { id: 'r1', type: 'heading-1', content: 'Q4 Product Roadmap' },
             { id: 'r2', type: 'heading-2', content: 'Goals' },
             { id: 'r3', type: 'paragraph', content: 'Define the key objectives for this quarter.' },
             { id: 'r4', type: 'heading-2', content: 'Timeline' },
             { id: 'r5', type: 'bullet-list', content: 'Month 1: Research & Design' },
             { id: 'r6', type: 'bullet-list', content: 'Month 2: Development' },
             { id: 'r7', type: 'bullet-list', content: 'Month 3: QA & Launch' },
        ]
    },
    {
        id: 'bug-tracker',
        title: 'Bug Tracker',
        description: 'Log, prioritize, and squash bugs with your team.',
        icon: <Bug className="text-red-500" size={24} />,
        blocks: [
             { id: 'b1', type: 'heading-1', content: 'Bug Tracker' },
             { id: 'b2', type: 'quote', content: 'If it is not tested, it is broken.' },
             { id: 'b3', type: 'heading-2', content: 'High Priority' },
             { id: 'b4', type: 'number-list', content: '[CRITICAL] Login page timeout' },
             { id: 'b5', type: 'heading-2', content: 'Backlog' },
             { id: 'b6', type: 'bullet-list', content: 'Fix typo in footer' },
        ]
    },
    {
        id: 'project-plan',
        title: 'Project Plan',
        description: 'Define scope, resources, and deliverables.',
        icon: <Rocket className="text-orange-500" size={24} />,
        blocks: [
             { id: 'p1', type: 'heading-1', content: 'Project Phoenix' },
             { id: 'p2', type: 'heading-2', content: 'Overview' },
             { id: 'p3', type: 'paragraph', content: 'Brief description of the project...' },
             { id: 'p4', type: 'heading-2', content: 'Success Metrics' },
             { id: 'p5', type: 'bullet-list', content: 'Increase user retention by 5%' },
        ]
    },
     {
        id: 'okrs',
        title: 'Company OKRs',
        description: 'Objectives and Key Results framework.',
        icon: <Target className="text-green-500" size={24} />,
        blocks: [
             { id: 'o1', type: 'heading-1', content: 'FY24 OKRs' },
             { id: 'o2', type: 'heading-2', content: 'Objective 1' },
             { id: 'o3', type: 'paragraph', content: 'Become the market leader in...' },
             { id: 'o4', type: 'heading-3', content: 'Key Result 1' },
             { id: 'o5', type: 'paragraph', content: 'Achieve $1M ARR.' },
        ]
    },
    {
        id: 'team-home',
        title: 'Team Home',
        description: 'Central wiki for team processes and links.',
        icon: <Users className="text-indigo-500" size={24} />,
        blocks: [
             { id: 'h1', type: 'heading-1', content: 'Engineering Team Home' },
             { id: 'h2', type: 'heading-2', content: 'Quick Links' },
             { id: 'h3', type: 'bullet-list', content: 'Jira Dashboard' },
             { id: 'h4', type: 'bullet-list', content: 'GitHub Repos' },
             { id: 'h5', type: 'heading-2', content: 'Team Members' },
             { id: 'h6', type: 'paragraph', content: 'List team members and roles here.' },
        ]
    }
];

interface TemplatesProps {
    onUseTemplate: (blocks: Block[], title: string) => void;
}

const Templates: React.FC<TemplatesProps> = ({ onUseTemplate }) => {
    return (
        <div className="flex-1 h-screen overflow-y-auto bg-slate-50/50">
            <div className="max-w-6xl mx-auto px-8 py-12">
                <div className="mb-8">
                    <h1 className="text-2xl font-semibold text-slate-900">Template Gallery</h1>
                    <p className="text-slate-500 mt-1 text-sm">Choose a template to jumpstart your next project.</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {TEMPLATES.map(template => (
                        <div 
                            key={template.id} 
                            className="bg-white p-6 rounded-xl border border-slate-200 hover:border-slate-400 hover:shadow-md transition-all cursor-pointer group flex flex-col h-full" 
                            onClick={() => onUseTemplate(template.blocks, template.title)}
                        >
                            <div className="mb-4 p-2.5 bg-slate-50 rounded-lg w-fit border border-slate-100">
                                {template.icon}
                            </div>
                            <h3 className="font-semibold text-slate-900 mb-2">{template.title}</h3>
                            <p className="text-sm text-slate-500 mb-6 flex-1 leading-relaxed">{template.description}</p>
                            <button className="text-sm font-medium text-slate-900 hover:underline inline-flex items-center gap-1 mt-auto group-hover:translate-x-1 transition-transform">
                                Use template <Layout size={14} />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default Templates;