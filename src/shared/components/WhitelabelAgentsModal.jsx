import Modal from '@/shared/components/Modal.jsx'
import { User, Calendar, ExternalLink } from 'lucide-react'

export default function WhitelabelAgentsModal({ isOpen, onClose, agents = [], title = 'Whitelabel Agents' }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="md">
      <div className="space-y-4">
        {agents.length === 0 ? (
          <div className="py-10 text-center">
            <User className="mx-auto h-12 w-12 text-gray-300" strokeWidth={1} />
            <p className="mt-2 text-sm text-gray-500">No agents have whitelabeled this package yet.</p>
          </div>
        ) : (
          <div className="max-h-[400px] overflow-y-auto rounded-xl border border-gray-100 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-gray-50 text-[11px] font-bold uppercase tracking-wider text-gray-500 ring-1 ring-gray-100">
                <tr>
                  <th className="px-4 py-3">Agent</th>
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3 _text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {agents.map((agent, index) => {
                  const user = agent.createdBy || agent;
                  const dateStr = agent.whitelabeledAt || agent.createdAt || user.createdAt;
                  
                  return (
                    <tr key={agent._id || index} className="group transition hover:bg-gray-50/50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-700 font-bold">
                            {(user.name || 'A').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-900">{user.name}</p>
                            <p className="text-xs text-gray-500">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-bold font-mono text-gray-700 ring-1 ring-inset ring-gray-200">
                          {user.agentCode}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                          <Calendar className="h-3.5 w-3.5" />
                          {dateStr ? new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Modal>
  )
}
