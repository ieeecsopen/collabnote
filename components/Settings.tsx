import React, { useState } from 'react';
import { Monitor, Moon, User, Bell, Mail, Shield, Users, Building, LogOut, Check } from 'lucide-react';

type SettingsTab = 'profile' | 'workspace' | 'members' | 'security';

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [members, setMembers] = useState([
      { id: 1, name: 'Alice Chen', email: 'alice@collabnote.com', role: 'Owner', avatar: 'https://picsum.photos/200?1' },
      { id: 2, name: 'Bob Smith', email: 'bob@collabnote.com', role: 'Editor', avatar: 'https://picsum.photos/200?2' },
      { id: 3, name: 'Charlie Kim', email: 'charlie@collabnote.com', role: 'Viewer', avatar: 'https://picsum.photos/200?3' },
  ]);

  const navItemClass = (tab: SettingsTab) => `w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === tab ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`;

  const renderContent = () => {
      switch(activeTab) {
          case 'profile':
              return (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="pb-4 border-b border-slate-100">
                        <h2 className="text-xl font-bold text-slate-900">Profile Settings</h2>
                        <p className="text-sm text-slate-500 mt-1">Manage your public profile and preferences.</p>
                    </div>
                    
                    <div className="flex items-start gap-6">
                         <div className="relative group cursor-pointer">
                            <img src="https://picsum.photos/200?1" alt="Profile" className="w-20 h-20 rounded-full object-cover border-4 border-slate-50 shadow-sm" />
                            <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="text-xs text-white font-medium">Change</span>
                            </div>
                        </div>
                        <div className="flex-1 space-y-4">
                             <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">First Name</label>
                                    <input type="text" defaultValue="Alice" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10" />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">Last Name</label>
                                    <input type="text" defaultValue="Chen" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10" />
                                </div>
                             </div>
                             <div>
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">Bio</label>
                                <textarea className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 h-24 resize-none" defaultValue="Product Designer @ CollabNote." />
                             </div>
                        </div>
                    </div>
                     <div className="flex justify-end pt-4">
                        <button className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors">Save Changes</button>
                    </div>
                </div>
              );
          
          case 'members':
               return (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="pb-4 border-b border-slate-100 flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">Workspace Members</h2>
                            <p className="text-sm text-slate-500 mt-1">Manage access and roles for your team.</p>
                        </div>
                        <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2">
                            <Mail size={16} /> Invite
                        </button>
                    </div>

                    <div className="space-y-2">
                        {members.map(member => (
                            <div key={member.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-slate-200 hover:shadow-sm transition-all bg-white">
                                <div className="flex items-center gap-3">
                                    <img src={member.avatar} className="w-10 h-10 rounded-full" alt={member.name} />
                                    <div>
                                        <p className="text-sm font-medium text-slate-900">{member.name}</p>
                                        <p className="text-xs text-slate-500">{member.email}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${member.role === 'Owner' ? 'bg-purple-50 text-purple-700' : 'bg-slate-100 text-slate-600'}`}>
                                        {member.role}
                                    </span>
                                    {member.role !== 'Owner' && (
                                        <button className="text-slate-400 hover:text-red-600 p-1">
                                            <LogOut size={16} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
               );

          case 'workspace':
              return (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="pb-4 border-b border-slate-100">
                        <h2 className="text-xl font-bold text-slate-900">Workspace Settings</h2>
                        <p className="text-sm text-slate-500 mt-1">Configure your team environment.</p>
                    </div>
                    
                     <div>
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">Workspace Name</label>
                        <input type="text" defaultValue="CollabNote Team" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10" />
                    </div>

                    <div>
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">Workspace Icon</label>
                        <div className="flex items-center gap-4">
                             <div className="w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-md">C</div>
                             <button className="text-sm text-slate-600 hover:text-slate-900 font-medium">Remove</button>
                             <button className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">Upload new</button>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-slate-100">
                        <h3 className="text-sm font-medium text-red-600 mb-2">Danger Zone</h3>
                         <div className="p-4 bg-red-50 rounded-lg border border-red-100 flex items-center justify-between">
                             <div>
                                 <p className="text-sm font-medium text-red-900">Delete Workspace</p>
                                 <p className="text-xs text-red-700 mt-0.5">This action cannot be undone. All documents will be lost.</p>
                             </div>
                             <button className="px-3 py-1.5 bg-white border border-red-200 text-red-600 text-xs font-medium rounded hover:bg-red-50 transition-colors">Delete</button>
                         </div>
                    </div>
                  </div>
              );

          case 'security':
              return (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <div className="pb-4 border-b border-slate-100">
                        <h2 className="text-xl font-bold text-slate-900">Security & Access</h2>
                        <p className="text-sm text-slate-500 mt-1">Manage passwords and 2FA.</p>
                    </div>
                    
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 border border-slate-200 rounded-xl">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-slate-100 rounded-lg text-slate-600"><Lock size={18} /></div>
                                <div>
                                    <p className="text-sm font-medium text-slate-900">Password</p>
                                    <p className="text-xs text-slate-500">Last changed 3 months ago</p>
                                </div>
                            </div>
                             <button className="text-sm text-slate-600 hover:text-slate-900 font-medium border border-slate-200 px-3 py-1.5 rounded-lg">Change</button>
                        </div>

                         <div className="flex items-center justify-between p-4 border border-slate-200 rounded-xl">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-slate-100 rounded-lg text-slate-600"><Shield size={18} /></div>
                                <div>
                                    <p className="text-sm font-medium text-slate-900">Two-Factor Authentication</p>
                                    <p className="text-xs text-slate-500">Secure your account with 2FA</p>
                                </div>
                            </div>
                             <button className="text-sm text-slate-600 hover:text-slate-900 font-medium border border-slate-200 px-3 py-1.5 rounded-lg">Enable</button>
                        </div>
                    </div>
                  </div>
              )

          default: return null;
      }
  };

  return (
    <div className="flex h-full bg-white">
      {/* Settings Sidebar */}
      <div className="w-64 border-r border-slate-100 p-6 flex flex-col">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 px-3">Account</h2>
          <div className="space-y-0.5 mb-8">
              <button onClick={() => setActiveTab('profile')} className={navItemClass('profile')}>
                  <div className="flex items-center gap-2"><User size={16} /> Profile</div>
              </button>
              <button onClick={() => setActiveTab('security')} className={navItemClass('security')}>
                   <div className="flex items-center gap-2"><Shield size={16} /> Security</div>
              </button>
          </div>
          
           <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 px-3">Workspace</h2>
           <div className="space-y-0.5">
              <button onClick={() => setActiveTab('workspace')} className={navItemClass('workspace')}>
                  <div className="flex items-center gap-2"><Building size={16} /> General</div>
              </button>
              <button onClick={() => setActiveTab('members')} className={navItemClass('members')}>
                  <div className="flex items-center gap-2"><Users size={16} /> Members</div>
              </button>
          </div>

          <div className="mt-auto">
               <button className="w-full text-left px-3 py-2 rounded-md text-sm font-medium text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2">
                   <LogOut size={16} /> Log Out
               </button>
          </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto py-12 px-12">
            {renderContent()}
          </div>
      </div>
    </div>
  )
}
export default Settings;

function Lock(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  )
}