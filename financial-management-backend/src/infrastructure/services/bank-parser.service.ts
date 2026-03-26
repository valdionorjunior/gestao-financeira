import { Injectable } from '@nestjs/common';
import { BankStatementItem } from '../../domain/entities/bank-statement.entity';

export interface ParsedEntry {
  externalId?: string;
  type: 'DEBIT' | 'CREDIT';
  amount: number;
  description: string;
  date: Date;
}

@Injectable()
export class OFXParserService {
  parse(content: string): { entries: ParsedEntry[]; periodStart?: Date; periodEnd?: Date } {
    const entries: ParsedEntry[] = [];
    let periodStart: Date | undefined;
    let periodEnd: Date | undefined;

    // Extract period (OFX DTSTART / DTEND)
    const dtStartMatch = content.match(/<DTSTART>(\d{8})/);
    const dtEndMatch   = content.match(/<DTEND>(\d{8})/);
    if (dtStartMatch) periodStart = this.parseOFXDate(dtStartMatch[1]);
    if (dtEndMatch)   periodEnd   = this.parseOFXDate(dtEndMatch[1]);

    // Extract STMTTRN blocks
    const stmtRegex = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/g;
    let match: RegExpExecArray | null;

    while ((match = stmtRegex.exec(content)) !== null) {
      const block = match[1];
      const trntype  = (block.match(/<TRNTYPE>(\w+)/) ?? [])[1] ?? '';
      const dtposted = (block.match(/<DTPOSTED>(\d{8})/) ?? [])[1];
      const trnamt   = (block.match(/<TRNAMT>([+-]?\d+\.?\d*)/) ?? [])[1];
      const fitid    = (block.match(/<FITID>([^\r\n<]+)/) ?? [])[1];
      const memo     = (block.match(/<MEMO>([^\r\n<]+)/) ?? [])[1]
                    ?? (block.match(/<NAME>([^\r\n<]+)/) ?? [])[1]
                    ?? 'Sem descrição';

      if (!dtposted || !trnamt) continue;

      const amount = Math.abs(parseFloat(trnamt));
      const type   = parseFloat(trnamt) >= 0 ? 'CREDIT' : 'DEBIT';

      entries.push({ externalId: fitid?.trim(), type, amount, description: memo.trim(), date: this.parseOFXDate(dtposted) });
    }

    return { entries, periodStart, periodEnd };
  }

  private parseOFXDate(s: string): Date {
    const y = parseInt(s.substring(0, 4));
    const m = parseInt(s.substring(4, 6)) - 1;
    const d = parseInt(s.substring(6, 8));
    return new Date(y, m, d);
  }
}

@Injectable()
export class CSVParserService {
  /** Expected columns: date,description,amount,type (DEBIT|CREDIT) */
  async parse(content: string): Promise<ParsedEntry[]> {
    const { parse } = await import('csv-parse/sync');
    const records: any[] = parse(content, { columns: true, trim: true, skip_empty_lines: true });

    return records.map((row, i) => {
      const dateStr = row['data'] ?? row['date'] ?? row['DATA'];
      const desc    = row['descricao'] ?? row['description'] ?? row['DESCRICAO'] ?? `Linha ${i + 1}`;
      const amt     = parseFloat((row['valor'] ?? row['amount'] ?? row['VALOR'] ?? '0').replace(',', '.'));
      const rawType = (row['tipo'] ?? row['type'] ?? row['TIPO'] ?? '').toString().toUpperCase();
      const type    = rawType === 'CREDITO' || rawType === 'CREDIT' || amt > 0 ? 'CREDIT' : 'DEBIT';

      return {
        type,
        amount:      Math.abs(amt),
        description: desc,
        date:        new Date(dateStr),
      } as ParsedEntry;
    });
  }
}
