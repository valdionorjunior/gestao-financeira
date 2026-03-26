import React, { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Upload, FileText, CheckCircle, XCircle, Clock } from 'lucide-react';
import { accountsService } from '../services/finance.service';
import api from '../services/api';

export default function BankStatementsPage() {
  const [uploading, setUploading] = useState(false);
  const [accountId, setAccountId] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: accounts = [] } = useQuery({ queryKey: ['accounts'], queryFn: accountsService.list });
  const [statements, setStatements] = useState<any[]>([]);

  const handleUpload = async (file: File) => {
    if (!accountId) { toast.error('Selecione uma conta.'); return; }
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    try {
      const { data } = await api.post(`/bank-statements/import/${accountId}`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setStatements(prev => [data.statement, ...prev]);
      toast.success(`${data.itemCount} transações importadas!`);
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'Erro ao importar.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Extrato Bancário</h1>
        <p className="text-sm text-gray-500">Importe extratos OFX ou CSV para conciliar</p>
      </div>

      {/* Upload zone */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-base font-semibold text-gray-700 mb-4">Importar Extrato</h2>
        <div className="flex flex-col sm:flex-row items-start gap-4">
          <div className="flex-1">
            <label className="text-sm font-medium text-gray-700 mb-1 block">Conta *</label>
            <select
              value={accountId}
              onChange={e => setAccountId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="">Selecione a conta</option>
              {accounts.map((a: any) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          <div className="sm:pt-6">
            <input
              ref={inputRef}
              type="file"
              accept=".ofx,.csv"
              className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f); }}
            />
            <button
              onClick={() => inputRef.current?.click()}
              disabled={uploading || !accountId}
              className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:opacity-90 transition disabled:opacity-50"
            >
              <Upload className="w-4 h-4" />
              {uploading ? 'Importando...' : 'Selecionar arquivo'}
            </button>
            <p className="text-xs text-gray-400 mt-1.5 text-center">OFX ou CSV · máx. 10MB</p>
          </div>
        </div>
      </div>

      {/* Imported statements */}
      {statements.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-700">Extratos Importados (sessão)</h2>
          </div>
          <ul className="divide-y divide-gray-50">
            {statements.map((s, i) => (
              <li key={i} className="flex items-center gap-3 px-5 py-4">
                <FileText className="w-5 h-5 text-blue-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{s.filename}</p>
                  <p className="text-xs text-gray-400">{s.itemCount} itens importados · {s.fileType}</p>
                </div>
                <span className="flex items-center gap-1 text-xs text-amber-600 font-medium">
                  <Clock className="w-3.5 h-3.5" /> Pendente
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
