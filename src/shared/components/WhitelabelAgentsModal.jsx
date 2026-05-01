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
                  <th className="px-4 py-3 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {agents.map((agent, i) => (
                  <tr key={i} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-gray-900">{agent.name}</div>
                      <div className="text-xs text-gray-500">{agent.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-md bg-gray-100 px-2 py-0.5 font-mono text-xs text-gray-700">
                        {agent.agentCode}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex flex-col items-end gap-0.5 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(agent.whitelabeledAt).toLocaleDateString()}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Modal>
  )
}
