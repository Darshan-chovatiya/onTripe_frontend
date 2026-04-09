import { Ticket, Clock, FileText, Eye, Download, X } from 'lucide-react'
import Modal from '@/shared/components/Modal.jsx'

const BASE_IMG_URL = import.meta.env.VITE_API_BASE_URL?.replace('/api', '').replace(/\/$/, '') || 'http://localhost:5001'
const getFullUrl = (path) => path ? `${BASE_IMG_URL}/${path.replace(/\\/g, '/')}` : null

export default function TicketsModal({ isOpen, onClose, tickets = [] }) {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Your Travel Tickets"
            size="lg"
        >
            <div className="space-y-6">
                {!tickets || tickets.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-4">
                            <Ticket className="text-gray-300" size={32} />
                        </div>
                        <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">No tickets uploaded yet</p>
                        <p className="text-gray-400 text-xs mt-1">Check back later or contact your agent.</p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {tickets.map((ticket, idx) => {
                            const url = getFullUrl(ticket.fileUrl)
                            const isImage = /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(ticket.fileUrl || '')

                            return (
                                <div key={idx} className="flex flex-col sm:flex-row items-center gap-6 p-5 rounded-3xl bg-gray-50 border border-gray-100 group transition-all hover:bg-white hover:shadow-xl hover:shadow-gray-200/50">
                                    {/* Preview */}
                                    <div className="w-full sm:w-24 h-24 rounded-2xl overflow-hidden bg-white border border-gray-100 flex items-center justify-center shrink-0">
                                        {isImage ? (
                                            <img src={url} alt={ticket.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="flex flex-col items-center gap-2 text-primary-300">
                                                <FileText size={32} />
                                                <span className="text-[8px] font-black uppercase tracking-widest">PDF DOCUMENT</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Details */}
                                    <div className="flex-1 text-center sm:text-left">
                                        <h4 className="text-xl font-black text-gray-900 group-hover:text-primary-600 transition-colors">{ticket.name}</h4>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mt-1 flex items-center justify-center sm:justify-start gap-2">
                                            <Clock size={12} />
                                            Issued on {new Date(ticket.uploadedAt).toLocaleDateString()}
                                        </p>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-3 w-full sm:w-auto mt-4 sm:mt-0">
                                        <a
                                            href={url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-white border border-gray-100 text-gray-700 font-black text-xs uppercase tracking-widest hover:text-primary-600 hover:border-primary-200 transition-all active:scale-95 shadow-sm"
                                        >
                                            <Eye size={16} /> View
                                        </a>
                                        <a
                                            href={url}
                                            download
                                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-primary-600 text-white font-black text-xs uppercase tracking-widest hover:bg-primary-700 transition-all active:scale-95 shadow-lg shadow-primary-100"
                                        >
                                            <Download size={16} /> Download
                                        </a>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </Modal>
    )
}
